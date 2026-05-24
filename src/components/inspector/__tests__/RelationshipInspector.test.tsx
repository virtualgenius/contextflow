import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { RelationshipInspector } from '../RelationshipInspector'
import { useEditorStore } from '../../../model/store'
import type { Project } from '../../../model/types'

vi.mock('../../../model/store', () => ({
  useEditorStore: Object.assign(vi.fn(), { setState: vi.fn() }),
}))

vi.mock('../../PatternsGuideModal', () => ({
  PatternsGuideModal: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="patterns-guide">
      <button onClick={onClose}>Close</button>
    </div>
  ),
}))

const mockDeleteRelationship = vi.fn()
const mockUpdateRelationship = vi.fn()
const mockSwapRelationshipDirection = vi.fn()
const mockUpdateMultipleContextPositions = vi.fn()

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: 'proj-1',
    name: 'Test',
    contexts: [
      {
        id: 'ctx-1',
        name: 'Orders',
        positions: { flow: { x: 0 }, strategic: { x: 0 }, shared: { y: 0 } },
      },
      {
        id: 'ctx-2',
        name: 'Billing',
        positions: { flow: { x: 0 }, strategic: { x: 0 }, shared: { y: 0 } },
      },
    ],
    relationships: [
      { id: 'rel-1', fromContextId: 'ctx-1', toContextId: 'ctx-2', pattern: 'customer-supplier' },
    ],
    repos: [],
    teams: [],
    groups: [],
    people: [],
    ...overrides,
  } as unknown as Project
}

function setupStore(viewMode: 'flow' | 'strategic' | 'distillation' = 'flow') {
  vi.mocked(useEditorStore).mockImplementation((selector) => {
    const state = {
      deleteRelationship: mockDeleteRelationship,
      updateRelationship: mockUpdateRelationship,
      swapRelationshipDirection: mockSwapRelationshipDirection,
      updateMultipleContextPositions: mockUpdateMultipleContextPositions,
      activeViewMode: viewMode,
    }
    return selector(state as never)
  })
}

