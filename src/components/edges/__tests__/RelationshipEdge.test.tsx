import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import RelationshipEdge from '../RelationshipEdge'
import { useEditorStore } from '../../../model/store'

vi.mock('../../../model/store', () => ({
  useEditorStore: Object.assign(vi.fn(), { setState: vi.fn() }),
}))

vi.mock('reactflow', () => ({
  EdgeLabelRenderer: ({ children }: { children: React.ReactNode }) => <div data-testid="edge-label-renderer">{children}</div>,
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
    setupMock({ showRelationshipLabels: true, selectedRelationshipId: null, hoveredContextId: null })
    const { container } = render(
      <svg>
        <RelationshipEdge {...baseProps} />
      </svg>
    )
    // The label renderer should contain the pattern label
    const labelRenderer = screen.getByTestId('edge-label-renderer')
    expect(labelRenderer.textContent).toContain('Customer-Supplier')
  })

  it('does not render labels when showRelationshipLabels is false and edge is not emphasized', () => {
    setupMock({ showRelationshipLabels: false, selectedRelationshipId: null, hoveredContextId: null })
    const { container } = render(
      <svg>
        <RelationshipEdge {...baseProps} />
      </svg>
    )
    const labelRenderer = screen.queryByTestId('edge-label-renderer')
    expect(labelRenderer).toBeNull()
  })
})
