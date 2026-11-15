import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
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

const mockSetFocus = vi.fn()
const mockSetSelectedContext = vi.fn()
const mockUpdateKeyframe = vi.fn()
const mockAddContextToGroup = vi.fn()

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

interface StoreOverrides {
  activeViewMode?: string
  activeKeyframeId?: string | null
  temporalEnabled?: boolean
  groups?: Array<{ id: string; label: string; contextIds: string[] }>
}

function setupStoreMock(overrides: StoreOverrides = {}) {
  vi.mocked(useEditorStore).mockImplementation((selector) => {
    const state = {
      assignRepoToContext: vi.fn(),
      assignTeamToContext: vi.fn(),
      addContextToGroup: mockAddContextToGroup,
      activeProjectId: 'proj-1',
      projects: {
        'proj-1': {
          teams: [{ id: 'team-1', name: 'Fulfillment & Logistics' }],
          relationships: [],
          contexts: [],
          groups: overrides.groups ?? [],
          temporal: overrides.temporalEnabled
            ? { enabled: true, keyframes: [{ id: 'kf-1', activeContextIds: [] }] }
            : undefined,
        },
      },
      activeViewMode: overrides.activeViewMode ?? 'flow',
      temporal: { activeKeyframeId: overrides.activeKeyframeId ?? null },
      updateKeyframe: mockUpdateKeyframe,
      colorByMode: 'ownership',
      showHelpTooltips: false,
      setHoveredContext: vi.fn(),
      setSelectedContext: mockSetSelectedContext,
      setFocus: mockSetFocus,
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

function openMenu() {
  fireEvent.contextMenu(screen.getByText('Orders').closest('[style]')!)
}

describe('ContextNode right-click focus menu', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupStoreMock()
  })

  it('opens the menu in a non-strategic view', () => {
    renderContextNode(makeContext({ teamId: 'team-1' }))
    openMenu()
    expect(screen.getByText('Focus on this context')).toBeInTheDocument()
  })

  it('selects the node on right-click so the inspector follows', () => {
    renderContextNode(makeContext({ teamId: 'team-1' }))
    openMenu()
    expect(mockSetSelectedContext).toHaveBeenCalledWith('ctx-1')
  })

  it('focuses the context at depth 1 when choosing "Focus on this context"', () => {
    renderContextNode(makeContext({ teamId: 'team-1' }))
    openMenu()
    fireEvent.click(screen.getByText('Focus on this context'))
    expect(mockSetFocus).toHaveBeenCalledWith({ kind: 'context', id: 'ctx-1', depth: 1 })
  })

  it('shows the team bridge item when the context has a team', () => {
    renderContextNode(makeContext({ teamId: 'team-1' }))
    openMenu()
    expect(screen.getByText('Focus on team: Fulfillment & Logistics')).toBeInTheDocument()
  })

  it('bridges to team focus at depth 0, matching team-card focus', () => {
    renderContextNode(makeContext({ teamId: 'team-1' }))
    openMenu()
    fireEvent.click(screen.getByText('Focus on team: Fulfillment & Logistics'))
    expect(mockSetFocus).toHaveBeenCalledWith({ kind: 'team', id: 'team-1', depth: 0 })
  })

  it('omits the team bridge item for a context with no team', () => {
    renderContextNode(makeContext({ teamId: undefined }))
    openMenu()
    expect(screen.getByText('Focus on this context')).toBeInTheDocument()
    expect(screen.queryByText(/Focus on team/)).not.toBeInTheDocument()
  })

  it('shows keyframe items only in strategic view with an active keyframe', () => {
    setupStoreMock({ activeViewMode: 'strategic', activeKeyframeId: 'kf-1', temporalEnabled: true })
    renderContextNode(makeContext({ teamId: 'team-1' }))
    openMenu()
    expect(screen.getByText('Show in this keyframe')).toBeInTheDocument()
    expect(screen.getByText('Focus on this context')).toBeInTheDocument()
  })

  it('does not show keyframe items outside keyframe editing', () => {
    renderContextNode(makeContext({ teamId: 'team-1' }))
    openMenu()
    expect(screen.queryByText(/in this keyframe/)).not.toBeInTheDocument()
  })
})

describe('ContextNode right-click "Add to group" (issue #7)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('lists joinable groups under an "Add to group" heading', () => {
    setupStoreMock({
      groups: [
        { id: 'g-1', label: 'Checkout', contextIds: [] },
        { id: 'g-2', label: 'Fulfillment', contextIds: [] },
      ],
    })
    renderContextNode(makeContext())
    openMenu()
    expect(screen.getByText('Add to group')).toBeInTheDocument()
    expect(screen.getByText('Checkout')).toBeInTheDocument()
    expect(screen.getByText('Fulfillment')).toBeInTheDocument()
  })

  it('adds the context to the chosen group and closes the menu', () => {
    setupStoreMock({ groups: [{ id: 'g-1', label: 'Checkout', contextIds: [] }] })
    renderContextNode(makeContext())
    openMenu()
    fireEvent.click(screen.getByTestId('add-to-group-g-1'))
    expect(mockAddContextToGroup).toHaveBeenCalledWith('g-1', 'ctx-1')
    expect(screen.queryByText('Focus on this context')).not.toBeInTheDocument()
  })

  it('omits groups the context already belongs to', () => {
    setupStoreMock({
      groups: [
        { id: 'g-1', label: 'Checkout', contextIds: ['ctx-1'] },
        { id: 'g-2', label: 'Fulfillment', contextIds: [] },
      ],
    })
    renderContextNode(makeContext())
    openMenu()
    expect(screen.queryByTestId('add-to-group-g-1')).not.toBeInTheDocument()
    expect(screen.getByTestId('add-to-group-g-2')).toBeInTheDocument()
  })

  it('shows no group section when the project has no groups', () => {
    setupStoreMock()
    renderContextNode(makeContext())
    openMenu()
    expect(screen.queryByText('Add to group')).not.toBeInTheDocument()
  })

  it('caps the group list and points the rest at the group inspector', () => {
    setupStoreMock({
      groups: Array.from({ length: 6 }, (_, i) => ({
        id: `g-${i + 1}`,
        label: `Group ${i + 1}`,
        contextIds: [],
      })),
    })
    renderContextNode(makeContext())
    openMenu()
    expect(screen.getByText('Group 4')).toBeInTheDocument()
    expect(screen.queryByText('Group 5')).not.toBeInTheDocument()
    expect(screen.getByText('+2 more in the group inspector')).toBeInTheDocument()
  })
})
