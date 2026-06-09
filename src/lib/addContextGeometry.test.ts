import { describe, it, expect } from 'vitest'
import {
  relationshipEndpointsForDirection,
  computeSpawnPoint,
  type FlowPoint,
} from './addContextGeometry'

describe('relationshipEndpointsForDirection', () => {
  const source = 'src'
  const created = 'new'

  it('up makes the new context upstream (new is toContextId, source is from) with no pattern', () => {
    expect(relationshipEndpointsForDirection('up', source, created)).toEqual({
      fromContextId: source,
      toContextId: created,
      pattern: undefined,
    })
  })

  it('down makes the new context downstream (new is fromContextId, source is to) with no pattern', () => {
    expect(relationshipEndpointsForDirection('down', source, created)).toEqual({
      fromContextId: created,
      toContextId: source,
      pattern: undefined,
    })
  })

  it('left stamps partnership', () => {
    expect(relationshipEndpointsForDirection('left', source, created)).toEqual({
      fromContextId: source,
      toContextId: created,
      pattern: 'partnership',
    })
  })

  it('right stamps shared-kernel', () => {
    expect(relationshipEndpointsForDirection('right', source, created)).toEqual({
      fromContextId: source,
      toContextId: created,
      pattern: 'shared-kernel',
    })
  })
})

describe('computeSpawnPoint', () => {
  const source: FlowPoint = { x: 50, y: 50 }

  it('places an up context above the source (smaller y)', () => {
    const p = computeSpawnPoint(source, [source], 'up')
    expect(p.x).toBeCloseTo(50)
    expect(p.y).toBeLessThan(50)
  })

  it('places a down context below the source (larger y)', () => {
    const p = computeSpawnPoint(source, [source], 'down')
    expect(p.x).toBeCloseTo(50)
    expect(p.y).toBeGreaterThan(50)
  })

  it('places a left context to the left of the source (smaller x)', () => {
    const p = computeSpawnPoint(source, [source], 'left')
    expect(p.x).toBeLessThan(50)
    expect(p.y).toBeCloseTo(50)
  })

  it('places a right (shared-kernel) context overlapping the source', () => {
    const p = computeSpawnPoint(source, [source], 'right')
    const NODE_WIDTH_PERCENT = 8.5
    expect(p.x).toBeGreaterThan(50)
    expect(Math.abs(p.x - 50)).toBeLessThan(NODE_WIDTH_PERCENT)
    expect(p.y).toBeCloseTo(50)
  })

  it('offsets further out when the target spot is occupied (up/down/left)', () => {
    const occupant: FlowPoint = { x: 50, y: 34 } // directly above source at the default up slot
    const withCollision = computeSpawnPoint(source, [source, occupant], 'up')
    const withoutCollision = computeSpawnPoint(source, [source], 'up')
    expect(withCollision.y).toBeLessThan(withoutCollision.y)
  })

  it('does NOT collision-offset the right/shared-kernel gesture (overlap is intended)', () => {
    const occupant: FlowPoint = { x: 55, y: 50 }
    const withOccupant = computeSpawnPoint(source, [source, occupant], 'right')
    const withoutOccupant = computeSpawnPoint(source, [source], 'right')
    expect(withOccupant).toEqual(withoutOccupant)
  })

  it('clamps results inside the canvas bounds', () => {
    const nearTop: FlowPoint = { x: 2, y: 2 }
    const p = computeSpawnPoint(nearTop, [nearTop], 'up')
    expect(p.x).toBeGreaterThanOrEqual(0)
    expect(p.y).toBeGreaterThanOrEqual(0)
  })
})
