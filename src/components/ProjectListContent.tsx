import React from 'react'
import { Layers, Plus, Trash2, Copy, Pencil, Search, BookOpen } from 'lucide-react'
import type { Project } from '../model/types'
import {
  formatRelativeTime,
  getProjectMetadata,
  sortProjectsByLastModified,
} from '../model/projectUtils'
import { isBuiltInProject } from '../model/projectUtils'
import { ProjectCreateDialog } from './ProjectCreateDialog'
import { ProjectDeleteDialog } from './ProjectDeleteDialog'

const EXAMPLE_DESCRIPTIONS: Record<string, string> = {
  'ACME E-Commerce Platform': 'Fictional e-commerce company with teams, repos, and value flow',
  'cBioPortal Demo Map': 'Open-source cancer genomics platform with complex domain boundaries',
  'Elan Extended Warranty': 'Warranty claims processing with upstream/downstream relationships',
}

interface ProjectListContentProps {
  projects: Record<string, Project>
  activeProjectId: string | null
  onSelectProject: (projectId: string) => void
  onCreateProject: (name: string) => void
  onCreateFromTemplate?: (templateId: string) => void
  onDeleteProject: (projectId: string) => void
  onRenameProject: (projectId: string, newName: string) => void
  onDuplicateProject: (projectId: string) => void
}

