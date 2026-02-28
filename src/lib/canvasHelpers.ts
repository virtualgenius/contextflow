import type { Relationship } from '../model/types'
import { PATTERN_DEFINITIONS, POWER_DYNAMICS_ICONS } from '../model/patternDefinitions'

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
 * Get the display label and optional direction icon for an edge's pattern.
 * Returns null if the pattern is not found.
 */
export function getEdgeLabelInfo(pattern: string): EdgeLabelInfo | null {
  const patternDef = PATTERN_DEFINITIONS.find((p) => p.value === pattern)
  if (!patternDef) return null

  const icon = POWER_DYNAMICS_ICONS[patternDef.powerDynamics]
  return {
    label: patternDef.label,
    directionIcon: icon !== '○' ? icon : null,
  }
}
