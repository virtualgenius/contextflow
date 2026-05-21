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

// Helper to create a Y.Map with { x, y } position
function setPositionYMap(yMap: Y.Map<unknown>, position: { x: number; y: number }): void {
  const yPos = new Y.Map<unknown>()
  yPos.set('x', position.x)
  yPos.set('y', position.y)
  yMap.set('position', yPos)
}

function extractPosition(yMap: Y.Map<unknown>): { x: number; y: number } {
  const yPos = yMap.get('position') as Y.Map<unknown>
  return {
    x: yPos.get('x') as number,
    y: yPos.get('y') as number,
  }
}

// DomainEvent

export function populateDomainEventYMap(yMap: Y.Map<unknown>, event: DomainEvent): void {
  yMap.set('id', event.id)
  yMap.set('name', event.name)
  yMap.set('description', event.description ?? null)
  yMap.set('aggregateId', event.aggregateId ?? null)
  yMap.set('contextId', event.contextId ?? null)
  setPositionYMap(yMap, event.position)
}

export function domainEventToYMap(event: DomainEvent): Y.Map<unknown> {
  const tempDoc = new Y.Doc()
  const yMap = tempDoc.getMap('domainEvent')
  populateDomainEventYMap(yMap, event)
  return yMap
}

export function yMapToDomainEvent(yMap: Y.Map<unknown>): DomainEvent {
  const event: DomainEvent = {
    id: yMap.get('id') as string,
    name: yMap.get('name') as string,
    position: extractPosition(yMap),
  }

  const description = yMap.get('description')
  if (description !== null) event.description = description as string

  const aggregateId = yMap.get('aggregateId')
  if (aggregateId !== null) event.aggregateId = aggregateId as string

  const contextId = yMap.get('contextId')
  if (contextId !== null && contextId !== undefined) event.contextId = contextId as string

  return event
}

// Command

export function populateCommandYMap(yMap: Y.Map<unknown>, command: Command): void {
  yMap.set('id', command.id)
  yMap.set('name', command.name)
  yMap.set('description', command.description ?? null)
  yMap.set('aggregateId', command.aggregateId ?? null)
  yMap.set('actorId', command.actorId ?? null)
  yMap.set('contextId', command.contextId ?? null)
  setPositionYMap(yMap, command.position)
}

export function commandToYMap(command: Command): Y.Map<unknown> {
  const tempDoc = new Y.Doc()
  const yMap = tempDoc.getMap('command')
  populateCommandYMap(yMap, command)
  return yMap
}

export function yMapToCommand(yMap: Y.Map<unknown>): Command {
  const command: Command = {
    id: yMap.get('id') as string,
    name: yMap.get('name') as string,
    position: extractPosition(yMap),
  }

  const description = yMap.get('description')
  if (description !== null) command.description = description as string

  const aggregateId = yMap.get('aggregateId')
  if (aggregateId !== null) command.aggregateId = aggregateId as string

  const actorId = yMap.get('actorId')
  if (actorId !== null) command.actorId = actorId as string

  const contextId = yMap.get('contextId')
  if (contextId !== null && contextId !== undefined) command.contextId = contextId as string

  return command
}

// ESAggregate

export function populateESAggregateYMap(yMap: Y.Map<unknown>, aggregate: ESAggregate): void {
  yMap.set('id', aggregate.id)
  yMap.set('name', aggregate.name)
  yMap.set('description', aggregate.description ?? null)
  yMap.set('contextId', aggregate.contextId ?? null)
  setPositionYMap(yMap, aggregate.position)
}

export function esAggregateToYMap(aggregate: ESAggregate): Y.Map<unknown> {
  const tempDoc = new Y.Doc()
  const yMap = tempDoc.getMap('esAggregate')
  populateESAggregateYMap(yMap, aggregate)
  return yMap
}

export function yMapToESAggregate(yMap: Y.Map<unknown>): ESAggregate {
  const aggregate: ESAggregate = {
    id: yMap.get('id') as string,
    name: yMap.get('name') as string,
    position: extractPosition(yMap),
  }

  const description = yMap.get('description')
  if (description !== null) aggregate.description = description as string

  const contextId = yMap.get('contextId')
  if (contextId !== null) aggregate.contextId = contextId as string

  return aggregate
}

// Policy

export function populatePolicyYMap(yMap: Y.Map<unknown>, policy: Policy): void {
  yMap.set('id', policy.id)
  yMap.set('name', policy.name)
  yMap.set('description', policy.description ?? null)
  yMap.set('triggerEventId', policy.triggerEventId ?? null)
  yMap.set('contextId', policy.contextId ?? null)
  setPositionYMap(yMap, policy.position)
}

