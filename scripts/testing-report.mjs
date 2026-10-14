#!/usr/bin/env node
// Builds docs/testing-data.js from coverage/lcov.info and the test files.
// The testing overview and acceptance catalog pages in docs/ read that
// file at load time, so the charts and the catalog refresh with every
// coverage run and nothing generated is committed. Runs as the last step
// of `npm run test:coverage` and in CI before the docs are published.

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { join, relative, dirname, basename } from 'node:path'
import { fileURLToPath } from 'node:url'

const LCOV_PATH = 'coverage/lcov.info'
const OUTPUT_PATH = 'docs/testing-data.js'
const GLOBAL_NAME = 'CONTEXTFLOW_TESTING_DATA'
const TEST_ROOTS = ['src', 'workers']
const SKIP_DIRS = new Set(['node_modules', '.stryker-tmp', 'coverage', 'dist', '__testFixtures__'])

export const CATEGORIES = [
  ['Real-time collaboration', ['twoBrowserSync', 'storeCollabIntegration', 'OfflineBlockingModal', 'ShareProjectDialog', 'collabStore.test', 'workers/__tests__']],
  ['Undo and redo', ['TopBar.undoRedo']],
  ['Relationships and DDD patterns', ['RelationshipEdge', 'RelationshipInspector', 'SharedKernelOverlay', 'SharedKernelConfirmDialog', 'store.relationships', 'perSideRelationshipConcept']],
  ['Creating and editing contexts', ['ContextNode.', 'ContextDraftNode', 'ContextInspector', 'ContextRepoCardScroll', 'InspectorPanel', 'InspectorHeader', 'PillGroup', 'store.contextNameEdit', 'store.hover', 'addRelatedContext', 'TopBar.contextMap']],
  ['Focus lens', ['FocusBar', 'store.focus']],
  ['Teams and repos panel', ['TeamSidebar', 'RepoSidebar', 'TeamInspector', 'RepoInspector']],
  ['Projects', ['ProjectListContent', 'ProjectListPage', 'store.persistence', 'store.clearActiveProject', 'loadExistingProject']],
  ['Views and value stream', ['store.flowStages', 'store.userNeeds', 'store.connections', 'store.contextMapPreservesData', 'store.viewModePersistence', 'viewModePersistence', 'store.viewFilterDefaults', 'FlowStageInspector', 'UserNeedInspector', 'UserNeedConnectionInspector', 'NeedContextConnectionInspector', 'stageBoundaries']],
  ['Temporal evolution', []],
  ['Groups', ['store.groups']],
  ['Shell: settings, help, analytics', ['SettingsHelp', 'SettingsPopover', 'SettingsViewOptions', 'HelpPopover', 'KeyboardShortcutsModal', 'CanvasWelcomeCard', 'GettingStartedGuideModal', 'store.analytics']],
  ['Canvas interaction', []],
]

export const EMPTY_CATEGORY_NOTES = {
  'Temporal evolution': 'No component or store behavior test exists for the timeline slider, keyframe editor, or keyframe manager. Only the interpolation helpers are unit tested.',
  'Canvas interaction': 'No test renders CanvasArea.tsx. Pan, zoom, fit-to-map, drag, multi-select, drag-to-connect, and the N and arrow-key shortcuts are unverified. Pure helpers in src/lib are unit tested.',
}

