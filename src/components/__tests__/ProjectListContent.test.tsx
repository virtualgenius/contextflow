import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ProjectListContent } from '../ProjectListContent'
import type { Project } from '../../model/types'

function createMockProject(overrides: Partial<Project> = {}): Project {
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

const defaultProps = {
  activeProjectId: null as string | null,
  onSelectProject: vi.fn(),
  onCreateProject: vi.fn(),
  onDeleteProject: vi.fn(),
  onRenameProject: vi.fn(),
  onDuplicateProject: vi.fn(),
}

describe('ProjectListContent', () => {
  it('renders project cards', () => {
    const projects = {
      'p1': createMockProject({ id: 'p1', name: 'Alpha Project' }),
      'p2': createMockProject({ id: 'p2', name: 'Beta Project' }),
    }

    render(<ProjectListContent {...defaultProps} projects={projects} />)

    expect(screen.getByText('Alpha Project')).toBeInTheDocument()
    expect(screen.getByText('Beta Project')).toBeInTheDocument()
  })

  it('calls onSelectProject when clicking a project card', () => {
    const onSelectProject = vi.fn()
    const projects = {
      'p1': createMockProject({ id: 'p1', name: 'Alpha Project' }),
    }

    render(
      <ProjectListContent
        {...defaultProps}
        projects={projects}
        onSelectProject={onSelectProject}
      />
    )

    fireEvent.click(screen.getByText('Alpha Project'))

    expect(onSelectProject).toHaveBeenCalledWith('p1')
  })

  it('shows search input and filters projects', () => {
    const projects = {
      'p1': createMockProject({ id: 'p1', name: 'Alpha Project' }),
      'p2': createMockProject({ id: 'p2', name: 'Beta Project' }),
    }

    render(<ProjectListContent {...defaultProps} projects={projects} />)

    const searchInput = screen.getByPlaceholderText('Search projects...')
    fireEvent.change(searchInput, { target: { value: 'Alpha' } })

    expect(screen.getByText('Alpha Project')).toBeInTheDocument()
    expect(screen.queryByText('Beta Project')).not.toBeInTheDocument()
  })

  it('shows no-match message when search has no results', () => {
    const projects = {
      'p1': createMockProject({ id: 'p1', name: 'Alpha Project' }),
    }

    render(<ProjectListContent {...defaultProps} projects={projects} />)

    const searchInput = screen.getByPlaceholderText('Search projects...')
    fireEvent.change(searchInput, { target: { value: 'zzz' } })

    expect(screen.getByText(/No projects match/)).toBeInTheDocument()
  })

  it('shows New Project button', () => {
    const projects = {
      'p1': createMockProject({ id: 'p1', name: 'Alpha Project' }),
    }

    render(<ProjectListContent {...defaultProps} projects={projects} />)

    expect(screen.getByText('New Project')).toBeInTheDocument()
  })

  it('marks active project with Active badge', () => {
    const projects = {
      'p1': createMockProject({ id: 'p1', name: 'Alpha Project' }),
    }

    render(
      <ProjectListContent
        {...defaultProps}
        projects={projects}
        activeProjectId="p1"
      />
    )

    expect(screen.getByText('Active')).toBeInTheDocument()
  })
})
