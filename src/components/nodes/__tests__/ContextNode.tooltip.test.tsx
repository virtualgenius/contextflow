import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { ReactNode } from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { ContextNode } from '../ContextNode'
import { useEditorStore } from '../../../model/store'
import type { BoundedContext } from '../../../model/types'

vi.mock('../../../model/store', () => ({
  useEditorStore: Object.assign(vi.fn(), { setState: vi.fn() }),
}))

vi.mock('reactflow', () => ({
  Position: { Left: 'left', Right: 'right', Top: 'top', Bottom: 'bottom' },
  Handle: ({
    type,
    position,
    id,
    children,
  }: {
    type: string
    position: string
    id?: string
    children?: ReactNode
  }) => <div data-testid={`handle-${type}-${position}${id ? `-${id}` : ''}`}>{children}</div>,
}))

const mockSetHoveredContext = vi.fn()

function makeContext(overrides: Partial<BoundedContext> = {}): BoundedContext {
  return {
    id: 'ctx-1',
    name: 'Orders',
    ownership: 'ours',
    positions: {
      flow: { x: 0 },
      strategic: { x: 0 },
      distillation: { x: 0, y: 0 },
      shared: { y: 0 },
    },
    evolutionStage: 'custom-built',
    strategicClassification: 'core',
    purpose: 'Process customer orders',
    ...overrides,
  } as BoundedContext
}

function setupStoreMock(showHelpTooltips: boolean) {
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
      showHelpTooltips,
      setHoveredContext: mockSetHoveredContext,
    }
    return selector(state as never)
  })
}

function renderContextNode(context: BoundedContext) {
  return render(
    <ContextNode
      id={context.id}
      data={{
        context,
        isSelected: false,
        isMemberOfSelectedGroup: false,
        opacity: 1,
        isHoveredByRelationship: false,
      }}
      type="contextNode"
      selected={false}
      isConnectable={true}
      xPos={0}
      yPos={0}
      zIndex={0}
      dragging={false}
    />
  )
}

describe('ContextNode tooltip timing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  function findRichTooltip() {
    return document.querySelector('.fixed.pointer-events-none')
  }

  it('shows hover tooltip instantly on mouseEnter when showHelpTooltips is enabled (no 500ms delay)', () => {
    setupStoreMock(true)
    renderContextNode(makeContext())

    const node = screen.getByText('Orders').closest('div[style]')!.parentElement!

    act(() => {
      fireEvent.mouseEnter(node)
    })

    expect(findRichTooltip()).not.toBeNull()
  })

  it('does not show hover tooltip when showHelpTooltips is disabled', () => {
    setupStoreMock(false)
    renderContextNode(makeContext())

    const node = screen.getByText('Orders').closest('div[style]')!.parentElement!

    act(() => {
      fireEvent.mouseEnter(node)
    })

    expect(findRichTooltip()).toBeNull()
  })

  it('hides hover tooltip on mouseLeave', () => {
    setupStoreMock(true)
    renderContextNode(makeContext())

    const node = screen.getByText('Orders').closest('div[style]')!.parentElement!

    act(() => {
      fireEvent.mouseEnter(node)
    })
    expect(findRichTooltip()).not.toBeNull()

    act(() => {
      fireEvent.mouseLeave(node)
    })
    expect(findRichTooltip()).toBeNull()
  })

  function findConceptTooltip() {
    return (
      [...document.querySelectorAll('.fixed.pointer-events-none')].find((el) =>
        el.textContent?.includes('Process customer orders')
      ) ?? null
    )
  }

  it('hides the concept tooltip while a directional stub is hovered (GH #37)', () => {
    setupStoreMock(true)
    renderContextNode(makeContext())

    const node = screen.getByText('Orders').closest('div[style]')!.parentElement!

    act(() => {
      fireEvent.mouseEnter(node)
    })
    expect(findConceptTooltip()).not.toBeNull()

    const topStub = document.querySelector('[data-context-stub="top"]')!
    act(() => {
      fireEvent.mouseEnter(topStub)
    })
    expect(findConceptTooltip()).toBeNull()
  })

  it('restores the concept tooltip when the stub is no longer hovered', () => {
    setupStoreMock(true)
    renderContextNode(makeContext())

    const node = screen.getByText('Orders').closest('div[style]')!.parentElement!
    act(() => {
      fireEvent.mouseEnter(node)
    })

    const topStub = document.querySelector('[data-context-stub="top"]')!
    act(() => {
      fireEvent.mouseEnter(topStub)
    })
    expect(findConceptTooltip()).toBeNull()

    // Cursor moves from the stub back onto the node body (relatedTarget = node),
    // so the node stays hovered and the concept tooltip returns.
    act(() => {
      fireEvent.mouseLeave(topStub, { relatedTarget: node })
    })
    expect(findConceptTooltip()).not.toBeNull()
  })

  it('hides hover tooltip on mouseDown', () => {
    setupStoreMock(true)
    renderContextNode(makeContext())

    const node = screen.getByText('Orders').closest('div[style]')!.parentElement!

    act(() => {
      fireEvent.mouseEnter(node)
    })
    expect(findRichTooltip()).not.toBeNull()

    act(() => {
      fireEvent.mouseDown(node)
    })
    expect(findRichTooltip()).toBeNull()
  })
})

describe('ContextNode no native title attributes on badges', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupStoreMock(false)
  })

  it('Legacy badge does not use native title attribute', () => {
    renderContextNode(makeContext({ isLegacy: true }))
    expect(screen.queryByTitle('Legacy')).not.toBeInTheDocument()
  })

  it('Big Ball of Mud badge does not use native title attribute', () => {
    renderContextNode(makeContext({ isBigBallOfMud: true }))
    expect(screen.queryByTitle('Big Ball of Mud')).not.toBeInTheDocument()
  })

  it('Legacy badge shows Legacy Context concept tooltip when hovered with help tooltips enabled', () => {
    setupStoreMock(true)
    renderContextNode(makeContext({ isLegacy: true }))
    const badge = screen.getByTestId('legacy-badge')
    const wrapper = badge.querySelector('span.inline-flex')!
    act(() => {
      fireEvent.mouseEnter(wrapper)
    })
    expect(screen.getAllByText(/Legacy Context/i).length).toBeGreaterThan(0)
  })

  it('Big Ball of Mud badge shows BBoM concept tooltip when hovered with help tooltips enabled', () => {
    setupStoreMock(true)
    renderContextNode(makeContext({ isBigBallOfMud: true }))
    const badge = screen.getByTestId('bbom-badge')
    const wrapper = badge.querySelector('span.inline-flex')!
    act(() => {
      fireEvent.mouseEnter(wrapper)
    })
    expect(screen.getAllByText(/Big Ball of Mud/i).length).toBeGreaterThan(0)
  })
})
