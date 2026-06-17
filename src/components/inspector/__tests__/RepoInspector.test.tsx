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

function makeProject(): Project {
  return {
    id: 'proj-1',
    name: 'Test',
    contexts: [],
    relationships: [],
    repos: [
      {
        id: 'repo-1',
        name: 'orders-service',
        remoteUrl: 'github.com/acme/orders-service',
        teamIds: [],
        contributors: [],
      },
    ],
    teams: [],
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
})
