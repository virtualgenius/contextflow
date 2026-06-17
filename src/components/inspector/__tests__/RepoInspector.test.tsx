import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { RepoInspector } from '../RepoInspector'
import { useEditorStore } from '../../../model/store'
import type { Project } from '../../../model/types'

vi.mock('../../../model/store', () => ({
  useEditorStore: Object.assign(vi.fn(), { setState: vi.fn() }),
}))

const mockUpdateRepo = vi.fn()
const mockDeleteRepo = vi.fn()
const mockAssignRepoToContext = vi.fn()
const mockUnassignRepo = vi.fn()

function makeProject(repoOverrides: Record<string, unknown> = {}): Project {
  return {
    id: 'proj-1',
    name: 'Test',
    contexts: [
      {
        id: 'ctx-1',
        name: 'Orders',
        positions: { flow: { x: 0 }, strategic: { x: 0 }, shared: { y: 0 } },
      },
      {
        id: 'ctx-2',
        name: 'Billing',
        positions: { flow: { x: 0 }, strategic: { x: 0 }, shared: { y: 0 } },
      },
    ],
    relationships: [],
    repos: [
      {
        id: 'repo-1',
        name: 'orders-service',
        remoteUrl: 'github.com/acme/orders-service',
        teamIds: [],
        contributors: [],
        ...repoOverrides,
      },
    ],
    teams: [
      { id: 'team-1', name: 'Platform Squad', topologyType: 'platform' },
      { id: 'team-2', name: 'Core Team', topologyType: 'stream-aligned' },
    ],
    groups: [],
    people: [],
  } as unknown as Project
}

describe('RepoInspector', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useEditorStore).mockImplementation((selector) => {
      const state = {
        updateRepo: mockUpdateRepo,
        deleteRepo: mockDeleteRepo,
        assignRepoToContext: mockAssignRepoToContext,
        unassignRepo: mockUnassignRepo,
      }
      return selector(state as never)
    })
  })

  it('renders not-found when repoId is invalid', () => {
    render(<RepoInspector project={makeProject()} repoId="nope" />)
    expect(screen.getByText('Repository not found.')).toBeInTheDocument()
  })

  it('renders the repo name and remote URL', () => {
    render(<RepoInspector project={makeProject()} repoId="repo-1" />)
    expect(screen.getByDisplayValue('orders-service')).toBeInTheDocument()
    expect(screen.getByDisplayValue('github.com/acme/orders-service')).toBeInTheDocument()
  })

  it('calls updateRepo on name change', () => {
    render(<RepoInspector project={makeProject()} repoId="repo-1" />)
    fireEvent.change(screen.getByDisplayValue('orders-service'), {
      target: { value: 'orders-api' },
    })
    expect(mockUpdateRepo).toHaveBeenCalledWith('repo-1', { name: 'orders-api' })
  })

  it('calls updateRepo on remote URL change', () => {
    render(<RepoInspector project={makeProject()} repoId="repo-1" />)
    fireEvent.change(screen.getByDisplayValue('github.com/acme/orders-service'), {
      target: { value: 'github.com/acme/orders-api' },
    })
    expect(mockUpdateRepo).toHaveBeenCalledWith('repo-1', {
      remoteUrl: 'github.com/acme/orders-api',
    })
  })

  it('calls deleteRepo on delete click', () => {
    render(<RepoInspector project={makeProject()} repoId="repo-1" />)
    fireEvent.click(screen.getByText('Delete repository'))
    expect(mockDeleteRepo).toHaveBeenCalledWith('repo-1')
  })

  describe('assigned context (slice C2)', () => {
    it('shows Not assigned when the repo has no context', () => {
      render(<RepoInspector project={makeProject()} repoId="repo-1" />)
      const select = screen.getByLabelText('Assigned context') as HTMLSelectElement
      expect(select.value).toBe('')
    })

    it('reflects the assigned context', () => {
      render(<RepoInspector project={makeProject({ contextId: 'ctx-1' })} repoId="repo-1" />)
      const select = screen.getByLabelText('Assigned context') as HTMLSelectElement
      expect(select.value).toBe('ctx-1')
    })

    it('assigns a context when one is selected', () => {
      render(<RepoInspector project={makeProject()} repoId="repo-1" />)
      fireEvent.change(screen.getByLabelText('Assigned context'), { target: { value: 'ctx-2' } })
      expect(mockAssignRepoToContext).toHaveBeenCalledWith('repo-1', 'ctx-2')
    })

    it('unassigns when Not assigned is selected', () => {
      render(<RepoInspector project={makeProject({ contextId: 'ctx-1' })} repoId="repo-1" />)
      fireEvent.change(screen.getByLabelText('Assigned context'), { target: { value: '' } })
      expect(mockUnassignRepo).toHaveBeenCalledWith('repo-1')
    })
  })

  describe('owning teams (slice C2)', () => {
    it('renders owning team chips', () => {
      render(<RepoInspector project={makeProject({ teamIds: ['team-1'] })} repoId="repo-1" />)
      expect(screen.getByText('Platform Squad')).toBeInTheDocument()
    })

    it('removes an owning team', () => {
      render(
        <RepoInspector project={makeProject({ teamIds: ['team-1', 'team-2'] })} repoId="repo-1" />
      )
      fireEvent.click(screen.getByRole('button', { name: 'Remove Platform Squad' }))
      expect(mockUpdateRepo).toHaveBeenCalledWith('repo-1', { teamIds: ['team-2'] })
    })

    it('adds an owning team', () => {
      render(<RepoInspector project={makeProject({ teamIds: ['team-1'] })} repoId="repo-1" />)
      fireEvent.change(screen.getByLabelText('Add owning team'), { target: { value: 'team-2' } })
      expect(mockUpdateRepo).toHaveBeenCalledWith('repo-1', { teamIds: ['team-1', 'team-2'] })
    })
  })
})
