import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TopBar } from '../TopBar'
import { useEditorStore } from '../../model/store'
import type { ViewMode } from '../../model/storeTypes'

vi.mock('../../model/store', () => ({
  useEditorStore: Object.assign(vi.fn(), { setState: vi.fn(), getState: vi.fn() }),
}))

vi.mock('../../hooks/useUrlRouter', () => ({
  useUrlRouter: () => ({ route: 'home', navigate: vi.fn() }),
}))

// Stub heavy, collab-dependent children so this test focuses on the add-button
// affordances gated by view mode.
vi.mock('../CloudStatusIndicator', () => ({
  CloudStatusIndicator: () => <div data-testid="cloud-status" />,
}))
vi.mock('../settings/SettingsPopover', () => ({
  SettingsPopover: () => <div data-testid="settings-popover" />,
}))

const project = {
  id: 'proj-1',
  name: 'Test',
  temporal: { enabled: false },
}

const beginContextDraft = vi.fn()

function setupStore(viewMode: ViewMode) {
  const state = {
    activeProjectId: 'proj-1',
    projects: { 'proj-1': project },
    activeViewMode: viewMode,
    setViewMode: vi.fn(),
    setActiveProject: vi.fn(),
    undoStack: [],
    redoStack: [],
    undo: vi.fn(),
    redo: vi.fn(),
    addContext: vi.fn(),
    beginContextDraft,
    importProject: vi.fn(),
    clearActiveProject: vi.fn(),
    toggleTemporalMode: vi.fn(),
  }
  vi.mocked(useEditorStore).mockImplementation((selector) => selector(state as never))
}

describe('TopBar add affordances by view mode', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('hides the User and Need add buttons in Context Map', () => {
    setupStore('context-map')
    render(<TopBar />)

    expect(screen.getByText('Context')).toBeInTheDocument()
    expect(screen.queryByText('User')).not.toBeInTheDocument()
    expect(screen.queryByText('Need')).not.toBeInTheDocument()
    expect(screen.queryByText('Stage')).not.toBeInTheDocument()
  })

  it('shows the User and Need add buttons in Value Stream', () => {
    setupStore('flow')
    render(<TopBar />)

    expect(screen.getByText('Context')).toBeInTheDocument()
    expect(screen.getByText('User')).toBeInTheDocument()
    expect(screen.getByText('Need')).toBeInTheDocument()
    expect(screen.getByText('Stage')).toBeInTheDocument()
  })

  it('opens an inline entity draft (no browser prompt) for User, Need, and Stage', () => {
    setupStore('flow')
    render(<TopBar />)

    fireEvent.click(screen.getByText('User'))
    expect(beginContextDraft).toHaveBeenCalledWith({ kind: 'entity', entity: 'user' })

    fireEvent.click(screen.getByText('Need'))
    expect(beginContextDraft).toHaveBeenCalledWith({ kind: 'entity', entity: 'userNeed' })

    fireEvent.click(screen.getByText('Stage'))
    expect(beginContextDraft).toHaveBeenCalledWith({ kind: 'entity', entity: 'stage' })
  })
})
