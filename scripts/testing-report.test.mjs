import { describe, it, expect } from 'vitest'
import {
  parseLcov,
  parseTestNames,
  countTests,
  areaOf,
  categorize,
  isAcceptanceFile,
  summarizeAreas,
} from './testing-report.mjs'

const LCOV = `TN:
SF:src/model/store.ts
FNF:10
FNH:7
LF:100
LH:71
BRF:20
BRH:10
end_of_record
TN:
SF:src/lib/focus.ts
FNF:2
FNH:2
LF:30
LH:30
BRF:4
BRH:4
end_of_record
`

describe('parseLcov', () => {
  it('returns one record per source file with all six counters', () => {
    expect(parseLcov(LCOV)).toEqual([
      { path: 'src/model/store.ts', lf: 100, lh: 71, bf: 20, bh: 10, ff: 10, fh: 7 },
      { path: 'src/lib/focus.ts', lf: 30, lh: 30, bf: 4, bh: 4, ff: 2, fh: 2 },
    ])
  })

  it('treats a missing counter as zero', () => {
    expect(parseLcov('SF:a.ts\nLF:5\nLH:1\nend_of_record\n')).toEqual([
      { path: 'a.ts', lf: 5, lh: 1, bf: 0, bh: 0, ff: 0, fh: 0 },
    ])
  })
})

describe('parseTestNames', () => {
  const SOURCE = `import { describe, it } from 'vitest'
describe('Store', () => {
  describe('focus', () => {
    it('defaults to null', () => {})
    it.skip('is skipped', () => {})
  })
  test("uses double quotes", () => {})
})
`
  it('records the line, nested describe path, and name of every test', () => {
    expect(parseTestNames(SOURCE)).toEqual([
      { line: 4, context: 'focus', name: 'defaults to null' },
      { line: 5, context: 'focus', name: 'is skipped' },
      { line: 7, context: '', name: 'uses double quotes' },
    ])
  })

  it('omits the outermost describe from the context', () => {
    expect(parseTestNames(SOURCE)[0].context).toBe('focus')
  })
})

describe('countTests', () => {
  it('counts it and test calls including modifiers', () => {
    expect(countTests("it('a')\nit.each([1])('b')\ntest('c')\ndescribe('d')\n")).toBe(3)
  })
})

describe('areaOf', () => {
  it('strips the src prefix from the directory', () => {
    expect(areaOf('src/model/sync/contextSync.ts')).toBe('model/sync')
  })
  it('keeps non-src directories as they are', () => {
    expect(areaOf('workers/server.ts')).toBe('workers')
  })
})

describe('isAcceptanceFile', () => {
  it('accepts component, store, integration, and worker tests', () => {
    expect(isAcceptanceFile('src/components/__tests__/TopBar.test.tsx')).toBe(true)
    expect(isAcceptanceFile('src/model/__tests__/store.focus.test.ts')).toBe(true)
    expect(isAcceptanceFile('src/model/sync/__tests__/twoBrowserSync.integration.test.ts')).toBe(true)
    expect(isAcceptanceFile('src/model/sync/__tests__/storeCollabIntegration.test.ts')).toBe(true)
    expect(isAcceptanceFile('workers/__tests__/server.test.ts')).toBe(true)
  })
  it('rejects pure helper and sync mutation unit tests', () => {
    expect(isAcceptanceFile('src/lib/__tests__/focus.test.ts')).toBe(false)
    expect(isAcceptanceFile('src/model/sync/__tests__/contextMutations.test.ts')).toBe(false)
    expect(isAcceptanceFile('src/components/settings/SettingsIntegrations.tsx')).toBe(false)
  })
})

describe('categorize', () => {
  it('maps a test file to its feature category', () => {
    expect(categorize('src/components/__tests__/FocusBar.test.tsx')).toBe('Focus lens')
    expect(categorize('src/model/sync/__tests__/twoBrowserSync.integration.test.ts')).toBe('Real-time collaboration')
    expect(categorize('src/model/__tests__/store.groups.test.ts')).toBe('Groups')
  })
  it('falls back to Uncategorized', () => {
    expect(categorize('src/model/__tests__/something.test.ts')).toBe('Uncategorized')
  })
})

describe('summarizeAreas', () => {
  it('aggregates coverage counters per area and attaches tests by area', () => {
    const files = parseLcov(LCOV).map((f) => ({ ...f, area: areaOf(f.path) }))
    const areas = summarizeAreas(files, { model: 12, lib: 3 })
    expect(areas).toEqual([
      { area: 'model', files: 1, lf: 100, lh: 71, bf: 20, bh: 10, ff: 10, fh: 7, tests: 12 },
      { area: 'lib', files: 1, lf: 30, lh: 30, bf: 4, bh: 4, ff: 2, fh: 2, tests: 3 },
    ])
  })
})
