import React, { useState, useRef, useEffect } from 'react'
import { useEditorStore } from '../model/store'
import { Undo2, Redo2, Plus, Download, Upload, User, Settings, Box, Hash, Target, Share2, Home } from 'lucide-react'
import { useUrlRouter } from '../hooks/useUrlRouter'
import { InfoTooltip } from './InfoTooltip'
import { SimpleTooltip } from './SimpleTooltip'
import { Switch } from './Switch'
import { SettingsViewOptions } from './settings/SettingsViewOptions'
import { SettingsHelp } from './settings/SettingsHelp'
import { SettingsDisplay } from './settings/SettingsDisplay'
import { SettingsIntegrations } from './settings/SettingsIntegrations'
import { CloudStatusIndicator } from './CloudStatusIndicator'
import { ShareProjectDialog } from './ShareProjectDialog'
import { GettingStartedGuideModal } from './GettingStartedGuideModal'
import { KeyboardShortcutsModal } from './KeyboardShortcutsModal'
import { ImportConflictDialog } from './ImportConflictDialog'
import { VIEW_DESCRIPTIONS, STAGE_DEFINITION, USER_DEFINITION, USER_NEED_DEFINITION, BOUNDED_CONTEXT_DEFINITION, TEMPORAL_MODE } from '../model/conceptDefinitions'
import { checkImportConflict, importProjectAsNew, validateImportedProject } from '../model/actions/projectActions'
import type { Project } from '../model/types'
import { version } from '../../package.json'

