# UX Guidelines

This document defines the **user experience principles, interaction semantics, and visual conventions** for the ContextFlow application.  
It specifies *how* users interact with and perceive the system.

## Purpose

ContextFlow is a **visual facilitation and analysis tool** for mapping bounded contexts, their relationships, and team ownership within complex software systems.

Its UX must make these maps:
- **Intuitive** — easy to draw, move, and interpret.
- **Expressive** — visually encode key DDD semantics (core, supporting, generic; strong/weak boundaries, etc.).
- **Lightweight** — no friction or ceremony for users.
- **Professional** — suitable for use in consulting, workshop, or executive settings.

The UX is inspired by **Miro**, **Wardley Maps**, and the **Linear** aesthetic: minimal, elegant, and focused.

## Design Philosophy

> "Map what *is*, not what *should be* — and make that map effortless to navigate."

1. **The diagram is the UI.**
   The canvas is the primary interface; all interaction should feel natural and immediate.

2. **Clarity over decoration.**
   Visual language communicates meaning (color, shape, border) without excess styling.

3. **Show only meaningful information.**
   Don't display UI elements or empty states that provide no value to the user. If there's nothing useful to show, hide it.

4. **Direct manipulation.**
   Users should never feel constrained — moving, resizing, and editing should feel smooth and reversible.

5. **Respect cognitive flow.**
   The user's focus moves from *overview → detail* naturally; no hidden hierarchies.

6. **Facilitator-first.**
   Optimized for domain mapping conversations, not data entry.

## Interaction Semantics

### Canvas Behavior
- **Pan & Zoom:** Standard trackpad/mouse gestures via React Flow.
- **Drag Context:** Moves a bounded context node.
  - Horizontal drag → changes X coordinate for current view (Value Stream/Distillation/Strategic).
  - Vertical drag → changes Y coordinate (shared between Value Stream and Strategic; independent for Distillation).
- **Multi-select:** Shift+click or Cmd/Ctrl+click to select multiple contexts. Drag to move as a group with maintained relative positions. Multi-selection surfaces the "Create Group" floating panel.
- **Drag-to-connect:** Click and drag from one context's handle to another to create a relationship edge. Visual feedback: dashed blue line while dragging, pulsing target handles on hover.
- **Select Entity:** Click context/relationship/group/actor/user need to open Inspector Panel (right sidebar).
- **Deselect:** Click empty canvas or press `Esc`.
- **Undo/Redo:** Cmd/Ctrl+Z, Cmd/Ctrl+Shift+Z (or the TopBar buttons) for structural changes (add/move/delete context, relationships, repo assignments, groups, keyframes) and Inspector text edits.
- **Autosave:** Changes sync to cloud automatically via Yjs. No save confirmation is shown; mutations reflect immediately in the UI.

### Keyboard Shortcuts
- **Cmd/Ctrl+Z:** Undo
- **Cmd/Ctrl+Shift+Z:** Redo
- **Esc:** Deselect all
- **Delete:** Delete selected edge
- **Cmd/Ctrl+?:** Show keyboard shortcuts modal
- **Shift+click / Cmd/Ctrl+click:** Multi-select contexts
- **Scroll / Pinch:** Zoom canvas
- **Click+Drag (empty area):** Pan canvas

### Context Menus (Right-Click)
Right-click menus appear on specific elements only:
- **Relationship edges:** Delete relationship, swap direction (reverse arrow).
- **Timeline keyframes:** Duplicate keyframe, delete keyframe.
- **Context nodes (temporal mode only):** Hide/show in current keyframe. Only available when editing a keyframe in Strategic View.

### View Modes
Synchronized views of the same system model:

- **Context Map View (default for new projects):** Bounded contexts and their relationships only, with value-stream scaffolding (users, needs, stages, value-chain axis) hidden. Shares Flow's coordinate space, so positions stay consistent when switching views. New projects start here; existing projects reopen to their last view.
- **Value Stream View:** X-axis = configurable flow stages (e.g., Discovery → Selection → Purchase → Fulfillment). Shows how value flows through the system. Stages are editable via TopBar.
- **Distillation View:** X-axis = Business Differentiation (low → high), Y-axis = Model Complexity (low → high). Core Domain Chart for classifying domains (core/supporting/generic).
- **Strategic View:** X-axis = Wardley evolution (Genesis → Custom-built → Product → Commodity). Shows three-layer value chain: Actors → User Needs → Contexts.
- Toggle via top bar button. View transitions animate smoothly.

