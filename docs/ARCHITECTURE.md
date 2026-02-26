# Architecture

## Overview
ContextFlow is a browser-based React application for mapping bounded contexts, their strategic relationships, and their code ownership.
It presents three synchronized projections of the same model: Flow View, Distillation View, and Strategic View.

The core of the app is:
- A canvas (React Flow) that renders nodes/edges/groups and allows drag interactions
- Side panels for details and editing
- Import/export/autosave around a single `Project` data structure

This document defines how we build it.

---

## Tech stack decisions
- Language: TypeScript
- UI framework: React
- Runtime/build: Vite (simple local dev, runs in browser)
- Styling: Tailwind CSS
- UI primitives: shadcn/ui (Radix-based, accessible, modern aesthetic)
- Icons: lucide-react
- Canvas / graph rendering: React Flow
  - Handles pan/zoom, nodes, edges, selection
- Animation: Framer Motion
  - Smoothly animate node horizontal position when switching Flow ↔ Strategic views
- State: Zustand store for editor state (read-only projection of Yjs)
- Persistence: Yjs + Cloudflare Durable Objects for real-time cloud sync
- Collaboration: Yjs CRDT for conflict-free real-time editing
- Backend: Cloudflare Workers with y-partyserver for WebSocket sync

---

## Data model

```ts
export type IssueSeverity = 'info' | 'warning' | 'critical';

export interface Issue {
  id: string;
  title: string;
  description?: string;
  severity: IssueSeverity;
}

export type ContextOwnership = 'ours' | 'internal' | 'external';

export interface Project {
  id: string;
  name: string;
  version?: number;
  isBuiltIn?: boolean;
  createdAt?: string;
  updatedAt?: string;

  contexts: BoundedContext[];
  relationships: Relationship[];
  repos: Repo[];
  people: Person[];
  teams: Team[];
  groups: Group[];
  users: User[];
  userNeeds: UserNeed[];
  userNeedConnections: UserNeedConnection[];
  needContextConnections: NeedContextConnection[];

  viewConfig: {
    flowStages: FlowStageMarker[];
  };

  temporal?: {
    enabled: boolean;
    keyframes: TemporalKeyframe[];
  };
}

export interface BoundedContext {
  id: string;
  name: string;
  purpose?: string;

  strategicClassification?: 'core' | 'supporting' | 'generic';
  ownership?: ContextOwnership;

  boundaryIntegrity?: 'strong' | 'moderate' | 'weak';
  boundaryNotes?: string;

  positions: {
    strategic: { x: number };               // Strategic View horizontal (0..100)
    flow: { x: number };                    // Flow View horizontal (0..100)
    distillation: { x: number; y: number }; // Distillation View 2D position (0..100)
    shared: { y: number };                  // vertical (0..100), shared across Flow/Strategic views
  };

  evolutionStage: 'genesis' | 'custom-built' | 'product/rental' | 'commodity/utility';

  codeSize?: {
    loc?: number;
    bucket?: 'tiny' | 'small' | 'medium' | 'large' | 'huge';
  };

  isLegacy?: boolean;
  isBigBallOfMud?: boolean;

  businessModelRole?: 'revenue-generator' | 'engagement-creator' | 'compliance-enforcer' | 'cost-reduction';

  notes?: string;
  issues?: Issue[];
  teamId?: string; // direct team assignment (orthogonal to repo ownership)
}

export interface Relationship {
  id: string;

  // Arrow points to upstream (the one with more power / defines language)
  fromContextId: string; // downstream / dependent
  toContextId: string;   // upstream / authority

  pattern:
    | 'customer-supplier'
    | 'conformist'
    | 'anti-corruption-layer'
    | 'open-host-service'
    | 'published-language'
    | 'shared-kernel'
    | 'partnership'
    | 'separate-ways';

  communicationMode?: string;
  description?: string;
}

export interface Repo {
  id: string;
  name: string;
  remoteUrl?: string; // clickable in UI

  contextId?: string;    // which bounded context this repo supports
  teamIds: string[];     // which teams own prod responsibility

  contributors: ContributorRef[];

  analysisSummary?: string; // optional future analysis output
}

export interface ContributorRef {
  personId: string;
}

export interface Person {
  id: string;
  displayName: string;
  emails: string[];
  teamIds?: string[];
}

export interface Team {
  id: string;
  name: string;
  jiraBoard?: string; // clickable if looks like URL
  topologyType?: 'stream-aligned' | 'platform' | 'enabling' | 'complicated-subsystem' | 'unknown';
}

export interface Group {
  id: string;
  label: string;        // e.g. "Data Platform / Ingestion"
  color?: string;       // translucent tint for hull
  contextIds: string[]; // members
  notes?: string;
}

export interface FlowStageMarker {
  name: string;         // e.g. "Data Ingestion"
  position: number;     // 0..100 along Flow View X axis
  description?: string; // shown in hover tooltip and inspector
  owner?: string;       // team/person responsible for this stage
  notes?: string;       // freeform notes
}

export interface User {
  id: string;
  name: string;
  description?: string;
  position: number;     // 0..100 along Strategic View X axis (horizontal only)
  isExternal?: boolean; // external users outside the organization
}

export interface UserNeed {
  id: string;
  name: string;
  description?: string;
  position: number;     // 0..100 along evolution axis (horizontal only)
  visibility?: boolean; // can be hidden without deleting
}

export interface UserNeedConnection {
  id: string;
  userId: string;
  userNeedId: string;
  notes?: string;
}

export interface NeedContextConnection {
  id: string;
  userNeedId: string;
  contextId: string;
  notes?: string;
}

export interface TemporalKeyframe {
  id: string;
  date: string; // Year or Year-Quarter: "2027" or "2027-Q2"
  label?: string;

  // Strategic View positions only
  positions: {
    [contextId: string]: {
      x: number; // Evolution axis (0-100)
      y: number; // Value chain proximity (0-100)
    };
  };

  // Which contexts exist at this point in time
  activeContextIds: string[];
}
```

