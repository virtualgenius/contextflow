import type { Relationship, UpstreamRole, DownstreamRole } from '../model/types'
import { PATTERN_DEFINITIONS, POWER_DYNAMICS_ICONS } from '../model/patternDefinitions'

// The empty-canvas nudge that teaches the double-click gesture: show it only
// while there is nothing on the canvas yet and no name field is already open.
export function shouldShowAddContextHint(contextCount: number, hasOpenDraft: boolean): boolean {
  return contextCount === 0 && !hasOpenDraft
}

/**
 * Given a hovered context ID and a list of relationships,
 * return the set of context IDs connected to the hovered context.
 */
export function getHoverConnectedContextIds(
  hoveredContextId: string | null,
  relationships: Relationship[]
): Set<string> {
  const connected = new Set<string>()
  if (!hoveredContextId) return connected

  for (const rel of relationships) {
    if (rel.fromContextId === hoveredContextId) connected.add(rel.toContextId)
    if (rel.toContextId === hoveredContextId) connected.add(rel.fromContextId)
  }
  return connected
}

export interface EdgeLabelInfo {
  label: string
  directionIcon: string | null
}

/**
 * Get the display label and optional direction icon for an edge.
 *
 * Resolution order:
 * 1. If `pattern` is a known value, use the pattern's label and dynamics icon.
 * 2. Otherwise, derive a label from the per-side roles (upstream and/or downstream).
 * 3. If nothing is set, return null.
 */
export function getEdgeLabelInfo(
  pattern: string | undefined,
  upstreamRole?: UpstreamRole,
  downstreamRole?: DownstreamRole
): EdgeLabelInfo | null {
  const patternDef = pattern ? PATTERN_DEFINITIONS.find((p) => p.value === pattern) : undefined
  if (patternDef) {
    const icon = POWER_DYNAMICS_ICONS[patternDef.powerDynamics]
    return {
      label: patternDef.label,
      directionIcon: icon !== '○' ? icon : null,
    }
  }

  if (upstreamRole || downstreamRole) {
    const parts: string[] = []
    if (upstreamRole) {
      const def = PATTERN_DEFINITIONS.find((p) => p.value === upstreamRole)
      if (def) parts.push(def.label)
    }
    if (downstreamRole) {
      const def = PATTERN_DEFINITIONS.find((p) => p.value === downstreamRole)
      if (def) parts.push(def.label)
    }
    if (parts.length === 0) return null
    return {
      label: parts.join(' · '),
      directionIcon: POWER_DYNAMICS_ICONS.upstream,
    }
  }

  return null
}
