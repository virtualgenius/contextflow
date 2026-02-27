# Mutation Testing - Session Report

Date: 2026-02-27

## Progress Summary

| Metric | Start of session | End of session | Delta |
|--------|-----------------|----------------|-------|
| Overall mutation score | 51.30% | 84.0% | +32.7pp |
| Covered code score | ~82% | 95.4% | +13.4pp |
| Total survivors | ~100+ | 54 | -50%+ |
| Tests | 1434 | 1468 | +34 |

### Files at 100% mutation score

| File | When achieved |
|------|--------------|
| userMutations.ts | Round 2 |
| userNeedMutations.ts | Round 2 |
| connectionMutations.ts | Round 2 |
| projectMutations.ts | Already 100% |
| undoManager.ts | Already 100% |
| metadataMutations.ts | Round 5 |

### Per-file progression

| File | Round 1 | Final | Survivors |
|------|---------|-------|-----------|
| connectionMutations.ts | 100% | 100% | 0 |
| metadataMutations.ts | 96.99% | 100% | 0 |
| userMutations.ts | 100% | 100% | 0 |
| userNeedMutations.ts | 100% | 100% | 0 |
| projectMutations.ts | 100% | 100% | 0 |
| undoManager.ts | 100% | 100% | 0 |
| projectSync.ts | 98.67% | 98.67% | 0 (1 no-cov) |
| contextSync.ts | 94.68% | 94.68% | 5 |
| keyframeMutations.ts | 91.80% | 93.44% | 4 |
| contextMutations.ts | 68.33% | 68.33% | 6 |
| flowMutations.ts | 86.05% | 86.05% | 6 |
| groupMutations.ts | 93.65% | 93.65% | 4 |
| relationshipMutations.ts | 94.12% | 94.12% | 2 |

## What we fixed

### Infrastructure (before mutation testing could run)
- Vitest 4 incompatible with Stryker's sandbox mechanism (ERR_LOAD_URL)
- Workaround: `npm run mutate` swaps to Vitest 3.2.4 during runs, restores 4.0.6 after
- Fixed test file exclusion: `--mutate` CLI flag overrides config's exclusion patterns
- Result: 49 files/7820 mutants -> 23 files/1721 mutants (noise eliminated)

### Round 1: First `if (field in updates)` survivors (6 tests added)
Across userMutations, userNeedMutations, contextMutations, groupMutations, relationshipMutations, flowMutations. Each test updates one field and verifies another field isn't clobbered.

### Round 2: Category 1 remaining `if (field in updates)` guards (9 tests added)
- connectionMutations: notes guards for both connection types
- keyframeMutations: date/label cross-preservation
- metadataMutations: Team, Repo, Person field guards
- contextMutations: codeSize guard

### Round 3: Category C cascade and remaining guards (7 tests added)
- Cascade selectivity: deleteTeam preserves other teams' contextIds, deletePerson preserves other contributors
- Clobber tests rewritten to EXCLUDE the guarded field (not include it)

### Key lesson learned
To kill `if ('field' in updates)` -> `if (true)`, the test must update WITHOUT that specific field and verify it's preserved. A test that includes the field passes regardless of whether the guard exists.

## Remaining 54 Survivors (categorized)

### Category A: `findXxxById` index guards - equivalent mutations (13 survivors)

These return null/early-return when entity not found. Stryker replaces the guard with `false`, but `yArray.get(-1)` returns undefined which is also falsy, so behavior is identical. Unkillable without changing the production code.

- `contextMutations.ts:80` - `findContextById` (2 survivors)
- `groupMutations.ts:92` - `findGroupById` (2 survivors)
- `relationshipMutations.ts:42` - `findRelationshipById` (2 survivors)
- `keyframeMutations.ts:68` - `findKeyframeById` (1 survivor)
- `flowMutations.ts:43` - `findStageByIndex` bounds check (5 survivors)
- `flowMutations.ts:33` - `deleteFlowStageMutation` bounds check: `>=` to `>` (1 survivor)

### Category B: Cascade delete loop arithmetic - equivalent mutations (4 survivors)

In `contextMutations.ts` cascade functions, `length - 1` becomes `length + 1`. Since Yjs arrays handle out-of-bounds gracefully, these are effectively equivalent.

- `contextMutations.ts:148` - `cascadeClearRepoContextIds` loop guard
- `contextMutations.ts:158` - `cascadeRemoveFromGroups` inner loop
- `contextMutations.ts:177` - `cascadeRemoveFromTemporalKeyframes` guard
- `contextMutations.ts:187` - temporal keyframes inner loop

### Category C: Remaining equivalent mutations (2 survivors)

- `keyframeMutations.ts:51` - `if (!yPos)` -> `if (true)`: always creates new Y.Map, but x/y set immediately after, so result is identical
- `groupMutations.ts:66` - duplicate guard in `addContextsToGroupMutation`

### Category D: StringLiteral `""` mutations on Yjs map key names (11 survivors)

Stryker replaces `'project'`, `'contexts'`, etc. with `""`. These survive because Yjs silently creates new empty maps for unknown keys.

- `contextSync.ts:14`
- `flowSync.ts:14`
- `groupSync.ts:17`
- `metadataSync.ts:26,89,129`
- `relationshipSync.ts:15`
- `strategicSync.ts:20,55,89,118,159`

### Category E: No test coverage - hooks/store glue (16 survivors)

Would require integration tests with React hooks and WebSocket providers.

- `syncManager.ts` (4 survivors) - WebSocket/provider glue
- `useCollabMode.ts` (9 survivors) - React hook wrappers
- `useCollabStore.ts` (3 survivors) - store delegation layer

### Category F: Sync function guards (4 survivors)

Optional field presence checks during deserialization.

- `contextSync.ts:107,145,148,165`

### Category G: Keyframe init defaults (4 survivors)

String/boolean literals in `getOrCreateTemporalMap` and `groupMutations` loop bounds.

- `keyframeMutations.ts:78` - StringLiteral/BooleanLiteral in toggle init
- `groupMutations.ts:111` - loop bounds `<=` equivalent