### Semantics to respect
- `strategicClassification` → bubble fill color
  - core → soft gold
  - supporting → pale blue
  - generic → light gray
- `boundaryIntegrity` → border style
  - strong → thick solid
  - moderate → medium solid
  - weak → dashed / porous
- `codeSize.bucket` → node radius (`tiny`..`huge` → progressively larger)
- `isLegacy` → show a ⚠ Legacy badge in the corner of the node
- `ownership` → when set to `'external'`, show an “External” badge and dotted outer ring, and disallow repo assignment
- `positions` drives layout:
  - Flow View uses `positions.flow.x` (horizontal) and `positions.shared.y` (vertical)
  - Strategic View uses `positions.strategic.x` (horizontal) and `positions.shared.y` (vertical)
- `relationships` arrow direction:
  - arrow points toward `toContextId` (upstream power)
  - `shared-kernel` / `partnership` should render as symmetric (no dominant arrowhead)

---

## Component layout

```txt
<App />
  <ProjectListPage />          // Project list, creation, and example loading
  <EditorView />               // Active board
    <TopBar />                 // view toggle, add context, fit-to-map, undo/redo, import/export
    <MainLayout />
      <RepoSidebar />          // Unassigned repos; drag to assign to a context
      <TeamSidebar />          // Team management (tabbed sidebar with RepoSidebar)
      <CanvasArea />           // React Flow canvas:
                               //   contexts, relationships, groups, axes
      <InspectorPanel />       // Edit selected context / relationship / group /
                               //   user / user need / connection / stage / team
    <RelationshipCreateOverlay /> // When creating new relationship by drag
    <GroupCreateOverlay />        // When creating a new group from multi-select
```

### `<TopBar />`
- Toggle `Flow View` / `Distillation View` / `Strategic View`
- Add Context
- Fit to Map
- Undo / Redo
- Import Project / Export Project
- Show active project name

