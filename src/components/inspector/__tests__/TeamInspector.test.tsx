import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TeamInspector } from '../TeamInspector'
import { useEditorStore } from '../../../model/store'
import type { Project } from '../../../model/types'

vi.mock('../../../model/store', () => ({
  useEditorStore: Object.assign(vi.fn(), { setState: vi.fn() }),
}))

const mockUpdateTeam = vi.fn()
const mockAddTeam = vi.fn()
const mockDeleteTeam = vi.fn()

function makeProject(): Project {
  return {
    id: 'proj-1',
    name: 'Test',
    contexts: [
      { id: 'ctx-1', name: 'Orders', teamId: 'team-1', positions: { flow: { x: 0 }, strategic: { x: 0 }, shared: { y: 0 } } },
    ],
    relationships: [],
    repos: [],
    teams: [{ id: 'team-1', name: 'Platform Squad', topologyType: 'platform' }],
    groups: [],
    people: [],
  } as unknown as Project
}

describe('TeamInspector', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useEditorStore).mockImplementation((selector) => {
      const state = {
        updateTeam: mockUpdateTeam,
        addTeam: mockAddTeam,
        deleteTeam: mockDeleteTeam,
      }
      return selector(state as never)
    })
  })

  it('renders not-found when teamId is invalid', () => {
    render(<TeamInspector project={makeProject()} teamId="nope" />)
    expect(screen.getByText('Team not found.')).toBeInTheDocument()
  })

  it('renders team name', () => {
    render(<TeamInspector project={makeProject()} teamId="team-1" />)
    expect(screen.getByDisplayValue('Platform Squad')).toBeInTheDocument()
  })

  it('shows assigned contexts', () => {
    render(<TeamInspector project={makeProject()} teamId="team-1" />)
    expect(screen.getByText('Orders')).toBeInTheDocument()
  })

  it('calls updateTeam on name change', () => {
    render(<TeamInspector project={makeProject()} teamId="team-1" />)
    fireEvent.change(screen.getByDisplayValue('Platform Squad'), { target: { value: 'Core Team' } })
    expect(mockUpdateTeam).toHaveBeenCalledWith('team-1', { name: 'Core Team' })
  })

  it('calls addTeam on add button click', () => {
    render(<TeamInspector project={makeProject()} teamId="team-1" />)
    fireEvent.click(screen.getByText('Add Team'))
    expect(mockAddTeam).toHaveBeenCalledWith('New Team')
  })

  it('calls deleteTeam on confirmed delete', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(<TeamInspector project={makeProject()} teamId="team-1" />)
    fireEvent.click(screen.getByText('Delete Team'))
    expect(mockDeleteTeam).toHaveBeenCalledWith('team-1')
  })

  it('deselects topology type when clicking the already-selected button', () => {
    render(<TeamInspector project={makeProject()} teamId="team-1" />)
    fireEvent.click(screen.getByText('Platform'))
    expect(mockUpdateTeam).toHaveBeenCalledWith('team-1', { topologyType: undefined })
  })

  it('selects a different topology type when clicking an unselected button', () => {
    render(<TeamInspector project={makeProject()} teamId="team-1" />)
    fireEvent.click(screen.getByText('Stream'))
    expect(mockUpdateTeam).toHaveBeenCalledWith('team-1', { topologyType: 'stream-aligned' })
  })
})
