import React from 'react'
import { useEditorStore } from '../model/store'
import { ProjectListContent } from './ProjectListContent'
import { SimpleTooltip } from './SimpleTooltip'
import { useUrlRouter } from '../hooks/useUrlRouter'
import { version } from '../../package.json'

export function ProjectListPage() {
  const projects = useEditorStore(s => s.projects)
  const activeProjectId = useEditorStore(s => s.activeProjectId)
  const setActiveProject = useEditorStore(s => s.setActiveProject)
  const createProject = useEditorStore(s => s.createProject)
  const createFromTemplate = useEditorStore(s => s.createFromTemplate)
  const deleteProject = useEditorStore(s => s.deleteProject)
  const renameProject = useEditorStore(s => s.renameProject)
  const duplicateProject = useEditorStore(s => s.duplicateProject)
  const { route, navigate } = useUrlRouter()

  const handleSelectProject = (projectId: string) => {
    if (route === 'shared-project') {
      navigate('/')
    }
    setActiveProject(projectId)
  }

  return (
    <div className="w-screen h-screen flex flex-col bg-slate-50 dark:bg-neutral-900">
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800">
        <div className="max-w-xl mx-auto px-6 py-4">
          <SimpleTooltip text={`v${version}`}>
            <div className="font-semibold text-lg text-slate-800 dark:text-slate-100">
              ContextFlow
            </div>
          </SimpleTooltip>
          <div className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            See how your bounded contexts, teams, and value flow connect
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-xl mx-auto px-6 py-8">
          <ProjectListContent
            projects={projects}
            activeProjectId={activeProjectId}
            onSelectProject={handleSelectProject}
            onCreateProject={createProject}
            onCreateFromTemplate={createFromTemplate}
            onDeleteProject={deleteProject}
            onRenameProject={renameProject}
            onDuplicateProject={duplicateProject}
          />
        </div>
      </main>
    </div>
  )
}
