import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { InspectorPanel } from '../InspectorPanel'
import { useEditorStore } from '../../model/store'
import type { Project } from '../../model/types'

vi.mock('../../model/store', () => ({
  useEditorStore: Object.assign(vi.fn(), { setState: vi.fn() }),
}))

// Stub each sub-inspector so this test focuses on routing only. Close-button
// behavior is now part of the shared InspectorHeader rendered inside each
// inspector, and is exercised by the InspectorHeader test.
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

describe('InspectorPanel routing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('routes to ContextInspector for a selected context', () => {
    setupStore({ selectedContextId: 'ctx-1' })
    render(<InspectorPanel />)
    expect(screen.getByTestId('context-inspector')).toBeInTheDocument()
  })

  it('routes to RelationshipInspector for a selected relationship', () => {
    setupStore({ selectedRelationshipId: 'rel-1' })
    render(<InspectorPanel />)
    expect(screen.getByTestId('relationship-inspector')).toBeInTheDocument()
  })

  it('routes to GroupInspector for a selected group', () => {
    setupStore({ selectedGroupId: 'grp-1' })
    render(<InspectorPanel />)
    expect(screen.getByTestId('group-inspector')).toBeInTheDocument()
  })

  it('routes to TeamInspector for a selected team', () => {
    setupStore({ selectedTeamId: 'team-1' })
    render(<InspectorPanel />)
    expect(screen.getByTestId('team-inspector')).toBeInTheDocument()
  })

  it('routes to FlowStageInspector for a selected stage', () => {
    setupStore({ selectedStageIndex: 0 })
    render(<InspectorPanel />)
    expect(screen.getByTestId('flow-stage-inspector')).toBeInTheDocument()
  })

  it('renders nothing when no selection is active', () => {
    setupStore({})
    const { container } = render(<InspectorPanel />)
    expect(container).toBeEmptyDOMElement()
  })
})
