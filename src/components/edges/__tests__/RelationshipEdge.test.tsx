import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import RelationshipEdge from '../RelationshipEdge'
import { useEditorStore } from '../../../model/store'

vi.mock('../../../model/store', () => ({
  useEditorStore: Object.assign(vi.fn(), { setState: vi.fn() }),
}))

vi.mock('reactflow', () => ({
  EdgeLabelRenderer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="edge-label-renderer">{children}</div>
  ),
  getBezierPath: () => ['M0,0 C50,0 50,100 100,100', 50, 50],
  useViewport: () => ({ x: 0, y: 0, zoom: 1 }),
  useReactFlow: () => ({ getNode: () => null }),
  Position: { Top: 'top', Bottom: 'bottom', Left: 'left', Right: 'right' },
}))

function setupMock(overrides: Record<string, unknown> = {}) {
  vi.mocked(useEditorStore).mockImplementation((selector) => {
    const state = {
      selectedRelationshipId: null,
      deleteRelationship: vi.fn(),
      swapRelationshipDirection: vi.fn(),
      showHelpTooltips: false,
      showRelationshipLabels: true,
      hoveredContextId: null,
      setHoveredRelationship: vi.fn(),
      ...overrides,
    }
    return selector(state as never)
  })
}

const baseProps = {
  id: 'rel-1',
  source: 'ctx-1',
  target: 'ctx-2',
  sourceX: 0,
  sourceY: 0,
  targetX: 100,
  targetY: 100,
  sourcePosition: 'right' as any,
  targetPosition: 'left' as any,
  data: {
    relationship: {
      id: 'rel-1',
      fromContextId: 'ctx-1',
      toContextId: 'ctx-2',
      pattern: 'customer-supplier',
    },
  },
}

describe('RelationshipEdge label visibility', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders labels when showRelationshipLabels is true even without hover/emphasis', () => {
    setupMock({
      showRelationshipLabels: true,
      selectedRelationshipId: null,
      hoveredContextId: null,
    })
    const { container: _container } = render(
      <svg>
        <RelationshipEdge {...baseProps} />
      </svg>
    )
    // The label renderer should contain the pattern label
    const labelRenderer = screen.getByTestId('edge-label-renderer')
    expect(labelRenderer.textContent).toContain('Customer-Supplier')
  })

  it('does not render labels when showRelationshipLabels is false and edge is not emphasized', () => {
    setupMock({
      showRelationshipLabels: false,
      selectedRelationshipId: null,
      hoveredContextId: null,
    })
    const { container: _container } = render(
      <svg>
        <RelationshipEdge {...baseProps} />
      </svg>
    )
    const labelRenderer = screen.queryByTestId('edge-label-renderer')
    expect(labelRenderer).toBeNull()
  })

  it('reveals the label on hover when showRelationshipLabels is false', () => {
    setupMock({
      showRelationshipLabels: false,
      selectedRelationshipId: null,
      hoveredContextId: null,
    })
    const { container } = render(
      <svg>
        <RelationshipEdge {...baseProps} />
      </svg>
    )
    const hitArea = container.querySelector('path[style*="cursor: pointer"]')
    fireEvent.mouseEnter(hitArea!)
    const labelRenderer = screen.queryByTestId('edge-label-renderer')
    expect(labelRenderer?.textContent).toContain('Customer-Supplier')
  })

  it('reveals the label while selected when showRelationshipLabels is false', () => {
    setupMock({
      showRelationshipLabels: false,
      selectedRelationshipId: 'rel-1',
      hoveredContextId: null,
    })
    render(
      <svg>
        <RelationshipEdge {...baseProps} />
      </svg>
    )
    const labelRenderer = screen.queryByTestId('edge-label-renderer')
    expect(labelRenderer?.textContent).toContain('Customer-Supplier')
  })

  it('reveals the label when an endpoint context is hovered (highlight-by-hover)', () => {
    setupMock({
      showRelationshipLabels: false,
      selectedRelationshipId: null,
      hoveredContextId: 'ctx-1',
    })
    render(
      <svg>
        <RelationshipEdge {...baseProps} />
      </svg>
    )
    const labelRenderer = screen.queryByTestId('edge-label-renderer')
    expect(labelRenderer?.textContent).toContain('Customer-Supplier')
  })
})

