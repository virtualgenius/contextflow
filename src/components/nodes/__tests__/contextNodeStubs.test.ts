import { describe, it, expect } from 'vitest'
import { STUB_HIT_SIZE, STUB_SIZE } from '../ContextNodeStubs'

describe('context stub hit target (GH #37 follow-up)', () => {
  it('gives the stub a larger transparent hit area than the visible triangle', () => {
    expect(STUB_HIT_SIZE).toBeGreaterThan(STUB_SIZE)
  })
})
