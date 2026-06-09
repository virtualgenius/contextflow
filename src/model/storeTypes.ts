import type {
  Project,
  BoundedContext,
  User,
  UserNeed,
  UserNeedConnection,
  NeedContextConnection,
  TemporalKeyframe,
  Issue,
  IssueSeverity,
  Relationship,
} from './types'

export type ViewMode = 'context-map' | 'flow' | 'strategic' | 'distillation'

export type SpawnDirection = 'up' | 'down' | 'left' | 'right'

export type DraftEntity = 'user' | 'userNeed' | 'stage'

// An in-flight inline name entry for an entity being created on-canvas. Held in
// the store (not Yjs) because several components open it: the canvas
// (double-click / N key / arrow keys), the toolbar buttons, and the node stubs.
export type ContextDraft =
  | { kind: 'at'; x: number; y: number }
  | { kind: 'center' }
  | { kind: 'related'; sourceId: string; direction: SpawnDirection }
  | { kind: 'entity'; entity: DraftEntity }

export interface EditorCommand {
  type:
    | 'moveContext'
    | 'moveContextGroup'
    | 'addContext'
    | 'deleteContext'
    | 'assignRepo'
    | 'unassignRepo'
    | 'addGroup'
    | 'deleteGroup'
    | 'removeFromGroup'
    | 'addToGroup'
    | 'addRelationship'
    | 'deleteRelationship'
    | 'updateRelationship'
    | 'addUser'
    | 'deleteUser'
    | 'moveUser'
    | 'addUserNeed'
    | 'deleteUserNeed'
    | 'moveUserNeed'
    | 'addUserNeedConnection'
    | 'deleteUserNeedConnection'
    | 'addNeedContextConnection'
    | 'deleteNeedContextConnection'
    | 'createKeyframe'
    | 'deleteKeyframe'
    | 'moveContextInKeyframe'
    | 'updateKeyframe'
    | 'updateFlowStage'
    | 'addFlowStage'
    | 'deleteFlowStage'
  payload: {
    contextId?: string
    contextIds?: string[]
    oldPositions?: BoundedContext['positions']
    newPositions?: BoundedContext['positions']
    positionsMap?: Record<
      string,
      { old: BoundedContext['positions']; new: BoundedContext['positions'] }
    >
    context?: BoundedContext
    repoId?: string
    oldContextId?: string
    newContextId?: string
    group?: any
    groupId?: string
    relationship?: any
    relationshipId?: string
    user?: User
    userId?: string
    oldPosition?: number
    newPosition?: number
    userNeed?: UserNeed
    userNeedId?: string
    userNeedConnection?: UserNeedConnection
    userNeedConnectionId?: string
    needContextConnection?: NeedContextConnection
    needContextConnectionId?: string
    keyframe?: TemporalKeyframe
    keyframes?: TemporalKeyframe[] // For commands that create multiple keyframes
    keyframeId?: string
    oldKeyframeData?: Partial<TemporalKeyframe>
    newKeyframeData?: Partial<TemporalKeyframe>
    flowStageIndex?: number
    flowStage?: {
      name: string
      position: number
      description?: string
      owner?: string
      notes?: string
    }
    oldFlowStage?: {
      name: string
      position: number
      description?: string
      owner?: string
      notes?: string
    }
    newFlowStage?: {
      name: string
      position: number
      description?: string
      owner?: string
      notes?: string
    }
    oldRelationship?: any
    newRelationship?: any
  }
}

export interface EditorState {
  activeProjectId: string | null
  projects: Record<string, Project>

  activeViewMode: ViewMode

  selectedContextId: string | null
  selectedRelationshipId: string | null
  selectedGroupId: string | null
  selectedUserId: string | null
  selectedUserNeedId: string | null
  selectedUserNeedConnectionId: string | null
  selectedNeedContextConnectionId: string | null
  selectedStageIndex: number | null
  selectedTeamId: string | null
  selectedContextIds: string[]
  hoveredContextId: string | null
  hoveredRelationshipId: string | null
  isDragging: boolean
  contextDraft: ContextDraft | null
  // One-shot request to focus and select a context's name field in the
  // inspector (set on double-click, cleared by the inspector once consumed).
  focusContextNameId: string | null

  canvasView: {
    flow: { zoom: number; panX: number; panY: number }
    strategic: { zoom: number; panX: number; panY: number }
    distillation: { zoom: number; panX: number; panY: number }
  }

  // View filters
  showGroups: boolean
  showRelationships: boolean
  showIssueLabels: boolean
  showTeamLabels: boolean
  showRelationshipLabels: boolean

  // Help preferences
  showHelpTooltips: boolean

  // UI preferences
  groupOpacity: number
  colorByMode: 'strategic' | 'ownership'

  // Temporal state
  temporal: {
    currentDate: string | null // Current slider position ("2027" or "2027-Q2")
    activeKeyframeId: string | null // Currently locked keyframe for editing
    savedShowGroups?: boolean // Saved group visibility when entering keyframe mode
    savedShowRelationships?: boolean // Saved relationship visibility when entering keyframe mode
  }

  undoStack: EditorCommand[]
  redoStack: EditorCommand[]

  // Temporal actions
  toggleTemporalMode: () => void
  setCurrentDate: (date: string | null) => void
  setActiveKeyframe: (keyframeId: string | null) => void
  addKeyframe: (date: string, label?: string) => string | null
  deleteKeyframe: (keyframeId: string) => void
  updateKeyframe: (keyframeId: string, updates: Partial<TemporalKeyframe>) => void
  updateKeyframeContextPosition: (
    keyframeId: string,
    contextId: string,
    x: number,
    y: number
  ) => void

