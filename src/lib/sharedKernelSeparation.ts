import type { BoundedContext } from '../model/types'
import { NODE_SIZES } from './canvasConstants'
import { computeOverlapRegion } from './sharedKernelGeometry'

type SeparationViewMode = 'flow' | 'strategic'

const CANVAS_WIDTH = 2000
const CANVAS_HEIGHT = 1000
const PROBLEM_SPACE_HEIGHT = 150

export const SHARED_KERNEL_SEPARATION_GAP = 20

export interface SeparationBox {
  x: number
  y: number
  width: number
  height: number
}

export interface SeparationDelta {
  dx: number
  dy: number
}

export interface SeparationDeltas {
  a: SeparationDelta
  b: SeparationDelta
}

export function computeSeparationCanvasDeltas(
  a: SeparationBox,
  b: SeparationBox,
  gap: number
): SeparationDeltas | null {
  const overlap = computeOverlapRegion(a, b)
  if (!overlap) return null

  const separateAlongX = overlap.width <= overlap.height
  const aCenter = separateAlongX ? a.x + a.width / 2 : a.y + a.height / 2
  const bCenter = separateAlongX ? b.x + b.width / 2 : b.y + b.height / 2
  const totalSeparation = (separateAlongX ? overlap.width : overlap.height) + gap
  const halfSeparation = totalSeparation / 2

  const aDirection = aCenter <= bCenter ? -1 : 1
  const bDirection = -aDirection

  if (separateAlongX) {
    return {
      a: { dx: aDirection * halfSeparation, dy: 0 },
      b: { dx: bDirection * halfSeparation, dy: 0 },
    }
  }
  return {
    a: { dx: 0, dy: aDirection * halfSeparation },
    b: { dx: 0, dy: bDirection * halfSeparation },
  }
}

function getContextBox(context: BoundedContext, viewMode: SeparationViewMode): SeparationBox {
  const size = NODE_SIZES[context.codeSize?.bucket || 'medium']
  const xPercent = viewMode === 'flow' ? context.positions.flow.x : context.positions.strategic.x
  return {
    x: (xPercent / 100) * CANVAS_WIDTH,
    y: (context.positions.shared.y / 100) * CANVAS_HEIGHT,
    width: size.width,
    height: size.height,
  }
}

function clampCanvas(
  x: number,
  y: number,
  width: number,
  height: number
): { x: number; y: number } {
  return {
    x: Math.max(0, Math.min(CANVAS_WIDTH - width, x)),
    y: Math.max(PROBLEM_SPACE_HEIGHT, Math.min(CANVAS_HEIGHT - height, y)),
  }
}

function applyDeltaToPositions(
  context: BoundedContext,
  delta: SeparationDelta,
  viewMode: SeparationViewMode
): BoundedContext['positions'] {
  const size = NODE_SIZES[context.codeSize?.bucket || 'medium']
  const currentXPercent =
    viewMode === 'flow' ? context.positions.flow.x : context.positions.strategic.x
  const currentX = (currentXPercent / 100) * CANVAS_WIDTH
  const currentY = (context.positions.shared.y / 100) * CANVAS_HEIGHT

  const { x: clampedX, y: clampedY } = clampCanvas(
    currentX + delta.dx,
    currentY + delta.dy,
    size.width,
    size.height
  )

  const newXPercent = (clampedX / CANVAS_WIDTH) * 100
  const newYPercent = (clampedY / CANVAS_HEIGHT) * 100

  return {
    flow: { x: viewMode === 'flow' ? newXPercent : context.positions.flow.x },
    strategic: {
      x: viewMode === 'strategic' ? newXPercent : context.positions.strategic.x,
    },
    distillation: {
      x: context.positions.distillation.x,
      y: context.positions.distillation.y,
    },
    shared: { y: newYPercent },
  }
}

export interface SeparatedPositionsResult {
  fromPositions: BoundedContext['positions']
  toPositions: BoundedContext['positions']
}

export function computeSeparatedPositions(
  fromContext: BoundedContext,
  toContext: BoundedContext,
  viewMode: SeparationViewMode,
  gap: number = SHARED_KERNEL_SEPARATION_GAP
): SeparatedPositionsResult | null {
  const fromBox = getContextBox(fromContext, viewMode)
  const toBox = getContextBox(toContext, viewMode)
  const deltas = computeSeparationCanvasDeltas(fromBox, toBox, gap)
  if (!deltas) return null

  return {
    fromPositions: applyDeltaToPositions(fromContext, deltas.a, viewMode),
    toPositions: applyDeltaToPositions(toContext, deltas.b, viewMode),
  }
}
