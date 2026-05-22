import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { InspectorPanel } from '../InspectorPanel'
import { useEditorStore } from '../../model/store'
import type { Project } from '../../model/types'

vi.mock('../../model/store', () => ({
  useEditorStore: Object.assign(vi.fn(), { setState: vi.fn() }),
}))

// Stub heavy sub-inspectors so this test focuses on header chrome.
vi.mock('../inspector/ContextInspector', () => ({
  ContextInspector: () => <div data-testid="context-inspector" />,
}))
vi.mock('../inspector/RelationshipInspector', () => ({
  RelationshipInspector: () => <div data-testid="relationship-inspector" />,
}))
vi.mock('../inspector/GroupInspector', () => ({
  GroupInspector: () => <div data-testid="group-inspector" />,
}))
vi.mock('../inspector/UserInspector', () => ({
  UserInspector: () => <div data-testid="user-inspector" />,
}))
vi.mock('../inspector/UserNeedInspector', () => ({
  UserNeedInspector: () => <div data-testid="user-need-inspector" />,
}))
vi.mock('../inspector/UserNeedConnectionInspector', () => ({
  UserNeedConnectionInspector: () => <div data-testid="user-need-connection-inspector" />,
}))
vi.mock('../inspector/NeedContextConnectionInspector', () => ({
  NeedContextConnectionInspector: () => <div data-testid="need-context-connection-inspector" />,
}))
vi.mock('../inspector/FlowStageInspector', () => ({
  FlowStageInspector: () => <div data-testid="flow-stage-inspector" />,
}))
vi.mock('../inspector/TeamInspector', () => ({
  TeamInspector: () => <div data-testid="team-inspector" />,
}))

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: 'proj-1',
    name: 'Test',
    contexts: [
      {
        id: 'ctx-1',
        name: 'Orders',
        positions: { flow: { x: 0 }, strategic: { x: 0 }, shared: { y: 0 } },
      },
    ],
    relationships: [],
    repos: [],
    teams: [],
    groups: [],
    people: [],
    ...overrides,
  } as unknown as Project
}

function setupStore(overrides: Record<string, unknown>) {
  vi.mocked(useEditorStore).mockImplementation((selector) => {
    const state = {
      activeProjectId: 'proj-1',
      projects: { 'proj-1': makeProject() },
      selectedContextId: null,
      selectedGroupId: null,
      selectedUserId: null,
      selectedUserNeedId: null,
      selectedRelationshipId: null,
      selectedUserNeedConnectionId: null,
      selectedNeedContextConnectionId: null,
      selectedStageIndex: null,
      selectedTeamId: null,
      ...overrides,
    }
    return selector(state as never)
  })
}

describe('InspectorPanel header close button', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders a Close button when a context is selected', () => {
    setupStore({ selectedContextId: 'ctx-1' })
    render(<InspectorPanel />)
    expect(screen.getByRole('button', { name: /close inspector/i })).toBeInTheDocument()
  })

  it('clears all selection state when Close is clicked', () => {
    setupStore({ selectedContextId: 'ctx-1' })
    render(<InspectorPanel />)
    fireEvent.click(screen.getByRole('button', { name: /close inspector/i }))
    expect(useEditorStore.setState).toHaveBeenCalledWith({
      selectedContextId: null,
      selectedGroupId: null,
      selectedUserId: null,
      selectedUserNeedId: null,
      selectedRelationshipId: null,
      selectedUserNeedConnectionId: null,
      selectedNeedContextConnectionId: null,
      selectedStageIndex: null,
      selectedTeamId: null,
      selectedContextIds: [],
    })
  })

  it('renders Close button for a selected relationship', () => {
    setupStore({ selectedRelationshipId: 'rel-1' })
    render(<InspectorPanel />)
    expect(screen.getByRole('button', { name: /close inspector/i })).toBeInTheDocument()
  })

  it('renders Close button for a selected group', () => {
    setupStore({ selectedGroupId: 'grp-1' })
    render(<InspectorPanel />)
    expect(screen.getByRole('button', { name: /close inspector/i })).toBeInTheDocument()
  })

  it('renders Close button for a selected team', () => {
    setupStore({ selectedTeamId: 'team-1' })
    render(<InspectorPanel />)
    expect(screen.getByRole('button', { name: /close inspector/i })).toBeInTheDocument()
  })

  it('renders Close button for a selected stage', () => {
    setupStore({ selectedStageIndex: 0 })
    render(<InspectorPanel />)
    expect(screen.getByRole('button', { name: /close inspector/i })).toBeInTheDocument()
  })

  it('renders nothing when no selection is active', () => {
    setupStore({})
    const { container } = render(<InspectorPanel />)
    expect(container).toBeEmptyDOMElement()
  })
})
