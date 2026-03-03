# Performance Baseline

This document captures baseline performance metrics for ContextFlow to help identify regressions as the application grows.

## Bundle Size

**Measured:** 2026-03-03 (v0.9.1)

### Production Build

```text
dist/assets/index-CJihn-st.js
  Raw: 1029.43 KB
  Gzipped: 290.17 KB
```

### Historical Comparison

| Date | Version | Raw | Gzipped | Notes |
|------|---------|-----|---------|-------|
| 2025-12-02 | pre-Yjs | 733.40 KB | 196.11 KB | Baseline before collaboration |
| 2025-12-03 | post-Yjs | 846.52 KB | 230.43 KB | Added Yjs, y-indexeddb, y-webrtc |
| 2026-03-03 | v0.9.1 | 1029.43 KB | 290.17 KB | PostHog, temporal evolution, teams, DnD, analytics |

**Latest delta (v0.9.1 vs post-Yjs):** +183 KB raw (+21.6%), +60 KB gzipped (+25.9%) from PostHog SDK, temporal evolution, team management, drag-and-drop, and analytics instrumentation.

### Measurement Steps

```bash
npm run perf
# Or manually:
# npm run build
# Check output for dist/assets/index-*.js size
```

## Load Performance

**Measured:** 2025-12-03

### Page Load Time

Time from navigation to interactive canvas (production build).

**Metric:** 884 ms (median of 3 samples: 957ms, 858ms, 884ms)

### Measurement Steps (Load Time)

1. Build production version: `npm run build`
2. Serve production build: `npm run preview`
3. Open browser DevTools (Performance tab)
4. Start recording
5. Navigate to application URL
6. Wait until canvas is interactive (all contexts rendered)
7. Stop recording
8. Note total time from navigationStart to load complete

**Key Events:**

- `navigationStart` → `responseEnd`: Network time
- `responseEnd` → `domContentLoadedEventEnd`: Parse/execute JS
- `domContentLoadedEventEnd` → canvas interactive: React render + React Flow initialization

## Memory Usage

**Measured:** 2025-12-03

### Baseline Heap Size

Memory usage after initial render (empty canvas).

**Metric:** 6 MB

### With Sample Project

Memory usage with ACME E-Commerce project loaded (19 contexts, multiple relationships and groups).

**Metric:** 11-13 MB

## Measurement Guidelines

### When to Re-measure

- Before each minor version release (0.x.0)
- After adding major features (Timeline, Strategic View, etc.)
- If performance degradation is suspected

### Acceptable Ranges

These are targets, not hard limits:

- **Bundle size (gzipped):** < 350 KB
  - Core dependencies (React Flow, Framer Motion, Yjs, PostHog) account for ~290 KB
  - Watch for growth > 50 KB between measurements
- **Empty project load:** < 1000 ms
  - On modern hardware (MacBook Pro 2020+)
  - Measured in production build
- **Memory baseline:** < 50 MB heap
  - After initial render
  - Before loading any project data

### Notes

- All measurements should use production builds (`npm run build` + `npm run preview`)
- Load time measurements should be done in Chrome with no extensions
- Take multiple samples and report median value
- Document hardware specs when measuring (CPU, RAM, browser version)

## Future Enhancements

When automated performance testing becomes necessary:

- Use Playwright + Lighthouse for automated load time measurement
- Add bundle size tracking in CI pipeline
- Set up performance budgets with alerts on regression
