import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { HelpPopover } from '../HelpPopover'
import { version } from '../../../package.json'

describe('HelpPopover', () => {
  it('renders the help menu heading and both links', () => {
    render(
      <HelpPopover
        onClose={() => {}}
        onOpenGettingStarted={() => {}}
        onOpenKeyboardShortcuts={() => {}}
      />
    )

    expect(screen.getByRole('heading', { name: 'Help' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Getting Started Guide' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Keyboard Shortcuts' })).toBeInTheDocument()
  })

  it('calls onOpenGettingStarted when the guide link is clicked', () => {
    const onOpenGettingStarted = vi.fn()
    render(
      <HelpPopover
        onClose={() => {}}
        onOpenGettingStarted={onOpenGettingStarted}
        onOpenKeyboardShortcuts={() => {}}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Getting Started Guide' }))

    expect(onOpenGettingStarted).toHaveBeenCalledOnce()
  })

  it('calls onOpenKeyboardShortcuts when the shortcuts link is clicked', () => {
    const onOpenKeyboardShortcuts = vi.fn()
    render(
      <HelpPopover
        onClose={() => {}}
        onOpenGettingStarted={() => {}}
        onOpenKeyboardShortcuts={onOpenKeyboardShortcuts}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Keyboard Shortcuts' }))

    expect(onOpenKeyboardShortcuts).toHaveBeenCalledOnce()
  })

  it('shows the app version at the bottom', () => {
    render(
      <HelpPopover
        onClose={() => {}}
        onOpenGettingStarted={() => {}}
        onOpenKeyboardShortcuts={() => {}}
      />
    )

    expect(screen.getByText(`v${version}`)).toBeInTheDocument()
  })

  it('calls onClose when Escape is pressed', () => {
    const onClose = vi.fn()
    render(
      <HelpPopover
        onClose={onClose}
        onOpenGettingStarted={() => {}}
        onOpenKeyboardShortcuts={() => {}}
      />
    )

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(onClose).toHaveBeenCalledOnce()
  })
})
