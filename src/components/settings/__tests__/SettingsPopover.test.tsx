import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SettingsPopover } from '../SettingsPopover'

vi.mock('../SettingsViewOptions', () => ({
  SettingsViewOptions: () => <div data-testid="view-options" />,
}))
vi.mock('../SettingsHelp', () => ({
  SettingsHelp: () => <div data-testid="help" />,
}))
vi.mock('../SettingsDisplay', () => ({
  SettingsDisplay: () => <div data-testid="display" />,
}))
vi.mock('../SettingsIntegrations', () => ({
  SettingsIntegrations: () => <div data-testid="integrations" />,
}))

describe('SettingsPopover close affordances', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders a Close button', () => {
    render(
      <SettingsPopover
        onClose={vi.fn()}
        onOpenGettingStarted={vi.fn()}
        onOpenKeyboardShortcuts={vi.fn()}
      />
    )
    expect(screen.getByRole('button', { name: /close settings/i })).toBeInTheDocument()
  })

  it('calls onClose when the X button is clicked', () => {
    const onClose = vi.fn()
    render(
      <SettingsPopover
        onClose={onClose}
        onOpenGettingStarted={vi.fn()}
        onOpenKeyboardShortcuts={vi.fn()}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /close settings/i }))
    expect(onClose).toHaveBeenCalled()
  })

  it('calls onClose when Escape is pressed', () => {
    const onClose = vi.fn()
    render(
      <SettingsPopover
        onClose={onClose}
        onOpenGettingStarted={vi.fn()}
        onOpenKeyboardShortcuts={vi.fn()}
      />
    )
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })

  it('removes the Escape listener on unmount', () => {
    const onClose = vi.fn()
    const { unmount } = render(
      <SettingsPopover
        onClose={onClose}
        onOpenGettingStarted={vi.fn()}
        onOpenKeyboardShortcuts={vi.fn()}
      />
    )
    unmount()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).not.toHaveBeenCalled()
  })
})