### Drag-and-Drop
Three drag patterns exist in the app:
- **Repo → Context:** Drag a repo from the left sidebar onto a context node to assign it. Uses MIME type `application/contextflow-repo`. Visual feedback: blue border highlight on the target node.
- **Team → Context:** Drag a team from the Teams tab onto a context node to assign it. Uses MIME type `application/contextflow-team`. Same visual feedback. Cannot assign to external contexts.
- **Connection drag:** Drag from a node handle to create a relationship (see Canvas Behavior above).

### Relationships
- **Curved edges (Bezier)** auto-routed around nodes.
- Arrows point toward **upstream** contexts (semantic direction).
- Non-directional (shared kernel, partnership) edges have no arrow.
- Hovering an edge shows pattern name (e.g., "Conformist").
- Click edge to select and edit in Inspector Panel (pattern type, communication mode, description).
- Right-click edge for quick actions (delete, swap direction).

### Strategic View Value Chain
- **Actors:** Octagonal nodes at top of canvas. Represent users/stakeholders of the map. Connect to User Needs below.
- **User Needs:** Rounded rectangular nodes in middle layer. Represent problems/jobs to be done. Connect Actors to Contexts.
- **Contexts:** Standard bounded context nodes at bottom. Positioned on evolution axis (X) and value chain (Y).
- **2-hop highlighting:** Selecting an Actor highlights connected Needs and their Contexts. Selecting a Need highlights its Actor and Contexts.
- Visual hierarchy: Actor → Need connections (thin, subtle) vs Need → Context connections (standard weight).

### Temporal Evolution
- **Timeline slider:** Appears at bottom of canvas when temporal mode is enabled. Shows keyframes as markers along timeline.
- **Keyframe scrubbing:** Drag slider to move through timeline. Canvas interpolates between keyframes smoothly.
- **Playback controls:** Play/pause button for animated playback through all keyframes.
- **Keyframe management:** Add keyframe (captures current state), delete keyframe, jump to specific keyframe.
- **Visual feedback:** Timeline marker highlights current position.
- **Undo/redo support:** Keyframe creation/deletion is undoable.

### Groups (Capability Clusters)
- **Organic blob rendering:** Groups use Catmull-Rom curve smoothing to create natural, blob-shaped boundaries around member contexts.
- **Visual styling:** Translucent fill with colored border. Label and optional note displayed inside group boundary.
- **Non-destructive deletion:** Deleting a group removes only the visual hull; member contexts remain on canvas.
- **Membership management:** Add/remove contexts individually or in batch operations. Groups can overlap (multiple groups covering same canvas area).
- **Selection and editing:** Click group to select and edit in Inspector Panel (name, note, color).

### Canvas Overlays
Floating labels that render above nodes at the React Flow viewport level:
- **TeamLabelsOverlay:** Team badges above context nodes (team topology icons + short labels). Clickable.
- **IssueLabelsOverlay:** Issue cards below context nodes. Severity-based colors (critical: red, warning: yellow, info: blue). Limited to 3 visible per context with "+N remaining" count.
- Both overlays hide when `zoom < 0.4` to reduce clutter at overview zoom levels. Labels scale dynamically with zoom.
- Toggled via Settings (View Options): `showTeamLabels`, `showIssueLabels`.

## Visual Language

| Property | Meaning | Visual Encoding |
|-----------|----------|-----------------|
| **Fill color** | Strategic classification or ownership | **By classification (default):** Core → soft gold `#f8e7a1`, Supporting → pale blue `#dbeafe`, Generic → light gray `#f3f4f6`<br>**By ownership:** Ours → green `#d1fae5`, Internal → blue `#dbeafe`, External → orange `#fed7aa`. Toggle via Settings (View Options). |
| **Border style** | Boundary integrity | Strong → thick solid<br>Moderate → medium solid<br>Weak → dotted |
| **Node size** | Codebase size / complexity | tiny → huge (progressively larger radius) |
| **Badges** | Metadata indicators | Legacy badge (neutral styling, no red)<br>"External" pill + dashed border with ring |
| **Groups** | Capability clusters | Organic blob-shaped hulls (Catmull-Rom smoothing) with label + note. Translucent fill, colored border. Deleting a group does not delete member contexts. |

