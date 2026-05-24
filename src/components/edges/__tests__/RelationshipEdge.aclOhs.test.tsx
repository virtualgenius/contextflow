import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render } from '@testing-library/react'
import RelationshipEdge from '../RelationshipEdge'
import { useEditorStore } from '../../../model/store'

vi.mock('../../../model/store', () => ({
  useEditorStore: Object.assign(vi.fn(), { setState: vi.fn() }),
}))

// Two contexts laid out side by side so the indicator box sits on the
// downstream context's facing edge (Right for ACL, Left for OHS).
const sourceNode = {
  id: 'ctx-1',
  position: { x: 0, y: 0 },
  width: 100,
  height: 60,
}
const targetNode = {
  id: 'ctx-2',
  position: { x: 300, y: 0 },
  width: 100,
  height: 60,
}

vi.mock('reactflow', () => ({
  EdgeLabelRenderer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="edge-label-renderer">{children}</div>
  ),
  getBezierPath: () => ['M0,0 C50,0 50,100 100,100', 200, 30],
  useViewport: () => ({ x: 0, y: 0, zoom: 1 }),
  useReactFlow: () => ({
    getNode: (id: string) => (id === 'ctx-1' ? sourceNode : id === 'ctx-2' ? targetNode : null),
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
      showRelationshipLabels: false,
      hoveredContextId: null,
      setHoveredRelationship: vi.fn(),
      ...overrides,
    }
    return selector(state as never)
  })
}

function baseProps(role: 'anti-corruption-layer' | 'open-host-service') {
  const relationship: {
    id: string
    fromContextId: string
    toContextId: string
    upstreamRole?: 'open-host-service'
    downstreamRole?: 'anti-corruption-layer'
  } = {
    id: 'rel-1',
    fromContextId: 'ctx-1',
    toContextId: 'ctx-2',
  }
  if (role === 'anti-corruption-layer') relationship.downstreamRole = role
  else relationship.upstreamRole = role
  return {
    id: 'rel-1',
    source: 'ctx-1',
    target: 'ctx-2',
    sourceX: 0,
    sourceY: 0,
    targetX: 0,
    targetY: 0,
    sourcePosition: 'right' as never,
    targetPosition: 'left' as never,
    data: { relationship },
  }
}

function parsePath(d: string) {
  const match = d.match(
    /^M\s+(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)\s+C\s+(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)$/
  )
  if (!match) return null
  const [, sx, sy, c1x, c1y, c2x, c2y, ex, ey] = match
  return {
    start: { x: Number(sx), y: Number(sy) },
    c1: { x: Number(c1x), y: Number(c1y) },
    c2: { x: Number(c2x), y: Number(c2y) },
    end: { x: Number(ex), y: Number(ey) },
  }
}

