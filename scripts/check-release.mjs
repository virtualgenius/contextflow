#!/usr/bin/env node
// Release-readiness gate. Runs in pre-push and CI to keep release-facing docs
// from drifting out of sync with the code. Three deterministic checks:
//   1. package.json version is in sync with the top CHANGELOG entry
//   2. every analytics event fired in src/ is documented in the event catalog
//   3. every relative markdown link in tracked docs resolves to a real file
// Exit code 1 on any failure, with a grouped report. Quality/judgment parts of
// a release (UX prose, screenshots) are out of scope here by design.

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { join, dirname, resolve, extname } from 'node:path'
import { execSync } from 'node:child_process'

const ROOT = process.cwd()
const problems = []
const note = (check, msg) => problems.push({ check, msg })

// ---------------------------------------------------------------------------
// Check 1: version <-> CHANGELOG sync
// ---------------------------------------------------------------------------
function checkVersionChangelog() {
  const version = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).version
  const changelog = readFileSync(join(ROOT, 'CHANGELOG.md'), 'utf8')

  if (/^##\s*\[unreleased\]/im.test(changelog)) {
    note(
      'version',
      'CHANGELOG.md has an "Unreleased" section; the top entry must be the released version'
    )
  }

  const heading = changelog.match(/^##\s*\[(\d+\.\d+\.\d+)\]\s*-\s*(.+?)\s*$/m)
  if (!heading) {
    note('version', 'CHANGELOG.md has no "## [X.Y.Z] - YYYY-MM-DD" version heading')
    return
  }
  const [, clVersion, clDate] = heading
  if (clVersion !== version) {
    note(
      'version',
      `package.json version (${version}) does not match the top CHANGELOG entry (${clVersion})`
    )
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(clDate)) {
    note('version', `top CHANGELOG entry date "${clDate}" is not in YYYY-MM-DD form`)
  }
}

// ---------------------------------------------------------------------------
// Check 2: analytics events documented in the event catalog
// ---------------------------------------------------------------------------
// Events that intentionally never reach the catalog (test-only / smoke).
const ANALYTICS_IGNORE = new Set(['test_event'])
const ANALYTICS_CATALOG = 'docs/ANALYTICS_EVENTS.md'

// Markdown link checking is scoped to living docs; archived and superseded
// planning docs keep their historical links without gating a release.
const DOC_LINK_SKIP = [/^docs\/done\//, /^docs\/PLAN-.*\.md$/]

function walkSrc(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const st = statSync(full)
    if (st.isDirectory()) {
      walkSrc(full, out)
    } else if (['.ts', '.tsx'].includes(extname(entry)) && !/\.test\.tsx?$/.test(entry)) {
      out.push(full)
    }
  }
  return out
}

function checkAnalyticsDocumented() {
  const events = new Set()
  const eventRe = /track(?:Event|PropertyChange)\(\s*'([a-z_]+)'/g
  for (const file of walkSrc(join(ROOT, 'src'))) {
    const content = readFileSync(file, 'utf8')
    let m
    while ((m = eventRe.exec(content)) !== null) events.add(m[1])
  }

  const catalog = readFileSync(join(ROOT, ANALYTICS_CATALOG), 'utf8')
  const missing = []
  for (const name of [...events].sort()) {
    if (ANALYTICS_IGNORE.has(name)) continue
    // word-boundary match so e.g. repo_assigned does not match repo_assigned_to_context
    if (!new RegExp(`(?<![\\w])${name}(?![\\w])`).test(catalog)) missing.push(name)
  }
  for (const name of missing) {
    note('analytics', `event '${name}' is fired in src/ but not documented in ${ANALYTICS_CATALOG}`)
  }
}

// ---------------------------------------------------------------------------
// Check 3: relative markdown links resolve
// ---------------------------------------------------------------------------
function checkDocLinks() {
  const tracked = execSync('git ls-files "*.md"', { cwd: ROOT })
    .toString()
    .trim()
    .split('\n')
    .filter(Boolean)
  const linkRe = /\]\(([^)]+)\)/g
  for (const rel of tracked) {
    if (DOC_LINK_SKIP.some((re) => re.test(rel))) continue
    const content = readFileSync(join(ROOT, rel), 'utf8')
    const baseDir = dirname(join(ROOT, rel))
    let m
    while ((m = linkRe.exec(content)) !== null) {
      let target = m[1].trim()
      if (/^(https?:|mailto:|tel:|#)/i.test(target)) continue
      // strip anchor and query, drop surrounding angle brackets
      target = target.replace(/^<|>$/g, '').split('#')[0].split('?')[0].trim()
      if (!target) continue
      const resolved = target.startsWith('/') ? join(ROOT, target) : resolve(baseDir, target)
      if (!existsSync(resolved)) {
        note('doc-links', `${rel}: link target "${m[1].trim()}" does not exist`)
      }
    }
  }
}

// ---------------------------------------------------------------------------
checkVersionChangelog()
checkAnalyticsDocumented()
checkDocLinks()

if (problems.length === 0) {
  console.log('check:release - all release-doc invariants hold')
  process.exit(0)
}

const byCheck = problems.reduce((acc, p) => ((acc[p.check] ??= []).push(p.msg), acc), {})
console.error('check:release found problems:\n')
for (const [check, msgs] of Object.entries(byCheck)) {
  console.error(`  [${check}]`)
  for (const msg of msgs) console.error(`    - ${msg}`)
  console.error('')
}
process.exit(1)
