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

/**
 * The next focus state when the team focus button is clicked. Clicking the
 * already-focused team toggles focus off (returns null); any other click focuses
 * that team at the team default depth (0).
 */
export function toggleTeamFocus(current: FocusState, teamId: string): FocusState {
  if (current?.kind === 'team' && current.id === teamId) return null
  return { kind: 'team', id: teamId, depth: 0 }
}

/**
 * Whether a relationship edge should dim under the current focus. An edge reads
 * at full strength only when BOTH its endpoints are in the neighborhood, so the
 * focus boundary stays legible; it dims if either endpoint is out of focus. No
 * focus means no dimming.
 */
export function isEdgeDimmedByFocus(
  focusedContextIds: Set<string> | null,
  sourceId: string,
  targetId: string
): boolean {
  if (!focusedContextIds) return false
  return !(focusedContextIds.has(sourceId) && focusedContextIds.has(targetId))
}

/**
 * How many of the project's contexts are currently in focus (fully visible).
 * The "N" in the focus bar's "N of M shown" count.
 */
export function countFocusedContexts(
  focusedContextIds: Set<string> | null,
  contexts: BoundedContext[]
): number {
  if (!focusedContextIds) return contexts.length
  return contexts.filter((c) => focusedContextIds.has(c.id)).length
}
