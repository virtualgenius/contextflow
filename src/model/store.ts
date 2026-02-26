import { create } from 'zustand'
import type { Project, BoundedContext, User, UserNeed, UserNeedConnection, NeedContextConnection, TemporalKeyframe, FlowStageMarker, Team } from './types'
import { saveProject, loadProject } from './persistence'
import { config } from '../config'
import { trackEvent, trackPropertyChange, trackTextFieldEdit, trackFTUEMilestone } from '../utils/analytics'
import { classifyFromDistillationPosition, classifyFromStrategicPosition } from './classification'
import type { ViewMode, EditorCommand, EditorState } from './storeTypes'
import { initialProjects, initialActiveProjectId, BUILT_IN_PROJECTS, sampleProject, cbioportal, initializeBuiltInProjects } from './builtInProjects'
import {
  getCollabMutations,
  getCollabUndoRedo,
  initializeCollabMode,
  initializeCollabModeWithYDoc,
  destroyCollabMode,
} from './sync/useCollabMode'
import { populateYDocWithProject, yDocToProject } from './sync/projectSync'
import { useCollabStore as useNetworkCollabStore } from './collabStore'
import { calculateNextStagePosition, calculateNextPosition } from './stagePosition'
import { getGridPosition, needsRedistribution, findFirstUnoccupiedGridPosition, findFirstUnoccupiedFlowPosition } from '../lib/distillationGrid'
import { createProjectAction, deleteProjectAction, renameProjectAction, duplicateProjectAction } from './actions/projectActions'
import { createProjectFromTemplate } from './templateProjects'
import {
  validateKeyframeDate,
  checkDuplicateKeyframe,
  shouldWarnFarFuture,
  captureContextPositions,
  shouldAutoCreateCurrentKeyframe,
  createCurrentKeyframe,
} from './actions/keyframeHelpers'
import { autosaveIfNeeded, migrateProject, deleteProject as deleteProjectFromDB } from './persistence'
import { determineProjectOrigin } from './builtInProjects'
import { calculateKeyframeTransition } from './keyframes'
import { validateStageName, validateStagePosition, createSelectionState } from './validation'

export type { ViewMode, EditorCommand, EditorState }

function getAllSelectedContextIds(state: EditorState): string[] {
  const singleSelection = state.selectedContextId && !state.selectedContextIds.includes(state.selectedContextId)
    ? [state.selectedContextId]
    : []
  return [...singleSelection, ...state.selectedContextIds]
}

let globalFitViewCallback: (() => void) | null = null

export function setFitViewCallback(callback: () => void) {
  globalFitViewCallback = callback
}

function loadExistingProjectFromYDoc(
  ydoc: import('yjs').Doc,
  onProjectLoaded: (project: Project) => void
): void {
  const yProject = ydoc.getMap('project')
  if (yProject.has('id')) {
    onProjectLoaded(yDocToProject(ydoc))
  }
}

async function reconnectCollabForProject(
  projectId: string,
  project: Project,
  options?: { loadExisting?: boolean }
): Promise<void> {
  destroyCollabMode()

  const networkStore = useNetworkCollabStore.getState()
  await networkStore.connectToProject(projectId)

  const ydoc = useNetworkCollabStore.getState().ydoc
  if (ydoc) {
    populateYDocWithProject(ydoc, project)

    const updateStoreAndAutosave = (updatedProject: Project): void => {
      useEditorStore.setState((s) => ({
        projects: {
          ...s.projects,
          [updatedProject.id]: updatedProject,
        },
      }))
      saveProject(updatedProject).catch((err) => {
        console.error('Failed to autosave project to IndexedDB:', err)
      })
    }
    initializeCollabModeWithYDoc(ydoc, { onProjectChange: updateStoreAndAutosave })

    if (options?.loadExisting) {
      loadExistingProjectFromYDoc(ydoc, updateStoreAndAutosave)
    }
  }
}

