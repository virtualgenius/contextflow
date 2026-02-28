import { describe, it, expect } from 'vitest'
import { getConnectedUsers, categorizeRelationships } from '../inspectorHelpers'
import type { Project, Relationship } from '../../model/types'

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: 'p1',
    name: 'Test',
    contexts: [],
    relationships: [],
    repos: [],
    people: [],
    teams: [],
    groups: [],
    users: [],
    userNeeds: [],
    userNeedConnections: [],
    needContextConnections: [],
    viewConfig: { flowStages: [] },
    ...overrides,
  }
}

describe('getConnectedUsers', () => {
  it('returns empty array when no connections exist', () => {
    const project = makeProject()
    expect(getConnectedUsers(project, 'ctx-1')).toEqual([])
  })

  it('returns users connected to a context via user needs', () => {
    const project = makeProject({
      users: [
        { id: 'u1', name: 'Alice', position: 50 },
        { id: 'u2', name: 'Bob', position: 60 },
      ],
      userNeeds: [
        { id: 'need-1', name: 'Search', position: 40 },
      ],
      userNeedConnections: [
        { id: 'uc1', userId: 'u1', userNeedId: 'need-1' },
      ],
      needContextConnections: [
        { id: 'nc1', userNeedId: 'need-1', contextId: 'ctx-1' },
      ],
    })

    const result = getConnectedUsers(project, 'ctx-1')
    expect(result).toEqual([{ id: 'u1', name: 'Alice', position: 50 }])
  })

  it('returns multiple users connected through different needs', () => {
    const project = makeProject({
      users: [
        { id: 'u1', name: 'Alice', position: 50 },
        { id: 'u2', name: 'Bob', position: 60 },
      ],
      userNeeds: [
        { id: 'need-1', name: 'Search', position: 40 },
        { id: 'need-2', name: 'Browse', position: 50 },
      ],
      userNeedConnections: [
        { id: 'uc1', userId: 'u1', userNeedId: 'need-1' },
        { id: 'uc2', userId: 'u2', userNeedId: 'need-2' },
      ],
      needContextConnections: [
        { id: 'nc1', userNeedId: 'need-1', contextId: 'ctx-1' },
        { id: 'nc2', userNeedId: 'need-2', contextId: 'ctx-1' },
      ],
    })

    const result = getConnectedUsers(project, 'ctx-1')
    expect(result).toHaveLength(2)
    expect(result.map(u => u.name)).toEqual(['Alice', 'Bob'])
  })

  it('deduplicates users connected through multiple needs', () => {
    const project = makeProject({
      users: [
        { id: 'u1', name: 'Alice', position: 50 },
      ],
      userNeeds: [
        { id: 'need-1', name: 'Search', position: 40 },
        { id: 'need-2', name: 'Browse', position: 50 },
      ],
      userNeedConnections: [
        { id: 'uc1', userId: 'u1', userNeedId: 'need-1' },
        { id: 'uc2', userId: 'u1', userNeedId: 'need-2' },
      ],
      needContextConnections: [
        { id: 'nc1', userNeedId: 'need-1', contextId: 'ctx-1' },
        { id: 'nc2', userNeedId: 'need-2', contextId: 'ctx-1' },
      ],
    })

    const result = getConnectedUsers(project, 'ctx-1')
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Alice')
  })

  it('excludes users connected to other contexts only', () => {
    const project = makeProject({
      users: [
        { id: 'u1', name: 'Alice', position: 50 },
        { id: 'u2', name: 'Bob', position: 60 },
      ],
      userNeeds: [
        { id: 'need-1', name: 'Search', position: 40 },
        { id: 'need-2', name: 'Browse', position: 50 },
      ],
      userNeedConnections: [
        { id: 'uc1', userId: 'u1', userNeedId: 'need-1' },
        { id: 'uc2', userId: 'u2', userNeedId: 'need-2' },
      ],
      needContextConnections: [
        { id: 'nc1', userNeedId: 'need-1', contextId: 'ctx-1' },
        { id: 'nc2', userNeedId: 'need-2', contextId: 'ctx-other' },
      ],
    })

    const result = getConnectedUsers(project, 'ctx-1')
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Alice')
  })

  it('handles missing users array gracefully', () => {
    const project = makeProject({
      users: undefined as any,
      needContextConnections: [
        { id: 'nc1', userNeedId: 'need-1', contextId: 'ctx-1' },
      ],
      userNeedConnections: [
        { id: 'uc1', userId: 'u1', userNeedId: 'need-1' },
      ],
    })

    const result = getConnectedUsers(project, 'ctx-1')
    expect(result).toEqual([])
  })

  it('handles missing connection arrays gracefully', () => {
    const project = makeProject({
      needContextConnections: undefined as any,
      userNeedConnections: undefined as any,
    })

    const result = getConnectedUsers(project, 'ctx-1')
    expect(result).toEqual([])
  })
})

