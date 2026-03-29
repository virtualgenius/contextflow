import type { Node, Edge } from 'reactflow'
import type { Project, ESConnection } from '../model/types'
import type { ESStickyType } from '../components/nodes/ESStickyNode'
import { getValidTargets } from '../lib/esConnectionRules'
import { ES_W, ES_H } from './esCanvasConfig'

/**
 * Build React Flow nodes for the Event Storming view.
 */
export function buildESNodes(
  eventStorming: NonNullable<Project['eventStorming']>,
  selectedIds: {
    selectedDomainEventId: string | null
    selectedCommandId: string | null
    selectedESAggregateId: string | null
    selectedPolicyId: string | null
    selectedESHotSpotId: string | null
  },
  selectedStickyIds: string[],
  esConnectingFromType: ESStickyType | null
): Node[] {
  const esValidTargets = esConnectingFromType ? getValidTargets(esConnectingFromType) : []
  const isConnecting = esConnectingFromType !== null

  return [
    ...(eventStorming.domainEvents || []).map((evt) => ({
      id: evt.id,
      type: 'esSticky' as const,
      position: { x: (evt.position.x / 100) * ES_W, y: (evt.position.y / 100) * ES_H },
      data: {
        stickyType: 'domainEvent',
        name: evt.name,
        isSelected: evt.id === selectedIds.selectedDomainEventId,
        isAreaSelected: selectedStickyIds.includes(evt.id),
        isValidTarget: esValidTargets.includes('domainEvent'),
        isConnecting,
        votes: evt.votes,
      },
      style: { width: 140, height: 100, zIndex: 10 },
      draggable: true,
      selectable: true,
      connectable: true,
    })),
    ...(eventStorming.commands || []).map((cmd) => ({
      id: cmd.id,
      type: 'esSticky' as const,
      position: { x: (cmd.position.x / 100) * ES_W, y: (cmd.position.y / 100) * ES_H },
      data: {
        stickyType: 'command',
        name: cmd.name,
        isSelected: cmd.id === selectedIds.selectedCommandId,
        isAreaSelected: selectedStickyIds.includes(cmd.id),
        isValidTarget: esValidTargets.includes('command'),
        isConnecting,
        votes: cmd.votes,
      },
      style: { width: 140, height: 100, zIndex: 10 },
      draggable: true,
      selectable: true,
      connectable: true,
    })),
    ...(eventStorming.aggregates || []).map((agg) => ({
      id: agg.id,
      type: 'esSticky' as const,
      position: { x: (agg.position.x / 100) * ES_W, y: (agg.position.y / 100) * ES_H },
      data: {
        stickyType: 'aggregate',
        name: agg.name,
        isSelected: agg.id === selectedIds.selectedESAggregateId,
        isAreaSelected: selectedStickyIds.includes(agg.id),
        isValidTarget: esValidTargets.includes('aggregate'),
        isConnecting,
        votes: agg.votes,
      },
      style: { width: 140, height: 100, zIndex: 10 },
      draggable: true,
      selectable: true,
      connectable: true,
    })),
    ...(eventStorming.policies || []).map((pol) => ({
      id: pol.id,
      type: 'esSticky' as const,
      position: { x: (pol.position.x / 100) * ES_W, y: (pol.position.y / 100) * ES_H },
      data: {
        stickyType: 'policy',
        name: pol.name,
        isSelected: pol.id === selectedIds.selectedPolicyId,
        isAreaSelected: selectedStickyIds.includes(pol.id),
        isValidTarget: esValidTargets.includes('policy'),
        isConnecting,
        votes: pol.votes,
      },
      style: { width: 140, height: 100, zIndex: 10 },
      draggable: true,
      selectable: true,
      connectable: true,
    })),
    ...(eventStorming.hotSpots || []).map((hs) => ({
      id: hs.id,
      type: 'esSticky' as const,
      position: { x: (hs.position.x / 100) * ES_W, y: (hs.position.y / 100) * ES_H },
      data: {
        stickyType: 'hotSpot',
        name: hs.title,
        isSelected: hs.id === selectedIds.selectedESHotSpotId,
        isAreaSelected: selectedStickyIds.includes(hs.id),
        isValidTarget: esValidTargets.includes('hotSpot'),
        isConnecting,
        votes: hs.votes,
      },
      style: { width: 140, height: 100, zIndex: 10 },
      draggable: true,
      selectable: true,
      connectable: true,
    })),
  ]
}

/**
 * Build React Flow edges for ES connections.
 * Filters out any connection where the source or target node no longer exists,
 * which prevents orphaned arrows/labels from appearing after sticky deletions.
 */
export function buildESEdges(connections: ESConnection[], nodeIds: Set<string>): Edge[] {
  return connections
    .filter((conn) => nodeIds.has(conn.sourceId) && nodeIds.has(conn.targetId))
    .map((conn) => ({
      id: conn.id,
      source: conn.sourceId,
      target: conn.targetId,
      type: 'esConnection',
      data: { connection: conn },
      animated: false,
      zIndex: 12,
    }))
}
