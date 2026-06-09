import { describe, it, expect, beforeEach } from 'vitest'
import {
  getStoredViewMode,
  persistViewMode,
  resolveViewModeForExistingProject,
  newProjectViewMode,
} from '../viewModePersistence'

describe('view mode persistence', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns null for a project with no stored view', () => {
    expect(getStoredViewMode('proj-1')).toBeNull()
  })

  it('round-trips a persisted view per project', () => {
    persistViewMode('proj-1', 'strategic')
    persistViewMode('proj-2', 'distillation')
    expect(getStoredViewMode('proj-1')).toBe('strategic')
    expect(getStoredViewMode('proj-2')).toBe('distillation')
  })

  it('overwrites the stored view when persisted again', () => {
    persistViewMode('proj-1', 'strategic')
    persistViewMode('proj-1', 'flow')
    expect(getStoredViewMode('proj-1')).toBe('flow')
  })

  it('tolerates malformed storage by treating it as empty', () => {
    localStorage.setItem('contextflow.viewModeByProject', 'not json')
    expect(getStoredViewMode('proj-1')).toBeNull()
  })

  it('resolves an existing project with no stored view to Value Stream', () => {
    expect(resolveViewModeForExistingProject('proj-1')).toBe('flow')
  })

  it('resolves an existing project to its stored view when present', () => {
    persistViewMode('proj-1', 'strategic')
    expect(resolveViewModeForExistingProject('proj-1')).toBe('strategic')
  })

  it('resolves a null project id to Value Stream', () => {
    expect(resolveViewModeForExistingProject(null)).toBe('flow')
  })

  it('starts a new project in Context Map', () => {
    expect(newProjectViewMode()).toBe('context-map')
  })
})
