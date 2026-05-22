import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('store view-filter defaults', () => {
  beforeEach(() => {
    vi.resetModules()
    localStorage.clear()
  })

  it('defaults showRelationshipLabels to false so first-time viewers see arrows without pattern-name noise', async () => {
    const { useEditorStore } = await import('../store')
    expect(useEditorStore.getState().showRelationshipLabels).toBe(false)
  })

  it('keeps showGroups on by default to preserve capability-cluster orientation', async () => {
    const { useEditorStore } = await import('../store')
    expect(useEditorStore.getState().showGroups).toBe(true)
  })

  it('keeps showRelationships on by default; arrows are the point of a context map', async () => {
    const { useEditorStore } = await import('../store')
    expect(useEditorStore.getState().showRelationships).toBe(true)
  })

  it('keeps showIssueLabels off by default; issues are workshop output, not first-read material', async () => {
    const { useEditorStore } = await import('../store')
    expect(useEditorStore.getState().showIssueLabels).toBe(false)
  })

  it('keeps showTeamLabels off by default', async () => {
    const { useEditorStore } = await import('../store')
    expect(useEditorStore.getState().showTeamLabels).toBe(false)
  })

  it('honors a user-stored showRelationshipLabels=true override', async () => {
    localStorage.setItem('contextflow.showRelationshipLabels', 'true')
    const { useEditorStore } = await import('../store')
    expect(useEditorStore.getState().showRelationshipLabels).toBe(true)
  })

  it('honors a user-stored showRelationshipLabels=false override', async () => {
    localStorage.setItem('contextflow.showRelationshipLabels', 'false')
    const { useEditorStore } = await import('../store')
    expect(useEditorStore.getState().showRelationshipLabels).toBe(false)
  })
})
