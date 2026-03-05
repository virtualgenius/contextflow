# Inspector Panel Redesign - Context Inspector

## Problem

The ContextInspector panel (right sidebar, shown when a bounded context is selected) has evolved organically over time. It currently has ~20 distinct sections rendered as a flat list with uniform spacing, inconsistent labeling patterns (some use the `Section` component, others use inline labels, others have no label at all), misaligned controls, and no visual grouping. The result feels unprofessional and hard to scan.

## Goal

Reorganize the panel into clear, visually grouped sections with consistent styling, better information hierarchy, and a polished Linear-inspired aesthetic, while preserving all existing functionality.

## Design Direction

**Refined minimalism**, inspired by Linear and Figma's property panels:
- Subtle section dividers (thin border lines) to create clear visual groups
- Consistent property-row layout: label on the left, control on the right
- Full-width controls within sections (no arbitrary `w-32` widths)
- Compact inline rows for toggles and small properties
- Every control gets a label; no orphaned badges floating without context

## Current Issues

1. **Inconsistent labeling**: Some sections use `Section` component, some use inline `<span>` labels, some have no label at all (classification badges, evolution badge, purpose textarea, groups, connected users)
2. **Misaligned controls**: Code/Boundary/Role selects use `w-32` fixed width with `w-16` labels; Team select uses `flex-1`; Ownership buttons have a separate label pattern
3. **No visual grouping**: All ~20 items render in a flat `space-y-5` list with no hierarchy
4. **Scattered related properties**: Legacy toggle, Big Ball of Mud toggle, Code Size, Boundary, and Boundary Notes are all related "technical properties" but appear as separate items with no grouping
5. **Classification and Evolution badges**: Appear as standalone items with no labels, unclear what they represent to new users

## Reorganized Section Order

The flat list of ~20 items is reorganized into 7 logical groups:

### 1. Identity (top, no header)
- **Name** (editable title input)
- **Purpose** (textarea, placeholder: "What does this context do?")
- **Connected Users** (user chips, only if connected)

### 2. Strategic Profile (divider + section header)
- **Classification** badge (Core/Supporting/Generic) + **Evolution** badge (Genesis/Custom/Product/Commodity), on a single row
- **Ownership** buttons (Our Team / Internal / External), full width row
- **Business Model Role** dropdown, full width with label

### 3. Team & Organization (divider + section header)
- **Team** assignment dropdown
- **Groups** membership chips (with remove)
- **Repos** cards (with add/unassign)

### 4. Technical Properties (divider + section header)
- **Code Size** + **Boundary Integrity**, two property rows, each label + dropdown, full width
- **Legacy** + **Big Ball of Mud**, two toggles in a compact 2-column grid
- **Boundary Notes** textarea (only if boundary is set)

### 5. Notes & Issues (divider + section header)
- **Notes** textarea
- **Issues** list with severity buttons + add

### 6. Relationships (divider + section header)
- Upstream / Downstream / Mutual groups
- Add Relationship button

### 7. Danger Zone (divider, no header)
- Delete Context button

### Temporal Position
- Conditionally inserted after Strategic Profile when temporal mode is active (same as current behavior)

## Implementation Details

### Files to modify

1. **`src/components/inspector/inspectorShared.tsx`** - Add shared layout components:
   - `SELECT_CLASS` - standardized native select styling (full-width)
   - `FIELD_LABEL_CLASS` - consistent inline field label styling
   - `SectionDivider` component - thin horizontal rule between groups
   - `PropertyRow` component - label + control on same line

2. **`src/components/inspector/ContextInspector.tsx`** - Reorganize the JSX:
   - Wrap related items in visual groups with `SectionDivider` between them
   - Use new shared components for consistent property rows
   - Reorder sections per the hierarchy above
   - Replace inline label styles with `FIELD_LABEL_CLASS`
   - Replace inline select styles with `SELECT_CLASS`
   - Move classification + evolution badges to a single row with subtle labels
   - Move Legacy + Big Ball of Mud toggles into a compact grid

### Files NOT modified
- Other inspectors (GroupInspector, RelationshipInspector, etc.), out of scope
- Store, types, mutations, no behavioral changes
- Tests, layout-only change, no logic changes

## Key Design Details

### Section Dividers
Thin horizontal rule: `border-t border-slate-100 dark:border-neutral-700/50` with `pt-4` padding above the next section. Lighter than the current delete-button divider to feel subtle.

### Property Rows
Two-column flex: label on left (`text-xs text-slate-500 dark:text-slate-400 w-24 flex-shrink-0`), control on right (`flex-1`). Consistent alignment across Code, Boundary, Role, Team fields.

### Toggle Grid
Legacy and Big Ball of Mud rendered in a `grid grid-cols-2 gap-3` layout instead of stacked vertically, saving vertical space.

### Classification + Evolution Row
Both badges rendered in a single `flex flex-wrap gap-2` row. Each badge gets a tiny inline label above it: "Domain" and "Evolution" in `text-[10px] text-slate-400 uppercase tracking-wider`.

### Ownership Buttons
Full-width `flex gap-1.5` row (already exists but currently has misaligned label). Label moves into Section header or PropertyRow.

## Verification

1. `npm run typecheck`, no type errors
2. `npm run lint`, no lint errors
3. `npm test`, all tests pass (no logic changes, but confirm nothing broke)
4. Visual verification in browser:
   - Select a context node with many properties filled in
   - Verify all sections render correctly
   - Verify all controls still function (edit name, change ownership, toggle legacy, etc.)
   - Check dark mode renders correctly
   - Verify temporal position section appears when in Strategic View with temporal enabled
   - Verify external contexts hide team assignment

## Scope

This is a layout-only change. No new features, no behavioral changes, no store/type/mutation modifications. The shared components added to `inspectorShared.tsx` could later be adopted by GroupInspector and RelationshipInspector for consistency, but that is out of scope here.
