# Plan: Two-Sided Relationship Pattern Model

Design document: [DDD Relationship Patterns: Validity Matrix](DDD_RELATIONSHIP_PATTERNS.md)

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

## Migration Strategy

Migration must be **zero-risk for existing users**. There are three independent data paths that hold relationship data, and all three need migration:

### Data paths

| Path | Storage | When loaded | Migration point |
|---|---|---|---|
| **Yjs documents** | Collab server (SQLite via Durable Objects) | On project open (WebSocket sync) | `yMapToRelationship()` in `relationshipSync.ts` |
| **IndexedDB** | Local browser | On app startup (pre-cloud-migration users) | `migrateProject()` in `persistence.ts` |
| **Built-in examples** | JSON files in `examples/` | On app startup | Update the JSON files directly (no runtime migration) |

### Migration principles

1. **Migrate on read, write back immediately.** When `yMapToRelationship()` encounters an old-format `pattern` field (one of the 8 old values), it converts to the new format in memory. The Yjs document is then updated in place (within the same transaction) so all clients converge on the new format. This is safe because the migration is deterministic and idempotent.

2. **Both data paths get migration.** `persistence.ts:migrateProject()` already handles IndexedDB migrations (e.g., `isExternal` to `ownership`). Add relationship migration there. `yMapToRelationship()` handles the Yjs path.

3. **Update built-in examples to new format.** The `examples/*.project.json` files should be updated directly so they never trigger runtime migration. Two files currently use `open-host-service`: `elan-warranty.project.json` and `cbioportal.project.json`.

4. **Detection without a version field.** Old format: `pattern` is one of the 8 old values AND `upstreamRole`/`downstreamRole` are absent. New format: `pattern` is one of 3 standalone values, OR `upstreamRole`/`downstreamRole` are present. The old 8-value `pattern` type and the new 3-value `pattern` type don't overlap for the values that change (OHS, PL, Conformist, ACL, Separate Ways), so detection is unambiguous.

5. **Pure migration function, tested independently.** `migrateRelationship(oldRelationship) => newRelationship | null` is a pure function with exhaustive tests for all 8 old values, plus idempotency tests for already-migrated data and mixed-format projects.

6. **Yjs write-back happens in a transaction.** When old format is detected in `yMapToRelationship()`, the function updates the Yjs map within `ydoc.transact()`: delete old `pattern` key, set new fields. This ensures atomicity and proper undo tracking.

### Multiplayer safety

When two clients are on different versions:
- **Old client writes old format** -> New client reads it, migrates in place, writes back new format. Old client receives the update via Yjs sync; it will see unknown fields (`upstreamRole`, `downstreamRole`) which it ignores, and a missing or narrowed `pattern` field. Old client's `yMapToRelationship()` will cast `pattern` and may display incorrectly, but data is not corrupted.
- **New client writes new format** -> Old client reads it. Old client sees `pattern` as undefined (for per-side relationships) or as one of the 3 standalone values it already knows. Worst case: old client shows no pattern label for per-side relationships. Data is preserved.

This is a **forward-compatible degradation**: old clients display less information but don't corrupt data. This is acceptable for a small user base where version skew is brief.

## Implementation Slices

### Slice 1: Data Model and Pattern Definitions

Update the type system and pattern metadata. No UI or Yjs changes yet.

**Files:**
- `src/model/types.ts` - Replace `pattern` field with optional `pattern`, `upstreamRole`, `downstreamRole`
- `src/model/patternDefinitions.ts` - Restructure into `STANDALONE_PATTERN_DEFINITIONS`, `UPSTREAM_ROLE_DEFINITIONS`, `DOWNSTREAM_ROLE_DEFINITIONS`; add validation functions
- `src/model/conceptDefinitions.ts` - Remove `separate-ways` from `RELATIONSHIP_PATTERNS`

**TDD cycles:**
- Test standalone pattern definitions has C/S, Partnership, Shared Kernel
- Test upstream role definitions has OHS, PL
- Test downstream role definitions has Conformist, ACL
- Test `isValidCombination()` enforces the validity matrix
- Test `isSymmetric(relationship)` returns true for Partnership/Shared Kernel

### Slice 2: Migration (pure logic, no I/O)

Write and test the migration function before touching any sync or persistence code.

**Files:**
- New: `src/model/sync/relationshipMigration.ts` - Pure function: old relationship in, new relationship out (or null for Separate Ways)
- New: `src/model/sync/__tests__/relationshipMigration.test.ts`

**TDD cycles:**
- Test each of the 7 non-Separate-Ways old values migrates correctly (see migration table)
- Test Separate Ways returns null (or converted relationship, pending decision)
- Test already-migrated data passes through unchanged (idempotency)
- Test relationship with new-format fields is not modified
- Test mixed project: some old format, some new format
- Test edge case: `pattern` field is missing entirely (defensive)

### Slice 3: Yjs Sync Layer

Wire migration into deserialization and make new fields round-trip through Yjs.

**Files:**
- `src/model/sync/schema.ts` - Update `YjsRelationship` for new fields
- `src/model/sync/relationshipSync.ts` - Apply migration in `yMapToRelationship()` with write-back; serialize new fields in `populateRelationshipYMap()`
- `src/model/sync/relationshipMutations.ts` - Handle new fields in create/update mutations; enforce mutual exclusivity
- `src/model/sync/projectSync.ts` - Filter out null results from migration (Separate Ways removal) in `yDocToProject()`
- `src/model/sync/__tests__/relationshipMutations.test.ts` - Tests for new field handling
- `src/model/sync/__tests__/relationshipSync.test.ts` - Round-trip tests including migration scenarios

