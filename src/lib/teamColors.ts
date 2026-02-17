export interface TopologyColorSet {
  bg: string
  border: string
  text: string
}

interface TopologyColors {
  light: TopologyColorSet
  dark: TopologyColorSet
}

const TOPOLOGY_COLORS: Record<string, TopologyColors> = {
  'stream-aligned': {
    light: { bg: '#FFEDB8', border: '#FFD966', text: '#92600a' },
    dark: { bg: '#3d2e00', border: '#FFD966', text: '#FFE8A0' },
  },
  'platform': {
    light: { bg: '#B7CDF1', border: '#6D9EEB', text: '#1a4b8c' },
    dark: { bg: '#1a2a4a', border: '#6D9EEB', text: '#B7CDF1' },
  },
  'enabling': {
    light: { bg: '#DFBDCF', border: '#D09CB7', text: '#6b3a5c' },
    dark: { bg: '#3a2030', border: '#D09CB7', text: '#DFBDCF' },
  },
  'complicated-subsystem': {
    light: { bg: '#FFC08B', border: '#E88814', text: '#7c3a00' },
    dark: { bg: '#3d1e00', border: '#E88814', text: '#FFC08B' },
  },
  'unknown': {
    light: { bg: '#f8fafc', border: '#cbd5e1', text: '#475569' },
    dark: { bg: '#1e293b', border: '#475569', text: '#94a3b8' },
  },
}

export const TOPOLOGY_LABELS: Record<string, string> = {
  'stream-aligned': 'Stream',
  'platform': 'Platform',
  'enabling': 'Enabling',
  'complicated-subsystem': 'Subsystem',
}

export function getTopologyColors(type?: string): TopologyColors {
  return TOPOLOGY_COLORS[type ?? 'unknown'] ?? TOPOLOGY_COLORS['unknown']
}
