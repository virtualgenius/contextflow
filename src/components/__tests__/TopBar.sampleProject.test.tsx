import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TopBar } from '../TopBar'
import { useEditorStore } from '../../model/store'
import { sampleProject } from '../../model/builtInProjects'

vi.mock('../../model/store', () => ({
  useEditorStore: Object.assign(vi.fn(), { setState: vi.fn(), getState: vi.fn() }),
}))

vi.mock('../../hooks/useUrlRouter', () => ({
  useUrlRouter: () => ({ route: 'home', navigate: vi.fn() }),
}))

vi.mock('../CloudStatusIndicator', () => ({
  CloudStatusIndicator: () => <div data-testid="cloud-status" />,
}))

const setActiveProject = vi.fn()

function setupStore() {
  const state = {
    activeProjectId: 'proj-1',
    projects: { 'proj-1': { id: 'proj-1', name: 'Test', temporal: { enabled: false } } },
    activeViewMode: 'context-map',
    setViewMode: vi.fn(),
    setActiveProject,
    undoStack: [],
    redoStack: [],
    undo: vi.fn(),
    redo: vi.fn(),
    beginContextDraft: vi.fn(),
    importProject: vi.fn(),
    clearActiveProject: vi.fn(),
    toggleTemporalMode: vi.fn(),
  }
  vi.mocked(useEditorStore).mockImplementation((selector) => selector(state as never))
}

describe('TopBar "Explore Sample Project"', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupStore()
  })

  it('opens the built-in sample project (an id that exists in the store)', () => {
    render(<TopBar />)

    fireEvent.click(screen.getByRole('button', { name: 'Help' }))
    fireEvent.click(screen.getByRole('button', { name: 'Getting Started Guide' }))
    fireEvent.click(screen.getByRole('button', { name: 'Explore Sample Project' }))

    expect(setActiveProject).toHaveBeenCalledWith(sampleProject.id)
    expect(sampleProject.id).not.toBe('acme-ecommerce')
  })
})
