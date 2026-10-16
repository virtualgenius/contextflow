import { describe, it, expect } from 'vitest'
import { contrastRatio, WCAG_AA_NORMAL_TEXT } from '../colorContrast'
import { getTopologyColors } from '../teamColors'
import { OWNERSHIP_FILL_COLORS } from '../nodeStyles'
import { SEVERITY_COLORS, ISSUE_LABEL_STYLES } from '../issueColors'
import { PATTERN_EDGE_INDICATORS } from '../canvasConstants'

// Every hand-picked text/background pair in the canvas palette is registered
// here. Decorative borders are not: WCAG 1.4.11 covers only non-text elements
// needed to understand the content, and the label text already carries it.
// Rendered output (Tailwind classes, dark mode) is covered by
// scripts/check-contrast.mjs, which runs axe in a real browser.

interface Pair {
  name: string
  fg: string
  bg: string
  threshold: number
}

const TOPOLOGY_TYPES = [
  'stream-aligned',
  'platform',
  'enabling',
  'complicated-subsystem',
  'unknown',
]
const NODE_TITLE_TEXT_LIGHT = '#1e293b' // slate-800, ContextNode title
const PILL_BACKGROUND = '#ffffff' // IssueCounterPill, white at 0.85 over light fills

function topologyPairs(): Pair[] {
  return TOPOLOGY_TYPES.flatMap((type) => {
    const colors = getTopologyColors(type)
    return (['light', 'dark'] as const).map((mode) => ({
      name: `team badge ${type} (${mode})`,
      fg: colors[mode].text,
      bg: colors[mode].bg,
      threshold: WCAG_AA_NORMAL_TEXT,
    }))
  })
}

function ownershipPairs(): Pair[] {
  return Object.entries(OWNERSHIP_FILL_COLORS).map(([ownership, fill]) => ({
    name: `context title on ${ownership} fill`,
    fg: NODE_TITLE_TEXT_LIGHT,
    bg: fill,
    threshold: WCAG_AA_NORMAL_TEXT,
  }))
}

function issuePairs(): Pair[] {
  const labels = Object.entries(ISSUE_LABEL_STYLES).map(([severity, s]) => ({
    name: `issue label ${severity}`,
    fg: s.text,
    bg: s.bg,
    threshold: WCAG_AA_NORMAL_TEXT,
  }))
  const pills = Object.entries(SEVERITY_COLORS).map(([severity, color]) => ({
    name: `issue counter ${severity}`,
    fg: color,
    bg: PILL_BACKGROUND,
    threshold: WCAG_AA_NORMAL_TEXT,
  }))
  return [...labels, ...pills]
}

function edgeIndicatorPairs(): Pair[] {
  return Object.entries(PATTERN_EDGE_INDICATORS).map(([role, config]) => ({
    name: `edge indicator ${config.label} (${role})`,
    fg: config.colors.text,
    bg: config.colors.bg,
    threshold: WCAG_AA_NORMAL_TEXT,
  }))
}

const PAIRS: Pair[] = [
  ...topologyPairs(),
  ...ownershipPairs(),
  ...issuePairs(),
  ...edgeIndicatorPairs(),
]

describe('canvas palette meets WCAG AA', () => {
  it.each(PAIRS.map((p) => [p.name, p]))('%s', (_name, pair) => {
    const ratio = contrastRatio(pair.fg, pair.bg)
    expect(
      ratio,
      `${pair.fg} on ${pair.bg} is ${ratio.toFixed(2)}:1, needs ${pair.threshold}:1`
    ).toBeGreaterThanOrEqual(pair.threshold)
  })
})
