import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { UserNeedInspector } from '../UserNeedInspector'
import { useEditorStore } from '../../../model/store'
import type { Project } from '../../../model/types'

vi.mock('../../../model/store', () => ({
  useEditorStore: Object.assign(vi.fn(), { setState: vi.fn() }),
}))

const mockUpdateUserNeed = vi.fn()
const mockDeleteUserNeed = vi.fn()
const mockDeleteUserNeedConnection = vi.fn()
const mockDeleteNeedContextConnection = vi.fn()

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
    ],
    relationships: [],
    repos: [],
    teams: [],
    groups: [],
    people: [],
    users: [{ id: 'user-1', name: 'Customer' }],
    userNeeds: [{ id: 'need-1', name: 'Place Order', description: 'Needs to order' }],
    userNeedConnections: [{ id: 'uc-1', userId: 'user-1', userNeedId: 'need-1' }],
    needContextConnections: [{ id: 'nc-1', userNeedId: 'need-1', contextId: 'ctx-1' }],
    ...overrides,
  } as unknown as Project
}

describe('UserNeedInspector', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useEditorStore).mockImplementation((selector) => {
      const state = {
        updateUserNeed: mockUpdateUserNeed,
        deleteUserNeed: mockDeleteUserNeed,
        deleteUserNeedConnection: mockDeleteUserNeedConnection,
        deleteNeedContextConnection: mockDeleteNeedContextConnection,
      }
      return selector(state as never)
    })
  })

  it('renders not-found when userNeedId is invalid', () => {
    render(<UserNeedInspector project={makeProject()} userNeedId="nope" />)
    expect(screen.getByText('User Need not found.')).toBeInTheDocument()
  })

  it('renders name and description', () => {
    render(<UserNeedInspector project={makeProject()} userNeedId="need-1" />)
    expect(screen.getByDisplayValue('Place Order')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Needs to order')).toBeInTheDocument()
  })

  it('shows connected users and contexts', () => {
    render(<UserNeedInspector project={makeProject()} userNeedId="need-1" />)
    expect(screen.getByText('Customer')).toBeInTheDocument()
    expect(screen.getByText('Orders')).toBeInTheDocument()
  })

  it('calls updateUserNeed on name change', () => {
    render(<UserNeedInspector project={makeProject()} userNeedId="need-1" />)
    fireEvent.change(screen.getByDisplayValue('Place Order'), { target: { value: 'Submit Order' } })
    expect(mockUpdateUserNeed).toHaveBeenCalledWith('need-1', { name: 'Submit Order' })
  })

  it('calls deleteUserNeed on confirmed delete', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(<UserNeedInspector project={makeProject()} userNeedId="need-1" />)
    fireEvent.click(screen.getByText('Delete User Need'))
    expect(mockDeleteUserNeed).toHaveBeenCalledWith('need-1')
  })

  it('does not call deleteUserNeed when delete is cancelled', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    render(<UserNeedInspector project={makeProject()} userNeedId="need-1" />)
    fireEvent.click(screen.getByText('Delete User Need'))
    expect(mockDeleteUserNeed).not.toHaveBeenCalled()
  })

  it('navigates to user on click', () => {
    render(<UserNeedInspector project={makeProject()} userNeedId="need-1" />)
    fireEvent.click(screen.getByText('Customer'))
    expect(useEditorStore.setState).toHaveBeenCalledWith({
      selectedUserId: 'user-1',
      selectedUserNeedId: null,
    })
  })
})
