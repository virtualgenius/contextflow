import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useEditorStore } from '../store'
import * as analytics from '../../utils/analytics'

function findProjectByName(projects: Record<string, { name: string }>, name: string): string | undefined {
  return Object.keys(projects).find(id => projects[id].name === name)
}

function activateSampleProject(): string {
  const state = useEditorStore.getState()
  const acmeId = findProjectByName(state.projects, 'ACME E-Commerce Platform')!
  state.setActiveProject(acmeId)
  return acmeId
}

describe('store analytics integration', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let trackEventSpy: any

  beforeEach(() => {
    // Reset store to initial state
    useEditorStore.setState(useEditorStore.getInitialState())

    // Mock trackEvent
    trackEventSpy = vi.spyOn(analytics, 'trackEvent')
    trackEventSpy.mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('setViewMode', () => {
    it('tracks view_switched event with from and to views', () => {
      const state = useEditorStore.getState()

      // Initial view is 'flow'
      expect(state.activeViewMode).toBe('flow')

      // Switch to strategic view
      state.setViewMode('strategic')

      expect(trackEventSpy).toHaveBeenCalledWith(
        'view_switched',
        expect.any(Object), // project
        {
          from_view: 'flow',
          to_view: 'strategic'
        }
      )
    })

    it('tracks view_switched event when switching to distillation', () => {
      const state = useEditorStore.getState()

      // Switch to distillation view
      state.setViewMode('distillation')

      expect(trackEventSpy).toHaveBeenCalledWith(
        'view_switched',
        expect.any(Object),
        {
          from_view: 'flow',
          to_view: 'distillation'
        }
      )
    })

    it('includes project metadata in view_switched event', () => {
      const state = useEditorStore.getState()
      const projectId = state.activeProjectId
      const project = projectId ? state.projects[projectId] : null

      state.setViewMode('strategic')

      expect(trackEventSpy).toHaveBeenCalledWith(
        'view_switched',
        project,
        expect.any(Object)
      )
    })
  })

  describe('setActiveProject', () => {
    it('tracks project_opened event with sample origin for built-in projects', () => {
      const state = useEditorStore.getState()

      const cbioportalId = findProjectByName(state.projects, 'cBioPortal Demo Map')
      expect(cbioportalId).toBeDefined()

      state.setActiveProject(cbioportalId!)

      const project = state.projects[cbioportalId!]

      expect(trackEventSpy).toHaveBeenCalledWith(
        'project_opened',
        project,
        {
          project_origin: 'sample'
        }
      )
    })

    it('tracks project_opened with sample origin for ACME E-Commerce Platform', () => {
      const state = useEditorStore.getState()

      const acmeId = findProjectByName(state.projects, 'ACME E-Commerce Platform')
      expect(acmeId).toBeDefined()

      state.setActiveProject(acmeId!)

      expect(trackEventSpy).toHaveBeenCalledWith(
        'project_opened',
        expect.any(Object),
        {
          project_origin: 'sample'
        }
      )
    })

    it('tracks project_opened with sample origin for Elan Extended Warranty', () => {
      const state = useEditorStore.getState()

      const elanId = findProjectByName(state.projects, 'Elan Extended Warranty')
      expect(elanId).toBeDefined()

      state.setActiveProject(elanId!)

      expect(trackEventSpy).toHaveBeenCalledWith(
        'project_opened',
        expect.any(Object),
        {
          project_origin: 'sample'
        }
      )
    })

    it('tracks project_opened with sample origin when switching between sample projects', () => {
      const state = useEditorStore.getState()

      const acmeId = findProjectByName(state.projects, 'ACME E-Commerce Platform')
      const cbioportalId = findProjectByName(state.projects, 'cBioPortal Demo Map')
      expect(acmeId).toBeDefined()
      expect(cbioportalId).toBeDefined()

      // First open ACME (will be 'sample')
      state.setActiveProject(acmeId!)
      trackEventSpy.mockClear()

      // Then switch to cbioportal (still 'sample' since it's a built-in sample)
      state.setActiveProject(cbioportalId!)

      expect(trackEventSpy).toHaveBeenCalledWith(
        'project_opened',
        expect.any(Object),
        {
          project_origin: 'sample'
        }
      )
    })

    it('does not track event for non-existent project', () => {
      const state = useEditorStore.getState()

      state.setActiveProject('non-existent-project-id')

      expect(trackEventSpy).not.toHaveBeenCalled()
    })
  })

  describe('project lifecycle', () => {
    it('setActiveProject updates activeProjectId', () => {
      const state = useEditorStore.getState()

      const cbioportalId = findProjectByName(state.projects, 'cBioPortal Demo Map')
      expect(cbioportalId).toBeDefined()

      state.setActiveProject(cbioportalId!)

      // Get fresh state after update
      const updatedState = useEditorStore.getState()
      expect(updatedState.activeProjectId).toBe(cbioportalId)
    })

    it('setViewMode updates activeViewMode', () => {
      const state = useEditorStore.getState()

      state.setViewMode('strategic')

      // Get fresh state after update
      const updatedState = useEditorStore.getState()
      expect(updatedState.activeViewMode).toBe('strategic')
    })
  })

  describe('createProject', () => {
    it('tracks project_created event with blank creation method', () => {
      const state = useEditorStore.getState()

      // Fire and forget (don't await - reconnectCollabForProject hangs in tests)
      state.createProject('Test Project')

      expect(trackEventSpy).toHaveBeenCalledWith(
        'project_created',
        expect.objectContaining({ name: 'Test Project' }),
        { creation_method: 'blank' }
      )
    })
  })

  describe('duplicateProject', () => {
    it('tracks project_created event with duplicate creation method', () => {
      const state = useEditorStore.getState()
      const sampleId = findProjectByName(state.projects, 'ACME E-Commerce Platform')
      expect(sampleId).toBeDefined()

      state.duplicateProject(sampleId!)

      expect(trackEventSpy).toHaveBeenCalledWith(
        'project_created',
        expect.any(Object),
        { creation_method: 'duplicate' }
      )
    })
  })

  describe('deleteProject', () => {
    it('tracks project_deleted event with remaining count', () => {
      const state = useEditorStore.getState()
      const projectCount = Object.keys(state.projects).length

      // Create a project to delete (so we don't hit the "must have at least one" guard)
      state.createProject('Deletable Project')
      trackEventSpy.mockClear()

      const updatedState = useEditorStore.getState()
      const deletableId = findProjectByName(updatedState.projects, 'Deletable Project')
      expect(deletableId).toBeDefined()

      updatedState.deleteProject(deletableId!)

      expect(trackEventSpy).toHaveBeenCalledWith(
        'project_deleted',
        expect.objectContaining({ name: 'Deletable Project' }),
        { remaining_project_count: projectCount }
      )
    })
  })

  describe('renameProject', () => {
    it('tracks project_renamed event', () => {
      const state = useEditorStore.getState()
      const sampleId = findProjectByName(state.projects, 'ACME E-Commerce Platform')
      expect(sampleId).toBeDefined()

      state.renameProject(sampleId!, 'Renamed Project')

      expect(trackEventSpy).toHaveBeenCalledWith(
        'project_renamed',
        expect.any(Object)
      )
    })
  })

  // Bead contextflow-mkh: first_relationship_added FTUE milestone
  describe('addRelationship FTUE milestone', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let trackFTUEMilestoneSpy: any

    beforeEach(() => {
      trackFTUEMilestoneSpy = vi.spyOn(analytics, 'trackFTUEMilestone')
      trackFTUEMilestoneSpy.mockImplementation(() => {})
    })

    it('tracks first_relationship_added FTUE milestone when adding a relationship', () => {
      const projectId = activateSampleProject()
      trackFTUEMilestoneSpy.mockClear()

      const state = useEditorStore.getState()
      const project = state.projects[projectId]
      const ctx1 = project.contexts[0].id
      const ctx2 = project.contexts[1].id

      state.addRelationship(ctx1, ctx2, 'partnership', '')

      expect(trackFTUEMilestoneSpy).toHaveBeenCalledWith('first_relationship_added', null)
    })
  })

  // Bead contextflow-9i6: Track connection deletion events
  describe('connection deletion events', () => {
    it('tracks user_need_connection_deleted event', () => {
      const projectId = activateSampleProject()
      const state = useEditorStore.getState()

      state.addUser('Test User')
      const afterUser = useEditorStore.getState()
      const user = afterUser.projects[projectId].users[afterUser.projects[projectId].users.length - 1]

      state.addUserNeed('Test Need')
      const afterNeed = useEditorStore.getState()
      const need = afterNeed.projects[projectId].userNeeds[afterNeed.projects[projectId].userNeeds.length - 1]

      const connId = state.createUserNeedConnection(user.id, need.id)
      expect(connId).toBeDefined()

      trackEventSpy.mockClear()

      state.deleteUserNeedConnection(connId!)

      expect(trackEventSpy).toHaveBeenCalledWith(
        'user_need_connection_deleted',
        null,
        { entity_type: 'user_need_connection', entity_id: connId }
      )
    })

    it('tracks need_context_connection_deleted event', () => {
      const projectId = activateSampleProject()
      const state = useEditorStore.getState()
      const project = state.projects[projectId]

      state.addUserNeed('Test Need')
      const afterNeed = useEditorStore.getState()
      const need = afterNeed.projects[projectId].userNeeds[afterNeed.projects[projectId].userNeeds.length - 1]
      const contextId = project.contexts[0].id

      const connId = state.createNeedContextConnection(need.id, contextId)
      expect(connId).toBeDefined()

      trackEventSpy.mockClear()

      state.deleteNeedContextConnection(connId!)

      expect(trackEventSpy).toHaveBeenCalledWith(
        'need_context_connection_deleted',
        null,
        { entity_type: 'need_context_connection', entity_id: connId }
      )
    })
  })

  // Bead contextflow-gwm: Track entity property updates
  describe('entity property update tracking', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let trackPropertyChangeSpy: any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let trackTextFieldEditSpy: any

    beforeEach(() => {
      trackPropertyChangeSpy = vi.spyOn(analytics, 'trackPropertyChange')
      trackPropertyChangeSpy.mockImplementation(() => {})
      trackTextFieldEditSpy = vi.spyOn(analytics, 'trackTextFieldEdit')
      trackTextFieldEditSpy.mockImplementation(() => {})
    })

    it('tracks text field edit on updateGroup name change', () => {
      const projectId = activateSampleProject()
      const state = useEditorStore.getState()
      const project = state.projects[projectId]
      const group = project.groups[0]

      trackTextFieldEditSpy.mockClear()

      state.updateGroup(group.id, { label: 'Updated Group Name' })

      expect(trackTextFieldEditSpy).toHaveBeenCalledWith(
        expect.any(Object),
        'group',
        'name',
        group.label,
        'Updated Group Name',
        'inspector'
      )
    })

    it('tracks property change on updateGroup color change', () => {
      const projectId = activateSampleProject()
      const state = useEditorStore.getState()
      const project = state.projects[projectId]
      const group = project.groups[0]

      trackPropertyChangeSpy.mockClear()

      state.updateGroup(group.id, { color: '#ff0000' })

      expect(trackPropertyChangeSpy).toHaveBeenCalledWith(
        'group_property_changed',
        expect.any(Object),
        'group',
        group.id,
        'color',
        group.color,
        '#ff0000'
      )
    })

    it('tracks text field edit on updateTeam name change', () => {
      const projectId = activateSampleProject()
      const state = useEditorStore.getState()
      const project = state.projects[projectId]
      const team = project.teams[0]

      trackTextFieldEditSpy.mockClear()

      state.updateTeam(team.id, { name: 'Updated Team' })

      expect(trackTextFieldEditSpy).toHaveBeenCalledWith(
        expect.any(Object),
        'team',
        'name',
        team.name,
        'Updated Team',
        'inspector'
      )
    })

    it('tracks text field edit on updateUser name change', () => {
      const projectId = activateSampleProject()
      const state = useEditorStore.getState()
      const project = state.projects[projectId]
      const user = project.users[0]

      trackTextFieldEditSpy.mockClear()

      state.updateUser(user.id, { name: 'Updated User' })

      expect(trackTextFieldEditSpy).toHaveBeenCalledWith(
        expect.any(Object),
        'user',
        'name',
        user.name,
        'Updated User',
        'inspector'
      )
    })

    it('tracks property change on updateUser isExternal change', () => {
      const projectId = activateSampleProject()
      const state = useEditorStore.getState()
      const project = state.projects[projectId]
      const user = project.users[0]
      const newValue = !user.isExternal

      trackPropertyChangeSpy.mockClear()

      state.updateUser(user.id, { isExternal: newValue })

      expect(trackPropertyChangeSpy).toHaveBeenCalledWith(
        'user_property_changed',
        expect.any(Object),
        'user',
        user.id,
        'isExternal',
        user.isExternal,
        newValue
      )
    })

    it('tracks text field edit on updateUserNeed name change', () => {
      const projectId = activateSampleProject()
      const state = useEditorStore.getState()
      const project = state.projects[projectId]
      const need = project.userNeeds[0]

      trackTextFieldEditSpy.mockClear()

      state.updateUserNeed(need.id, { name: 'Updated Need' })

      expect(trackTextFieldEditSpy).toHaveBeenCalledWith(
        expect.any(Object),
        'user_need',
        'name',
        need.name,
        'Updated Need',
        'inspector'
      )
    })

    it('tracks property change on updateUserNeed visibility change', () => {
      const projectId = activateSampleProject()
      const state = useEditorStore.getState()
      const project = state.projects[projectId]
      const need = project.userNeeds[0]

      trackPropertyChangeSpy.mockClear()

      state.updateUserNeed(need.id, { visibility: false })

      expect(trackPropertyChangeSpy).toHaveBeenCalledWith(
        'user_need_property_changed',
        expect.any(Object),
        'user_need',
        need.id,
        'visibility',
        need.visibility,
        false
      )
    })

    it('tracks text field edit on updateKeyframe label change', () => {
      const projectId = activateSampleProject()

      // Manually add a keyframe to the project since collab mutations are no-ops in tests
      const state = useEditorStore.getState()
      const project = state.projects[projectId]
      const keyframeId = 'test-keyframe-1'
      const updatedProject = {
        ...project,
        temporal: {
          enabled: true,
          keyframes: [{ id: keyframeId, date: '2030', label: 'Original Label', positions: {}, activeContextIds: [] }],
        },
      }
      useEditorStore.setState({
        projects: { ...state.projects, [projectId]: updatedProject },
      })

      trackTextFieldEditSpy.mockClear()

      useEditorStore.getState().updateKeyframe(keyframeId, { label: 'Updated Label' })

      expect(trackTextFieldEditSpy).toHaveBeenCalledWith(
        expect.any(Object),
        'keyframe',
        'label',
        'Original Label',
        'Updated Label',
        'inspector'
      )
    })

    it('tracks text field edit on updateFlowStage name change', () => {
      const projectId = activateSampleProject()
      const state = useEditorStore.getState()
      const project = state.projects[projectId]
      const stages = project.viewConfig.flowStages

      if (stages.length === 0) return // skip if no stages

      const oldName = stages[0].name

      trackTextFieldEditSpy.mockClear()

      state.updateFlowStage(0, { name: 'Updated Stage Name' })

      expect(trackTextFieldEditSpy).toHaveBeenCalledWith(
        expect.any(Object),
        'flow_stage',
        'name',
        oldName,
        'Updated Stage Name',
        'inspector'
      )
    })

    it('tracks updateUserNeedConnection event', () => {
      const projectId = activateSampleProject()
      const state = useEditorStore.getState()

      state.addUser('Conn User')
      const afterUser = useEditorStore.getState()
      const user = afterUser.projects[projectId].users[afterUser.projects[projectId].users.length - 1]

      state.addUserNeed('Conn Need')
      const afterNeed = useEditorStore.getState()
      const need = afterNeed.projects[projectId].userNeeds[afterNeed.projects[projectId].userNeeds.length - 1]

      const connId = state.createUserNeedConnection(user.id, need.id)
      expect(connId).toBeDefined()

      trackEventSpy.mockClear()

      state.updateUserNeedConnection(connId!, { userId: user.id })

      expect(trackEventSpy).toHaveBeenCalledWith(
        'user_need_connection_updated',
        null,
        { entity_type: 'user_need_connection', entity_id: connId }
      )
    })

    it('tracks updateNeedContextConnection event', () => {
      const projectId = activateSampleProject()
      const state = useEditorStore.getState()
      const project = state.projects[projectId]

      state.addUserNeed('NCC Need')
      const afterNeed = useEditorStore.getState()
      const need = afterNeed.projects[projectId].userNeeds[afterNeed.projects[projectId].userNeeds.length - 1]

      const connId = state.createNeedContextConnection(need.id, project.contexts[0].id)
      expect(connId).toBeDefined()

      trackEventSpy.mockClear()

      state.updateNeedContextConnection(connId!, { contextId: project.contexts[0].id })

      expect(trackEventSpy).toHaveBeenCalledWith(
        'need_context_connection_updated',
        null,
        { entity_type: 'need_context_connection', entity_id: connId }
      )
    })
  })

  // Bead contextflow-kmy: Track group membership changes
  describe('group membership tracking', () => {
    it('tracks context_removed_from_group event', () => {
      const projectId = activateSampleProject()
      const state = useEditorStore.getState()
      const project = state.projects[projectId]
      const ctx1 = project.contexts[0].id
      const ctx2 = project.contexts[1].id

      useEditorStore.setState({ selectedContextIds: [ctx1, ctx2] })
      state.createGroup('Membership Group')
      const afterGroup = useEditorStore.getState()
      const group = afterGroup.projects[projectId].groups[afterGroup.projects[projectId].groups.length - 1]

      trackEventSpy.mockClear()

      state.removeContextFromGroup(group.id, ctx1)

      expect(trackEventSpy).toHaveBeenCalledWith(
        'context_removed_from_group',
        null,
        { entity_type: 'group', entity_id: group.id }
      )
    })

    it('tracks context_added_to_group event', () => {
      const projectId = activateSampleProject()
      const state = useEditorStore.getState()
      const project = state.projects[projectId]
      const ctx1 = project.contexts[0].id
      const ctx2 = project.contexts[1].id

      useEditorStore.setState({ selectedContextIds: [ctx1] })
      state.createGroup('Add To Group')
      const afterGroup = useEditorStore.getState()
      const group = afterGroup.projects[projectId].groups[afterGroup.projects[projectId].groups.length - 1]

      trackEventSpy.mockClear()

      state.addContextToGroup(group.id, ctx2)

      expect(trackEventSpy).toHaveBeenCalledWith(
        'context_added_to_group',
        null,
        { entity_type: 'group', entity_id: group.id }
      )
    })

    it('tracks context_added_to_group event with context_count for bulk add', () => {
      const projectId = activateSampleProject()
      const state = useEditorStore.getState()
      const project = state.projects[projectId]
      const ctx1 = project.contexts[0].id

      useEditorStore.setState({ selectedContextIds: [ctx1] })
      state.createGroup('Bulk Group')
      const afterGroup = useEditorStore.getState()
      const group = afterGroup.projects[projectId].groups[afterGroup.projects[projectId].groups.length - 1]

      trackEventSpy.mockClear()

      const newContextIds = project.contexts.slice(1, 3).map(c => c.id)
      state.addContextsToGroup(group.id, newContextIds)

      expect(trackEventSpy).toHaveBeenCalledWith(
        'context_added_to_group',
        null,
        { entity_type: 'group', entity_id: group.id, context_count: newContextIds.length }
      )
    })
  })

  // Bead contextflow-bt8: Track view preference toggles
  describe('view preference toggles', () => {
    it('tracks view_preference_changed for toggleShowGroups', () => {
      const state = useEditorStore.getState()
      const currentValue = state.showGroups

      state.toggleShowGroups()

      expect(trackEventSpy).toHaveBeenCalledWith(
        'view_preference_changed',
        null,
        { preference_name: 'showGroups', new_value: !currentValue }
      )
    })

    it('tracks view_preference_changed for toggleShowRelationships', () => {
      const state = useEditorStore.getState()
      const currentValue = state.showRelationships

      state.toggleShowRelationships()

      expect(trackEventSpy).toHaveBeenCalledWith(
        'view_preference_changed',
        null,
        { preference_name: 'showRelationships', new_value: !currentValue }
      )
    })

    it('tracks view_preference_changed for toggleIssueLabels', () => {
      const state = useEditorStore.getState()
      const currentValue = state.showIssueLabels

      state.toggleIssueLabels()

      expect(trackEventSpy).toHaveBeenCalledWith(
        'view_preference_changed',
        null,
        { preference_name: 'showIssueLabels', new_value: !currentValue }
      )
    })

    it('tracks view_preference_changed for toggleTeamLabels', () => {
      const state = useEditorStore.getState()
      const currentValue = state.showTeamLabels

      state.toggleTeamLabels()

      expect(trackEventSpy).toHaveBeenCalledWith(
        'view_preference_changed',
        null,
        { preference_name: 'showTeamLabels', new_value: !currentValue }
      )
    })

    it('tracks view_preference_changed for toggleRelationshipLabels', () => {
      const state = useEditorStore.getState()
      const currentValue = state.showRelationshipLabels

      state.toggleRelationshipLabels()

      expect(trackEventSpy).toHaveBeenCalledWith(
        'view_preference_changed',
        null,
        { preference_name: 'showRelationshipLabels', new_value: !currentValue }
      )
    })

    it('tracks view_preference_changed for toggleHelpTooltips', () => {
      const state = useEditorStore.getState()
      const currentValue = state.showHelpTooltips

      state.toggleHelpTooltips()

      expect(trackEventSpy).toHaveBeenCalledWith(
        'view_preference_changed',
        null,
        { preference_name: 'showHelpTooltips', new_value: !currentValue }
      )
    })

    it('tracks view_preference_changed for setGroupOpacity', () => {
      const state = useEditorStore.getState()

      state.setGroupOpacity(0.5)

      expect(trackEventSpy).toHaveBeenCalledWith(
        'view_preference_changed',
        null,
        { preference_name: 'groupOpacity', new_value: 0.5 }
      )
    })

    it('skips analytics for setGroupOpacity when skipAnalytics is true', () => {
      const state = useEditorStore.getState()

      state.setGroupOpacity(0.7, { skipAnalytics: true })

      expect(trackEventSpy).not.toHaveBeenCalled()
      expect(useEditorStore.getState().groupOpacity).toBe(0.7)
    })

    it('tracks view_preference_changed for setColorByMode', () => {
      const state = useEditorStore.getState()

      state.setColorByMode('strategic')

      expect(trackEventSpy).toHaveBeenCalledWith(
        'view_preference_changed',
        null,
        { preference_name: 'colorByMode', new_value: 'strategic' }
      )
    })
  })

  // Bead contextflow-mb4: Track temporal mode toggle
  describe('temporal mode toggle', () => {
    it('tracks temporal_mode_toggled event', () => {
      activateSampleProject()
      const state = useEditorStore.getState()
      trackEventSpy.mockClear()

      state.toggleTemporalMode()

      expect(trackEventSpy).toHaveBeenCalledWith(
        'temporal_mode_toggled',
        expect.any(Object),
        { enabled: true }
      )
    })
  })

  // Bead contextflow-4ei: Track undo/redo usage
  describe('undo/redo tracking', () => {
    it('tracks undo_used event', () => {
      const state = useEditorStore.getState()

      state.undo()

      expect(trackEventSpy).toHaveBeenCalledWith('undo_used', null)
    })

    it('tracks redo_used event', () => {
      const state = useEditorStore.getState()

      state.redo()

      expect(trackEventSpy).toHaveBeenCalledWith('redo_used', null)
    })
  })
})
