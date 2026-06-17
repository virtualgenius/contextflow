import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { KeyboardShortcutsModal } from '../KeyboardShortcutsModal'

describe('KeyboardShortcutsModal', () => {
  it('renders modal with heading', () => {
    render(<KeyboardShortcutsModal onClose={() => {}} />)

    expect(screen.getByRole('heading', { name: 'Keyboard Shortcuts' })).toBeInTheDocument()
  })

  it('shows canvas shortcut descriptions', () => {
    render(<KeyboardShortcutsModal onClose={() => {}} />)

    expect(screen.getByText('Undo')).toBeInTheDocument()
    expect(screen.getByText('Redo')).toBeInTheDocument()
    expect(screen.getByText('Deselect')).toBeInTheDocument()
    expect(screen.getByText('Delete selected edge')).toBeInTheDocument()
  })

  it('shows mouse/trackpad actions', () => {
    render(<KeyboardShortcutsModal onClose={() => {}} />)

    expect(screen.getByText('Zoom')).toBeInTheDocument()
    expect(screen.getByText('Pan canvas')).toBeInTheDocument()
    expect(screen.getByText('Move node')).toBeInTheDocument()
    expect(screen.getByText('Create relationship')).toBeInTheDocument()
    expect(screen.getByText('Multi-select')).toBeInTheDocument()
  })

  it('shows the keyboard shortcuts toggle shortcut', () => {
    render(<KeyboardShortcutsModal onClose={() => {}} />)

    expect(screen.getByText('Show keyboard shortcuts')).toBeInTheDocument()
  })

  describe('platform-specific key display', () => {
    it('shows Mac symbols when on Mac', () => {
      Object.defineProperty(navigator, 'platform', {
        value: 'MacIntel',
        configurable: true,
      })

      render(<KeyboardShortcutsModal onClose={() => {}} />)

      const allText = document.body.textContent || ''
      expect(allText).toContain('\u2318')
      expect(allText).toContain('\u21E7')
    })

    it('shows Ctrl/Shift text when on non-Mac', () => {
      Object.defineProperty(navigator, 'platform', {
        value: 'Win32',
        configurable: true,
      })

      render(<KeyboardShortcutsModal onClose={() => {}} />)

      const allText = document.body.textContent || ''
      expect(allText).toContain('Ctrl')
      expect(allText).toContain('Shift')
    })
  })

  it('calls onClose when header close button is clicked', () => {
    const onClose = vi.fn()
    render(<KeyboardShortcutsModal onClose={onClose} />)

    fireEvent.click(screen.getByLabelText('Close keyboard shortcuts'))

    expect(onClose).toHaveBeenCalledOnce()
  })

  it('calls onClose when footer close button is clicked', () => {
    const onClose = vi.fn()
    render(<KeyboardShortcutsModal onClose={onClose} />)

    fireEvent.click(screen.getByRole('button', { name: 'Close' }))

    expect(onClose).toHaveBeenCalledOnce()
  })

  it('groups shortcuts into sections', () => {
    render(<KeyboardShortcutsModal onClose={() => {}} />)

    expect(screen.getByText('Editing')).toBeInTheDocument()
    expect(screen.getByText('Canvas')).toBeInTheDocument()
  })

  it('documents the focus shortcuts in their own section', () => {
    render(<KeyboardShortcutsModal onClose={() => {}} />)

    expect(screen.getByText('Focus')).toBeInTheDocument()
    expect(screen.getByText('Focus on a context')).toBeInTheDocument()
    expect(screen.getByText('Exit focus')).toBeInTheDocument()
  })

  it('documents the context-adding shortcuts in their own section', () => {
    render(<KeyboardShortcutsModal onClose={() => {}} />)

    expect(screen.getByText('Adding contexts')).toBeInTheDocument()
    expect(screen.getByText('Add a context')).toBeInTheDocument()
    expect(screen.getByText('Add a context at the cursor')).toBeInTheDocument()
    expect(screen.getByText('Add an upstream context')).toBeInTheDocument()
    expect(screen.getByText('Add a downstream context')).toBeInTheDocument()
    expect(screen.getByText('Add a partnership context')).toBeInTheDocument()
    expect(screen.getByText('Add a shared kernel context')).toBeInTheDocument()
  })
})
