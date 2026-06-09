import type { Project } from '../model/types'
import type { DraftEntity } from '../model/storeTypes'
import { calculateNextPosition, calculateNextStagePosition } from '../model/stagePosition'

// Flow-coordinate landing spots for Value Stream entities, mirroring how
// CanvasArea positions user nodes (y=10) and userNeed nodes (y=90) and how
// StageLabels positions lane headers (y=-15). The horizontal axis spans 2000
// flow units for a 0-100 position.
const VALUE_STREAM_WIDTH_UNITS = 2000
const USERS_BAND_Y = 10
const NEEDS_BAND_Y = 90
const STAGE_HEADER_Y = -15

export interface FlowPoint {
  x: number
  y: number
}

function positionToFlowX(position: number): number {
  return (position / 100) * VALUE_STREAM_WIDTH_UNITS
}

// Where the inline name field for a new Value Stream entity should appear so it
// previews exactly where the committed entity will land. The predicted position
// uses the same gap-finding helpers the add actions use, so preview == landing.
export function entityDraftFlowPosition(entity: DraftEntity, project: Project): FlowPoint {
  if (entity === 'user') {
    return { x: positionToFlowX(calculateNextPosition(project.users ?? [])), y: USERS_BAND_Y }
  }
  if (entity === 'userNeed') {
    return { x: positionToFlowX(calculateNextPosition(project.userNeeds ?? [])), y: NEEDS_BAND_Y }
  }
  return {
    x: positionToFlowX(calculateNextStagePosition(project.viewConfig?.flowStages ?? [])),
    y: STAGE_HEADER_Y,
  }
}
