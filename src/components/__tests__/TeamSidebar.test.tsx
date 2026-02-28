import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TeamSidebar } from '../TeamSidebar'
import type { Team, BoundedContext } from '../../model/types'

function makeTeam(overrides: Partial<Team> = {}): Team {
  return {
    id: 'team-1',
    name: 'Platform Squad',
    topologyType: 'platform',
    ...overrides,
  }
}

function makeContext(overrides: Partial<BoundedContext> = {}): BoundedContext {
  return {
    id: 'ctx-1',
    name: 'Orders',
    teamId: 'team-1',
    positions: { flow: { x: 0 }, strategic: { x: 0 }, distillation: { x: 0, y: 0 }, shared: { y: 0 } },
    evolutionStage: 'custom-built',
    ...overrides,
  } as BoundedContext
}

const noop = vi.fn()

describe('TeamSidebar', () => {
  describe('rendering', () => {
    it('renders team names', () => {
      render(
        <TeamSidebar
          teams={[makeTeam(), makeTeam({ id: 'team-2', name: 'Core Team' })]}
          contexts={[]}
          selectedTeamId={null}
          onSelectTeam={noop}
          onAddTeam={noop}
          onDeleteTeam={noop}
        />
      )
      expect(screen.getByText('Platform Squad')).toBeInTheDocument()
      expect(screen.getByText('Core Team')).toBeInTheDocument()
    })

    it('shows topology type badges', () => {
      render(
        <TeamSidebar
          teams={[
            makeTeam({ topologyType: 'stream-aligned' }),
            makeTeam({ id: 'team-2', name: 'Infra', topologyType: 'platform' }),
            makeTeam({ id: 'team-3', name: 'Coaches', topologyType: 'enabling' }),
            makeTeam({ id: 'team-4', name: 'Video', topologyType: 'complicated-subsystem' }),
          ]}
          contexts={[]}
          selectedTeamId={null}
          onSelectTeam={noop}
          onAddTeam={noop}
          onDeleteTeam={noop}
        />
      )
      expect(screen.getByText('Stream')).toBeInTheDocument()
      expect(screen.getByText('Platform')).toBeInTheDocument()
      expect(screen.getByText('Enabling')).toBeInTheDocument()
      expect(screen.getByText('Subsystem')).toBeInTheDocument()
    })

    it('does not show badge when topology type is not set', () => {
      render(
        <TeamSidebar
          teams={[makeTeam({ topologyType: undefined })]}
          contexts={[]}
          selectedTeamId={null}
          onSelectTeam={noop}
          onAddTeam={noop}
          onDeleteTeam={noop}
        />
      )
      expect(screen.queryByText('Stream')).not.toBeInTheDocument()
      expect(screen.queryByText('Platform')).not.toBeInTheDocument()
    })

    it('shows assigned context count per team', () => {
      const contexts = [
        makeContext({ id: 'ctx-1', teamId: 'team-1' }),
        makeContext({ id: 'ctx-2', name: 'Payments', teamId: 'team-1' }),
        makeContext({ id: 'ctx-3', name: 'Auth', teamId: 'team-2' }),
      ]
      render(
        <TeamSidebar
          teams={[makeTeam(), makeTeam({ id: 'team-2', name: 'Core' })]}
          contexts={contexts}
          selectedTeamId={null}
          onSelectTeam={noop}
          onAddTeam={noop}
          onDeleteTeam={noop}
        />
      )
      expect(screen.getByText('2 contexts')).toBeInTheDocument()
      expect(screen.getByText('1 context')).toBeInTheDocument()
    })

    it('shows 0 contexts for teams with no assignments', () => {
      render(
        <TeamSidebar
          teams={[makeTeam()]}
          contexts={[]}
          selectedTeamId={null}
          onSelectTeam={noop}
          onAddTeam={noop}
          onDeleteTeam={noop}
        />
      )
      expect(screen.getByText('0 contexts')).toBeInTheDocument()
    })

    it('shows empty state when no teams exist', () => {
      render(
        <TeamSidebar
          teams={[]}
          contexts={[]}
          selectedTeamId={null}
          onSelectTeam={noop}
          onAddTeam={noop}
          onDeleteTeam={noop}
        />
      )
      expect(screen.getByText('No teams yet')).toBeInTheDocument()
    })

    it('shows add team input even in empty state', () => {
      render(
        <TeamSidebar
          teams={[]}
          contexts={[]}
          selectedTeamId={null}
          onSelectTeam={noop}
          onAddTeam={noop}
          onDeleteTeam={noop}
        />
      )
      expect(screen.getByPlaceholderText('Add team...')).toBeInTheDocument()
    })

    it('highlights selected team', () => {
      const { container } = render(
        <TeamSidebar
          teams={[makeTeam(), makeTeam({ id: 'team-2', name: 'Core' })]}
          contexts={[]}
          selectedTeamId="team-1"
          onSelectTeam={noop}
          onAddTeam={noop}
          onDeleteTeam={noop}
        />
      )
      const cards = container.querySelectorAll('[data-testid^="team-card-"]')
      expect(cards[0].className).toContain('ring-blue')
      expect(cards[1].className).not.toContain('ring-blue')
    })
  })

  describe('interactions', () => {
    const onSelectTeam = vi.fn()
    const onAddTeam = vi.fn()
    const onDeleteTeam = vi.fn()

    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('calls onSelectTeam when clicking a team card', () => {
      render(
        <TeamSidebar
          teams={[makeTeam()]}
          contexts={[]}
          selectedTeamId={null}
          onSelectTeam={onSelectTeam}
          onAddTeam={onAddTeam}
          onDeleteTeam={onDeleteTeam}
        />
      )
      fireEvent.click(screen.getByText('Platform Squad'))
      expect(onSelectTeam).toHaveBeenCalledWith('team-1')
    })

    it('calls onAddTeam when typing name and pressing Enter', () => {
      render(
        <TeamSidebar
          teams={[]}
          contexts={[]}
          selectedTeamId={null}
          onSelectTeam={onSelectTeam}
          onAddTeam={onAddTeam}
          onDeleteTeam={onDeleteTeam}
        />
      )
      const input = screen.getByPlaceholderText('Add team...')
      fireEvent.change(input, { target: { value: 'New Squad' } })
      fireEvent.keyDown(input, { key: 'Enter' })
      expect(onAddTeam).toHaveBeenCalledWith('New Squad')
    })

    it('calls onAddTeam when clicking Add button', () => {
      render(
        <TeamSidebar
          teams={[]}
          contexts={[]}
          selectedTeamId={null}
          onSelectTeam={onSelectTeam}
          onAddTeam={onAddTeam}
          onDeleteTeam={onDeleteTeam}
        />
      )
      const input = screen.getByPlaceholderText('Add team...')
      fireEvent.change(input, { target: { value: 'New Squad' } })
      fireEvent.click(screen.getByText('Add'))
      expect(onAddTeam).toHaveBeenCalledWith('New Squad')
    })

    it('clears input after adding team', () => {
      render(
        <TeamSidebar
          teams={[]}
          contexts={[]}
          selectedTeamId={null}
          onSelectTeam={onSelectTeam}
          onAddTeam={onAddTeam}
          onDeleteTeam={onDeleteTeam}
        />
      )
      const input = screen.getByPlaceholderText('Add team...') as HTMLInputElement
      fireEvent.change(input, { target: { value: 'New Squad' } })
      fireEvent.click(screen.getByText('Add'))
      expect(input.value).toBe('')
    })

    it('does not call onAddTeam with empty/whitespace name', () => {
      render(
        <TeamSidebar
          teams={[]}
          contexts={[]}
          selectedTeamId={null}
          onSelectTeam={onSelectTeam}
          onAddTeam={onAddTeam}
          onDeleteTeam={onDeleteTeam}
        />
      )
      const input = screen.getByPlaceholderText('Add team...')
      fireEvent.change(input, { target: { value: '   ' } })
      fireEvent.keyDown(input, { key: 'Enter' })
      expect(onAddTeam).not.toHaveBeenCalled()
    })

    it('calls onDeleteTeam directly when team has no contexts', () => {
      render(
        <TeamSidebar
          teams={[makeTeam()]}
          contexts={[]}
          selectedTeamId={null}
          onSelectTeam={onSelectTeam}
          onAddTeam={onAddTeam}
          onDeleteTeam={onDeleteTeam}
        />
      )
      const _deleteBtn = screen.getByRole('button', { name: '' })
      // The trash icon button - find it by the SVG inside the team card
      const card = screen.getByTestId('team-card-team-1')
      const trashBtn = card.querySelector('button:last-of-type') as HTMLElement
      fireEvent.click(trashBtn)
      expect(onDeleteTeam).toHaveBeenCalledWith('team-1')
    })

    it('shows confirm dialog before deleting team with assigned contexts', () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
      render(
        <TeamSidebar
          teams={[makeTeam()]}
          contexts={[makeContext({ teamId: 'team-1' })]}
          selectedTeamId={null}
          onSelectTeam={onSelectTeam}
          onAddTeam={onAddTeam}
          onDeleteTeam={onDeleteTeam}
        />
      )
      const card = screen.getByTestId('team-card-team-1')
      const trashBtn = card.querySelector('button:last-of-type') as HTMLElement
      fireEvent.click(trashBtn)
      expect(confirmSpy).toHaveBeenCalled()
      expect(onDeleteTeam).not.toHaveBeenCalled()
      confirmSpy.mockRestore()
    })

    it('deletes team when confirm dialog is accepted', () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
      render(
        <TeamSidebar
          teams={[makeTeam()]}
          contexts={[makeContext({ teamId: 'team-1' })]}
          selectedTeamId={null}
          onSelectTeam={onSelectTeam}
          onAddTeam={onAddTeam}
          onDeleteTeam={onDeleteTeam}
        />
      )
      const card = screen.getByTestId('team-card-team-1')
      const trashBtn = card.querySelector('button:last-of-type') as HTMLElement
      fireEvent.click(trashBtn)
      expect(onDeleteTeam).toHaveBeenCalledWith('team-1')
      confirmSpy.mockRestore()
    })

    it('does not trigger onSelectTeam when clicking delete button', () => {
      render(
        <TeamSidebar
          teams={[makeTeam()]}
          contexts={[]}
          selectedTeamId={null}
          onSelectTeam={onSelectTeam}
          onAddTeam={onAddTeam}
          onDeleteTeam={onDeleteTeam}
        />
      )
      const card = screen.getByTestId('team-card-team-1')
      const trashBtn = card.querySelector('button:last-of-type') as HTMLElement
      fireEvent.click(trashBtn)
      expect(onSelectTeam).not.toHaveBeenCalled()
    })
  })

  describe('drag and drop', () => {
    it('team card has draggable attribute', () => {
      render(
        <TeamSidebar
          teams={[makeTeam()]}
          contexts={[]}
          selectedTeamId={null}
          onSelectTeam={noop}
          onAddTeam={noop}
          onDeleteTeam={noop}
        />
      )
      const card = screen.getByTestId('team-card-team-1')
      expect(card).toHaveAttribute('draggable', 'true')
    })

    it('sets team MIME type data on drag start', () => {
      render(
        <TeamSidebar
          teams={[makeTeam()]}
          contexts={[]}
          selectedTeamId={null}
          onSelectTeam={noop}
          onAddTeam={noop}
          onDeleteTeam={noop}
        />
      )
      const card = screen.getByTestId('team-card-team-1')
      const dataTransfer = {
        setData: vi.fn(),
        effectAllowed: '',
      }
      fireEvent.dragStart(card, { dataTransfer })
      expect(dataTransfer.setData).toHaveBeenCalledWith('application/contextflow-team', 'team-1')
      expect(dataTransfer.effectAllowed).toBe('move')
    })
  })

  describe('search filtering', () => {
    it('shows search input when more than 1 team', () => {
      render(
        <TeamSidebar
          teams={[makeTeam(), makeTeam({ id: 'team-2', name: 'Core Team' })]}
          contexts={[]}
          selectedTeamId={null}
          onSelectTeam={noop}
          onAddTeam={noop}
          onDeleteTeam={noop}
        />
      )
      expect(screen.getByPlaceholderText('Filter teams...')).toBeInTheDocument()
    })

    it('does not show search input when only 1 team', () => {
      render(
        <TeamSidebar
          teams={[makeTeam()]}
          contexts={[]}
          selectedTeamId={null}
          onSelectTeam={noop}
          onAddTeam={noop}
          onDeleteTeam={noop}
        />
      )
      expect(screen.queryByPlaceholderText('Filter teams...')).not.toBeInTheDocument()
    })

    it('filters teams by name as user types', () => {
      render(
        <TeamSidebar
          teams={[
            makeTeam({ id: 'team-1', name: 'Platform Squad' }),
            makeTeam({ id: 'team-2', name: 'Core Team' }),
            makeTeam({ id: 'team-3', name: 'Platform Infra' }),
          ]}
          contexts={[]}
          selectedTeamId={null}
          onSelectTeam={noop}
          onAddTeam={noop}
          onDeleteTeam={noop}
        />
      )
      const input = screen.getByPlaceholderText('Filter teams...')
      fireEvent.change(input, { target: { value: 'platform' } })

      expect(screen.getByText('Platform Squad')).toBeInTheDocument()
      expect(screen.getByText('Platform Infra')).toBeInTheDocument()
      expect(screen.queryByText('Core Team')).not.toBeInTheDocument()
    })

    it('shows result count when filtering', () => {
      render(
        <TeamSidebar
          teams={[
            makeTeam({ id: 'team-1', name: 'Platform Squad' }),
            makeTeam({ id: 'team-2', name: 'Core Team' }),
            makeTeam({ id: 'team-3', name: 'Platform Infra' }),
          ]}
          contexts={[]}
          selectedTeamId={null}
          onSelectTeam={noop}
          onAddTeam={noop}
          onDeleteTeam={noop}
        />
      )
      const input = screen.getByPlaceholderText('Filter teams...')
      fireEvent.change(input, { target: { value: 'platform' } })

      expect(screen.getByText('2 of 3 teams')).toBeInTheDocument()
    })

    it('shows empty state when no teams match search', () => {
      render(
        <TeamSidebar
          teams={[
            makeTeam({ id: 'team-1', name: 'Platform Squad' }),
            makeTeam({ id: 'team-2', name: 'Core Team' }),
          ]}
          contexts={[]}
          selectedTeamId={null}
          onSelectTeam={noop}
          onAddTeam={noop}
          onDeleteTeam={noop}
        />
      )
      const input = screen.getByPlaceholderText('Filter teams...')
      fireEvent.change(input, { target: { value: 'xyz' } })

      expect(screen.getByText('No teams match your search')).toBeInTheDocument()
    })

    it('clears search when clicking X button', () => {
      render(
        <TeamSidebar
          teams={[
            makeTeam({ id: 'team-1', name: 'Platform Squad' }),
            makeTeam({ id: 'team-2', name: 'Core Team' }),
          ]}
          contexts={[]}
          selectedTeamId={null}
          onSelectTeam={noop}
          onAddTeam={noop}
          onDeleteTeam={noop}
        />
      )
      const input = screen.getByPlaceholderText('Filter teams...')
      fireEvent.change(input, { target: { value: 'platform' } })

      expect(screen.queryByText('Core Team')).not.toBeInTheDocument()

      const clearButton = screen.getByRole('button', { name: /clear/i })
      fireEvent.click(clearButton)

      expect(screen.getByText('Platform Squad')).toBeInTheDocument()
      expect(screen.getByText('Core Team')).toBeInTheDocument()
    })

    it('shows all teams when search is cleared', () => {
      render(
        <TeamSidebar
          teams={[
            makeTeam({ id: 'team-1', name: 'Platform Squad' }),
            makeTeam({ id: 'team-2', name: 'Core Team' }),
          ]}
          contexts={[]}
          selectedTeamId={null}
          onSelectTeam={noop}
          onAddTeam={noop}
          onDeleteTeam={noop}
        />
      )
      const input = screen.getByPlaceholderText('Filter teams...')
      fireEvent.change(input, { target: { value: 'platform' } })
      fireEvent.change(input, { target: { value: '' } })

      expect(screen.getByText('Platform Squad')).toBeInTheDocument()
      expect(screen.getByText('Core Team')).toBeInTheDocument()
    })
  })
})
