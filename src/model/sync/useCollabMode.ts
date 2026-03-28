import * as Y from 'yjs'
import type {
  Project,
  BoundedContext,
  Relationship,
  Group,
  FlowStageMarker,
  User,
  UserNeed,
  UserNeedConnection,
  NeedContextConnection,
  TemporalKeyframe,
  Team,
  Repo,
  Person,
  Issue,
  IssueSeverity,
  DomainEvent,
  Command,
  ESAggregate,
  Policy,
  ESHotSpot,
  PivotalEvent,
  ESConnection,
} from '../types'
import {
  useCollabStore,
  createCollabStoreFromYDoc,
  type CollabStore,
  type CollabStoreOptions,
} from './useCollabStore'

let collabStore: CollabStore | null = null

export interface CollabMutations {
  addContext(context: BoundedContext): void
  updateContext(contextId: string, updates: Partial<BoundedContext>): void
  deleteContext(contextId: string): void
  updateContextPosition(contextId: string, positions: BoundedContext['positions']): void
  addContextIssue(contextId: string, title: string, severity?: IssueSeverity): Issue | undefined
  updateContextIssue(contextId: string, issueId: string, updates: Partial<Issue>): void
  deleteContextIssue(contextId: string, issueId: string): void
  addRelationship(relationship: Relationship): void
  updateRelationship(relationshipId: string, updates: Partial<Relationship>): void
  deleteRelationship(relationshipId: string): void
  addGroup(group: Group): void
  updateGroup(groupId: string, updates: Partial<Group>): void
  deleteGroup(groupId: string): void
  addContextToGroup(groupId: string, contextId: string): void
  addContextsToGroup(groupId: string, contextIds: string[]): void
  removeContextFromGroup(groupId: string, contextId: string): void
  addFlowStage(stage: FlowStageMarker): void
  updateFlowStage(stageIndex: number, updates: Partial<FlowStageMarker>): void
  deleteFlowStage(stageIndex: number): void
  addUser(user: User): void
  updateUser(userId: string, updates: Partial<User>): void
  deleteUser(userId: string): void
  updateUserPosition(userId: string, position: number): void
  addUserNeed(userNeed: UserNeed): void
  updateUserNeed(userNeedId: string, updates: Partial<UserNeed>): void
  deleteUserNeed(userNeedId: string): void
  updateUserNeedPosition(userNeedId: string, position: number): void
  addUserNeedConnection(connection: UserNeedConnection): void
  updateUserNeedConnection(connectionId: string, updates: Partial<UserNeedConnection>): void
  deleteUserNeedConnection(connectionId: string): void
  addNeedContextConnection(connection: NeedContextConnection): void
  updateNeedContextConnection(connectionId: string, updates: Partial<NeedContextConnection>): void
  deleteNeedContextConnection(connectionId: string): void
  addKeyframe(keyframe: TemporalKeyframe): void
  updateKeyframe(keyframeId: string, updates: Partial<TemporalKeyframe>): void
  deleteKeyframe(keyframeId: string): void
  updateKeyframeContextPosition(
    keyframeId: string,
    contextId: string,
    position: { x: number; y: number }
  ): void
  toggleTemporal(enabled: boolean): void
  addTeam(team: Team): void
  updateTeam(teamId: string, updates: Partial<Team>): void
  deleteTeam(teamId: string): void
  addRepo(repo: Repo): void
  updateRepo(repoId: string, updates: Partial<Repo>): void
  deleteRepo(repoId: string): void
  addPerson(person: Person): void
  updatePerson(personId: string, updates: Partial<Person>): void
  deletePerson(personId: string): void
  renameProject(name: string): void
  // Event Storming mutations
  toggleEventStorming(): void
  addDomainEvent(event: DomainEvent): void
  updateDomainEvent(eventId: string, updates: Partial<DomainEvent>): void
  deleteDomainEvent(eventId: string): void
  addCommand(command: Command): void
  updateCommand(commandId: string, updates: Partial<Command>): void
  deleteCommand(commandId: string): void
  addESAggregate(aggregate: ESAggregate): void
  updateESAggregate(aggregateId: string, updates: Partial<ESAggregate>): void
  deleteESAggregate(aggregateId: string): void
  addPolicy(policy: Policy): void
  updatePolicy(policyId: string, updates: Partial<Policy>): void
  deletePolicy(policyId: string): void
  addESHotSpot(hotSpot: ESHotSpot): void
  updateESHotSpot(hotSpotId: string, updates: Partial<ESHotSpot>): void
  deleteESHotSpot(hotSpotId: string): void
  addPivotalEvent(event: PivotalEvent): void
  updatePivotalEvent(eventId: string, updates: Partial<PivotalEvent>): void
  deletePivotalEvent(eventId: string): void
  addESConnection(connection: ESConnection): void
  updateESConnection(connectionId: string, updates: Partial<ESConnection>): void
  deleteESConnection(connectionId: string): void
}

export interface CollabUndoRedo {
  canUndo: boolean | null
  canRedo: boolean | null
  undo(): void
  redo(): void
}

