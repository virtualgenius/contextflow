import { describe, it, expect, beforeEach } from 'vitest'
import { useEditorStore } from '../store'

describe('Store - Context name edit focus', () => {
  beforeEach(() => {
    useEditorStore.getState().reset()
  })

  it('focusContextNameId defaults to null', () => {
    expect(useEditorStore.getState().focusContextNameId).toBeNull()
  })

  it('requestContextNameEdit selects the context and flags its name field for editing', () => {
    useEditorStore.getState().requestContextNameEdit('ctx-1')
    expect(useEditorStore.getState().focusContextNameId).toBe('ctx-1')
    expect(useEditorStore.getState().selectedContextId).toBe('ctx-1')
  })

  it('clearContextNameEditFocus clears the one-shot flag', () => {
    useEditorStore.getState().requestContextNameEdit('ctx-1')
    useEditorStore.getState().clearContextNameEditFocus()
    expect(useEditorStore.getState().focusContextNameId).toBeNull()
  })
})
