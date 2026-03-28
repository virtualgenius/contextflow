export interface FlowStage {
  name: string
  position: number
}

export function validateStageName(
  stages: FlowStage[],
  newName: string,
  excludeIndex?: number
): void {
  const isDuplicate = stages.some((s, i) => i !== excludeIndex && s.name === newName)
  if (isDuplicate) {
    throw new Error('Stage name must be unique')
  }
}

export function validateStagePosition(
  stages: FlowStage[],
  newPosition: number,
  excludeIndex?: number
): void {
  const isDuplicate = stages.some((s, i) => i !== excludeIndex && s.position === newPosition)
  if (isDuplicate) {
    throw new Error('Stage position must be unique')
  }
}

export interface SelectionState {
  selectedContextId: string | null
  selectedRelationshipId: string | null
  selectedGroupId: string | null
  selectedUserId: string | null
  selectedUserNeedId: string | null
  selectedUserNeedConnectionId: string | null
  selectedNeedContextConnectionId: string | null
  selectedStageIndex: number | null
  selectedTeamId: string | null
  selectedDomainEventId: string | null
  selectedCommandId: string | null
  selectedESAggregateId: string | null
  selectedPolicyId: string | null
  selectedESHotSpotId: string | null
  selectedPivotalEventId: string | null
  selectedESConnectionId: string | null
  selectedContextIds: string[]
}

type SelectionType =
  | 'context'
  | 'relationship'
  | 'group'
  | 'user'
  | 'userNeed'
  | 'userNeedConnection'
  | 'needContextConnection'
  | 'stage'
  | 'team'
  | 'domainEvent'
  | 'command'
  | 'esAggregate'
  | 'policy'
  | 'esHotSpot'
  | 'pivotalEvent'
  | 'esConnection'

export function createSelectionState(
  selectedId: string | null,
  type: Exclude<SelectionType, 'stage'>
): SelectionState

export function createSelectionState(selectedIndex: number | null, type: 'stage'): SelectionState

export function createSelectionState(
  selectedValue: string | number | null,
  type: SelectionType
): SelectionState {
  const baseState: SelectionState = {
    selectedContextId: null,
    selectedRelationshipId: null,
    selectedGroupId: null,
    selectedUserId: null,
    selectedUserNeedId: null,
    selectedUserNeedConnectionId: null,
    selectedNeedContextConnectionId: null,
    selectedStageIndex: null,
    selectedTeamId: null,
    selectedDomainEventId: null,
    selectedCommandId: null,
    selectedESAggregateId: null,
    selectedPolicyId: null,
    selectedESHotSpotId: null,
    selectedPivotalEventId: null,
    selectedESConnectionId: null,
    selectedContextIds: [],
  }

  switch (type) {
    case 'context':
      return { ...baseState, selectedContextId: selectedValue as string | null }
    case 'relationship':
      return { ...baseState, selectedRelationshipId: selectedValue as string | null }
    case 'group':
      return { ...baseState, selectedGroupId: selectedValue as string | null }
    case 'user':
      return { ...baseState, selectedUserId: selectedValue as string | null }
    case 'userNeed':
      return { ...baseState, selectedUserNeedId: selectedValue as string | null }
    case 'userNeedConnection':
      return { ...baseState, selectedUserNeedConnectionId: selectedValue as string | null }
    case 'needContextConnection':
      return { ...baseState, selectedNeedContextConnectionId: selectedValue as string | null }
    case 'stage':
      return { ...baseState, selectedStageIndex: selectedValue as number | null }
    case 'team':
      return { ...baseState, selectedTeamId: selectedValue as string | null }
    case 'domainEvent':
      return { ...baseState, selectedDomainEventId: selectedValue as string | null }
    case 'command':
      return { ...baseState, selectedCommandId: selectedValue as string | null }
    case 'esAggregate':
      return { ...baseState, selectedESAggregateId: selectedValue as string | null }
    case 'policy':
      return { ...baseState, selectedPolicyId: selectedValue as string | null }
    case 'esHotSpot':
      return { ...baseState, selectedESHotSpotId: selectedValue as string | null }
    case 'pivotalEvent':
      return { ...baseState, selectedPivotalEventId: selectedValue as string | null }
    case 'esConnection':
      return { ...baseState, selectedESConnectionId: selectedValue as string | null }
  }
}
