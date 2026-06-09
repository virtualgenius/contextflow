import { describe, it, expect } from 'vitest'
import {
  perSideRelationshipConcept,
  RELATIONSHIP_PATTERNS,
  UPSTREAM_DOWNSTREAM,
} from '../conceptDefinitions'

describe('perSideRelationshipConcept', () => {
  it('returns null when neither side has a role', () => {
    expect(perSideRelationshipConcept(undefined, undefined)).toBeNull()
  })

  it('returns the upstream role definition when only the upstream side is set', () => {
    expect(perSideRelationshipConcept('open-host-service', undefined)).toEqual(
      RELATIONSHIP_PATTERNS['open-host-service']
    )
  })

  it('returns the downstream role definition when only the downstream side is set', () => {
    expect(perSideRelationshipConcept(undefined, 'conformist')).toEqual(
      RELATIONSHIP_PATTERNS['conformist']
    )
  })

  it('ignores an unknown role string', () => {
    expect(perSideRelationshipConcept('not-a-role', undefined)).toBeNull()
  })

  it('merges both sides into one definition with deduped characteristics', () => {
    const merged = perSideRelationshipConcept('open-host-service', 'anti-corruption-layer')
    expect(merged).not.toBeNull()
    expect(merged!.title).toBe('Open Host Service + Anti-Corruption Layer')

    const ohs = RELATIONSHIP_PATTERNS['open-host-service']
    const acl = RELATIONSHIP_PATTERNS['anti-corruption-layer']
    expect(merged!.description).toBe(`${ohs.description} ${acl.description}`)

    // Both definitions share the "↑ Upstream has control..." bullet; it appears once.
    const sharedBullet = '↑ Upstream has control over the relationship'
    const occurrences = merged!.characteristics!.filter((c) => c === sharedBullet).length
    expect(occurrences).toBe(1)
  })
})

describe('UPSTREAM_DOWNSTREAM concept', () => {
  it('frames the relationship as influence/power, not data flow', () => {
    expect(UPSTREAM_DOWNSTREAM.title).toBe('Upstream / Downstream')
    expect(UPSTREAM_DOWNSTREAM.description.toLowerCase()).toContain('influence')
  })

  it('does not overstate the imbalance: downstream sway depends on the pattern', () => {
    const text = (
      UPSTREAM_DOWNSTREAM.description +
      ' ' +
      (UPSTREAM_DOWNSTREAM.characteristics ?? []).join(' ')
    ).toLowerCase()
    expect(text).not.toContain('little sway')
    expect(text).toContain('pattern')
  })
})
