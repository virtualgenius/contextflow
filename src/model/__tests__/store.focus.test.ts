import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { useEditorStore } from '../store'
import { initializeCollabMode, destroyCollabMode } from '../sync/useCollabMode'
import type { Project } from '../types'

describe('Store - Focus State', () => {
  beforeEach(() => {
    const { reset } = useEditorStore.getState()
    reset()

    const state = useEditorStore.getState()
    const project = state.projects[state.activeProjectId!]
    const onProjectChange = (updatedProject: Project): void => {
      useEditorStore.setState((s) => ({
        projects: {
          ...s.projects,
          [updatedProject.id]: updatedProject,
        },
      }))
    }
    initializeCollabMode(project, { onProjectChange })
  })

  afterEach(() => {
    destroyCollabMode()
  })

  it('focus defaults to null', () => {
    expect(useEditorStore.getState().focus).toBeNull()
  })

  it('setFocus sets the focus subject', () => {
    useEditorStore.getState().setFocus({ kind: 'team', id: 'team-1', depth: 0 })
    expect(useEditorStore.getState().focus).toEqual({ kind: 'team', id: 'team-1', depth: 0 })
  })

  it('clearFocus clears the focus', () => {
    useEditorStore.getState().setFocus({ kind: 'team', id: 'team-1', depth: 0 })
    useEditorStore.getState().clearFocus()
    expect(useEditorStore.getState().focus).toBeNull()
  })

  it('setFocus does not change selection', () => {
    useEditorStore.getState().setSelectedContext('ctx-1')
    useEditorStore.getState().setFocus({ kind: 'team', id: 'team-1', depth: 0 })
    expect(useEditorStore.getState().selectedContextId).toBe('ctx-1')
    expect(useEditorStore.getState().selectedTeamId).toBeNull()
  })

  it('clears focus when the focused team is deleted', () => {
    const state = useEditorStore.getState()
    const teamId = state.addTeam('Focused Team')
    expect(teamId).toBeTruthy()
    useEditorStore.getState().setFocus({ kind: 'team', id: teamId!, depth: 0 })
    useEditorStore.getState().deleteTeam(teamId!)
    expect(useEditorStore.getState().focus).toBeNull()
  })

  it('keeps focus when a different team is deleted', () => {
    const deletedTeamId = useEditorStore.getState().addTeam('Doomed Team')
    useEditorStore.getState().setFocus({ kind: 'team', id: 'team-still-focused', depth: 0 })
    useEditorStore.getState().deleteTeam(deletedTeamId!)
    expect(useEditorStore.getState().focus).toEqual({
      kind: 'team',
      id: 'team-still-focused',
      depth: 0,
    })
  })
})
