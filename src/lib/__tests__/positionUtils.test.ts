import { describe, it, expect } from 'vitest'
import { getContextCanvasPosition, clampDragDelta } from '../positionUtils'

describe('getContextCanvasPosition', () => {
  const makePositions = (overrides?: {
    flowX?: number
    strategicX?: number
    sharedY?: number
    distillationX?: number
    distillationY?: number
  }) => ({
    flow: { x: overrides?.flowX ?? 50 },
    strategic: { x: overrides?.strategicX ?? 50 },
    shared: { y: overrides?.sharedY ?? 50 },
    distillation: { x: overrides?.distillationX ?? 50, y: overrides?.distillationY ?? 50 },
  })

  describe('distillation view', () => {
    it('maps distillation position to canvas coordinates with inverted Y', () => {
      const positions = makePositions({ distillationX: 0, distillationY: 0 })
      const result = getContextCanvasPosition(positions, 'distillation', null, [], () => ({
        x: 0,
        y: 0,
      }))
      expect(result.x).toBe(0) // (0/100) * 2000
      expect(result.y).toBe(1000) // (1 - 0/100) * 1000, inverted
    })

    it('maps center distillation position', () => {
      const positions = makePositions({ distillationX: 50, distillationY: 50 })
      const result = getContextCanvasPosition(positions, 'distillation', null, [], () => ({
        x: 50,
        y: 50,
      }))
      expect(result.x).toBe(1000) // (50/100) * 2000
      expect(result.y).toBe(500) // (1 - 50/100) * 1000
    })

    it('maps max distillation position', () => {
      const positions = makePositions({ distillationX: 100, distillationY: 100 })
      const result = getContextCanvasPosition(positions, 'distillation', null, [], () => ({
        x: 100,
        y: 100,
      }))
      expect(result.x).toBe(2000) // (100/100) * 2000
      expect(result.y).toBe(0) // (1 - 100/100) * 1000
    })
  })

  describe('flow view', () => {
    it('uses flow.x and shared.y for flow view', () => {
      const positions = makePositions({ flowX: 25, sharedY: 75 })
      const result = getContextCanvasPosition(positions, 'flow', null, [], () => ({ x: 0, y: 0 }))
      expect(result.x).toBe(500) // (25/100) * 2000
      expect(result.y).toBe(750) // (75/100) * 1000
    })

    it('maps 0,0 flow position to top-left', () => {
      const positions = makePositions({ flowX: 0, sharedY: 0 })
      const result = getContextCanvasPosition(positions, 'flow', null, [], () => ({ x: 0, y: 0 }))
      expect(result.x).toBe(0)
      expect(result.y).toBe(0)
    })
  })

  describe('strategic view', () => {
    it('uses strategic.x and shared.y for strategic view (non-temporal)', () => {
      const positions = makePositions({ strategicX: 80, sharedY: 20 })
      const result = getContextCanvasPosition(positions, 'strategic', null, [], () => ({
        x: 0,
        y: 0,
      }))
      expect(result.x).toBe(1600) // (80/100) * 2000
      expect(result.y).toBe(200) // (20/100) * 1000
    })

    it('uses interpolated position in temporal mode', () => {
      const positions = makePositions({ strategicX: 80, sharedY: 20 })
      const currentDate = '2026-01-15'
      const keyframes = [{ date: '2026-01-01', contextPositions: {} }]
      const mockInterpolate = () => ({ x: 60, y: 40 })

      const result = getContextCanvasPosition(
        positions,
        'strategic',
        currentDate,
        keyframes,
        mockInterpolate
      )
      expect(result.x).toBe(1200) // (60/100) * 2000
      expect(result.y).toBe(400) // (40/100) * 1000
    })

    it('uses base positions when temporal mode has no keyframes', () => {
      const positions = makePositions({ strategicX: 80, sharedY: 20 })
      const result = getContextCanvasPosition(positions, 'strategic', '2026-01-15', [], () => ({
        x: 0,
        y: 0,
      }))
      expect(result.x).toBe(1600) // base position
      expect(result.y).toBe(200)
    })

    it('uses base positions when currentDate is null', () => {
      const positions = makePositions({ strategicX: 80, sharedY: 20 })
      const keyframes = [{ date: '2026-01-01', contextPositions: {} }]
      const result = getContextCanvasPosition(positions, 'strategic', null, keyframes, () => ({
        x: 0,
        y: 0,
      }))
      expect(result.x).toBe(1600)
      expect(result.y).toBe(200)
    })
  })
})

describe('clampDragDelta', () => {
  const defaultBounds = { width: 2000, height: 1000, minY: 150 }

  it('returns original delta when no boundaries are hit', () => {
    const nodes = [{ position: { x: 500, y: 400 }, width: 170, height: 100 }]
    const result = clampDragDelta({ x: 10, y: 10 }, nodes, defaultBounds)
    expect(result).toEqual({ x: 10, y: 10 })
  })

  it('clamps leftward movement at left boundary', () => {
    const nodes = [{ position: { x: 5, y: 400 }, width: 170, height: 100 }]
    const result = clampDragDelta({ x: -50, y: 0 }, nodes, defaultBounds)
    expect(result.x).toBe(-5) // can only go 5px left
    expect(result.y).toBe(0)
  })

  it('clamps rightward movement at right boundary', () => {
    const nodes = [{ position: { x: 1825, y: 400 }, width: 170, height: 100 }]
    const result = clampDragDelta({ x: 50, y: 0 }, nodes, defaultBounds)
    expect(result.x).toBe(5) // 2000 - 170 - 1825 = 5
    expect(result.y).toBe(0)
  })

  it('clamps upward movement at top boundary (minY)', () => {
    const nodes = [{ position: { x: 500, y: 160 }, width: 170, height: 100 }]
    const result = clampDragDelta({ x: 0, y: -50 }, nodes, defaultBounds)
    expect(result.y).toBe(-10) // 160 - 150 = 10px available
  })

  it('clamps downward movement at bottom boundary', () => {
    const nodes = [{ position: { x: 500, y: 895 }, width: 170, height: 100 }]
    const result = clampDragDelta({ x: 0, y: 50 }, nodes, defaultBounds)
    expect(result.y).toBe(5) // 1000 - 100 - 895 = 5
  })

  it('clamps to the most constrained node when multiple nodes are selected', () => {
    const nodes = [
      { position: { x: 10, y: 400 }, width: 170, height: 100 },
      { position: { x: 1800, y: 400 }, width: 170, height: 100 },
    ]
    const result = clampDragDelta({ x: -50, y: 0 }, nodes, defaultBounds)
    expect(result.x).toBe(-10) // leftmost node constrains to 10px
  })

  it('handles empty node array', () => {
    const result = clampDragDelta({ x: 100, y: 100 }, [], defaultBounds)
    expect(result).toEqual({ x: 100, y: 100 })
  })
})