export function initializeCollabMode(project: Project, options: CollabStoreOptions = {}): void {
  if (collabStore) {
    collabStore.destroy()
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks -- useCollabStore is a factory, not a React hook
  collabStore = useCollabStore(project, options)
}

/**
 * Initialize collab mode with an existing Y.Doc from a network provider.
 * Use this when connecting to a shared project via WebSocket.
 */
export function initializeCollabModeWithYDoc(ydoc: Y.Doc, options: CollabStoreOptions = {}): void {
  if (collabStore) {
    collabStore.destroy()
  }
  collabStore = createCollabStoreFromYDoc(ydoc, options)
}

export function destroyCollabMode(): void {
  if (collabStore) {
    collabStore.destroy()
    collabStore = null
  }
}

export function getCollabStore(): CollabStore | null {
  return collabStore
}

export function isCollabModeActive(): boolean {
  return collabStore !== null
}

export function getCollabMutations(): CollabMutations {
  return {
    addContext(context: BoundedContext): void {
      collabStore?.addContext(context)
    },
    updateContext(contextId: string, updates: Partial<BoundedContext>): void {
      collabStore?.updateContext(contextId, updates)
    },
    deleteContext(contextId: string): void {
      collabStore?.deleteContext(contextId)
    },
    updateContextPosition(contextId: string, positions: BoundedContext['positions']): void {
      collabStore?.updateContextPosition(contextId, positions)
    },
    addContextIssue(contextId: string, title: string, severity?: IssueSeverity): Issue | undefined {
      return collabStore?.addContextIssue(contextId, title, severity)
    },
    updateContextIssue(contextId: string, issueId: string, updates: Partial<Issue>): void {
      collabStore?.updateContextIssue(contextId, issueId, updates)
    },
    deleteContextIssue(contextId: string, issueId: string): void {
      collabStore?.deleteContextIssue(contextId, issueId)
    },
    addRelationship(relationship: Relationship): void {
      collabStore?.addRelationship(relationship)
    },
    updateRelationship(relationshipId: string, updates: Partial<Relationship>): void {
      collabStore?.updateRelationship(relationshipId, updates)
    },
    deleteRelationship(relationshipId: string): void {
      collabStore?.deleteRelationship(relationshipId)
    },
    addGroup(group: Group): void {
      collabStore?.addGroup(group)
    },
    updateGroup(groupId: string, updates: Partial<Group>): void {
      collabStore?.updateGroup(groupId, updates)
    },
    deleteGroup(groupId: string): void {
      collabStore?.deleteGroup(groupId)
    },
    addContextToGroup(groupId: string, contextId: string): void {
      collabStore?.addContextToGroup(groupId, contextId)
    },
    addContextsToGroup(groupId: string, contextIds: string[]): void {
      collabStore?.addContextsToGroup(groupId, contextIds)
    },
    removeContextFromGroup(groupId: string, contextId: string): void {
      collabStore?.removeContextFromGroup(groupId, contextId)
    },
    addFlowStage(stage: FlowStageMarker): void {
      collabStore?.addFlowStage(stage)
    },
    updateFlowStage(stageIndex: number, updates: Partial<FlowStageMarker>): void {
      collabStore?.updateFlowStage(stageIndex, updates)
    },
    deleteFlowStage(stageIndex: number): void {
      collabStore?.deleteFlowStage(stageIndex)
    },
    addUser(user: User): void {
      collabStore?.addUser(user)
    },
    updateUser(userId: string, updates: Partial<User>): void {
      collabStore?.updateUser(userId, updates)
    },
    deleteUser(userId: string): void {
      collabStore?.deleteUser(userId)
    },
    updateUserPosition(userId: string, position: number): void {
      collabStore?.updateUserPosition(userId, position)
    },
    addUserNeed(userNeed: UserNeed): void {
      collabStore?.addUserNeed(userNeed)
    },
    updateUserNeed(userNeedId: string, updates: Partial<UserNeed>): void {
      collabStore?.updateUserNeed(userNeedId, updates)
    },
    deleteUserNeed(userNeedId: string): void {
      collabStore?.deleteUserNeed(userNeedId)
    },
    updateUserNeedPosition(userNeedId: string, position: number): void {
      collabStore?.updateUserNeedPosition(userNeedId, position)
    },
    addUserNeedConnection(connection: UserNeedConnection): void {
      collabStore?.addUserNeedConnection(connection)
    },
    updateUserNeedConnection(connectionId: string, updates: Partial<UserNeedConnection>): void {
      collabStore?.updateUserNeedConnection(connectionId, updates)
    },
    deleteUserNeedConnection(connectionId: string): void {
      collabStore?.deleteUserNeedConnection(connectionId)
    },
    addNeedContextConnection(connection: NeedContextConnection): void {
      collabStore?.addNeedContextConnection(connection)
    },
    updateNeedContextConnection(
      connectionId: string,
      updates: Partial<NeedContextConnection>
    ): void {
      collabStore?.updateNeedContextConnection(connectionId, updates)
    },
    deleteNeedContextConnection(connectionId: string): void {
      collabStore?.deleteNeedContextConnection(connectionId)
    },
    addKeyframe(keyframe: TemporalKeyframe): void {
      collabStore?.addKeyframe(keyframe)
    },
    updateKeyframe(keyframeId: string, updates: Partial<TemporalKeyframe>): void {
      collabStore?.updateKeyframe(keyframeId, updates)
    },
    deleteKeyframe(keyframeId: string): void {
      collabStore?.deleteKeyframe(keyframeId)
    },
    updateKeyframeContextPosition(
      keyframeId: string,
      contextId: string,
      position: { x: number; y: number }
    ): void {
      collabStore?.updateKeyframeContextPosition(keyframeId, contextId, position)
    },
    toggleTemporal(enabled: boolean): void {
      collabStore?.toggleTemporal(enabled)
    },
    addTeam(team: Team): void {
      collabStore?.addTeam(team)
    },
    updateTeam(teamId: string, updates: Partial<Team>): void {
      collabStore?.updateTeam(teamId, updates)
    },
    deleteTeam(teamId: string): void {
      collabStore?.deleteTeam(teamId)
    },
    addRepo(repo: Repo): void {
      collabStore?.addRepo(repo)
    },
    updateRepo(repoId: string, updates: Partial<Repo>): void {
      collabStore?.updateRepo(repoId, updates)
    },
    deleteRepo(repoId: string): void {
      collabStore?.deleteRepo(repoId)
    },
    addPerson(person: Person): void {
      collabStore?.addPerson(person)
    },
    updatePerson(personId: string, updates: Partial<Person>): void {
      collabStore?.updatePerson(personId, updates)
    },
    deletePerson(personId: string): void {
      collabStore?.deletePerson(personId)
    },
    renameProject(name: string): void {
      collabStore?.renameProject(name)
    },
    // Event Storming mutations
    toggleEventStorming(): void {
      collabStore?.toggleEventStorming()
    },
    addDomainEvent(event: DomainEvent): void {
      collabStore?.addDomainEvent(event)
    },
    updateDomainEvent(eventId: string, updates: Partial<DomainEvent>): void {
      collabStore?.updateDomainEvent(eventId, updates)
    },
    deleteDomainEvent(eventId: string): void {
      collabStore?.deleteDomainEvent(eventId)
    },
    addCommand(command: Command): void {
      collabStore?.addCommand(command)
    },
    updateCommand(commandId: string, updates: Partial<Command>): void {
      collabStore?.updateCommand(commandId, updates)
    },
    deleteCommand(commandId: string): void {
      collabStore?.deleteCommand(commandId)
    },
    addESAggregate(aggregate: ESAggregate): void {
      collabStore?.addESAggregate(aggregate)
    },
    updateESAggregate(aggregateId: string, updates: Partial<ESAggregate>): void {
      collabStore?.updateESAggregate(aggregateId, updates)
    },
    deleteESAggregate(aggregateId: string): void {
      collabStore?.deleteESAggregate(aggregateId)
    },
    addPolicy(policy: Policy): void {
      collabStore?.addPolicy(policy)
    },
    updatePolicy(policyId: string, updates: Partial<Policy>): void {
      collabStore?.updatePolicy(policyId, updates)
    },
    deletePolicy(policyId: string): void {
      collabStore?.deletePolicy(policyId)
    },
    addESHotSpot(hotSpot: ESHotSpot): void {
      collabStore?.addESHotSpot(hotSpot)
    },
    updateESHotSpot(hotSpotId: string, updates: Partial<ESHotSpot>): void {
      collabStore?.updateESHotSpot(hotSpotId, updates)
    },
    deleteESHotSpot(hotSpotId: string): void {
      collabStore?.deleteESHotSpot(hotSpotId)
    },
    addPivotalEvent(event: PivotalEvent): void {
      collabStore?.addPivotalEvent(event)
    },
    updatePivotalEvent(eventId: string, updates: Partial<PivotalEvent>): void {
      collabStore?.updatePivotalEvent(eventId, updates)
    },
    deletePivotalEvent(eventId: string): void {
      collabStore?.deletePivotalEvent(eventId)
    },
    addESConnection(connection: ESConnection): void {
      collabStore?.addESConnection(connection)
    },
    updateESConnection(connectionId: string, updates: Partial<ESConnection>): void {
      collabStore?.updateESConnection(connectionId, updates)
    },
    deleteESConnection(connectionId: string): void {
      collabStore?.deleteESConnection(connectionId)
    },
  }
}

export function getCollabUndoRedo(): CollabUndoRedo {
  return {
    get canUndo(): boolean | null {
      return collabStore?.canUndo() ?? null
    },
    get canRedo(): boolean | null {
      return collabStore?.canRedo() ?? null
    },
    undo(): void {
      collabStore?.undo()
    },
    redo(): void {
      collabStore?.redo()
    },
  }
}