export function policyToYMap(policy: Policy): Y.Map<unknown> {
  const tempDoc = new Y.Doc()
  const yMap = tempDoc.getMap('policy')
  populatePolicyYMap(yMap, policy)
  return yMap
}

export function yMapToPolicy(yMap: Y.Map<unknown>): Policy {
  const policy: Policy = {
    id: yMap.get('id') as string,
    name: yMap.get('name') as string,
    position: extractPosition(yMap),
  }

  const description = yMap.get('description')
  if (description !== null) policy.description = description as string

  const triggerEventId = yMap.get('triggerEventId')
  if (triggerEventId !== null) policy.triggerEventId = triggerEventId as string

  const policyContextId = yMap.get('contextId')
  if (policyContextId !== null) policy.contextId = policyContextId as string

  return policy
}

// ESHotSpot

export function populateESHotSpotYMap(yMap: Y.Map<unknown>, hotSpot: ESHotSpot): void {
  yMap.set('id', hotSpot.id)
  yMap.set('title', hotSpot.title)
  yMap.set('description', hotSpot.description ?? null)
  yMap.set('severity', hotSpot.severity)
  yMap.set('contextId', hotSpot.contextId ?? null)
  setPositionYMap(yMap, hotSpot.position)
}

export function esHotSpotToYMap(hotSpot: ESHotSpot): Y.Map<unknown> {
  const tempDoc = new Y.Doc()
  const yMap = tempDoc.getMap('esHotSpot')
  populateESHotSpotYMap(yMap, hotSpot)
  return yMap
}

export function yMapToESHotSpot(yMap: Y.Map<unknown>): ESHotSpot {
  const hotSpot: ESHotSpot = {
    id: yMap.get('id') as string,
    title: yMap.get('title') as string,
    severity: yMap.get('severity') as ESHotSpot['severity'],
    position: extractPosition(yMap),
  }

  const description = yMap.get('description')
  if (description !== null) hotSpot.description = description as string

  const hotSpotContextId = yMap.get('contextId')
  if (hotSpotContextId !== null) hotSpot.contextId = hotSpotContextId as string

  return hotSpot
}

// PivotalEvent

export function populatePivotalEventYMap(yMap: Y.Map<unknown>, event: PivotalEvent): void {
  yMap.set('id', event.id)
  yMap.set('name', event.name)
  yMap.set('x', event.x)
  yMap.set('y', event.y)
  yMap.set('height', event.height)
  yMap.set('description', event.description ?? null)
}

export function pivotalEventToYMap(event: PivotalEvent): Y.Map<unknown> {
  const tempDoc = new Y.Doc()
  const yMap = tempDoc.getMap('pivotalEvent')
  populatePivotalEventYMap(yMap, event)
  return yMap
}

export function yMapToPivotalEvent(yMap: Y.Map<unknown>): PivotalEvent {
  const event: PivotalEvent = {
    id: yMap.get('id') as string,
    name: yMap.get('name') as string,
    // Backwards compat: old data had `position` as x
    x: (yMap.get('x') as number) ?? (yMap.get('position') as number) ?? 50,
    y: (yMap.get('y') as number) ?? 10,
    height: (yMap.get('height') as number) ?? 30,
  }

  const description = yMap.get('description')
  if (description !== null) event.description = description as string

  return event
}

// ESSwimLane

export function populateESSwimLaneYMap(yMap: Y.Map<unknown>, lane: ESSwimLane): void {
  yMap.set('id', lane.id)
  yMap.set('x', lane.x)
  yMap.set('y', lane.y)
  yMap.set('width', lane.width)
}

export function yMapToESSwimLane(yMap: Y.Map<unknown>): ESSwimLane {
  return {
    id: yMap.get('id') as string,
    x: (yMap.get('x') as number) ?? 10,
    y: (yMap.get('y') as number) ?? 50,
    width: (yMap.get('width') as number) ?? 30,
  }
}

// ESConnection

export function populateESConnectionYMap(yMap: Y.Map<unknown>, conn: ESConnection): void {
  yMap.set('id', conn.id)
  yMap.set('sourceId', conn.sourceId)
  yMap.set('targetId', conn.targetId)
  yMap.set('label', conn.label ?? null)
}

export function esConnectionToYMap(conn: ESConnection): Y.Map<unknown> {
  const tempDoc = new Y.Doc()
  const yMap = tempDoc.getMap('esConnection')
  populateESConnectionYMap(yMap, conn)
  return yMap
}

export function yMapToESConnection(yMap: Y.Map<unknown>): ESConnection {
  const conn: ESConnection = {
    id: yMap.get('id') as string,
    sourceId: yMap.get('sourceId') as string,
    targetId: yMap.get('targetId') as string,
  }

  const label = yMap.get('label')
  if (label !== null) conn.label = label as string

  return conn
}
