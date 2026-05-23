import { describe, it, expect } from 'vitest'
import { computeOverlapRegion, boxesOverlap } from '../sharedKernelGeometry'

describe('computeOverlapRegion', () => {
  it('returns the intersection rectangle when boxes partially overlap', () => {
    const a = { x: 0, y: 0, width: 100, height: 100 }
    const b = { x: 50, y: 50, width: 100, height: 100 }
    expect(computeOverlapRegion(a, b)).toEqual({ x: 50, y: 50, width: 50, height: 50 })
  })

  it('returns the inner box when one box fully contains the other', () => {
    const outer = { x: 0, y: 0, width: 200, height: 200 }
    const inner = { x: 50, y: 50, width: 50, height: 50 }
    expect(computeOverlapRegion(outer, inner)).toEqual({ x: 50, y: 50, width: 50, height: 50 })
  })

  it('returns null when boxes only touch at an edge', () => {
    const a = { x: 0, y: 0, width: 100, height: 100 }
    const b = { x: 100, y: 0, width: 100, height: 100 }
    expect(computeOverlapRegion(a, b)).toBeNull()
  })

  it('returns null when boxes do not overlap at all', () => {
    const a = { x: 0, y: 0, width: 50, height: 50 }
    const b = { x: 200, y: 200, width: 50, height: 50 }
    expect(computeOverlapRegion(a, b)).toBeNull()
  })

  it('is commutative: swapping arguments yields the same region', () => {
    const a = { x: 10, y: 20, width: 80, height: 60 }
    const b = { x: 50, y: 40, width: 80, height: 60 }
    expect(computeOverlapRegion(a, b)).toEqual(computeOverlapRegion(b, a))
  })
})

describe('boxesOverlap', () => {
  it('returns true for partial overlap', () => {
    expect(
      boxesOverlap(
        { x: 0, y: 0, width: 100, height: 100 },
        { x: 50, y: 50, width: 100, height: 100 }
      )
    ).toBe(true)
  })

  it('returns false for edge-touching', () => {
    expect(
      boxesOverlap(
        { x: 0, y: 0, width: 100, height: 100 },
        { x: 100, y: 0, width: 100, height: 100 }
      )
    ).toBe(false)
  })

  it('returns false for disjoint boxes', () => {
    expect(
      boxesOverlap({ x: 0, y: 0, width: 50, height: 50 }, { x: 200, y: 200, width: 50, height: 50 })
    ).toBe(false)
  })
})
