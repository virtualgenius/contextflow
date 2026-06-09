import type { ViewMode } from './storeTypes'

const STORAGE_KEY = 'contextflow.viewModeByProject'

// Active view is editor/UI state, not collaborative model data, so it lives in
// localStorage keyed by project rather than in the synced Yjs schema. Two people
// viewing the same project keep independent views.
const EXISTING_PROJECT_DEFAULT: ViewMode = 'flow'
const NEW_PROJECT_DEFAULT: ViewMode = 'context-map'

function readMap(): Record<string, ViewMode> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, ViewMode>) : {}
  } catch {
    return {}
  }
}

function writeMap(map: Record<string, ViewMode>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
}

export function getStoredViewMode(projectId: string): ViewMode | null {
  return readMap()[projectId] ?? null
}

export function persistViewMode(projectId: string, mode: ViewMode): void {
  const map = readMap()
  map[projectId] = mode
  writeMap(map)
}

// The view to show when opening an existing/saved project: its last view, or
// Value Stream if it has none stored. A null id (no active project) also
// resolves to Value Stream.
export function resolveViewModeForExistingProject(projectId: string | null): ViewMode {
  if (!projectId) return EXISTING_PROJECT_DEFAULT
  return getStoredViewMode(projectId) ?? EXISTING_PROJECT_DEFAULT
}

// The view a brand-new project starts in: a clean Context Map.
export function newProjectViewMode(): ViewMode {
  return NEW_PROJECT_DEFAULT
}
