import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { ContextNode } from '../ContextNode'
import { useEditorStore } from '../../../model/store'
import type { BoundedContext } from '../../../model/types'

vi.mock('../../../model/store', () => ({
  useEditorStore: Object.assign(vi.fn(), { setState: vi.fn() }),
}))

vi.mock('reactflow', () => ({
  Position: { Left: 'left', Right: 'right', Top: 'top' },
  Handle: ({ type, position, id }: { type: string; position: string; id?: string }) => (
    <div data-testid={`handle-${type}-${position}${id ? `-${id}` : ''}`} />
  ),
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
    return document.querySelector('.fixed.z-\\[9999\\].pointer-events-none')
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

  it('Legacy badge text "Legacy" is shown when SimpleTooltip wrapper is hovered', () => {
    renderContextNode(makeContext({ isLegacy: true }))
    const badge = screen.getByTestId('legacy-badge')
    const wrapper = badge.querySelector('span.inline-flex')!
    act(() => {
      fireEvent.mouseEnter(wrapper)
    })
    expect(screen.getByText('Legacy')).toBeInTheDocument()
  })

  it('Big Ball of Mud badge tooltip text is shown when SimpleTooltip wrapper is hovered', () => {
    renderContextNode(makeContext({ isBigBallOfMud: true }))
    const badge = screen.getByTestId('bbom-badge')
    const wrapper = badge.querySelector('span.inline-flex')!
    act(() => {
      fireEvent.mouseEnter(wrapper)
    })
    expect(screen.getByText('Big Ball of Mud')).toBeInTheDocument()
  })
})
