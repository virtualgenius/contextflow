# Contributing to ContextFlow

Thank you for your interest in contributing to ContextFlow!

## AI-Assisted Development

This is an AI-forward project (you'll find a `CLAUDE.md` in the repo root). All contributions are expected to be human-in-the-loop, and agent-in-the-loop is also recommended. Use AI tools to help investigate bugs, explore the codebase, draft code, and review your own changes before submitting. Free-tier options like [Claude.ai](https://claude.ai), [ChatGPT](https://chatgpt.com), and [GitHub Copilot in VS Code](https://code.visualstudio.com/docs/copilot/overview) all work well for this.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/contextflow.git`
   (Original repository: `https://github.com/virtualgenius/contextflow.git`)
3. Install dependencies: `npm install`
4. Start the dev server: `npm run dev`

### Local Collaboration Worker

ContextFlow uses a Cloudflare Worker for real-time collaboration via Yjs and WebSockets. For local browser testing, you need to run this worker alongside the dev server. Without it, Yjs state does not persist across navigation (teams, repos, and temporal data disappear when you leave a project).

```bash
# Terminal 1: start the collab worker (defaults to port 8787)
npx wrangler dev

# Terminal 2: start the dev server pointed at the local worker
VITE_COLLAB_HOST=localhost:8787 npm run dev
```

The `.env.development` file already sets `VITE_COLLAB_HOST=localhost:8787`, so if it is present, `npm run dev` alone will point at the right host. You still need the worker running in a separate terminal.

**Note**: The collab worker is only needed for browser testing. The unit test suite (`npm test`) runs entirely in-memory and does not require the worker.

## Key Documentation

Before making changes, familiarize yourself with these docs:

- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** - Data model, positioning system, sync layer, state management
- **[docs/UX_GUIDELINES.md](docs/UX_GUIDELINES.md)** - Interaction patterns, visual encoding, drag behavior
- **[docs/VISION.md](docs/VISION.md)** - Product vision and design philosophy

These are essential reading for anything beyond trivial fixes. The architecture doc covers the data model types, the dual positioning system, and how the Yjs sync layer works. The UX guidelines cover drag semantics, view-specific behavior, and visual conventions.

## Development Workflow

1. Create a new branch for your feature or fix: `git checkout -b feature/your-feature-name`
2. Make your changes
3. Run the quality gates before committing (see below)
4. Commit your changes with a clear message
5. Push to your fork and submit a pull request

### Quality Gates

These all run automatically via pre-commit hooks, but you should run them yourself to catch issues early:

```bash
npm test              # Run unit tests (1400+ tests, no external dependencies needed)
npm run typecheck     # TypeScript compilation check
npm run lint          # ESLint
npm run build         # Production build
```

All four must pass for CI to accept your PR.

## Architecture: Important Patterns

### The Yjs Sync Rule (read this first)

**All entity mutations must go through the Yjs layer, not direct Zustand writes.**

The store (`src/model/store.ts`) delegates mutations to `getCollabMutations()`, which routes through `src/model/sync/*Mutations.ts` to modify the Yjs document. Yjs observers then update the Zustand store. This is how real-time sync works.

If you write directly to Zustand's `projects` state (via `set()`), your change will appear to work in a single browser tab but will be **silently overwritten** the next time the Yjs sync observer fires. This is the most common contributor mistake and it is very hard to debug.

The correct pattern:
1. Add your mutation function in the appropriate `src/model/sync/*Mutations.ts` file
2. Call it from the store via `getCollabMutations()`
3. Test it using the `projectToYDoc` -> mutate -> `yDocToProject` round-trip pattern (see existing tests in `src/model/sync/__tests__/`)

There is an architectural guard test (`noYjsBypass.test.ts`) that will catch direct Zustand writes to `projects`, but understanding the pattern will save you time.

### Dual Positioning System

Every BoundedContext has view-specific positions:

- `positions.flow.x` - horizontal position in Value Stream (Flow) View
- `positions.strategic.x` - horizontal position in Strategic View
- `positions.shared.y` - vertical position, **shared** between Flow and Strategic views
- `positions.distillation.x/y` - fully independent 2D position in Distillation View

Dragging a node vertically in Flow View also moves it in Strategic View (shared Y), but Distillation View positions are completely independent. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full type definition.

### InspectorPanel Visibility

When adding a new selectable entity type, you must update **two things** in `App.tsx`:
1. The `hasRightSidebar` calculation
2. The conditional render block that shows `<InspectorPanel />`

Without both updates, the store will track selection correctly but the panel will never appear.

## Tests

### Test Organization

The codebase uses two test file conventions:

- **Colocated files** (`*.test.ts` next to the source file) for utilities and standalone modules: `src/model/validation.test.ts`, `src/lib/blobShape.test.ts`, etc.
- **`__tests__/` subdirectories** for components and complex layers: `src/components/__tests__/`, `src/model/sync/__tests__/`, etc.

Follow whichever pattern the surrounding code uses. For component tests, use `__tests__/`. For pure utility functions, colocate the test file.

### Writing Tests

- Use Vitest + React Testing Library (already configured)
- For sync/mutation tests: use the `projectToYDoc` -> mutate -> `yDocToProject` round-trip pattern
- For store tests: mock `useEditorStore` with `vi.mock` + `vi.mocked().mockImplementation()`
- The test setup file is at `src/test/setup.ts`

## Code Style

- **Formatting**: Prettier runs automatically on commit via lint-staged. No manual formatting needed.
- **Linting**: ESLint with TypeScript type-checking. `no-unused-vars` is an error (prefix unused params with `_` to suppress). `@ts-ignore` is banned; use `@ts-expect-error` with a description instead.
- **Self-documenting code over comments**: Use clear function and variable names rather than inline comments. Only comment *why* something is done if the reason is non-obvious. Do not comment *what* the code does.
- **TypeScript strict mode**: All code must compile under strict mode.
- Keep components focused and single-purpose.

## Pull Request Guidelines

- Keep PRs focused on a single feature or fix
- Include a clear description of what your PR does
- Reference any related issues
- Verify the quality gates pass before submitting (see checklist in PR template)

## Reporting Issues

If you find a bug or have a feature request, please file a new issue using the appropriate template:

- **Bug reports**: Use the "Bug Report" template
- **Feature requests**: Use the "Feature Request" template

Please file bug reports and feature requests as separate issues rather than commenting on existing issues or pull requests.

## Questions and Support

For questions, troubleshooting, and general help, join our [Community Discord](https://discord.gg/ABRnay8PM5). Discord is the best place to get quick answers and discuss ideas before filing an issue.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
