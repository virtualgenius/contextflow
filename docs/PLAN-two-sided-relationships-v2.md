# Plan: Two-Sided Relationships (v2, sliced by user value)

> **Bead**: `contextflow-ki1` · **GH issue**: #13
> **Target mockup**: [`docs/mockups/two-sided-relationships-target.html`](mockups/two-sided-relationships-target.html)
> **Design rationale and alternatives**: [`docs/mockups/drag-direction-options-mockup.html`](mockups/drag-direction-options-mockup.html)
> **Original (technical-layer) plan**: [`docs/PLAN-two-sided-relationships.md`](PLAN-two-sided-relationships.md) (preserved for reference; superseded by this document for slicing)

## What this plan does differently

The original v1 plan sliced work by technical layer (types, sync, store, UI, rendering, polish). v2 slices by **observable user behavior**. Each slice is a single ship-and-test unit that adds one user-visible capability.

This means a slice may touch multiple layers (types + sync + UI together), but the slice is sized so the combined change stays small. The win is testability: each slice can be driven by a failing BDD scenario, shipped to production, and verified by a user.

## Pre-resolved decisions (do not re-litigate inside slices)

From the design discovery in `drag-direction-options-mockup.html`:

1. **Influence type is internal vocabulary**, derived from `pattern` and per-side roles. Not a stored field, not a picker control. Three categories per Evans (DDD Reference pp. 37-38): Upstream/Downstream, Mutually Dependent, Free.
2. **User picks concrete patterns**, not influence types. The picker exposes Customer-Supplier, Partnership, and per-side roles (OHS, Published Language, Conformist, ACL).
3. **Shared Kernel is not a picker option**. It is created by the drag-to-overlap gesture (depends on `contextflow-cqi`). The picker shows a "Currently: Shared Kernel" banner when active.
4. **Free has no relationship object**. To express Free, the user removes the relationship. There is no Free pill in the picker.
5. **Separate Ways migration is a deletion**, not a rename. (Was Outstanding Question #1 in v1; resolved here.)
6. **All pills toggle off** when the active one is clicked. No separate "clear" links.
7. **Mutual exclusivity is auto-resolved**: picking a standalone pattern clears per-side roles, and vice versa. The mutation layer is permissive; the UI prevents invalid states.
8. **Drag-stub gesture sets U/D direction**: drag-from is downstream, drag-to is upstream, arrow points to upstream. This preserves the P1 convention from `#22`.
9. **Direction can be flipped two ways**: a clickable arrow in the picker's direction mini-diagram (η), and double-click on the canvas arrow (ε). Both call the existing `swapRelationshipDirection`.
10. **`schemaVersion` field** (was Outstanding Question #2 in v1): still unresolved. Out of scope for this bead; flag if it blocks Phase 2 planning, do not add the field here.

## Scope boundary

In scope (this bead, slices 1-7):
- Per-side roles as a first-class field on `Relationship`
- Picker restructure to the Option D layout
- Direction swap via picker (η) and canvas (ε)
- Shared Kernel as a gesture (depends on `contextflow-cqi`)
- Drag-apart from SK auto-Partnership

Out of scope (this bead):
- Migration of old data (Slice 8, separate effort)
- The Shared Kernel rendering itself (`contextflow-cqi`)
- The ACL/OHS box overlap collision (`contextflow-b6a`)
- Direction-teaching wording on the create affordance (`contextflow-twa`'s coach-mark surface in `contextflow-092`)
- Project-level `schemaVersion`

## How to read each slice

Each slice has:
- **User behavior**: one sentence describing what the user can now do (or how their experience changes)
- **Acceptance criteria**: written as observable behavior, scenario style. A worker should be able to write a failing integration test from these alone.
- **Files likely affected**: a starting point, not exhaustive
- **What does NOT change**: explicit, to prevent scope creep from the target mockup
- **Dependencies**: prior slices or other beads that must land first

---

## Slice 1 — Per-side roles available in inspector

**User behavior**: A user can set Open Host Service, Published Language, Conformist, or Anti-Corruption Layer as a per-side role on a relationship through the InspectorPanel.

**Acceptance criteria**:
- Given a U/D relationship between Orders and Billing, when the user clicks the Open Host Service pill on the Upstream side, then `upstreamRole` is set to `'open-host-service'` and persists across Yjs round-trip.
- Given the user has set Open Host Service on the upstream, when they click the Conformist pill on the Downstream side, then `downstreamRole` is set to `'conformist'` and `upstreamRole` is preserved.
- Given a relationship with `upstreamRole: 'open-host-service'`, when the user clicks the same pill again, then `upstreamRole` becomes `undefined`.
- Multiplayer: a per-side role set in one browser appears in a second browser within one Yjs sync.

**Files likely affected**:
- `src/model/types.ts` (add `upstreamRole`, `downstreamRole`, `UpstreamRole`, `DownstreamRole`)
- `src/model/sync/schema.ts` (add fields to `YjsRelationship`)
- `src/model/sync/relationshipSync.ts` (round-trip the new fields)
- `src/model/sync/relationshipMutations.ts` (add fields to `applyRelationshipUpdates`)
- `src/components/inspector/RelationshipInspector.tsx` (new per-side pills)
- `src/model/conceptDefinitions.ts` (concept definitions for OHS, PL, Conformist, ACL as upstream/downstream roles — for InfoTooltips)

**Reminders for the implementer** (not new requirements; just things to honor):
- **InfoTooltip parity**: per-side role pills use the same `InfoTooltip` + `ConceptDefinition` pattern as existing pattern pills (respects `showHelpTooltips`). Concept entries for OHS/PL/Conformist/ACL as per-side roles go into `conceptDefinitions.ts`.
- **Undo/redo + multiplayer**: per-side role changes flow through `relationshipMutations.ts` so undo/redo and Yjs sync work uniformly. Do not write directly to Zustand (see `Yjs Sync Overwrites` lesson in MEMORY).
- **Analytics**: each role-set, role-clear, and role-toggle fires a tracked event per `docs/ANALYTICS_USAGE_GUIDE.md` (use `trackPropertyChange` if there's already a generic `relationship_updated` event with `properties_changed`, otherwise add explicit `trackEvent` calls).

**What does NOT change in this slice**:
- The picker layout stays close to today's structure; no Partnership-first reorganization yet (that's Slice 3)
- The 8-value `pattern` field keeps its full type for backward compatibility
- Edge rendering still uses the old `pattern`-based indicator boxes; new role badges on contexts only (that's Slice 2)
- No direction controls beyond what exists today (Slices 4-5)

**Dependencies**: none (foundational)

---

## Slice 2 — Edge indicators for per-side roles

**User behavior**: A user sees a visual indicator on each context end showing the per-side role for that side.

**Acceptance criteria**:
- Given a relationship with `upstreamRole: 'open-host-service'`, when the user views the canvas, then a green "OHS" indicator box renders adjacent to the upstream context's edge of the relationship (matching the existing `PATTERN_EDGE_INDICATORS` config in `src/lib/canvasConstants.ts`: 28×18px, green-100 fill, green-500 border).
- Given a relationship with `downstreamRole: 'anti-corruption-layer'`, then an amber "ACL" indicator box renders adjacent to the downstream context's edge (matching existing config: amber-100 fill, amber-500 border).
- Given a relationship with both `upstreamRole: 'open-host-service'` and `downstreamRole: 'anti-corruption-layer'`, then both indicator boxes render simultaneously, one near each end.
- Given a relationship with `upstreamRole: 'published-language'`, then the upstream role renders using whatever visual treatment is decided in this slice (see open design decision below).
- Given a relationship with `downstreamRole: 'conformist'`, then the downstream role renders using whatever visual treatment is decided in this slice (see open design decision below).

**Open design decision in this slice**: how do Published Language (upstream) and Conformist (downstream) render on the canvas? The existing app only has the OHS and ACL box visuals. Options for PL and Conformist include:
- New indicator boxes matching the OHS/ACL pattern but with different colors
- A smaller / lighter visual (text label, badge, icon) since these are characterizations rather than code artifacts
- No on-canvas visual; role visible only in the inspector
This decision belongs to the implementer of Slice 2 with sign-off from Paul. The target mockup renders these as dashed placeholders labeled "(visual TBD)" to make the decision visible.

**Files likely affected**:
- `src/lib/canvasConstants.ts` (indicator configs; extend `PATTERN_EDGE_INDICATORS` or introduce a per-role variant)
- `src/components/edges/RelationshipEdge.tsx` (read role fields, render appropriate visuals)
- `src/lib/canvasHelpers.ts` (`getEdgeLabelInfo` updates for role-based labels)

**What does NOT change in this slice**:
- The bezier-path geometry for OHS/ACL stays compatible with the existing one-box geometry (see `design_acl_ohs_tangent_edges` memory: box hugs context with no line between, edge enters box perpendicular to attachment edge)
- ACL/OHS box overlap collision when one context plays both roles on the same side: deferred to `contextflow-b6a`
- Old `pattern`-based indicators still render when role fields are absent (fallback for backward compat)

**Dependencies**: Slice 1

**Risk note**: this is the slice the v1 plan's Evaluation flagged as "hardest with the least detail." Worth a small geometry spike before implementation, especially for the case where two indicator boxes need to coexist on edges that share a context end. The fallback rendering for old-format data should be the simpler case.

---

## Slice 3 — Picker restructure to Option D layout

**User behavior**: The pattern picker presents three clear alternatives — Partnership, Customer-Supplier, or per-side characterization — with toggle-off behavior on all pills and a remove-relationship button.

**Acceptance criteria**:
- The picker shows a Pattern section with Partnership (labeled "Mutually Dependent"), Customer-Supplier (labeled "Upstream/Downstream"), and a "Characterize each side" subsection with the per-side role pills.
- The picker does NOT show Shared Kernel as a picker option; an italic hint reads "For a Shared Kernel, drag the contexts to overlap."
- The picker does NOT show Separate Ways; the bottom of the picker has a Remove relationship button with a confirmation prompt.
- Given Partnership is active, when the user clicks Partnership again, then `pattern` becomes `undefined`.
- Given Customer-Supplier is active, when the user clicks an Upstream per-side pill, then `pattern` is cleared and the per-side role is set.
- Given a per-side role is active, when the user clicks Partnership, then both per-side roles are cleared and `pattern` is set to `'partnership'`.
- "Currently: Shared Kernel" banner renders at the top of the picker when `pattern === 'shared-kernel'`.

**Files likely affected**:
- `src/components/inspector/RelationshipInspector.tsx` (full restructure)
- `src/components/inspector/RelationshipCreateDialog.tsx` (matching restructure for creation)
- `src/components/PatternsGuideModal.tsx` (regroup by influence type for teaching, drop separate-ways)
- `src/model/sync/relationshipMutations.ts` (auto-resolve cross-clears already enforced; extend to cover all pattern transitions)

**Reminders for the implementer**:
- **Analytics**: pattern toggle-on, toggle-off, and remove-relationship each fire tracked events per `docs/ANALYTICS_USAGE_GUIDE.md`.
- **PatternsGuideModal** restructure groups patterns by influence type: Mutually Dependent (Partnership; Shared Kernel — note: gesture-only, drag contexts to overlap); Upstream/Downstream (Customer-Supplier; per-side roles OHS, PL, Conformist, ACL). Drop Separate Ways entirely (Free is the absence of a relationship).

**What does NOT change in this slice**:
- Edge rendering geometry (still uses indicator boxes from Slice 2)
- Direction controls (Slices 4-5)
- Migration of old data (Slice 8)
- Shared Kernel as an entity (`contextflow-cqi`)

**Dependencies**: Slices 1, 2

---

## Slice 4 — Direction swap via picker mini-diagram (η)

**User behavior**: When viewing a U/D relationship in the inspector, the user sees a mini-diagram showing the two contexts and the arrow direction. Clicking the arrow swaps the direction.

**Acceptance criteria**:
- Given a U/D relationship, when the user opens the inspector, then a Direction section renders showing the two contexts in their canvas positions and an arrow indicating upstream.
- Given the user clicks the arrow in the mini-diagram, then `fromContextId` and `toContextId` swap; the canvas arrow re-renders pointing the other way; per-side roles are preserved (they're attached to the upstream/downstream role, not to specific contexts, so the boxes follow to whichever context is now in that role).
- The Direction section does NOT render when the influence is Mutually Dependent (Partnership has no direction).
- Hover state on the arrow signals it's clickable (color change).

**Files likely affected**:
- `src/components/inspector/RelationshipInspector.tsx` (new Direction section)
- `src/model/store.ts` (call existing `swapRelationshipDirection` action; no change to the action itself — per-side roles are preserved and the rendering naturally repositions them)

**Reminders for the implementer**:
- **Analytics**: direction flip (whether via picker or canvas) fires a tracked event per `docs/ANALYTICS_USAGE_GUIDE.md`.

**What does NOT change in this slice**:
- The canvas behavior (Slice 5 is the canvas counterpart)
- Existing right-click → Swap Direction context menu (stays as a fallback; inherits the new behavior since it calls the same store action and per-side rendering follows the role)
- The store action `swapRelationshipDirection` itself: no semantic change, since the per-side role rendering looks up upstream/downstream after the swap

**Dependencies**: Slice 3

---

## Slice 5 — Direction swap via canvas double-click (ε)

**User behavior**: A user can double-click a relationship arrow on the canvas to flip its direction.

**Acceptance criteria**:
- Given a U/D relationship rendered as an arrow on the canvas, when the user double-clicks anywhere on the arrow's hit area, then `swapRelationshipDirection` is called and the arrow re-renders pointing the other way; per-side roles are preserved (their indicator boxes follow the upstream/downstream role to whichever context is now in that role).
- Double-click does nothing for symmetric relationships (Partnership: no arrow rendered, so the hit area's `cursor` is the default).
- Double-click does nothing for Shared Kernel relationships (no arrow line exists; SK is overlap-only).
- Single-click behavior is unchanged: still selects the relationship.

**Files likely affected**:
- `src/components/edges/RelationshipEdge.tsx` (add `onDoubleClick` to the hit-area path that calls the existing `swapRelationshipDirection` from the store)

**What does NOT change in this slice**:
- Picker UI (Slice 4 owns the picker direction control)
- Right-click context menu Swap Direction action (unchanged, still functional)

**Dependencies**: Slice 4 (so the picker reflects the change; not strictly required but releases together better)

**Implementation note**: the `swapRelationshipDirection` action and `ArrowLeftRight` icon already exist; this slice is small, on the order of 10 lines plus tests.

---

## Slice 6 — Shared Kernel creation by overlap

**User behavior**: A user can create a Shared Kernel relationship by dragging one context's body until it overlaps another. If a relationship already exists between them, they are prompted to convert it.

**Acceptance criteria**:
- Given two contexts with no relationship between them, when the user drags one context's body until its bounding box overlaps the other, then a Shared Kernel relationship is created (`pattern: 'shared-kernel'`).
- Given two contexts with an existing relationship (non-SK), when the user drags one to overlap the other, then a confirmation prompt appears explaining the change; confirming sets `pattern: 'shared-kernel'` and clears per-side roles.
- Given a relationship is already Shared Kernel, when the user moves a context while preserving overlap, then nothing changes (no prompt, no re-creation).
- Picking Shared Kernel in some other way (e.g., from a future SK-specific control) snaps the contexts to overlap, consistent with this gesture.

**Files likely affected**:
- `src/components/canvas/*` (body-drag detection, overlap detection, gesture wiring)
- `src/model/store.ts` (creation/update actions for SK)
- `src/model/sync/*` (SK as an entity per `contextflow-cqi`'s decisions)

**Reminders for the implementer**:
- **Analytics**: Shared Kernel creation by overlap, and conversion from existing relationship to SK (with the confirm), each fire tracked events per `docs/ANALYTICS_USAGE_GUIDE.md`.

**What does NOT change in this slice**:
- Non-SK relationships are unaffected by body-drag
- Existing relationship-creation gesture (drag from stub) is unchanged

**Dependencies**: `contextflow-cqi` (Shared Kernel as an entity, with overlap rendering) must land first. The gesture in this slice produces the entity that `cqi` introduces.

---

## Slice 7 — Auto-Partnership on Shared Kernel separation

**User behavior**: When the user drags Shared Kernel contexts apart so they no longer overlap, the relationship automatically becomes Partnership.

**Acceptance criteria**:
- Given a Shared Kernel relationship between two overlapping contexts, when the user drags one context until the bounding boxes no longer overlap, then `pattern` becomes `'partnership'` (no confirmation), per-side roles remain unset, and the edge renders as a Partnership line.
- Given a Shared Kernel relationship, when the user moves a context but the bounding boxes still overlap, then no change occurs.
- The Mutually Dependent influence is preserved (consistent with the auto-fall-back semantics: dragging apart removes the shared kernel but does not assert that the relationship is no longer mutual).

**Files likely affected**:
- `src/components/canvas/*` (post-drag overlap check)
- `src/model/store.ts` (transition action)

**Reminders for the implementer**:
- **Analytics**: auto-conversion from Shared Kernel to Partnership on separation fires a tracked event per `docs/ANALYTICS_USAGE_GUIDE.md`.

**What does NOT change in this slice**:
- Other relationship types are unaffected by drag-apart
- The user can still pick something else in the picker after the auto-conversion

**Dependencies**: Slice 6, `contextflow-cqi`

---

## Slice 8 — Migrate old pattern values (Phase 2)

**User behavior**: Existing projects with old-format pattern values continue to work and quietly migrate to the new model. Built-in example projects render correctly without runtime migration.

**Acceptance criteria**:
- Given a project loaded from IndexedDB with a relationship that has `pattern: 'open-host-service'`, when the project is opened, then the relationship is migrated to have `upstreamRole: 'open-host-service'` and `pattern: undefined`; the migration is persisted on next save.
- Given a project loaded from Yjs with a relationship that has `pattern: 'separate-ways'`, then the relationship is removed (deletion, not conversion).
- Given a project loaded with `pattern: 'shared-kernel'`, then a Shared Kernel entity is created between the two contexts and the relationship is removed.
- Given the built-in example projects (`cbioportal`, `elan-warranty`), they load with the new model and render correctly without any runtime migration prompts.
- Multiplayer version-skew: an old client and new client editing the same project do not corrupt each other's data.

**Files likely affected**:
- `src/model/types.ts` (narrow `pattern` type to `'customer-supplier' | 'partnership'` — Shared Kernel becomes its own entity per `cqi`)
- `src/model/sync/relationshipMigration.ts` (new; pure migration function)
- `src/model/sync/relationshipSync.ts` (apply migration on read with write-back inside transaction)
- `src/model/persistence.ts` (apply migration in `migrateProject` for IndexedDB)
- `examples/cbioportal.project.json` and `examples/elan-warranty.project.json` (update to new format)
- `src/model/conceptDefinitions.ts` (remove `separate-ways` from `RELATIONSHIP_PATTERNS`)

**What does NOT change in this slice**:
- Phase 1 fallback rendering can be removed only after this slice ships
- New project creation has been working with the new model since Slice 1

**Dependencies**: Slices 1, 2, 3, 6, 7, `contextflow-cqi`

**Risk note**: this slice concentrates the breaking-change risk (narrowing `pattern` type), but ships under less pressure since the user-facing capability has been working since Slice 5.

---

## Sequencing and shipping

Slices 1-5 are **independent** of `contextflow-cqi` and can ship sequentially. Slice 5 is the last slice that delivers user-visible value without requiring `cqi`.

Slices 6-7 require `contextflow-cqi` to have landed (Shared Kernel as an entity with overlap rendering). They should be picked up after `cqi` ships.

Slice 8 is migration cleanup; it ships under no pressure once everything else works.

Each slice should land as its own PR with the BDD scenarios as new integration tests.