const LCOV_COUNTERS = { LF: 'lf', LH: 'lh', BRF: 'bf', BRH: 'bh', FNF: 'ff', FNH: 'fh' }
// Matches it('x'), test("x"), describe(`x`), it.skip('x'), and it.each(table)('x').
const TEST_CALL = /^(\s*)(describe|it|test)(?:\.(?:each|skip|only)(?:\([^)]*\))?)?\(\s*(['"`])(.+?)\3/
const TEST_FILE = /\.test\.(m?[jt]sx?)$/

export function parseLcov(text) {
  return text
    .split('end_of_record')
    .map(parseLcovRecord)
    .filter(Boolean)
}

function parseLcovRecord(record) {
  const source = record.match(/^SF:(.+)$/m)
  if (!source) return null
  const entry = { path: source[1].trim(), lf: 0, lh: 0, bf: 0, bh: 0, ff: 0, fh: 0 }
  for (const [lcovKey, field] of Object.entries(LCOV_COUNTERS)) {
    const match = record.match(new RegExp(`^${lcovKey}:(\\d+)$`, 'm'))
    if (match) entry[field] = Number(match[1])
  }
  return entry
}

export function parseTestNames(source) {
  const tests = []
  const describeStack = []
  source.split('\n').forEach((line, index) => {
    const match = TEST_CALL.exec(line)
    if (!match) return
    const indent = match[1].length
    while (describeStack.length && describeStack[describeStack.length - 1].indent >= indent) describeStack.pop()
    if (match[2] === 'describe') {
      describeStack.push({ indent, name: match[4] })
      return
    }
    tests.push({ line: index + 1, context: innerDescribePath(describeStack), name: match[4] })
  })
  return tests
}

function innerDescribePath(stack) {
  return stack.slice(1).map((d) => d.name).join(' › ')
}

export function countTests(source) {
  return parseTestNames(source).length
}

export function areaOf(path) {
  const dir = dirname(path)
  return dir.startsWith('src/') ? dir.slice(4) : dir
}

export function isAcceptanceFile(relPath) {
  if (!TEST_FILE.test(relPath)) return false
  const name = basename(relPath)
  const isComponent = relPath.startsWith('src/components') && name.endsWith('.test.tsx')
  const isStore = relPath.startsWith('src/model/__tests__')
  const isIntegration = /integration/i.test(name) || name === 'storeCollabIntegration.test.ts'
  const isWorker = relPath.startsWith('workers/__tests__')
  return isComponent || isStore || isIntegration || isWorker
}

export function categorize(relPath) {
  const hit = CATEGORIES.find(([, keys]) => keys.some((k) => relPath.includes(k)))
  return hit ? hit[0] : 'Uncategorized'
}

export function summarizeAreas(files, testsByArea) {
  const byArea = new Map()
  for (const f of files) {
    const a = byArea.get(f.area) || { area: f.area, files: 0, lf: 0, lh: 0, bf: 0, bh: 0, ff: 0, fh: 0, tests: 0 }
    a.files += 1
    for (const k of ['lf', 'lh', 'bf', 'bh', 'ff', 'fh']) a[k] += f[k]
    byArea.set(f.area, a)
  }
  return [...byArea.values()]
    .map((a) => ({ ...a, tests: testsByArea[a.area] || 0 }))
    .sort((x, y) => y.lf - x.lf)
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue
    const full = join(dir, name)
    if (statSync(full).isDirectory()) walk(full, out)
    else if (TEST_FILE.test(name)) out.push(full)
  }
  return out
}

function readTestFiles(root) {
  return TEST_ROOTS.flatMap((r) => walk(join(root, r))).map((full) => ({
    path: relative(root, full),
    source: readFileSync(full, 'utf8'),
  }))
}

function testsByAreaFrom(testFiles) {
  const counts = {}
  for (const t of testFiles) {
    const area = areaOf(t.path.replace('/__tests__', ''))
    counts[area] = (counts[area] || 0) + countTests(t.source)
  }
  return counts
}

function testsBySourceFile(testFiles) {
  const counts = {}
  for (const t of testFiles) {
    const stem = basename(t.path).replace(/\.(integration\.)?test\.m?[jt]sx?$/, '').split('.')[0]
    const key = `${dirname(t.path.replace('/__tests__', ''))}/${stem}`
    counts[key] = (counts[key] || 0) + countTests(t.source)
  }
  return counts
}

function buildAcceptance(testFiles) {
  const groups = CATEGORIES.map(([name]) => ({ name, note: EMPTY_CATEGORY_NOTES[name] || '', files: [] }))
  const uncategorized = { name: 'Uncategorized', note: '', files: [] }
  for (const t of testFiles.filter((f) => isAcceptanceFile(f.path)).sort((a, b) => a.path.localeCompare(b.path))) {
    const category = categorize(t.path)
    const group = groups.find((g) => g.name === category) || uncategorized
    group.files.push({ path: t.path, tests: parseTestNames(t.source) })
  }
  if (uncategorized.files.length) groups.push(uncategorized)
  return groups
}

export function buildReport({ lcovText, testFiles }) {
  const perFileTests = testsBySourceFile(testFiles)
  const files = parseLcov(lcovText).map((f) => ({
    ...f,
    name: basename(f.path),
    area: areaOf(f.path),
    tests: perFileTests[f.path.replace(/\.(ts|tsx)$/, '')] || 0,
  }))
  const totalTests = testFiles.reduce((n, t) => n + countTests(t.source), 0)
  return {
    generatedAt: new Date().toISOString(),
    totals: { tests: totalTests, testFiles: testFiles.length, sourceFiles: files.length },
    files,
    areas: summarizeAreas(files, testsByAreaFrom(testFiles)),
    acceptance: buildAcceptance(testFiles),
  }
}

function main() {
  const root = process.cwd()
  const lcovPath = join(root, LCOV_PATH)
  if (!existsSync(lcovPath)) {
    console.error(`testing-report: ${LCOV_PATH} not found. Run "npm run test:coverage" first.`)
    process.exit(1)
  }
  const report = buildReport({ lcovText: readFileSync(lcovPath, 'utf8'), testFiles: readTestFiles(root) })
  const banner = '// Generated by scripts/testing-report.mjs. Do not edit or commit.\n'
  writeFileSync(join(root, OUTPUT_PATH), `${banner}window.${GLOBAL_NAME} = ${JSON.stringify(report)};\n`)
  console.log(`testing-report: wrote ${OUTPUT_PATH} (${report.totals.tests} tests, ${report.totals.sourceFiles} source files, ${report.areas.length} areas)`)
}

const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]
if (isDirectRun) main()
