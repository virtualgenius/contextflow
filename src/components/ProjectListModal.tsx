import React from 'react'
import { X } from 'lucide-react'
import type { Project } from '../model/types'
import { ProjectListContent } from './ProjectListContent'

interface ProjectListModalProps {
  projects: Record<string, Project>
  activeProjectId: string | null
  onSelectProject: (projectId: string) => void
  onCreateProject: (name: string) => void
  onCreateFromTemplate?: (templateId: string) => void
  onDeleteProject: (projectId: string) => void
  onRenameProject: (projectId: string, newName: string) => void
  onDuplicateProject: (projectId: string) => void
  onClose: () => void
}

export function ProjectListModal({
  projects,
  activeProjectId,
  onSelectProject,
  onCreateProject,
  onCreateFromTemplate,
  onDeleteProject,
  onRenameProject,
  onDuplicateProject,
  onClose,
}: ProjectListModalProps) {
  const handleSelectProject = (projectId: string) => {
    onSelectProject(projectId)
    onClose()
  }

  const handleCreateProject = (name: string) => {
    onCreateProject(name)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl w-[520px] max-w-[90vw] max-h-[80vh] border border-slate-200 dark:border-neutral-700 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-neutral-700 shrink-0">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Projects
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-neutral-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <ProjectListContent
            projects={projects}
            activeProjectId={activeProjectId}
            onSelectProject={handleSelectProject}
            onCreateProject={handleCreateProject}
            onCreateFromTemplate={onCreateFromTemplate}
            onDeleteProject={onDeleteProject}
            onRenameProject={onRenameProject}
            onDuplicateProject={onDuplicateProject}
          />
        </div>
      </div>
    </div>
  )
}
