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
const mockAddTeam = vi.fn()
const mockAddRepo = vi.fn()
const mockAssignRepoToContext = vi.fn()

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
        addTeam: mockAddTeam,
        addRepo: mockAddRepo,
        assignRepoToContext: mockAssignRepoToContext,
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

  it('renders Business Model Role as a pill group with all four options', () => {
    render(<ContextInspector project={makeProject()} contextId="ctx-1" />)
    const roleGroup = screen.getByRole('radiogroup', { name: 'Role' })
    expect(roleGroup).toBeInTheDocument()
    expect(roleGroup.querySelector('select')).toBeNull()
    expect(screen.getByRole('radio', { name: 'Revenue' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Engagement' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Compliance' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Cost Reduction' })).toBeInTheDocument()
  })

  it('calls updateContext with the underlying enum value when a Role pill is clicked', () => {
    render(<ContextInspector project={makeProject()} contextId="ctx-1" />)
    fireEvent.click(screen.getByRole('radio', { name: 'Revenue' }))
    expect(mockUpdateContext).toHaveBeenCalledWith('ctx-1', {
      businessModelRole: 'revenue-generator',
    })
  })

  it('shows Add Team button when no teams exist and context is non-external', () => {
    render(<ContextInspector project={makeProject()} contextId="ctx-1" />)
    expect(screen.getByText('Add Team')).toBeInTheDocument()
  })

  it('shows team dropdown when teams exist', () => {
    const project = makeProject({
      teams: [{ id: 'team-1', name: 'Platform Team' }],
    })
    render(<ContextInspector project={project} contextId="ctx-1" />)
    expect(screen.getByText('No team assigned')).toBeInTheDocument()
    expect(screen.queryByText('Add Team')).not.toBeInTheDocument()
  })

  it('calls addTeam when Add Team button is clicked', () => {
    vi.spyOn(window, 'prompt').mockReturnValue('New Team')
    mockAddTeam.mockReturnValue('team-new')
    render(<ContextInspector project={makeProject()} contextId="ctx-1" />)
    fireEvent.click(screen.getByText('Add Team'))
    expect(mockAddTeam).toHaveBeenCalledWith('New Team')
  })

  it('does not call addTeam when prompt is cancelled', () => {
    vi.spyOn(window, 'prompt').mockReturnValue(null)
    render(<ContextInspector project={makeProject()} contextId="ctx-1" />)
    fireEvent.click(screen.getByText('Add Team'))
    expect(mockAddTeam).not.toHaveBeenCalled()
  })

  it('hides Team section for external contexts', () => {
    const project = makeProject({
      contexts: [
        {
          id: 'ctx-1',
          name: 'External API',
          purpose: '',
          ownership: 'external',
          positions: {
            flow: { x: 0 },
            strategic: { x: 50 },
            distillation: { x: 40, y: 60 },
            shared: { y: 30 },
          },
          evolutionStage: 'custom-built',
          issues: [],
        },
      ],
    })
    render(<ContextInspector project={project} contextId="ctx-1" />)
    // Should not show Add Team for external contexts
    const addTeamButtons = screen.queryAllByText('Add Team')
    // Filter to only the team-related Add Team (not Add Issue etc)
    expect(addTeamButtons.length).toBe(0)
  })

  it('shows Add Repo button when no repos are assigned', () => {
    render(<ContextInspector project={makeProject()} contextId="ctx-1" />)
    expect(screen.getByText('Add Repo')).toBeInTheDocument()
  })

  it('shows Add Repo button alongside assigned repos', () => {
    const project = makeProject({
      repos: [
        { id: 'repo-1', name: 'orders-service', contextId: 'ctx-1', teamIds: [], contributors: [] },
      ],
    })
    render(<ContextInspector project={project} contextId="ctx-1" />)
    expect(screen.getByText('Add Repo')).toBeInTheDocument()
    expect(screen.getByTestId('repo-card')).toBeInTheDocument()
  })

  it('calls addRepo and assignRepoToContext when Add Repo is clicked', () => {
    vi.spyOn(window, 'prompt').mockReturnValue('new-service')
    mockAddRepo.mockReturnValue('repo-new')
    render(<ContextInspector project={makeProject()} contextId="ctx-1" />)
    fireEvent.click(screen.getByText('Add Repo'))
    expect(mockAddRepo).toHaveBeenCalledWith('new-service')
    expect(mockAssignRepoToContext).toHaveBeenCalledWith('repo-new', 'ctx-1')
  })

  it('does not call addRepo when prompt is cancelled', () => {
    vi.spyOn(window, 'prompt').mockReturnValue(null)
    render(<ContextInspector project={makeProject()} contextId="ctx-1" />)
    fireEvent.click(screen.getByText('Add Repo'))
    expect(mockAddRepo).not.toHaveBeenCalled()
  })

  it('clicking the active Role pill clears the value', () => {
    const project = makeProject({
      contexts: [
        {
          id: 'ctx-1',
          name: 'Orders',
          purpose: 'Manage orders',
          ownership: 'ours',
          positions: {
            flow: { x: 0 },
            strategic: { x: 50 },
            distillation: { x: 40, y: 60 },
            shared: { y: 30 },
          },
          strategicClassification: 'core',
          evolutionStage: 'custom-built',
          businessModelRole: 'revenue-generator',
          issues: [],
        },
      ],
    })
    render(<ContextInspector project={project} contextId="ctx-1" />)
    const activePill = screen.getByRole('radio', { name: 'Revenue' })
    expect(activePill).toHaveAttribute('aria-checked', 'true')
    fireEvent.click(activePill)
    expect(mockUpdateContext).toHaveBeenCalledWith('ctx-1', { businessModelRole: undefined })
  })

  it('renders Code Size as a pill group with all five buckets', () => {
    render(<ContextInspector project={makeProject()} contextId="ctx-1" />)
    const group = screen.getByRole('radiogroup', { name: 'Code Size' })
    expect(group).toBeInTheDocument()
    expect(group.querySelector('select')).toBeNull()
    expect(screen.getByRole('radio', { name: 'Tiny' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Huge' })).toBeInTheDocument()
  })

  it('calls updateContext with codeSize.bucket when a Code Size pill is clicked', () => {
    render(<ContextInspector project={makeProject()} contextId="ctx-1" />)
    fireEvent.click(screen.getByRole('radio', { name: 'Medium' }))
    expect(mockUpdateContext).toHaveBeenCalledWith('ctx-1', {
      codeSize: { bucket: 'medium' },
    })
  })

  it('renders Boundary as a pill group', () => {
    render(<ContextInspector project={makeProject()} contextId="ctx-1" />)
    const group = screen.getByRole('radiogroup', { name: 'Boundary' })
    expect(group).toBeInTheDocument()
    expect(group.querySelector('select')).toBeNull()
    expect(screen.getByRole('radio', { name: 'Weak' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Moderate' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Strong' })).toBeInTheDocument()
  })

  it('hides Boundary Notes textarea when boundaryIntegrity is unset', () => {
    render(<ContextInspector project={makeProject()} contextId="ctx-1" />)
    expect(
      screen.queryByPlaceholderText('Why is the boundary strong or weak?')
    ).not.toBeInTheDocument()
  })

  it('shows Boundary Notes textarea when boundaryIntegrity is set', () => {
    const project = makeProject({
      contexts: [
        {
          id: 'ctx-1',
          name: 'Orders',
          purpose: '',
          ownership: 'ours',
          positions: {
            flow: { x: 0 },
            strategic: { x: 50 },
            distillation: { x: 40, y: 60 },
            shared: { y: 30 },
          },
          evolutionStage: 'custom-built',
          boundaryIntegrity: 'strong',
          issues: [],
        },
      ],
    })
    render(<ContextInspector project={project} contextId="ctx-1" />)
    expect(screen.getByPlaceholderText('Why is the boundary strong or weak?')).toBeInTheDocument()
  })
})
