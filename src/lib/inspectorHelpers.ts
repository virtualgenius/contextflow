import type { Project, User, Relationship } from '../model/types'

export function getConnectedUsers(project: Project, contextId: string): User[] {
  const needContextConns = (project.needContextConnections || []).filter(
    (nc) => nc.contextId === contextId
  )
  const connectedUserNeedIds = new Set(needContextConns.map((nc) => nc.userNeedId))
  const userNeedConns = (project.userNeedConnections || []).filter((uc) =>
    connectedUserNeedIds.has(uc.userNeedId)
  )
  const uniqueUserIds = [...new Set(userNeedConns.map((uc) => uc.userId))]
  return uniqueUserIds
    .map((userId) => project.users?.find((u) => u.id === userId))
    .filter((user): user is User => !!user)
}

export interface CategorizedRelationships {
  upstream: Relationship[]
  downstream: Relationship[]
  mutual: Relationship[]
}

function isSymmetricPattern(pattern: string): boolean {
  return pattern === 'shared-kernel' || pattern === 'partnership'
}

export function categorizeRelationships(
  relationships: Relationship[],
  contextId: string
): CategorizedRelationships {
  const upstream = relationships.filter(
    (r) => r.fromContextId === contextId && !isSymmetricPattern(r.pattern)
  )
  const downstream = relationships.filter(
    (r) => r.toContextId === contextId && !isSymmetricPattern(r.pattern)
  )
  const mutual = relationships.filter(
    (r) =>
      (r.fromContextId === contextId || r.toContextId === contextId) &&
      isSymmetricPattern(r.pattern)
  )
  return { upstream, downstream, mutual }
}
