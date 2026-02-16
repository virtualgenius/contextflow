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

  it('clears undo and redo stacks', () => {
    useEditorStore.setState({
      undoStack: [{ type: 'addContext', payload: {} }],
      redoStack: [{ type: 'deleteContext', payload: {} }],
    })

    useEditorStore.getState().clearActiveProject()

    const state = useEditorStore.getState()
    expect(state.undoStack).toHaveLength(0)
    expect(state.redoStack).toHaveLength(0)
  })

  it('removes localStorage key', () => {
    localStorage.setItem('contextflow.activeProjectId', 'some-project')

    useEditorStore.getState().clearActiveProject()

    expect(localStorage.getItem('contextflow.activeProjectId')).toBeNull()
  })
})
