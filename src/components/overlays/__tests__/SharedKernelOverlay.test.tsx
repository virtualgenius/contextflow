import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { SharedKernelOverlay } from '../SharedKernelOverlay'
import { useEditorStore } from '../../../model/store'
import type { BoundedContext, Relationship } from '../../../model/types'

vi.mock('../../../model/store', () => ({
  useEditorStore: Object.assign(vi.fn(), { setState: vi.fn() }),
}))

vi.mock('reactflow', () => ({
  useViewport: () => ({ x: 0, y: 0, zoom: 1 }),
}))

function setupStoreMock(overrides: Record<string, unknown> = {}) {
  vi.mocked(useEditorStore).mockImplementation((selector) => {
    const state = {
      selectedRelationshipId: null,
      hoveredRelationshipId: null,
      showRelationshipLabels: false,
      setHoveredRelationship: vi.fn(),
      ...overrides,
    }
    return selector(state as never)
  })
}

function makeContext(
  id: string,
  x: number,
  y: number,
  bucket: 'medium' = 'medium'
): BoundedContext {
  return {
    id,
    name: id,
    positions: {
      flow: { x },
      strategic: { x },
      distillation: { x, y },
      shared: { y },
    },
    evolutionStage: 'product/rental',
    codeSize: { bucket },
  }
}

function makeRel(
  id: string,
  from: string,
  to: string,
  pattern?: Relationship['pattern']
): Relationship {
  return { id, fromContextId: from, toContextId: to, pattern }
}

