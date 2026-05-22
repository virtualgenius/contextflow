import type { EditorState } from '../model/storeTypes'

export type ClearedSelection = Pick<
  EditorState,
  | 'selectedContextId'
  | 'selectedGroupId'
  | 'selectedUserId'
  | 'selectedUserNeedId'
  | 'selectedRelationshipId'
  | 'selectedUserNeedConnectionId'
  | 'selectedNeedContextConnectionId'
  | 'selectedStageIndex'
  | 'selectedTeamId'
  | 'selectedContextIds'
>

/**
 * Single source of truth for clearing every selection type in the editor.
 * Used by the Inspector close button and the Esc-key handler so they
 * dismiss panels consistently regardless of which entity is selected.
 */
export const CLEARED_SELECTION: ClearedSelection = {
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
}
