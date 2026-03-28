import * as Y from 'yjs'
import type { Project } from '../types'
import { populateContextYMap, yMapToContext } from './contextSync'
import { populateRelationshipYMap, yMapToRelationship } from './relationshipSync'
import { populateGroupYMap, yMapToGroup } from './groupSync'
import { populateFlowStageYMap, yMapToFlowStage } from './flowSync'
import {
  populateRepoYMap,
  populatePersonYMap,
  populateTeamYMap,
  yMapToRepo,
  yMapToPerson,
  yMapToTeam,
} from './metadataSync'
import {
  populateUserYMap,
  populateUserNeedYMap,
  populateUserNeedConnectionYMap,
  populateNeedContextConnectionYMap,
  populateTemporalKeyframeYMap,
  yMapToUser,
  yMapToUserNeed,
  yMapToUserNeedConnection,
  yMapToNeedContextConnection,
  yMapToTemporalKeyframe,
} from './strategicSync'
import {
  populateDomainEventYMap,
  populateCommandYMap,
  populateESAggregateYMap,
  populatePolicyYMap,
  populateESHotSpotYMap,
  populatePivotalEventYMap,
  yMapToDomainEvent,
  yMapToCommand,
  yMapToESAggregate,
  yMapToPolicy,
  yMapToESHotSpot,
  yMapToPivotalEvent,
  populateESConnectionYMap,
  yMapToESConnection,
} from './eventStormingSync'

export function projectToYDoc(project: Project): Y.Doc {
  const doc = new Y.Doc()
  populateYDocWithProject(doc, project)
  return doc
}

/**
 * Populates an existing Y.Doc with project data.
 * Use this to initialize a network-connected Y.Doc that may be empty.
 * Only populates if the Y.Doc doesn't already have an 'id' field.
 */
export function populateYDocWithProject(doc: Y.Doc, project: Project): void {
  const yProject = doc.getMap('project')

  // Only populate if the doc is empty (no id set)
  if (yProject.has('id')) {
    return
  }

  setScalarFields(yProject, project)
  setEntityArrays(yProject, project)
  setViewConfig(yProject, project)
  setTemporal(yProject, project)
  setEventStorming(yProject, project)
}

export function yDocToProject(doc: Y.Doc): Project {
  const yProject = doc.getMap('project')

  const project: Project = {
    id: yProject.get('id') as string,
    name: yProject.get('name') as string,
    contexts: extractArray(yProject, 'contexts', yMapToContext),
    relationships: extractArray(yProject, 'relationships', yMapToRelationship),
    repos: extractArray(yProject, 'repos', yMapToRepo),
    people: extractArray(yProject, 'people', yMapToPerson),
    teams: extractArray(yProject, 'teams', yMapToTeam),
    groups: extractArray(yProject, 'groups', yMapToGroup),
    users: extractArray(yProject, 'users', yMapToUser),
    userNeeds: extractArray(yProject, 'userNeeds', yMapToUserNeed),
    userNeedConnections: extractArray(yProject, 'userNeedConnections', yMapToUserNeedConnection),
    needContextConnections: extractArray(
      yProject,
      'needContextConnections',
      yMapToNeedContextConnection
    ),
    viewConfig: extractViewConfig(yProject),
  }

  const version = yProject.get('version')
  if (version !== null) {
    project.version = version as number
  }

  const createdAt = yProject.get('createdAt')
  if (createdAt !== null) {
    project.createdAt = createdAt as string
  }

  const updatedAt = yProject.get('updatedAt')
  if (updatedAt !== null) {
    project.updatedAt = updatedAt as string
  }

  const temporal = extractTemporal(yProject)
  if (temporal !== null) {
    project.temporal = temporal
  }

  const eventStorming = extractEventStorming(yProject)
  if (eventStorming !== null) {
    project.eventStorming = eventStorming
  }

  return project
}

function setScalarFields(yProject: Y.Map<unknown>, project: Project): void {
  yProject.set('id', project.id)
  yProject.set('name', project.name)
  yProject.set('version', project.version ?? null)
  yProject.set('createdAt', project.createdAt ?? null)
  yProject.set('updatedAt', project.updatedAt ?? null)
}

function setEntityArrays(yProject: Y.Map<unknown>, project: Project): void {
  yProject.set('contexts', createEntityArray(project.contexts, populateContextYMap))
  yProject.set('relationships', createEntityArray(project.relationships, populateRelationshipYMap))
  yProject.set('repos', createEntityArray(project.repos, populateRepoYMap))
  yProject.set('people', createEntityArray(project.people, populatePersonYMap))
  yProject.set('teams', createEntityArray(project.teams, populateTeamYMap))
  yProject.set('groups', createEntityArray(project.groups, populateGroupYMap))
  yProject.set('users', createEntityArray(project.users, populateUserYMap))
  yProject.set('userNeeds', createEntityArray(project.userNeeds, populateUserNeedYMap))
  yProject.set(
    'userNeedConnections',
    createEntityArray(project.userNeedConnections, populateUserNeedConnectionYMap)
  )
  yProject.set(
    'needContextConnections',
    createEntityArray(project.needContextConnections, populateNeedContextConnectionYMap)
  )
}