**TDD cycles:**
- Test `populateRelationshipYMap` stores `pattern`, `upstreamRole`, `downstreamRole` as strings
- Test `yMapToRelationship` reads them back correctly
- Test round-trip with OHS upstream + ACL downstream
- Test round-trip with Partnership (standalone)
- Test `yMapToRelationship` migrates old-format data and writes back to YMap
- Test `updateRelationshipMutation` can set/clear each field independently
- Test setting `pattern` auto-clears upstream/downstream roles
- Test setting upstream/downstream role auto-clears `pattern`
- Test updating other fields doesn't clobber role fields

### Slice 4: IndexedDB Migration and Built-in Projects

**Files:**
- `src/model/persistence.ts` - Add relationship migration to `migrateProject()` using the same pure function from Slice 2
- `src/model/persistence.test.ts` - Test relationship migration in the persistence path
- `examples/sample.project.json` - Update to new format (currently uses C/S, which stays as-is)
- `examples/cbioportal.project.json` - Migrate `open-host-service` to `upstreamRole`
- `examples/elan-warranty.project.json` - Migrate `open-host-service` to `upstreamRole`

### Slice 5: Store and Collab Bridge

Update store actions to handle the two-sided model.

**Files:**
- `src/model/store.ts` - Update `addRelationship` and `updateRelationship` for new fields; enforce mutual exclusivity (setting standalone clears roles and vice versa)
- `src/model/sync/useCollabStore.ts` - Verify `Partial<Relationship>` covers new fields

**Changes:**
- `addRelationship` accepts `pattern`, `upstreamRole`, or `downstreamRole`
- `updateRelationship` enforces mutual exclusivity between standalone and per-side fields
- Analytics: track `pattern`, `upstream_role`, `downstream_role` in relationship events

### Slice 6: UI - Inspector and Create Dialog

Two-sided pattern selection in the inspector and creation flow.

**Files:**
- `src/components/inspector/RelationshipInspector.tsx` - Replace single 8-option dropdown with: standalone pattern selector OR upstream role + downstream role selectors. Switching between modes clears the other fields.
- `src/components/inspector/RelationshipCreateDialog.tsx` - Same two-sided UI for creation
- `src/components/PatternsGuideModal.tsx` - Restructure to show standalone patterns, upstream roles, and downstream roles as separate sections. Reference Evans' NAICS example for PL.

### Slice 7: Edge Rendering

Edges display upstream and downstream indicators simultaneously.

**Files:**
- `src/lib/canvasConstants.ts` - Restructure edge indicators for two-sided model (downstream indicator on downstream end, upstream indicator on upstream end)
- `src/components/edges/RelationshipEdge.tsx` - Render up to two indicator boxes: one at each end of the edge. An OHS<-ACL relationship shows both.
- `src/lib/canvasHelpers.ts` - Update `getEdgeLabelInfo` for new pattern structure

**Key rendering change:** A single edge can now show indicator boxes at both ends (e.g., OHS box near upstream context, ACL box near downstream context). The bezier path calculation needs to handle two indicator boxes.

### Slice 8: Cleanup and Polish

- `npm run typecheck` - fix remaining type errors
- `npm test` - all tests green
- `npm run lint` - clean
- Grep for stale references to old 8-value `pattern` type and old pattern values (`open-host-service`, `published-language`, `separate-ways` as pattern values)
- Verify undo/redo for all new fields
- Run `npm run mutate:changed` on sync layer

## Verification

1. `npm test` - all tests pass (including new migration, sync, and pattern definition tests)
2. `npm run typecheck` - no errors
3. `npm run lint` - clean
4. Manual browser testing:
   - Create relationship with OHS upstream + ACL downstream (both indicators visible)
   - Create relationship with PL upstream + Conformist downstream
   - Create Customer-Supplier relationship (standalone)
   - Create Partnership (standalone, symmetric)
   - Switch a relationship from per-side to standalone (roles cleared)
   - Load a project with old-format relationships, verify migration works transparently
   - Verify Separate Ways handling (per decision on Outstanding Question #1)
   - Open built-in example projects (elan-warranty, cbioportal), verify OHS relationships display correctly
   - Test undo/redo on role changes
   - Test multiplayer sync of new fields (start local collab worker)
   - Test version skew: open same project in two tabs, one with old code (git stash), one with new
5. `npm run mutate:changed` - mutation score acceptable on changed sync files

## Risk Notes

- **Breaking change to `Relationship` type**: Every file that reads `relationship.pattern` must be updated. The field name `pattern` is reused but with a narrower type (3 values instead of 8) and is now optional, so TypeScript will catch most issues at compile time.
- **Three data paths**: Migration must cover Yjs, IndexedDB, and built-in examples. Missing any one path means some users hit old-format data against new-format types.
- **Yjs write-back during migration**: Updating the Yjs map inside `yMapToRelationship()` changes the function from pure read to read+write. This must happen inside a transaction to maintain atomicity and not trigger infinite sync loops.
- **Multiplayer version skew**: Old clients seeing new-format data will degrade gracefully (show no pattern label for per-side relationships) but won't corrupt data. Acceptable for current user base.
- **Dual indicator boxes on edges**: most visually complex change; needs careful bezier path calculation for two boxes on one edge.
