import * as Y from 'yjs'
import type {
  DomainEvent,
  Command,
  ESAggregate,
  Policy,
  ESHotSpot,
  PivotalEvent,
  ESSwimLane,
  ESConnection,
} from '../types'
import {
  populateDomainEventYMap,
  populateCommandYMap,
  populateESAggregateYMap,
  populatePolicyYMap,
  populateESHotSpotYMap,
  populatePivotalEventYMap,
  populateESSwimLaneYMap,
  populateESConnectionYMap,
} from './eventStormingSync'

// Helpers

function ensureESMap(ydoc: Y.Doc): Y.Map<unknown> {
  const yProject = ydoc.getMap('project')
  const yES = yProject.get('eventStorming')
  if (yES !== null && yES !== undefined) {
    return yES as Y.Map<unknown>
  }
  // Auto-initialize the eventStorming structure
  const yNewES = new Y.Map<unknown>()
  yNewES.set('enabled', true)
  yNewES.set('domainEvents', new Y.Array<Y.Map<unknown>>())
  yNewES.set('commands', new Y.Array<Y.Map<unknown>>())
  yNewES.set('aggregates', new Y.Array<Y.Map<unknown>>())
  yNewES.set('policies', new Y.Array<Y.Map<unknown>>())
  yNewES.set('hotSpots', new Y.Array<Y.Map<unknown>>())
  yNewES.set('pivotalEvents', new Y.Array<Y.Map<unknown>>())
  yNewES.set('swimLanes', new Y.Array<Y.Map<unknown>>())
  yNewES.set('connections', new Y.Array<Y.Map<unknown>>())
  yProject.set('eventStorming', yNewES)
  return yNewES
}

function getESArray(ydoc: Y.Doc, key: string): Y.Array<Y.Map<unknown>> {
  const yES = ensureESMap(ydoc)
  return yES.get(key) as Y.Array<Y.Map<unknown>>
}

function findById(
  yArray: Y.Array<Y.Map<unknown>>,
  id: string
): { yMap: Y.Map<unknown>; index: number } | null {
  for (let i = 0; i < yArray.length; i++) {
    const yMap = yArray.get(i)
    if (yMap.get('id') === id) return { yMap, index: i }
  }
  return null
}

// Toggle Event Storming mode

export function toggleEventStormingMutation(ydoc: Y.Doc): void {
  const yProject = ydoc.getMap('project')
  const yES = yProject.get('eventStorming')

  if (yES === null || yES === undefined) {
    // Enable: create the eventStorming structure
    const yNewES = new Y.Map<unknown>()
    yNewES.set('enabled', true)
    yNewES.set('domainEvents', new Y.Array<Y.Map<unknown>>())
    yNewES.set('commands', new Y.Array<Y.Map<unknown>>())
    yNewES.set('aggregates', new Y.Array<Y.Map<unknown>>())
    yNewES.set('policies', new Y.Array<Y.Map<unknown>>())
    yNewES.set('hotSpots', new Y.Array<Y.Map<unknown>>())
    yNewES.set('pivotalEvents', new Y.Array<Y.Map<unknown>>())
    yNewES.set('swimLanes', new Y.Array<Y.Map<unknown>>())
    yNewES.set('connections', new Y.Array<Y.Map<unknown>>())
    yProject.set('eventStorming', yNewES)
  } else {
    const yESMap = yES as Y.Map<unknown>
    const enabled = yESMap.get('enabled') as boolean
    yESMap.set('enabled', !enabled)
  }
}

// DomainEvent mutations

export function addDomainEventMutation(ydoc: Y.Doc, event: DomainEvent): void {
  const yArray = getESArray(ydoc, 'domainEvents')
  if (!yArray) return
  const yMap = new Y.Map<unknown>()
  populateDomainEventYMap(yMap, event)
  yArray.push([yMap])
}

