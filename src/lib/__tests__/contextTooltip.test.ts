import { describe, it, expect } from 'vitest'
import { getContextTooltipLines } from '../contextTooltip'
import type { BoundedContext, Relationship } from '../../model/types'

function makeContext(overrides: Partial<BoundedContext> = {}): BoundedContext {
  return {
    id: 'ctx-1',
    name: 'Order Processing',
    positions: {
      strategic: { x: 50 },
      flow: { x: 50 },
      distillation: { x: 50, y: 50 },
      shared: { y: 50 },
    },
    evolutionStage: 'custom-built',
    ...overrides,
  }
}

function makeRelationship(overrides: Partial<Relationship> = {}): Relationship {
  return {
    id: 'rel-1',
    fromContextId: 'ctx-1',
    toContextId: 'ctx-2',
    pattern: 'customer-supplier',
    ...overrides,
  }
}

const otherContexts: BoundedContext[] = [
  makeContext({ id: 'ctx-2', name: 'Billing' }),
  makeContext({ id: 'ctx-3', name: 'Shipping' }),
]

describe('getContextTooltipLines', () => {
  describe('flow view mode', () => {
    it('returns ownership line when colorByMode is ownership and ownership is unset', () => {
      const lines = getContextTooltipLines({
        context: makeContext(),
        viewMode: 'flow',
        colorByMode: 'ownership',
        relationships: [],
        contexts: [...otherContexts],
      })
      expect(lines).toContain('Click to set ownership')
    })

    it('returns ownership label when colorByMode is ownership and ownership is set', () => {
      const lines = getContextTooltipLines({
        context: makeContext({ ownership: 'ours' }),
        viewMode: 'flow',
        colorByMode: 'ownership',
        relationships: [],
        contexts: [],
      })
      expect(lines).toContain('Our Team (green) - you control the roadmap and priorities')
    })

    it('returns Internal (blue) for internal ownership', () => {
      const lines = getContextTooltipLines({
        context: makeContext({ ownership: 'internal' }),
        viewMode: 'flow',
        colorByMode: 'ownership',
        relationships: [],
        contexts: [],
      })
      expect(lines).toContain('Internal (blue) - another team owns this; coordination needed')
    })

    it('returns External (orange) for external ownership', () => {
      const lines = getContextTooltipLines({
        context: makeContext({ ownership: 'external' }),
        viewMode: 'flow',
        colorByMode: 'ownership',
        relationships: [],
        contexts: [],
      })
      expect(lines).toContain('External (orange) - third-party; limited ability to request changes')
    })

    it('omits ownership line when colorByMode is strategic', () => {
      const lines = getContextTooltipLines({
        context: makeContext({ ownership: 'ours' }),
        viewMode: 'flow',
        colorByMode: 'strategic',
        relationships: [],
        contexts: [],
      })
      expect(lines.some(l => l.includes('Our Team'))).toBe(false)
    })

    it('includes boundary integrity when set', () => {
      const lines = getContextTooltipLines({
        context: makeContext({ boundaryIntegrity: 'strong' }),
        viewMode: 'flow',
        colorByMode: 'strategic',
        relationships: [],
        contexts: [],
      })
      expect(lines).toContain('Strong boundary - clear API contracts, independently deployable')
    })

    it('includes moderate boundary', () => {
      const lines = getContextTooltipLines({
        context: makeContext({ boundaryIntegrity: 'moderate' }),
        viewMode: 'flow',
        colorByMode: 'strategic',
        relationships: [],
        contexts: [],
      })
      expect(lines).toContain('Moderate boundary - some shared dependencies, coordination needed')
    })

    it('includes weak boundary', () => {
      const lines = getContextTooltipLines({
        context: makeContext({ boundaryIntegrity: 'weak' }),
        viewMode: 'flow',
        colorByMode: 'strategic',
        relationships: [],
        contexts: [],
      })
      expect(lines).toContain('Weak boundary - significant coupling, changes ripple across contexts')
    })

    it('omits boundary when unset', () => {
      const lines = getContextTooltipLines({
        context: makeContext(),
        viewMode: 'flow',
        colorByMode: 'strategic',
        relationships: [],
        contexts: [],
      })
      expect(lines.some(l => l.includes('boundary'))).toBe(false)
    })

    it('includes issue count when issues exist', () => {
      const lines = getContextTooltipLines({
        context: makeContext({
          issues: [
            { id: '1', title: 'Bug', severity: 'critical' },
            { id: '2', title: 'Improvement', severity: 'info' },
            { id: '3', title: 'Alert', severity: 'warning' },
          ],
        }),
        viewMode: 'flow',
        colorByMode: 'strategic',
        relationships: [],
        contexts: [],
      })
      expect(lines).toContain('3 issues')
    })

    it('omits issue count when no issues', () => {
      const lines = getContextTooltipLines({
        context: makeContext(),
        viewMode: 'flow',
        colorByMode: 'strategic',
        relationships: [],
        contexts: [],
      })
      expect(lines.some(l => l.includes('issue'))).toBe(false)
    })

    it('includes connected context names when relationships exist', () => {
      const lines = getContextTooltipLines({
        context: makeContext({ id: 'ctx-1' }),
        viewMode: 'flow',
        colorByMode: 'strategic',
        relationships: [
          makeRelationship({ fromContextId: 'ctx-1', toContextId: 'ctx-2' }),
        ],
        contexts: otherContexts,
      })
      expect(lines).toContain('Connected to Billing')
    })

    it('lists multiple connected contexts', () => {
      const lines = getContextTooltipLines({
        context: makeContext({ id: 'ctx-1' }),
        viewMode: 'flow',
        colorByMode: 'strategic',
        relationships: [
          makeRelationship({ id: 'r1', fromContextId: 'ctx-1', toContextId: 'ctx-2' }),
          makeRelationship({ id: 'r2', fromContextId: 'ctx-3', toContextId: 'ctx-1' }),
        ],
        contexts: otherContexts,
      })
      expect(lines).toContain('Connected to Billing, Shipping')
    })

    it('omits connections line when no relationships', () => {
      const lines = getContextTooltipLines({
        context: makeContext(),
        viewMode: 'flow',
        colorByMode: 'strategic',
        relationships: [],
        contexts: [],
      })
      expect(lines.some(l => l.includes('Connected'))).toBe(false)
    })

    it('always includes drag guidance as last line', () => {
      const lines = getContextTooltipLines({
        context: makeContext(),
        viewMode: 'flow',
        colorByMode: 'strategic',
        relationships: [],
        contexts: [],
      })
      expect(lines[lines.length - 1]).toBe('Drag handles to connect to other contexts')
    })

    it('returns all lines for fully configured context', () => {
      const lines = getContextTooltipLines({
        context: makeContext({
          id: 'ctx-1',
          ownership: 'ours',
          boundaryIntegrity: 'strong',
          issues: [{ id: '1', title: 'Bug', severity: 'critical' }],
        }),
        viewMode: 'flow',
        colorByMode: 'ownership',
        relationships: [
          makeRelationship({ fromContextId: 'ctx-1', toContextId: 'ctx-2' }),
        ],
        contexts: otherContexts,
      })
      expect(lines).toEqual([
        'Our Team (green) - you control the roadmap and priorities',
        'Strong boundary - clear API contracts, independently deployable',
        '1 issues',
        'Connected to Billing',
        'Drag handles to connect to other contexts',
      ])
    })

    it('includes Big Ball of Mud line when isBigBallOfMud is true', () => {
      const lines = getContextTooltipLines({
        context: makeContext({ isBigBallOfMud: true }),
        viewMode: 'flow',
        colorByMode: 'strategic',
        relationships: [],
        contexts: [],
      })
      expect(lines).toContain('Big Ball of Mud - needs isolation or decomposition')
    })

    it('includes Legacy system line when isLegacy is true', () => {
      const lines = getContextTooltipLines({
        context: makeContext({ isLegacy: true }),
        viewMode: 'flow',
        colorByMode: 'strategic',
        relationships: [],
        contexts: [],
      })
      expect(lines).toContain('Legacy system')
    })

    it('returns minimal lines for unconfigured context', () => {
      const lines = getContextTooltipLines({
        context: makeContext(),
        viewMode: 'flow',
        colorByMode: 'strategic',
        relationships: [],
        contexts: [],
      })
      expect(lines).toEqual([
        'Drag handles to connect to other contexts',
      ])
    })
  })

  describe('distillation view mode', () => {
    it('shows drag instruction when unclassified', () => {
      const lines = getContextTooltipLines({
        context: makeContext(),
        viewMode: 'distillation',
        colorByMode: 'strategic',
        relationships: [],
        contexts: [],
      })
      expect(lines).toEqual([
        'Drag to classify as Core, Supporting, or Generic',
      ])
    })

    it('shows core description when classified as core', () => {
      const lines = getContextTooltipLines({
        context: makeContext({ strategicClassification: 'core' }),
        viewMode: 'distillation',
        colorByMode: 'strategic',
        relationships: [],
        contexts: [],
      })
      expect(lines).toEqual([
        'Core Domain - your primary competitive advantage',
      ])
    })

    it('shows supporting description when classified as supporting', () => {
      const lines = getContextTooltipLines({
        context: makeContext({ strategicClassification: 'supporting' }),
        viewMode: 'distillation',
        colorByMode: 'strategic',
        relationships: [],
        contexts: [],
      })
      expect(lines).toEqual([
        'Supporting - necessary but not a differentiator',
      ])
    })

    it('shows generic description when classified as generic', () => {
      const lines = getContextTooltipLines({
        context: makeContext({ strategicClassification: 'generic' }),
        viewMode: 'distillation',
        colorByMode: 'strategic',
        relationships: [],
        contexts: [],
      })
      expect(lines).toEqual([
        'Generic - buy or use open source',
      ])
    })
  })

  describe('strategic view mode', () => {
    it('shows summary of all configured properties', () => {
      const lines = getContextTooltipLines({
        context: makeContext({
          strategicClassification: 'core',
          ownership: 'ours',
          boundaryIntegrity: 'strong',
        }),
        viewMode: 'strategic',
        colorByMode: 'strategic',
        relationships: [],
        contexts: [],
      })
      expect(lines).toEqual(['Core Domain | Our Team | Strong boundary - clear API contracts, independently deployable'])
    })

    it('omits unset properties from summary', () => {
      const lines = getContextTooltipLines({
        context: makeContext({
          strategicClassification: 'supporting',
        }),
        viewMode: 'strategic',
        colorByMode: 'strategic',
        relationships: [],
        contexts: [],
      })
      expect(lines).toEqual(['Supporting'])
    })

    it('includes issue count on separate line', () => {
      const lines = getContextTooltipLines({
        context: makeContext({
          strategicClassification: 'core',
          issues: [
            { id: '1', title: 'Bug', severity: 'critical' },
            { id: '2', title: 'Note', severity: 'info' },
          ],
        }),
        viewMode: 'strategic',
        colorByMode: 'strategic',
        relationships: [],
        contexts: [],
      })
      expect(lines).toEqual(['Core Domain', '2 issues'])
    })

    it('returns empty array for fully unconfigured context with no issues', () => {
      const lines = getContextTooltipLines({
        context: makeContext(),
        viewMode: 'strategic',
        colorByMode: 'strategic',
        relationships: [],
        contexts: [],
      })
      expect(lines).toEqual([])
    })

    it('shows only ownership when only ownership is set', () => {
      const lines = getContextTooltipLines({
        context: makeContext({ ownership: 'external' }),
        viewMode: 'strategic',
        colorByMode: 'strategic',
        relationships: [],
        contexts: [],
      })
      expect(lines).toEqual(['External'])
    })

    it('includes Big Ball of Mud line in strategic view', () => {
      const lines = getContextTooltipLines({
        context: makeContext({ isBigBallOfMud: true }),
        viewMode: 'strategic',
        colorByMode: 'strategic',
        relationships: [],
        contexts: [],
      })
      expect(lines).toContain('Big Ball of Mud - needs isolation or decomposition')
    })

    it('shows only boundary when only boundary is set', () => {
      const lines = getContextTooltipLines({
        context: makeContext({ boundaryIntegrity: 'weak' }),
        viewMode: 'strategic',
        colorByMode: 'strategic',
        relationships: [],
        contexts: [],
      })
      expect(lines).toEqual(['Weak boundary - significant coupling, changes ripple across contexts'])
    })
  })
})