describe('categorizeRelationships', () => {
  const makeRel = (overrides: Partial<Relationship>): Relationship => ({
    id: 'r1',
    fromContextId: 'ctx-1',
    toContextId: 'ctx-2',
    pattern: 'customer-supplier',
    ...overrides,
  })

  it('returns empty categories when no relationships exist', () => {
    const result = categorizeRelationships([], 'ctx-1')
    expect(result).toEqual({ upstream: [], downstream: [], mutual: [] })
  })

  it('categorizes relationship as upstream when context is fromContextId (downstream/dependent)', () => {
    const rels = [makeRel({ id: 'r1', fromContextId: 'ctx-1', toContextId: 'ctx-2', pattern: 'customer-supplier' })]
    const result = categorizeRelationships(rels, 'ctx-1')
    expect(result.upstream).toHaveLength(1)
    expect(result.upstream[0].id).toBe('r1')
    expect(result.downstream).toHaveLength(0)
    expect(result.mutual).toHaveLength(0)
  })

  it('categorizes relationship as downstream when context is toContextId (upstream/authority)', () => {
    const rels = [makeRel({ id: 'r1', fromContextId: 'ctx-2', toContextId: 'ctx-1', pattern: 'conformist' })]
    const result = categorizeRelationships(rels, 'ctx-1')
    expect(result.downstream).toHaveLength(1)
    expect(result.downstream[0].id).toBe('r1')
    expect(result.upstream).toHaveLength(0)
  })

  it('categorizes shared-kernel as mutual', () => {
    const rels = [makeRel({ id: 'r1', fromContextId: 'ctx-1', toContextId: 'ctx-2', pattern: 'shared-kernel' })]
    const result = categorizeRelationships(rels, 'ctx-1')
    expect(result.mutual).toHaveLength(1)
    expect(result.mutual[0].id).toBe('r1')
    expect(result.upstream).toHaveLength(0)
    expect(result.downstream).toHaveLength(0)
  })

  it('categorizes partnership as mutual', () => {
    const rels = [makeRel({ id: 'r1', fromContextId: 'ctx-2', toContextId: 'ctx-1', pattern: 'partnership' })]
    const result = categorizeRelationships(rels, 'ctx-1')
    expect(result.mutual).toHaveLength(1)
  })

  it('handles mixed relationship types', () => {
    const rels = [
      makeRel({ id: 'r1', fromContextId: 'ctx-1', toContextId: 'ctx-2', pattern: 'customer-supplier' }),
      makeRel({ id: 'r2', fromContextId: 'ctx-3', toContextId: 'ctx-1', pattern: 'conformist' }),
      makeRel({ id: 'r3', fromContextId: 'ctx-1', toContextId: 'ctx-4', pattern: 'shared-kernel' }),
      makeRel({ id: 'r4', fromContextId: 'ctx-5', toContextId: 'ctx-1', pattern: 'partnership' }),
    ]
    const result = categorizeRelationships(rels, 'ctx-1')
    expect(result.upstream).toHaveLength(1)
    expect(result.upstream[0].id).toBe('r1')
    expect(result.downstream).toHaveLength(1)
    expect(result.downstream[0].id).toBe('r2')
    expect(result.mutual).toHaveLength(2)
  })

  it('excludes relationships not involving the context', () => {
    const rels = [
      makeRel({ id: 'r1', fromContextId: 'ctx-2', toContextId: 'ctx-3', pattern: 'customer-supplier' }),
    ]
    const result = categorizeRelationships(rels, 'ctx-1')
    expect(result.upstream).toHaveLength(0)
    expect(result.downstream).toHaveLength(0)
    expect(result.mutual).toHaveLength(0)
  })
})
