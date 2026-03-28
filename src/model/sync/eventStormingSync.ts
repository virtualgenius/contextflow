import * as Y from 'yjs'
import type {
  DomainEvent,
  Command,
  ESAggregate,
  Policy,
  ESHotSpot,
  PivotalEvent,
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

  return event
}

// Command

export function populateCommandYMap(yMap: Y.Map<unknown>, command: Command): void {
  yMap.set('id', command.id)
  yMap.set('name', command.name)
  yMap.set('description', command.description ?? null)
  yMap.set('aggregateId', command.aggregateId ?? null)
  yMap.set('actorId', command.actorId ?? null)
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

  return policy
}

// ESHotSpot

export function populateESHotSpotYMap(yMap: Y.Map<unknown>, hotSpot: ESHotSpot): void {
  yMap.set('id', hotSpot.id)
  yMap.set('title', hotSpot.title)
  yMap.set('description', hotSpot.description ?? null)
  yMap.set('severity', hotSpot.severity)
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

  return hotSpot
}

// PivotalEvent

export function populatePivotalEventYMap(yMap: Y.Map<unknown>, event: PivotalEvent): void {
  yMap.set('id', event.id)
  yMap.set('name', event.name)
  yMap.set('position', event.position)
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
    position: yMap.get('position') as number,
  }

  const description = yMap.get('description')
  if (description !== null) event.description = description as string

  return event
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
