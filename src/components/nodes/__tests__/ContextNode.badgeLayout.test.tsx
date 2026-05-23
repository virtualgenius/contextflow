import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ContextNode } from '../ContextNode'
import { useEditorStore } from '../../../model/store'
import type { BoundedContext, Issue } from '../../../model/types'

vi.mock('../../../model/store', () => ({
  useEditorStore: Object.assign(vi.fn(), { setState: vi.fn() }),
}))

vi.mock('reactflow', () => ({
  Position: { Left: 'left', Right: 'right', Top: 'top' },
  Handle: ({ type, position, id }: { type: string; position: string; id?: string }) => (
    <div data-testid={`handle-${type}-${position}${id ? `-${id}` : ''}`} />
  ),
}))

const mockSetSelectedContext = vi.fn()

function makeContext(overrides: Partial<BoundedContext> = {}): BoundedContext {
  return {
    id: 'ctx-1',
    name: 'Dome Safety',
    ownership: 'ours',
    positions: {
      flow: { x: 0 },
      strategic: { x: 0 },
      distillation: { x: 0, y: 0 },
      shared: { y: 0 },
    },
    evolutionStage: 'custom-built',
    strategicClassification: 'core',
    ...overrides,
  } as BoundedContext
}

function setupStoreMock(overrides: Record<string, unknown> = {}) {
  vi.mocked(useEditorStore).mockImplementation((selector) => {
    const state = {
      assignRepoToContext: vi.fn(),
      assignTeamToContext: vi.fn(),
      activeProjectId: 'proj-1',
      projects: {
        'proj-1': {
          teams: [],
          relationships: [],
          contexts: [],
          temporal: undefined,
        },
      },
      activeViewMode: 'flow',
      temporal: { activeKeyframeId: null },
      updateKeyframe: vi.fn(),
      colorByMode: 'ownership',
      showHelpTooltips: false,
      setHoveredContext: vi.fn(),
      setSelectedContext: mockSetSelectedContext,
      ...overrides,
    }
    return selector(state as never)
  })
}

function renderNode(context: BoundedContext) {
  return render(
    <ContextNode
      data={{ context, isSelected: false, isMemberOfSelectedGroup: false }}
      id={context.id}
      type="bounded-context"
      selected={false}
      zIndex={0}
      isConnectable={true}
      xPos={0}
      yPos={0}
      dragging={false}
    />
  )
}

const critical: Issue = { id: 'c1', severity: 'critical', title: 'Payment timeout under load' }
const warning1: Issue = { id: 'w1', severity: 'warning', title: 'Concurrency hotspot' }
const warning2: Issue = { id: 'w2', severity: 'warning', title: 'Slow query on order_items' }
const info1: Issue = { id: 'i1', severity: 'info', title: 'Consider extracting helper' }