export const useEditorStore = create<EditorState>((set) => ({
  activeProjectId: initialActiveProjectId,
  projects: initialProjects,

  activeViewMode: 'flow',

  selectedContextId: null,
  selectedRelationshipId: null,
  selectedGroupId: null,
  selectedUserId: null,
  selectedUserNeedId: null,
  selectedUserNeedConnectionId: null,
  selectedNeedContextConnectionId: null,
  selectedStageIndex: null,
  selectedTeamId: null,
  selectedContextIds: [],
  hoveredContextId: null,

  isDragging: false,

  canvasView: {
    flow: { zoom: 1, panX: 0, panY: 0 },
    strategic: { zoom: 1, panX: 0, panY: 0 },
    distillation: { zoom: 1, panX: 0, panY: 0 },
  },

  // View filters (default to ON, load from localStorage if available)
  showGroups: (() => {
    const stored = localStorage.getItem('contextflow.showGroups')
    return stored !== null ? stored === 'true' : true
  })(),
  showRelationships: (() => {
    const stored = localStorage.getItem('contextflow.showRelationships')
    return stored !== null ? stored === 'true' : true
  })(),
  showIssueLabels: (() => {
    const stored = localStorage.getItem('contextflow.showIssueLabels')
    return stored === 'true'
  })(),
  showTeamLabels: (() => {
    const stored = localStorage.getItem('contextflow.showTeamLabels')
    return stored === 'true'
  })(),
  showRelationshipLabels: (() => {
    const stored = localStorage.getItem('contextflow.showRelationshipLabels')
    return stored !== null ? stored === 'true' : true
  })(),

  showHelpTooltips: (() => {
    const stored = localStorage.getItem('contextflow.showHelpTooltips')
    return stored !== null ? stored === 'true' : true
  })(),

  groupOpacity: (() => {
    const stored = localStorage.getItem('contextflow.groupOpacity')
    return stored !== null ? parseFloat(stored) : config.ui.groupOpacity
  })(),

  colorByMode: (() => {
    const stored = localStorage.getItem('contextflow.colorByMode')
    return stored === 'strategic' ? 'strategic' : 'ownership'
  })() as 'strategic' | 'ownership',

  // Temporal state (defaults to current year)
  temporal: {
    currentDate: new Date().getFullYear().toString(),
    activeKeyframeId: null,
  },

  undoStack: [],
  redoStack: [],

  updateContext: (contextId, updates) => set((state) => {
    getCollabMutations().updateContext(contextId, updates)

    const projectId = state.activeProjectId
    const project = projectId ? state.projects[projectId] : null
    const changedProperties = Object.keys(updates)
    trackEvent('context_updated', project, {
      entity_type: 'context',
      entity_id: contextId,
      properties_changed: changedProperties,
    })

    return {}
  }),

  updateContextPosition: (contextId, newPositions) => set(() => {
    getCollabMutations().updateContextPosition(contextId, newPositions)
    return {}
  }),

  updateMultipleContextPositions: (positionsMap) => set(() => {
    for (const [contextId, positions] of Object.entries(positionsMap)) {
      getCollabMutations().updateContextPosition(contextId, positions)
    }
    return {}
  }),

  setSelectedContext: (contextId) => set({
    ...createSelectionState(contextId, 'context'),
  }),

  toggleContextSelection: (contextId) => set((state) => {
    const currentSelection = getAllSelectedContextIds(state)
    const isSelected = currentSelection.includes(contextId)

    return {
      ...createSelectionState(null, 'context'),
      selectedContextIds: isSelected
        ? currentSelection.filter(id => id !== contextId)
        : [...currentSelection, contextId],
    }
  }),

  clearContextSelection: () => set({
    ...createSelectionState(null, 'context'),
  }),

  setHoveredContext: (contextId) => set({ hoveredContextId: contextId }),

  setViewMode: (mode) => set((state) => {
    const projectId = state.activeProjectId
    const project = projectId ? state.projects[projectId] : null

    trackEvent('view_switched', project, {
      from_view: state.activeViewMode,
      to_view: mode
    })

    // Track FTUE milestone: second view discovered
    // Check if user has switched views (different from starting view)
    if (mode !== 'flow') { // flow is the default starting view
      const viewsUsed = ['flow', mode] // User started in flow, now viewing another
      trackFTUEMilestone('second_view_discovered', project, {
        views_used: viewsUsed
      })
    }

    // Redistribute overlapping contexts when switching to distillation view
    if (mode === 'distillation' && project && needsRedistribution(project.contexts)) {
      const redistributedContexts = project.contexts.map((ctx, i) => {
        const newDistillationPos = getGridPosition(i)
        const newPositions = { ...ctx.positions, distillation: newDistillationPos }
        const newClassification = classifyFromDistillationPosition(newDistillationPos.x, newDistillationPos.y)

        getCollabMutations().updateContextPosition(ctx.id, newPositions)

        return { ...ctx, positions: newPositions, strategicClassification: newClassification }
      })

      const updatedProject = { ...project, contexts: redistributedContexts }

      return {
        activeViewMode: mode,
        projects: { ...state.projects, [projectId!]: updatedProject },
      }
    }

    return { activeViewMode: mode }
  }),

  setActiveProject: async (projectId) => {
    const state = useEditorStore.getState()
    if (!state.projects[projectId]) return

    const project = state.projects[projectId]
    const origin = determineProjectOrigin(project, state.activeProjectId === null)

    trackEvent('project_opened', project, {
      project_origin: origin
    })

    localStorage.setItem('contextflow.activeProjectId', projectId)

    // Update state immediately
    useEditorStore.setState(() => ({
      activeProjectId: projectId,
      ...createSelectionState(null, 'context'),
      undoStack: [],
      redoStack: [],
    }))

    await reconnectCollabForProject(projectId, project)
  },

  createProject: async (name) => {
    const state = useEditorStore.getState()
    const result = createProjectAction(state, name)
    if (!result.activeProjectId || !result.projects) {
      return
    }

    const newProjectId = result.activeProjectId
    const newProject = result.projects[newProjectId]

    trackEvent('project_created', newProject, {
      creation_method: 'blank'
    })

    localStorage.setItem('contextflow.activeProjectId', newProjectId)
    autosaveIfNeeded(newProjectId, result.projects)

    // Update state immediately with the new project
    useEditorStore.setState(() => result)

    await reconnectCollabForProject(newProjectId, newProject)
  },

  createFromTemplate: async (templateId) => {
    const newProject = createProjectFromTemplate(templateId)

    trackEvent('project_created', newProject, {
      creation_method: 'template',
      template_id: templateId
    })

    localStorage.setItem('contextflow.activeProjectId', newProject.id)
    autosaveIfNeeded(newProject.id, { [newProject.id]: newProject })

    // Update state immediately with the new project
    useEditorStore.setState((state) => ({
      projects: {
        ...state.projects,
        [newProject.id]: newProject,
      },
      activeProjectId: newProject.id,
      ...createSelectionState(null, 'context'),
      undoStack: [],
      redoStack: [],
    }))

    await reconnectCollabForProject(newProject.id, newProject)
  },

  deleteProject: (projectId) => set((state) => {
    const project = state.projects[projectId]
    const projectCount = Object.keys(state.projects).length

    trackEvent('project_deleted', project || null, {
      remaining_project_count: projectCount - 1
    })

    const result = deleteProjectAction(state, projectId)
    if (result.activeProjectId) {
      localStorage.setItem('contextflow.activeProjectId', result.activeProjectId)
    }
    deleteProjectFromDB(projectId).catch((err) => {
      console.error('Failed to delete project from IndexedDB:', err)
    })
    return result
  }),

  renameProject: (projectId, newName) => set((state) => {
    const project = state.projects[projectId]

    trackEvent('project_renamed', project || null)

    const result = renameProjectAction(state, projectId, newName)
    getCollabMutations().renameProject(newName.trim())
    autosaveIfNeeded(projectId, result.projects)
    return result
  }),

  duplicateProject: (projectId) => set((state) => {
    const result = duplicateProjectAction(state, projectId)
    if (result.activeProjectId && result.projects) {
      const newProject = result.projects[result.activeProjectId]

      trackEvent('project_created', newProject || null, {
        creation_method: 'duplicate'
      })

      localStorage.setItem('contextflow.activeProjectId', result.activeProjectId)
      autosaveIfNeeded(result.activeProjectId, result.projects)
    }
    return result
  }),

  addContext: (name) => set((state) => {
    const projectId = state.activeProjectId
    if (!projectId) return {}
    const project = state.projects[projectId]
    if (!project) return {}

    const flowPos = findFirstUnoccupiedFlowPosition(project.contexts)
    const newContext: BoundedContext = {
      id: `context-${Date.now()}`,
      name,
      positions: {
        flow: { x: flowPos.x },
        strategic: { x: flowPos.x },
        distillation: findFirstUnoccupiedGridPosition(project.contexts),
        shared: { y: flowPos.y },
      },
      strategicClassification: 'supporting',
      evolutionStage: 'custom-built',
    }

    getCollabMutations().addContext(newContext)

    const updatedProject = { ...project, contexts: [...project.contexts, newContext] }
    trackEvent('context_added', updatedProject, {
      entity_type: 'context',
      entity_id: newContext.id,
      source_view: state.activeViewMode,
    })
    trackFTUEMilestone('first_context_added', updatedProject)

    return { selectedContextId: newContext.id }
  }),

  deleteContext: (contextId) => set((state) => {
    const projectId = state.activeProjectId
    const project = projectId ? state.projects[projectId] : null
    getCollabMutations().deleteContext(contextId)
    trackEvent('context_deleted', project, {
      entity_type: 'context',
      entity_id: contextId,
    })
    return state.selectedContextId === contextId ? { selectedContextId: null } : {}
  }),

  addContextIssue: (contextId, title, severity) => set(() => {
    getCollabMutations().addContextIssue(contextId, title, severity)
    return {}
  }),

  updateContextIssue: (contextId, issueId, updates) => set(() => {
    getCollabMutations().updateContextIssue(contextId, issueId, updates)
    return {}
  }),

  deleteContextIssue: (contextId, issueId) => set(() => {
    getCollabMutations().deleteContextIssue(contextId, issueId)
    return {}
  }),

  assignTeamToContext: (contextId, teamId) => set((state) => {
    getCollabMutations().updateContext(contextId, { teamId })
    const projectId = state.activeProjectId
    const project = projectId ? state.projects[projectId] : null
    trackEvent('team_assigned_to_context', project, {
      entity_type: 'context',
      entity_id: contextId,
      team_id: teamId,
    })
    return {}
  }),

  unassignTeamFromContext: (contextId) => set((state) => {
    getCollabMutations().updateContext(contextId, { teamId: undefined })
    const projectId = state.activeProjectId
    const project = projectId ? state.projects[projectId] : null
    trackEvent('team_unassigned_from_context', project, {
      entity_type: 'context',
      entity_id: contextId,
    })
    return {}
  }),

  assignRepoToContext: (repoId, contextId) => set((state) => {
    getCollabMutations().updateRepo(repoId, { contextId })
    const projectId = state.activeProjectId
    const project = projectId ? state.projects[projectId] : null
    trackEvent('repo_assigned_to_context', project, {
      entity_type: 'repo',
      entity_id: repoId,
      context_id: contextId,
    })
    return {}
  }),

  unassignRepo: (repoId) => set((state) => {
    getCollabMutations().updateRepo(repoId, { contextId: undefined })
    const projectId = state.activeProjectId
    const project = projectId ? state.projects[projectId] : null
    trackEvent('repo_unassigned', project, {
      entity_type: 'repo',
      entity_id: repoId,
    })
    return {}
  }),

  createGroup: (label, color, notes) => set((state) => {
    const newGroup = {
      id: `group-${Date.now()}`,
      label,
      color: color || '#3b82f6',
      contextIds: state.selectedContextIds,
      notes,
    }
    getCollabMutations().addGroup(newGroup)

    const projectId = state.activeProjectId
    const project = projectId ? state.projects[projectId] : null
    trackEvent('group_created', project, {
      entity_type: 'group',
      entity_id: newGroup.id,
      context_count: state.selectedContextIds.length,
    })
    trackFTUEMilestone('first_group_created', project)

    return {
      selectedGroupId: newGroup.id,
      selectedContextIds: [],
    }
  }),

  updateGroup: (groupId, updates) => set((state) => {
    getCollabMutations().updateGroup(groupId, updates)
    const projectId = state.activeProjectId
    const project = projectId ? state.projects[projectId] : null
    if (project) {
      const oldGroup = project.groups.find(g => g.id === groupId)
      if (oldGroup) {
        if ('label' in updates && updates.label !== oldGroup.label) {
          trackTextFieldEdit(project, 'group', 'name', oldGroup.label, updates.label, 'inspector')
        }
        if ('notes' in updates && updates.notes !== oldGroup.notes) {
          trackTextFieldEdit(project, 'group', 'notes', oldGroup.notes, updates.notes, 'inspector')
        }
        if ('color' in updates && updates.color !== oldGroup.color) {
          trackPropertyChange('group_property_changed', project, 'group', groupId, 'color', oldGroup.color, updates.color)
        }
      }
    }
    return {}
  }),

  deleteGroup: (groupId) => set((state) => {
    getCollabMutations().deleteGroup(groupId)
    const projectId = state.activeProjectId
    const project = projectId ? state.projects[projectId] : null
    trackEvent('group_deleted', project, {
      entity_type: 'group',
      entity_id: groupId,
    })
    return state.selectedGroupId === groupId ? { selectedGroupId: null } : {}
  }),

  removeContextFromGroup: (groupId, contextId) => set(() => {
    getCollabMutations().removeContextFromGroup(groupId, contextId)
    trackEvent('context_removed_from_group', null, { entity_type: 'group', entity_id: groupId })
    return {}
  }),

  addContextToGroup: (groupId, contextId) => set(() => {
    getCollabMutations().addContextToGroup(groupId, contextId)
    trackEvent('context_added_to_group', null, { entity_type: 'group', entity_id: groupId })
    return {}
  }),

  addContextsToGroup: (groupId, contextIds) => set(() => {
    getCollabMutations().addContextsToGroup(groupId, contextIds)
    trackEvent('context_added_to_group', null, { entity_type: 'group', entity_id: groupId, context_count: contextIds.length })
    return {}
  }),

  addRelationship: (fromContextId, toContextId, pattern, description) => set(() => {
    const newRelationship = {
      id: `rel-${Date.now()}`,
      fromContextId,
      toContextId,
      pattern,
      description,
    }
    getCollabMutations().addRelationship(newRelationship)

    trackEvent('relationship_added', null, {
      entity_type: 'relationship',
      entity_id: newRelationship.id,
      pattern,
    })
    trackFTUEMilestone('first_relationship_added', null)

    return {}
  }),

  deleteRelationship: (relationshipId) => set((state) => {
    const projectId = state.activeProjectId
    const project = projectId ? state.projects[projectId] : null
    getCollabMutations().deleteRelationship(relationshipId)
    trackEvent('relationship_deleted', project, {
      entity_type: 'relationship',
      entity_id: relationshipId,
    })
    return state.selectedRelationshipId === relationshipId ? { selectedRelationshipId: null } : {}
  }),

  updateRelationship: (relationshipId, updates) => set((state) => {
    getCollabMutations().updateRelationship(relationshipId, updates)
    const projectId = state.activeProjectId
    const project = projectId ? state.projects[projectId] : null
    trackEvent('relationship_updated', project, {
      entity_type: 'relationship',
      entity_id: relationshipId,
      properties_changed: Object.keys(updates),
    })
    return {}
  }),

  swapRelationshipDirection: (relationshipId) => set((state) => {
    const projectId = state.activeProjectId
    if (!projectId) return {}
    const project = state.projects[projectId]
    if (!project) return {}
    const rel = project.relationships.find(r => r.id === relationshipId)
    if (!rel) return {}
    getCollabMutations().updateRelationship(relationshipId, {
      fromContextId: rel.toContextId,
      toContextId: rel.fromContextId,
    })
    trackEvent('relationship_direction_swapped', project, {
      entity_type: 'relationship',
      entity_id: relationshipId,
    })
    return {}
  }),

  setSelectedRelationship: (relationshipId) => set({
    ...createSelectionState(relationshipId, 'relationship'),
  }),

  setSelectedStage: (stageIndex) => set({
    ...createSelectionState(stageIndex, 'stage'),
  }),

  setSelectedTeam: (teamId) => set({
    ...createSelectionState(teamId, 'team'),
  }),

  updateTeam: (teamId, updates) => set((state) => {
    getCollabMutations().updateTeam(teamId, updates)
    const projectId = state.activeProjectId
    const project = projectId ? state.projects[projectId] : null
    if (project) {
      const oldTeam = project.teams.find(t => t.id === teamId)
      if (oldTeam) {
        if ('name' in updates && updates.name !== oldTeam.name) {
          trackTextFieldEdit(project, 'team', 'name', oldTeam.name, updates.name, 'inspector')
        }
      }
    }
    return {}
  }),

  addTeam: (name) => {
    const state = useEditorStore.getState()
    const projectId = state.activeProjectId
    const project = projectId ? state.projects[projectId] : null

    const newTeam = {
      id: `team-${Date.now()}`,
      name,
      topologyType: 'stream-aligned' as const,
    }
    getCollabMutations().addTeam(newTeam)

    trackEvent('team_added', project, {
      entity_type: 'team',
      entity_id: newTeam.id,
    })

    useEditorStore.setState({
      ...createSelectionState(newTeam.id, 'team'),
    })
    return newTeam.id
  },

  deleteTeam: (teamId) => set((state) => {
    const projectId = state.activeProjectId
    const project = projectId ? state.projects[projectId] : null
    getCollabMutations().deleteTeam(teamId)
    trackEvent('team_deleted', project, {
      entity_type: 'team',
      entity_id: teamId,
    })
    return state.selectedTeamId === teamId ? { selectedTeamId: null } : {}
  }),

  addUser: (name) => set((state) => {
    const projectId = state.activeProjectId
    if (!projectId) return {}
    const project = state.projects[projectId]
    if (!project) return {}

    const newUser: User = {
      id: `user-${Date.now()}`,
      name,
      position: calculateNextPosition(project.users || []),
    }

    getCollabMutations().addUser(newUser)

    const updatedProject = { ...project, users: [...(project.users || []), newUser] }
    trackEvent('user_added', updatedProject, {
      entity_type: 'user',
      entity_id: newUser.id,
    })

    return { selectedUserId: newUser.id }
  }),

  deleteUser: (userId) => set((state) => {
    const projectId = state.activeProjectId
    if (!projectId) return {}
    const project = state.projects[projectId]
    if (!project) return {}

    const userNeedConnections = (project.userNeedConnections || []).filter(c => c.userId === userId)
    for (const conn of userNeedConnections) {
      getCollabMutations().deleteUserNeedConnection(conn.id)
    }

    getCollabMutations().deleteUser(userId)
    trackEvent('user_deleted', project, {
      entity_type: 'user',
      entity_id: userId,
    })
    return state.selectedUserId === userId ? { selectedUserId: null } : {}
  }),

  updateUser: (userId, updates) => set((state) => {
    getCollabMutations().updateUser(userId, updates)
    const projectId = state.activeProjectId
    const project = projectId ? state.projects[projectId] : null
    if (project) {
      const oldUser = (project.users || []).find(u => u.id === userId)
      if (oldUser) {
        if ('name' in updates && updates.name !== oldUser.name) {
          trackTextFieldEdit(project, 'user', 'name', oldUser.name, updates.name, 'inspector')
        }
        if ('isExternal' in updates && updates.isExternal !== oldUser.isExternal) {
          trackPropertyChange('user_property_changed', project, 'user', userId, 'isExternal', oldUser.isExternal, updates.isExternal)
        }
      }
    }
    return {}
  }),

  updateUserPosition: (userId, newPosition) => set(() => {
    getCollabMutations().updateUserPosition(userId, newPosition)
    return {}
  }),

  setSelectedUser: (userId) => set({
    ...createSelectionState(userId, 'user'),
  }),

  addUserNeed: (name) => {
    const state = useEditorStore.getState()
    const projectId = state.activeProjectId
    if (!projectId) return null
    const project = state.projects[projectId]
    if (!project) return null

    const newUserNeed: UserNeed = {
      id: `need-${Date.now()}`,
      name,
      position: calculateNextPosition(project.userNeeds || []),
      visibility: true,
    }

    getCollabMutations().addUserNeed(newUserNeed)

    trackEvent('user_need_added', project, {
      entity_type: 'user_need',
      entity_id: newUserNeed.id,
    })

    useEditorStore.setState({ selectedUserNeedId: newUserNeed.id })
    return newUserNeed.id
  },

  deleteUserNeed: (userNeedId) => set((state) => {
    const projectId = state.activeProjectId
    if (!projectId) return {}
    const project = state.projects[projectId]
    if (!project) return {}

    const userNeedConnections = (project.userNeedConnections || []).filter(c => c.userNeedId === userNeedId)
    const needContextConnections = (project.needContextConnections || []).filter(c => c.userNeedId === userNeedId)

    for (const conn of userNeedConnections) {
      getCollabMutations().deleteUserNeedConnection(conn.id)
    }
    for (const conn of needContextConnections) {
      getCollabMutations().deleteNeedContextConnection(conn.id)
    }

    getCollabMutations().deleteUserNeed(userNeedId)
    trackEvent('user_need_deleted', project, {
      entity_type: 'user_need',
      entity_id: userNeedId,
    })
    return state.selectedUserNeedId === userNeedId ? { selectedUserNeedId: null } : {}
  }),

  updateUserNeed: (userNeedId, updates) => set((state) => {
    getCollabMutations().updateUserNeed(userNeedId, updates)
    const projectId = state.activeProjectId
    const project = projectId ? state.projects[projectId] : null
    if (project) {
      const oldNeed = (project.userNeeds || []).find(n => n.id === userNeedId)
      if (oldNeed) {
        if ('name' in updates && updates.name !== oldNeed.name) {
          trackTextFieldEdit(project, 'user_need', 'name', oldNeed.name, updates.name, 'inspector')
        }
        if ('visibility' in updates && updates.visibility !== oldNeed.visibility) {
          trackPropertyChange('user_need_property_changed', project, 'user_need', userNeedId, 'visibility', oldNeed.visibility, updates.visibility)
        }
      }
    }
    return {}
  }),

  updateUserNeedPosition: (userNeedId, newPosition) => set(() => {
    getCollabMutations().updateUserNeedPosition(userNeedId, newPosition)
    return {}
  }),

  setSelectedUserNeed: (userNeedId) => set({
    ...createSelectionState(userNeedId, 'userNeed'),
  }),

  setSelectedUserNeedConnection: (connectionId) => set({
    ...createSelectionState(connectionId, 'userNeedConnection'),
  }),

  setSelectedNeedContextConnection: (connectionId) => set({
    ...createSelectionState(connectionId, 'needContextConnection'),
  }),

  createUserNeedConnection: (userId, userNeedId) => {
    const state = useEditorStore.getState()
    const projectId = state.activeProjectId
    if (!projectId) return null
    const project = state.projects[projectId]
    if (!project) return null

    const newConnection = {
      id: `user-need-conn-${Date.now()}`,
      userId,
      userNeedId,
    }

    getCollabMutations().addUserNeedConnection(newConnection)

    trackEvent('user_need_connection_created', project, {
      entity_type: 'user_need_connection',
      entity_id: newConnection.id,
      metadata: {
        user_id: userId,
        user_need_id: userNeedId
      }
    })

    return newConnection.id
  },

  deleteUserNeedConnection: (connectionId) => set(() => {
    getCollabMutations().deleteUserNeedConnection(connectionId)
    trackEvent('user_need_connection_deleted', null, {
      entity_type: 'user_need_connection',
      entity_id: connectionId,
    })
    return {}
  }),

  updateUserNeedConnection: (connectionId, updates) => set(() => {
    getCollabMutations().updateUserNeedConnection(connectionId, updates)
    trackEvent('user_need_connection_updated', null, { entity_type: 'user_need_connection', entity_id: connectionId })
    return {}
  }),

  createNeedContextConnection: (userNeedId, contextId) => {
    const state = useEditorStore.getState()
    const projectId = state.activeProjectId
    if (!projectId) return null
    const project = state.projects[projectId]
    if (!project) return null

    const newConnection = {
      id: `need-context-conn-${Date.now()}`,
      userNeedId,
      contextId,
    }

    getCollabMutations().addNeedContextConnection(newConnection)

    trackEvent('need_context_connection_created', project, {
      entity_type: 'need_context_connection',
      entity_id: newConnection.id,
      metadata: {
        user_need_id: userNeedId,
        context_id: contextId
      }
    })

    return newConnection.id
  },

  deleteNeedContextConnection: (connectionId) => set(() => {
    getCollabMutations().deleteNeedContextConnection(connectionId)
    trackEvent('need_context_connection_deleted', null, {
      entity_type: 'need_context_connection',
      entity_id: connectionId,
    })
    return {}
  }),

  updateNeedContextConnection: (connectionId, updates) => set(() => {
    getCollabMutations().updateNeedContextConnection(connectionId, updates)
    trackEvent('need_context_connection_updated', null, { entity_type: 'need_context_connection', entity_id: connectionId })
    return {}
  }),

  toggleShowGroups: () => set((state) => {
    const newValue = !state.showGroups
    localStorage.setItem('contextflow.showGroups', String(newValue))
    trackEvent('view_preference_changed', null, { preference_name: 'showGroups', new_value: newValue })
    return { showGroups: newValue }
  }),

  toggleShowRelationships: () => set((state) => {
    const newValue = !state.showRelationships
    localStorage.setItem('contextflow.showRelationships', String(newValue))
    trackEvent('view_preference_changed', null, { preference_name: 'showRelationships', new_value: newValue })
    return { showRelationships: newValue }
  }),

  toggleIssueLabels: () => set((state) => {
    const newValue = !state.showIssueLabels
    localStorage.setItem('contextflow.showIssueLabels', String(newValue))
    trackEvent('view_preference_changed', null, { preference_name: 'showIssueLabels', new_value: newValue })
    return { showIssueLabels: newValue }
  }),

  toggleTeamLabels: () => set((state) => {
    const newValue = !state.showTeamLabels
    localStorage.setItem('contextflow.showTeamLabels', String(newValue))
    trackEvent('view_preference_changed', null, { preference_name: 'showTeamLabels', new_value: newValue })
    return { showTeamLabels: newValue }
  }),

  toggleRelationshipLabels: () => set((state) => {
    const newValue = !state.showRelationshipLabels
    localStorage.setItem('contextflow.showRelationshipLabels', String(newValue))
    trackEvent('view_preference_changed', null, { preference_name: 'showRelationshipLabels', new_value: newValue })
    return { showRelationshipLabels: newValue }
  }),

  toggleHelpTooltips: () => set((state) => {
    const newValue = !state.showHelpTooltips
    localStorage.setItem('contextflow.showHelpTooltips', String(newValue))
    trackEvent('view_preference_changed', null, { preference_name: 'showHelpTooltips', new_value: newValue })
    return { showHelpTooltips: newValue }
  }),

  clearActiveProject: () => {
    localStorage.removeItem('contextflow.activeProjectId')
    destroyCollabMode()
    set({
      activeProjectId: null,
      ...createSelectionState(null, 'context'),
      undoStack: [],
      redoStack: [],
    })
  },

  setGroupOpacity: (opacity) => {
    localStorage.setItem('contextflow.groupOpacity', String(opacity))
    trackEvent('view_preference_changed', null, { preference_name: 'groupOpacity', new_value: opacity })
    set({ groupOpacity: opacity })
  },

  setColorByMode: (mode) => {
    localStorage.setItem('contextflow.colorByMode', mode)
    trackEvent('view_preference_changed', null, { preference_name: 'colorByMode', new_value: mode })
    set({ colorByMode: mode })
  },

  setDragging: (isDragging) => set({ isDragging }),

  updateFlowStage: (index, updates) => set((state) => {
    const projectId = state.activeProjectId
    if (!projectId) return {}

    const project = state.projects[projectId]
    if (!project) return {}

    const stages = project.viewConfig.flowStages
    if (index < 0 || index >= stages.length) return {}

    const oldStage = stages[index]
    const newName = updates.name !== undefined ? updates.name : oldStage.name
    const newPosition = updates.position !== undefined ? updates.position : oldStage.position

    if (newName !== oldStage.name) {
      validateStageName(stages, newName, index)
    }

    if (newPosition !== oldStage.position) {
      validateStagePosition(stages, newPosition, index)
    }

    if ('name' in updates && updates.name !== oldStage.name) {
      trackTextFieldEdit(project, 'flow_stage', 'name', oldStage.name, updates.name, 'inspector')
    }

    getCollabMutations().updateFlowStage(index, updates)
    return {}
  }),

  completeFlowStageMove: (index, startPosition) => {
    const state = useEditorStore.getState()
    const projectId = state.activeProjectId
    if (!projectId) return
    const project = state.projects[projectId]
    if (!project) return
    const stages = project.viewConfig.flowStages
    if (index < 0 || index >= stages.length) return
    const finalPosition = stages[index].position
    if (finalPosition === startPosition) return
    trackEvent('flow_stage_moved', project, {
      entity_type: 'flow_stage',
      name: stages[index].name,
      old_position: startPosition,
      new_position: finalPosition,
    })
  },

  addFlowStage: (name, position?) => set((state) => {
    const projectId = state.activeProjectId
    if (!projectId) return {}

    const project = state.projects[projectId]
    if (!project) return {}

    const stages = project.viewConfig.flowStages

    // Auto-calculate position if not provided
    const finalPosition = position ?? calculateNextStagePosition(stages)

    validateStageName(stages, name)
    validateStagePosition(stages, finalPosition)

    const newStage: FlowStageMarker = { name, position: finalPosition }

    trackEvent('flow_stage_created', project, {
      entity_type: 'flow_stage',
      metadata: {
        name: newStage.name,
        position: newStage.position
      }
    })

    getCollabMutations().addFlowStage(newStage)

    // Auto-select the new stage (it's added at the end, so index is length)
    const newStageIndex = stages.length

    return {
      ...createSelectionState(newStageIndex, 'stage'),
    }
  }),

  deleteFlowStage: (index) => set((state) => {
    const projectId = state.activeProjectId
    if (!projectId) return {}

    const project = state.projects[projectId]
    if (!project) return {}

    const stages = project.viewConfig.flowStages
    if (index < 0 || index >= stages.length) return {}

    const deletedStage = stages[index]

    trackEvent('flow_stage_deleted', project, {
      entity_type: 'flow_stage',
      metadata: {
        name: deletedStage.name,
        position: deletedStage.position
      }
    })

    getCollabMutations().deleteFlowStage(index)

    // Clear selection if deleted stage was selected, or adjust index if needed
    let newSelectedStageIndex = state.selectedStageIndex
    if (state.selectedStageIndex !== null) {
      if (state.selectedStageIndex === index) {
        newSelectedStageIndex = null
      } else if (state.selectedStageIndex > index) {
        newSelectedStageIndex = state.selectedStageIndex - 1
      }
    }

    return {
      selectedStageIndex: newSelectedStageIndex,
    }
  }),

  undo: () => set(() => {
    getCollabUndoRedo().undo()
    trackEvent('undo_used', null)
    return {}
  }),

  redo: () => set(() => {
    getCollabUndoRedo().redo()
    trackEvent('redo_used', null)
    return {}
  }),

  fitToMap: () => {
    if (globalFitViewCallback) {
      globalFitViewCallback()
    }
  },

  exportProject: () => {},

  importProject: async (project) => {
    const migratedProject = migrateProject(project)
    const fileSize = JSON.stringify(migratedProject).length / 1024
    trackEvent('project_imported', migratedProject, {
      file_size_kb: Math.round(fileSize),
      context_count: migratedProject.contexts.length,
      relationship_count: migratedProject.relationships.length,
      group_count: migratedProject.groups.length,
      keyframe_count: migratedProject.temporal?.keyframes.length || 0,
      user_count: migratedProject.users.length,
      need_count: migratedProject.userNeeds.length
    })

    localStorage.setItem('contextflow.activeProjectId', migratedProject.id)
    autosaveIfNeeded(migratedProject.id, { [migratedProject.id]: migratedProject })

    useEditorStore.setState((state) => ({
      projects: {
        ...state.projects,
        [migratedProject.id]: migratedProject,
      },
      activeProjectId: migratedProject.id,
      ...createSelectionState(null, 'context'),
    }))

    await reconnectCollabForProject(migratedProject.id, migratedProject)
  },

  reset: () => set({
    activeProjectId: sampleProject.id,
    projects: {
      [sampleProject.id]: sampleProject,
      [cbioportal.id]: cbioportal,
    },
    activeViewMode: 'flow',
    ...createSelectionState(null, 'context'),
    undoStack: [],
    redoStack: [],
  }),

  loadSharedProject: async (projectId: string) => {
    trackEvent('shared_project_opened', null, {
      project_id: projectId,
    })

    // Create a placeholder project for the shared project
    const placeholderProject: Project = {
      id: projectId,
      name: 'Loading...',
      contexts: [],
      relationships: [],
      repos: [],
      people: [],
      teams: [],
      groups: [],
      users: [],
      userNeeds: [],
      userNeedConnections: [],
      needContextConnections: [],
      viewConfig: {
        flowStages: [],
      },
    }

    // Add placeholder to projects and set as active
    useEditorStore.setState((state) => ({
      projects: {
        ...state.projects,
        [projectId]: placeholderProject,
      },
      activeProjectId: projectId,
      ...createSelectionState(null, 'context'),
      undoStack: [],
      redoStack: [],
    }))

    await reconnectCollabForProject(projectId, placeholderProject, { loadExisting: true })

    // Also update localStorage to remember this project
    localStorage.setItem('contextflow.activeProjectId', projectId)
  },

  // Temporal actions
  toggleTemporalMode: () => set((state) => {
    const projectId = state.activeProjectId
    if (!projectId) return {}

    const project = state.projects[projectId]
    if (!project) return {}

    const currentlyEnabled = project.temporal?.enabled || false
    getCollabMutations().toggleTemporal(!currentlyEnabled)
    trackEvent('temporal_mode_toggled', project, { enabled: !currentlyEnabled })

    return {}
  }),

  setCurrentDate: (date) => set((state) => ({
    temporal: {
      ...state.temporal,
      currentDate: date,
    },
  })),

  setActiveKeyframe: (keyframeId) => set((state) => {
    const transition = calculateKeyframeTransition(
      keyframeId,
      state.temporal.activeKeyframeId,
      state.showGroups,
      state.showRelationships,
      state.temporal.savedShowGroups,
      state.temporal.savedShowRelationships
    )

    return {
      temporal: {
        ...state.temporal,
        ...transition,
      },
      ...(transition.showGroups !== undefined && { showGroups: transition.showGroups }),
      ...(transition.showRelationships !== undefined && { showRelationships: transition.showRelationships }),
    }
  }),

  addKeyframe: (date, label) => {
    const state = useEditorStore.getState()
    const projectId = state.activeProjectId
    if (!projectId) return null

    const project = state.projects[projectId]
    if (!project) return null

    const validation = validateKeyframeDate(date)
    if (!validation.valid) {
      console.error(validation.error)
      return null
    }

    const existingKeyframes = project.temporal?.keyframes || []
    if (checkDuplicateKeyframe(date, existingKeyframes)) {
      console.error('Duplicate keyframe date:', date)
      return null
    }

    const farFutureCheck = shouldWarnFarFuture(date)
    if (farFutureCheck.shouldWarn) {
      console.warn(farFutureCheck.message)
    }

    const currentYear = new Date().getFullYear()
    const keyframeYear = parseInt(date.split('-')[0])
    const positions = captureContextPositions(project.contexts)

    if (shouldAutoCreateCurrentKeyframe(existingKeyframes, keyframeYear, currentYear, date)) {
      const nowKeyframe = createCurrentKeyframe(currentYear, positions, project.contexts.map(c => c.id))
      getCollabMutations().addKeyframe(nowKeyframe)
    }

    const newKeyframe: TemporalKeyframe = {
      id: `keyframe-${Date.now()}`,
      date,
      label,
      positions,
      activeContextIds: project.contexts.map(c => c.id),
    }
    getCollabMutations().addKeyframe(newKeyframe)

    trackEvent('keyframe_created', project, {
      entity_type: 'keyframe',
      entity_id: newKeyframe.id,
      metadata: {
        date: newKeyframe.date,
        context_count: Object.keys(newKeyframe.positions).length,
        auto_created_now_keyframe: shouldAutoCreateCurrentKeyframe(existingKeyframes, keyframeYear, currentYear, date)
      }
    })

    return newKeyframe.id
  },

  deleteKeyframe: (keyframeId) => set((state) => {
    const projectId = state.activeProjectId
    if (!projectId) return {}

    const project = state.projects[projectId]
    if (!project || !project.temporal) return {}

    const keyframeToDelete = project.temporal.keyframes.find(kf => kf.id === keyframeId)
    if (!keyframeToDelete) return {}

    getCollabMutations().deleteKeyframe(keyframeId)

    trackEvent('keyframe_deleted', project, {
      entity_type: 'keyframe',
      entity_id: keyframeId,
      metadata: {
        date: keyframeToDelete.date
      }
    })

    return {}
  }),

  updateKeyframe: (keyframeId, updates) => set((state) => {
    const projectId = state.activeProjectId
    const project = projectId ? state.projects[projectId] : null
    if (project) {
      const oldKeyframe = project.temporal?.keyframes.find(kf => kf.id === keyframeId)
      if (oldKeyframe) {
        if ('label' in updates && updates.label !== oldKeyframe.label) {
          trackTextFieldEdit(project, 'keyframe', 'label', oldKeyframe.label, updates.label, 'inspector')
        }
        if ('date' in updates && updates.date !== oldKeyframe.date) {
          trackTextFieldEdit(project, 'keyframe', 'date', oldKeyframe.date, updates.date, 'inspector')
        }
      }
    }
    getCollabMutations().updateKeyframe(keyframeId, updates)
    return {}
  }),

  updateKeyframeContextPosition: (keyframeId, contextId, x, y) => set((state) => {
    const projectId = state.activeProjectId
    if (!projectId) return {}

    const project = state.projects[projectId]
    if (!project) return {}

    getCollabMutations().updateKeyframeContextPosition(keyframeId, contextId, { x, y })

    trackEvent('keyframe_context_position_changed', project, {
      entity_type: 'keyframe',
      entity_id: keyframeId,
      metadata: {
        context_id: contextId,
        keyframe_id: keyframeId
      }
    })

    return {}
  }),
}))

initializeBuiltInProjects(useEditorStore.setState)

// Initialize collab mode for the active project at startup
const initialState = useEditorStore.getState()
if (initialState.activeProjectId && initialState.projects[initialState.activeProjectId]) {
  const onProjectChange = (updatedProject: Project): void => {
    useEditorStore.setState((s) => ({
      projects: {
        ...s.projects,
        [updatedProject.id]: updatedProject,
      },
    }))
  }
  initializeCollabMode(initialState.projects[initialState.activeProjectId], { onProjectChange })
}
