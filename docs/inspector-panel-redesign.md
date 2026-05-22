# Inspector Panel Redesign - Context Inspector

## Evaluation Notes

1. **Connected Users placement**: The doc puts Connected Users after Purpose, but current order (Name, Connected Users, Purpose) is better. Users connected to a context are part of its identity; seeing them before the purpose gives immediate context about who cares. Keep the current order.

2. **Teams appear in two sections**: Repo-derived teams (read-only display under Purpose) and the `teamId` assignment dropdown (in Team & Organization) are two different things. The doc doesn't distinguish these. The repo-derived team display should stay near repos in Codebase, or be removed since it's redundant with repo cards showing team info.

3. **PropertyRow `w-24` label width is too narrow**: "Boundary Integrity" won't fit in 96px. Use `w-28` or `min-w-fit whitespace-nowrap` so labels size to content while controls take remaining space.

4. **Classification + Evolution empty state**: The doc describes badges with tiny labels but doesn't address the "Not classified" fallback. The redesign should show a muted placeholder row when neither is set, or hide the section.

5. **Boundary Notes conditional display is a behavioral change**: The doc says "only if boundary is set," but current code always shows the textarea. Minor behavioral change, not purely layout.

6. **Groups label missing from doc details**: The doc says "label on top, chips below" but doesn't specify whether to use `FIELD_LABEL_CLASS` or `Section` for the label.

7. **SectionDivider may be too subtle**: `border-slate-100` in light mode is nearly invisible. Current delete-button divider uses `border-slate-200` with better contrast. Use `border-slate-200 dark:border-neutral-700` for section dividers too, with lighter `pt-4` spacing to differentiate from the danger zone divider.

8. **Toggle grid loses help icons**: Putting Legacy and Big Ball of Mud in a 2-column grid saves space but the doc doesn't address where the `InfoTooltip` help icons go. Each toggle needs its own help icon within the grid cell.

9. **Future consideration: collapsible sections**: Section headers could be clickable to collapse/expand groups. The panel is long when fully populated. Out of scope for this pass but worth considering.

## Problem

The ContextInspector panel (right sidebar, shown when a bounded context is selected) has evolved organically over time. It currently has ~20 distinct sections rendered as a flat list with uniform spacing, inconsistent labeling patterns (some use the `Section` component, others use inline labels, others have no label at all), misaligned controls, and no visual grouping. The result feels unprofessional and hard to scan.

## Mockup

Open [inspector-panel-mockup.html](inspector-panel-mockup.html) in a browser to see the current vs proposed layout side by side.

## Goal

Reorganize the panel into clear, visually grouped sections with consistent styling, better information hierarchy, and a polished Linear-inspired aesthetic, while preserving all existing functionality.

## Design Direction

**Refined minimalism**, inspired by Linear and Figma's property panels:
- Subtle section dividers (thin border lines) to create clear visual groups
- **Pill groups for enum fields, not dropdowns.** Every option visible without a click. Boundary pills preview the border treatment the node will get; Code Size pills include a scaled dot hinting at relative node size. Team picker stays a dropdown because it is not a fixed enum.
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
- **Business Model Role** pill group (2x2 grid: Revenue / Engagement / Compliance / Cost Reduction)

### 3. Team & Organization (divider + section header)
- **Ownership** pill group (Our Team / Internal / External), full width row, active = green
- **Team** assignment dropdown (hidden when ownership is External; stays a dropdown because team list is user-defined)
- **Groups** membership chips (label on top, chips below; with remove)

### 4. Codebase (divider + section header)
- **Repos** cards (with add/unassign)
- **Code Size** pill group (3+2 grid: Tiny / Small / Medium on row 1, Large / Huge on row 2; each pill includes a scaled dot)
- **Boundary Integrity** pill group (3 pills: Weak / Moderate / Strong; each pill previews the border treatment, dotted/thin/thick) + **Boundary Notes** textarea directly below (only if boundary is set)
- **Legacy** + **Big Ball of Mud**, two toggles in a compact 2-column grid

### 5. Notes & Issues (divider + section header)
- **Notes** textarea
- **Issues** list with severity buttons + add

### 6. Relationships (divider + section header)
- Upstream / Downstream / Mutual groups
- Add Relationship button

### Danger Zone (divider, no header)
- Delete Context button

### Temporal Position
- Conditionally inserted after Strategic Profile when temporal mode is active (same as current behavior)

## Implementation Details

### Files to modify

1. **`src/components/inspector/inspectorShared.tsx`** - Add shared layout components:
   - `FIELD_LABEL_CLASS` - consistent inline field label styling
   - `SectionDivider` component - thin horizontal rule between groups
   - `PillGroup` component - generic pill selector for enum fields, accepts options with optional preview adornment (border swatch, scaled dot, etc.), active variant per field (green for Ownership/Role, slate for Code Size/Boundary)
   - `SELECT_CLASS` - standardized native select styling, retained for the Team picker

2. **`src/components/inspector/ContextInspector.tsx`** - Reorganize the JSX:
   - Wrap related items in visual groups with `SectionDivider` between them
   - Replace Ownership, Role, Code Size, and Boundary `<select>` elements with `PillGroup` instances
   - Keep Team as a `<select>` (uses `SELECT_CLASS`)
   - Reorder sections per the hierarchy above
   - Replace inline label styles with `FIELD_LABEL_CLASS`
   - Move classification + evolution badges to a single row with subtle labels
   - Move Legacy + Big Ball of Mud toggles into a compact grid

### Files NOT modified
- Other inspectors (GroupInspector, RelationshipInspector, etc.), out of scope
- Store, types, mutations, no behavioral changes
- Tests, layout-only change, no logic changes

## Key Design Details

### Section Dividers
Thin horizontal rule: `border-t border-slate-100 dark:border-neutral-700/50` with `pt-4` padding above the next section. Lighter than the current delete-button divider to feel subtle.

### Pill Groups
Each pill: `px-2 py-1 text-[11px] font-medium rounded`, default `bg-slate-100 text-slate-600`, active variant adds `ring-1` and a colored background (green-100 for Ownership/Role, slate-200 for Code Size/Boundary). Field label sits above the pill row (`text-xs text-slate-500 mb-1`) with the help-icon inline next to it. Pills may include a small leading adornment:
- **Boundary**: 14x10px swatch previewing the border treatment (`bp-weak` dotted 1.5px, `bp-mod` solid 2px, `bp-strong` solid 3px)
- **Code Size**: square dot scaled from 6px (Tiny) to 14px (Huge) to hint at the relative node size on the canvas

### Pill Grid Layouts
- **Ownership** (3): horizontal `flex gap-1.5` with `flex-1` on each pill so they stretch full width
- **Role** (4): `grid grid-cols-2 gap-1.5`, labels abbreviated (Revenue / Engagement / Compliance / Cost Reduction)
- **Code Size** (5): `grid grid-cols-3 gap-1.5` (3+2)
- **Boundary** (3): `grid grid-cols-3 gap-1.5`

### Team Picker
Stays as a full-width `<select>` (uses `SELECT_CLASS`), since the team list is user-defined and not a fixed enum.

### Toggle Grid
Legacy and Big Ball of Mud rendered in a `grid grid-cols-2 gap-3` layout instead of stacked vertically, saving vertical space.

### Classification + Evolution Row
Both badges rendered in a single `flex flex-wrap gap-2` row. Each badge gets a tiny inline label above it: "Domain" and "Evolution" in `text-[10px] text-slate-400 uppercase tracking-wider`.

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
