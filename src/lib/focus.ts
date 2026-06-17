import type { BoundedContext, Relationship } from '../model/types'
import type { FocusState } from '../model/storeTypes'
import { computeNeighborhood } from './canvasHelpers'

// Out-of-focus contexts keep a faint presence so the overall shape of the map
// stays legible while the focused subject reads as the foreground.
export const FOCUS_DIM_OPACITY = 0.12

/**
 * The contexts that seed a focus: the focused subject expressed as context IDs.
 * A team focus seeds every context the team owns; a context focus seeds itself.
 */
export function focusSeedContextIds(focus: FocusState, contexts: BoundedContext[]): string[] {
  if (!focus) return []
  if (focus.kind === 'team') {
    return contexts.filter((c) => c.teamId === focus.id).map((c) => c.id)
  }
  return [focus.id]
}

/**
 * The set of context IDs that stay in focus, or null when nothing is focused.
 * Expands the seed set outward by the focus depth across relationships.
 */
export function computeFocusedContextIds(
  focus: FocusState,
  contexts: BoundedContext[],
  relationships: Relationship[]
): Set<string> | null {
  if (!focus) return null
  const seeds = focusSeedContextIds(focus, contexts)
  return computeNeighborhood(seeds, relationships, focus.depth)
}

/**
 * Combine an existing opacity (e.g. temporal visibility) with focus dimming.
 * Multiplying keeps both effects sensible: a context that is both temporally
 * faded and out of focus reads as fainter than either alone.
 */
export function applyFocusDim(baseOpacity: number, isInFocus: boolean): number {
  return isInFocus ? baseOpacity : baseOpacity * FOCUS_DIM_OPACITY
}
