import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SettingsViewOptions } from '../SettingsViewOptions'
import { useEditorStore } from '../../../model/store'

vi.mock('../../../model/store', () => ({
  useEditorStore: Object.assign(vi.fn(), { setState: vi.fn() }),
}))

// SettingsViewOptions uses useTheme which calls window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

const mockToggleRelationshipLabels = vi.fn()

function setupMock(overrides: Record<string, unknown> = {}) {
  vi.mocked(useEditorStore).mockImplementation((selector) => {
    const state = {
      showGroups: true,
      showRelationships: true,
      showIssueLabels: false,
      showTeamLabels: false,
      showRelationshipLabels: true,
      toggleShowGroups: vi.fn(),
      toggleShowRelationships: vi.fn(),
      toggleIssueLabels: vi.fn(),
      toggleTeamLabels: vi.fn(),
      toggleRelationshipLabels: mockToggleRelationshipLabels,
      groupOpacity: 0.6,
      setGroupOpacity: vi.fn(),
      colorByMode: 'ownership' as const,
      setColorByMode: vi.fn(),
      ...overrides,
    }
    return selector(state as never)
  })
}

describe('SettingsViewOptions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the Show Relationship Labels toggle', () => {
    setupMock()
    render(<SettingsViewOptions />)
    expect(screen.getByText('Show Relationship Labels')).toBeInTheDocument()
  })

  it('calls toggleRelationshipLabels when clicked', () => {
    setupMock()
    render(<SettingsViewOptions />)
    const toggle = screen.getByText('Show Relationship Labels').closest('div')!.querySelector('button')!
    fireEvent.click(toggle)
    expect(mockToggleRelationshipLabels).toHaveBeenCalledOnce()
  })

  it('renders in checked state when showRelationshipLabels is true', () => {
    setupMock({ showRelationshipLabels: true })
    render(<SettingsViewOptions />)
    const toggle = screen.getByText('Show Relationship Labels').closest('div')!.querySelector('[role="switch"]')!
    expect(toggle.getAttribute('aria-checked')).toBe('true')
  })

  it('renders in unchecked state when showRelationshipLabels is false', () => {
    setupMock({ showRelationshipLabels: false })
    render(<SettingsViewOptions />)
    const toggle = screen.getByText('Show Relationship Labels').closest('div')!.querySelector('[role="switch"]')!
    expect(toggle.getAttribute('aria-checked')).toBe('false')
  })
})