  // Actions
  updateContext: (contextId: string, updates: Partial<BoundedContext>) => void
  updateContextPosition: (contextId: string, newPositions: BoundedContext['positions']) => void
  updateMultipleContextPositions: (
    positionsMap: Record<string, BoundedContext['positions']>
  ) => void
  setSelectedContext: (contextId: string | null) => void
  toggleContextSelection: (contextId: string) => void
  clearContextSelection: () => void
  setHoveredContext: (contextId: string | null) => void
  setHoveredRelationship: (relationshipId: string | null) => void
  setViewMode: (mode: ViewMode) => void
  setActiveProject: (projectId: string) => Promise<void>
  createProject: (name: string) => Promise<void>
  createFromTemplate: (templateId: string) => Promise<void>
  deleteProject: (projectId: string) => void
  renameProject: (projectId: string, newName: string) => void
  duplicateProject: (projectId: string) => void
  addContext: (name: string, position?: { x: number; y: number }) => string | null
  createRelatedContext: (
    sourceId: string,
    direction: 'up' | 'down' | 'left' | 'right',
    name: string
  ) => string | null
  deleteContext: (contextId: string) => void
  addContextIssue: (contextId: string, title: string, severity?: IssueSeverity) => void
  updateContextIssue: (contextId: string, issueId: string, updates: Partial<Issue>) => void
  deleteContextIssue: (contextId: string, issueId: string) => void
  assignTeamToContext: (contextId: string, teamId: string) => void
  unassignTeamFromContext: (contextId: string) => void
  assignRepoToContext: (repoId: string, contextId: string) => void
  unassignRepo: (repoId: string) => void
  createGroup: (label: string, color?: string, notes?: string) => void
  updateGroup: (
    groupId: string,
    updates: Partial<{ label: string; notes: string; color: string }>
  ) => void
  deleteGroup: (groupId: string) => void
  removeContextFromGroup: (groupId: string, contextId: string) => void
  addContextToGroup: (groupId: string, contextId: string) => void
  addContextsToGroup: (groupId: string, contextIds: string[]) => void
  addRelationship: (
    fromContextId: string,
    toContextId: string,
    pattern: Relationship['pattern'] | undefined,
    description?: string,
    extras?: {
      upstreamRole?: Relationship['upstreamRole']
      downstreamRole?: Relationship['downstreamRole']
    }
  ) => string
  deleteRelationship: (relationshipId: string) => void
  updateRelationship: (
    relationshipId: string,
    updates: Partial<
      Pick<
        Relationship,
        'pattern' | 'upstreamRole' | 'downstreamRole' | 'communicationMode' | 'description'
      >
    >
  ) => void
  swapRelationshipDirection: (relationshipId: string) => void
  setSelectedRelationship: (relationshipId: string | null) => void
  setSelectedStage: (stageIndex: number | null) => void
  setSelectedTeam: (teamId: string | null) => void
  updateTeam: (
    teamId: string,
    updates: Partial<{
      name: string
      jiraBoard: string
      topologyType: 'stream-aligned' | 'platform' | 'enabling' | 'complicated-subsystem' | 'unknown'
    }>
  ) => void
  addTeam: (name: string) => string
  addRepo: (name: string) => string
  deleteTeam: (teamId: string) => void
  addUser: (name: string) => void
  deleteUser: (userId: string) => void
  updateUser: (userId: string, updates: Partial<User>) => void
  updateUserPosition: (userId: string, newPosition: number) => void
  setSelectedUser: (userId: string | null) => void
  addUserNeed: (name: string) => string | null
  deleteUserNeed: (userNeedId: string) => void
  updateUserNeed: (userNeedId: string, updates: Partial<UserNeed>) => void
  updateUserNeedPosition: (userNeedId: string, newPosition: number) => void
  setSelectedUserNeed: (userNeedId: string | null) => void
  setSelectedUserNeedConnection: (connectionId: string | null) => void
  setSelectedNeedContextConnection: (connectionId: string | null) => void
  createUserNeedConnection: (userId: string, userNeedId: string) => string | null
  deleteUserNeedConnection: (connectionId: string) => void
  updateUserNeedConnection: (connectionId: string, updates: Partial<UserNeedConnection>) => void
  createNeedContextConnection: (userNeedId: string, contextId: string) => string | null
  deleteNeedContextConnection: (connectionId: string) => void
  updateNeedContextConnection: (
    connectionId: string,
    updates: Partial<NeedContextConnection>
  ) => void
  toggleShowGroups: () => void
  toggleShowRelationships: () => void
  toggleIssueLabels: () => void
  toggleTeamLabels: () => void
  toggleRelationshipLabels: () => void
  toggleHelpTooltips: () => void
  clearActiveProject: () => void
  setGroupOpacity: (opacity: number, options?: { skipAnalytics?: boolean }) => void
  setColorByMode: (mode: 'strategic' | 'ownership') => void
  updateFlowStage: (
    index: number,
    updates: Partial<{
      name: string
      position: number
      description: string
      owner: string
      notes: string
    }>
  ) => void
  completeFlowStageMove: (index: number, startPosition: number) => void
  addFlowStage: (name: string, position?: number) => void
  deleteFlowStage: (index: number) => void
  setDragging: (isDragging: boolean) => void
  beginContextDraft: (draft: ContextDraft) => void
  cancelContextDraft: () => void
  requestContextNameEdit: (contextId: string) => void
  clearContextNameEditFocus: () => void
  undo: () => void
  redo: () => void
  fitToMap: () => void
  exportProject: () => void
  importProject: (project: Project) => Promise<void>
  reset: () => void
  loadSharedProject: (projectId: string) => Promise<void>
}