describe('RelationshipInspector', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupStore()
  })

  it('renders not-found when relationshipId is invalid', () => {
    render(<RelationshipInspector project={makeProject()} relationshipId="nope" />)
    expect(screen.getByText('Relationship not found.')).toBeInTheDocument()
  })

  it('renders from and to context names', () => {
    render(<RelationshipInspector project={makeProject()} relationshipId="rel-1" />)
    expect(screen.getByText('Orders')).toBeInTheDocument()
    expect(screen.getByText('Billing')).toBeInTheDocument()
  })

  it('calls deleteRelationship on confirmed remove', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(<RelationshipInspector project={makeProject()} relationshipId="rel-1" />)
    fireEvent.click(screen.getByRole('button', { name: /remove relationship/i }))
    expect(mockDeleteRelationship).toHaveBeenCalledWith('rel-1')
  })

  it('navigates to from-context on click', () => {
    render(<RelationshipInspector project={makeProject()} relationshipId="rel-1" />)
    fireEvent.click(screen.getByText('Orders'))
    expect(useEditorStore.setState).toHaveBeenCalledWith({
      selectedContextId: 'ctx-1',
      selectedRelationshipId: null,
    })
  })

  describe('picker structure (Slice 3)', () => {
    it('shows Partnership and Customer-Supplier as pickable patterns', () => {
      render(<RelationshipInspector project={makeProject()} relationshipId="rel-1" />)
      expect(screen.getByRole('button', { name: /partnership/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /customer-supplier/i })).toBeInTheDocument()
    })

    it('does NOT show Shared Kernel as a pickable pattern; surfaces the gesture hint instead', () => {
      render(<RelationshipInspector project={makeProject()} relationshipId="rel-1" />)
      expect(screen.queryByRole('button', { name: /^shared kernel$/i })).not.toBeInTheDocument()
      expect(
        screen.getByText(/for a shared kernel, drag the contexts to overlap/i)
      ).toBeInTheDocument()
    })

    it('does NOT show Separate Ways as a pickable pattern; surfaces a Remove button instead', () => {
      render(<RelationshipInspector project={makeProject()} relationshipId="rel-1" />)
      expect(screen.queryByRole('button', { name: /separate ways/i })).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: /remove relationship/i })).toBeInTheDocument()
    })

    it('marks the active pattern as pressed', () => {
      const project = makeProject({
        relationships: [
          {
            id: 'rel-1',
            fromContextId: 'ctx-1',
            toContextId: 'ctx-2',
            pattern: 'partnership',
          },
        ],
      } as Partial<Project>)
      render(<RelationshipInspector project={project} relationshipId="rel-1" />)
      const btn = screen.getByRole('button', { name: /partnership/i })
      expect(btn).toHaveAttribute('aria-pressed', 'true')
    })

    it('toggles Partnership off when the active Partnership button is clicked again', () => {
      const project = makeProject({
        relationships: [
          {
            id: 'rel-1',
            fromContextId: 'ctx-1',
            toContextId: 'ctx-2',
            pattern: 'partnership',
          },
        ],
      } as Partial<Project>)
      render(<RelationshipInspector project={project} relationshipId="rel-1" />)
      fireEvent.click(screen.getByRole('button', { name: /partnership/i }))
      expect(mockUpdateRelationship).toHaveBeenCalledWith('rel-1', { pattern: undefined })
    })

    it('sets pattern to customer-supplier when an inactive Customer-Supplier button is clicked', () => {
      const project = makeProject({
        relationships: [
          {
            id: 'rel-1',
            fromContextId: 'ctx-1',
            toContextId: 'ctx-2',
            pattern: 'partnership',
          },
        ],
      } as Partial<Project>)
      render(<RelationshipInspector project={project} relationshipId="rel-1" />)
      fireEvent.click(screen.getByRole('button', { name: /customer-supplier/i }))
      expect(mockUpdateRelationship).toHaveBeenCalledWith('rel-1', {
        pattern: 'customer-supplier',
      })
    })

    it('renders the "Currently: Shared Kernel" banner when pattern is shared-kernel', () => {
      const project = makeProject({
        relationships: [
          {
            id: 'rel-1',
            fromContextId: 'ctx-1',
            toContextId: 'ctx-2',
            pattern: 'shared-kernel',
          },
        ],
      } as Partial<Project>)
      render(<RelationshipInspector project={project} relationshipId="rel-1" />)
      expect(screen.getByText(/currently:\s*shared kernel/i)).toBeInTheDocument()
    })

    it('does NOT render the Shared Kernel banner for other patterns', () => {
      render(<RelationshipInspector project={makeProject()} relationshipId="rel-1" />)
      expect(screen.queryByText(/currently:\s*shared kernel/i)).not.toBeInTheDocument()
    })
  })

  describe('per-side roles', () => {
    it('sets upstreamRole when user clicks Open Host Service pill on Upstream side', () => {
      render(<RelationshipInspector project={makeProject()} relationshipId="rel-1" />)
      const upstreamGroup = screen.getByRole('radiogroup', { name: /upstream role/i })
      fireEvent.click(within(upstreamGroup).getByRole('radio', { name: /open host service/i }))
      expect(mockUpdateRelationship).toHaveBeenCalledWith('rel-1', {
        upstreamRole: 'open-host-service',
      })
    })

    it('sets downstreamRole independently of upstreamRole', () => {
      const project = makeProject({
        relationships: [
          {
            id: 'rel-1',
            fromContextId: 'ctx-1',
            toContextId: 'ctx-2',
            pattern: 'customer-supplier',
            upstreamRole: 'open-host-service',
          },
        ],
      } as Partial<Project>)
      render(<RelationshipInspector project={project} relationshipId="rel-1" />)
      const downstreamGroup = screen.getByRole('radiogroup', { name: /downstream role/i })
      fireEvent.click(within(downstreamGroup).getByRole('radio', { name: /conformist/i }))
      expect(mockUpdateRelationship).toHaveBeenCalledWith('rel-1', {
        downstreamRole: 'conformist',
      })
    })

    it('toggles upstreamRole off when the active pill is clicked again', () => {
      const project = makeProject({
        relationships: [
          {
            id: 'rel-1',
            fromContextId: 'ctx-1',
            toContextId: 'ctx-2',
            pattern: 'customer-supplier',
            upstreamRole: 'open-host-service',
          },
        ],
      } as Partial<Project>)
      render(<RelationshipInspector project={project} relationshipId="rel-1" />)
      const upstreamGroup = screen.getByRole('radiogroup', { name: /upstream role/i })
      fireEvent.click(within(upstreamGroup).getByRole('radio', { name: /open host service/i }))
      expect(mockUpdateRelationship).toHaveBeenCalledWith('rel-1', {
        upstreamRole: undefined,
      })
    })

    it('shows the active upstream pill as checked', () => {
      const project = makeProject({
        relationships: [
          {
            id: 'rel-1',
            fromContextId: 'ctx-1',
            toContextId: 'ctx-2',
            pattern: 'customer-supplier',
            upstreamRole: 'published-language',
          },
        ],
      } as Partial<Project>)
      render(<RelationshipInspector project={project} relationshipId="rel-1" />)
      const upstreamGroup = screen.getByRole('radiogroup', { name: /upstream role/i })
      const pl = within(upstreamGroup).getByRole('radio', { name: /published language/i })
      expect(pl).toHaveAttribute('aria-checked', 'true')
    })

    it('toggles downstreamRole off when the active pill is clicked again', () => {
      const project = makeProject({
        relationships: [
          {
            id: 'rel-1',
            fromContextId: 'ctx-1',
            toContextId: 'ctx-2',
            pattern: 'customer-supplier',
            downstreamRole: 'anti-corruption-layer',
          },
        ],
      } as Partial<Project>)
      render(<RelationshipInspector project={project} relationshipId="rel-1" />)
      const downstreamGroup = screen.getByRole('radiogroup', { name: /downstream role/i })
      fireEvent.click(
        within(downstreamGroup).getByRole('radio', { name: /anti-corruption layer/i })
      )
      expect(mockUpdateRelationship).toHaveBeenCalledWith('rel-1', {
        downstreamRole: undefined,
      })
    })
  })

  describe('direction mini-diagram (Slice 4)', () => {
    it('renders mini-diagram with upstream and downstream sublabels for U/D relationships', () => {
      render(<RelationshipInspector project={makeProject()} relationshipId="rel-1" />)
      const flipBtn = screen.getByRole('button', { name: /flip direction/i })
      expect(flipBtn).toBeInTheDocument()
      const upstreamLabels = screen.getAllByText(/^upstream$/i)
      const downstreamLabels = screen.getAllByText(/^downstream$/i)
      expect(upstreamLabels.length).toBeGreaterThan(0)
      expect(downstreamLabels.length).toBeGreaterThan(0)
    })

    it('calls swapRelationshipDirection when the mini-diagram arrow is clicked', () => {
      render(<RelationshipInspector project={makeProject()} relationshipId="rel-1" />)
      fireEvent.click(screen.getByRole('button', { name: /flip direction/i }))
      expect(mockSwapRelationshipDirection).toHaveBeenCalledWith('rel-1')
    })

    it('does NOT render the mini-diagram when pattern is partnership', () => {
      const project = makeProject({
        relationships: [
          {
            id: 'rel-1',
            fromContextId: 'ctx-1',
            toContextId: 'ctx-2',
            pattern: 'partnership',
          },
        ],
      } as Partial<Project>)
      render(<RelationshipInspector project={project} relationshipId="rel-1" />)
      expect(screen.queryByRole('button', { name: /flip direction/i })).not.toBeInTheDocument()
    })

    it('does NOT render the mini-diagram when pattern is shared-kernel', () => {
      const project = makeProject({
        relationships: [
          {
            id: 'rel-1',
            fromContextId: 'ctx-1',
            toContextId: 'ctx-2',
            pattern: 'shared-kernel',
          },
        ],
      } as Partial<Project>)
      render(<RelationshipInspector project={project} relationshipId="rel-1" />)
      expect(screen.queryByRole('button', { name: /flip direction/i })).not.toBeInTheDocument()
    })

    it('shows the hint text near the mini-diagram', () => {
      render(<RelationshipInspector project={makeProject()} relationshipId="rel-1" />)
      expect(screen.getByText(/click the arrow to flip.*double-click.*canvas/i)).toBeInTheDocument()
    })

    it('renders Direction section AFTER Pattern section', () => {
      const { container } = render(
        <RelationshipInspector project={makeProject()} relationshipId="rel-1" />
      )
      const sectionLabels = Array.from(container.querySelectorAll('label, div'))
        .map((el) => el.textContent?.trim())
        .filter((t): t is string => !!t)
      const patternIdx = sectionLabels.findIndex((t) => t === 'Pattern')
      const directionIdx = sectionLabels.findIndex((t) => t === 'Direction')
      expect(patternIdx).toBeGreaterThan(-1)
      expect(directionIdx).toBeGreaterThan(-1)
      expect(directionIdx).toBeGreaterThan(patternIdx)
    })

    it('does NOT render a separate Contexts header for Partnership relationships', () => {
      const project = makeProject({
        relationships: [
          {
            id: 'rel-1',
            fromContextId: 'ctx-1',
            toContextId: 'ctx-2',
            pattern: 'partnership',
          },
        ],
      } as Partial<Project>)
      render(<RelationshipInspector project={project} relationshipId="rel-1" />)
      expect(screen.queryByText(/^Contexts$/)).not.toBeInTheDocument()
      expect(screen.queryByText(/^Direction$/)).not.toBeInTheDocument()
    })

    it('keeps boxes in stable canvas-spatial positions when fromContext is on the right', () => {
      const project = makeProject({
        contexts: [
          {
            id: 'ctx-1',
            name: 'Orders',
            positions: { flow: { x: 80 }, strategic: { x: 80 }, shared: { y: 0 } },
          },
          {
            id: 'ctx-2',
            name: 'Billing',
            positions: { flow: { x: 10 }, strategic: { x: 10 }, shared: { y: 0 } },
          },
        ],
        relationships: [
          {
            id: 'rel-1',
            fromContextId: 'ctx-1',
            toContextId: 'ctx-2',
            pattern: 'customer-supplier',
          },
        ],
      } as Partial<Project>)
      const { container } = render(
        <RelationshipInspector project={project} relationshipId="rel-1" />
      )
      const slotButtons = Array.from(container.querySelectorAll('button[type="button"]')).filter(
        (b) => /^(Orders|Billing)/.test(b.textContent?.trim() || '')
      )
      expect(slotButtons.length).toBe(2)
      expect(slotButtons[0]?.textContent).toContain('Billing')
      expect(slotButtons[1]?.textContent).toContain('Orders')
      expect(slotButtons[0]?.textContent?.toLowerCase()).toContain('upstream')
      expect(slotButtons[1]?.textContent?.toLowerCase()).toContain('downstream')
    })
  })

  describe('Shared Kernel auto-separation when picker changes pattern', () => {
    function makeOverlappingSKProject(): Project {
      return makeProject({
        contexts: [
          {
            id: 'ctx-1',
            name: 'Orders',
            positions: {
              flow: { x: 40 },
              strategic: { x: 40 },
              distillation: { x: 50, y: 50 },
              shared: { y: 40 },
            },
            codeSize: { bucket: 'medium' },
          },
          {
            id: 'ctx-2',
            name: 'Billing',
            positions: {
              flow: { x: 42 },
              strategic: { x: 42 },
              distillation: { x: 50, y: 50 },
              shared: { y: 42 },
            },
            codeSize: { bucket: 'medium' },
          },
        ] as unknown as Project['contexts'],
        relationships: [
          { id: 'rel-1', fromContextId: 'ctx-1', toContextId: 'ctx-2', pattern: 'shared-kernel' },
        ],
      })
    }

    it('moves both contexts apart when SK is replaced with Partnership', () => {
      render(<RelationshipInspector project={makeOverlappingSKProject()} relationshipId="rel-1" />)
      fireEvent.click(screen.getByRole('button', { name: /partnership/i }))
      expect(mockUpdateRelationship).toHaveBeenCalledWith('rel-1', { pattern: 'partnership' })
      expect(mockUpdateMultipleContextPositions).toHaveBeenCalledTimes(1)
      const positionsArg = mockUpdateMultipleContextPositions.mock.calls[0][0]
      expect(Object.keys(positionsArg).sort()).toEqual(['ctx-1', 'ctx-2'])
    })

    it('moves both contexts apart when SK is replaced with Customer-Supplier', () => {
      render(<RelationshipInspector project={makeOverlappingSKProject()} relationshipId="rel-1" />)
      fireEvent.click(screen.getByRole('button', { name: /customer-supplier/i }))
      expect(mockUpdateRelationship).toHaveBeenCalledWith('rel-1', {
        pattern: 'customer-supplier',
      })
      expect(mockUpdateMultipleContextPositions).toHaveBeenCalledTimes(1)
    })

    it('moves both contexts apart when SK is replaced with an upstream role', () => {
      render(<RelationshipInspector project={makeOverlappingSKProject()} relationshipId="rel-1" />)
      const upstreamGroup = screen.getByRole('radiogroup', { name: /upstream role/i })
      fireEvent.click(within(upstreamGroup).getByRole('radio', { name: /open host service/i }))
      expect(mockUpdateRelationship).toHaveBeenCalledWith('rel-1', {
        upstreamRole: 'open-host-service',
      })
      expect(mockUpdateMultipleContextPositions).toHaveBeenCalledTimes(1)
    })

    it('moves both contexts apart when SK is replaced with a downstream role', () => {
      render(<RelationshipInspector project={makeOverlappingSKProject()} relationshipId="rel-1" />)
      const downstreamGroup = screen.getByRole('radiogroup', { name: /downstream role/i })
      fireEvent.click(
        within(downstreamGroup).getByRole('radio', { name: /anti-corruption layer/i })
      )
      expect(mockUpdateRelationship).toHaveBeenCalledWith('rel-1', {
        downstreamRole: 'anti-corruption-layer',
      })
      expect(mockUpdateMultipleContextPositions).toHaveBeenCalledTimes(1)
    })

    it('does NOT reposition when the active pattern is not SK', () => {
      render(<RelationshipInspector project={makeProject()} relationshipId="rel-1" />)
      fireEvent.click(screen.getByRole('button', { name: /partnership/i }))
      expect(mockUpdateRelationship).toHaveBeenCalled()
      expect(mockUpdateMultipleContextPositions).not.toHaveBeenCalled()
    })

    it('does NOT reposition when toggling a role pill OFF (no SK→non-SK transition)', () => {
      const skWithOhsProject = makeProject({
        contexts: [
          {
            id: 'ctx-1',
            name: 'Orders',
            positions: {
              flow: { x: 40 },
              strategic: { x: 40 },
              distillation: { x: 50, y: 50 },
              shared: { y: 40 },
            },
            codeSize: { bucket: 'medium' },
          },
          {
            id: 'ctx-2',
            name: 'Billing',
            positions: {
              flow: { x: 42 },
              strategic: { x: 42 },
              distillation: { x: 50, y: 50 },
              shared: { y: 42 },
            },
            codeSize: { bucket: 'medium' },
          },
        ] as unknown as Project['contexts'],
        relationships: [
          {
            id: 'rel-1',
            fromContextId: 'ctx-1',
            toContextId: 'ctx-2',
            pattern: 'shared-kernel',
            upstreamRole: 'open-host-service',
          },
        ],
      })
      render(<RelationshipInspector project={skWithOhsProject} relationshipId="rel-1" />)
      const upstreamGroup = screen.getByRole('radiogroup', { name: /upstream role/i })
      fireEvent.click(within(upstreamGroup).getByRole('radio', { name: /open host service/i }))
      expect(mockUpdateRelationship).toHaveBeenCalledWith('rel-1', { upstreamRole: undefined })
      expect(mockUpdateMultipleContextPositions).not.toHaveBeenCalled()
    })

    it('does NOT reposition when the contexts do not overlap (degenerate SK)', () => {
      const nonOverlappingSK = makeProject({
        contexts: [
          {
            id: 'ctx-1',
            name: 'Orders',
            positions: {
              flow: { x: 5 },
              strategic: { x: 5 },
              distillation: { x: 50, y: 50 },
              shared: { y: 30 },
            },
            codeSize: { bucket: 'medium' },
          },
          {
            id: 'ctx-2',
            name: 'Billing',
            positions: {
              flow: { x: 80 },
              strategic: { x: 80 },
              distillation: { x: 50, y: 50 },
              shared: { y: 80 },
            },
            codeSize: { bucket: 'medium' },
          },
        ] as unknown as Project['contexts'],
        relationships: [
          { id: 'rel-1', fromContextId: 'ctx-1', toContextId: 'ctx-2', pattern: 'shared-kernel' },
        ],
      })
      render(<RelationshipInspector project={nonOverlappingSK} relationshipId="rel-1" />)
      fireEvent.click(screen.getByRole('button', { name: /partnership/i }))
      expect(mockUpdateRelationship).toHaveBeenCalled()
      expect(mockUpdateMultipleContextPositions).not.toHaveBeenCalled()
    })

    it('does NOT reposition when active view is distillation', () => {
      setupStore('distillation')
      render(<RelationshipInspector project={makeOverlappingSKProject()} relationshipId="rel-1" />)
      fireEvent.click(screen.getByRole('button', { name: /partnership/i }))
      expect(mockUpdateRelationship).toHaveBeenCalled()
      expect(mockUpdateMultipleContextPositions).not.toHaveBeenCalled()
    })
  })
})
