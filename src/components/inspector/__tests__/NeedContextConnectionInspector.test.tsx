import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { NeedContextConnectionInspector } from '../NeedContextConnectionInspector'
import { useEditorStore } from '../../../model/store'
import type { Project } from '../../../model/types'

vi.mock('../../../model/store', () => ({
  useEditorStore: Object.assign(vi.fn(), { setState: vi.fn() }),
}))

const mockDeleteNeedContextConnection = vi.fn()
const mockUpdateNeedContextConnection = vi.fn()

function makeProject(): Project {
  return {
    id: 'proj-1',
    name: 'Test',
    contexts: [{ id: 'ctx-1', name: 'Orders', positions: { flow: { x: 0 }, strategic: { x: 0 }, shared: { y: 0 } } }],
    relationships: [],
    repos: [],
    teams: [],
    groups: [],
    people: [],
    userNeeds: [{ id: 'need-1', name: 'Place Order' }],
    needContextConnections: [{ id: 'nc-1', userNeedId: 'need-1', contextId: 'ctx-1' }],
  } as unknown as Project
}

describe('NeedContextConnectionInspector', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useEditorStore).mockImplementation((selector) => {
      const state = {
        deleteNeedContextConnection: mockDeleteNeedContextConnection,
        updateNeedContextConnection: mockUpdateNeedContextConnection,
      }
      return selector(state as never)
    })
  })

  it('renders not-found when connectionId is invalid', () => {
    render(<NeedContextConnectionInspector project={makeProject()} connectionId="nope" />)
    expect(screen.getByText('Connection not found.')).toBeInTheDocument()
  })

  it('renders need and context names', () => {
    render(<NeedContextConnectionInspector project={makeProject()} connectionId="nc-1" />)
    expect(screen.getByText('Place Order')).toBeInTheDocument()
    expect(screen.getByText('Orders')).toBeInTheDocument()
  })

  it('calls delete on confirmed delete', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(<NeedContextConnectionInspector project={makeProject()} connectionId="nc-1" />)
    fireEvent.click(screen.getByText('Delete Connection'))
    expect(mockDeleteNeedContextConnection).toHaveBeenCalledWith('nc-1')
  })

  it('navigates to context on click', () => {
    render(<NeedContextConnectionInspector project={makeProject()} connectionId="nc-1" />)
    fireEvent.click(screen.getByText('Orders'))
    expect(useEditorStore.setState).toHaveBeenCalledWith({ selectedContextId: 'ctx-1', selectedNeedContextConnectionId: null })
  })
})
