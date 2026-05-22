#!/usr/bin/env bash
# Deterministic local dev startup for ContextFlow.
#
# Behavior:
#   - Kills any vite or wrangler instance already bound to our ports.
#   - Starts wrangler dev (collab worker) on port 8787.
#   - Starts vite on port 5173 (strict), with VITE_COLLAB_HOST=localhost:8787.
#   - Verifies both are listening and the app actually compiles before returning.
#   - Tails both logs to stdout so the foreground session shows live output.
#
# Logs are written to /tmp/contextflow-dev/ for inspection after the script exits.
#
# Exit codes: 0 = both up and verified, 1 = something failed to start.

set -uo pipefail

VITE_PORT=5173
WRANGLER_PORT=8787
COLLAB_HOST="localhost:${WRANGLER_PORT}"
LOG_DIR=/tmp/contextflow-dev
WRANGLER_LOG="${LOG_DIR}/wrangler.log"
VITE_LOG="${LOG_DIR}/vite.log"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

mkdir -p "$LOG_DIR"
cd "$PROJECT_ROOT"

log()  { printf '\033[1;34m[dev-local]\033[0m %s\n' "$*"; }
ok()   { printf '\033[1;32m[dev-local]\033[0m %s\n' "$*"; }
fail() { printf '\033[1;31m[dev-local]\033[0m %s\n' "$*" >&2; }

kill_on_port() {
  local port=$1
  local pids
  pids=$(lsof -Pi ":${port}" -sTCP:LISTEN -t 2>/dev/null || true)
  if [[ -n "$pids" ]]; then
    log "killing stale process(es) on ${port}: ${pids}"
    # shellcheck disable=SC2086
    kill $pids 2>/dev/null || true
    sleep 1
    pids=$(lsof -Pi ":${port}" -sTCP:LISTEN -t 2>/dev/null || true)
    if [[ -n "$pids" ]]; then
      log "force-killing on ${port}: ${pids}"
      # shellcheck disable=SC2086
      kill -9 $pids 2>/dev/null || true
      sleep 1
    fi
  fi
}

wait_for_port() {
  local port=$1
  local label=$2
  local timeout=$3
  local elapsed=0
  while (( elapsed < timeout )); do
    if lsof -Pi ":${port}" -sTCP:LISTEN -t >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
    elapsed=$((elapsed + 1))
  done
  fail "${label} did not start listening on ${port} within ${timeout}s"
  return 1
}

verify_app_compiles() {
  local path=$1
  local code
  code=$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:${VITE_PORT}${path}")
  if [[ "$code" != "200" ]]; then
    fail "vite returned HTTP ${code} for ${path} — likely a TS compile error"
    fail "  tail of ${VITE_LOG}:"
    tail -20 "$VITE_LOG" >&2
    return 1
  fi
}

verify_worker_ws() {
  local code
  code=$(curl -s -o /dev/null -w '%{http_code}' \
    --max-time 4 \
    -H 'Upgrade: websocket' \
    -H 'Connection: Upgrade' \
    -H 'Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==' \
    -H 'Sec-WebSocket-Version: 13' \
    "http://localhost:${WRANGLER_PORT}/parties/yjs-room/dev-local-probe")
  if [[ "$code" != "101" ]]; then
    fail "worker did not accept WS upgrade on /parties/yjs-room (got HTTP ${code})"
    fail "  tail of ${WRANGLER_LOG}:"
    tail -20 "$WRANGLER_LOG" >&2
    return 1
  fi
}

cleanup() {
  log "stopping vite and wrangler"
  kill_on_port "$VITE_PORT"
  kill_on_port "$WRANGLER_PORT"
}

# === main ===

log "project root: ${PROJECT_ROOT}"
log "logs: ${LOG_DIR}"

# Stop anything already on our ports so we don't fight stale instances.
kill_on_port "$VITE_PORT"
kill_on_port "$WRANGLER_PORT"

trap cleanup EXIT INT TERM

# Start wrangler first — vite needs it reachable on first connect.
log "starting wrangler dev on ${WRANGLER_PORT}"
: > "$WRANGLER_LOG"
nohup npx wrangler dev --port "$WRANGLER_PORT" \
  >> "$WRANGLER_LOG" 2>&1 < /dev/null &
WRANGLER_PID=$!

if ! wait_for_port "$WRANGLER_PORT" wrangler 30; then
  fail "wrangler failed to start — see ${WRANGLER_LOG}"
  exit 1
fi
ok  "wrangler listening on ${WRANGLER_PORT} (pid ${WRANGLER_PID})"

if ! verify_worker_ws; then
  exit 1
fi
ok  "worker accepts WS upgrade on /parties/yjs-room"

# Start vite with the env var baked in so the app reaches the local worker.
log "starting vite on ${VITE_PORT} with VITE_COLLAB_HOST=${COLLAB_HOST}"
: > "$VITE_LOG"
VITE_COLLAB_HOST="$COLLAB_HOST" nohup ./node_modules/.bin/vite \
  --port "$VITE_PORT" --strictPort \
  >> "$VITE_LOG" 2>&1 < /dev/null &
VITE_PID=$!

if ! wait_for_port "$VITE_PORT" vite 20; then
  fail "vite failed to start — see ${VITE_LOG}"
  exit 1
fi
ok  "vite listening on ${VITE_PORT} (pid ${VITE_PID})"

# Compile-check the critical modules so a TS error surfaces here, not as a blank page.
verify_app_compiles "/" || exit 1
verify_app_compiles "/src/main.tsx" || exit 1
verify_app_compiles "/src/App.tsx" || exit 1

ok  "app modules compile cleanly"
ok  "ready: http://localhost:${VITE_PORT}/"
ok  "(hard-refresh the browser if it was already open before this run)"

# Stream logs to foreground so the dev sees live activity. Ctrl-C stops both.
log "tailing logs — press Ctrl-C to stop both servers"
tail -F -n 0 "$VITE_LOG" "$WRANGLER_LOG"
