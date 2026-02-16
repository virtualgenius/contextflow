import type { Project } from './types'
import demoProject from '../../examples/sample.project.json'
import cbioportalProject from '../../examples/cbioportal.project.json'
import emptyProject from '../../examples/empty.project.json'
import elanWarrantyProject from '../../examples/elan-warranty.project.json'
import { saveProject, loadProject, loadAllProjects, migrateProject } from './persistence'
import { classifyFromStrategicPosition } from './classification'

const TEMPLATE_PROJECTS = [
  demoProject as Project,
  cbioportalProject as Project,
  emptyProject as Project,
  elanWarrantyProject as Project,
]

export const BUILT_IN_PROJECTS = TEMPLATE_PROJECTS.map(template => ({
  ...template,
  id: crypto.randomUUID(),
  isBuiltIn: true,
}))

export const [sampleProject, cbioportal, empty, elanWarranty] = BUILT_IN_PROJECTS

BUILT_IN_PROJECTS.forEach(project => {
  if (!project.users) project.users = []
  if (!project.userNeeds) project.userNeeds = []
  if (!project.userNeedConnections) project.userNeedConnections = []
  if (!project.needContextConnections) project.needContextConnections = []
  if (!project.viewConfig) {
    project.viewConfig = { flowStages: [] }
  } else if (!project.viewConfig.flowStages) {
    project.viewConfig.flowStages = []
  }
})

BUILT_IN_PROJECTS.forEach(project => {
  project.contexts = project.contexts.map(context => {
    const needsDistillation = !context.positions.distillation
    const needsEvolution = !context.evolutionStage

    if (needsDistillation || needsEvolution) {
      return {
        ...context,
        positions: {
          ...context.positions,
          distillation: context.positions.distillation || { x: 50, y: 50 },
        },
        strategicClassification: context.strategicClassification || 'supporting',
        evolutionStage: context.evolutionStage || classifyFromStrategicPosition(context.positions.strategic.x),
      }
    }
    return context
  })
})

async function saveProjectIfNew(project: Project): Promise<void> {
  const existingProject = await loadProject(project.id)
  if (isBuiltInNewer(project, existingProject)) {
    await saveProject(project)
  }
}

BUILT_IN_PROJECTS.forEach(project => {
  saveProjectIfNew(project).catch(err => {
    console.error(`Failed to check/save ${project.name}:`, err)
  })
})

// Build initial projects map from array
export const initialProjects = BUILT_IN_PROJECTS.reduce((acc, project) => {
  acc[project.id] = project
  return acc
}, {} as Record<string, Project>)

const storedProjectId = localStorage.getItem('contextflow.activeProjectId')
const storedProjectExistsLocally = storedProjectId && initialProjects[storedProjectId]
export const initialActiveProjectId: string | null = storedProjectExistsLocally ? storedProjectId : null

type ProjectOrigin = 'sample' | 'empty' | 'imported' | 'continued'

export function determineProjectOrigin(
  project: Project,
  isFirstLoad: boolean
): ProjectOrigin {
  if (project.isBuiltIn) {
    return project.name === 'Empty Project' ? 'empty' : 'sample'
  } else if (isFirstLoad) {
    return 'imported'
  }
  return 'continued'
}

const DEFAULT_PROJECT_VERSION = 1

export function isBuiltInNewer(
  builtInProject: { version?: number },
  savedProject: { version?: number } | null
): boolean {
  if (!savedProject) return true

  const builtInVersion = builtInProject.version ?? DEFAULT_PROJECT_VERSION
  const savedVersion = savedProject.version ?? DEFAULT_PROJECT_VERSION

  return builtInVersion > savedVersion
}

export function initializeBuiltInProjects(
  setState: (state: { projects: Record<string, Project>; activeProjectId?: string | null }) => void
): void {
  Promise.all([
    Promise.all(BUILT_IN_PROJECTS.map(project => loadProject(project.id))),
    loadAllProjects(),
  ]).then(([savedBuiltIns, allSavedProjects]) => {
    const projects: Record<string, Project> = {}

    BUILT_IN_PROJECTS.forEach((builtInProject, index) => {
      const savedProject = savedBuiltIns[index]
      if (isBuiltInNewer(builtInProject, savedProject)) {
        projects[builtInProject.id] = builtInProject
      } else {
        const migratedProject = migrateProject(savedProject!)
        projects[migratedProject.id] = migratedProject
      }
    })

    const userProjects = allSavedProjects.filter(p => !p.isBuiltIn)
    for (const userProject of userProjects) {
      const migrated = migrateProject(userProject)
      projects[migrated.id] = migrated
    }

    const storedActiveId = localStorage.getItem('contextflow.activeProjectId')
    const activeProjectId = storedActiveId && projects[storedActiveId] ? storedActiveId : undefined

    setState({ projects, ...(activeProjectId && { activeProjectId }) })
  }).catch(err => {
    console.error('Failed to load projects from IndexedDB:', err)
  })
}