describe('ContextNode badge layout (contextflow-s0x)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupStoreMock()
  })

  describe('External signal', () => {
    it('does not render the EXTERNAL text pill', () => {
      renderNode(makeContext({ ownership: 'external' }))
      expect(screen.queryByText(/external/i)).toBeNull()
    })

    it('keeps the orange ownership fill for external contexts', () => {
      renderNode(makeContext({ ownership: 'external' }))
      const card = screen.getByTestId('context-name').parentElement!
      expect(card.style.backgroundColor).toBe('rgb(254, 215, 170)')
    })

    it('uses dashed border for external contexts', () => {
      renderNode(makeContext({ ownership: 'external' }))
      const card = screen.getByTestId('context-name').parentElement!
      expect(card.style.borderStyle).toBe('dashed')
    })
  })

  describe('Identity icons (Legacy, BBoM)', () => {
    it('renders a single identity-icons container with Legacy then BBoM (BBoM at edge)', () => {
      renderNode(makeContext({ isLegacy: true, isBigBallOfMud: true }))
      const container = screen.getByTestId('identity-icons')
      expect(container.style.position).toBe('absolute')
      expect(container.style.top).toBe('4px')
      expect(container.style.right).toBe('4px')
      expect(container.style.display).toBe('inline-flex')
      const children = Array.from(container.children)
      expect(children).toHaveLength(2)
      expect(children[0]).toHaveAttribute('data-testid', 'legacy-badge')
      expect(children[1]).toHaveAttribute('data-testid', 'bbom-badge')
    })

    it('renders only Legacy when only isLegacy is set', () => {
      renderNode(makeContext({ isLegacy: true }))
      expect(screen.getByTestId('legacy-badge')).toBeTruthy()
      expect(screen.queryByTestId('bbom-badge')).toBeNull()
    })

    it('renders only BBoM when only isBigBallOfMud is set', () => {
      renderNode(makeContext({ isBigBallOfMud: true }))
      expect(screen.getByTestId('bbom-badge')).toBeTruthy()
      expect(screen.queryByTestId('legacy-badge')).toBeNull()
    })

    it('does not render the identity-icons container when no identity flags set', () => {
      renderNode(makeContext())
      expect(screen.queryByTestId('identity-icons')).toBeNull()
    })
  })

  describe('Name layout', () => {
    it('has no marginTop and no paddingRight when no identity icons', () => {
      renderNode(makeContext())
      const name = screen.getByTestId('context-name')
      expect(name.style.marginTop).toBe('0px')
      expect(name.style.paddingRight).toBe('0px')
    })

    it('reserves 24px paddingRight when one identity icon is present', () => {
      renderNode(makeContext({ isLegacy: true }))
      const name = screen.getByTestId('context-name')
      expect(name.style.paddingRight).toBe('24px')
      expect(name.style.marginTop).toBe('0px')
    })

    it('reserves 44px paddingRight when both identity icons are present', () => {
      renderNode(makeContext({ isLegacy: true, isBigBallOfMud: true }))
      const name = screen.getByTestId('context-name')
      expect(name.style.paddingRight).toBe('44px')
    })

    it('applies white-space: nowrap so long names truncate with ellipsis', () => {
      renderNode(
        makeContext({
          name: 'Customer Identity and Access Management Service Layer',
          isLegacy: true,
          isBigBallOfMud: true,
        })
      )
      const name = screen.getByTestId('context-name')
      expect(name.style.whiteSpace).toBe('nowrap')
      expect(name.style.textOverflow).toBe('ellipsis')
      expect(name.style.overflow).toBe('hidden')
    })

    it('does not push the name down even when issues are present', () => {
      renderNode(makeContext({ issues: [warning1, warning2] }))
      const name = screen.getByTestId('context-name')
      expect(name.style.marginTop).toBe('0px')
    })
  })

  describe('Issue counter pill at bottom-right', () => {
    it('does not render the pill when there are no issues', () => {
      renderNode(makeContext({ issues: [] }))
      expect(screen.queryByTestId('issue-counter-pill')).toBeNull()
    })

    it('renders the pill at bottom-right when issues are present', () => {
      renderNode(makeContext({ issues: [warning1] }))
      const pill = screen.getByTestId('issue-counter-pill')
      expect(pill.style.position).toBe('absolute')
      expect(pill.style.right).toBe('6px')
      expect(pill.style.bottom).toBe('6px')
    })

    it('renders one counter per non-zero severity (single warning)', () => {
      renderNode(makeContext({ issues: [warning1] }))
      const counters = screen.getAllByTestId(/^issue-counter-(critical|warning|info)$/)
      expect(counters).toHaveLength(1)
      const warningCounter = screen.getByTestId('issue-counter-warning')
      expect(warningCounter.textContent).toContain('1')
    })

    it('aggregates counts by severity', () => {
      renderNode(makeContext({ issues: [critical, warning1, warning2, info1] }))
      expect(screen.getByTestId('issue-counter-critical').textContent).toContain('1')
      expect(screen.getByTestId('issue-counter-warning').textContent).toContain('2')
      expect(screen.getByTestId('issue-counter-info').textContent).toContain('1')
    })

    it('renders counters in order critical, warning, info', () => {
      renderNode(makeContext({ issues: [info1, warning1, critical] }))
      const pill = screen.getByTestId('issue-counter-pill')
      const counterIds = Array.from(pill.querySelectorAll('[data-testid^="issue-counter-"]')).map(
        (el) => el.getAttribute('data-testid')
      )
      expect(counterIds).toEqual([
        'issue-counter-critical',
        'issue-counter-warning',
        'issue-counter-info',
      ])
    })

    it('skips severities with zero count', () => {
      renderNode(makeContext({ issues: [warning1] }))
      expect(screen.queryByTestId('issue-counter-critical')).toBeNull()
      expect(screen.queryByTestId('issue-counter-info')).toBeNull()
    })

    it('renders the same pill format on a tiny card', () => {
      renderNode(
        makeContext({
          codeSize: { bucket: 'tiny' },
          issues: [critical, warning1],
        } as Partial<BoundedContext>)
      )
      const pill = screen.getByTestId('issue-counter-pill')
      expect(pill.style.right).toBe('6px')
      expect(pill.style.bottom).toBe('6px')
      expect(screen.getByTestId('issue-counter-critical')).toBeTruthy()
      expect(screen.getByTestId('issue-counter-warning')).toBeTruthy()
    })

    it('clicking the pill selects the context', () => {
      renderNode(makeContext({ issues: [warning1] }))
      const pill = screen.getByTestId('issue-counter-pill')
      fireEvent.click(pill)
      expect(mockSetSelectedContext).toHaveBeenCalledWith('ctx-1')
    })

    it('shows a tooltip listing issues grouped by severity on hover', () => {
      renderNode(makeContext({ issues: [critical, warning1, warning2] }))
      const pill = screen.getByTestId('issue-counter-pill')
      fireEvent.mouseEnter(pill)
      const tooltip = screen.getByTestId('issue-counter-tooltip')
      const text = tooltip.textContent || ''
      expect(text).toContain('Critical')
      expect(text).toContain('Payment timeout under load')
      expect(text).toContain('Warnings')
      expect(text).toContain('Concurrency hotspot')
      expect(text).toContain('Slow query on order_items')
    })
  })

  describe('Combinations', () => {
    it('external + long name: no EXTERNAL pill, dashed border, single-line name', () => {
      renderNode(
        makeContext({
          ownership: 'external',
          name: 'Carrier Hub UPS/FedEx Integration Service',
        })
      )
      expect(screen.queryByText(/external/i)).toBeNull()
      const name = screen.getByTestId('context-name')
      expect(name.style.whiteSpace).toBe('nowrap')
    })

    it('external + BBoM + issue: BBoM top-right, counter bottom-right', () => {
      renderNode(
        makeContext({
          ownership: 'external',
          isBigBallOfMud: true,
          issues: [critical],
        })
      )
      const identity = screen.getByTestId('identity-icons')
      expect(identity.style.top).toBe('4px')
      expect(identity.style.right).toBe('4px')
      const pill = screen.getByTestId('issue-counter-pill')
      expect(pill.style.bottom).toBe('6px')
      expect(pill.style.right).toBe('6px')
    })

    it('internal + Legacy + BBoM + mixed issues: identity at top-right, counters at bottom-right', () => {
      renderNode(
        makeContext({
          isLegacy: true,
          isBigBallOfMud: true,
          issues: [critical, warning1, info1],
        })
      )
      const identity = screen.getByTestId('identity-icons')
      expect(identity.children).toHaveLength(2)
      const pill = screen.getByTestId('issue-counter-pill')
      expect(pill.querySelectorAll('[data-testid^="issue-counter-"]')).toHaveLength(3)
    })
  })

  describe('Identity icon tooltips (InfoTooltip with showHelpTooltips gating)', () => {
    it('shows Legacy concept tooltip on hover when showHelpTooltips is true', () => {
      setupStoreMock({ showHelpTooltips: true })
      renderNode(makeContext({ isLegacy: true }))
      const badge = screen.getByTestId('legacy-badge')
      const trigger = badge.querySelector('span') as HTMLElement
      fireEvent.mouseEnter(trigger)
      expect(screen.getAllByText(/Legacy Context/i).length).toBeGreaterThan(0)
    })

    it('shows BBoM concept tooltip on hover when showHelpTooltips is true', () => {
      setupStoreMock({ showHelpTooltips: true })
      renderNode(makeContext({ isBigBallOfMud: true }))
      const badge = screen.getByTestId('bbom-badge')
      const trigger = badge.querySelector('span') as HTMLElement
      fireEvent.mouseEnter(trigger)
      expect(screen.getAllByText(/Big Ball of Mud/i).length).toBeGreaterThan(0)
    })

    it('does not show a tooltip on Legacy when showHelpTooltips is false', () => {
      setupStoreMock({ showHelpTooltips: false })
      renderNode(makeContext({ isLegacy: true }))
      const badge = screen.getByTestId('legacy-badge')
      const trigger = badge.querySelector('span') as HTMLElement
      fireEvent.mouseEnter(trigger)
      expect(screen.queryByText(/Legacy Context/i)).toBeNull()
    })
  })
})
