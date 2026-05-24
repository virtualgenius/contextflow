import { describe, it, expect } from 'vitest'
import * as Y from 'yjs'

import { migrateYjsRelationships } from '../migrateYjsRelationships'

interface YjsRelationshipSeed {
  id: string
  fromContextId?: string
  toContextId?: string
  pattern?: string | null
  upstreamRole?: string | null
  downstreamRole?: string | null
}

function buildProjectDoc(relationships: YjsRelationshipSeed[]): Y.Doc {
  const doc = new Y.Doc()
  const yProject = doc.getMap('project')
  yProject.set('id', 'test-project')
  const yRelationships = new Y.Array<Y.Map<unknown>>()
  for (const seed of relationships) {
    const yMap = new Y.Map<unknown>()
    yMap.set('id', seed.id)
    yMap.set('fromContextId', seed.fromContextId ?? 'ctx-1')
    yMap.set('toContextId', seed.toContextId ?? 'ctx-2')
    if (seed.pattern !== undefined) yMap.set('pattern', seed.pattern)
    if (seed.upstreamRole !== undefined) yMap.set('upstreamRole', seed.upstreamRole)
    if (seed.downstreamRole !== undefined) yMap.set('downstreamRole', seed.downstreamRole)
    yRelationships.push([yMap])
  }
  yProject.set('relationships', yRelationships)
  return doc
}

function getRelationships(doc: Y.Doc): Y.Array<Y.Map<unknown>> {
  const yProject = doc.getMap('project')
  return yProject.get('relationships') as Y.Array<Y.Map<unknown>>
}

