import { describe, it, expect } from 'vitest'
import { entityDraftFlowPosition } from '../entityDraftPlacement'
import type { Project } from '../../model/types'

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: 'p1',
    name: 'P',
    contexts: [],
    relationships: [],
    repos: [],
    teams: [],
    groups: [],
    users: [],
    userNeeds: [],
    needContextConnections: [],
    userNeedConnections: [],
    viewConfig: { flowStages: [] },
    ...overrides,
  } as unknown as Project
}

describe('entityDraftFlowPosition', () => {
  it('places a user on the Users band (y=10) at the centre x when there are no users', () => {
    const pos = entityDraftFlowPosition('user', makeProject())
    // calculateNextPosition([]) === 50 -> (50/100)*2000 === 1000
    expect(pos).toEqual({ x: 1000, y: 10 })
  })

  it('places a user need on the Needs band (y=90)', () => {
    const pos = entityDraftFlowPosition('userNeed', makeProject())
    expect(pos).toEqual({ x: 1000, y: 90 })
  })

  it('places a stage at the lane header (y=-15)', () => {
    const pos = entityDraftFlowPosition('stage', makeProject())
    expect(pos).toEqual({ x: 1000, y: -15 })
  })

  it('predicts the next user x from the largest gap, matching calculateNextPosition', () => {
    const project = makeProject({
      users: [{ id: 'u1', name: 'A', position: 25 }],
    } as Partial<Project>)
    // calculateNextPosition([{position:25}]) -> gaps 25 and 75 -> 25 + 37.5 -> round 63
    const pos = entityDraftFlowPosition('user', project)
    expect(pos).toEqual({ x: (63 / 100) * 2000, y: 10 })
  })

  it('predicts the next stage x from existing flowStages', () => {
    const project = makeProject({
      viewConfig: { flowStages: [{ name: 'Intake', position: 25 }] },
    } as Partial<Project>)
    const pos = entityDraftFlowPosition('stage', project)
    expect(pos).toEqual({ x: (63 / 100) * 2000, y: -15 })
  })
})
