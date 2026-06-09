// The canvas working area in flow coordinates. Contexts live within this rect;
// the CanvasBoundary outlines it (offset by topInset for views that reserve a
// problem-space strip at the top).
const CANVAS_WIDTH_UNITS = 2000
const CANVAS_HEIGHT_UNITS = 1000

export function isPointInCanvasBounds(point: { x: number; y: number }, topInset = 0): boolean {
  return (
    point.x >= 0 &&
    point.x <= CANVAS_WIDTH_UNITS &&
    point.y >= topInset &&
    point.y <= CANVAS_HEIGHT_UNITS
  )
}