describe('migrateYjsRelationships', () => {
  describe('per-side pattern migration', () => {
    it('moves open-host-service pattern to upstreamRole and clears pattern', () => {
      const doc = buildProjectDoc([{ id: 'r1', pattern: 'open-host-service' }])
      migrateYjsRelationships(doc.getMap('project'))
      const rel = getRelationships(doc).get(0)
      expect(rel.get('upstreamRole')).toBe('open-host-service')
      expect(rel.get('pattern')).toBeNull()
    })

    it('moves published-language pattern to upstreamRole and clears pattern', () => {
      const doc = buildProjectDoc([{ id: 'r1', pattern: 'published-language' }])
      migrateYjsRelationships(doc.getMap('project'))
      const rel = getRelationships(doc).get(0)
      expect(rel.get('upstreamRole')).toBe('published-language')
      expect(rel.get('pattern')).toBeNull()
    })

    it('moves conformist pattern to downstreamRole and clears pattern', () => {
      const doc = buildProjectDoc([{ id: 'r1', pattern: 'conformist' }])
      migrateYjsRelationships(doc.getMap('project'))
      const rel = getRelationships(doc).get(0)
      expect(rel.get('downstreamRole')).toBe('conformist')
      expect(rel.get('pattern')).toBeNull()
    })

    it('moves anti-corruption-layer pattern to downstreamRole and clears pattern', () => {
      const doc = buildProjectDoc([{ id: 'r1', pattern: 'anti-corruption-layer' }])
      migrateYjsRelationships(doc.getMap('project'))
      const rel = getRelationships(doc).get(0)
      expect(rel.get('downstreamRole')).toBe('anti-corruption-layer')
      expect(rel.get('pattern')).toBeNull()
    })

    it('preserves an already-set upstreamRole (does not overwrite)', () => {
      const doc = buildProjectDoc([
        { id: 'r1', pattern: 'open-host-service', upstreamRole: 'published-language' },
      ])
      migrateYjsRelationships(doc.getMap('project'))
      const rel = getRelationships(doc).get(0)
      expect(rel.get('upstreamRole')).toBe('published-language')
      expect(rel.get('pattern')).toBeNull()
    })

    it('preserves an already-set downstreamRole (does not overwrite)', () => {
      const doc = buildProjectDoc([
        { id: 'r1', pattern: 'anti-corruption-layer', downstreamRole: 'conformist' },
      ])
      migrateYjsRelationships(doc.getMap('project'))
      const rel = getRelationships(doc).get(0)
      expect(rel.get('downstreamRole')).toBe('conformist')
      expect(rel.get('pattern')).toBeNull()
    })
  })

  describe('separate-ways deletion', () => {
    it('removes a relationship YMap whose pattern is separate-ways', () => {
      const doc = buildProjectDoc([{ id: 'r1', pattern: 'separate-ways' }])
      migrateYjsRelationships(doc.getMap('project'))
      expect(getRelationships(doc).length).toBe(0)
    })

    it('removes all separate-ways relationships without affecting others', () => {
      const doc = buildProjectDoc([
        { id: 'r1', pattern: 'customer-supplier' },
        { id: 'r2', pattern: 'separate-ways' },
        { id: 'r3', pattern: 'partnership' },
        { id: 'r4', pattern: 'separate-ways' },
        { id: 'r5', pattern: 'shared-kernel' },
      ])
      migrateYjsRelationships(doc.getMap('project'))
      const rels = getRelationships(doc)
      const ids: string[] = []
      for (let i = 0; i < rels.length; i++) {
        ids.push(rels.get(i).get('id') as string)
      }
      expect(ids).toEqual(['r1', 'r3', 'r5'])
    })
  })

  describe('untouched patterns', () => {
    it('leaves shared-kernel relationships unchanged', () => {
      const doc = buildProjectDoc([{ id: 'r1', pattern: 'shared-kernel' }])
      migrateYjsRelationships(doc.getMap('project'))
      const rel = getRelationships(doc).get(0)
      expect(rel.get('pattern')).toBe('shared-kernel')
    })

    it('leaves customer-supplier relationships unchanged', () => {
      const doc = buildProjectDoc([{ id: 'r1', pattern: 'customer-supplier' }])
      migrateYjsRelationships(doc.getMap('project'))
      const rel = getRelationships(doc).get(0)
      expect(rel.get('pattern')).toBe('customer-supplier')
    })

    it('leaves partnership relationships unchanged', () => {
      const doc = buildProjectDoc([{ id: 'r1', pattern: 'partnership' }])
      migrateYjsRelationships(doc.getMap('project'))
      const rel = getRelationships(doc).get(0)
      expect(rel.get('pattern')).toBe('partnership')
    })

    it('leaves relationships with no pattern unchanged', () => {
      const doc = buildProjectDoc([{ id: 'r1', upstreamRole: 'open-host-service', pattern: null }])
      migrateYjsRelationships(doc.getMap('project'))
      const rel = getRelationships(doc).get(0)
      expect(rel.get('upstreamRole')).toBe('open-host-service')
      expect(rel.get('pattern')).toBeNull()
    })
  })

  describe('idempotence', () => {
    it('a second call after migration triggers no new transactions', () => {
      const doc = buildProjectDoc([
        { id: 'r1', pattern: 'open-host-service' },
        { id: 'r2', pattern: 'separate-ways' },
      ])
      migrateYjsRelationships(doc.getMap('project'))

      let callbackCount = 0
      doc.on('afterTransaction', () => {
        callbackCount++
      })

      migrateYjsRelationships(doc.getMap('project'))
      expect(callbackCount).toBe(0)
    })

    it('does not start a transaction when there is no work to do', () => {
      const doc = buildProjectDoc([
        { id: 'r1', pattern: 'customer-supplier' },
        { id: 'r2', pattern: 'partnership' },
      ])

      let callbackCount = 0
      doc.on('afterTransaction', () => {
        callbackCount++
      })

      migrateYjsRelationships(doc.getMap('project'))
      expect(callbackCount).toBe(0)
    })
  })

  describe('single-transaction guarantee', () => {
    it('groups per-side migration and separate-ways deletion into one transaction', () => {
      const doc = buildProjectDoc([
        { id: 'r1', pattern: 'open-host-service' },
        { id: 'r2', pattern: 'separate-ways' },
        { id: 'r3', pattern: 'conformist' },
      ])

      let transactionCount = 0
      doc.on('afterTransaction', () => {
        transactionCount++
      })

      migrateYjsRelationships(doc.getMap('project'))
      expect(transactionCount).toBe(1)
    })
  })

  describe('safety', () => {
    it('does nothing when the project has no relationships array', () => {
      const doc = new Y.Doc()
      const yProject = doc.getMap('project')
      yProject.set('id', 'p1')
      expect(() => migrateYjsRelationships(yProject)).not.toThrow()
    })
  })
})
