import type { Relationship } from '../model/types'

// Node size mapping
export const NODE_SIZES = {
  tiny: { width: 120, height: 70 },
  small: { width: 140, height: 80 },
  medium: { width: 170, height: 100 },
  large: { width: 200, height: 150 },
  huge: { width: 240, height: 240 },
}

// Edge styling constants
export const EDGE_HIT_AREA_WIDTH = 20
export const EDGE_STROKE_WIDTH = { default: 1.5, hover: 2, selected: 2.5 }
export const EDGE_TRANSITION = 'var(--edge-transition)' // CSS variable toggled during drag
export const EDGE_DASH_ARRAY = '5,5'

// Pattern indicator configuration for ACL/OHS boxes on edges
type PatternIndicatorConfig = {
  label: string
  position: 'source' | 'target' // source = downstream, target = upstream
  boxWidth: number
  boxHeight: number
  colors: {
    bg: string
    border: string
    text: string
    bgDark: string
    borderDark: string
    textDark: string
  }
}

export const PATTERN_EDGE_INDICATORS: Partial<
  Record<Relationship['pattern'], PatternIndicatorConfig>
> = {
  'anti-corruption-layer': {
    label: 'ACL',
    position: 'source', // downstream end
    boxWidth: 28,
    boxHeight: 18,
    colors: {
      bg: '#fef3c7', // amber-100
      border: '#f59e0b', // amber-500
      text: '#d97706', // amber-600
      bgDark: 'rgba(146, 64, 14, 0.4)',
      borderDark: '#fbbf24',
      textDark: '#fbbf24',
    },
  },
  'open-host-service': {
    label: 'OHS',
    position: 'target', // upstream end
    boxWidth: 28,
    boxHeight: 18,
    colors: {
      bg: '#dcfce7', // green-100
      border: '#22c55e', // green-500
      text: '#16a34a', // green-600
      bgDark: 'rgba(20, 83, 45, 0.4)',
      borderDark: '#4ade80',
      textDark: '#4ade80',
    },
  },
}
