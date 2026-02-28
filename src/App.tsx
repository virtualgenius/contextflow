import React from 'react'
import { useEditorStore } from './model/store'
import { CanvasArea } from './components/CanvasArea'
import { InspectorPanel } from './components/InspectorPanel'
import { TopBar } from './components/TopBar'
import { RepoSidebar } from './components/RepoSidebar'
import { TeamSidebar } from './components/TeamSidebar'
import { GroupCreateDialog } from './components/GroupCreateDialog'
import { ProjectListPage } from './components/ProjectListPage'
import { OfflineBlockingModal } from './components/OfflineBlockingModal'
import { useCollabStore } from './model/collabStore'
import { Users, X } from 'lucide-react'
import { trackEvent } from './utils/analytics'
import { useUrlRouter } from './hooks/useUrlRouter'

const MILLISECONDS_PER_SECOND = 1000

function App() {
  const projectId = useEditorStore(s => s.activeProjectId)
  const { route, params: _params } = useUrlRouter()

  // Show project list page when no active project and not on a shared-project route
  if (!projectId && route !== 'shared-project') {
    return <ProjectListPage />
  }

  return <Workspace />
}

function Workspace() {
  const projectId = useEditorStore(s => s.activeProjectId)
  const project = useEditorStore(s => (projectId ? s.projects[projectId] : undefined))
  const selectedContextId = useEditorStore(s => s.selectedContextId)
  const selectedGroupId = useEditorStore(s => s.selectedGroupId)
  const selectedUserId = useEditorStore(s => s.selectedUserId)
  const selectedUserNeedId = useEditorStore(s => s.selectedUserNeedId)
  const selectedRelationshipId = useEditorStore(s => s.selectedRelationshipId)
  const selectedUserNeedConnectionId = useEditorStore(s => s.selectedUserNeedConnectionId)
  const selectedNeedContextConnectionId = useEditorStore(s => s.selectedNeedContextConnectionId)
  const selectedStageIndex = useEditorStore(s => s.selectedStageIndex)
  const selectedTeamId = useEditorStore(s => s.selectedTeamId)
  const selectedContextIds = useEditorStore(s => s.selectedContextIds)
  const clearContextSelection = useEditorStore(s => s.clearContextSelection)
  const createGroup = useEditorStore(s => s.createGroup)
  const loadSharedProject = useEditorStore(s => s.loadSharedProject)
  const addTeam = useEditorStore(s => s.addTeam)
  const deleteTeam = useEditorStore(s => s.deleteTeam)
  const setSelectedTeam = useEditorStore(s => s.setSelectedTeam)

  const { route, params } = useUrlRouter()

  const connectionState = useCollabStore((s) => s.connectionState)

  const [showGroupDialog, setShowGroupDialog] = React.useState(false)
  const [isLoadingSharedProject, setIsLoadingSharedProject] = React.useState(false)

  const [initializedSharedProjectId, setInitializedSharedProjectId] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (route === 'shared-project' && params.projectId) {
      const sharedProjectId = params.projectId
      if (initializedSharedProjectId !== sharedProjectId) {
        setIsLoadingSharedProject(true)
        loadSharedProject(sharedProjectId).finally(() => {
          setIsLoadingSharedProject(false)
          setInitializedSharedProjectId(sharedProjectId)
        })
      }
    }
  }, [route, params.projectId, loadSharedProject, initializedSharedProjectId])

  // Track project lifecycle (project_closed event)
  React.useEffect(() => {
    const sessionStart = Date.now()

    const handleBeforeUnload = () => {
      if (project) {
        const sessionDuration = Math.floor((Date.now() - sessionStart) / MILLISECONDS_PER_SECOND)
        trackEvent('project_closed', project, {
          session_duration_seconds: sessionDuration
        })
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [project])

  const unassignedRepos = React.useMemo(() => {
    return project?.repos?.filter(r => !r.contextId) || []
  }, [project?.repos])

  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(() => {
    const stored = localStorage.getItem('contextflow.sidebar.collapsed')
    return stored === 'true'
  })

  const [sidebarTab, setSidebarTab] = React.useState<'repos' | 'teams'>(() => {
    const stored = localStorage.getItem('contextflow.sidebarTab')
    if (stored === 'repos' || stored === 'teams') return stored
    return 'repos'
  })

  const hasUnassignedRepos = unassignedRepos.length > 0
  const hasTeams = (project?.teams?.length ?? 0) > 0
  const hasLeftSidebarContent = hasUnassignedRepos || hasTeams
  const showLeftSidebar = hasLeftSidebarContent && !isSidebarCollapsed

  // Auto-select appropriate tab when content changes
  const activeTab = sidebarTab === 'repos' && !hasUnassignedRepos && hasTeams ? 'teams'
    : sidebarTab === 'teams' && !hasTeams && hasUnassignedRepos ? 'repos'
    : sidebarTab
  const hasRightSidebar = !!selectedContextId || !!selectedGroupId || !!selectedUserId || !!selectedUserNeedId || !!selectedRelationshipId || !!selectedUserNeedConnectionId || !!selectedNeedContextConnectionId || selectedStageIndex !== null || !!selectedTeamId

  const gridCols = showLeftSidebar && hasRightSidebar ? 'grid-cols-[240px_1fr_320px]'
                 : showLeftSidebar ? 'grid-cols-[240px_1fr]'
                 : hasRightSidebar ? 'grid-cols-[1fr_320px]'
                 : 'grid-cols-[1fr]'

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const newValue = !prev
      localStorage.setItem('contextflow.sidebar.collapsed', String(newValue))
      return newValue
    })
  }

  const handleTabChange = (tab: 'repos' | 'teams') => {
    setSidebarTab(tab)
    localStorage.setItem('contextflow.sidebarTab', tab)
  }

  return (
    <div className="w-screen h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-neutral-900 dark:text-neutral-100">
      <TopBar />

      {/* Multi-select floating panel */}
      {selectedContextIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg shadow-xl px-4 py-3 flex items-center gap-4">
          <div className="text-sm text-slate-700 dark:text-slate-300">
            {selectedContextIds.length} context{selectedContextIds.length !== 1 ? 's' : ''} selected
          </div>
          <button
            onClick={() => setShowGroupDialog(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors"
          >
            <Users size={14} />
            Create Group
          </button>
          <button
            onClick={clearContextSelection}
            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-neutral-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            title="Clear selection"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Group creation dialog */}
      {showGroupDialog && (
        <GroupCreateDialog
          contextCount={selectedContextIds.length}
          onConfirm={(label, color, notes) => {
            createGroup(label, color, notes)
            setShowGroupDialog(false)
          }}
          onCancel={() => setShowGroupDialog(false)}
        />
      )}

      {/* Loading overlay for shared projects */}
      {isLoadingSharedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl px-8 py-6 flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Connecting to shared project...
            </div>
          </div>
        </div>
      )}

      {/* Offline blocking modal for shared projects */}
      {route === 'shared-project' && !isLoadingSharedProject && (connectionState === 'offline' || connectionState === 'error') && (
        <OfflineBlockingModal />
      )}

      <main className={`flex-1 grid ${gridCols} overflow-hidden`}>
        {/* Left Sidebar - collapsible, with Repos/Teams tabs */}
        {showLeftSidebar && (
          <aside className="border-r border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 flex flex-col">
            {/* Tab bar - only show when both tabs have content */}
            {hasUnassignedRepos && hasTeams ? (
              <div className="flex items-center border-b border-slate-200 dark:border-neutral-700">
                <button
                  onClick={() => handleTabChange('repos')}
                  className={`flex-1 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider transition-colors ${
                    activeTab === 'repos'
                      ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                      : 'text-slate-500 dark:text-neutral-400 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  Repos ({unassignedRepos.length})
                </button>
                <button
                  onClick={() => handleTabChange('teams')}
                  className={`flex-1 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider transition-colors ${
                    activeTab === 'teams'
                      ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                      : 'text-slate-500 dark:text-neutral-400 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  Teams ({project?.teams?.length ?? 0})
                </button>
                <button
                  onClick={toggleSidebar}
                  className="px-2 py-2 hover:bg-slate-100 dark:hover:bg-neutral-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M9 3L3 9M3 3l6 6" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 pb-2">
                <div className="text-[11px] font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">
                  {activeTab === 'repos' ? `Unassigned Repos (${unassignedRepos.length})` : `Teams (${project?.teams?.length ?? 0})`}
                </div>
                <button
                  onClick={toggleSidebar}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-neutral-700 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M9 3L3 9M3 3l6 6" />
                  </svg>
                </button>
              </div>
            )}

            <div className="flex-1 px-4 pb-4 text-xs overflow-y-auto">
              {activeTab === 'repos' ? (
                <RepoSidebar
                  repos={unassignedRepos}
                  teams={project?.teams || []}
                  onRepoAssign={(_repoId, _contextId) => {
                    // Will be implemented with drag-and-drop
                  }}
                />
              ) : (
                <TeamSidebar
                  teams={project?.teams || []}
                  contexts={project?.contexts || []}
                  selectedTeamId={selectedTeamId}
                  onSelectTeam={(teamId) => setSelectedTeam(teamId)}
                  onAddTeam={(name) => addTeam(name)}
                  onDeleteTeam={(teamId) => deleteTeam(teamId)}
                />
              )}
            </div>
          </aside>
        )}

        {/* Canvas Area */}
        <section className="relative bg-slate-100 dark:bg-neutral-800">
          {/* Show button when sidebar is collapsed */}
          {hasLeftSidebarContent && isSidebarCollapsed && (
            <button
              onClick={toggleSidebar}
              className="absolute left-2 top-2 z-10 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded px-2 py-1.5 text-xs text-slate-500 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-neutral-700 hover:text-slate-700 dark:hover:text-slate-300 shadow-sm"
            >
              <div className="flex items-center gap-1">
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M4 9l3-3-3-3" />
                </svg>
                <span className="font-medium">
                  {hasUnassignedRepos ? `Repos (${unassignedRepos.length})` : 'Teams'}
                </span>
              </div>
            </button>
          )}
          <CanvasArea />
        </section>

        {/* Inspector Panel - shown when context, group, user, userNeed, relationship, connection, stage, or team is selected */}
        {(selectedContextId || selectedGroupId || selectedUserId || selectedUserNeedId || selectedRelationshipId || selectedUserNeedConnectionId || selectedNeedContextConnectionId || selectedStageIndex !== null || selectedTeamId) && (
          <aside className="border-l border-slate-200 dark:border-neutral-700 p-4 text-xs overflow-y-auto bg-white dark:bg-neutral-800">
            <InspectorPanel />
          </aside>
        )}
      </main>
    </div>
  )
}

export default App
