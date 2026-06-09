import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useEditorStore } from '../store'
import * as analytics from '../../utils/analytics'
import { getStoredViewMode } from '../viewModePersistence'

function findProjectByName(
  projects: Record<string, { name: string }>,
  name: string
): string | undefined {
  return Object.keys(projects).find((id) => projects[id].name === name)
}

describe('store view-mode persistence', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    useEditorStore.setState(useEditorStore.getInitialState())
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('lands a new blank project in Context Map', () => {
    const state = useEditorStore.getState()
    // Fire and forget: reconnectCollabForProject hangs in tests, but the
    // synchronous state update runs before its await.
    state.createProject('Fresh Project')

    expect(useEditorStore.getState().activeViewMode).toBe('context-map')
  })

  it('persists the chosen view and restores it when reopening the project', () => {
    const state = useEditorStore.getState()
    const acmeId = findProjectByName(state.projects, 'ACME E-Commerce Platform')!

    state.setActiveProject(acmeId)
    state.setViewMode('strategic')
    expect(getStoredViewMode(acmeId)).toBe('strategic')

    // Switch away to another project, then reopen the first.
    const otherId = Object.keys(state.projects).find((id) => id !== acmeId)!
    state.setActiveProject(otherId)
    state.setActiveProject(acmeId)

    expect(useEditorStore.getState().activeViewMode).toBe('strategic')
  })

  it('keeps an existing project with no stored view in Value Stream', () => {
    const state = useEditorStore.getState()
    const acmeId = findProjectByName(state.projects, 'ACME E-Commerce Platform')!

    state.setActiveProject(acmeId)

    expect(useEditorStore.getState().activeViewMode).toBe('flow')
  })

  it('reports the second-view FTUE milestone when leaving the Context Map default', () => {
    const ftueSpy = vi.spyOn(analytics, 'trackFTUEMilestone').mockImplementation(() => {})

    const state = useEditorStore.getState()
    state.createProject('Fresh Project')
    expect(useEditorStore.getState().activeViewMode).toBe('context-map')

    useEditorStore.getState().setViewMode('flow')

    expect(ftueSpy).toHaveBeenCalledWith(
      'second_view_discovered',
      expect.anything(),
      expect.objectContaining({ views_used: ['context-map', 'flow'] })
    )
  })
})
