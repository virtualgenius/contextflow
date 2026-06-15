import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CanvasWelcomeCard } from '../CanvasWelcomeCard'

describe('CanvasWelcomeCard', () => {
  it('features the full Buckminster Fuller quote', () => {
    render(<CanvasWelcomeCard />)

    expect(
      screen.getByText(/give them a tool, the use of which will lead to new ways of thinking/i)
    ).toBeInTheDocument()
  })

  it('attributes the quote to Buckminster Fuller', () => {
    render(<CanvasWelcomeCard />)

    expect(screen.getByText(/buckminster fuller/i)).toBeInTheDocument()
  })

  it('teaches the add-context affordance', () => {
    render(<CanvasWelcomeCard />)

    expect(screen.getByText(/double-click anywhere/i)).toBeInTheDocument()
    expect(screen.getByText(/first bounded context/i)).toBeInTheDocument()
    expect(screen.getByText('N')).toBeInTheDocument()
  })

  it('does not capture pointer events so the canvas underneath stays usable', () => {
    const { container } = render(<CanvasWelcomeCard />)

    expect(container.firstChild).toHaveClass('pointer-events-none')
  })
})
