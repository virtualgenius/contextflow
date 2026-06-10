import { describe, it, expect, beforeEach } from 'vitest'
import { useEditorStore } from '../store'

describe('Store - clearActiveProject', () => {
  beforeEach(() => {
    useEditorStore.getState().reset()
  })

  it('sets activeProjectId to null', () => {
    expect(useEditorStore.getState().activeProjectId).not.toBeNull()

    useEditorStore.getState().clearActiveProject()

    expect(useEditorStore.getState().activeProjectId).toBeNull()
  })

  it('clears all selections', () => {
    useEditorStore.setState({
      selectedContextId: 'ctx-1',
      selectedGroupId: 'grp-1',
      selectedRelationshipId: 'rel-1',
    })

    useEditorStore.getState().clearActiveProject()

    const state = useEditorStore.getState()
    expect(state.selectedContextId).toBeNull()
    expect(state.selectedGroupId).toBeNull()
    expect(state.selectedRelationshipId).toBeNull()
  })

  it('resets undo/redo availability', () => {
    useEditorStore.setState({
      canUndo: true,
      canRedo: true,
    })

    useEditorStore.getState().clearActiveProject()

    const state = useEditorStore.getState()
    expect(state.canUndo).toBe(false)
    expect(state.canRedo).toBe(false)
  })

  it('removes localStorage key', () => {
    localStorage.setItem('contextflow.activeProjectId', 'some-project')

    useEditorStore.getState().clearActiveProject()

    expect(localStorage.getItem('contextflow.activeProjectId')).toBeNull()
  })
})
