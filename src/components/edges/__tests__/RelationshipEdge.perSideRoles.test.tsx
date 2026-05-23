import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render } from '@testing-library/react'
import RelationshipEdge from '../RelationshipEdge'
import { useEditorStore } from '../../../model/store'
import type { Relationship } from '../../../model/types'

vi.mock('../../../model/store', () => ({
  useEditorStore: Object.assign(vi.fn(), { setState: vi.fn() }),
}))

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

function relProps(rel: Partial<Relationship>) {
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
    data: {
      relationship: {
        id: 'rel-1',
        fromContextId: 'ctx-1',
        toContextId: 'ctx-2',
        pattern: 'customer-supplier',
        ...rel,
      },
    },
  }
}

function getVisibleBoxes(container: HTMLElement): SVGRectElement[] {
  // Indicator boxes are rendered as <rect> with stroke-width 1.5 (the visible
  // box); the first <rect> in each indicator <g> is a transparent hit area
  // with no stroke. Filter on having a stroke attribute set.
  return Array.from(container.querySelectorAll('rect')).filter(
    (r) => r.getAttribute('stroke-width') === '1.5'
  ) as SVGRectElement[]
}

describe('RelationshipEdge per-side role indicators (contextflow-h82, Slice 2)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupMock()
  })

  it('upstreamRole=open-host-service renders a green OHS box at the upstream end', () => {
    const { container } = render(
      <svg>
        <RelationshipEdge
          {...relProps({ pattern: 'customer-supplier', upstreamRole: 'open-host-service' })}
        />
      </svg>
    )

    const boxes = getVisibleBoxes(container)
    expect(boxes).toHaveLength(1)
    const box = boxes[0]
    // OHS box hugs the target (upstream) context's left edge at gap=2.
    // Target.x = 300, box width = 28; center x = 300 - 2 - 14 = 284;
    // left edge x = 284 - 14 = 270.
    expect(Number(box.getAttribute('x'))).toBe(270)
    expect(Number(box.getAttribute('width'))).toBe(28)
    // OHS colors: green-100 fill, green-500 border.
    expect(box.getAttribute('fill')).toBe('#dcfce7')
    expect(box.getAttribute('stroke')).toBe('#22c55e')
  })

  it('downstreamRole=anti-corruption-layer renders an amber ACL box at the downstream end', () => {
    const { container } = render(
      <svg>
        <RelationshipEdge
          {...relProps({ pattern: 'customer-supplier', downstreamRole: 'anti-corruption-layer' })}
        />
      </svg>
    )

    const boxes = getVisibleBoxes(container)
    expect(boxes).toHaveLength(1)
    const box = boxes[0]
    // ACL box hugs the source (downstream) context's right edge at gap=2.
    // Source.x=0, width=100; center x = 0 + 100 + 2 + 14 = 116; left edge = 102.
    expect(Number(box.getAttribute('x'))).toBe(102)
    expect(Number(box.getAttribute('width'))).toBe(28)
    // ACL colors: amber-100 fill, amber-500 border.
    expect(box.getAttribute('fill')).toBe('#fef3c7')
    expect(box.getAttribute('stroke')).toBe('#f59e0b')
  })

  it('upstreamRole=OHS and downstreamRole=ACL render both boxes simultaneously', () => {
    const { container } = render(
      <svg>
        <RelationshipEdge
          {...relProps({
            pattern: 'customer-supplier',
            upstreamRole: 'open-host-service',
            downstreamRole: 'anti-corruption-layer',
          })}
        />
      </svg>
    )

    const boxes = getVisibleBoxes(container)
    expect(boxes).toHaveLength(2)
    // The two boxes have different fills (green vs amber).
    const fills = boxes.map((b) => b.getAttribute('fill')).sort()
    expect(fills).toEqual(['#dcfce7', '#fef3c7'])
  })

  it('upstreamRole=published-language renders no on-canvas indicator', () => {
    const { container } = render(
      <svg>
        <RelationshipEdge
          {...relProps({ pattern: 'customer-supplier', upstreamRole: 'published-language' })}
        />
      </svg>
    )
    expect(getVisibleBoxes(container)).toHaveLength(0)
  })

  it('downstreamRole=conformist renders no on-canvas indicator', () => {
    const { container } = render(
      <svg>
        <RelationshipEdge
          {...relProps({ pattern: 'customer-supplier', downstreamRole: 'conformist' })}
        />
      </svg>
    )
    expect(getVisibleBoxes(container)).toHaveLength(0)
  })

  it('per-side roles take precedence over legacy pattern (PL upstream + legacy OHS pattern shows no box)', () => {
    const { container } = render(
      <svg>
        <RelationshipEdge
          {...relProps({ pattern: 'open-host-service', upstreamRole: 'published-language' })}
        />
      </svg>
    )
    expect(getVisibleBoxes(container)).toHaveLength(0)
  })

  it('backward compat: pattern=open-host-service still renders an OHS box when no roles are set', () => {
    const { container } = render(
      <svg>
        <RelationshipEdge {...relProps({ pattern: 'open-host-service' })} />
      </svg>
    )
    const boxes = getVisibleBoxes(container)
    expect(boxes).toHaveLength(1)
    expect(boxes[0].getAttribute('stroke')).toBe('#22c55e')
  })

  it('backward compat: pattern=anti-corruption-layer still renders an ACL box when no roles are set', () => {
    const { container } = render(
      <svg>
        <RelationshipEdge {...relProps({ pattern: 'anti-corruption-layer' })} />
      </svg>
    )
    const boxes = getVisibleBoxes(container)
    expect(boxes).toHaveLength(1)
    expect(boxes[0].getAttribute('stroke')).toBe('#f59e0b')
  })

  it('two-box geometry: path runs from the ACL box outer edge to the OHS box outer edge', () => {
    const { container } = render(
      <svg>
        <RelationshipEdge
          {...relProps({
            pattern: 'customer-supplier',
            upstreamRole: 'open-host-service',
            downstreamRole: 'anti-corruption-layer',
          })}
        />
      </svg>
    )
    const path = container.querySelector('path#rel-1') as SVGPathElement | null
    expect(path).not.toBeNull()
    const d = path!.getAttribute('d') || ''
    // ACL box outer-edge midpoint (right side of ACL box) = (130, 30); pulled
    // outward by EDGE_ENDPOINT_GAP=6 (no arrow on source side) -> (136, 30).
    // OHS box outer-edge midpoint (left side of OHS box) = (270, 30); pulled
    // outward by ARROW_MARKER_LENGTH=14 (arrow side) -> (256, 30).
    expect(d).toMatch(/^M\s+136,30\s+C/)
    expect(d).toMatch(/\s256,30$/)
    // Arrow head sits at the OHS-box (upstream) end.
    expect(path!.getAttribute('marker-end')).toContain('arrow-')
    expect(path!.getAttribute('marker-start')).toBeNull()
  })
})
