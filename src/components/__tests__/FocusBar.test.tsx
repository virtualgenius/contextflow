import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FocusBar, type FocusSubject } from '../FocusBar'

const teamSubject: FocusSubject = {
  kind: 'team',
  label: 'Fulfillment & Logistics',
  color: '#6D9EEB',
}

describe('FocusBar', () => {
  it('names the focused subject', () => {
    render(<FocusBar subject={teamSubject} onExit={vi.fn()} />)
    expect(screen.getByText('Focused on')).toBeInTheDocument()
    expect(screen.getByText('Fulfillment & Logistics')).toBeInTheDocument()
  })

  it('calls onExit when the exit button is clicked', () => {
    const onExit = vi.fn()
    render(<FocusBar subject={teamSubject} onExit={onExit} />)
    fireEvent.click(screen.getByText('Exit focus'))
    expect(onExit).toHaveBeenCalledTimes(1)
  })
})
