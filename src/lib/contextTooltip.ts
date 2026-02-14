import type { BoundedContext, Relationship } from '../model/types'

interface TooltipParams {
  context: BoundedContext
  viewMode: 'flow' | 'strategic' | 'distillation'
  colorByMode: 'strategic' | 'ownership'
  relationships: Relationship[]
  contexts: BoundedContext[]
}

const OWNERSHIP_LABELS: Record<string, string> = {
  ours: 'Our Team (green)',
  internal: 'Internal (blue)',
  external: 'External (orange)',
}

const BOUNDARY_LABELS: Record<string, string> = {
  strong: 'Strong boundary',
  moderate: 'Moderate boundary',
  weak: 'Weak boundary',
}

const CLASSIFICATION_LABELS: Record<string, string> = {
  core: 'Core Domain',
  supporting: 'Supporting',
  generic: 'Generic',
}

const DISTILLATION_DESCRIPTIONS: Record<string, string> = {
  core: 'Core Domain - your primary competitive advantage',
  supporting: 'Supporting - necessary but not a differentiator',
  generic: 'Generic - buy or use open source',
}

function getConnectedContextNames(
  contextId: string,
  relationships: Relationship[],
  contexts: BoundedContext[],
): string[] {
  const connectedIds = new Set<string>()
  for (const rel of relationships) {
    if (rel.fromContextId === contextId) connectedIds.add(rel.toContextId)
    if (rel.toContextId === contextId) connectedIds.add(rel.fromContextId)
  }
  const names: string[] = []
  for (const ctx of contexts) {
    if (connectedIds.has(ctx.id)) names.push(ctx.name)
  }
  return names
}

function getFlowLines(params: TooltipParams): string[] {
  const { context, colorByMode, relationships, contexts } = params
  const lines: string[] = []

  if (colorByMode === 'ownership') {
    if (context.ownership) {
      lines.push(OWNERSHIP_LABELS[context.ownership])
    } else {
      lines.push('Click to set ownership')
    }
  }

  if (context.boundaryIntegrity) {
    lines.push(BOUNDARY_LABELS[context.boundaryIntegrity])
  }

  if (context.issues && context.issues.length > 0) {
    lines.push(`${context.issues.length} issues`)
  }

  const connectedNames = getConnectedContextNames(context.id, relationships, contexts)
  if (connectedNames.length > 0) {
    lines.push(`Connected to ${connectedNames.join(', ')}`)
  }

  lines.push('Drag handles to connect to other contexts')

  return lines
}

function getDistillationLines(params: TooltipParams): string[] {
  const { context } = params
  if (!context.strategicClassification) {
    return ['Drag to classify as Core, Supporting, or Generic']
  }
  return [DISTILLATION_DESCRIPTIONS[context.strategicClassification]]
}

function getStrategicLines(params: TooltipParams): string[] {
  const { context } = params
  const parts: string[] = []

  if (context.strategicClassification) {
    parts.push(CLASSIFICATION_LABELS[context.strategicClassification])
  }

  if (context.ownership) {
    const ownershipSummary: Record<string, string> = {
      ours: 'Our Team',
      internal: 'Internal',
      external: 'External',
    }
    parts.push(ownershipSummary[context.ownership])
  }

  if (context.boundaryIntegrity) {
    parts.push(BOUNDARY_LABELS[context.boundaryIntegrity])
  }

  const lines: string[] = []
  if (parts.length > 0) {
    lines.push(parts.join(' | '))
  }

  if (context.issues && context.issues.length > 0) {
    lines.push(`${context.issues.length} issues`)
  }

  return lines
}

export function getContextTooltipLines(params: TooltipParams): string[] {
  switch (params.viewMode) {
    case 'flow':
      return getFlowLines(params)
    case 'distillation':
      return getDistillationLines(params)
    case 'strategic':
      return getStrategicLines(params)
  }
}
