#!/usr/bin/env bash
# Local merge gate for ContextFlow.
#
# Runs the same checks as .github/workflows/deploy.yml, with the collab worker
# running so the worker integration test runs instead of skipping itself.
#
# Usage:
#   scripts/pr-gate.sh          gate the current checkout
#   scripts/pr-gate.sh <pr>     gate pull request <pr> as it would land: merged
#                               onto the latest main in a temporary worktree.
#                               Your checkout and branch are left untouched.
#
# Gating a pull request runs its code on your machine. Read the diff first.
#
# Environment:
#   PR_GATE_REMOTE   remote that hosts main and the pull request (default: origin)
#
# Exit codes: 0 = every gate passed, 1 = a gate did not pass, 2 = usage or setup.

set -uo pipefail

REMOTE="${PR_GATE_REMOTE:-origin}"
WORKER_PORT=8787
WORKER_START_TIMEOUT_SECONDS=60
WORKER_STOP_GRACE_SECONDS=2
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCRATCH_DIR=""
WORKTREE=""
WORKER_PID=""
TARGET_LABEL="current checkout"

log()  { printf '\033[1;34m[pr-gate]\033[0m %s\n' "$*"; }
ok()   { printf '\033[1;32m[pr-gate]\033[0m %s\n' "$*"; }
fail() { printf '\033[1;31m[pr-gate]\033[0m %s\n' "$*" >&2; }

usage() {
  sed -n '2,18p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
}

port_listeners() {
  lsof -Pi ":${WORKER_PORT}" -sTCP:LISTEN -t 2>/dev/null || true
}

process_tree() {
  local pid=$1
  local child
  for child in $(pgrep -P "$pid" 2>/dev/null); do
    process_tree "$child"
  done
  echo "$pid"
}

# npx, wrangler, and workerd are separate processes, and stopping only the
# port listener leaves the wrappers running.
stop_worker() {
  [[ -n "$WORKER_PID" ]] || return 0
  local pids
  pids=$(process_tree "$WORKER_PID")
  # shellcheck disable=SC2086
  kill $pids 2>/dev/null || true
  sleep "$WORKER_STOP_GRACE_SECONDS"
  # shellcheck disable=SC2086
  kill -9 $pids 2>/dev/null || true
  WORKER_PID=""
}

cleanup() {
  stop_worker
  if [[ -n "$WORKTREE" ]]; then
    git -C "$PROJECT_ROOT" worktree remove --force "$WORKTREE" 2>/dev/null || true
  fi
  [[ -z "$SCRATCH_DIR" ]] || rm -rf "$SCRATCH_DIR"
}

merge_pull_request_onto_main() {
  local pr=$1
  local pr_sha
  log "fetching ${REMOTE}/main and pull request ${pr}"
  git -C "$PROJECT_ROOT" fetch --quiet "$REMOTE" main || return 2
  git -C "$PROJECT_ROOT" fetch --quiet "$REMOTE" "pull/${pr}/head" || return 2
  pr_sha=$(git -C "$PROJECT_ROOT" rev-parse FETCH_HEAD)

  WORKTREE="${SCRATCH_DIR}/worktree"
  git -C "$PROJECT_ROOT" worktree add --quiet --detach "$WORKTREE" "${REMOTE}/main" || return 2
  if ! git -C "$WORKTREE" -c user.name=pr-gate -c user.email=pr-gate@localhost \
    merge --quiet --no-ff --no-edit "$pr_sha"; then
    fail "pull request ${pr} does not merge cleanly onto ${REMOTE}/main"
    return 1
  fi
  TARGET_LABEL="pull request ${pr} (${pr_sha:0:8}) merged onto ${REMOTE}/main"
}

install_dependencies() {
  local target=$1
  [[ "$target" != "$PROJECT_ROOT" ]] || return 0
  if [[ -d "${PROJECT_ROOT}/node_modules" ]] &&
    cmp -s "${PROJECT_ROOT}/package-lock.json" "${target}/package-lock.json"; then
    log "dependencies unchanged, reusing node_modules from the main checkout"
    ln -s "${PROJECT_ROOT}/node_modules" "${target}/node_modules"
    return 0
  fi
  log "dependencies differ from the main checkout, running npm ci"
  (cd "$target" && npm ci)
}

worker_is_healthy() {
  curl -s -f -o /dev/null --max-time 2 "http://localhost:${WORKER_PORT}/health"
}

start_worker() {
  local worker_log="${SCRATCH_DIR}/wrangler.log"
  local elapsed=0
  if [[ -n "$(port_listeners)" ]]; then
    fail "port ${WORKER_PORT} is in use. Stop that process so the gate can run the worker from the code under test."
    return 2
  fi
  log "starting collab worker on ${WORKER_PORT}"
  nohup npx wrangler dev --port "$WORKER_PORT" >"$worker_log" 2>&1 </dev/null &
  WORKER_PID=$!
  until worker_is_healthy; do
    if ((elapsed >= WORKER_START_TIMEOUT_SECONDS)); then
      fail "collab worker did not answer /health within ${WORKER_START_TIMEOUT_SECONDS}s"
      tail -20 "$worker_log" >&2
      return 2
    fi
    sleep 1
    elapsed=$((elapsed + 1))
  done
}

run_gate() {
  local name=$1
  shift
  log "gate: ${name}"
  if ! "$@"; then
    fail "gate did not pass: ${name}"
    return 1
  fi
}

run_all_gates() {
  run_gate "type check" npm run typecheck &&
    run_gate "lint" npm run lint &&
    run_gate "format check" npm run format:check &&
    run_gate "release docs check" npm run check:release &&
    run_gate "unit and worker integration tests with coverage" npm run test:coverage &&
    run_gate "build" npm run build &&
    run_gate "install Chromium for contrast check" npx playwright install chromium &&
    run_gate "WCAG AA contrast check" npm run check:contrast
}

main() {
  local pr="${1:-}"
  local target="$PROJECT_ROOT"
  if [[ "$pr" == "-h" || "$pr" == "--help" ]]; then
    usage
    return 0
  fi
  if [[ -n "$pr" && ! "$pr" =~ ^[0-9]+$ ]]; then
    usage >&2
    return 2
  fi

  SCRATCH_DIR=$(mktemp -d "${TMPDIR:-/tmp}/contextflow-pr-gate.XXXXXX") || return 2
  trap cleanup EXIT INT TERM

  if [[ -n "$pr" ]]; then
    merge_pull_request_onto_main "$pr" || return $?
    target="$WORKTREE"
  fi
  install_dependencies "$target" || return 2
  cd "$target" || return 2
  start_worker || return $?
  run_all_gates || return $?
  ok "every gate passed for ${TARGET_LABEL}"
}

main "$@"
exit $?
