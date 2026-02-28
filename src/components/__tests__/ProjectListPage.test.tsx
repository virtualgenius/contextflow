import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProjectListPage } from '../ProjectListPage'
import { useEditorStore } from '../../model/store'
import type { Project } from '../../model/types'

function _createMockProject(overrides: Partial<Project> = {}): Project {
  return {
    id: 'project-1',
    name: 'Test Project',
    contexts: [],
    relationships: [],
    repos: [],
    people: [],
    teams: [],
    groups: [],
    users: [],
    userNeeds: [],
    userNeedConnections: [],
    needContextConnections: [],
    viewConfig: { flowStages: [] },
    ...overrides,
  }
}

vi.mock('../../hooks/useUrlRouter', () => ({
  useUrlRouter: () => ({
    route: 'home',
    params: {},
    navigate: vi.fn(),
  }),
}))

describe('ProjectListPage', () => {
  beforeEach(() => {
    useEditorStore.getState().reset()
  })

  it('renders ContextFlow header', () => {
    render(<ProjectListPage />)

    expect(screen.getByText('ContextFlow')).toBeInTheDocument()
  })

  it('renders project list', () => {
    render(<ProjectListPage />)

    expect(screen.getByPlaceholderText('Search projects...')).toBeInTheDocument()
    expect(screen.getByText('New Project')).toBeInTheDocument()
  })

  it('renders project cards from store', () => {
    const projects = useEditorStore.getState().projects
    render(<ProjectListPage />)

    const projectNames = Object.values(projects).map(p => p.name)
    for (const name of projectNames) {
      expect(screen.getByText(name)).toBeInTheDocument()
    }
  })
})
