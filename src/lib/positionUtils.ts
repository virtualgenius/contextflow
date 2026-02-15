type ViewMode = 'flow' | 'strategic' | 'distillation'

interface ContextPositions {
  flow: { x: number }
  strategic: { x: number }
  shared: { y: number }
  distillation: { x: number; y: number }
}

interface Keyframe {
  date: string
  contextPositions: Record<string, unknown>
}

type InterpolatePositionFn = (
  contextId: string,
  currentDate: string,
  keyframes: Keyframe[],
  basePosition: { x: number; y: number }
) => { x: number; y: number }

export function getContextCanvasPosition(
  positions: ContextPositions,
  viewMode: ViewMode,
  currentDate: string | null,
  keyframes: Keyframe[],
  interpolatePosition: InterpolatePositionFn,
  contextId: string = '',
): { x: number; y: number } {
  if (viewMode === 'distillation') {
    // Distillation view uses independent 2D space
    const x = (positions.distillation.x / 100) * 2000
    const y = (1 - positions.distillation.y / 100) * 1000 // Invert Y for distillation (0 = bottom, 100 = top)
    return { x, y }
  }

  // Flow and Strategic views share Y axis
  let xPos: number
  let yPos: number

  // Check if we should use temporal interpolation
  const isTemporalMode = viewMode === 'strategic' && currentDate !== null

  if (isTemporalMode && keyframes.length > 0) {
    // Use interpolated positions for Strategic View in temporal mode
    const basePosition = {
      x: positions.strategic.x,
      y: positions.shared.y,
    }
    const interpolated = interpolatePosition(contextId, currentDate!, keyframes, basePosition)
    xPos = interpolated.x
    yPos = interpolated.y
  } else {
    // Use base positions
    xPos = viewMode === 'flow' ? positions.flow.x : positions.strategic.x
    yPos = positions.shared.y
  }

  const x = (xPos / 100) * 2000
  const y = (yPos / 100) * 1000

  return { x, y }
}

interface DragNode {
  position: { x: number; y: number }
  width: number
  height: number
}

interface CanvasBounds {
  width: number
  height: number
  minY: number
}

export function clampDragDelta(
  delta: { x: number; y: number },
  selectedNodes: DragNode[],
  canvasBounds: CanvasBounds,
): { x: number; y: number } {
  let maxDeltaLeft = Infinity
  let maxDeltaRight = Infinity
  let maxDeltaUp = Infinity
  let maxDeltaDown = Infinity

  for (const n of selectedNodes) {
    const w = n.width
    const h = n.height
    maxDeltaLeft = Math.min(maxDeltaLeft, n.position.x)
    maxDeltaRight = Math.min(maxDeltaRight, canvasBounds.width - w - n.position.x)
    maxDeltaUp = Math.min(maxDeltaUp, n.position.y - canvasBounds.minY)
    maxDeltaDown = Math.min(maxDeltaDown, canvasBounds.height - h - n.position.y)
  }

  const clampedX = Math.max(-maxDeltaLeft, Math.min(maxDeltaRight, delta.x))
  const clampedY = Math.max(-maxDeltaUp, Math.min(maxDeltaDown, delta.y))

  return { x: clampedX, y: clampedY }
}
