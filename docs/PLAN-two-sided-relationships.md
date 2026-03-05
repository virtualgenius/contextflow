# Plan: Two-Sided Relationship Pattern Model

Design document: [DDD Relationship Patterns: Validity Matrix](DDD_RELATIONSHIP_PATTERNS.md)

## Evaluation (2026-03-04)

Critical review of the plan against the current codebase. To be resolved before implementation begins.

### Gaps and Issues

**1. `pattern` field does double duty during Phase 1; UI transition logic underspecified.**
The plan says the existing `pattern` field "keeps its full 8-value type" while new fields are added. But it doesn't specify what happens to `pattern` when a user sets per-side roles on a *new* relationship. Does `pattern` get set to `undefined`? Or does it stay as the default `'customer-supplier'` (which is what `RelationshipCreateDialog` currently defaults to)? The `addRelationship` store action currently *requires* a pattern argument. The plan needs to specify the Phase 1 signature change.

**2. Slice 3 (Store) may not warrant being standalone.**
`addRelationship` is a thin wrapper around `getCollabMutations().addRelationship()`. The real enforcement is in Slice 2's `relationshipMutations.ts`. The analytics tracking is a one-liner. Consider folding into Slices 2 and 4 where changes naturally belong.

**3. RelationshipCreateDialog flow change is unspecified.**
Today the create dialog has a single dropdown defaulting to `customer-supplier`. Slice 4 says "Same two-sided UI for creation" but doesn't describe the interaction flow. Key questions: Does the user first choose "standalone vs. per-side"? Or are all three selectors shown simultaneously? What's the default for a new relationship? This is a significant UX design question that could block implementation.

**4. Slice 5 (Edge Rendering) is the hardest slice but has the least detail.**
`RelationshipEdge.tsx` has ~300 lines of rendering logic with carefully tuned indicator box positioning, bezier path adjustments, tooltip portals, and hit area calculations. Drawing two indicator boxes on one edge means: two anchor points modifying the bezier path (currently only one end can have a box), two tooltip portals that shouldn't overlap, label positioning between two boxes, and `getEdgeParams`/`getBoxEdgePoint` geometry functions handling both ends simultaneously. Should be broken into sub-slices (geometry, rendering, tooltips) or at minimum have the geometry approach specified.

**5. `PatternsGuideModal.tsx` restructuring is a UX decision.**
The modal currently groups patterns by `powerDynamics` category. Restructuring to standalone/upstream/downstream grouping changes how users learn the patterns. Worth a design note.

**6. `isSymmetric` check in RelationshipEdge.tsx needs updating.**
Currently checks `pattern === 'shared-kernel' || pattern === 'partnership' || pattern === 'separate-ways'`. When `pattern` is empty and no roles are set (blank relationship), this evaluates to `false`, showing an arrowhead. The plan doesn't address how "uncharacterized" relationships render.

