import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { GettingStartedGuideModal } from '../GettingStartedGuideModal'

// The guide is content-only: it takes onClose/onViewSample props and does not
// touch the store, so no store mock is needed.

const EMOJI_PATTERN = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F000}-\u{1F02F}]/u

describe('GettingStartedGuideModal (Context Map default)', () => {
  it('shows four numbered steps and an unnumbered Go further block immediately, with no approach selector', () => {
    render(<GettingStartedGuideModal onClose={vi.fn()} />)

    // No approach selector gating the content.
    expect(screen.queryByText('Start with User Journey')).not.toBeInTheDocument()
    expect(screen.queryByText('Start with Systems')).not.toBeInTheDocument()

    // Four numbered steps render right away.
    expect(screen.getByText('Add your contexts')).toBeInTheDocument()
    expect(screen.getByText('Connect them')).toBeInTheDocument()
    expect(screen.getByText('Make your contexts richer')).toBeInTheDocument()
    expect(screen.getByText('Flag issues')).toBeInTheDocument()

    // Numbered badges 1-4 are present; there is no badge 5.
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
    expect(screen.queryByText('5')).not.toBeInTheDocument()

    // Go further is a plain block, not a numbered step.
    expect(screen.getByText(/Go further/i)).toBeInTheDocument()
  })

  it('contains no instruction to click +User, +Need, or +Stage and no drag-users/needs guidance', () => {
    const { container } = render(<GettingStartedGuideModal onClose={vi.fn()} />)
    const text = container.textContent ?? ''

    expect(text).not.toMatch(/\+\s*User/)
    expect(text).not.toMatch(/\+\s*Need/)
    expect(text).not.toMatch(/\+\s*Stage/)
    expect(text).not.toMatch(/drag\w*\s+(the\s+)?(users|needs)\b/i)
  })

  it('presents the three ownership buckets in order with map-from-the-center guidance', () => {
    const { container } = render(<GettingStartedGuideModal onClose={vi.fn()} />)
    const text = container.textContent ?? ''

    expect(text).toMatch(/Our Team/)
    expect(text).toMatch(/External/)
    expect(text).toMatch(/Internal/)

    // Order: Our Team (primary, center) before External before Internal.
    const ourTeamIdx = text.indexOf('Our Team')
    const externalIdx = text.indexOf('External')
    const internalIdx = text.indexOf('Internal')
    expect(ourTeamIdx).toBeGreaterThanOrEqual(0)
    expect(ourTeamIdx).toBeLessThan(externalIdx)
    expect(externalIdx).toBeLessThan(internalIdx)

    expect(text).toMatch(/map everything/i)
    expect(text).toMatch(/center/i)
  })

  it('states repository assignment applies to org-owned contexts', () => {
    const { container } = render(<GettingStartedGuideModal onClose={vi.fn()} />)
    const text = container.textContent ?? ''

    expect(text).toMatch(/repository/i)
    expect(text).toMatch(/Our Team or Internal|your org/i)
  })

  it('shows a context-level issue example and a downstream relationship-problem example', () => {
    const { container } = render(<GettingStartedGuideModal onClose={vi.fn()} />)
    const text = container.textContent ?? ''

    expect(text).toMatch(/too many responsibilities/i)
    expect(text).toMatch(/downstream/i)
    expect(text).toMatch(/Partnership/)
  })

  it('keeps the Focus on usefulness callout and the Explore Sample Project footer', () => {
    const onViewSample = vi.fn()
    render(<GettingStartedGuideModal onClose={vi.fn()} onViewSample={onViewSample} />)

    expect(screen.getByText('Focus on usefulness, not perfection')).toBeInTheDocument()
    expect(screen.getByText('Explore Sample Project')).toBeInTheDocument()
  })

  it('renders no emoji anywhere in the component', () => {
    const { container } = render(<GettingStartedGuideModal onClose={vi.fn()} />)
    expect(container.textContent ?? '').not.toMatch(EMOJI_PATTERN)
  })
})
