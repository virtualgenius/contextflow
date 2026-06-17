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
