import { describe, it, expect } from 'vitest'
import {
  computeSeparatedPositions,
  computeSeparationCanvasDeltas,
  type SeparationBox,
} from '../sharedKernelSeparation'
import type { BoundedContext } from '../../model/types'

function makeContext(
  id: string,
  xPercent: number,
  yPercent: number,
  bucket: 'tiny' | 'small' | 'medium' | 'large' | 'huge' = 'medium'
): BoundedContext {
  return {
    id,
    name: id,
    positions: {
      flow: { x: xPercent },
      strategic: { x: xPercent },
      distillation: { x: 50, y: 50 },
      shared: { y: yPercent },
    },
    evolutionStage: 'product/rental',
    codeSize: { bucket },
  } as BoundedContext
}

function box(x: number, y: number, width = 170, height = 100): SeparationBox {
  return { x, y, width, height }
}

describe('computeSeparationCanvasDeltas', () => {
  it('returns null when boxes do not overlap', () => {
    expect(computeSeparationCanvasDeltas(box(0, 0), box(500, 500), 20)).toBeNull()
  })

  it('separates along x axis when horizontal overlap is smaller', () => {
    const a = box(0, 0, 100, 100)
    const b = box(80, 10, 100, 100)
    // overlap region: width 20, height 90 → separate along x
    // total separation = 20 + 20 = 40, each moves 20
    // a center x = 50, b center x = 130 → a moves left (-20), b moves right (+20)
    const result = computeSeparationCanvasDeltas(a, b, 20)
    expect(result).toEqual({ a: { dx: -20, dy: 0 }, b: { dx: 20, dy: 0 } })
  })

  it('separates along y axis when vertical overlap is smaller', () => {
    const a = box(0, 0, 100, 100)
    const b = box(10, 80, 100, 100)
    // overlap region: width 90, height 20 → separate along y
    // total separation = 20 + 20 = 40, each moves 20
    // a center y = 50, b center y = 130 → a moves up (-20), b moves down (+20)
    const result = computeSeparationCanvasDeltas(a, b, 20)
    expect(result).toEqual({ a: { dx: 0, dy: -20 }, b: { dx: 0, dy: 20 } })
  })

  it('moves the higher-center box further (positive) and the lower one negative', () => {
    const a = box(80, 10, 100, 100)
    const b = box(0, 0, 100, 100)
    // a is to the right of b; b should move left, a should move right
    const result = computeSeparationCanvasDeltas(a, b, 20)
    expect(result).toEqual({ a: { dx: 20, dy: 0 }, b: { dx: -20, dy: 0 } })
  })

  it('uses the gap parameter to leave the requested space between edges', () => {
    const a = box(0, 0, 100, 100)
    const b = box(80, 10, 100, 100)
    // overlap width 20, gap 40 → total separation 60 → each moves 30
    const result = computeSeparationCanvasDeltas(a, b, 40)
    expect(result).toEqual({ a: { dx: -30, dy: 0 }, b: { dx: 30, dy: 0 } })
  })

  it('breaks ties (square overlap) by separating along x', () => {
    const a = box(0, 0, 100, 100)
    const b = box(80, 80, 100, 100)
    // overlap width 20, height 20 → tie → x axis
    const result = computeSeparationCanvasDeltas(a, b, 20)
    expect(result?.a.dy).toBe(0)
    expect(result?.b.dy).toBe(0)
    expect(result?.a.dx).toBeLessThan(0)
    expect(result?.b.dx).toBeGreaterThan(0)
  })

  it('handles full containment by separating along axis of smaller dimension', () => {
    const outer = box(0, 0, 200, 100)
    const inner = box(50, 25, 50, 50)
    // overlap = the inner box (50x50). overlap width 50 = height 50, tie → x
    const result = computeSeparationCanvasDeltas(outer, inner, 20)
    expect(result?.a.dy).toBe(0)
    expect(result?.b.dy).toBe(0)
  })
})

describe('computeSeparatedPositions', () => {
  it('returns null when contexts do not overlap in the active view', () => {
    const a = makeContext('a', 10, 20)
    const b = makeContext('b', 80, 80)
    expect(computeSeparatedPositions(a, b, 'flow')).toBeNull()
  })

  it('preserves strategic.x when separating in flow view', () => {
    const a = makeContext('a', 40, 40)
    const b = makeContext('b', 42, 42)
    const result = computeSeparatedPositions(a, b, 'flow', 20)
    expect(result).not.toBeNull()
    expect(result!.fromPositions.strategic.x).toBe(40)
    expect(result!.toPositions.strategic.x).toBe(42)
  })

  it('preserves flow.x when separating in strategic view', () => {
    const a = makeContext('a', 40, 40)
    const b = makeContext('b', 42, 42)
    const result = computeSeparatedPositions(a, b, 'strategic', 20)
    expect(result).not.toBeNull()
    expect(result!.fromPositions.flow.x).toBe(40)
    expect(result!.toPositions.flow.x).toBe(42)
  })

  it('changes the active view x or shared y so the contexts no longer overlap', () => {
    const a = makeContext('a', 40, 40)
    const b = makeContext('b', 42, 42)
    const result = computeSeparatedPositions(a, b, 'flow', 20)!
    const positionChanged =
      result.fromPositions.flow.x !== 40 ||
      result.toPositions.flow.x !== 42 ||
      result.fromPositions.shared.y !== 40 ||
      result.toPositions.shared.y !== 42
    expect(positionChanged).toBe(true)
  })

  it('preserves distillation positions across separation', () => {
    const a = makeContext('a', 40, 40)
    const b = makeContext('b', 42, 42)
    const result = computeSeparatedPositions(a, b, 'flow', 20)
    expect(result!.fromPositions.distillation).toEqual({ x: 50, y: 50 })
    expect(result!.toPositions.distillation).toEqual({ x: 50, y: 50 })
  })

  it('produces non-overlapping positions after separation', () => {
    const a = makeContext('a', 40, 40)
    const b = makeContext('b', 42, 42)
    const result = computeSeparatedPositions(a, b, 'flow', 20)!
    // medium bucket is 170 wide, 100 tall
    const ax = (result.fromPositions.flow.x / 100) * 2000
    const ay = (result.fromPositions.shared.y / 100) * 1000
    const bx = (result.toPositions.flow.x / 100) * 2000
    const by = (result.toPositions.shared.y / 100) * 1000
    const xOverlap = Math.min(ax + 170, bx + 170) - Math.max(ax, bx)
    const yOverlap = Math.min(ay + 100, by + 100) - Math.max(ay, by)
    expect(Math.min(xOverlap, yOverlap)).toBeLessThanOrEqual(0)
  })
})
