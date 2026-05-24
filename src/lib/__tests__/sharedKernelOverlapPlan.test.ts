import { describe, it, expect } from 'vitest'
import {
  computeSharedKernelPlan,
  computeSharedKernelSeparations,
  describeRelationshipForConversionPrompt,
  findOverlappingContextIds,
  type ContextBox,
} from '../sharedKernelOverlapPlan'
import type { Relationship } from '../../model/types'

function box(x: number, y: number, width = 100, height = 100) {
  return { x, y, width, height }
}

function makeRel(
  id: string,
  from: string,
  to: string,
  pattern?: Relationship['pattern'],
  extras: Partial<Relationship> = {}
): Relationship {
  return { id, fromContextId: from, toContextId: to, pattern, ...extras }
}

describe('computeSharedKernelPlan', () => {
  it('plans a create when dragged context newly overlaps another with no existing relationship', () => {
    const others: ContextBox[] = [{ id: 'ctx-b', box: box(50, 50) }]
    const plan = computeSharedKernelPlan('ctx-a', box(0, 0), others, [], new Set())

    expect(plan.toCreate).toEqual(['ctx-b'])
    expect(plan.toConvert).toEqual([])
  })

  it('plans a convert when dragged context newly overlaps another with an existing non-SK relationship', () => {
    const others: ContextBox[] = [{ id: 'ctx-b', box: box(50, 50) }]
    const relationships = [makeRel('rel-1', 'ctx-a', 'ctx-b', 'customer-supplier')]

    const plan = computeSharedKernelPlan('ctx-a', box(0, 0), others, relationships, new Set())

    expect(plan.toCreate).toEqual([])
    expect(plan.toConvert).toEqual([{ otherContextId: 'ctx-b', relationshipId: 'rel-1' }])
  })

  it('finds the existing relationship regardless of from/to direction', () => {
    const others: ContextBox[] = [{ id: 'ctx-b', box: box(50, 50) }]
    const relationships = [makeRel('rel-1', 'ctx-b', 'ctx-a', 'partnership')]

    const plan = computeSharedKernelPlan('ctx-a', box(0, 0), others, relationships, new Set())

    expect(plan.toConvert).toEqual([{ otherContextId: 'ctx-b', relationshipId: 'rel-1' }])
  })

  it('plans nothing when the dragged context already overlapped the other at drag start', () => {
    const others: ContextBox[] = [{ id: 'ctx-b', box: box(50, 50) }]

    const plan = computeSharedKernelPlan('ctx-a', box(0, 0), others, [], new Set(['ctx-b']))

    expect(plan.toCreate).toEqual([])
    expect(plan.toConvert).toEqual([])
  })

  it('plans nothing when there is no overlap', () => {
    const others: ContextBox[] = [{ id: 'ctx-b', box: box(500, 500) }]

    const plan = computeSharedKernelPlan('ctx-a', box(0, 0), others, [], new Set())

    expect(plan.toCreate).toEqual([])
    expect(plan.toConvert).toEqual([])
  })

  it('plans nothing when an existing SK relationship is preserved (overlap continues from before)', () => {
    const others: ContextBox[] = [{ id: 'ctx-b', box: box(50, 50) }]
    const relationships = [makeRel('rel-1', 'ctx-a', 'ctx-b', 'shared-kernel')]

    const plan = computeSharedKernelPlan(
      'ctx-a',
      box(0, 0),
      others,
      relationships,
      new Set(['ctx-b'])
    )

    expect(plan.toCreate).toEqual([])
    expect(plan.toConvert).toEqual([])
  })

  it('does not plan a create when an existing SK becomes newly detected (edge case: SK without prior overlap)', () => {
    const others: ContextBox[] = [{ id: 'ctx-b', box: box(50, 50) }]
    const relationships = [makeRel('rel-1', 'ctx-a', 'ctx-b', 'shared-kernel')]

    const plan = computeSharedKernelPlan('ctx-a', box(0, 0), others, relationships, new Set())

    expect(plan.toCreate).toEqual([])
    expect(plan.toConvert).toEqual([])
  })

  it('handles multiple new overlaps in a single drag (creates and converts together)', () => {
    const others: ContextBox[] = [
      { id: 'ctx-b', box: box(50, 50) },
      { id: 'ctx-c', box: box(70, 70) },
    ]
    const relationships = [makeRel('rel-existing', 'ctx-a', 'ctx-c', 'partnership')]

    const plan = computeSharedKernelPlan('ctx-a', box(0, 0), others, relationships, new Set())

    expect(plan.toCreate).toEqual(['ctx-b'])
    expect(plan.toConvert).toEqual([{ otherContextId: 'ctx-c', relationshipId: 'rel-existing' }])
  })

  it('skips the dragged context itself if accidentally included in others list', () => {
    const others: ContextBox[] = [
      { id: 'ctx-a', box: box(0, 0) },
      { id: 'ctx-b', box: box(50, 50) },
    ]
    const plan = computeSharedKernelPlan('ctx-a', box(0, 0), others, [], new Set())
    expect(plan.toCreate).toEqual(['ctx-b'])
  })

  it('creates an independent second SK when dragged context already has an SK with a different context', () => {
    const others: ContextBox[] = [
      { id: 'ctx-b', box: box(50, 50) },
      { id: 'ctx-c', box: box(70, 70) },
    ]
    const relationships = [makeRel('rel-ab', 'ctx-a', 'ctx-b', 'shared-kernel')]

    const plan = computeSharedKernelPlan(
      'ctx-a',
      box(0, 0),
      others,
      relationships,
      new Set(['ctx-b'])
    )

    expect(plan.toCreate).toEqual(['ctx-c'])
    expect(plan.toConvert).toEqual([])
  })
})