export function updateDomainEventMutation(
  ydoc: Y.Doc,
  eventId: string,
  updates: Partial<DomainEvent>
): void {
  const yArray = getESArray(ydoc, 'domainEvents')
  if (!yArray) return
  const found = findById(yArray, eventId)
  if (!found) return

  ydoc.transact(() => {
    const { yMap } = found
    if ('name' in updates) yMap.set('name', updates.name)
    if ('description' in updates) yMap.set('description', updates.description ?? null)
    if ('aggregateId' in updates) yMap.set('aggregateId', updates.aggregateId ?? null)
    if ('contextId' in updates) yMap.set('contextId', updates.contextId ?? null)
    if ('position' in updates && updates.position) {
      const yPos = yMap.get('position') as Y.Map<unknown>
      yPos.set('x', updates.position.x)
      yPos.set('y', updates.position.y)
    }
  })
}

export function deleteDomainEventMutation(ydoc: Y.Doc, eventId: string): void {
  const yArray = getESArray(ydoc, 'domainEvents')
  if (!yArray) return
  const found = findById(yArray, eventId)
  if (!found) return
  ydoc.transact(() => {
    cascadeDeleteConnections(ydoc, eventId)
    yArray.delete(found.index)
  })
}

// Command mutations

export function addCommandMutation(ydoc: Y.Doc, command: Command): void {
  const yArray = getESArray(ydoc, 'commands')
  if (!yArray) return
  const yMap = new Y.Map<unknown>()
  populateCommandYMap(yMap, command)
  yArray.push([yMap])
}

export function updateCommandMutation(
  ydoc: Y.Doc,
  commandId: string,
  updates: Partial<Command>
): void {
  const yArray = getESArray(ydoc, 'commands')
  if (!yArray) return
  const found = findById(yArray, commandId)
  if (!found) return

  ydoc.transact(() => {
    const { yMap } = found
    if ('name' in updates) yMap.set('name', updates.name)
    if ('description' in updates) yMap.set('description', updates.description ?? null)
    if ('aggregateId' in updates) yMap.set('aggregateId', updates.aggregateId ?? null)
    if ('actorId' in updates) yMap.set('actorId', updates.actorId ?? null)
    if ('contextId' in updates) yMap.set('contextId', updates.contextId ?? null)
    if ('position' in updates && updates.position) {
      const yPos = yMap.get('position') as Y.Map<unknown>
      yPos.set('x', updates.position.x)
      yPos.set('y', updates.position.y)
    }
  })
}

export function deleteCommandMutation(ydoc: Y.Doc, commandId: string): void {
  const yArray = getESArray(ydoc, 'commands')
  if (!yArray) return
  const found = findById(yArray, commandId)
  if (!found) return
  ydoc.transact(() => {
    cascadeDeleteConnections(ydoc, commandId)
    yArray.delete(found.index)
  })
}

// ESAggregate mutations

export function addESAggregateMutation(ydoc: Y.Doc, aggregate: ESAggregate): void {
  const yArray = getESArray(ydoc, 'aggregates')
  if (!yArray) return
  const yMap = new Y.Map<unknown>()
  populateESAggregateYMap(yMap, aggregate)
  yArray.push([yMap])
}

export function updateESAggregateMutation(
  ydoc: Y.Doc,
  aggregateId: string,
  updates: Partial<ESAggregate>
): void {
  const yArray = getESArray(ydoc, 'aggregates')
  if (!yArray) return
  const found = findById(yArray, aggregateId)
  if (!found) return

  ydoc.transact(() => {
    const { yMap } = found
    if ('name' in updates) yMap.set('name', updates.name)
    if ('description' in updates) yMap.set('description', updates.description ?? null)
    if ('contextId' in updates) yMap.set('contextId', updates.contextId ?? null)
    if ('position' in updates && updates.position) {
      const yPos = yMap.get('position') as Y.Map<unknown>
      yPos.set('x', updates.position.x)
      yPos.set('y', updates.position.y)
    }
  })
}

