import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SettingsHelp } from '../SettingsHelp'
import { useEditorStore } from '../../../model/store'

vi.mock('../../../model/store', () => ({
  useEditorStore: Object.assign(vi.fn(), { setState: vi.fn() }),
}))

vi.mock('posthog-js', () => {
  return {
    default: {
      capture: vi.fn(),
      init: vi.fn(),
      identify: vi.fn(),
      opt_in_capturing: vi.fn(),
      opt_out_capturing: vi.fn(),
    },
  }
})

import posthog from 'posthog-js'

function setupStore() {
  vi.mocked(useEditorStore).mockImplementation((selector) => {
    const state = {
      showHelpTooltips: true,
      toggleHelpTooltips: vi.fn(),
    }
    if (typeof selector === 'function') return selector(state as never)
    return state
  })
}

function renderHelp() {
  return render(<SettingsHelp onOpenGettingStarted={vi.fn()} onOpenKeyboardShortcuts={vi.fn()} />)
}

describe('SettingsHelp - analytics toggle', () => {
  let originalLocation: typeof window.location

  beforeEach(() => {
    localStorage.clear()
    setupStore()
    vi.mocked(posthog.opt_in_capturing).mockClear()
    vi.mocked(posthog.opt_out_capturing).mockClear()
    originalLocation = window.location
    // @ts-expect-error -- mock window.location for test
    delete window.location
    // @ts-expect-error -- mock window.location for test
    window.location = { hostname: 'my-company.com' }
  })

  afterEach(() => {
    localStorage.clear()
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
    })
  })

  it('shows analytics toggle ON by default for new self_hosted users', () => {
    renderHelp()
    const label = screen.getByText('Anonymous usage analytics')
    const row = label.parentElement!
    const toggle = row.querySelector('button[role="switch"]') as HTMLButtonElement
    expect(toggle.getAttribute('aria-checked')).toBe('true')
  })

  it('preserves prior opt-out preference on render', () => {
    localStorage.setItem('contextflow.analytics_enabled', 'false')
    renderHelp()
    const label = screen.getByText('Anonymous usage analytics')
    const row = label.parentElement!
    const toggle = row.querySelector('button[role="switch"]') as HTMLButtonElement
    expect(toggle.getAttribute('aria-checked')).toBe('false')
  })

  it('toggling off persists preference and calls posthog opt_out_capturing', () => {
    renderHelp()
    const label = screen.getByText('Anonymous usage analytics')
    const row = label.parentElement!
    const toggle = row.querySelector('button[role="switch"]') as HTMLButtonElement
    fireEvent.click(toggle)
    expect(localStorage.getItem('contextflow.analytics_enabled')).toBe('false')
    expect(posthog.opt_out_capturing).toHaveBeenCalled()
  })

  it('renders explanation copy describing the anonymous-only scope', () => {
    renderHelp()
    expect(screen.getByText(/anonymous usage data/i, { selector: 'p' })).toBeInTheDocument()
  })

  it('expanding "What we track" lists project content as excluded', () => {
    renderHelp()
    fireEvent.click(screen.getByRole('button', { name: /what we track/i }))
    expect(screen.getByText(/We never track:/i)).toBeInTheDocument()
    expect(
      screen.getByText(/project names, context names, team names, or any text you type/i)
    ).toBeInTheDocument()
    expect(screen.getByText(/IP addresses or browser fingerprints/i)).toBeInTheDocument()
  })
})
