import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { InspectorHeader } from '../inspectorShared'
import { useEditorStore } from '../../../model/store'

vi.mock('../../../model/store', () => ({
  useEditorStore: Object.assign(vi.fn(), { setState: vi.fn() }),
}))

describe('InspectorHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders its children alongside a Close button', () => {
    render(
      <InspectorHeader>
        <input aria-label="name" defaultValue="Orders" />
      </InspectorHeader>
    )
    expect(screen.getByLabelText('name')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /close inspector/i })).toBeInTheDocument()
  })

  it('clears all selection state when Close is clicked', () => {
    render(
      <InspectorHeader>
        <div>title</div>
      </InspectorHeader>
    )
    fireEvent.click(screen.getByRole('button', { name: /close inspector/i }))
    expect(useEditorStore.setState).toHaveBeenCalledWith({
      selectedContextId: null,
      selectedGroupId: null,
      selectedUserId: null,
      selectedUserNeedId: null,
      selectedRelationshipId: null,
      selectedUserNeedConnectionId: null,
      selectedNeedContextConnectionId: null,
      selectedStageIndex: null,
      selectedTeamId: null,
      selectedContextIds: [],
    })
  })
})
