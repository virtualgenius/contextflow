# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Note**: This project uses [bd (beads)](https://github.com/steveyegge/beads) for issue tracking during AI coding sessions. Use `bd` commands for tactical work tracking. Human-readable roadmap remains in [docs/TODO.md](docs/TODO.md). See AGENTS.md for workflow details.

## Quick Reference

For comprehensive documentation, see:
- **Product vision & goals**: [docs/VISION.md](docs/VISION.md)
- **Technical architecture & data model**: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- **UX principles**: [docs/UX_GUIDELINES.md](docs/UX_GUIDELINES.md)
- **Getting started**: [README.md](README.md)

## Commands

```bash
npm install     # Install dependencies
npm run dev     # Start local dev server
npm run build   # Build for production
npm test        # Run tests
```

## Local Collaboration Worker

**Required for browser testing.** Without the local worker, Yjs state does not persist across navigation (teams, repos, temporal data disappear when leaving a project). Always start both processes before browser testing:

```bash
# Terminal 1: start collab worker (defaults to port 8787)
npx wrangler dev

# Terminal 2: start dev server pointed at local worker
VITE_COLLAB_HOST=localhost:8787 npm run dev
```

## Deployment

**Staging** (for testing before production):

```bash
VITE_COLLAB_HOST=contextflow-collab-staging.paul-162.workers.dev npm run build
npx wrangler pages deploy dist --project-name contextflow-staging --branch main
```

**Production**:

```bash
VITE_COLLAB_HOST=contextflow-collab.paul-162.workers.dev npm run build
npx wrangler pages deploy dist --project-name contextflow --branch main
```

The `VITE_COLLAB_HOST` environment variable is required at build time to configure which collaboration server the app connects to. Without it, the app defaults to `localhost:8787`.

## Project-Specific Conventions

### Code Organization
- **All types**: `src/model/types.ts` (single source of truth)
- **State management**: Zustand store in `src/model/store.ts`
- **Canvas**: React Flow patterns (custom nodes, edges, overlays)
- **UI components**: shadcn/ui (Radix primitives) + Tailwind CSS
- **Animation**: Framer Motion for view transitions

### Key Implementation Details

**Dual positioning system:**
Every BoundedContext has three position coordinates:
- `positions.flow.x` - horizontal position in Flow View
- `positions.strategic.x` - horizontal position in Strategic View
- `positions.shared.y` - vertical position (shared across both views)

**External contexts:**
- Cannot have repos assigned (`isExternal: true` blocks assignment)
- Show "External" badge and dotted ring visual treatment

**Undo/redo scope:**
- Applies only to structural canvas actions (add/move/delete context, add/delete relationship, assign/unassign repo, create/delete group)
- Text edits in InspectorPanel autosave directly and are NOT undoable

**DDD relationship patterns:**
Use fixed vocabulary from types.ts: `customer-supplier`, `conformist`, `anti-corruption-layer`, `open-host-service`, `published-language`, `shared-kernel`, `partnership`, `separate-ways`

**Groups (capability clusters):**
- Visual overlays only; deleting a group does not delete member contexts
- Can overlap (multiple groups covering same canvas area)

**InspectorPanel visibility:**
- When adding a new selectable entity type (e.g., relationship, flow stage), you MUST update `App.tsx` to include it in the conditional render
- Update BOTH `hasRightSidebar` calculation AND the conditional render `{(selectedContextId || selectedGroupId || ...) && <InspectorPanel />}`
- Common bug: Store updates correctly but InspectorPanel doesn't appear because App.tsx doesn't check the new selection state

**Tooltips:**
- Use `SimpleTooltip` for simple text tooltips (instant display, no delay)
- Use `InfoTooltip` for educational DDD concept tooltips (requires `ConceptDefinition` object, respects `showHelpTooltips` setting)
- NEVER use native `title` attribute (has browser-imposed delay)

### When Working on Features

1. Follow architectural patterns in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
2. Match aesthetic guidelines in [docs/UX_GUIDELINES.md](docs/UX_GUIDELINES.md)
3. Preserve product vision and positioning from [docs/VISION.md](docs/VISION.md)

### Definition of Done (checklist before closing a feature)

- [ ] **Analytics coverage**: Verify the feature is tracked. New user-facing actions (buttons, toggles, dropdowns, entity CRUD) must fire analytics events. Check whether existing generic events (e.g., `context_updated` with `properties_changed`) already cover the new fields. If not, add explicit `trackEvent`/`trackPropertyChange` calls in `store.ts`. See `src/utils/analytics.ts` for helpers and `docs/ANALYTICS_USAGE_GUIDE.md` for conventions.
- [ ] **Yjs sync**: Any new entity field must round-trip through Yjs (types.ts, schema.ts, contextSync.ts, contextMutations.ts)
- [ ] **Tests pass**: `npm test` with no new failures

## Mutation Testing

Stryker is configured for mutation testing against `src/model/sync/` (the Yjs mutation layer). It uses the Vitest runner and TypeScript checker to filter out invalid mutations.

**When to use:**
- After writing tests for a new feature, to verify test effectiveness
- Before merging significant changes to sync mutations
- Periodic audit of test quality

**How to run:**
```bash
npm run mutate                                              # Full run (all sync mutations)
npm run mutate:changed                                      # Incremental (only changed code)
npx stryker run --mutate "src/model/sync/contextMutations.ts"  # Target one file
```

Or use the `/mutate` skill during dev sessions.

**Interpreting results:**
- **Mutation score**: percentage of mutants killed by tests (higher is better)
- **Survived mutants**: indicate gaps where tests don't verify behavior; prioritize fixes in data-critical paths
- **Focus on sync mutations and pure logic**, not UI components (React components have too many false positives)

**Reports**: HTML report at `reports/mutation/index.html` (gitignored)

## Important Constraints

- **Browser-based**: works entirely in the browser with client-side storage; no backend required for core functionality
- Only use emojis if the user explicitly requests it. Avoid adding emojis to files unless asked
