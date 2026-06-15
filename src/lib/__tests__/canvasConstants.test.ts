import { describe, it, expect } from 'vitest'
import { RELATIONSHIP_MARKER_SIZE, CANVAS_Z, contextNodeZIndex } from '../canvasConstants'

describe('RELATIONSHIP_MARKER_SIZE', () => {
  it('renders relationship arrow markers at size 8 for workshop readability (GH #22)', () => {
    expect(RELATIONSHIP_MARKER_SIZE).toBe(8)
  })
})

describe('contextNodeZIndex (GH #37 follow-up: arrows must win pointer over connection lines)', () => {
  it('lifts a hovered context above the connection-line layers', () => {
    expect(contextNodeZIndex(true)).toBeGreaterThan(CANVAS_Z.userNeedConnection)
    expect(contextNodeZIndex(true)).toBeGreaterThan(CANVAS_Z.needContextConnection)
  })

  it('leaves an unhovered context at the base context layer', () => {
    expect(contextNodeZIndex(false)).toBe(CANVAS_Z.context)
  })
})