## Layout and Composition

| Area | Purpose | Notes |
|-------|----------|-------|
| **Top Bar** | View toggle, project switcher, flow stage editor, temporal controls | Light background, minimal icons |
| **Left Sidebar** | Repos and Teams (tabbed, Teams first) | Always reachable (renders even on an empty project). Each tab: pinned filter header (name search + filter chips) and pinned add control, with only the card list scrolling between. Uniform full-width cards, in-place add, delete, and click-to-select an inspector. Collapses to a floating control naming both tabs. Repos show CodeCohesion API stats when available; both support drag-to-assign onto contexts. |
| **Center Canvas** | Main map visualization | Infinite plane, pan/zoom enabled |
| **Right Sidebar (Inspector)** | Entity details | Edit context/relationship/group/actor/user need properties |
| **Background Grid** | View-specific axes | Subtle gridlines + axis labels. Changes based on current view. |
| **Timeline Slider** | Temporal evolution controls | Bottom of canvas when temporal mode enabled. Keyframe scrubbing + playback. |

**Axes**
- **Value Stream View:**
  - X-axis: User-defined flow stage labels (e.g., "Discovery", "Selection", "Purchase", "Fulfillment"). Editable via TopBar.
  - Y-axis: Shared value chain position (top → bottom).
- **Distillation View:**
  - X-axis: Business Differentiation (low → high).
  - Y-axis: Model Complexity (low → high).
  - Quadrant labels: Generic (low/low), Supporting (mixed), Core (high/high).
- **Strategic View:**
  - X-axis: Wardley evolution stages ("Genesis", "Custom-Built", "Product/Rental", "Commodity/Utility").
  - Y-axis: Shared value chain position (top → bottom).
  - Three vertical layers: Actors (top), User Needs (middle), Contexts (bottom).

## Component Roles

| Component | Responsibility |
|------------|----------------|
| **CanvasArea.tsx** | Render nodes (contexts/actors/user needs), relationships, and groups via React Flow |
| **InspectorPanel.tsx** | Display and edit metadata for selected entity (context/relationship/group/actor/user need) |
| **RepoSidebar.tsx** | List, filter (by status), add, select, delete, and drag-assign repositories. Click a card to open the Repo inspector. Show CodeCohesion API stats. |
| **RepoInspector.tsx** | Edit a selected repo: name, remote URL, assigned context, owning teams (chips), delete |
| **SidebarFilterChips.tsx** | Shared filter-chip row for the Teams (topology) and Repos (status) panels |
| **TopBar.tsx** | Global controls: view toggle, project switcher, flow stage editor, temporal mode toggle |
| **TimelineSlider.tsx** | Keyframe management, scrubbing, and playback controls |
| **App.tsx** | Layout composition, responsive sizing, and entity selection routing to Inspector |
| **ProjectListPage.tsx** | Landing page with project list, creation, and example loading |
| **TeamSidebar.tsx** | List, filter (by topology), add, select, delete, focus, and drag-assign teams (left sidebar is tabbed, Teams then Repos) |

## Tooltips

Three tooltip patterns, each for a different purpose:

| Component | Use Case | Delay | Gated by Setting? |
|-----------|----------|-------|--------------------|
| **SimpleTooltip** | Quick text hints (repo URLs, team names, button labels) | None (instant) | No |
| **InfoTooltip** | Educational DDD/Wardley concept explanations | None | Yes (`showHelpTooltips`) |
| **Context node hover** | Node metadata summary on canvas | 500ms | Yes (`showHelpTooltips`) |

- **SimpleTooltip**: Use for any short, non-educational label. Positioned via portal with viewport bounds detection.
- **InfoTooltip**: Requires a `ConceptDefinition` object (title, description, characteristics). Renders a larger box (w-64) with structured content. Only appears when `showHelpTooltips` is enabled in Settings.
- **Context node hover tooltip**: Custom portal in `ContextNode.tsx`, uses `contextTooltip.ts` for text. The 500ms delay prevents noise during dragging.
- **Never use native `title` attribute** (has browser-imposed delay, inconsistent styling).

