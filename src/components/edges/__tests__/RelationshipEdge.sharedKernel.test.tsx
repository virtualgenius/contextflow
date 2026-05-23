import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render } from '@testing-library/react'
import RelationshipEdge from '../RelationshipEdge'
import { useEditorStore } from '../../../model/store'

vi.mock('../../../model/store', () => ({
  useEditorStore: Object.assign(vi.fn(), { setState: vi.fn() }),
}))

const overlappingSource = {
  id: 'ctx-1',
  position: { x: 0, y: 0 },
  width: 200,
  height: 200,
}
const overlappingTarget = {
  id: 'ctx-2',
  position: { x: 100, y: 100 },
  width: 200,
  height: 200,
}
const disjointTarget = {
  id: 'ctx-3',
  position: { x: 500, y: 500 },
  width: 100,
  height: 60,
}

vi.mock('reactflow', () => ({
  EdgeLabelRenderer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="edge-label-renderer">{children}</div>
  ),
  getBezierPath: () => ['M0,0 C50,0 50,100 100,100', 50, 50],
  useViewport: () => ({ x: 0, y: 0, zoom: 1 }),
  useReactFlow: () => ({
    getNode: (id: string) =>
      id === 'ctx-1'
        ? overlappingSource
        : id === 'ctx-2'
          ? overlappingTarget
          : id === 'ctx-3'
            ? disjointTarget
            : null,
  }),
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

function makeProps(target: string, pattern: 'shared-kernel' | 'partnership' | 'customer-supplier') {
  return {
    id: 'rel-1',
    source: 'ctx-1',
    target,
    sourceX: 0,
    sourceY: 0,
    targetX: 100,
    targetY: 100,
    sourcePosition: 'right' as never,
    targetPosition: 'left' as never,
    data: {
      relationship: {
        id: 'rel-1',
        fromContextId: 'ctx-1',
        toContextId: target,
        pattern,
      },
    },
  }
}

describe('RelationshipEdge shared kernel suppression', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupMock()
  })

  it('returns null when pattern is shared-kernel and contexts overlap', () => {
    const { container } = render(
      <svg>
        <RelationshipEdge {...makeProps('ctx-2', 'shared-kernel')} />
      </svg>
    )
    expect(container.querySelector('path')).toBeNull()
    expect(container.querySelector('[data-testid="edge-label-renderer"]')).toBeNull()
  })

  it('renders normally when pattern is shared-kernel but contexts do not overlap', () => {
    const { container } = render(
      <svg>
        <RelationshipEdge {...makeProps('ctx-3', 'shared-kernel')} />
      </svg>
    )
    expect(container.querySelector('path')).not.toBeNull()
  })

  it('renders normally when contexts overlap but pattern is not shared-kernel', () => {
    const { container } = render(
      <svg>
        <RelationshipEdge {...makeProps('ctx-2', 'customer-supplier')} />
      </svg>
    )
    expect(container.querySelector('path')).not.toBeNull()
  })
})