### `<CanvasArea />`
- Renders nodes (bounded contexts)
  - fill color = `strategicClassification`
  - border style = `boundaryIntegrity`
  - badge if `isLegacy`
  - badge/dotted ring if `ownership` is `'external'`
  - radius = `codeSize.bucket`
- Renders edges (relationships)
  - curved bezier lines
  - arrowhead points to upstream (`toContextId`)
  - symmetric styling for `shared-kernel` / `partnership`
  - light obstacle avoidance so lines don't run straight through other nodes
- Renders groups as organic blobs
  - compute padded points around each member context (adds breathing room)
  - calculate convex hull of all padded points (finds outer boundary)
  - apply Catmull-Rom curve smoothing to hull vertices (creates organic edges)
  - generate SVG path and render as translucent blob with group label
  - algorithm: d3-polygon (hull) + d3-shape (curve interpolation)
  - allow overlapping blobs (multiple groups can cover the same canvas area)
  - blob shape recomputes dynamically when contexts move or view switches
- Renders axes
  - Flow View:
    - X axis = `project.viewConfig.flowStages`
    - Y axis label (top “user-facing / clinician-facing”, bottom “enabling / platform”)
  - Distillation View:
    - X axis = Business Differentiation (Low to High)
    - Y axis = Model Complexity (Low to High)
    - Quadrant regions: Generic (low differentiation), Supporting (high complexity or high differentiation but not both), Core (high differentiation and high complexity)
  - Strategic View:
    - X axis = Wardley bands (“Genesis / Custom-built / Product-Rental / Commodity / Utility”)
    - Y axis is unchanged
- Drag behavior
  - In Flow View:
    - horizontal drag updates `positions.flow.x`
    - vertical drag updates `positions.shared.y`
  - In Distillation View:
    - horizontal drag updates `positions.distillation.x`
    - vertical drag updates `positions.distillation.y` (independent 2D positioning, NOT shared Y)
  - In Strategic View:
    - horizontal drag updates `positions.strategic.x`
    - vertical drag updates `positions.shared.y`
- View switching
  - Uses Framer Motion to animate each node’s horizontal position when switching between Flow, Distillation, and Strategic views

### `<RepoSidebar />`
- Shows repos with no `contextId` (unassigned)
- Shows `name`, `remoteUrl` (as clickable if present), team chips
- Supports dragging a repo card onto a context bubble in `<CanvasArea />`
  - Drop assigns `repo.contextId`

### `<InspectorPanel />`
When a context is selected:
- Editable fields:
  - name
  - purpose
  - strategicClassification
  - boundaryIntegrity + boundaryNotes
  - codeSize.bucket
  - isLegacy
  - isBigBallOfMud
  - ownership
  - businessModelRole
  - evolutionStage (optional)
  - notes
- Repos assigned to this context:
  - show repo name (and clickable `remoteUrl`)
  - show team chips
    - hover/click team chip → show team details:
      - name
      - topologyType
      - jiraBoard (if looks like URL, clickable)
  - show contributors (people displayName)
- Relationships:
  - list upstream/downstream neighbors
  - label with DDD pattern (“conformist”, “customer-supplier”, etc.)

When a relationship is selected:
- pattern
- communicationMode
- description
- delete action

When a group is selected:
- label, tint color, notes
- add/remove contexts
- delete group

### `<RelationshipCreateOverlay />`
- Triggered by dragging from one context to another
- Choose pattern from allowed vocabulary
- Optional `communicationMode`
- Optional `description`
- Confirm → creates `Relationship`

### `<GroupCreateOverlay />`
- Triggered by multi-select
- Enter `label`, `notes`, `color`
- Confirm → creates `Group` and draws translucent hull

---

## Editor/global state

We maintain a Zustand store as a **read-only projection** of the Yjs document:

