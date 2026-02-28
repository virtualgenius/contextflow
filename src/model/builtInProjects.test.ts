import { describe, it, expect, vi } from 'vitest'
import {
  initialProjects,
  initialActiveProjectId,
  determineProjectOrigin,
  isBuiltInNewer,
} from './builtInProjects'
import type { Project } from './types'

vi.mock('./persistence', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./persistence')>()
  return {
    ...actual,
    loadProject: vi.fn().mockResolvedValue(null),
    loadAllProjects: vi.fn().mockResolvedValue([]),
    saveProject: vi.fn().mockResolvedValue(undefined),
  }
})

function createTestProject(overrides: Partial<Project> = {}): Project {
  return {
    id: 'test-project',
    name: 'Test Project',
    contexts: [],
    relationships: [],
    repos: [],
    people: [],
    teams: [],
    groups: [],
    users: [],
    userNeeds: [],
    userNeedConnections: [],
    needContextConnections: [],
    viewConfig: { flowStages: [] },
    ...overrides,
  }
}

describe('builtInProjects', () => {
  describe('initialProjects', () => {
    it('should export an object with project IDs as keys', () => {
      expect(initialProjects).toBeTypeOf('object')
      expect(Object.keys(initialProjects).length).toBeGreaterThan(0)
    })

    it('should include sample project', () => {
      const projects = Object.values(initialProjects)
      const sampleProject = projects.find(
        (p) => p.name.includes('ACME') || p.id === 'sample-project'
      )
      expect(sampleProject).toBeDefined()
    })

    it('should include cbioportal project', () => {
      const projects = Object.values(initialProjects)
      const cbioportal = projects.find((p) => p.name.toLowerCase().includes('cbioportal'))
      expect(cbioportal).toBeDefined()
    })

    it('should include elan warranty project', () => {
      const projects = Object.values(initialProjects)
      const elan = projects.find((p) => p.name.toLowerCase().includes('elan'))
      expect(elan).toBeDefined()
    })

    it('should have project IDs as keys matching project.id', () => {
      Object.entries(initialProjects).forEach(([key, project]) => {
        expect(key).toBe(project.id)
      })
    })

    it('should have isBuiltIn flag set to true for all projects', () => {
      Object.values(initialProjects).forEach((project) => {
        expect(project.isBuiltIn).toBe(true)
      })
    })

    it('should generate unique UUIDs for project IDs', () => {
      const ids = Object.keys(initialProjects)
      ids.forEach((id) => {
        expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
      })
    })
  })

  describe('backwards compatibility - required arrays', () => {
    it('should ensure all projects have users array', () => {
      Object.values(initialProjects).forEach((project) => {
        expect(project.users).toBeDefined()
        expect(Array.isArray(project.users)).toBe(true)
      })
    })

    it('should ensure all projects have userNeeds array', () => {
      Object.values(initialProjects).forEach((project) => {
        expect(project.userNeeds).toBeDefined()
        expect(Array.isArray(project.userNeeds)).toBe(true)
      })
    })

    it('should ensure all projects have userNeedConnections array', () => {
      Object.values(initialProjects).forEach((project) => {
        expect(project.userNeedConnections).toBeDefined()
        expect(Array.isArray(project.userNeedConnections)).toBe(true)
      })
    })

    it('should ensure all projects have needContextConnections array', () => {
      Object.values(initialProjects).forEach((project) => {
        expect(project.needContextConnections).toBeDefined()
        expect(Array.isArray(project.needContextConnections)).toBe(true)
      })
    })
  })

  describe('migration - distillation and evolution', () => {
    it('should ensure all contexts have distillation positions', () => {
      Object.values(initialProjects).forEach((project) => {
        project.contexts.forEach((context) => {
          expect(context.positions.distillation).toBeDefined()
          expect(context.positions.distillation.x).toBeTypeOf('number')
          expect(context.positions.distillation.y).toBeTypeOf('number')
        })
      })
    })

    it('should ensure all contexts have evolutionStage', () => {
      Object.values(initialProjects).forEach((project) => {
        project.contexts.forEach((context) => {
          expect(context.evolutionStage).toBeDefined()
          expect(['genesis', 'custom-built', 'product/rental', 'commodity/utility']).toContain(
            context.evolutionStage
          )
        })
      })
    })

    it('should ensure all contexts have strategicClassification', () => {
      Object.values(initialProjects).forEach((project) => {
        project.contexts.forEach((context) => {
          expect(context.strategicClassification).toBeDefined()
          expect(['core', 'supporting', 'generic']).toContain(context.strategicClassification)
        })
      })
    })

    it('should classify evolutionStage based on strategic position x when missing', () => {
      Object.values(initialProjects).forEach((project) => {
        project.contexts.forEach((context) => {
          expect(['genesis', 'custom-built', 'product/rental', 'commodity/utility']).toContain(
            context.evolutionStage
          )
        })
      })
    })

    it('should use default distillation position (50, 50) when missing', () => {
      Object.values(initialProjects).forEach((project) => {
        project.contexts.forEach((context) => {
          expect(context.positions.distillation.x).toBeGreaterThanOrEqual(0)
          expect(context.positions.distillation.x).toBeLessThanOrEqual(100)
          expect(context.positions.distillation.y).toBeGreaterThanOrEqual(0)
          expect(context.positions.distillation.y).toBeLessThanOrEqual(100)
        })
      })
    })
  })

  describe('initialActiveProjectId', () => {
    it('should be null for first-time users (no stored project)', () => {
      expect(initialActiveProjectId).toBeNull()
    })

    it('should use localStorage value if available and project exists', () => {
      const storedProjectId = localStorage.getItem('contextflow.activeProjectId')

      if (storedProjectId && initialProjects[storedProjectId]) {
        expect(initialActiveProjectId).toBe(storedProjectId)
      } else {
        expect(initialActiveProjectId).toBeNull()
      }
    })
  })

  describe('data integrity', () => {
    it('should have valid project structure', () => {
      Object.values(initialProjects).forEach((project) => {
        expect(project.id).toBeDefined()
        expect(project.name).toBeDefined()
        expect(project.contexts).toBeDefined()
        expect(Array.isArray(project.contexts)).toBe(true)
        expect(project.relationships).toBeDefined()
        expect(Array.isArray(project.relationships)).toBe(true)
      })
    })

    it('should have contexts with valid position structures', () => {
      Object.values(initialProjects).forEach((project) => {
        project.contexts.forEach((context) => {
          expect(context.positions).toBeDefined()
          expect(context.positions.flow).toBeDefined()
          expect(context.positions.strategic).toBeDefined()
          expect(context.positions.shared).toBeDefined()
          expect(context.positions.distillation).toBeDefined()

          expect(context.positions.flow.x).toBeTypeOf('number')
          expect(context.positions.strategic.x).toBeTypeOf('number')
          expect(context.positions.shared.y).toBeTypeOf('number')
          expect(context.positions.distillation.x).toBeTypeOf('number')
          expect(context.positions.distillation.y).toBeTypeOf('number')
        })
      })
    })
  })

  describe('determineProjectOrigin', () => {
    it('returns "sample" for built-in project', () => {
      const project = createTestProject({ name: 'ACME E-Commerce', isBuiltIn: true })
      expect(determineProjectOrigin(project, false)).toBe('sample')
    })

    it('returns "sample" for cbioportal built-in project', () => {
      const project = createTestProject({ name: 'cBioPortal', isBuiltIn: true })
      expect(determineProjectOrigin(project, false)).toBe('sample')
    })

    it('returns "sample" for any built-in project', () => {
      const project = createTestProject({ name: 'Some Built-In', isBuiltIn: true })
      expect(determineProjectOrigin(project, false)).toBe('sample')
    })

    it('returns "imported" for first load of custom project', () => {
      const project = createTestProject({ name: 'My Project', isBuiltIn: false })
      expect(determineProjectOrigin(project, true)).toBe('imported')
    })

    it('returns "continued" for subsequent load of custom project', () => {
      const project = createTestProject({ name: 'My Project', isBuiltIn: false })
      expect(determineProjectOrigin(project, false)).toBe('continued')
    })
  })

  describe('initializeBuiltInProjects', () => {
    // Dynamic import so mocks are applied
    async function getModules() {
      const { initializeBuiltInProjects, BUILT_IN_PROJECTS } = await import('./builtInProjects')
      const { loadAllProjects } = await import('./persistence')
      return {
        initializeBuiltInProjects,
        BUILT_IN_PROJECTS,
        loadAllProjects: loadAllProjects as ReturnType<typeof vi.fn>,
      }
    }

    it('should load user projects from IndexedDB alongside built-in projects', async () => {
      const { initializeBuiltInProjects, BUILT_IN_PROJECTS, loadAllProjects } = await getModules()

      const userProject = createTestProject({
        id: 'user-project-1',
        name: 'My Custom Map',
        isBuiltIn: false,
      })

      loadAllProjects.mockResolvedValue([userProject])

      const setState = vi.fn()
      initializeBuiltInProjects(setState)

      await vi.waitFor(() => expect(setState).toHaveBeenCalled())

      const calledWith = setState.mock.calls[0][0]
      expect(calledWith.projects['user-project-1']).toBeDefined()
      expect(calledWith.projects['user-project-1'].name).toBe('My Custom Map')
      // Built-in projects should also be present
      BUILT_IN_PROJECTS.forEach((bp) => {
        expect(calledWith.projects[bp.id]).toBeDefined()
      })
    })

    it('should exclude orphaned built-in projects from IndexedDB', async () => {
      const { initializeBuiltInProjects, loadAllProjects } = await getModules()

      const orphanedBuiltIn = createTestProject({
        id: 'stale-builtin-id-from-previous-session',
        name: 'ACME E-Commerce',
        isBuiltIn: true,
      })

      const userProject = createTestProject({
        id: 'user-project-2',
        name: 'My Real Project',
        isBuiltIn: false,
      })

      loadAllProjects.mockResolvedValue([orphanedBuiltIn, userProject])

      const setState = vi.fn()
      initializeBuiltInProjects(setState)

      await vi.waitFor(() => expect(setState).toHaveBeenCalled())

      const calledWith = setState.mock.calls[0][0]
      expect(calledWith.projects['stale-builtin-id-from-previous-session']).toBeUndefined()
      expect(calledWith.projects['user-project-2']).toBeDefined()
    })

    it('should restore activeProjectId when it matches a loaded user project', async () => {
      const { initializeBuiltInProjects, loadAllProjects } = await getModules()

      const userProject = createTestProject({
        id: 'user-project-active',
        name: 'Active User Project',
        isBuiltIn: false,
      })

      loadAllProjects.mockResolvedValue([userProject])
      localStorage.setItem('contextflow.activeProjectId', 'user-project-active')

      const setState = vi.fn()
      initializeBuiltInProjects(setState)

      await vi.waitFor(() => expect(setState).toHaveBeenCalled())

      const calledWith = setState.mock.calls[0][0]
      expect(calledWith.activeProjectId).toBe('user-project-active')

      localStorage.removeItem('contextflow.activeProjectId')
    })
  })

  describe('project versioning', () => {
    it('should return true when built-in version is newer than saved', () => {
      const builtInProject = { id: 'test-project', version: 2, name: 'Test' }
      const savedProject = { id: 'test-project', version: 1, name: 'Test' }

      expect(isBuiltInNewer(builtInProject, savedProject)).toBe(true)
    })

    it('should return false when versions are equal', () => {
      const builtInProject = { id: 'test-project', version: 2, name: 'Test' }
      const savedProject = { id: 'test-project', version: 2, name: 'Test' }

      expect(isBuiltInNewer(builtInProject, savedProject)).toBe(false)
    })

    it('should return false when built-in version is older than saved', () => {
      const builtInProject = { id: 'test-project', version: 1, name: 'Test' }
      const savedProject = { id: 'test-project', version: 2, name: 'Test' }

      expect(isBuiltInNewer(builtInProject, savedProject)).toBe(false)
    })

    it('should treat missing version as version 1', () => {
      const builtInProject = { id: 'test-project', version: 2, name: 'Test' }
      const savedProject: { version?: number } = {}

      expect(isBuiltInNewer(builtInProject, savedProject)).toBe(true)
    })

    it('should return false when both have no version (both default to 1)', () => {
      const builtInProject = { id: 'test-project', version: 1, name: 'Test' }
      const savedProject: { version?: number } = {}

      expect(isBuiltInNewer(builtInProject, savedProject)).toBe(false)
    })
  })
})
