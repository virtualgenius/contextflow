/**
 * Architectural guard: prevent direct Zustand writes for synced project data.
 *
 * WHY THIS EXISTS:
 * All project entity CRUD must route through Yjs (via getCollabMutations())
 * so that changes propagate to collaborators and survive sync events. A store
 * mutation that writes `projects:` directly to Zustand will appear to work
 * locally, but gets silently overwritten when SyncManager's `observeDeep`
 * callback fires. We've fixed this class of bug twice already (contextflow-co0,
 * contextflow-8yw).
 *
 * HOW IT WORKS:
 * Reads store.ts as a string, finds all mutations that return `projects:` from
 * a set() call or useEditorStore.setState() call, and checks them against an
 * allowlist of project-lifecycle operations where direct writes are correct.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

/**
 * Project-lifecycle operations that legitimately reference `projects` directly
 * in store.ts. These create, destroy, or bootstrap collab sessions, so Yjs
 * routing does not apply. Any new addition here should be reviewed carefully.
 *
 * - duplicateProject: references result.projects from duplicateProjectAction
 * - renameProject: calls getCollabMutations().renameProject() AND references
 *   result.projects for autosave; dual-write is intentional
 * - reset: reinitializes entire app state with built-in projects
 * - setViewMode: redistributes distillation positions (calls getCollabMutations
 *   AND writes projects: for immediate local update; dual-write is intentional)
 * - setActiveProject: switches active project and reinitializes collab session
 * - createProject: creates new project and initializes collab session
 * - createFromTemplate: creates from template and initializes collab session
 * - importProject: imports external project and initializes collab session
 * - loadSharedProject: connects to a shared project room via network collab
 */
const ALLOWED_PROJECT_WRITERS = new Set([
  'duplicateProject',
  'renameProject',
  'reset',
  'setViewMode',
  'setActiveProject',
  'createProject',
  'createFromTemplate',
  'importProject',
  'loadSharedProject',
])

describe('Yjs bypass guard', () => {
  it('no store mutation writes projects: outside the allowlist', () => {
    const storePath = resolve(__dirname, '../../store.ts')
    const source = readFileSync(storePath, 'utf-8')

    const violations = findProjectWriters(source).filter(
      name => !ALLOWED_PROJECT_WRITERS.has(name)
    )

    if (violations.length > 0) {
      const list = violations.map(v => `  - ${v}`).join('\n')
      throw new Error(
        `Store action(s) write to \`projects:\` without routing through Yjs:\n${list}\n\n` +
        'All project entity mutations must go through getCollabMutations(). ' +
        'If this is a project-lifecycle operation (create/delete/import/reset), ' +
        'add it to ALLOWED_PROJECT_WRITERS in this test with a comment explaining why.'
      )
    }
  })

  it('all allowlisted actions actually exist in the store', () => {
    const storePath = resolve(__dirname, '../../store.ts')
    const source = readFileSync(storePath, 'utf-8')

    for (const name of ALLOWED_PROJECT_WRITERS) {
      const pattern = new RegExp(`\\b${name}\\b\\s*[:=(]`)
      expect(
        pattern.test(source),
        `Allowlisted action '${name}' not found in store.ts; remove it from ALLOWED_PROJECT_WRITERS`
      ).toBe(true)
    }
  })
})

/**
 * Find all store mutation names that write `projects:` to state.
 *
 * Detects two patterns:
 * 1. Synchronous: `actionName: (...) => set(... { projects: ... })`
 * 2. Async/direct: `useEditorStore.setState(... { projects: ... })` inside
 *    a named action block
 */
function findProjectWriters(source: string): string[] {
  const writers: string[] = []
  const lines = source.split('\n')

  let currentAction: string | null = null
  let braceDepth = 0
  let actionStartDepth = 0
  let actionHasProjectsWrite = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Detect action definitions:
    // `  actionName: (params) => set(` or `  actionName: async (params) => {`
    // or `  actionName: (params) => {`
    const actionMatch = line.match(/^\s{2}(\w+):\s*(?:async\s*)?\(/)
    if (actionMatch && braceDepth <= 1) {
      // Save previous action if it had a projects write
      if (currentAction && actionHasProjectsWrite) {
        writers.push(currentAction)
      }
      currentAction = actionMatch[1]
      actionStartDepth = braceDepth
      actionHasProjectsWrite = false
    }

    // Track brace depth
    for (const ch of line) {
      if (ch === '{') braceDepth++
      if (ch === '}') braceDepth--
    }

    // Check for `projects:` or `projects :` in the line (state writes)
    // But skip comments and string literals
    const stripped = stripCommentsAndStrings(line)
    if (stripped.match(/\bprojects\s*:/)) {
      actionHasProjectsWrite = true
    }

    // When we return to the action start depth, the action is done
    if (currentAction && braceDepth <= actionStartDepth && i > 0) {
      if (actionHasProjectsWrite) {
        writers.push(currentAction)
      }
      currentAction = null
      actionHasProjectsWrite = false
    }
  }

  // Handle last action
  if (currentAction && actionHasProjectsWrite) {
    writers.push(currentAction)
  }

  return [...new Set(writers)]
}

/**
 * Crude strip of single-line comments and string literals to avoid false
 * positives from comments like "// updates projects:" or strings containing
 * "projects:".
 */
function stripCommentsAndStrings(line: string): string {
  // Remove single-line comments
  let result = line.replace(/\/\/.*$/, '')
  // Remove string literals (single, double, backtick)
  result = result.replace(/'[^']*'/g, '""')
  result = result.replace(/"[^"]*"/g, '""')
  result = result.replace(/`[^`]*`/g, '""')
  return result
}
