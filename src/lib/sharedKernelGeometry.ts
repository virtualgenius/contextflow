export interface Box {
  x: number
  y: number
  width: number
  height: number
}

export interface OverlapRegion {
  x: number
  y: number
  width: number
  height: number
}

/**
 * Compute the rectangular intersection of two axis-aligned bounding boxes.
 * Returns null when the boxes do not overlap (including edge-touching, where
 * the intersection would be zero-area).
 */
export function computeOverlapRegion(a: Box, b: Box): OverlapRegion | null {
  const left = Math.max(a.x, b.x)
  const right = Math.min(a.x + a.width, b.x + b.width)
  const top = Math.max(a.y, b.y)
  const bottom = Math.min(a.y + a.height, b.y + b.height)

  if (right <= left || bottom <= top) return null

  return {
    x: left,
    y: top,
    width: right - left,
    height: bottom - top,
  }
}

export function boxesOverlap(a: Box, b: Box): boolean {
  return computeOverlapRegion(a, b) !== null
}