**7. Separate Ways decision (Outstanding Question #1) should be answered before Phase 1.**
The plan defers to Phase 2, but Phase 1 UI work needs to know: does the dropdown still show Separate Ways? If Tom creates a workshop with existing Separate Ways relationships, does Phase 1 UI display them? The fallback rendering needs this decision.

**8. Import/export path is missing.**
The project has `importExport.test.ts` tests. Exported JSON projects with old-format patterns need to import correctly into Phase 1 or Phase 2 systems. This data path needs migration treatment alongside Yjs and IndexedDB.

**9. `conceptDefinitions.ts` changes are under-specified.**
Slice 1 says "Add concept definitions for upstream/downstream roles" but the file currently has `RELATIONSHIP_PATTERNS` and `EDGE_INDICATORS` objects used in RelationshipEdge tooltips. Should specify whether these get restructured or just extended.

**10. Phase 2 type narrowing (8 values to 3) is a larger breaking change than scoped.**
Every file that pattern-matches on `Relationship['pattern']` will break: `RelationshipEdge.tsx`, `canvasHelpers.ts`, `canvasConstants.ts`, `patternDefinitions.ts`, `conceptDefinitions.ts`, tests, and more. Slice 8 only lists 7 files. A grep for pattern type uses would likely surface more.

### Risks

**A. Dual indicator box geometry is harder than it looks.** The current code uses `getBoxEdgePoint` to anchor one end of the bezier curve to the indicator box edge. Making both ends anchor to boxes means the bezier control points need recalculation. If two contexts are close together, two boxes plus a label could overlap or look cramped.

**B. Phase 1's "temporary type widening" means runtime bugs won't be caught at compile time.** A developer could accidentally set `pattern: 'open-host-service'` AND `upstreamRole: 'open-host-service'` and TypeScript wouldn't complain.

**C. `updateRelationshipMutation` mutual-exclusivity enforcement (Slice 2) is a structural change.** The plan says "setting a role clears `pattern` if it was OHS/PL/Conformist/ACL." But this requires the mutation to *read* the current pattern value from the Y.Map before deciding what to clear. Currently `applyRelationshipUpdates` is a simple field-by-field setter that doesn't read existing values.

### Suggestions

1. **Answer Outstanding Question #1 now.** Option (a) (convert to blank relationship with a description note) is the safest. Avoids data loss, doesn't require UI for migration notices, and is consistent with the "relationship exists, neither side characterized" valid state.

2. **Add a Slice 0: Data Model spike.** Before any implementation, add `upstreamRole` and `downstreamRole` to types.ts and schema.ts with no other changes, run typecheck, and see what breaks. This 30-minute exercise will validate the plan's file lists.

3. **Split Slice 5 into geometry and rendering.** Do the indicator box geometry changes (with unit tests) before touching the React component. The geometry is pure math that can be tested independently.

4. **Design the Phase 1 create dialog UX explicitly.** Sketch the interaction flow before coding. The single-dropdown-to-three-selectors change is a significant UX shift that affects learnability.

5. **Add import/export to both phases.** Phase 1 should make export include the new fields; Phase 2 should make import trigger migration.

6. **Consider dropping Slice 3 as standalone** and folding its work into Slices 2 and 4.

---

## Outstanding Questions

**1. What happens to Separate Ways relationships?**
Deleting them silently on migration is risky: users lose data with no warning or undo. Options:
- (a) Convert to a relationship with no pattern/roles set, add a note in `description` (e.g., "Migrated from Separate Ways"). User can then delete manually if they want.
- (b) Show a one-time migration notice listing which relationships were removed.
- (c) Delete silently (current plan). Semantically correct but destructive.

**2. Should we add a project-level schema version?**
Currently there's no way to distinguish old-format from new-format projects. Migration must sniff field presence (does `pattern` contain an old value like `open-host-service`?). A `schemaVersion` field on the project would make this explicit and future-proof, but adds a field to maintain.

## Context

ContextFlow currently models relationship patterns as a single flat field (`pattern`) with 8 values. This conflates upstream characterizations (OHS, PL), downstream responses (Conformist, ACL), standalone patterns (Customer-Supplier), symmetric relationships (Partnership, Shared Kernel), and non-relationships (Separate Ways). Users can't express common real-world mappings like "OHS upstream with ACL downstream."

Tom Asel identified mixed relationship patterns as his top workshop priority (see [github-issue-11-analysis.md](github-issue-11-analysis.md)). Analysis of Evans' [DDD Reference](https://www.domainlanguage.com/wp-content/uploads/2016/05/DDD_Reference_2015-03.pdf) (pp. 32-34) and his article on [AI Components for a Deterministic System](https://www.domainlanguage.com/articles/ai-components-deterministic-system/) (which shows NAICS as a Published Language context with a downstream Conformist) establishes a two-sided model where upstream and downstream are characterized independently.

## Target Data Model

```typescript
Relationship {
  id: string
  fromContextId: string   // downstream
  toContextId: string     // upstream

  // Standalone patterns (when set, per-side roles must be empty)
  pattern?: 'customer-supplier' | 'partnership' | 'shared-kernel'

  // Per-side roles (when set, pattern must be empty)
  upstreamRole?: 'open-host-service' | 'published-language'
  downstreamRole?: 'conformist' | 'anti-corruption-layer'

  communicationMode?: string
  description?: string
}
```

See the [validity matrix](DDD_RELATIONSHIP_PATTERNS.md#valid-combinations) for the full truth table of allowed combinations.

### Migration from Old Model

Old `pattern` values map to the new fields:

| Old `pattern` | New `pattern` | New `upstreamRole` | New `downstreamRole` | Notes |
|---|---|---|---|---|
| `customer-supplier` | `customer-supplier` | - | - | Lossless |
| `conformist` | - | - | `conformist` | Lossless |
| `anti-corruption-layer` | - | - | `anti-corruption-layer` | Lossless |
| `open-host-service` | - | `open-host-service` | - | Lossless |
| `published-language` | - | `published-language` | - | Lossless |
| `shared-kernel` | `shared-kernel` | - | - | Lossless |
| `partnership` | `partnership` | - | - | Lossless |
| `separate-ways` | See [Outstanding Questions #1](#outstanding-questions) | | | Needs decision |

## Implementation Strategy

The plan is split into two phases, ordered by user value rather than technical layers.

**Phase 1 (Deliver)** adds `upstreamRole` and `downstreamRole` as new optional fields alongside the existing `pattern` field. No existing data is modified; old projects keep working untouched. Tom gets the two-sided capability for new relationships immediately.

**Phase 2 (Migrate)** narrows the `pattern` type from 8 values to 3 standalone values, writes a pure migration function, and wires it into all three data paths (Yjs, IndexedDB, examples). This phase can ship separately with zero user-visible urgency since Phase 1 already works.

## Phase 1: Deliver Two-Sided Capability

### Slice 1: Types, Definitions, and Validation

Add new fields and pattern metadata. The existing `pattern` field keeps its full 8-value type for now; the new fields are purely additive.

**Files:**
- `src/model/types.ts` - Add optional `upstreamRole` and `downstreamRole` to `Relationship`; define `UpstreamRole` and `DownstreamRole` types
- `src/model/patternDefinitions.ts` - Add `UPSTREAM_ROLE_DEFINITIONS` and `DOWNSTREAM_ROLE_DEFINITIONS` alongside existing `PATTERN_DEFINITIONS`; add `isStandalonePattern()`, `isUpstreamRole()`, `isDownstreamRole()` helpers; add `isValidCombination()` enforcing the validity matrix
- `src/model/conceptDefinitions.ts` - Add concept definitions for upstream/downstream roles (for InfoTooltips)

**TDD cycles:**
- Test upstream role definitions has OHS, PL with correct metadata
- Test downstream role definitions has Conformist, ACL with correct metadata
- Test `isValidCombination()` accepts all valid combinations from the matrix
- Test `isValidCombination()` rejects standalone + per-side role combos
- Test `isValidCombination()` rejects OHS + PL together, Conformist + ACL together

### Slice 2: Yjs Sync Layer (additive)

Make new fields round-trip through Yjs. No migration, no write-back; just read/write the new optional fields.

**Files:**
- `src/model/sync/schema.ts` - Add `upstreamRole` and `downstreamRole` (`string | null`) to `YjsRelationship`
- `src/model/sync/relationshipSync.ts` - Write both fields in `populateRelationshipYMap()` with `?? null`; read both in `yMapToRelationship()` with null-guard
- `src/model/sync/relationshipMutations.ts` - Add both field names to the `fields` array in `applyRelationshipUpdates`; enforce mutual exclusivity in `updateRelationshipMutation` (setting a role clears `pattern` from old 8-value set if it was OHS/PL/Conformist/ACL; setting a standalone pattern clears roles)

**TDD cycles:**
- Test `populateRelationshipYMap` stores `upstreamRole`, `downstreamRole` as strings (or null)
- Test `yMapToRelationship` reads them back correctly
- Test round-trip: relationship with OHS upstream + ACL downstream
- Test round-trip: relationship with only `upstreamRole` set (downstream not yet characterized)
- Test `updateRelationshipMutation` can set/clear each role field independently
- Test setting `upstreamRole` on a relationship with `pattern: 'open-host-service'` clears the old pattern
- Test setting standalone `pattern` clears both role fields
- Test updating other fields (description, communicationMode) doesn't clobber role fields

### Slice 3: Store and Analytics

Update store actions so the UI can set the new fields.

**Files:**
- `src/model/store.ts` - `addRelationship` accepts optional `upstreamRole`, `downstreamRole`; `updateRelationship` enforces mutual exclusivity (setting standalone clears roles, setting roles clears old per-side pattern values)
- `src/model/sync/useCollabStore.ts` - Verify `Partial<Relationship>` covers new fields (likely no change needed)
- Analytics: track `upstream_role`, `downstream_role` in relationship events

### Slice 4: UI - Inspector and Create Dialog

Two-sided pattern selection. This is where Tom's workshop value lands.

**Files:**
- `src/components/inspector/RelationshipInspector.tsx` - Replace single 8-option dropdown with: (1) standalone pattern selector (C/S, Partnership, Shared Kernel), (2) upstream role selector (OHS, PL, or none), (3) downstream role selector (Conformist, ACL, or none). Switching to standalone clears roles; setting a role clears standalone pattern. Show both selectors simultaneously for per-side mode.
- `src/components/inspector/RelationshipCreateDialog.tsx` - Same two-sided UI for creation
- `src/components/PatternsGuideModal.tsx` - Restructure to show standalone patterns, upstream roles, and downstream roles as separate sections

### Slice 5: Edge Rendering

Edges display upstream and downstream indicators simultaneously. An OHS+ACL relationship shows both indicator boxes.

**Files:**
- `src/lib/canvasConstants.ts` - Add indicator configs keyed by role value (not just pattern). Add Published Language and Conformist indicators alongside existing OHS and ACL.
- `src/components/edges/RelationshipEdge.tsx` - Read `upstreamRole` and `downstreamRole` in addition to `pattern`; render up to two indicator boxes (one at each end). Fall back to old `pattern`-based indicators when role fields are absent (backward compatibility with unmigrated data).
- `src/lib/canvasHelpers.ts` - Update `getEdgeLabelInfo` to handle new role fields

**Key rendering change:** A single edge can now show indicator boxes at both ends (e.g., OHS box near upstream context, ACL box near downstream context). The bezier path calculation needs to handle two boxes. The fallback to old `pattern` values ensures existing projects render correctly without migration.

### Slice 6: Quality and Polish

- `npm run typecheck` - fix any type errors from new fields
- `npm test` - all tests green
- `npm run lint` - clean
- Verify undo/redo for new role fields
- Run `npm run mutate:changed` on sync layer

### Phase 1 Verification

1. `npm test` - all tests pass
2. `npm run typecheck` - no errors
3. `npm run lint` - clean
4. Manual browser testing:
   - Create relationship with OHS upstream + ACL downstream (both indicators visible)
   - Create relationship with PL upstream + Conformist downstream
   - Create Customer-Supplier relationship (standalone)
   - Create Partnership (standalone, symmetric)
   - Switch a relationship from per-side to standalone (roles cleared)
   - Open existing projects with old-format relationships (still display correctly via fallback)
   - Open built-in example projects (unchanged, still work)
   - Test undo/redo on role changes
   - Test multiplayer sync of new fields (start local collab worker)

## Phase 2: Migrate Old Data (separate release)

Phase 2 narrows the type system and migrates existing data. This is not urgent because Phase 1's fallback rendering handles old data gracefully. Ship when ready, not under workshop pressure.

### Slice 7: Migration Function (pure logic, no I/O)

Write and test the migration function before touching any sync or persistence code.

**Files:**
- New: `src/model/sync/relationshipMigration.ts` - Pure function: old relationship in, new relationship out (or null for Separate Ways per Outstanding Question #1)
- New: `src/model/sync/__tests__/relationshipMigration.test.ts`

**TDD cycles:**
- Test each of the 7 non-Separate-Ways old values migrates correctly (see migration table)
- Test Separate Ways handling (per decision on Outstanding Question #1)
- Test already-migrated data passes through unchanged (idempotency)
- Test relationship with new-format fields is not modified
- Test mixed project: some old format, some new format
- Test edge case: `pattern` field is missing entirely (defensive)

### Slice 8: Wire Migration into Data Paths

Apply migration at all three read points.

**Files:**
- `src/model/types.ts` - Narrow `pattern` type from 8 values to 3 standalone values; remove `separate-ways`
- `src/model/sync/relationshipSync.ts` - Apply migration in `yMapToRelationship()` with write-back inside `ydoc.transact()`
- `src/model/sync/projectSync.ts` - Filter out null results from migration (Separate Ways removal)
- `src/model/persistence.ts` - Add relationship migration to `migrateProject()` using the same pure function
- `examples/cbioportal.project.json` - Migrate `open-host-service` to `upstreamRole`
- `examples/elan-warranty.project.json` - Migrate `open-host-service` to `upstreamRole`
- `src/model/conceptDefinitions.ts` - Remove `separate-ways` from `RELATIONSHIP_PATTERNS`

**Migration principles:**
1. **Migrate on read, write back immediately.** When `yMapToRelationship()` encounters an old-format `pattern` value, it converts to the new format in memory and updates the Yjs map within the same transaction.
2. **Both data paths get migration.** `persistence.ts:migrateProject()` handles IndexedDB; `yMapToRelationship()` handles Yjs.
3. **Update built-in examples directly** so they never trigger runtime migration.
4. **Detection is unambiguous.** Old per-side values (OHS, PL, Conformist, ACL, Separate Ways) don't overlap with the new 3-value standalone `pattern` type.
5. **Pure migration function, tested independently** (Slice 7).
6. **Yjs write-back in a transaction** for atomicity and proper undo tracking.

### Slice 9: Cleanup

- Remove fallback rendering code from `RelationshipEdge.tsx` (old `pattern`-based indicator lookup)
- Remove `separate-ways` from any remaining pattern lists
- Grep for stale references to old 8-value pattern type
- `npm run mutate:changed` on sync layer
- Remove any backward-compat code that's no longer needed

### Phase 2 Verification

1. `npm test`, `npm run typecheck`, `npm run lint` - all clean
2. Manual browser testing:
   - Load a project with old-format relationships, verify migration works transparently
   - Verify Separate Ways handling (per decision on Outstanding Question #1)
   - Open built-in example projects, verify OHS relationships display correctly with new role fields
   - Test multiplayer version skew: open same project in two tabs, one with old code (git stash), one with new
3. `npm run mutate:changed` - mutation score acceptable on changed sync files

## Multiplayer Safety

When two clients are on different versions:
- **Old client writes old format** -> New client reads it, migrates in place, writes back new format. Old client receives the update via Yjs sync; it will see unknown fields (`upstreamRole`, `downstreamRole`) which it ignores, and a missing or narrowed `pattern` field. Old client's `yMapToRelationship()` will cast `pattern` and may display incorrectly, but data is not corrupted.
- **New client writes new format** -> Old client reads it. Old client sees `pattern` as undefined (for per-side relationships) or as one of the 3 standalone values it already knows. Worst case: old client shows no pattern label for per-side relationships. Data is preserved.

This is a **forward-compatible degradation**: old clients display less information but don't corrupt data. This is acceptable for a small user base where version skew is brief.

**Phase 1 note:** During Phase 1 (before migration ships), new clients write both old `pattern` AND new role fields. Old clients ignore the role fields but see the `pattern` value, so they display something reasonable. This means Phase 1 has even better backward compatibility than Phase 2.

## Risk Notes

- **Phase 1 is low-risk.** New fields are purely additive. Old data is untouched. Fallback rendering ensures old projects display correctly. No migration, no write-back, no schema narrowing.
- **Phase 2 concentrates the risk.** Breaking change to `Relationship` type (narrowing `pattern`), Yjs write-back during migration, three data paths to cover. But Phase 2 ships under less pressure since Phase 1 already delivers the user-facing capability.
- **Dual indicator boxes on edges** (Phase 1, Slice 5): most visually complex change; needs careful bezier path calculation for two boxes on one edge.
- **Temporary type widening in Phase 1**: `pattern` keeps its full 8-value type while new role fields coexist. This means the type system doesn't enforce mutual exclusivity at compile time during Phase 1; runtime validation in the store handles it instead. Phase 2 resolves this.
