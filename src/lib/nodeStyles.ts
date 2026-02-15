import type { ContextOwnership } from '../model/types'

type BoundaryIntegrity = 'strong' | 'moderate' | 'weak'

interface ContextStyleInput {
  boundaryIntegrity?: BoundaryIntegrity
  ownership?: ContextOwnership
}

interface BorderStyleResult {
  borderWidth: string
  borderStyle: string
  borderColor: string
  shadow: string
}

export function getContextNodeBorderStyle(
  context: ContextStyleInput,
  isDragOver: boolean,
  isHighlighted: boolean,
  isHovered: boolean,
): BorderStyleResult {
  const borderWidth =
    context.boundaryIntegrity === 'strong' ? '3px' :
    context.boundaryIntegrity === 'moderate' ? '2px' : '1.5px'

  const borderStyle =
    context.boundaryIntegrity === 'weak' ? 'dotted' : 'solid'

  const borderColor = isDragOver ? '#3b82f6'
    : isHighlighted ? '#3b82f6'
    : '#64748b'

  const externalRing = '0 0 0 2px white, 0 0 0 3px #64748b'

  const shadow = isDragOver
    ? '0 0 0 3px #3b82f6, 0 8px 16px -4px rgba(59, 130, 246, 0.3)'
    : isHighlighted
    ? '0 0 0 3px #3b82f6, 0 4px 12px -2px rgba(59, 130, 246, 0.25)'
    : isHovered
    ? context.ownership === 'external'
      ? `${externalRing}, 0 4px 8px -1px rgba(0, 0, 0, 0.12)`
      : '0 2px 8px -1px rgba(0, 0, 0, 0.15), 0 4px 12px -2px rgba(0, 0, 0, 0.08)'
    : context.ownership === 'external'
    ? `${externalRing}, 0 2px 6px 0 rgba(0, 0, 0, 0.06)`
    : '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'

  return { borderWidth, borderStyle, borderColor, shadow }
}

export function parseRgbColor(color: string): [number, number, number] {
  if (color.startsWith('rgba(') || color.startsWith('rgb(')) {
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
    if (match) {
      return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])]
    }
  }
  const r = parseInt(color.slice(1, 3), 16)
  const g = parseInt(color.slice(3, 5), 16)
  const b = parseInt(color.slice(5, 7), 16)
  return [r, g, b]
}