describe('RelationshipEdge ACL/OHS geometry (contextflow-if3)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupMock()
  })

  it('ACL: line meets the box outer edge midpoint with a small gap, perpendicular to the edge', () => {
    const { container } = render(
      <svg>
        <RelationshipEdge {...baseProps('anti-corruption-layer')} />
      </svg>
    )
    // The ACL relationship path: an SVG path bearing the relationship id.
    const path = container.querySelector('path#rel-1') as SVGPathElement | null
    expect(path).not.toBeNull()
    const parsed = parsePath(path!.getAttribute('d') || '')
    expect(parsed).not.toBeNull()

    // ACL hugs the downstream (source) context's right side at gap=2.
    // Box outer-edge midpoint sits at (source.x + width + gap + boxWidth, source.y + height/2)
    //   = (0 + 100 + 2 + 28, 30) = (130, 30).
    // With EDGE_ENDPOINT_GAP=6, the path starts 6 units outward (right) of that: (136, 30).
    expect(parsed!.start).toEqual({ x: 136, y: 30 })

    // Path starts perpendicular to the box outer edge: tangent runs horizontally,
    // so the first control point shares y with the start.
    expect(parsed!.c1.y).toBe(parsed!.start.y)
    // Control point lies on the outward side of the attachment (to the right).
    expect(parsed!.c1.x).toBeGreaterThan(parsed!.start.x)
  })

  it('ACL: line enters the upstream context perpendicular to its facing edge, leaving a gap for the arrow', () => {
    const { container } = render(
      <svg>
        <RelationshipEdge {...baseProps('anti-corruption-layer')} />
      </svg>
    )
    const path = container.querySelector('path#rel-1') as SVGPathElement | null
    const parsed = parsePath(path!.getAttribute('d') || '')!

    // Target context's left edge midpoint: (300, 30). Pulled back by
    // ARROW_MARKER_LENGTH (marker size 8 + gap 6 = 14) leaves the path tail at (286, 30).
    expect(parsed.end).toEqual({ x: 286, y: 30 })
    // Perpendicular entry at the target: second control point shares y with the end.
    expect(parsed.c2.y).toBe(parsed.end.y)
    // Control point lies on the outward side of the target attachment (to the left).
    expect(parsed.c2.x).toBeLessThan(parsed.end.x)
  })

  it('ACL: arrow head sits at the upstream context end, with no arrow at the ACL box', () => {
    const { container } = render(
      <svg>
        <RelationshipEdge {...baseProps('anti-corruption-layer')} />
      </svg>
    )
    const path = container.querySelector('path#rel-1') as SVGPathElement | null
    // ReactFlow's marker system: marker-end renders at the path tail.
    // For ACL the tail is the upstream context end.
    expect(path!.getAttribute('marker-end')).toContain('arrow-')
    expect(path!.getAttribute('marker-start')).toBeNull()
  })

  it('OHS: line meets the box outer edge midpoint with a small gap (mirror of ACL)', () => {
    const { container } = render(
      <svg>
        <RelationshipEdge {...baseProps('open-host-service')} />
      </svg>
    )
    const path = container.querySelector('path#rel-1') as SVGPathElement | null
    expect(path).not.toBeNull()
    const parsed = parsePath(path!.getAttribute('d') || '')!

    // OHS hugs the upstream (target) context's left side at gap=2.
    // Box outer-edge midpoint sits at (target.x - gap - boxWidth, target.y + height/2)
    //   = (300 - 2 - 28, 30) = (270, 30).
    // Pulled outward (left) by ARROW_MARKER_LENGTH=14 (so the arrow tip lands
    // EDGE_ENDPOINT_GAP units before the box border) -> (256, 30).
    expect(parsed.end).toEqual({ x: 256, y: 30 })

    // The line LEAVES the source context perpendicular to its facing edge.
    // Source right-edge midpoint = (100, 30); pulled back by EDGE_ENDPOINT_GAP=6 -> (106, 30).
    expect(parsed.start).toEqual({ x: 106, y: 30 })
    // Perpendicular at both ends: control points share y with their endpoints.
    expect(parsed.c1.y).toBe(parsed.start.y)
    expect(parsed.c2.y).toBe(parsed.end.y)
  })

  it('OHS: arrow head sits at the OHS-box end of the line', () => {
    const { container } = render(
      <svg>
        <RelationshipEdge {...baseProps('open-host-service')} />
      </svg>
    )
    const path = container.querySelector('path#rel-1') as SVGPathElement | null
    expect(path!.getAttribute('marker-end')).toContain('arrow-')
    expect(path!.getAttribute('marker-start')).toBeNull()
  })

  it('indicator box hugs the parent context with a ~2px visual gap', () => {
    const { container } = render(
      <svg>
        <RelationshipEdge {...baseProps('anti-corruption-layer')} />
      </svg>
    )
    // The indicator box <rect> for ACL sits to the right of the source context.
    // Source right edge x = 100; box center x = 100 + 2 + 14 = 116;
    // box left edge x = 116 - 14 = 102; gap between context and box = 2.
    const rects = container.querySelectorAll('rect')
    // The visible indicator box is the second rect (first is the hit area).
    const visibleBox = rects[1]
    expect(visibleBox).toBeDefined()
    expect(Number(visibleBox.getAttribute('x'))).toBe(102)
    expect(Number(visibleBox.getAttribute('width'))).toBe(28)
  })
})
