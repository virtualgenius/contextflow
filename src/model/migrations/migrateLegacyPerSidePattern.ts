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
 * Phase-1 migration: move legacy per-side pattern values into the per-side role fields.
 *
 * Before the two-sided relationship model (contextflow-ki1), the four per-side roles
 * (Open Host Service, Published Language, Conformist, Anti-Corruption Layer) were stored
 * on `Relationship.pattern`. The new picker only surfaces Partnership and Customer-Supplier
 * as pickable patterns, so legacy values become unreachable from the UI and the Slice 2
 * fallback continues to render their indicator boxes even after the user clears the
 * corresponding role pill.
 *
 * Move the value to the matching role field and clear `pattern`. Preserve any user-set
 * role; never overwrite. Idempotent. Leaves `shared-kernel` and `separate-ways` alone
 * (those belong to the full Slice 8 migration in `contextflow-jf0`).
 */
export function migrateLegacyPerSidePattern(relationship: Relationship): Relationship {
  const pattern = relationship.pattern
  if (!pattern) return relationship

  if (isUpstreamRolePattern(pattern)) {
    const next: Relationship = { ...relationship, pattern: undefined }
    if (!relationship.upstreamRole) {
      next.upstreamRole = pattern
    }
    return next
  }

  if (isDownstreamRolePattern(pattern)) {
    const next: Relationship = { ...relationship, pattern: undefined }
    if (!relationship.downstreamRole) {
      next.downstreamRole = pattern
    }
    return next
  }

  return relationship
}
