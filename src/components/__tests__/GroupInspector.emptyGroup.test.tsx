import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { GroupInspector } from '../inspector/GroupInspector'
import { useEditorStore } from '../../model/store'
import type { Project } from '../../model/types'

vi.mock('../../model/store', () => ({
  useEditorStore: Object.assign(vi.fn(), { setState: vi.fn() }),
}))

const mockAddContextToGroup = vi.fn()

function setupStoreMock() {
  vi.mocked(useEditorStore).mockImplementation((selector) => {
    const state = {
      updateGroup: vi.fn(),
      deleteGroup: vi.fn(),
      removeContextFromGroup: vi.fn(),
      addContextToGroup: mockAddContextToGroup,
      addContextsToGroup: vi.fn(),
    }
    return selector(state as never)
  })
}

function makeProject(): Project {
  return {
    groups: [
      { id: 'g-1', label: 'Checkout', contextIds: [], notes: null },
      {
        id: 'g-2',
        label: 'Fulfillment',
        contextIds: ['ctx-1'],
        notes: null,
      },
    ],
    contexts: [
      { id: 'ctx-1', name: 'Orders' },
      { id: 'ctx-2', name: 'Payments' },
    ],
  } as unknown as Project
}

describe('GroupInspector empty-group guidance (issue #7)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupStoreMock()
  })

  it('explains how to add contexts while the group is empty', () => {
    render(<GroupInspector project={makeProject()} groupId="g-1" />)
    expect(screen.getByTestId('empty-group-callout')).toHaveTextContent('This group is empty')
    expect(screen.getByTestId('empty-group-callout')).toHaveTextContent('Add to group')
  })

  it('still lists available contexts so the empty group can be filled', () => {
    render(<GroupInspector project={makeProject()} groupId="g-1" />)
    const addPayments = screen.getByText('Payments')
    fireEvent.click(addPayments)
    expect(mockAddContextToGroup).toHaveBeenCalledWith('g-1', 'ctx-2')
  })

  it('does not show the callout once the group has members', () => {
    render(<GroupInspector project={makeProject()} groupId="g-2" />)
    expect(screen.queryByTestId('empty-group-callout')).not.toBeInTheDocument()
  })
})
