import type { Relationship, UpstreamRole, DownstreamRole } from '../model/types'
import { PATTERN_DEFINITIONS, POWER_DYNAMICS_ICONS } from '../model/patternDefinitions'

// The empty-canvas nudge that teaches the double-click gesture: show it only
// while there is nothing on the canvas yet and no name field is already open.
export function shouldShowAddContextHint(contextCount: number, hasOpenDraft: boolean): boolean {
  return contextCount === 0 && !hasOpenDraft
}

/**
 * Breadth-first expansion of a seed set across undirected relationships.
 *
 * Returns the set of context IDs within `depth` hops of any seed (inclusive of
 * the seeds themselves). Depth 0 returns just the seed set. Relationship
 * direction is ignored: a hop traverses either endpoint to the other.
 */
export function computeNeighborhood(
  seedIds: Iterable<string>,
  relationships: Relationship[],
  depth: number
): Set<string> {
  const result = new Set<string>(seedIds)
  let frontier = [...result]

  for (let hop = 0; hop < depth; hop++) {
    const next: string[] = []
    for (const id of frontier) {
      for (const rel of relationships) {
        if (rel.fromContextId === id && !result.has(rel.toContextId)) {
          result.add(rel.toContextId)
          next.push(rel.toContextId)
        }
        if (rel.toContextId === id && !result.has(rel.fromContextId)) {
          result.add(rel.fromContextId)
          next.push(rel.fromContextId)
        }
      }
    }
    if (next.length === 0) break
    frontier = next
  }

  return result
}

/**
 * Given a hovered context ID and a list of relationships,
 * return the set of context IDs connected to the hovered context.
 */
export function getHoverConnectedContextIds(
  hoveredContextId: string | null,
  relationships: Relationship[]
): Set<string> {
  if (!hoveredContextId) return new Set<string>()

  const neighborhood = computeNeighborhood([hoveredContextId], relationships, 1)
  neighborhood.delete(hoveredContextId)
  return neighborhood
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
