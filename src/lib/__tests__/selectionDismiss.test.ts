import { describe, it, expect } from 'vitest'
import { CLEARED_SELECTION } from '../selectionDismiss'

describe('CLEARED_SELECTION', () => {
  it('sets every selection id to null', () => {
    expect(CLEARED_SELECTION.selectedContextId).toBeNull()
    expect(CLEARED_SELECTION.selectedGroupId).toBeNull()
    expect(CLEARED_SELECTION.selectedUserId).toBeNull()
    expect(CLEARED_SELECTION.selectedUserNeedId).toBeNull()
    expect(CLEARED_SELECTION.selectedRelationshipId).toBeNull()
    expect(CLEARED_SELECTION.selectedUserNeedConnectionId).toBeNull()
    expect(CLEARED_SELECTION.selectedNeedContextConnectionId).toBeNull()
    expect(CLEARED_SELECTION.selectedStageIndex).toBeNull()
    expect(CLEARED_SELECTION.selectedTeamId).toBeNull()
  })

  it('clears the multi-selection list', () => {
    expect(CLEARED_SELECTION.selectedContextIds).toEqual([])
  })
})