export function TopBar() {
  const settingsRef = useRef<HTMLDivElement>(null)
  const projectId = useEditorStore(s => s.activeProjectId)
  const project = useEditorStore(s => (projectId ? s.projects[projectId] : undefined))
  const projects = useEditorStore(s => s.projects)
  const viewMode = useEditorStore(s => s.activeViewMode)
  const setViewMode = useEditorStore(s => s.setViewMode)
  const setActiveProject = useEditorStore(s => s.setActiveProject)
  const canUndo = useEditorStore(s => s.undoStack.length > 0)
  const canRedo = useEditorStore(s => s.redoStack.length > 0)
  const undo = useEditorStore(s => s.undo)
  const redo = useEditorStore(s => s.redo)
  const addContext = useEditorStore(s => s.addContext)
  const addUser = useEditorStore(s => s.addUser)
  const addUserNeed = useEditorStore(s => s.addUserNeed)
  const addFlowStage = useEditorStore(s => s.addFlowStage)
  const importProject = useEditorStore(s => s.importProject)
  const clearActiveProject = useEditorStore(s => s.clearActiveProject)
  const toggleTemporalMode = useEditorStore(s => s.toggleTemporalMode)
  const temporalEnabled = project?.temporal?.enabled || false
  const { route, navigate } = useUrlRouter()
  const [showSettings, setShowSettings] = useState(false)
  const [showGettingStartedGuide, setShowGettingStartedGuide] = useState(false)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false)
  const [importConflict, setImportConflict] = useState<{
    importedProject: Project
    existingProject: Project
  } | null>(null)

  // Close settings popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false)
      }
    }
    if (showSettings) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showSettings])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) return

      if (e.key === '?' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setShowKeyboardShortcuts(prev => !prev)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const selectProjectAndExitSharedMode = (newProjectId: string) => {
    if (route === 'shared-project') {
      navigate('/')
    }
    setActiveProject(newProjectId)
  }

  const handleExport = () => {
    if (!project) return
    const json = JSON.stringify(project, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${project.name.replace(/\s+/g, '-').toLowerCase()}.project.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target?.result as string)
          const validation = validateImportedProject(json)
          if (!validation.valid) {
            alert(`Failed to import project: ${validation.error}`)
            return
          }
          const project = json as Project
          const conflict = checkImportConflict(project, projects)
          if (conflict.hasConflict && conflict.existingProject) {
            setImportConflict({
              importedProject: project,
              existingProject: conflict.existingProject,
            })
          } else {
            importProject(project)
          }
        } catch (err) {
          alert('Failed to import project: Invalid JSON file')
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  const handleImportReplace = () => {
    if (importConflict) {
      importProject(importConflict.importedProject)
      setImportConflict(null)
    }
  }

  const handleImportAsNew = () => {
    if (importConflict) {
      const existingNames = Object.values(projects).map((p) => p.name)
      const newProject = importProjectAsNew(importConflict.importedProject, existingNames)
      importProject(newProject)
      setImportConflict(null)
    }
  }

  const handleAddContext = () => {
    const name = prompt('Context name:')
    if (!name) return
    addContext(name)
  }

  const handleAddUser = () => {
    const name = prompt('User name:')
    if (!name) return
    addUser(name)
  }

  const handleAddUserNeed = () => {
    const name = prompt('User need name:')
    if (!name) return
    addUserNeed(name)
  }

  const handleAddStage = () => {
    const name = prompt('Stage name:')
    if (!name) return

    try {
      addFlowStage(name.trim())
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add stage')
    }
  }

  return (
    <header className="flex items-center gap-4 px-5 py-3 border-b border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800">
      {/* Logo */}
      <SimpleTooltip text={`v${version}`}>
        <div className="font-semibold text-base text-slate-800 dark:text-slate-100">
          ContextFlow
        </div>
      </SimpleTooltip>

      {/* Home button */}
      <SimpleTooltip text="Back to projects">
        <button
          onClick={() => {
            if (route === 'shared-project') {
              navigate('/')
            }
            clearActiveProject()
          }}
          className="p-1.5 rounded text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-neutral-700 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          aria-label="Back to projects"
        >
          <Home size={16} />
        </button>
      </SimpleTooltip>

      {/* Project name */}
      {project && (
        <>
          <div className="text-slate-400 dark:text-slate-500">•</div>
          <span className="text-sm text-slate-600 dark:text-slate-300 font-medium truncate max-w-[220px]">
            {project.name}
          </span>
        </>
      )}

      {/* Add buttons - primary creation CTAs */}
      <div className="ml-4 flex items-center gap-1 bg-slate-50 dark:bg-neutral-900 rounded-lg px-1.5 py-1">
        <InfoTooltip content={BOUNDED_CONTEXT_DEFINITION} position="bottom">
          <AddButton
            onClick={handleAddContext}
            icon={<Box size={14} />}
            label="Context"
          />
        </InfoTooltip>

        {/* User/Need buttons: Strategic and Value Stream views (not Distillation) */}
        {viewMode !== 'distillation' && (
          <>
            <InfoTooltip content={USER_DEFINITION} position="bottom">
              <AddButton
                onClick={handleAddUser}
                icon={<User size={14} />}
                label="User"
              />
            </InfoTooltip>
            <InfoTooltip content={USER_NEED_DEFINITION} position="bottom">
              <AddButton
                onClick={handleAddUserNeed}
                icon={<Target size={14} />}
                label="Need"
              />
            </InfoTooltip>
          </>
        )}

        {/* Add Stage button - only in Value Stream View */}
        {viewMode === 'flow' && (
          <InfoTooltip content={STAGE_DEFINITION} position="bottom">
            <AddButton
              onClick={handleAddStage}
              icon={<Hash size={14} />}
              label="Stage"
            />
          </InfoTooltip>
        )}
      </div>

      {/* Actions */}
      <div className="ml-auto flex items-center gap-2">
        {/* View Toggle */}
        <div className="flex items-center bg-slate-100 dark:bg-neutral-900 rounded-lg p-1">
          <InfoTooltip content={VIEW_DESCRIPTIONS.flow}>
            <button
              onClick={() => setViewMode('flow')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                viewMode === 'flow'
                  ? 'bg-white dark:bg-neutral-700 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              Value Stream
            </button>
          </InfoTooltip>
          <InfoTooltip content={VIEW_DESCRIPTIONS.distillation}>
            <button
              onClick={() => setViewMode('distillation')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                viewMode === 'distillation'
                  ? 'bg-white dark:bg-neutral-700 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              Distillation
            </button>
          </InfoTooltip>
          <InfoTooltip content={VIEW_DESCRIPTIONS.strategic}>
            <button
              onClick={() => setViewMode('strategic')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                viewMode === 'strategic'
                  ? 'bg-white dark:bg-neutral-700 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              Strategic
            </button>
          </InfoTooltip>
        </div>

        {/* Temporal Mode toggle - only visible in Strategic View */}
        {viewMode === 'strategic' && (
          <>
            <div className="w-px h-5 bg-slate-200 dark:bg-neutral-700" />
            <InfoTooltip content={TEMPORAL_MODE} position="bottom">
              <Switch checked={temporalEnabled} onCheckedChange={() => toggleTemporalMode()} label="Temporal" />
            </InfoTooltip>
          </>
        )}

        <div className="w-px h-5 bg-slate-200 dark:bg-neutral-700" />

        <SimpleTooltip text="Undo (⌘Z)">
          <IconButton
            onClick={undo}
            icon={<Undo2 size={16} />}
            ariaLabel="Undo"
            disabled={!canUndo}
          />
        </SimpleTooltip>
        <SimpleTooltip text="Redo (⌘⇧Z)">
          <IconButton
            onClick={redo}
            icon={<Redo2 size={16} />}
            ariaLabel="Redo"
            disabled={!canRedo}
          />
        </SimpleTooltip>

        <div className="w-px h-5 bg-slate-200 dark:bg-neutral-700" />

        <SimpleTooltip text="Get a shareable link to collaborate with others">
          <IconButton
            onClick={() => setShowShareDialog(true)}
            icon={<Share2 size={16} />}
            ariaLabel="Share project"
          />
        </SimpleTooltip>
        <SimpleTooltip text="Download project as a file for backup or sharing">
          <IconButton
            onClick={handleExport}
            icon={<Download size={16} />}
            ariaLabel="Export project"
          />
        </SimpleTooltip>
        <SimpleTooltip text="Load a project from a downloaded file">
          <IconButton
            onClick={handleImport}
            icon={<Upload size={16} />}
            ariaLabel="Import project"
          />
        </SimpleTooltip>

        <div className="w-px h-5 bg-slate-200 dark:bg-neutral-700" />

        <CloudStatusIndicator />

        <div className="w-px h-5 bg-slate-200 dark:bg-neutral-700" />

        <div className="relative" ref={settingsRef}>
          <SimpleTooltip text="Display options and preferences">
            <IconButton
              onClick={() => setShowSettings(!showSettings)}
              icon={<Settings size={16} />}
              ariaLabel="Settings"
            />
          </SimpleTooltip>

          {showSettings && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg shadow-lg p-4 z-50">
              <div className="space-y-4">
                <SettingsViewOptions />
                <div className="border-t border-slate-200 dark:border-neutral-700" />
                <SettingsHelp
                  onOpenGettingStarted={() => {
                    setShowGettingStartedGuide(true)
                    setShowSettings(false)
                  }}
                  onOpenKeyboardShortcuts={() => {
                    setShowKeyboardShortcuts(true)
                    setShowSettings(false)
                  }}
                />
                <div className="border-t border-slate-200 dark:border-neutral-700" />
                <SettingsDisplay />
                <div className="border-t border-slate-200 dark:border-neutral-700" />
                <SettingsIntegrations />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Getting Started Guide Modal */}
      {showGettingStartedGuide && (
        <GettingStartedGuideModal
          onClose={() => setShowGettingStartedGuide(false)}
          onViewSample={() => {
            selectProjectAndExitSharedMode('acme-ecommerce')
            setShowGettingStartedGuide(false)
          }}
        />
      )}

      {/* Import Conflict Dialog */}
      {importConflict && (
        <ImportConflictDialog
          importedProjectName={importConflict.importedProject.name}
          existingProjectName={importConflict.existingProject.name}
          onReplace={handleImportReplace}
          onImportAsNew={handleImportAsNew}
          onCancel={() => setImportConflict(null)}
        />
      )}

      {/* Keyboard Shortcuts Modal */}
      {showKeyboardShortcuts && (
        <KeyboardShortcutsModal onClose={() => setShowKeyboardShortcuts(false)} />
      )}

      {/* Share Project Dialog */}
      {showShareDialog && projectId && project && (
        <ShareProjectDialog
          projectId={projectId}
          projectName={project.name}
          onClose={() => setShowShareDialog(false)}
        />
      )}
    </header>
  )
}

interface IconButtonProps {
  onClick: () => void
  icon: React.ReactNode
  label?: string
  ariaLabel?: string
  disabled?: boolean
}

function IconButton({ onClick, icon, label, ariaLabel, disabled }: IconButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label ? undefined : ariaLabel}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
        disabled
          ? 'text-slate-300 dark:text-neutral-600 cursor-not-allowed'
          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-neutral-700 hover:text-slate-900 dark:hover:text-slate-100'
      }`}
    >
      {icon}
      {label && <span>{label}</span>}
    </button>
  )
}

interface AddButtonProps {
  onClick: () => void
  icon: React.ReactNode
  label: string
}

function AddButton({ onClick, icon, label }: AddButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-neutral-700 hover:text-slate-900 dark:hover:text-slate-100 hover:shadow-sm"
    >
      <Plus size={12} className="text-slate-400 dark:text-slate-500" />
      {icon}
      <span>{label}</span>
    </button>
  )
}
