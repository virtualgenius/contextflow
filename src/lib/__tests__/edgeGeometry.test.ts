import { describe, it, expect } from 'vitest'
import { Position } from 'reactflow'
import {
  getBoxEdgePoint,
  getNodeIntersection,
  getEdgePosition,
  getEdgeParams,
} from '../edgeGeometry'

describe('getBoxEdgePoint', () => {
  const center = { x: 100, y: 100 }
  const width = 200
  const height = 100

  it('returns box center when toward point equals center (zero distance)', () => {
    const result = getBoxEdgePoint(center, width, height, { x: 100, y: 100 })
    expect(result).toEqual(center)
  })

  it('returns right edge point when toward point is directly right', () => {
    const result = getBoxEdgePoint(center, width, height, { x: 300, y: 100 })
    expect(result.x).toBe(200) // center.x + halfW
    expect(result.y).toBe(100) // same y
  })

  it('returns left edge point when toward point is directly left', () => {
    const result = getBoxEdgePoint(center, width, height, { x: -100, y: 100 })
    expect(result.x).toBe(0) // center.x - halfW
    expect(result.y).toBe(100) // same y
  })

  it('returns bottom edge point when toward point is directly below', () => {
    const result = getBoxEdgePoint(center, width, height, { x: 100, y: 300 })
    expect(result.x).toBe(100) // same x
    expect(result.y).toBe(150) // center.y + halfH
  })

  it('returns top edge point when toward point is directly above', () => {
    const result = getBoxEdgePoint(center, width, height, { x: 100, y: -100 })
    expect(result.x).toBe(100) // same x
    expect(result.y).toBe(50) // center.y - halfH
  })

  it('returns correct point for diagonal toward point (upper-right)', () => {
    const result = getBoxEdgePoint(center, width, height, { x: 200, y: 50 })
    // Should hit the right edge since box is wider than tall
    expect(result.x).toBe(200) // center.x + halfW
    expect(result.y).toBeLessThan(100) // above center
  })

  it('returns correct point for steep angle (hits top/bottom edge)', () => {
    // Narrow box with steep vertical angle
    const result = getBoxEdgePoint(center, 50, 200, { x: 110, y: 300 })
    // Should hit bottom edge since box is taller than wide
    expect(result.y).toBe(200) // center.y + halfH
  })
})

describe('getNodeIntersection', () => {
  it('returns intersection point for two side-by-side nodes', () => {
    const source = { position: { x: 0, y: 0 }, width: 100, height: 50 }
    const target = { position: { x: 200, y: 0 }, width: 100, height: 50 }

    const result = getNodeIntersection(source, target)
    // Point should be on or near the perimeter of the source node
    expect(result.x).toBeGreaterThanOrEqual(0)
    expect(result.x).toBeLessThanOrEqual(200)
    expect(result.y).toBeGreaterThanOrEqual(0)
    expect(result.y).toBeLessThanOrEqual(50)
  })

  it('returns intersection point for vertically stacked nodes', () => {
    const source = { position: { x: 0, y: 0 }, width: 100, height: 50 }
    const target = { position: { x: 0, y: 200 }, width: 100, height: 50 }

    const result = getNodeIntersection(source, target)
    // Point should be on or near the perimeter of the source node
    expect(result.x).toBeGreaterThanOrEqual(0)
    expect(result.x).toBeLessThanOrEqual(100)
    expect(result.y).toBeGreaterThanOrEqual(0)
    expect(result.y).toBeLessThanOrEqual(100)
  })

  it('handles nodes with missing width/height (defaults to 0)', () => {
    const source = { position: { x: 0, y: 0 } }
    const target = { position: { x: 200, y: 200 } }

    const result = getNodeIntersection(source, target)
    expect(typeof result.x).toBe('number')
    expect(typeof result.y).toBe('number')
  })
})

describe('getEdgePosition', () => {
  const node = { position: { x: 0, y: 0 }, width: 100, height: 50 }

  it('returns Position.Left when point is on left edge', () => {
    const result = getEdgePosition(node, { x: 0, y: 25 })
    expect(result).toBe(Position.Left)
  })

  it('returns Position.Right when point is on right edge', () => {
    const result = getEdgePosition(node, { x: 100, y: 25 })
    expect(result).toBe(Position.Right)
  })

  it('returns Position.Top when point is on top edge', () => {
    const result = getEdgePosition(node, { x: 50, y: 0 })
    expect(result).toBe(Position.Top)
  })

  it('returns Position.Bottom when point is on bottom edge', () => {
    const result = getEdgePosition(node, { x: 50, y: 50 })
    expect(result).toBe(Position.Bottom)
  })

  it('returns closest edge for point near top-right corner', () => {
    // Point at (99, 1) - closer to right edge (dist 1) than top (dist 1)
    // Equal distances: left wins first check
    const result = getEdgePosition(node, { x: 99, y: 1 })
    // Right edge dist = 1, Top dist = 1, Left dist = 99, Bottom dist = 49
    expect(result).toBe(Position.Right) // Right checked before Top
  })

  it('handles node with undefined width/height', () => {
    const nodeNoSize = { position: { x: 0, y: 0 } }
    const result = getEdgePosition(nodeNoSize, { x: 0, y: 0 })
    expect(result).toBe(Position.Left) // 0 distance to left
  })
})

describe('getEdgeParams', () => {
  it('returns correct params for horizontally separated nodes', () => {
    const source = { position: { x: 0, y: 0 }, width: 100, height: 50 }
    const target = { position: { x: 300, y: 0 }, width: 100, height: 50 }

    const result = getEdgeParams(source, target)

    // Should produce valid edge coordinates and positions
    expect(typeof result.sx).toBe('number')
    expect(typeof result.sy).toBe('number')
    expect(typeof result.tx).toBe('number')
    expect(typeof result.ty).toBe('number')
    expect([Position.Left, Position.Right, Position.Top, Position.Bottom]).toContain(result.sourcePos)
    expect([Position.Left, Position.Right, Position.Top, Position.Bottom]).toContain(result.targetPos)
    // Source x should be to the left of target x
    expect(result.sx).toBeLessThan(result.tx)
  })

  it('returns correct params for vertically separated nodes', () => {
    const source = { position: { x: 0, y: 0 }, width: 100, height: 50 }
    const target = { position: { x: 0, y: 200 }, width: 100, height: 50 }

    const result = getEdgeParams(source, target)

    expect(result.sourcePos).toBe(Position.Bottom)
    expect(result.targetPos).toBe(Position.Top)
    expect(result.sy).toBe(50) // bottom of source
    expect(result.ty).toBe(200) // top of target
  })

  it('returns correct params for diagonally placed nodes', () => {
    const source = { position: { x: 0, y: 0 }, width: 100, height: 50 }
    const target = { position: { x: 200, y: 200 }, width: 100, height: 50 }

    const result = getEdgeParams(source, target)

    expect(typeof result.sx).toBe('number')
    expect(typeof result.sy).toBe('number')
    expect(typeof result.tx).toBe('number')
    expect(typeof result.ty).toBe('number')
    expect([Position.Left, Position.Right, Position.Top, Position.Bottom]).toContain(result.sourcePos)
    expect([Position.Left, Position.Right, Position.Top, Position.Bottom]).toContain(result.targetPos)
  })
})
