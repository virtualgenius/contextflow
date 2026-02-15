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

const mockAssignRepoToContext = vi.fn()
const mockAssignTeamToContext = vi.fn()
const mockSetHoveredContext = vi.fn()
const mockUpdateKeyframe = vi.fn()

function makeContext(overrides: Partial<BoundedContext> = {}): BoundedContext {
  return {
    id: 'ctx-1',
    name: 'Orders',
    ownership: 'ours',
    positions: { flow: { x: 0 }, strategic: { x: 0 }, distillation: { x: 0, y: 0 }, shared: { y: 0 } },
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
        'proj-1': {
          teams: [],
          relationships: [],
          contexts: [],
          temporal: undefined,
        },
      },
      activeViewMode: 'flow',
      temporal: { activeKeyframeId: null },
      updateKeyframe: mockUpdateKeyframe,
      colorByMode: 'ownership',
      showHelpTooltips: false,
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

function createDataTransfer(mimeType: string, value: string) {
  const data: Record<string, string> = { [mimeType]: value }
  return {
    types: [mimeType],
    getData: (type: string) => data[type] || '',
    setData: vi.fn(),
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
  }
}

describe('ContextNode drag and drop', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupStoreMock()
  })

  describe('team drop', () => {
    it('calls assignTeamToContext when dropping a team on a non-external context', () => {
      renderContextNode(makeContext({ ownership: 'ours' }))
      const dropTarget = screen.getByText('Orders').closest('[style]')!
      const dataTransfer = createDataTransfer('application/contextflow-team', 'team-1')
      fireEvent.drop(dropTarget, { dataTransfer })
      expect(mockAssignTeamToContext).toHaveBeenCalledWith('ctx-1', 'team-1')
    })

    it('does not call assignTeamToContext when dropping a team on an external context', () => {
      renderContextNode(makeContext({ ownership: 'external' }))
      const dropTarget = screen.getByText('Orders').closest('[style]')!
      const dataTransfer = createDataTransfer('application/contextflow-team', 'team-1')
      fireEvent.drop(dropTarget, { dataTransfer })
      expect(mockAssignTeamToContext).not.toHaveBeenCalled()
    })
  })

  describe('repo drop regression', () => {
    it('still calls assignRepoToContext when dropping a repo', () => {
      renderContextNode(makeContext({ ownership: 'ours' }))
      const dropTarget = screen.getByText('Orders').closest('[style]')!
      const dataTransfer = createDataTransfer('application/contextflow-repo', 'repo-1')
      fireEvent.drop(dropTarget, { dataTransfer })
      expect(mockAssignRepoToContext).toHaveBeenCalledWith('repo-1', 'ctx-1')
    })
  })
})
