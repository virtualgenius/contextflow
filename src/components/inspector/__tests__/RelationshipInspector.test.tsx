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

  it('calls deleteRelationship on confirmed delete', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(<RelationshipInspector project={makeProject()} relationshipId="rel-1" />)
    fireEvent.click(screen.getByText('Delete Relationship'))
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

  it('calls updateRelationship when pattern changes', () => {
    render(<RelationshipInspector project={makeProject()} relationshipId="rel-1" />)
    fireEvent.change(screen.getByDisplayValue(/Customer-Supplier/i), {
      target: { value: 'conformist' },
    })
    expect(mockUpdateRelationship).toHaveBeenCalledWith('rel-1', { pattern: 'conformist' })
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
