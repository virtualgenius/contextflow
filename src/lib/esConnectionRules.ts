import type { ESStickyType } from '../components/nodes/ESStickyNode'

// Valid connections in Big Picture Event Storming
//
// Core flow:  Command -> Aggregate -> Domain Event -> Policy -> Command
// Shortcut:   Domain Event -> Command (when no explicit policy)
// HotSpot:    can attach to anything

// Each entry is a specific from->to pair with its label
const VALID_CONNECTIONS: { from: ESStickyType; to: ESStickyType; label: string }[] = [
  { from: 'command', to: 'aggregate', label: 'acts on' },
  { from: 'aggregate', to: 'domainEvent', label: 'produces' },
  { from: 'domainEvent', to: 'policy', label: 'triggers' },
  { from: 'domainEvent', to: 'command', label: 'triggers' },
  { from: 'domainEvent', to: 'aggregate', label: 'updates' },
  { from: 'policy', to: 'command', label: 'issues' },
  // HotSpot can connect to anything
  { from: 'hotSpot', to: 'domainEvent', label: '' },
  { from: 'hotSpot', to: 'command', label: '' },
  { from: 'hotSpot', to: 'aggregate', label: '' },
  { from: 'hotSpot', to: 'policy', label: '' },
  { from: 'hotSpot', to: 'hotSpot', label: '' },
]

/**
 * Get the valid target sticky types for a given source type.
 */
export function getValidTargets(sourceType: ESStickyType): ESStickyType[] {
  return [...new Set(VALID_CONNECTIONS.filter((c) => c.from === sourceType).map((c) => c.to))]
}

/**
 * Check if a connection between two sticky types is valid.
 */
export function isValidESConnection(sourceType: ESStickyType, targetType: ESStickyType): boolean {
  return VALID_CONNECTIONS.some((c) => c.from === sourceType && c.to === targetType)
}

/**
 * Get the label for a specific connection pair.
 */
export function getConnectionLabel(
  sourceType: ESStickyType,
  targetType: ESStickyType
): string | undefined {
  const conn = VALID_CONNECTIONS.find((c) => c.from === sourceType && c.to === targetType)
  return conn?.label || undefined
}

/**
 * Get human-readable names for valid targets (for UI hints).
 */
export function getValidTargetLabels(sourceType: ESStickyType): string[] {
  const targets = getValidTargets(sourceType)
  const labelMap: Record<ESStickyType, string> = {
    domainEvent: 'Domain Event',
    command: 'Command',
    aggregate: 'Aggregate',
    policy: 'Policy',
    hotSpot: 'Hot Spot',
  }
  return targets.map((t) => labelMap[t])
}
