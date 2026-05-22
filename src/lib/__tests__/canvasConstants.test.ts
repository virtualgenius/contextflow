import { describe, it, expect } from 'vitest'
import { RELATIONSHIP_MARKER_SIZE } from '../canvasConstants'

describe('RELATIONSHIP_MARKER_SIZE', () => {
  it('renders relationship arrow markers at size 8 for workshop readability (GH #22)', () => {
    expect(RELATIONSHIP_MARKER_SIZE).toBe(8)
  })
})
