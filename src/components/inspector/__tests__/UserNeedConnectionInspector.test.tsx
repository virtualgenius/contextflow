import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { UserNeedConnectionInspector } from '../UserNeedConnectionInspector'
import { useEditorStore } from '../../../model/store'
import type { Project } from '../../../model/types'

vi.mock('../../../model/store', () => ({
  useEditorStore: Object.assign(vi.fn(), { setState: vi.fn() }),
}))

const mockDeleteUserNeedConnection = vi.fn()
const mockUpdateUserNeedConnection = vi.fn()

function makeProject(): Project {
  return {
    id: 'proj-1',
    name: 'Test',
    contexts: [],
    relationships: [],
    repos: [],
    teams: [],
    groups: [],
    people: [],
    users: [{ id: 'user-1', name: 'Customer' }],
    userNeeds: [{ id: 'need-1', name: 'Place Order' }],
    userNeedConnections: [{ id: 'uc-1', userId: 'user-1', userNeedId: 'need-1', notes: 'Primary flow' }],
  } as unknown as Project
}

describe('UserNeedConnectionInspector', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useEditorStore).mockImplementation((selector) => {
      const state = {
        deleteUserNeedConnection: mockDeleteUserNeedConnection,
        updateUserNeedConnection: mockUpdateUserNeedConnection,
      }
      return selector(state as never)
    })
  })

  it('renders not-found when connectionId is invalid', () => {
    render(<UserNeedConnectionInspector project={makeProject()} connectionId="nope" />)
    expect(screen.getByText('Connection not found.')).toBeInTheDocument()
  })

  it('renders user and need names', () => {
    render(<UserNeedConnectionInspector project={makeProject()} connectionId="uc-1" />)
    expect(screen.getByText('Customer')).toBeInTheDocument()
    expect(screen.getByText('Place Order')).toBeInTheDocument()
  })

  it('calls delete on confirmed delete', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(<UserNeedConnectionInspector project={makeProject()} connectionId="uc-1" />)
    fireEvent.click(screen.getByText('Delete Connection'))
    expect(mockDeleteUserNeedConnection).toHaveBeenCalledWith('uc-1')
  })

  it('navigates to user on click', () => {
    render(<UserNeedConnectionInspector project={makeProject()} connectionId="uc-1" />)
    fireEvent.click(screen.getByText('Customer'))
    expect(useEditorStore.setState).toHaveBeenCalledWith({ selectedUserId: 'user-1', selectedUserNeedConnectionId: null })
  })
})
