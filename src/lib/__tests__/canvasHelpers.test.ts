import { describe, it, expect } from 'vitest'
import {
  getHoverConnectedContextIds,
  getEdgeLabelInfo,
  shouldShowAddContextHint,
} from '../canvasHelpers'
import type { Relationship } from '../../model/types'

function makeRelationship(
  from: string,
  to: string,
  pattern: Relationship['pattern'] = 'customer-supplier'
): Relationship {
  return {
    id: `rel-${from}-${to}`,
    fromContextId: from,
    toContextId: to,
    pattern,
  }
}

describe('getHoverConnectedContextIds', () => {
  it('returns empty set when hoveredContextId is null', () => {
    const rels = [makeRelationship('a', 'b')]
    expect(getHoverConnectedContextIds(null, rels).size).toBe(0)
  })

  it('returns empty set when there are no relationships', () => {
    expect(getHoverConnectedContextIds('a', []).size).toBe(0)
  })

  it('returns target when hovered context is the source', () => {
    const rels = [makeRelationship('a', 'b')]
    const result = getHoverConnectedContextIds('a', rels)
    expect(result).toEqual(new Set(['b']))
  })

  it('returns source when hovered context is the target', () => {
    const rels = [makeRelationship('a', 'b')]
    const result = getHoverConnectedContextIds('b', rels)
    expect(result).toEqual(new Set(['a']))
  })

  it('collects all connected contexts across multiple relationships', () => {
    const rels = [
      makeRelationship('a', 'b'),
      makeRelationship('a', 'c'),
      makeRelationship('d', 'a'),
    ]
    const result = getHoverConnectedContextIds('a', rels)
    expect(result).toEqual(new Set(['b', 'c', 'd']))
  })

  it('does not include the hovered context itself', () => {
    const rels = [makeRelationship('a', 'b')]
    const result = getHoverConnectedContextIds('a', rels)
    expect(result.has('a')).toBe(false)
  })

  it('ignores relationships that do not involve the hovered context', () => {
    const rels = [makeRelationship('a', 'b'), makeRelationship('c', 'd')]
    const result = getHoverConnectedContextIds('a', rels)
    expect(result).toEqual(new Set(['b']))
  })

  it('deduplicates when context appears in multiple relationships', () => {
    const rels = [
      makeRelationship('a', 'b', 'customer-supplier'),
      makeRelationship('b', 'a', 'partnership'),
    ]
    const result = getHoverConnectedContextIds('a', rels)
    expect(result).toEqual(new Set(['b']))
  })
})

describe('getEdgeLabelInfo', () => {
  it('returns label and direction icon for customer-supplier (upstream)', () => {
    const info = getEdgeLabelInfo('customer-supplier')
    expect(info).not.toBeNull()
    expect(info!.label).toBe('Customer-Supplier')
    expect(info!.directionIcon).toBe('↑')
  })

  it('returns label and direction icon for conformist (upstream)', () => {
    const info = getEdgeLabelInfo('conformist')
    expect(info).not.toBeNull()
    expect(info!.label).toBe('Conformist')
    expect(info!.directionIcon).toBe('↑')
  })

  it('returns label and direction icon for anti-corruption-layer (downstream)', () => {
    const info = getEdgeLabelInfo('anti-corruption-layer')
    expect(info).not.toBeNull()
    expect(info!.label).toBe('Anti-Corruption Layer')
    expect(info!.directionIcon).toBe('↓')
  })

  it('returns label and mutual icon for shared-kernel', () => {
    const info = getEdgeLabelInfo('shared-kernel')
    expect(info).not.toBeNull()
    expect(info!.label).toBe('Shared Kernel')
    expect(info!.directionIcon).toBe('↔')
  })

  it('returns null for unknown pattern', () => {
    expect(getEdgeLabelInfo('nonexistent-pattern')).toBeNull()
  })

  describe('per-side role fallback (Slice 3)', () => {
    it('returns null when pattern, upstreamRole, and downstreamRole are all undefined', () => {
      expect(getEdgeLabelInfo(undefined)).toBeNull()
    })

    it('falls back to upstream role label when pattern is undefined', () => {
      const info = getEdgeLabelInfo(undefined, 'open-host-service')
      expect(info).not.toBeNull()
      expect(info!.label).toBe('Open Host Service')
      expect(info!.directionIcon).toBe('↑')
    })

    it('falls back to downstream role label when pattern is undefined', () => {
      const info = getEdgeLabelInfo(undefined, undefined, 'anti-corruption-layer')
      expect(info).not.toBeNull()
      expect(info!.label).toBe('Anti-Corruption Layer')
      expect(info!.directionIcon).toBe('↑')
    })

    it('combines both role labels with a separator when both are set', () => {
      const info = getEdgeLabelInfo(undefined, 'open-host-service', 'anti-corruption-layer')
      expect(info).not.toBeNull()
      expect(info!.label).toBe('Open Host Service · Anti-Corruption Layer')
      expect(info!.directionIcon).toBe('↑')
    })

    it('prefers the pattern label over per-side roles when both are present', () => {
      const info = getEdgeLabelInfo('partnership', 'open-host-service', 'anti-corruption-layer')
      expect(info).not.toBeNull()
      expect(info!.label).toBe('Partnership')
      expect(info!.directionIcon).toBe('↔')
    })
  })

  describe('shouldShowAddContextHint', () => {
    it('shows the hint when there are no contexts and no name field is open', () => {
      expect(shouldShowAddContextHint(0, false)).toBe(true)
    })

    it('hides the hint once at least one context exists', () => {
      expect(shouldShowAddContextHint(1, false)).toBe(false)
    })

    it('hides the hint while a name field is open, even on an empty canvas', () => {
      expect(shouldShowAddContextHint(0, true)).toBe(false)
    })
  })
})
