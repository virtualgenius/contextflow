import * as Y from 'yjs'
import type { Relationship } from '../types'
import { populateRelationshipYMap } from './relationshipSync'

export function addRelationshipMutation(ydoc: Y.Doc, relationship: Relationship): void {
  const yProject = ydoc.getMap('project')
  const yRelationships = yProject.get('relationships') as Y.Array<Y.Map<unknown>>

  const yRelationship = new Y.Map<unknown>()
  populateRelationshipYMap(yRelationship, relationship)
  yRelationships.push([yRelationship])
}

export function updateRelationshipMutation(
  ydoc: Y.Doc,
  relationshipId: string,
  updates: Partial<Relationship>
): void {
  ydoc.transact(() => {
    const yRelationship = findRelationshipById(ydoc, relationshipId)
    if (!yRelationship) return

    applyRelationshipUpdates(yRelationship, updates)
  })
}

export function deleteRelationshipMutation(ydoc: Y.Doc, relationshipId: string): void {
  const yProject = ydoc.getMap('project')
  const yRelationships = yProject.get('relationships') as Y.Array<Y.Map<unknown>>

  const index = findRelationshipIndex(yRelationships, relationshipId)
  if (index === -1) return

  yRelationships.delete(index)
}

function findRelationshipById(ydoc: Y.Doc, relationshipId: string): Y.Map<unknown> | null {
  const yProject = ydoc.getMap('project')
  const yRelationships = yProject.get('relationships') as Y.Array<Y.Map<unknown>>

  const index = findRelationshipIndex(yRelationships, relationshipId)
  if (index === -1) return null

  return yRelationships.get(index)
}

function findRelationshipIndex(
  yRelationships: Y.Array<Y.Map<unknown>>,
  relationshipId: string
): number {
  for (let i = 0; i < yRelationships.length; i++) {
    const yRelationship = yRelationships.get(i)
    if (yRelationship.get('id') === relationshipId) {
      return i
    }
  }
  return -1
}

function applyRelationshipUpdates(
  yRelationship: Y.Map<unknown>,
  updates: Partial<Relationship>
): void {
  const fields: (keyof Relationship)[] = [
    'fromContextId',
    'toContextId',
    'pattern',
    'upstreamRole',
    'downstreamRole',
    'communicationMode',
    'description',
  ]

  const effectiveUpdates = applyMutualExclusion(updates)

  for (const field of fields) {
    if (field in effectiveUpdates) {
      const value = effectiveUpdates[field]
      yRelationship.set(field, value ?? null)
    }
  }
}

// Pattern (Partnership / Customer-Supplier / Shared Kernel) and per-side roles
// (Open Host Service / Published Language / Conformist / Anti-Corruption Layer)
// are mutually exclusive ways to characterize a relationship. Setting one to a
// defined value clears the other side so the data never holds contradictory
// state. Toggling off (setting to undefined) does NOT cascade.
function applyMutualExclusion(updates: Partial<Relationship>): Partial<Relationship> {
  const result: Partial<Relationship> = { ...updates }

  const settingPattern = 'pattern' in updates && updates.pattern != null
  const settingUpstreamRole = 'upstreamRole' in updates && updates.upstreamRole != null
  const settingDownstreamRole = 'downstreamRole' in updates && updates.downstreamRole != null

  if (settingPattern) {
    if (!('upstreamRole' in result)) result.upstreamRole = undefined
    if (!('downstreamRole' in result)) result.downstreamRole = undefined
  }

  if (settingUpstreamRole || settingDownstreamRole) {
    if (!('pattern' in result)) result.pattern = undefined
  }

  return result
}
