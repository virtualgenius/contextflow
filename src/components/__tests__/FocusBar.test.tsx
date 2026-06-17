import type React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FocusBar, type FocusSubject } from '../FocusBar'

const teamSubject: FocusSubject = {
  kind: 'team',
  label: 'Fulfillment & Logistics',
  color: '#6D9EEB',
}

const contextSubject: FocusSubject = {
  kind: 'context',
  label: 'Order Management',
  color: '#2563eb',
}

function renderBar(overrides: Partial<React.ComponentProps<typeof FocusBar>> = {}) {
  const props = {
    subject: teamSubject,
    depth: 0,
    onDepthChange: vi.fn(),
    visibleCount: 3,
    totalCount: 19,
    onExit: vi.fn(),
    ...overrides,
  }
  render(<FocusBar {...props} />)
  return props
}

describe('FocusBar', () => {
  it('names the focused subject', () => {
    renderBar()
    expect(screen.getByText('Focused on')).toBeInTheDocument()
    expect(screen.getByText('Fulfillment & Logistics')).toBeInTheDocument()
  })

  it('calls onExit when the exit button is clicked', () => {
    const { onExit } = renderBar()
    fireEvent.click(screen.getByText('Exit focus'))
    expect(onExit).toHaveBeenCalledTimes(1)
  })

  it('shows the "N of M shown" count', () => {
    renderBar({ visibleCount: 3, totalCount: 19 })
    expect(screen.getByText('3 of 19 shown')).toBeInTheDocument()
  })

  it('renders team-flavored hop labels', () => {
    renderBar({ subject: teamSubject })
    expect(screen.getByRole('button', { name: "team's contexts" })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '+ neighbors' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '+2 hops' })).toBeInTheDocument()
  })

  it('renders context-flavored hop labels', () => {
    renderBar({ subject: contextSubject })
    expect(screen.getByRole('button', { name: 'just this' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '+1 hop' })).toBeInTheDocument()
  })

  it('marks the active depth segment as pressed', () => {
    renderBar({ subject: teamSubject, depth: 1 })
    expect(screen.getByRole('button', { name: '+ neighbors' })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
    expect(screen.getByRole('button', { name: "team's contexts" })).toHaveAttribute(
      'aria-pressed',
      'false'
    )
  })

  it('calls onDepthChange with the chosen hop', () => {
    const { onDepthChange } = renderBar({ subject: teamSubject, depth: 0 })
    fireEvent.click(screen.getByRole('button', { name: '+ neighbors' }))
    expect(onDepthChange).toHaveBeenCalledWith(1)
  })
})

describe('FocusBar team switcher', () => {
  const teamOptions = [
    { id: 't1', name: 'Fulfillment & Logistics', color: '#6D9EEB', count: 3 },
    { id: 't2', name: 'Checkout & Cart Team', color: '#e11d48', count: 2 },
  ]

  function renderSwitcher(overrides: Partial<React.ComponentProps<typeof FocusBar>> = {}) {
    const props = {
      subject: teamSubject,
      depth: 0,
      onDepthChange: vi.fn(),
      visibleCount: 3,
      totalCount: 19,
      onExit: vi.fn(),
      teamOptions,
      currentTeamId: 't1',
      onSwitchTeam: vi.fn(),
      ...overrides,
    }
    render(<FocusBar {...props} />)
    return props
  }

  it('opens a dropdown of teams when the team pill is clicked', () => {
    renderSwitcher()
    fireEvent.click(screen.getByRole('button', { name: /Fulfillment & Logistics/ }))
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /Checkout & Cart Team/ })).toBeInTheDocument()
  })

  it('marks the current team as selected', () => {
    renderSwitcher()
    fireEvent.click(screen.getByRole('button', { name: /Fulfillment & Logistics/ }))
    expect(screen.getByRole('option', { name: /Fulfillment & Logistics/ })).toHaveAttribute(
      'aria-selected',
      'true'
    )
  })

  it('switches focus to the chosen team and closes the dropdown', () => {
    const { onSwitchTeam } = renderSwitcher()
    fireEvent.click(screen.getByRole('button', { name: /Fulfillment & Logistics/ }))
    fireEvent.click(screen.getByRole('option', { name: /Checkout & Cart Team/ }))
    expect(onSwitchTeam).toHaveBeenCalledWith('t2')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('does not re-switch when the current team is chosen', () => {
    const { onSwitchTeam } = renderSwitcher()
    fireEvent.click(screen.getByRole('button', { name: /Fulfillment & Logistics/ }))
    fireEvent.click(screen.getByRole('option', { name: /Fulfillment & Logistics/ }))
    expect(onSwitchTeam).not.toHaveBeenCalled()
  })

  it('renders a static pill with no chevron for a context focus', () => {
    renderSwitcher({ subject: contextSubject, currentTeamId: undefined })
    expect(screen.queryByRole('button', { name: /Order Management/ })).not.toBeInTheDocument()
    expect(screen.getByText('Order Management')).toBeInTheDocument()
  })

  it('renders a static pill when no team options are provided', () => {
    render(
      <FocusBar
        subject={teamSubject}
        depth={0}
        onDepthChange={vi.fn()}
        visibleCount={3}
        totalCount={19}
        onExit={vi.fn()}
      />
    )
    expect(
      screen.queryByRole('button', { name: /Fulfillment & Logistics/ })
    ).not.toBeInTheDocument()
    expect(screen.getByText('Fulfillment & Logistics')).toBeInTheDocument()
  })

  it('closes the switcher on Esc without exiting focus', () => {
    const { onExit } = renderSwitcher()
    fireEvent.click(screen.getByRole('button', { name: /Fulfillment & Logistics/ }))
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(onExit).not.toHaveBeenCalled()
  })
})