export function deleteESAggregateMutation(ydoc: Y.Doc, aggregateId: string): void {
  const yArray = getESArray(ydoc, 'aggregates')
  if (!yArray) return
  const found = findById(yArray, aggregateId)
  if (!found) return

  // Cascade: clear aggregateId references from domain events and commands
  ydoc.transact(() => {
    const yEvents = getESArray(ydoc, 'domainEvents')
    if (yEvents) {
      for (let i = 0; i < yEvents.length; i++) {
        const yEvent = yEvents.get(i)
        if (yEvent.get('aggregateId') === aggregateId) {
          yEvent.set('aggregateId', null)
        }
      }
    }

    const yCommands = getESArray(ydoc, 'commands')
    if (yCommands) {
      for (let i = 0; i < yCommands.length; i++) {
        const yCmd = yCommands.get(i)
        if (yCmd.get('aggregateId') === aggregateId) {
          yCmd.set('aggregateId', null)
        }
      }
    }

    yArray.delete(found.index)
  })
}

// Policy mutations

export function addPolicyMutation(ydoc: Y.Doc, policy: Policy): void {
  const yArray = getESArray(ydoc, 'policies')
  if (!yArray) return
  const yMap = new Y.Map<unknown>()
  populatePolicyYMap(yMap, policy)
  yArray.push([yMap])
}

export function updatePolicyMutation(
  ydoc: Y.Doc,
  policyId: string,
  updates: Partial<Policy>
): void {
  const yArray = getESArray(ydoc, 'policies')
  if (!yArray) return
  const found = findById(yArray, policyId)
  if (!found) return

  ydoc.transact(() => {
    const { yMap } = found
    if ('name' in updates) yMap.set('name', updates.name)
    if ('description' in updates) yMap.set('description', updates.description ?? null)
    if ('triggerEventId' in updates) yMap.set('triggerEventId', updates.triggerEventId ?? null)
    if ('contextId' in updates) yMap.set('contextId', updates.contextId ?? null)
    if ('position' in updates && updates.position) {
      const yPos = yMap.get('position') as Y.Map<unknown>
      yPos.set('x', updates.position.x)
      yPos.set('y', updates.position.y)
    }
  })
}

export function deletePolicyMutation(ydoc: Y.Doc, policyId: string): void {
  const yArray = getESArray(ydoc, 'policies')
  if (!yArray) return
  const found = findById(yArray, policyId)
  if (!found) return
  ydoc.transact(() => {
    cascadeDeleteConnections(ydoc, policyId)
    yArray.delete(found.index)
  })
}

// ESHotSpot mutations

export function addESHotSpotMutation(ydoc: Y.Doc, hotSpot: ESHotSpot): void {
  const yArray = getESArray(ydoc, 'hotSpots')
  if (!yArray) return
  const yMap = new Y.Map<unknown>()
  populateESHotSpotYMap(yMap, hotSpot)
  yArray.push([yMap])
}

export function updateESHotSpotMutation(
  ydoc: Y.Doc,
  hotSpotId: string,
  updates: Partial<ESHotSpot>
): void {
  const yArray = getESArray(ydoc, 'hotSpots')
  if (!yArray) return
  const found = findById(yArray, hotSpotId)
  if (!found) return

  ydoc.transact(() => {
    const { yMap } = found
    if ('title' in updates) yMap.set('title', updates.title)
    if ('description' in updates) yMap.set('description', updates.description ?? null)
    if ('severity' in updates) yMap.set('severity', updates.severity)
    if ('contextId' in updates) yMap.set('contextId', updates.contextId ?? null)
    if ('position' in updates && updates.position) {
      const yPos = yMap.get('position') as Y.Map<unknown>
      yPos.set('x', updates.position.x)
      yPos.set('y', updates.position.y)
    }
  })
}

export function deleteESHotSpotMutation(ydoc: Y.Doc, hotSpotId: string): void {
  const yArray = getESArray(ydoc, 'hotSpots')
  if (!yArray) return
  const found = findById(yArray, hotSpotId)
  if (!found) return
  ydoc.transact(() => {
    cascadeDeleteConnections(ydoc, hotSpotId)
    yArray.delete(found.index)
  })
}

// PivotalEvent mutations

export function addPivotalEventMutation(ydoc: Y.Doc, event: PivotalEvent): void {
  const yArray = getESArray(ydoc, 'pivotalEvents')
  if (!yArray) return
  const yMap = new Y.Map<unknown>()
  populatePivotalEventYMap(yMap, event)
  yArray.push([yMap])
}

