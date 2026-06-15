import { describe, it, expect } from 'vitest'
import { CONCEPT_TOOLTIP_STUB_CLEARANCE } from '../ContextNode'
import { STUB_OFFSET, STUB_SIZE } from '../ContextNodeStubs'

describe('concept tooltip clearance over the top stub (GH #37)', () => {
  it('lifts the resting concept tooltip above the top stub so the upstream arrow stays visible', () => {
    // The top stub nub reaches STUB_OFFSET + STUB_SIZE / 2 above the card top edge.
    // The concept tooltip bottom sits CONCEPT_TOOLTIP_STUB_CLEARANCE above the same edge,
    // so it must exceed the stub's outer extent for the arrow to remain uncovered.
    expect(CONCEPT_TOOLTIP_STUB_CLEARANCE).toBeGreaterThan(STUB_OFFSET + STUB_SIZE / 2)
  })
})
