import type { ViewMode } from '../model/storeTypes'

// The coordinate space a view draws contexts in. Context Map shares Flow's
// space (flow.x + shared.y); it differs from Flow only in which scaffolding
// renders, not in where contexts sit.
export type CoordinateSpace = 'flow' | 'strategic' | 'distillation'

export function coordinateSpaceFor(viewMode: ViewMode): CoordinateSpace {
  return viewMode === 'context-map' ? 'flow' : viewMode
}

// Value-stream scaffolding = users, user needs, their wiring, stage labels,
// the value-chain axis, and the problem-space band. A pure context map (and
// Distillation) hides all of it.
export function showsValueStreamScaffolding(viewMode: ViewMode): boolean {
  return viewMode !== 'context-map' && viewMode !== 'distillation'
}

// Contexts, relationships, and groups are the substance of a context map and
// render in every view except Distillation (which has its own layout).
export function showsContextMapElements(viewMode: ViewMode): boolean {
  return viewMode !== 'distillation'
}

// Whether a view reserves the problem-space strip at the top of the canvas
// (keeping contexts out of it during drag). The value-chain coordinate space
// reserves it: Value Stream displays it as a band, and Context Map shares the
// same coordinates so it reserves the strip too (without displaying the band).
// Distillation has its own coordinate space and reserves nothing.
export function reservesProblemSpaceTop(viewMode: ViewMode): boolean {
  return coordinateSpaceFor(viewMode) !== 'distillation'
}

// The backdrop chrome a view paints behind the nodes. Context Map paints none.
export type CanvasBackdrop = 'distillation' | 'flow' | 'strategic' | 'none'

export function canvasBackdropFor(viewMode: ViewMode): CanvasBackdrop {
  switch (viewMode) {
    case 'distillation':
      return 'distillation'
    case 'flow':
      return 'flow'
    case 'strategic':
      return 'strategic'
    case 'context-map':
      return 'none'
  }
}