function setViewConfig(yProject: Y.Map<unknown>, project: Project): void {
  const yViewConfig = new Y.Map<unknown>()
  yViewConfig.set(
    'flowStages',
    createEntityArray(project.viewConfig.flowStages, populateFlowStageYMap)
  )
  yProject.set('viewConfig', yViewConfig)
}

function setTemporal(yProject: Y.Map<unknown>, project: Project): void {
  if (!project.temporal) {
    yProject.set('temporal', null)
    return
  }

  const yTemporal = new Y.Map<unknown>()
  yTemporal.set('enabled', project.temporal.enabled)
  yTemporal.set(
    'keyframes',
    createEntityArray(project.temporal.keyframes, populateTemporalKeyframeYMap)
  )
  yProject.set('temporal', yTemporal)
}

function createEntityArray<T>(
  entities: T[],
  populateFn: (yMap: Y.Map<unknown>, entity: T) => void
): Y.Array<Y.Map<unknown>> {
  const yArray = new Y.Array<Y.Map<unknown>>()
  for (const entity of entities) {
    const yMap = new Y.Map<unknown>()
    populateFn(yMap, entity)
    yArray.push([yMap])
  }
  return yArray
}

function extractArray<T>(
  yProject: Y.Map<unknown>,
  key: string,
  fromYMap: (yMap: Y.Map<unknown>) => T
): T[] {
  const yArray = yProject.get(key) as Y.Array<Y.Map<unknown>>
  const result: T[] = []
  for (let i = 0; i < yArray.length; i++) {
    result.push(fromYMap(yArray.get(i)))
  }
  return result
}

function extractViewConfig(yProject: Y.Map<unknown>): Project['viewConfig'] {
  const yViewConfig = yProject.get('viewConfig') as Y.Map<unknown>
  const yFlowStages = yViewConfig.get('flowStages') as Y.Array<Y.Map<unknown>>

  const flowStages = []
  for (let i = 0; i < yFlowStages.length; i++) {
    flowStages.push(yMapToFlowStage(yFlowStages.get(i)))
  }

  return { flowStages }
}

function extractTemporal(yProject: Y.Map<unknown>): Project['temporal'] | null {
  const yTemporal = yProject.get('temporal')
  if (yTemporal === null) {
    return null
  }

  const yTemporalMap = yTemporal as Y.Map<unknown>
  const yKeyframes = yTemporalMap.get('keyframes') as Y.Array<Y.Map<unknown>>

  const keyframes = []
  for (let i = 0; i < yKeyframes.length; i++) {
    keyframes.push(yMapToTemporalKeyframe(yKeyframes.get(i)))
  }

  return {
    enabled: yTemporalMap.get('enabled') as boolean,
    keyframes,
  }
}

function setEventStorming(yProject: Y.Map<unknown>, project: Project): void {
  if (!project.eventStorming) {
    yProject.set('eventStorming', null)
    return
  }

  const yES = new Y.Map<unknown>()
  yES.set('enabled', project.eventStorming.enabled)
  yES.set(
    'domainEvents',
    createEntityArray(project.eventStorming.domainEvents, populateDomainEventYMap)
  )
  yES.set('commands', createEntityArray(project.eventStorming.commands, populateCommandYMap))
  yES.set(
    'aggregates',
    createEntityArray(project.eventStorming.aggregates, populateESAggregateYMap)
  )
  yES.set('policies', createEntityArray(project.eventStorming.policies, populatePolicyYMap))
  yES.set('hotSpots', createEntityArray(project.eventStorming.hotSpots, populateESHotSpotYMap))
  yES.set(
    'pivotalEvents',
    createEntityArray(project.eventStorming.pivotalEvents, populatePivotalEventYMap)
  )
  yES.set(
    'connections',
    createEntityArray(project.eventStorming.connections, populateESConnectionYMap)
  )
  yProject.set('eventStorming', yES)
}

function extractEventStorming(yProject: Y.Map<unknown>): Project['eventStorming'] | null {
  const yES = yProject.get('eventStorming')
  if (yES === null || yES === undefined) {
    return null
  }

  const yESMap = yES as Y.Map<unknown>

  return {
    enabled: yESMap.get('enabled') as boolean,
    domainEvents: extractArray(yESMap, 'domainEvents', yMapToDomainEvent),
    commands: extractArray(yESMap, 'commands', yMapToCommand),
    aggregates: extractArray(yESMap, 'aggregates', yMapToESAggregate),
    policies: extractArray(yESMap, 'policies', yMapToPolicy),
    hotSpots: extractArray(yESMap, 'hotSpots', yMapToESHotSpot),
    pivotalEvents: extractArray(yESMap, 'pivotalEvents', yMapToPivotalEvent),
    connections: yESMap.has('connections')
      ? extractArray(yESMap, 'connections', yMapToESConnection)
      : [],
  }
}
