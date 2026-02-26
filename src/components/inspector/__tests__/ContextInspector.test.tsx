import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ContextInspector } from '../ContextInspector'
import { useEditorStore } from '../../../model/store'
import type { Project } from '../../../model/types'

vi.mock('../../../model/store', () => ({
  useEditorStore: Object.assign(vi.fn(), { setState: vi.fn() }),
}))

vi.mock('../../RelationshipCreateDialog', () => ({
  RelationshipCreateDialog: () => <div data-testid="rel-dialog" />,
}))

vi.mock('../ContextRepoCard', () => ({
  RepoCard: () => <div data-testid="repo-card" />,
}))

const mockUpdateContext = vi.fn()
const mockDeleteContext = vi.fn()
const mockUnassignRepo = vi.fn()
const mockAddRelationship = vi.fn()
const mockDeleteRelationship = vi.fn()
const mockSwapRelationshipDirection = vi.fn()
const mockAddContextIssue = vi.fn()
const mockUpdateContextIssue = vi.fn()
const mockDeleteContextIssue = vi.fn()
const mockAssignTeamToContext = vi.fn()
const mockUnassignTeamFromContext = vi.fn()
const mockRemoveContextFromGroup = vi.fn()

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: 'proj-1',
    name: 'Test',
    contexts: [
      {
        id: 'ctx-1',
        name: 'Orders',
        purpose: 'Manage orders',
        ownership: 'ours',
        positions: { flow: { x: 0 }, strategic: { x: 50 }, shared: { y: 30 } },
        strategicClassification: 'core',
        evolutionStage: 'custom-built',
        issues: [{ id: 'iss-1', title: 'Leaky abstraction', severity: 'warning' }],
      },
    ],
    relationships: [],
    repos: [],
    teams: [],
    groups: [],
    people: [],
    needContextConnections: [],
    userNeedConnections: [],
    ...overrides,
  } as unknown as Project
}

describe('ContextInspector', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useEditorStore).mockImplementation((selector) => {
      const state = {
        activeViewMode: 'flow',
        updateContext: mockUpdateContext,
        deleteContext: mockDeleteContext,
        unassignRepo: mockUnassignRepo,
        addRelationship: mockAddRelationship,
        deleteRelationship: mockDeleteRelationship,
        swapRelationshipDirection: mockSwapRelationshipDirection,
        addContextIssue: mockAddContextIssue,
        updateContextIssue: mockUpdateContextIssue,
        deleteContextIssue: mockDeleteContextIssue,
        assignTeamToContext: mockAssignTeamToContext,
        unassignTeamFromContext: mockUnassignTeamFromContext,
        removeContextFromGroup: mockRemoveContextFromGroup,
        temporal: { currentDate: null, activeKeyframeId: null },
      }
      return selector(state as never)
    })
  })

  it('renders not-found when contextId is invalid', () => {
    render(<ContextInspector project={makeProject()} contextId="nope" />)
    expect(screen.getByText('Context not found.')).toBeInTheDocument()
  })

  it('renders context name and purpose', () => {
    render(<ContextInspector project={makeProject()} contextId="ctx-1" />)
    expect(screen.getByDisplayValue('Orders')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Manage orders')).toBeInTheDocument()
  })

  it('calls updateContext on name change', () => {
    render(<ContextInspector project={makeProject()} contextId="ctx-1" />)
    fireEvent.change(screen.getByDisplayValue('Orders'), { target: { value: 'Ordering' } })
    expect(mockUpdateContext).toHaveBeenCalledWith('ctx-1', { name: 'Ordering' })
  })

  it('calls deleteContext on confirmed delete', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(<ContextInspector project={makeProject()} contextId="ctx-1" />)
    fireEvent.click(screen.getByText('Delete Context'))
    expect(mockDeleteContext).toHaveBeenCalledWith('ctx-1')
  })

  it('renders ownership buttons with correct active state', () => {
    render(<ContextInspector project={makeProject()} contextId="ctx-1" />)
    expect(screen.getByText('Our Team')).toBeInTheDocument()
    expect(screen.getByText('Internal')).toBeInTheDocument()
    expect(screen.getByText('External')).toBeInTheDocument()
  })

  it('updates ownership on button click', () => {
    render(<ContextInspector project={makeProject()} contextId="ctx-1" />)
    fireEvent.click(screen.getByText('External'))
    expect(mockUpdateContext).toHaveBeenCalledWith('ctx-1', { ownership: 'external' })
  })

  it('shows issues', () => {
    render(<ContextInspector project={makeProject()} contextId="ctx-1" />)
    expect(screen.getByDisplayValue('Leaky abstraction')).toBeInTheDocument()
  })

  it('calls addContextIssue on Add Issue click', () => {
    render(<ContextInspector project={makeProject()} contextId="ctx-1" />)
    fireEvent.click(screen.getByText('Add Issue'))
    expect(mockAddContextIssue).toHaveBeenCalledWith('ctx-1', 'New issue')
  })

  it('renders Big Ball of Mud toggle', () => {
    render(<ContextInspector project={makeProject()} contextId="ctx-1" />)
    expect(screen.getByLabelText('Big Ball of Mud')).toBeInTheDocument()
  })

  it('calls updateContext when Big Ball of Mud toggle changes', () => {
    render(<ContextInspector project={makeProject()} contextId="ctx-1" />)
    fireEvent.click(screen.getByLabelText('Big Ball of Mud'))
    expect(mockUpdateContext).toHaveBeenCalledWith('ctx-1', { isBigBallOfMud: true })
  })

  it('renders Business Model Role label and dropdown', () => {
    render(<ContextInspector project={makeProject()} contextId="ctx-1" />)
    expect(screen.getByText('Role')).toBeInTheDocument()
    const roleLabel = screen.getByText('Role')
    const container = roleLabel.closest('div')!
    const select = container.querySelector('select')!
    expect(select.value).toBe('')
  })

  it('calls updateContext when Business Model Role changes', () => {
    render(<ContextInspector project={makeProject()} contextId="ctx-1" />)
    const roleLabel = screen.getByText('Role')
    const container = roleLabel.closest('div')!
    const select = container.querySelector('select')!
    fireEvent.change(select, { target: { value: 'revenue-generator' } })
    expect(mockUpdateContext).toHaveBeenCalledWith('ctx-1', { businessModelRole: 'revenue-generator' })
  })

  it('calls updateContext with undefined when Business Model Role is cleared', () => {
    const project = makeProject({
      contexts: [{
        id: 'ctx-1',
        name: 'Orders',
        purpose: 'Manage orders',
        ownership: 'ours',
        positions: { flow: { x: 0 }, strategic: { x: 50 }, distillation: { x: 40, y: 60 }, shared: { y: 30 } },
        strategicClassification: 'core',
        evolutionStage: 'custom-built',
        businessModelRole: 'revenue-generator',
        issues: [],
      }],
    })
    render(<ContextInspector project={project} contextId="ctx-1" />)
    const roleSelect = screen.getByDisplayValue('Revenue Generator')
    fireEvent.change(roleSelect, { target: { value: '' } })
    expect(mockUpdateContext).toHaveBeenCalledWith('ctx-1', { businessModelRole: undefined })
  })
})
