import { describe, it, expect } from 'vitest'
import { isPointInCanvasBounds } from '../canvasBounds'

describe('isPointInCanvasBounds', () => {
  it('accepts a point well inside the canvas', () => {
    expect(isPointInCanvasBounds({ x: 1000, y: 500 })).toBe(true)
  })

  it('rejects a point above the top edge', () => {
    expect(isPointInCanvasBounds({ x: 1000, y: -1 })).toBe(false)
  })

  it('rejects a point below the bottom edge', () => {
    expect(isPointInCanvasBounds({ x: 1000, y: 1001 })).toBe(false)
  })

  it('rejects points beyond the left and right edges', () => {
    expect(isPointInCanvasBounds({ x: -1, y: 500 })).toBe(false)
    expect(isPointInCanvasBounds({ x: 2001, y: 500 })).toBe(false)
  })

  it('accepts the boundary edges themselves', () => {
    expect(isPointInCanvasBounds({ x: 0, y: 0 })).toBe(true)
    expect(isPointInCanvasBounds({ x: 2000, y: 1000 })).toBe(true)
  })

  it('treats the reserved top strip as outside when a topInset is given', () => {
    expect(isPointInCanvasBounds({ x: 1000, y: 100 }, 150)).toBe(false)
    expect(isPointInCanvasBounds({ x: 1000, y: 150 }, 150)).toBe(true)
    expect(isPointInCanvasBounds({ x: 1000, y: 200 }, 150)).toBe(true)
  })
})
