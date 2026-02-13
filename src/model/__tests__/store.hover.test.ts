import { describe, it, expect, beforeEach } from 'vitest'
import { useEditorStore } from '../store'

describe('Store - Hover State', () => {
  beforeEach(() => {
    useEditorStore.getState().reset()
  })

  it('hoveredContextId defaults to null', () => {
    expect(useEditorStore.getState().hoveredContextId).toBeNull()
  })

  it('setHoveredContext sets the hovered context id', () => {
    useEditorStore.getState().setHoveredContext('ctx-1')
    expect(useEditorStore.getState().hoveredContextId).toBe('ctx-1')
  })

  it('setHoveredContext clears when set to null', () => {
    useEditorStore.getState().setHoveredContext('ctx-1')
    useEditorStore.getState().setHoveredContext(null)
    expect(useEditorStore.getState().hoveredContextId).toBeNull()
  })
})
