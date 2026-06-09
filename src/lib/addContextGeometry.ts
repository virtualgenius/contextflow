import type { Relationship } from '../model/types'

export type SpawnDirection = 'up' | 'down' | 'left' | 'right'

// A position in percentage coordinates: x is the horizontal axis (flow.x /
// strategic.x), y is the shared vertical axis (shared.y). Both run 0..100.
export interface FlowPoint {
  x: number
  y: number
}

export interface RelationshipEndpoints {
  fromContextId: string
  toContextId: string
  pattern: Relationship['pattern'] | undefined
}

// A relationship always carries direction in from (downstream) / to (upstream);
// pattern is a separate, optional classification. Up/down express direction
// only and leave pattern undefined. Left/right ARE their pattern.
export function relationshipEndpointsForDirection(
  direction: SpawnDirection,
  sourceId: string,
  newContextId: string
): RelationshipEndpoints {
  switch (direction) {
    case 'up':
      return { fromContextId: sourceId, toContextId: newContextId, pattern: undefined }
    case 'down':
      return { fromContextId: newContextId, toContextId: sourceId, pattern: undefined }
    case 'left':
      return { fromContextId: sourceId, toContextId: newContextId, pattern: 'partnership' }
    case 'right':
      return { fromContextId: sourceId, toContextId: newContextId, pattern: 'shared-kernel' }
  }
}

const HORIZONTAL_OFFSET = 14
const VERTICAL_OFFSET = 16
const SHARED_KERNEL_OVERLAP_OFFSET = 5
const COLLISION_THRESHOLD = 7
const COLLISION_STEP = 6
const MAX_COLLISION_STEPS = 12
const BOUND_MIN = 2
const BOUND_MAX = 98

function clampCoord(value: number): number {
  return Math.max(BOUND_MIN, Math.min(BOUND_MAX, value))
}

function clampPoint(point: FlowPoint): FlowPoint {
  return { x: clampCoord(point.x), y: clampCoord(point.y) }
}

function baseVectorFor(direction: SpawnDirection): FlowPoint {
  switch (direction) {
    case 'up':
      return { x: 0, y: -VERTICAL_OFFSET }
    case 'down':
      return { x: 0, y: VERTICAL_OFFSET }
    case 'left':
      return { x: -HORIZONTAL_OFFSET, y: 0 }
    case 'right':
      return { x: SHARED_KERNEL_OVERLAP_OFFSET, y: 0 }
  }
}

function isOccupied(point: FlowPoint, occupied: FlowPoint[]): boolean {
  return occupied.some(
    (other) =>
      Math.abs(other.x - point.x) < COLLISION_THRESHOLD &&
      Math.abs(other.y - point.y) < COLLISION_THRESHOLD
  )
}

// Shared-kernel (right) intentionally overlaps the source, so it skips
// collision avoidance. The other directions push further out along the same
// axis until the slot is clear rather than silently overlapping.
export function computeSpawnPoint(
  source: FlowPoint,
  occupied: FlowPoint[],
  direction: SpawnDirection
): FlowPoint {
  const vector = baseVectorFor(direction)

  if (direction === 'right') {
    return clampPoint({ x: source.x + vector.x, y: source.y + vector.y })
  }

  const stepX = Math.sign(vector.x) * COLLISION_STEP
  const stepY = Math.sign(vector.y) * COLLISION_STEP

  let candidate: FlowPoint = { x: source.x + vector.x, y: source.y + vector.y }
  let steps = 0
  while (isOccupied(candidate, occupied) && steps < MAX_COLLISION_STEPS) {
    candidate = { x: candidate.x + stepX, y: candidate.y + stepY }
    steps++
  }

  return clampPoint(candidate)
}