## Dialogs and Modals

### Action Dialogs
Used for user decisions and data entry. Consistent structure:
- Fixed overlay (`bg-black/50`, `z-50`)
- White card with dark mode variant (`dark:bg-neutral-800`)
- Header with title and X close button; optional icon (AlertTriangle for destructive, AlertCircle for warnings)
- Footer with action buttons: red for destructive actions, blue for primary, gray for cancel

Examples: ProjectCreateDialog, ProjectDeleteDialog, ImportConflictDialog, ShareProjectDialog.

### Educational Modals
Larger modals for learning, not decisions. Include diagrams, step-by-step guides, or reference material.

Examples: GettingStartedGuideModal (two learning approaches with tip boxes), ValueChainGuideModal (SVG diagram of Actor/Need/Context model), PatternsGuideModal (DDD pattern categories), KeyboardShortcutsModal.

### Contextual Help
- **ConnectionGuidanceTooltip**: Appears at the connection point when a user attempts an invalid connection. Auto-dismisses after 6 seconds or on outside click. Not a modal.

## User Feedback Patterns

The app intentionally avoids toast notifications:
- **Autosave is silent.** Mutations reflect immediately in the UI. No "saved" confirmation.
- **Destructive actions use browser `confirm()`.** Delete context, relationship, project, etc. all prompt via the native confirm dialog.
- **Inline feedback in dialogs.** ShareProjectDialog shows "Link copied!" via button state change, not a toast.
- **Undo/redo is implicit.** The UI state changes; no notification is shown.

If adding a new feature, follow this pattern. Do not introduce toast/snackbar infrastructure.

## Settings and Preferences

Accessible via the gear icon in TopBar. Three categories:

- **Display**: Dark mode toggle (persisted to localStorage via `useTheme` hook).
- **Help**: Getting Started link, keyboard shortcuts link, `showHelpTooltips` toggle (gates InfoTooltip and context node hover tooltips), anonymous analytics toggle.
- **View Options**: Per-view toggles for showing/hiding groups, relationships, issue labels, team labels, color mode (classification vs. ownership), etc.
- **Integrations**: CodeCohesion API key configuration for codebase analysis data.

## Aesthetic Guidelines

- Neutral tone (white, gray, muted blue).
- Rounded corners, soft shadows, generous spacing.
- Typography: system sans-serif (SF Pro / Inter).
- No bright accent colors — highlight meaning through shape and line weight.
- lucide-react icons for consistency.
- Subtle transitions (Framer Motion) for node movement and mode switch.
- Full dark mode via Tailwind `dark:` classes. Toggle in Settings, persisted to localStorage. Use neutral/slate palette for dark backgrounds (`dark:bg-neutral-800`, `dark:text-slate-100`).

## Persistence and Behavior

- **Cloud-first persistence:** Yjs + Cloudflare Durable Objects with automatic sync. IndexedDB used only for migration backup.
- **Multi-project support:** Project switcher dropdown in TopBar. Each project has isolated state.
- **Undo/redo history:** Per project session. Applies to structural changes (add/move/delete context, relationships, repo assignments, groups, keyframes) and Inspector text edits. Text fields autosave on every keystroke, and each keystroke is a separate undo step.
- **Import/export:** JSON format for project data. No YAML or other formats in current version.
- **CodeCohesion API:** Optional integration for live repository statistics and contributor data.

## Accessibility and Usability

- Sufficient contrast for all text and borders.
- Visual indicators (border highlight) for selected elements.
- All controls accessible via keyboard.
- Descriptive tooltips for relationships and context labels.
- Avoid visual clutter; prioritize information density balance.

## Future UX Enhancements

- **Filtering and highlighting:** Filter canvas by team, ownership, or relationship type.
- **Alignment guides:** Visual guides and snapping for precise node positioning.
- **Auto-layout options:** Automatic graph layout algorithms for large maps.
- **Context-level comments:** Inline annotations and discussion threads.
- **Enhanced accessibility:** Screen reader support, keyboard-only navigation improvements.