describe('SharedKernelOverlay', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupStoreMock()
  })

  it('renders a hatched region over the intersection of two overlapping SK contexts', () => {
    const a = makeContext('ctx-a', 0, 0)
    const b = makeContext('ctx-b', 5, 5)
    const rel = makeRel('rel-1', 'ctx-a', 'ctx-b', 'shared-kernel')

    const { container } = render(
      <SharedKernelOverlay contexts={[a, b]} relationships={[rel]} viewMode="flow" />
    )

    const region = container.querySelector('[data-shared-kernel-id="rel-1"]')
    expect(region).not.toBeNull()
  })

  it('renders a region for each SK relationship when one context has multiple SKs', () => {
    const a = makeContext('ctx-a', 0, 0)
    const b = makeContext('ctx-b', 5, 5)
    const c = makeContext('ctx-c', 3, 7)
    const rel1 = makeRel('rel-1', 'ctx-a', 'ctx-b', 'shared-kernel')
    const rel2 = makeRel('rel-2', 'ctx-a', 'ctx-c', 'shared-kernel')

    const { container } = render(
      <SharedKernelOverlay contexts={[a, b, c]} relationships={[rel1, rel2]} viewMode="flow" />
    )

    expect(container.querySelector('[data-shared-kernel-id="rel-1"]')).not.toBeNull()
    expect(container.querySelector('[data-shared-kernel-id="rel-2"]')).not.toBeNull()
  })

  it('does not render a region when contexts do not overlap', () => {
    const a = makeContext('ctx-a', 0, 0)
    const b = makeContext('ctx-b', 80, 80)
    const rel = makeRel('rel-1', 'ctx-a', 'ctx-b', 'shared-kernel')

    const { container } = render(
      <SharedKernelOverlay contexts={[a, b]} relationships={[rel]} viewMode="flow" />
    )

    expect(container.querySelector('[data-shared-kernel-id="rel-1"]')).toBeNull()
  })

  it('skips relationships whose pattern is not shared-kernel', () => {
    const a = makeContext('ctx-a', 0, 0)
    const b = makeContext('ctx-b', 5, 5)
    const rel = makeRel('rel-1', 'ctx-a', 'ctx-b', 'customer-supplier')

    const { container } = render(
      <SharedKernelOverlay contexts={[a, b]} relationships={[rel]} viewMode="flow" />
    )

    expect(container.querySelector('[data-shared-kernel-id="rel-1"]')).toBeNull()
  })

  it('clicking the label selects the SK relationship with both contexts', () => {
    const a = makeContext('ctx-a', 0, 0)
    const b = makeContext('ctx-b', 5, 5)
    const rel = makeRel('rel-1', 'ctx-a', 'ctx-b', 'shared-kernel')

    const { container } = render(
      <SharedKernelOverlay contexts={[a, b]} relationships={[rel]} viewMode="flow" />
    )

    const label = container.querySelector('[data-shared-kernel-label="rel-1"]') as HTMLElement
    expect(label).not.toBeNull()
    fireEvent.click(label)

    expect(useEditorStore.setState).toHaveBeenCalledTimes(1)
    const callArg = vi.mocked(useEditorStore.setState).mock.calls[0][0] as Record<string, unknown>
    expect(callArg.selectedRelationshipId).toBe('rel-1')
    expect(callArg.selectedContextIds).toEqual(['ctx-a', 'ctx-b'])
  })

  it('hides the "Shared Kernel" label visually by default (opacity 0)', () => {
    const a = makeContext('ctx-a', 0, 0)
    const b = makeContext('ctx-b', 5, 5)
    const rel = makeRel('rel-1', 'ctx-a', 'ctx-b', 'shared-kernel')

    const { container } = render(
      <SharedKernelOverlay contexts={[a, b]} relationships={[rel]} viewMode="flow" />
    )

    const label = container.querySelector('[data-shared-kernel-label="rel-1"]') as HTMLElement
    expect(label).not.toBeNull()
    expect(label.style.opacity).toBe('0')
  })

  it('shows the label when showRelationshipLabels is on', () => {
    setupStoreMock({ showRelationshipLabels: true })
    const a = makeContext('ctx-a', 0, 0)
    const b = makeContext('ctx-b', 5, 5)
    const rel = makeRel('rel-1', 'ctx-a', 'ctx-b', 'shared-kernel')

    const { container } = render(
      <SharedKernelOverlay contexts={[a, b]} relationships={[rel]} viewMode="flow" />
    )

    const label = container.querySelector('[data-shared-kernel-label="rel-1"]') as HTMLElement
    expect(label.style.opacity).toBe('1')
  })

  it('shows the label when the relationship is selected even with the toggle off', () => {
    setupStoreMock({ selectedRelationshipId: 'rel-1' })
    const a = makeContext('ctx-a', 0, 0)
    const b = makeContext('ctx-b', 5, 5)
    const rel = makeRel('rel-1', 'ctx-a', 'ctx-b', 'shared-kernel')

    const { container } = render(
      <SharedKernelOverlay contexts={[a, b]} relationships={[rel]} viewMode="flow" />
    )

    const label = container.querySelector('[data-shared-kernel-label="rel-1"]') as HTMLElement
    expect(label.style.opacity).toBe('1')
  })

  it('shows the label when the relationship is hovered (via store hover id)', () => {
    setupStoreMock({ hoveredRelationshipId: 'rel-1' })
    const a = makeContext('ctx-a', 0, 0)
    const b = makeContext('ctx-b', 5, 5)
    const rel = makeRel('rel-1', 'ctx-a', 'ctx-b', 'shared-kernel')

    const { container } = render(
      <SharedKernelOverlay contexts={[a, b]} relationships={[rel]} viewMode="flow" />
    )

    const label = container.querySelector('[data-shared-kernel-label="rel-1"]') as HTMLElement
    expect(label.style.opacity).toBe('1')
  })

  it('keeps the label pointer-target alive while hidden so it can be hovered to reveal', () => {
    const a = makeContext('ctx-a', 0, 0)
    const b = makeContext('ctx-b', 5, 5)
    const rel = makeRel('rel-1', 'ctx-a', 'ctx-b', 'shared-kernel')

    const { container } = render(
      <SharedKernelOverlay contexts={[a, b]} relationships={[rel]} viewMode="flow" />
    )

    const label = container.querySelector('[data-shared-kernel-label="rel-1"]') as HTMLElement
    expect(label.style.opacity).toBe('0')
    expect(label.style.pointerEvents).toBe('auto')
  })

  it('makes the hatched fill pointer-events: none so drag can pass through to contexts beneath', () => {
    const a = makeContext('ctx-a', 0, 0)
    const b = makeContext('ctx-b', 5, 5)
    const rel = makeRel('rel-1', 'ctx-a', 'ctx-b', 'shared-kernel')

    const { container } = render(
      <SharedKernelOverlay contexts={[a, b]} relationships={[rel]} viewMode="flow" />
    )

    const region = container.querySelector('[data-shared-kernel-id="rel-1"]') as HTMLElement
    expect(region.style.pointerEvents).toBe('none')
  })

  it('makes the label button interactive (pointer-events: auto) so users can click to select', () => {
    const a = makeContext('ctx-a', 0, 0)
    const b = makeContext('ctx-b', 5, 5)
    const rel = makeRel('rel-1', 'ctx-a', 'ctx-b', 'shared-kernel')

    const { container } = render(
      <SharedKernelOverlay contexts={[a, b]} relationships={[rel]} viewMode="flow" />
    )

    const label = container.querySelector('[data-shared-kernel-label="rel-1"]') as HTMLElement
    expect(label).not.toBeNull()
    expect(label.style.pointerEvents).toBe('auto')
  })

  it('returns null when no SK relationships are present', () => {
    const a = makeContext('ctx-a', 0, 0)
    const b = makeContext('ctx-b', 5, 5)
    const rel = makeRel('rel-1', 'ctx-a', 'ctx-b', 'partnership')

    const { container } = render(
      <SharedKernelOverlay contexts={[a, b]} relationships={[rel]} viewMode="flow" />
    )

    expect(container.firstChild).toBeNull()
  })
})