export function updatePivotalEventMutation(
  ydoc: Y.Doc,
  eventId: string,
  updates: Partial<PivotalEvent>
): void {
  const yArray = getESArray(ydoc, 'pivotalEvents')
  if (!yArray) return
  const found = findById(yArray, eventId)
  if (!found) return

  ydoc.transact(() => {
    const { yMap } = found
    if ('name' in updates) yMap.set('name', updates.name)
    if ('x' in updates) yMap.set('x', updates.x)
    if ('y' in updates) yMap.set('y', updates.y)
    if ('height' in updates) yMap.set('height', updates.height)
    if ('description' in updates) yMap.set('description', updates.description ?? null)
  })
}

export function deletePivotalEventMutation(ydoc: Y.Doc, eventId: string): void {
  const yArray = getESArray(ydoc, 'pivotalEvents')
  if (!yArray) return
  const found = findById(yArray, eventId)
  if (!found) return

  ydoc.transact(() => {
    cascadeDeleteConnections(ydoc, eventId)
    yArray.delete(found.index)
  })
}

// Helper: cascade delete connections referencing a deleted entity
function cascadeDeleteConnections(ydoc: Y.Doc, entityId: string): void {
  const yConnections = getESArray(ydoc, 'connections')
  if (!yConnections) return
  // Delete in reverse to avoid index shifting
  for (let i = yConnections.length - 1; i >= 0; i--) {
    const yConn = yConnections.get(i)
    if (yConn.get('sourceId') === entityId || yConn.get('targetId') === entityId) {
      yConnections.delete(i)
    }
  }
}

// ESConnection mutations

export function addESConnectionMutation(ydoc: Y.Doc, connection: ESConnection): void {
  const yArray = getESArray(ydoc, 'connections')
  if (!yArray) return
  const yMap = new Y.Map<unknown>()
  populateESConnectionYMap(yMap, connection)
  yArray.push([yMap])
}

export function updateESConnectionMutation(
  ydoc: Y.Doc,
  connectionId: string,
  updates: Partial<ESConnection>
): void {
  const yArray = getESArray(ydoc, 'connections')
  if (!yArray) return
  const found = findById(yArray, connectionId)
  if (!found) return

  ydoc.transact(() => {
    const { yMap } = found
    if ('label' in updates) yMap.set('label', updates.label ?? null)
    if ('sourceId' in updates) yMap.set('sourceId', updates.sourceId)
    if ('targetId' in updates) yMap.set('targetId', updates.targetId)
  })
}

export function deleteESConnectionMutation(ydoc: Y.Doc, connectionId: string): void {
  const yArray = getESArray(ydoc, 'connections')
  if (!yArray) return
  const found = findById(yArray, connectionId)
  if (!found) return
  yArray.delete(found.index)
}

// ESSwimLane mutations

export function addESSwimLaneMutation(ydoc: Y.Doc, lane: ESSwimLane): void {
  const yArray = getESArray(ydoc, 'swimLanes')
  if (!yArray) return
  const yMap = new Y.Map<unknown>()
  populateESSwimLaneYMap(yMap, lane)
  yArray.push([yMap])
}

export function updateESSwimLaneMutation(
  ydoc: Y.Doc,
  laneId: string,
  updates: Partial<ESSwimLane>
): void {
  const yArray = getESArray(ydoc, 'swimLanes')
  if (!yArray) return
  const found = findById(yArray, laneId)
  if (!found) return
  ydoc.transact(() => {
    const { yMap } = found
    if ('x' in updates) yMap.set('x', updates.x)
    if ('y' in updates) yMap.set('y', updates.y)
    if ('width' in updates) yMap.set('width', updates.width)
  })
}

export function deleteESSwimLaneMutation(ydoc: Y.Doc, laneId: string): void {
  const yArray = getESArray(ydoc, 'swimLanes')
  if (!yArray) return
  const found = findById(yArray, laneId)
  if (!found) return
  yArray.delete(found.index)
}
