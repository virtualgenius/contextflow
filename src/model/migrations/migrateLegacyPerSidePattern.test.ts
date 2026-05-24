import { describe, it, expect } from 'vitest'
import { migrateLegacyPerSidePattern, type LegacyRelationship } from './migrateLegacyPerSidePattern'

function rel(overrides: Partial<LegacyRelationship>): LegacyRelationship {
  return {
    id: 'rel-1',
    fromContextId: 'a',
    toContextId: 'b',
    ...overrides,
  }
}

describe('migrateLegacyPerSidePattern', () => {
  it('moves legacy open-host-service pattern to upstreamRole and clears pattern', () => {
    const out = migrateLegacyPerSidePattern(rel({ pattern: 'open-host-service' }))!
    expect(out.pattern).toBeUndefined()
    expect(out.upstreamRole).toBe('open-host-service')
  })

  it('moves legacy published-language pattern to upstreamRole and clears pattern', () => {
    const out = migrateLegacyPerSidePattern(rel({ pattern: 'published-language' }))!
    expect(out.pattern).toBeUndefined()
    expect(out.upstreamRole).toBe('published-language')
  })

  it('moves legacy conformist pattern to downstreamRole and clears pattern', () => {
    const out = migrateLegacyPerSidePattern(rel({ pattern: 'conformist' }))!
    expect(out.pattern).toBeUndefined()
    expect(out.downstreamRole).toBe('conformist')
  })

  it('moves legacy anti-corruption-layer pattern to downstreamRole and clears pattern', () => {
    const out = migrateLegacyPerSidePattern(rel({ pattern: 'anti-corruption-layer' }))!
    expect(out.pattern).toBeUndefined()
    expect(out.downstreamRole).toBe('anti-corruption-layer')
  })

  it('clears pattern but preserves an already-set upstreamRole', () => {
    const out = migrateLegacyPerSidePattern(
      rel({ pattern: 'open-host-service', upstreamRole: 'published-language' })
    )!
    expect(out.pattern).toBeUndefined()
    expect(out.upstreamRole).toBe('published-language')
  })

  it('clears pattern but preserves an already-set downstreamRole', () => {
    const out = migrateLegacyPerSidePattern(
      rel({ pattern: 'anti-corruption-layer', downstreamRole: 'conformist' })
    )!
    expect(out.pattern).toBeUndefined()
    expect(out.downstreamRole).toBe('conformist')
  })

  it('leaves customer-supplier pattern unchanged', () => {
    const input = rel({ pattern: 'customer-supplier' })
    const out = migrateLegacyPerSidePattern(input)!
    expect(out.pattern).toBe('customer-supplier')
    expect(out.upstreamRole).toBeUndefined()
    expect(out.downstreamRole).toBeUndefined()
  })

  it('leaves partnership pattern unchanged', () => {
    const out = migrateLegacyPerSidePattern(rel({ pattern: 'partnership' }))!
    expect(out.pattern).toBe('partnership')
  })

  it('leaves shared-kernel pattern unchanged (Slice 8 territory)', () => {
    const out = migrateLegacyPerSidePattern(rel({ pattern: 'shared-kernel' }))!
    expect(out.pattern).toBe('shared-kernel')
  })

  it('returns null for separate-ways (relationship is dropped)', () => {
    expect(migrateLegacyPerSidePattern(rel({ pattern: 'separate-ways' }))).toBeNull()
  })

  it('leaves an already-migrated relationship unchanged (idempotent)', () => {
    const input = rel({ upstreamRole: 'open-host-service' })
    const out = migrateLegacyPerSidePattern(input)
    expect(out).not.toBeNull()
    expect(out!.pattern).toBeUndefined()
    expect(out!.upstreamRole).toBe('open-host-service')
    expect(out!.downstreamRole).toBeUndefined()
  })

  it('returns the input reference when there is no work to do', () => {
    const input = rel({ pattern: 'customer-supplier' })
    expect(migrateLegacyPerSidePattern(input)).toBe(input)
  })

  it('does not mutate the input', () => {
    const input = rel({ pattern: 'anti-corruption-layer' })
    const before = JSON.stringify(input)
    migrateLegacyPerSidePattern(input)
    expect(JSON.stringify(input)).toBe(before)
  })
})