describe('computeSharedKernelSeparations', () => {
  it('returns a separation when SK contexts no longer overlap after drag', () => {
    const others: ContextBox[] = [{ id: 'ctx-b', box: box(500, 500) }]
    const relationships = [makeRel('rel-1', 'ctx-a', 'ctx-b', 'shared-kernel')]

    const result = computeSharedKernelSeparations(
      'ctx-a',
      box(0, 0),
      others,
      relationships,
      new Set(['ctx-b'])
    )

    expect(result).toEqual([{ otherContextId: 'ctx-b', relationshipId: 'rel-1' }])
  })

  it('returns nothing when SK contexts still overlap after drag', () => {
    const others: ContextBox[] = [{ id: 'ctx-b', box: box(50, 50) }]
    const relationships = [makeRel('rel-1', 'ctx-a', 'ctx-b', 'shared-kernel')]

    const result = computeSharedKernelSeparations(
      'ctx-a',
      box(0, 0),
      others,
      relationships,
      new Set(['ctx-b'])
    )

    expect(result).toEqual([])
  })

  it('returns nothing when the previously overlapping context has no SK relationship with the dragged one', () => {
    const others: ContextBox[] = [{ id: 'ctx-b', box: box(500, 500) }]
    const relationships = [makeRel('rel-1', 'ctx-a', 'ctx-b', 'customer-supplier')]

    const result = computeSharedKernelSeparations(
      'ctx-a',
      box(0, 0),
      others,
      relationships,
      new Set(['ctx-b'])
    )

    expect(result).toEqual([])
  })

  it('returns nothing when the previously overlapping context had no relationship at all', () => {
    const others: ContextBox[] = [{ id: 'ctx-b', box: box(500, 500) }]

    const result = computeSharedKernelSeparations(
      'ctx-a',
      box(0, 0),
      others,
      [],
      new Set(['ctx-b'])
    )

    expect(result).toEqual([])
  })

  it('detects SK in either direction (from/to symmetric)', () => {
    const others: ContextBox[] = [{ id: 'ctx-b', box: box(500, 500) }]
    const relationships = [makeRel('rel-1', 'ctx-b', 'ctx-a', 'shared-kernel')]

    const result = computeSharedKernelSeparations(
      'ctx-a',
      box(0, 0),
      others,
      relationships,
      new Set(['ctx-b'])
    )

    expect(result).toEqual([{ otherContextId: 'ctx-b', relationshipId: 'rel-1' }])
  })

  it('handles multiple SK separations from a single drag', () => {
    const others: ContextBox[] = [
      { id: 'ctx-b', box: box(500, 500) },
      { id: 'ctx-c', box: box(800, 800) },
    ]
    const relationships = [
      makeRel('rel-1', 'ctx-a', 'ctx-b', 'shared-kernel'),
      makeRel('rel-2', 'ctx-a', 'ctx-c', 'shared-kernel'),
    ]

    const result = computeSharedKernelSeparations(
      'ctx-a',
      box(0, 0),
      others,
      relationships,
      new Set(['ctx-b', 'ctx-c'])
    )

    expect(result).toEqual([
      { otherContextId: 'ctx-b', relationshipId: 'rel-1' },
      { otherContextId: 'ctx-c', relationshipId: 'rel-2' },
    ])
  })

  it('ignores previously overlapping contexts that no longer exist in others list', () => {
    const result = computeSharedKernelSeparations(
      'ctx-a',
      box(0, 0),
      [],
      [makeRel('rel-1', 'ctx-a', 'ctx-b', 'shared-kernel')],
      new Set(['ctx-b'])
    )

    expect(result).toEqual([])
  })
})

describe('findOverlappingContextIds', () => {
  it('returns ids of all contexts overlapping the target', () => {
    const others: ContextBox[] = [
      { id: 'ctx-b', box: box(50, 50) },
      { id: 'ctx-c', box: box(500, 500) },
    ]
    expect(findOverlappingContextIds('ctx-a', box(0, 0), others)).toEqual(new Set(['ctx-b']))
  })

  it('excludes the target id even if its own box is in the list', () => {
    const others: ContextBox[] = [{ id: 'ctx-a', box: box(0, 0) }]
    expect(findOverlappingContextIds('ctx-a', box(0, 0), others)).toEqual(new Set())
  })
})

describe('describeRelationshipForConversionPrompt', () => {
  it('returns the pattern label when pattern is set', () => {
    expect(
      describeRelationshipForConversionPrompt(makeRel('r', 'a', 'b', 'customer-supplier'))
    ).toBe('Customer-Supplier')
    expect(describeRelationshipForConversionPrompt(makeRel('r', 'a', 'b', 'partnership'))).toBe(
      'Partnership'
    )
  })

  it('returns the role label when only one per-side role is set', () => {
    expect(
      describeRelationshipForConversionPrompt(
        makeRel('r', 'a', 'b', undefined, { upstreamRole: 'open-host-service' })
      )
    ).toBe('Open Host Service')
    expect(
      describeRelationshipForConversionPrompt(
        makeRel('r', 'a', 'b', undefined, { downstreamRole: 'anti-corruption-layer' })
      )
    ).toBe('Anti-Corruption Layer')
  })

  it('joins both per-side role labels when both are set', () => {
    expect(
      describeRelationshipForConversionPrompt(
        makeRel('r', 'a', 'b', undefined, {
          upstreamRole: 'open-host-service',
          downstreamRole: 'conformist',
        })
      )
    ).toBe('Open Host Service / Conformist')
  })

  it('falls back to "existing" when neither pattern nor roles are set', () => {
    expect(describeRelationshipForConversionPrompt(makeRel('r', 'a', 'b'))).toBe('existing')
  })
})
