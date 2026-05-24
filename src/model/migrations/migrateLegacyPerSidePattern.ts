import type { Relationship, UpstreamRole, DownstreamRole } from '../types'

const UPSTREAM_ROLE_PATTERNS: ReadonlyArray<UpstreamRole> = [
  'open-host-service',
  'published-language',
]
const DOWNSTREAM_ROLE_PATTERNS: ReadonlyArray<DownstreamRole> = [
  'conformist',
  'anti-corruption-layer',
]

function isUpstreamRolePattern(pattern: string): pattern is UpstreamRole {
  return (UPSTREAM_ROLE_PATTERNS as ReadonlyArray<string>).includes(pattern)
}

function isDownstreamRolePattern(pattern: string): pattern is DownstreamRole {
  return (DOWNSTREAM_ROLE_PATTERNS as ReadonlyArray<string>).includes(pattern)
}

/**
 * Legacy relationship shape with the pre-Slice-8 wider pattern union.
 *
 * On-disk data may carry deprecated pattern values (the four per-side roles plus
 * `separate-ways`). The migration accepts this wider input so tests and the
 * persistence load path can still describe legacy data without fighting the
 * narrowed runtime `Relationship.pattern` union.
 */
export type LegacyRelationship = Omit<Relationship, 'pattern'> & {
  pattern?:
    | NonNullable<Relationship['pattern']>
    | 'conformist'
    | 'anti-corruption-layer'
    | 'open-host-service'
    | 'published-language'
    | 'separate-ways'
}

/**
 * Phase-1 + Slice 8 migration: move legacy per-side pattern values into the per-side
 * role fields, and drop relationships that carried the deprecated `separate-ways`
 * pattern.
 *
 * Before the two-sided relationship model (contextflow-ki1), the four per-side roles
 * (Open Host Service, Published Language, Conformist, Anti-Corruption Layer) were stored
 * on `Relationship.pattern`. The new picker only surfaces Partnership and Customer-Supplier
 * as pickable patterns, so legacy values become unreachable from the UI.
 *
 * Returns `null` when the input relationship should be removed entirely (currently only
 * `separate-ways`, which is no longer a representable pattern).
 *
 * Preserves any user-set role; never overwrites. Idempotent. Leaves `shared-kernel`,
 * `customer-supplier`, and `partnership` alone.
 */
export function migrateLegacyPerSidePattern(relationship: LegacyRelationship): Relationship | null {
  const pattern = relationship.pattern
  if (!pattern) return relationship as Relationship

  if (pattern === 'separate-ways') {
    return null
  }

  if (isUpstreamRolePattern(pattern)) {
    const next: Relationship = { ...(relationship as Relationship), pattern: undefined }
    if (!relationship.upstreamRole) {
      next.upstreamRole = pattern
    }
    return next
  }

  if (isDownstreamRolePattern(pattern)) {
    const next: Relationship = { ...(relationship as Relationship), pattern: undefined }
    if (!relationship.downstreamRole) {
      next.downstreamRole = pattern
    }
    return next
  }

  return relationship as Relationship
}
