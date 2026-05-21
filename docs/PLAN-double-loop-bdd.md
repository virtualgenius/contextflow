# Plan: Double-Loop BDD for Two-Sided Relationships

Applies the double-loop BDD approach (Searls' "dual-loop") to issue #13 using Vitest only, no Cucumber. The outer loop uses integration tests with `tableData` example tables; the inner loop uses standard red-green-refactor TDD.

Reference: [Dual-Loop BDD is the New Red-Green TDD](../../resources/notes/Dual-Loop%20BDD%20is%20the%20New%20Red-Green%20TDD%20-%20Justin%20Searls.md)

## Approach

### Outer Loop: Behavioral Integration Tests

Integration tests describe observable behavior through realistic, table-driven business examples. They exercise the full stack: store action -> collab mutation -> Yjs -> state update.

**Conventions:**
- File location: `src/__integration__/two-sided-relationships.integration.test.ts`
- `describe('Rule: ...')` names the business rule being specified
- `tableData()` tables provide the examples, with a **Reason** column explaining each row
- Column values use real domain slugs (`open-host-service`, not `OHS`) for ubiquitous language
- Empty cells become `undefined`, mapping naturally to "not yet characterized"
- Tests run through the Zustand store with collab mode initialized (same setup as `store.relationships.test.ts`)

**Loop discipline:**
1. Write one failing outer-loop test (a `describe('Rule: ...')` block with `tableData` examples)
2. Verify it fails for the right reason (missing type, missing method, wrong behavior)
3. Drop to inner loop: TDD the pieces needed to make it pass
4. Return to outer loop: run the integration test, confirm it passes
5. Refactor across modules if needed (outer test protects you)
6. Next rule

### Inner Loop: Unit TDD

Standard red-green-refactor on pure functions and sync layer. Co-located tests or `__tests__/` directories, following existing project patterns.

### Test Infrastructure

**`src/test/tableData.ts`** - Markdown table parser. Parses pipe-delimited tables into typed object arrays with smart type conversion (numbers, booleans, undefined for empty cells).

**`src/test/tableData.test.ts`** - Tests for the utility itself.

## Scope

Phase 1 of the two-sided relationships plan (Slices 1-6). Phase 2 (migration) is a separate effort.

Before starting, answer Outstanding Question #1 from the plan: Separate Ways relationships convert to blank relationships with a description note on migration. This is the safest option (no data loss, consistent with the "neither side characterized" valid state).

## Outer-Loop Scenarios

### Scenario 1: Valid Per-Side Combinations

```
Rule: upstream and downstream roles combine freely

  | Upstream           | Downstream            | Reason                                                          |
  | open-host-service  | conformist            | downstream adopts a general-purpose API as-is                   |
  | open-host-service  | anti-corruption-layer | downstream translates despite the general API                   |
  | open-host-service  |                       | upstream characterized, downstream not yet decided              |
  | published-language | conformist            | Evans' NAICS example: downstream adopts standard as-is          |
  | published-language | anti-corruption-layer | downstream translates from a published standard                 |
  | published-language |                       | upstream characterized, downstream not yet decided              |
  |                    | conformist            | downstream capitulates, upstream not yet characterized          |
  |                    | anti-corruption-layer | downstream protects itself, upstream not yet characterized      |
  |                    |                       | relationship exists, neither side characterized yet             |
```

**Outer-loop test:** For each row, create a relationship through the store with the given roles, read it back from state, and verify the roles persisted correctly. Then verify Yjs round-trip: the relationship survives `projectToYDoc` -> `yDocToProject` with roles intact.

**Inner-loop work needed:**
- Add `upstreamRole` and `downstreamRole` to `Relationship` type
- Add fields to Yjs schema and sync functions
- Update store `addRelationship` and `updateRelationship` to accept role fields

### Scenario 2: Valid Standalone Patterns

```
Rule: standalone patterns describe the complete relationship without per-side roles

  | Pattern           | Has Direction | Reason                                                                 |
  | customer-supplier | true          | upstream chooses to accommodate downstream; directed authority          |
  | partnership       | false         | mutual dependency; teams coordinate as equals, no authority direction   |
  | shared-kernel     | false         | joint ownership of shared model; neither side has authority over it     |
```

**Outer-loop test:** For each row, create a relationship through the store with the given standalone pattern. Verify `upstreamRole` and `downstreamRole` are both undefined. Verify it round-trips through Yjs. Verify `Has Direction` matches whether the pattern distinguishes upstream from downstream.

**Inner-loop work needed:**
- `isStandalonePattern()` helper
- `hasDirectedDependency()` helper: true for patterns with an upstream/downstream distinction (Customer-Supplier, per-side roles), false for patterns where neither side has authority (Partnership, Shared Kernel). Used by UI (hide direction controls) and edge rendering (hide arrowhead).

### Scenario 3: Mutual Exclusivity -- Standalone Clears Roles

```
Rule: setting a standalone pattern clears any per-side roles

  | Initial Upstream   | Initial Downstream    | Set Pattern       | Reason                                                             |
  | open-host-service  | conformist            | customer-supplier | C/S means upstream accommodates; incompatible with a fixed API role |
  | open-host-service  | anti-corruption-layer | partnership       | mutual dependency has no upstream/downstream to characterize        |
  | published-language | conformist            | shared-kernel     | joint ownership has no upstream/downstream to characterize          |
  | open-host-service  |                       | customer-supplier | even partial roles get cleared                                     |
  |                    | anti-corruption-layer | partnership       | even partial roles get cleared                                     |
```

**Outer-loop test:** For each row, create a relationship with the initial roles, then update it to the standalone pattern. Verify both `upstreamRole` and `downstreamRole` are cleared to undefined. Verify the standalone pattern is set.

**Inner-loop work needed:**
- Mutual exclusivity enforcement in `updateRelationshipMutation`
- The mutation must read existing values before deciding what to clear (structural change to `applyRelationshipUpdates`)

### Scenario 4: Mutual Exclusivity -- Roles Clear Standalone

```
Rule: setting a per-side role clears any standalone pattern

  | Initial Pattern   | Set Upstream          | Set Downstream        | Reason                                                          |
  | customer-supplier | open-host-service     |                       | OHS is a fixed API for all consumers; incompatible with C/S     |
  | customer-supplier |                       | anti-corruption-layer | if upstream accommodates, downstream doesn't need translation   |
  | partnership       | open-host-service     |                       | mutual dependency has no upstream side to characterize          |
  | shared-kernel     |                       | conformist            | joint ownership has no downstream side to characterize          |
```

**Outer-loop test:** For each row, create a relationship with the initial standalone pattern, then update with the given role. Verify `pattern` is cleared to undefined. Verify the role is set.

**Inner-loop work needed:**
- Same mutual exclusivity enforcement as Scenario 3 (opposite direction)

### Scenario 5: Invalid Combinations Rejected

```
Rule: some pattern combinations are structurally invalid and must be prevented

  | Upstream           | Downstream            | Pattern           | Reason                                                      |
  | open-host-service  | conformist            | customer-supplier | can't have both standalone and per-side characterization    |
  | open-host-service  |                       | partnership       | mutual dependency has no upstream to characterize           |
  |                    | anti-corruption-layer | shared-kernel     | joint ownership has no downstream to characterize           |
```

**Outer-loop test:** Attempt to create a relationship with all three fields set simultaneously. Verify the operation is rejected or the conflict is resolved by clearing the appropriate fields (design decision: reject vs. auto-resolve).

**Design decision needed:** Should the store reject invalid combinations (throw/return error), or auto-resolve by applying the "last write wins" rule (e.g., if you set a standalone pattern, roles get cleared automatically)? The mutual exclusivity scenarios (3 and 4) already describe auto-resolve behavior for updates. For creation, the question is whether the API even accepts all three fields at once.

**Recommendation:** Auto-resolve on the mutation layer (last-set field wins), validate at the UI layer (don't let the user construct invalid states). The store/mutation layer is permissive; the UI is strict. This means Scenario 5 may fold into Scenarios 3 and 4 rather than being a separate rejection path.

### Scenario 6: Upstream Roles Are Mutually Exclusive

```
Rule: a relationship can have at most one upstream role

  | First Upstream     | Set Upstream       | Result Upstream    | Reason                                                     |
  | open-host-service  | published-language | published-language | OHS (running service) and PL (published standard) differ   |
  | published-language | open-host-service  | open-host-service  | last-set upstream role replaces the previous one            |
```

**Outer-loop test:** Create a relationship with the first upstream role, then update to the second. Verify only the new role is stored.

**Inner-loop work needed:** Straightforward field replacement (not a new enforcement mechanism).

### Scenario 7: Downstream Roles Are Mutually Exclusive

```
Rule: a relationship can have at most one downstream role

  | First Downstream      | Set Downstream        | Result Downstream     | Reason                                              |
  | conformist            | anti-corruption-layer | anti-corruption-layer | can't both adopt and translate the upstream model   |
  | anti-corruption-layer | conformist            | conformist            | last-set downstream role replaces the previous one  |
```

**Outer-loop test:** Same as Scenario 6 but for downstream roles.

### Scenario 8: Non-Pattern Fields Are Preserved

```
Rule: changing pattern/role fields does not affect description or communication mode

  | Description              | Communication Mode | Action                    | Reason                                            |
  | Orders depend on Billing | REST API           | set upstream to OHS       | domain metadata is independent of pattern choice  |
  | Shared inventory model   | Event-driven       | set pattern to partnership| switching pattern type preserves other fields     |
  | Legacy integration       | gRPC               | clear upstream role       | clearing a role preserves other fields            |
```

**Outer-loop test:** Create a relationship with description and communication mode set, then perform the action. Verify the non-pattern fields are unchanged.

**Inner-loop work needed:** Verify `applyRelationshipUpdates` doesn't clobber unrelated fields (likely already works, but the test documents the contract).

### Scenario 9: Yjs Two-Browser Sync

```
Rule: two-sided patterns sync correctly between collaborating browsers

  | Upstream           | Downstream            | Pattern           | Reason                                          |
  | open-host-service  | anti-corruption-layer |                   | per-side roles sync to second browser            |
  | published-language | conformist            |                   | both per-side values arrive intact               |
  |                    |                       | customer-supplier | standalone pattern syncs without phantom roles   |
  |                    |                       | partnership       | undirected standalone syncs correctly             |
  | open-host-service  |                       |                   | partial characterization syncs                   |
```

**Outer-loop test:** Using the two-browser sync pattern (two Y.Doc instances connected via update events), create a relationship on Doc A, verify it appears on Doc B with all fields correct.

**Inner-loop work needed:** Yjs sync layer changes (Slice 2 of the implementation plan).

## Implementation Order

The scenarios above are ordered by dependency. The recommended sequence:

1. **Test infrastructure**: Set up `tableData` utility and integration test file
2. **Scenario 1** (valid per-side): Forces the type changes, sync layer, and store changes. This is the vertical slice that lights up the core capability.
3. **Scenario 2** (valid standalone): Adds the helper functions and verifies the existing patterns still work.
4. **Scenarios 3-4** (mutual exclusivity): The core enforcement logic. These two scenarios share inner-loop work.
5. **Scenario 5** (invalid combinations): Resolve the design decision, then either fold into 3-4 or add rejection tests.
6. **Scenarios 6-7** (role exclusivity): Quick wins, mostly verifying field replacement.
7. **Scenario 8** (field preservation): Safety net for the mutation changes.
8. **Scenario 9** (two-browser sync): Verifies the full collaboration path.

After all outer-loop scenarios pass: Slices 4-6 (UI, edge rendering, polish) are driven by component-level tests, not these integration scenarios. The UI work references the same domain rules but tests them through component rendering and user interaction.

## What This Plan Does Not Cover

- **Phase 2 migration** (Slices 7-9): Separate plan, separate outer-loop scenarios
- **UI component tests** (Slices 4-5): Inspector, create dialog, edge rendering tests are inner-loop work driven by their own component-level tests
- **Edge rendering geometry**: Slice 5 is the hardest visual work; it needs its own spike and test approach
- **`prove_it` or enforcement tooling**: We rely on discipline and the CLAUDE.md TDD conventions, not automated loop enforcement
