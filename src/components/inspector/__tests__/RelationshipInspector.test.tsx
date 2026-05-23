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

describe('RelationshipInspector', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useEditorStore).mockImplementation((selector) => {
      const state = {
        deleteRelationship: mockDeleteRelationship,
        updateRelationship: mockUpdateRelationship,
        swapRelationshipDirection: mockSwapRelationshipDirection,
      }
      return selector(state as never)
    })
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
})