describe('RelationshipEdge double-click to flip direction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls swapRelationshipDirection on double-click for U/D relationships', () => {
    const mockSwap = vi.fn()
    setupMock({ swapRelationshipDirection: mockSwap })
    const { container } = render(
      <svg>
        <RelationshipEdge {...baseProps} />
      </svg>
    )
    const hitArea = container.querySelector('path[style*="cursor: pointer"]')
    expect(hitArea).not.toBeNull()
    fireEvent.doubleClick(hitArea!)
    expect(mockSwap).toHaveBeenCalledWith('rel-1')
  })

  it('does NOT call swapRelationshipDirection on double-click for partnership pattern', () => {
    const mockSwap = vi.fn()
    setupMock({ swapRelationshipDirection: mockSwap })
    const partnershipProps = {
      ...baseProps,
      data: {
        relationship: {
          id: 'rel-1',
          fromContextId: 'ctx-1',
          toContextId: 'ctx-2',
          pattern: 'partnership',
        },
      },
    }
    const { container } = render(
      <svg>
        <RelationshipEdge {...partnershipProps} />
      </svg>
    )
    const hitArea = container.querySelector('path[style*="cursor: pointer"]')
    fireEvent.doubleClick(hitArea!)
    expect(mockSwap).not.toHaveBeenCalled()
  })

  it('does NOT call swapRelationshipDirection on double-click for shared-kernel pattern', () => {
    const mockSwap = vi.fn()
    setupMock({ swapRelationshipDirection: mockSwap })
    const skProps = {
      ...baseProps,
      data: {
        relationship: {
          id: 'rel-1',
          fromContextId: 'ctx-1',
          toContextId: 'ctx-2',
          pattern: 'shared-kernel',
        },
      },
    }
    const { container } = render(
      <svg>
        <RelationshipEdge {...skProps} />
      </svg>
    )
    const hitArea = container.querySelector('path[style*="cursor: pointer"]')
    fireEvent.doubleClick(hitArea!)
    expect(mockSwap).not.toHaveBeenCalled()
  })

  it('still fires single-click selection independently from double-click handler', () => {
    const mockSwap = vi.fn()
    setupMock({ swapRelationshipDirection: mockSwap })
    const { container } = render(
      <svg>
        <RelationshipEdge {...baseProps} />
      </svg>
    )
    const hitArea = container.querySelector('path[style*="cursor: pointer"]')
    fireEvent.click(hitArea!)
    expect(useEditorStore.setState).toHaveBeenCalled()
  })
})

describe('RelationshipEdge tooltip layering', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does not render a native <title> element on the hit-area path', () => {
    setupMock({
      showRelationshipLabels: true,
      showHelpTooltips: true,
    })
    const { container } = render(
      <svg>
        <RelationshipEdge {...baseProps} />
      </svg>
    )
    const titleElements = container.querySelectorAll('title')
    expect(titleElements.length).toBe(0)
  })

  it('does not show educational tooltip on hover when showHelpTooltips is false', () => {
    setupMock({
      showRelationshipLabels: true,
      showHelpTooltips: false,
    })
    const { container } = render(
      <svg>
        <RelationshipEdge {...baseProps} />
      </svg>
    )
    const hitArea = container.querySelector('path[style*="cursor: pointer"]')
    expect(hitArea).not.toBeNull()
    fireEvent.mouseEnter(hitArea!)
    expect(
      document.body.textContent?.includes('Upstream delivers what downstream needs') ?? false
    ).toBe(false)
  })

  it('shows educational tooltip on hover when showHelpTooltips is true', () => {
    setupMock({
      showRelationshipLabels: false,
      showHelpTooltips: true,
    })
    const { container } = render(
      <svg>
        <RelationshipEdge {...baseProps} />
      </svg>
    )
    const hitArea = container.querySelector('path[style*="cursor: pointer"]')
    expect(hitArea).not.toBeNull()
    fireEvent.mouseEnter(hitArea!)
    expect(document.body.textContent).toContain('Upstream delivers what downstream needs')
  })

  it('shows a combined per-side tooltip for a double-sided relationship', () => {
    setupMock({ showRelationshipLabels: false, showHelpTooltips: true })
    const props = {
      ...baseProps,
      data: {
        relationship: {
          id: 'rel-1',
          fromContextId: 'ctx-1',
          toContextId: 'ctx-2',
          upstreamRole: 'open-host-service',
          downstreamRole: 'anti-corruption-layer',
        },
      },
    }
    const { container } = render(
      <svg>
        <RelationshipEdge {...props} />
      </svg>
    )
    const hitArea = container.querySelector('path[style*="cursor: pointer"]')
    fireEvent.mouseEnter(hitArea!)
    expect(document.body.textContent).toContain('Open Host Service + Anti-Corruption Layer')
  })

  it('shows the Upstream/Downstream tooltip for a direction-only relationship', () => {
    setupMock({ showRelationshipLabels: false, showHelpTooltips: true })
    const props = {
      ...baseProps,
      data: {
        relationship: {
          id: 'rel-1',
          fromContextId: 'ctx-1',
          toContextId: 'ctx-2',
        },
      },
    }
    const { container } = render(
      <svg>
        <RelationshipEdge {...props} />
      </svg>
    )
    const hitArea = container.querySelector('path[style*="cursor: pointer"]')
    fireEvent.mouseEnter(hitArea!)
    expect(document.body.textContent).toContain('Upstream / Downstream')
    expect(document.body.textContent).toContain('influence')
  })
})
