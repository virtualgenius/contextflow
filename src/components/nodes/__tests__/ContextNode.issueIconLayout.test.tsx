import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ContextNode } from '../ContextNode'
import { useEditorStore } from '../../../model/store'
import type { BoundedContext, Issue } from '../../../model/types'

vi.mock('../../../model/store', () => ({
  useEditorStore: Object.assign(vi.fn(), { setState: vi.fn() }),
}))

vi.mock('reactflow', () => ({
  Position: { Left: 'left', Right: 'right', Top: 'top' },
  Handle: ({ type, position, id }: { type: string; position: string; id?: string }) => (
    <div data-testid={`handle-${type}-${position}${id ? `-${id}` : ''}`} />
  ),
}))

function makeContext(overrides: Partial<BoundedContext> = {}): BoundedContext {
  return {
    id: 'ctx-1',
    name: 'Dome Safety',
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
      showHelpTooltips: false,
      setHoveredContext: vi.fn(),
    }
    return selector(state as never)
  })
}

const baseIssue: Issue = {
  id: 'iss-1',
  severity: 'warning',
  title: 'Concurrency hotspot',
}

describe('ContextNode top-left issue icon layout (contextflow-d8r)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupStoreMock()
  })

  it('pushes the name down when non-external context has issue icons at top-left', () => {
    const context = makeContext({
      issues: [baseIssue, { ...baseIssue, id: 'iss-2' }],
    })
    render(
      <ContextNode
        data={{ context, isSelected: false, isMemberOfSelectedGroup: false }}
        id="ctx-1"
        type="bounded-context"
        selected={false}
        zIndex={0}
        isConnectable={true}
        xPos={0}
        yPos={0}
        dragging={false}
      />
    )
    const name = screen.getByTestId('context-name')
    const marginTop = parseFloat(name.style.marginTop || '0')
    expect(marginTop).toBeGreaterThanOrEqual(14)
  })

  it('does not push the name down when there are no issues', () => {
    const context = makeContext({ issues: [] })
    render(
      <ContextNode
        data={{ context, isSelected: false, isMemberOfSelectedGroup: false }}
        id="ctx-1"
        type="bounded-context"
        selected={false}
        zIndex={0}
        isConnectable={true}
        xPos={0}
        yPos={0}
        dragging={false}
      />
    )
    const name = screen.getByTestId('context-name')
    const marginTop = parseFloat(name.style.marginTop || '0')
    expect(marginTop).toBe(0)
  })

  it('does not push the name down for external contexts (issues render at top-right, already reserved horizontally)', () => {
    const context = makeContext({
      ownership: 'external',
      issues: [baseIssue],
    })
    render(
      <ContextNode
        data={{ context, isSelected: false, isMemberOfSelectedGroup: false }}
        id="ctx-1"
        type="bounded-context"
        selected={false}
        zIndex={0}
        isConnectable={true}
        xPos={0}
        yPos={0}
        dragging={false}
      />
    )
    const name = screen.getByTestId('context-name')
    const marginTop = parseFloat(name.style.marginTop || '0')
    expect(marginTop).toBe(0)
  })
})