export function ProjectListContent({
  projects,
  activeProjectId,
  onSelectProject,
  onCreateProject,
  onCreateFromTemplate: _onCreateFromTemplate,
  onDeleteProject,
  onRenameProject,
  onDuplicateProject,
}: ProjectListContentProps) {
  const [showCreateDialog, setShowCreateDialog] = React.useState(false)
  const [deleteTarget, setDeleteTarget] = React.useState<{ id: string; name: string } | null>(null)
  const [editingProjectId, setEditingProjectId] = React.useState<string | null>(null)
  const [editingName, setEditingName] = React.useState('')
  const [searchQuery, setSearchQuery] = React.useState('')
  const editInputRef = React.useRef<HTMLInputElement>(null)

  const { userProjects, exampleProjects } = React.useMemo(() => {
    const allProjects = sortProjectsByLastModified(Object.values(projects))
    const query = searchQuery.trim().toLowerCase()
    const filtered = query
      ? allProjects.filter((p) => p.name.toLowerCase().includes(query))
      : allProjects
    return {
      userProjects: filtered.filter((p) => !isBuiltInProject(p)),
      exampleProjects: filtered.filter((p) => isBuiltInProject(p)),
    }
  }, [projects, searchQuery])

  const projectCount = Object.keys(projects).length
  const canDeleteAny = projectCount > 1

  React.useEffect(() => {
    if (editingProjectId && editInputRef.current) {
      editInputRef.current.focus()
      editInputRef.current.select()
    }
  }, [editingProjectId])

  const handleSelectProject = (projectId: string) => {
    if (editingProjectId) return
    onSelectProject(projectId)
  }

  const handleCreateProject = (name: string) => {
    onCreateProject(name)
    setShowCreateDialog(false)
  }

  const handleDeleteClick = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation()
    setDeleteTarget({ id: project.id, name: project.name })
  }

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      onDeleteProject(deleteTarget.id)
      setDeleteTarget(null)
    }
  }

  const handleEditClick = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation()
    setEditingProjectId(project.id)
    setEditingName(project.name)
  }

  const handleSaveRename = () => {
    if (editingProjectId && editingName.trim()) {
      onRenameProject(editingProjectId, editingName.trim())
    }
    setEditingProjectId(null)
    setEditingName('')
  }

  const handleCancelRename = () => {
    setEditingProjectId(null)
    setEditingName('')
  }

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSaveRename()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancelRename()
    }
  }

  const handleDuplicateClick = (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation()
    onDuplicateProject(projectId)
  }

  if (deleteTarget) {
    return (
      <ProjectDeleteDialog
        projectName={deleteTarget.name}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    )
  }

  if (showCreateDialog) {
    return (
      <ProjectCreateDialog
        onConfirm={handleCreateProject}
        onCancel={() => setShowCreateDialog(false)}
      />
    )
  }

  return (
    <>
      {/* New Project button */}
      <div className="flex justify-start mb-3">
        <button
          onClick={() => setShowCreateDialog(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
        >
          <Plus size={14} />
          New Project
        </button>
      </div>

      {/* Search */}
      <div className="mb-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects..."
            className="w-full text-sm pl-9 pr-3 py-2 rounded-md border border-slate-200 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-blue-500 dark:focus:border-blue-400"
          />
        </div>
      </div>

      {/* No results */}
      {userProjects.length === 0 && exampleProjects.length === 0 && searchQuery.trim() && (
        <div className="text-center py-8 text-sm text-slate-500 dark:text-slate-400">
          No projects match "{searchQuery}"
        </div>
      )}

      {/* User Projects */}
      {userProjects.length > 0 && (
        <div className="space-y-2">
          {userProjects.map((project) => {
            const metadata = getProjectMetadata(project)
            const isActive = project.id === activeProjectId
            const canDelete = canDeleteAny
            const isEditing = editingProjectId === project.id

            return (
              <div key={project.id} className="group relative">
                <button
                  onClick={() => handleSelectProject(project.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                    isActive
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-slate-200 dark:border-neutral-700 hover:border-slate-300 dark:hover:border-neutral-600 hover:bg-slate-50 dark:hover:bg-neutral-750'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {isEditing ? (
                          <input
                            ref={editInputRef}
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onBlur={handleSaveRename}
                            onKeyDown={handleRenameKeyDown}
                            onClick={(e) => e.stopPropagation()}
                            className="text-sm font-medium px-1 py-0.5 -ml-1 rounded border border-blue-500 bg-white dark:bg-neutral-900 text-slate-800 dark:text-slate-200 outline-none w-full max-w-[200px]"
                          />
                        ) : (
                          <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                            {project.name}
                          </span>
                        )}
                        {isActive && (
                          <span className="shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <Layers size={12} />
                          {metadata.contextCount} context{metadata.contextCount !== 1 ? 's' : ''}
                        </span>
                        {metadata.lastModified && (
                          <span>{formatRelativeTime(metadata.lastModified)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
                <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => handleEditClick(e, project)}
                    className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-neutral-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    title="Rename project"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={(e) => handleDuplicateClick(e, project.id)}
                    className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-neutral-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    title="Duplicate project"
                  >
                    <Copy size={14} />
                  </button>
                  {canDelete && (
                    <button
                      onClick={(e) => handleDeleteClick(e, project)}
                      className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 dark:hover:text-red-400"
                      title="Delete project"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Examples Section */}
      {exampleProjects.length > 0 && (
        <div className={userProjects.length > 0 ? 'mt-6' : ''}>
          <div className="flex items-center gap-2 mb-3 pt-4 border-t border-slate-200 dark:border-neutral-700">
            <BookOpen size={14} className="text-slate-400 dark:text-slate-500" />
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Examples
            </span>
          </div>
          <div className="space-y-2">
            {exampleProjects.map((project) => {
              const metadata = getProjectMetadata(project)
              const isActive = project.id === activeProjectId
              const description = EXAMPLE_DESCRIPTIONS[project.name]

              return (
                <div key={project.id} className="group relative">
                  <button
                    onClick={() => handleSelectProject(project.id)}
                    className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                      isActive
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-slate-200 dark:border-neutral-700 hover:border-slate-300 dark:hover:border-neutral-600 hover:bg-slate-50 dark:hover:bg-neutral-750'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                            {project.name}
                          </span>
                          {isActive && (
                            <span className="shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                              Active
                            </span>
                          )}
                        </div>
                        {description && (
                          <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                            {description}
                          </div>
                        )}
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <Layers size={12} />
                            {metadata.contextCount} context{metadata.contextCount !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                  <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleDuplicateClick(e, project.id)}
                      className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-neutral-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      title="Duplicate project"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </>
  )
}
