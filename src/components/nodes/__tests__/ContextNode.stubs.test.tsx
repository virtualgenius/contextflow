import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ContextNode } from '../ContextNode'
import { useEditorStore } from '../../../model/store'
import type { BoundedContext } from '../../../model/types'

vi.mock('../../../model/store', () => ({
  useEditorStore: Object.assign(vi.fn(), { setState: vi.fn() }),
}))

vi.mock('reactflow', () => ({
  Position: { Left: 'left', Right: 'right', Top: 'top', Bottom: 'bottom' },
  Handle: React.forwardRef<
    HTMLDivElement,
    {
      type: string
      position: string
      id?: string
      children?: React.ReactNode
      style?: React.CSSProperties
      className?: string
      onMouseEnter?: (e: React.MouseEvent) => void
      onMouseLeave?: (e: React.MouseEvent) => void
    }
  >(({ type, position, id, children, style, className, onMouseEnter, onMouseLeave }, ref) => (
    <div
      ref={ref}
      data-testid={`handle-${type}-${position}${id ? `-${id}` : ''}`}
      data-handle-type={type}
      data-handle-position={position}
      data-handle-id={id}
      style={style}
      className={className}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {children}
    </div>
  )),
}))

const mockSetHoveredContext = vi.fn()
const mockAssignRepoToContext = vi.fn()
const mockAssignTeamToContext = vi.fn()
const mockUpdateKeyframe = vi.fn()
const mockBeginContextDraft = vi.fn()

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
    ...overrides,
  } as BoundedContext
}

function setupStoreMock() {
  vi.mocked(useEditorStore).mockImplementation((selector) => {
    const state = {
      assignRepoToContext: mockAssignRepoToContext,
      assignTeamToContext: mockAssignTeamToContext,
      activeProjectId: 'proj-1',
      projects: {
        'proj-1': { teams: [], relationships: [], contexts: [], temporal: undefined },
      },
      activeViewMode: 'flow',
      temporal: { activeKeyframeId: null },
      updateKeyframe: mockUpdateKeyframe,
      colorByMode: 'ownership',
      showHelpTooltips: false,
      setHoveredContext: mockSetHoveredContext,
      beginContextDraft: mockBeginContextDraft,
    }
    return selector(state as never)
  })
}

function renderContextNode(context: BoundedContext = makeContext()) {
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

describe('ContextNode hover stubs (GH #22)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupStoreMock()
  })

  it('renders four source stub handles on top, right, bottom, and left', () => {
    renderContextNode()
    expect(screen.getByTestId('handle-source-top-stub-top')).toBeInTheDocument()
    expect(screen.getByTestId('handle-source-right-stub-right')).toBeInTheDocument()
    expect(screen.getByTestId('handle-source-bottom-stub-bottom')).toBeInTheDocument()
    expect(screen.getByTestId('handle-source-left-stub-left')).toBeInTheDocument()
  })

  it('does not render the legacy fixed left source handle (id="left")', () => {
    renderContextNode()
    expect(screen.queryByTestId('handle-source-left-left')).not.toBeInTheDocument()
  })

  it('does not render the legacy fixed right source handle (id="right")', () => {
    renderContextNode()
    expect(screen.queryByTestId('handle-source-right-right')).not.toBeInTheDocument()
  })

  it('keeps the top target handle for User Need to Context connections', () => {
    renderContextNode()
    expect(screen.getByTestId('handle-target-top-top')).toBeInTheDocument()
  })

  it('renders a whole-shape transparent target handle for the connection drop area', () => {
    renderContextNode()
    expect(screen.getByTestId('handle-target-left-body')).toBeInTheDocument()
  })

  it('shows a per-side click/drag tooltip when a stub is hovered', () => {
    renderContextNode()
    const expectedBySide: Record<string, string> = {
      top: 'Click: new upstream · Drag: connect',
      right: 'Click: new shared kernel · Drag: connect',
      bottom: 'Click: new downstream · Drag: connect',
      left: 'Click: new partnership · Drag: connect',
    }
    const nubs = document.querySelectorAll('[data-context-stub]')
    expect(nubs.length).toBe(4)
    for (const nub of nubs) {
      const side = nub.getAttribute('data-context-stub')!
      fireEvent.mouseEnter(nub as Element)
      expect(screen.getByText(expectedBySide[side])).toBeInTheDocument()
      fireEvent.mouseLeave(nub as Element)
    }
  })

  it('marks the stubs container with the data-stub attribute so it can be targeted in CSS/tests', () => {
    renderContextNode()
    const stubs = document.querySelectorAll('[data-context-stub]')
    expect(stubs.length).toBe(4)
  })

  it('each stub carries a side identifier so geometry helpers can find it', () => {
    renderContextNode()
    const sides = Array.from(document.querySelectorAll('[data-context-stub]')).map((el) =>
      el.getAttribute('data-context-stub')
    )
    expect(sides.sort()).toEqual(['bottom', 'left', 'right', 'top'])
  })
})