```ts
export type ViewMode = 'flow' | 'strategic' | 'distillation';

interface EditorState {
  activeProjectId: string | null;
  projects: Record<string, Project>;  // Populated from Yjs observers

  activeViewMode: ViewMode;

  // Selection state
  selectedContextId: string | null;
  selectedRelationshipId: string | null;
  selectedGroupId: string | null;
  selectedUserId: string | null;
  selectedUserNeedId: string | null;
  selectedUserNeedConnectionId: string | null;
  selectedNeedContextConnectionId: string | null;
  selectedStageIndex: number | null;
  selectedTeamId: string | null;
  selectedContextIds: string[];       // multi-select
  hoveredContextId: string | null;
  isDragging: boolean;

  canvasView: {
    flow: { zoom: number; panX: number; panY: number };
    strategic: { zoom: number; panX: number; panY: number };
    distillation: { zoom: number; panX: number; panY: number };
  };

  // View filters
  showGroups: boolean;
  showRelationships: boolean;
  showIssueLabels: boolean;
  showTeamLabels: boolean;
  showRelationshipLabels: boolean;

  // Help preferences
  showHelpTooltips: boolean;

  // UI preferences
  groupOpacity: number;
  colorByMode: 'strategic' | 'ownership';

  // Temporal state
  temporal: {
    currentDate: string | null;
    activeKeyframeId: string | null;
  };
}
```

**Key principle:** Yjs is the single source of truth. Zustand is updated via Yjs observers. All mutations go through Yjs, which then triggers observer callbacks to update Zustand.

**Undo/redo** uses Y.UndoManager:
- Scoped to user's own changes (like Figma/Miro)
- Ctrl+Z only undoes YOUR changes, not collaborator's
- Session-scoped (cleared on refresh)
- Applies to all structural actions (add/move/delete context, relationships, groups, etc.)

---

## Cloud Sync Architecture

**Data flow:**

```txt
User Action → Yjs Y.Doc → WebSocket → Cloudflare Durable Object
                ↓
           Observer callback
                ↓
           Zustand store → React components
```

**Key components:**

- **Yjs Y.Doc** – CRDT document, single source of truth for project data
- **y-partyserver provider** – WebSocket connection to Cloudflare
- **Cloudflare Workers + Durable Objects** – Serverless backend for sync
- **Zustand store** – Read-only projection updated via Yjs observers

**Persistence:**

- All projects sync to cloud by default (Cloudflare Durable Objects)
- IndexedDB used only for migration backup (legacy data from pre-cloud versions)
- No local-only projects; cloud sync is always enabled
- Export → download current `Project` as `project.json`
- Import → upload `project.json`, creates new cloud-synced project

**Offline behavior:**

- Brief disconnections handled automatically with reconnection backoff
- Session-only offline support (changes queue locally during disconnection)
- Refresh while offline shows blocking modal (must reconnect to continue)
- No persistent offline mode; cloud is required for data access

**Project sharing:**

- Projects are accessed via URL containing project ID
- Anyone with the URL can view and edit (Phase 1, no auth)
- Real-time collaboration: multiple users see changes immediately

**Migration:**

- Existing IndexedDB projects auto-migrate to cloud on first load
- Migration backup stored locally for 30 days before cleanup
- Cloud data verified before deleting local backup

---

## Visual rules summary
- Fill color:
  - `core` → soft gold
  - `supporting` → pale blue
  - `generic` → light gray
- Border style:
  - `strong` → thick solid
  - `moderate` → medium solid
  - `weak` → dashed / porous
- Legacy:
  - ⚠ badge in corner of node
- Ownership `'external'`:
  - Small “External” badge and dotted ring
  - Cannot assign repos to this node
- Group blobs:
  - Organic, smooth shapes wrapping around member contexts
  - Generated via convex hull + Catmull-Rom curve smoothing
  - Translucent fill with adjustable opacity (slider in TopBar)
  - Minimal or subtle dashed stroke for boundary definition
  - Label text positioned in blob center or near top-left
  - Groups can overlap (multiple blobs covering same canvas area)
  - Dynamic reshaping when contexts move, view switches, or membership changes

These rules are what devs and AI must follow when rendering.

---

## References

**Bounded Context model:**
- [Bounded Context Canvas](https://github.com/ddd-crew/bounded-context-canvas) by DDD Crew — the foundation for ContextFlow's bounded context attributes and metadata fields
