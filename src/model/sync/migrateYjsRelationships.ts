import * as Y from 'yjs'

const UPSTREAM_ROLE_PATTERNS = ['open-host-service', 'published-language'] as const
const DOWNSTREAM_ROLE_PATTERNS = ['conformist', 'anti-corruption-layer'] as const

type UpstreamRolePattern = (typeof UPSTREAM_ROLE_PATTERNS)[number]
type DownstreamRolePattern = (typeof DOWNSTREAM_ROLE_PATTERNS)[number]

function isUpstreamRolePattern(value: unknown): value is UpstreamRolePattern {
  return (
    typeof value === 'string' && (UPSTREAM_ROLE_PATTERNS as ReadonlyArray<string>).includes(value)
  )
}

function isDownstreamRolePattern(value: unknown): value is DownstreamRolePattern {
  return (
    typeof value === 'string' && (DOWNSTREAM_ROLE_PATTERNS as ReadonlyArray<string>).includes(value)
  )
}

interface RelationshipPlan {
  index: number
  yMap: Y.Map<unknown>
  kind: 'set-upstream-role' | 'set-downstream-role' | 'delete'
  role?: UpstreamRolePattern | DownstreamRolePattern
}

function planRelationshipMigrations(yRelationships: Y.Array<Y.Map<unknown>>): RelationshipPlan[] {
  const plans: RelationshipPlan[] = []
  for (let i = 0; i < yRelationships.length; i++) {
    const yMap = yRelationships.get(i)
    const pattern = yMap.get('pattern')

    if (pattern === 'separate-ways') {
      plans.push({ index: i, yMap, kind: 'delete' })
      continue
    }

    if (isUpstreamRolePattern(pattern)) {
      const existingRole = yMap.get('upstreamRole')
      if (existingRole == null) {
        plans.push({ index: i, yMap, kind: 'set-upstream-role', role: pattern })
      } else {
        plans.push({ index: i, yMap, kind: 'set-upstream-role' })
      }
      continue
    }

    if (isDownstreamRolePattern(pattern)) {
      const existingRole = yMap.get('downstreamRole')
      if (existingRole == null) {
        plans.push({ index: i, yMap, kind: 'set-downstream-role', role: pattern })
      } else {
        plans.push({ index: i, yMap, kind: 'set-downstream-role' })
      }
    }
  }
  return plans
}

/**
 * Slice 8 read-path migration for Yjs documents.
 *
 * Mutates the project YDoc in place so that any relationship YMap carrying a deprecated
 * pattern value is reshaped to match the narrowed runtime model:
 *
 * - open-host-service / published-language: sets upstreamRole (if absent) and clears pattern
 * - conformist / anti-corruption-layer: sets downstreamRole (if absent) and clears pattern
 * - separate-ways: removes the relationship YMap from the YArray
 *
 * All mutations run inside a single Y.transaction so observing clients receive one update.
 * If nothing needs migrating, no transaction runs (idempotent no-op on a clean doc).
 *
 * Iterates indices from highest to lowest when applying deletions so unvisited entries
 * do not shift.
 */
export function migrateYjsRelationships(yProject: Y.Map<unknown>): void {
  const yRelationships = yProject.get('relationships') as Y.Array<Y.Map<unknown>> | undefined
  if (!yRelationships) return

  const plans = planRelationshipMigrations(yRelationships)
  if (plans.length === 0) return

  const doc = yProject.doc
  if (!doc) return

  doc.transact(() => {
    // Apply set operations first (order-independent), then deletions from high to low.
    for (const plan of plans) {
      if (plan.kind === 'set-upstream-role') {
        if (plan.role !== undefined) {
          plan.yMap.set('upstreamRole', plan.role)
        }
        plan.yMap.set('pattern', null)
      } else if (plan.kind === 'set-downstream-role') {
        if (plan.role !== undefined) {
          plan.yMap.set('downstreamRole', plan.role)
        }
        plan.yMap.set('pattern', null)
      }
    }

    const deletions = plans
      .filter((p) => p.kind === 'delete')
      .map((p) => p.index)
      .sort((a, b) => b - a)
    for (const index of deletions) {
      yRelationships.delete(index, 1)
    }
  })
}
