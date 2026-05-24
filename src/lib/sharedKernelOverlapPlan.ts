import type { Relationship } from '../model/types'
import { boxesOverlap, type Box } from './sharedKernelGeometry'
import { PATTERN_DEFINITIONS } from '../model/patternDefinitions'

export interface ContextBox {
  id: string
  box: Box
}

export interface SharedKernelConversion {
  otherContextId: string
  relationshipId: string
}

export interface SharedKernelPlan {
  toCreate: string[]
  toConvert: SharedKernelConversion[]
}

export function computeSharedKernelPlan(
  draggedId: string,
  draggedBox: Box,
  others: ContextBox[],
  relationships: Relationship[],
  previouslyOverlappingIds: ReadonlySet<string>
): SharedKernelPlan {
  const plan: SharedKernelPlan = { toCreate: [], toConvert: [] }

  for (const other of others) {
    if (other.id === draggedId) continue
    if (!boxesOverlap(draggedBox, other.box)) continue
    if (previouslyOverlappingIds.has(other.id)) continue

    const existing = findRelationshipBetween(draggedId, other.id, relationships)
    if (!existing) {
      plan.toCreate.push(other.id)
    } else if (existing.pattern === 'shared-kernel') {
      continue
    } else {
      plan.toConvert.push({ otherContextId: other.id, relationshipId: existing.id })
    }
  }

  return plan
}

function findRelationshipBetween(
  a: string,
  b: string,
  relationships: Relationship[]
): Relationship | undefined {
  return relationships.find(
    (r) =>
      (r.fromContextId === a && r.toContextId === b) ||
      (r.fromContextId === b && r.toContextId === a)
  )
}

export interface SharedKernelSeparation {
  otherContextId: string
  relationshipId: string
}

export function computeSharedKernelSeparations(
  draggedId: string,
  draggedBox: Box,
  others: ContextBox[],
  relationships: Relationship[],
  previouslyOverlappingIds: ReadonlySet<string>
): SharedKernelSeparation[] {
  const otherById = new Map(others.map((o) => [o.id, o]))
  const result: SharedKernelSeparation[] = []

  for (const otherId of previouslyOverlappingIds) {
    if (otherId === draggedId) continue
    const other = otherById.get(otherId)
    if (!other) continue
    if (boxesOverlap(draggedBox, other.box)) continue

    const existing = findRelationshipBetween(draggedId, otherId, relationships)
    if (!existing || existing.pattern !== 'shared-kernel') continue

    result.push({ otherContextId: otherId, relationshipId: existing.id })
  }

  return result
}

export function describeRelationshipForConversionPrompt(rel: Relationship): string {
  if (rel.pattern) {
    const def = PATTERN_DEFINITIONS.find((p) => p.value === rel.pattern)
    if (def) return def.label
  }
  const upstreamLabel = rel.upstreamRole
    ? PATTERN_DEFINITIONS.find((p) => p.value === rel.upstreamRole)?.label
    : undefined
  const downstreamLabel = rel.downstreamRole
    ? PATTERN_DEFINITIONS.find((p) => p.value === rel.downstreamRole)?.label
    : undefined
  if (upstreamLabel && downstreamLabel) {
    return `${upstreamLabel} / ${downstreamLabel}`
  }
  return upstreamLabel ?? downstreamLabel ?? 'existing'
}

export function findOverlappingContextIds(
  targetId: string,
  targetBox: Box,
  others: ContextBox[]
): Set<string> {
  const result = new Set<string>()
  for (const other of others) {
    if (other.id === targetId) continue
    if (boxesOverlap(targetBox, other.box)) {
      result.add(other.id)
    }
  }
  return result
}
