import { describe, it, expect } from 'vitest'
import {
  focusSeedContextIds,
  computeFocusedContextIds,
  applyFocusDim,
  FOCUS_DIM_OPACITY,
} from '../focus'
import type { BoundedContext, Relationship } from '../../model/types'

function makeContext(id: string, teamId?: string): BoundedContext {
  return {
    id,
    name: id,
    positions: { flow: { x: 0 }, strategic: { x: 0 }, shared: { y: 0 } },
    teamId,
  } as BoundedContext
}

function makeRelationship(from: string, to: string): Relationship {
  return {
    id: `rel-${from}-${to}`,
    fromContextId: from,
    toContextId: to,
    pattern: 'customer-supplier',
  }
}

describe('focusSeedContextIds', () => {
  it('returns empty array when focus is null', () => {
    expect(focusSeedContextIds(null, [makeContext('a')])).toEqual([])
  })

  it('seeds a team focus with the contexts that team owns', () => {
    const contexts = [makeContext('a', 't1'), makeContext('b', 't2'), makeContext('c', 't1')]
    expect(focusSeedContextIds({ kind: 'team', id: 't1', depth: 0 }, contexts)).toEqual(['a', 'c'])
  })

  it('seeds a context focus with that single context', () => {
    const contexts = [makeContext('a'), makeContext('b')]
    expect(focusSeedContextIds({ kind: 'context', id: 'b', depth: 0 }, contexts)).toEqual(['b'])
  })

  it('returns empty array when a team owns no contexts', () => {
    const contexts = [makeContext('a', 't1')]
    expect(focusSeedContextIds({ kind: 'team', id: 'empty', depth: 0 }, contexts)).toEqual([])
  })
})

describe('computeFocusedContextIds', () => {
  it('returns null when focus is null', () => {
    expect(computeFocusedContextIds(null, [makeContext('a')], [])).toBeNull()
  })

  it('returns only the team contexts at depth 0', () => {
    const contexts = [makeContext('a', 't1'), makeContext('b', 't2'), makeContext('c', 't1')]
    const rels = [makeRelationship('a', 'b')]
    const result = computeFocusedContextIds({ kind: 'team', id: 't1', depth: 0 }, contexts, rels)
    expect(result).toEqual(new Set(['a', 'c']))
  })

  it('expands a team focus by depth', () => {
    const contexts = [makeContext('a', 't1'), makeContext('b', 't2'), makeContext('c', 't3')]
    const rels = [makeRelationship('a', 'b'), makeRelationship('b', 'c')]
    const result = computeFocusedContextIds({ kind: 'team', id: 't1', depth: 1 }, contexts, rels)
    expect(result).toEqual(new Set(['a', 'b']))
  })

  it('returns an empty set for a team that owns no contexts', () => {
    const contexts = [makeContext('a', 't1')]
    const rels = [makeRelationship('a', 'b')]
    const result = computeFocusedContextIds({ kind: 'team', id: 'empty', depth: 1 }, contexts, rels)
    expect(result?.size).toBe(0)
  })
})

describe('applyFocusDim', () => {
  it('keeps full opacity for in-focus contexts', () => {
    expect(applyFocusDim(1, true)).toBe(1)
  })

  it('dims out-of-focus contexts', () => {
    expect(applyFocusDim(1, false)).toBe(FOCUS_DIM_OPACITY)
  })

  it('multiplies an already-reduced opacity when out of focus', () => {
    expect(applyFocusDim(0.5, false)).toBeCloseTo(0.5 * FOCUS_DIM_OPACITY)
  })

  it('preserves a reduced opacity when in focus', () => {
    expect(applyFocusDim(0.5, true)).toBe(0.5)
  })
})
