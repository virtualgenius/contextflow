import React from 'react'
import { useEditorStore } from './model/store'
import { Z_LAYERS } from './lib/zLayers'
import { CanvasArea } from './components/CanvasArea'
import { InspectorPanel } from './components/InspectorPanel'
import { TopBar } from './components/TopBar'
import { RepoSidebar } from './components/RepoSidebar'
import { TeamSidebar } from './components/TeamSidebar'
import { FocusBar, type FocusSubject, type FocusTeamOption } from './components/FocusBar'
import { computeFocusedContextIds, countFocusedContexts, toggleTeamFocus } from './lib/focus'
import { getTopologyColors } from './lib/teamColors'
import { GroupCreateDialog } from './components/GroupCreateDialog'
import { ProjectListPage } from './components/ProjectListPage'
import { OfflineBlockingModal } from './components/OfflineBlockingModal'
import { useCollabStore } from './model/collabStore'
import { Users, X, ChevronRight } from 'lucide-react'
import { trackEvent } from './utils/analytics'
import { useUrlRouter } from './hooks/useUrlRouter'

const MILLISECONDS_PER_SECOND = 1000

function App() {
  const projectId = useEditorStore((s) => s.activeProjectId)
  const { route, params: _params } = useUrlRouter()

  // Show project list page when no active project and not on a shared-project route
  if (!projectId && route !== 'shared-project') {
    return <ProjectListPage />
  }

  return <Workspace />
}

function Workspace() {
  const projectId = useEditorStore((s) => s.activeProjectId)
  const project = useEditorStore((s) => (projectId ? s.projects[projectId] : undefined))
  const selectedContextId = useEditorStore((s) => s.selectedContextId)
  const selectedGroupId = useEditorStore((s) => s.selectedGroupId)
  const selectedUserId = useEditorStore((s) => s.selectedUserId)
  const selectedUserNeedId = useEditorStore((s) => s.selectedUserNeedId)
  const selectedRelationshipId = useEditorStore((s) => s.selectedRelationshipId)
  const selectedUserNeedConnectionId = useEditorStore((s) => s.selectedUserNeedConnectionId)
  const selectedNeedContextConnectionId = useEditorStore((s) => s.selectedNeedContextConnectionId)
  const selectedStageIndex = useEditorStore((s) => s.selectedStageIndex)
  const selectedTeamId = useEditorStore((s) => s.selectedTeamId)
  const selectedRepoId = useEditorStore((s) => s.selectedRepoId)
  const selectedContextIds = useEditorStore((s) => s.selectedContextIds)
  const clearContextSelection = useEditorStore((s) => s.clearContextSelection)
  const createGroup = useEditorStore((s) => s.createGroup)
  const loadSharedProject = useEditorStore((s) => s.loadSharedProject)
  const addTeam = useEditorStore((s) => s.addTeam)
  const addRepo = useEditorStore((s) => s.addRepo)
  const deleteRepo = useEditorStore((s) => s.deleteRepo)
  const deleteTeam = useEditorStore((s) => s.deleteTeam)
  const setSelectedTeam = useEditorStore((s) => s.setSelectedTeam)
  const setSelectedRepo = useEditorStore((s) => s.setSelectedRepo)
  const focus = useEditorStore((s) => s.focus)
  const setFocus = useEditorStore((s) => s.setFocus)
  const setFocusDepth = useEditorStore((s) => s.setFocusDepth)
  const clearFocus = useEditorStore((s) => s.clearFocus)

  const { route, params } = useUrlRouter()

  const connectionState = useCollabStore((s) => s.connectionState)

  const [showGroupDialog, setShowGroupDialog] = React.useState(false)
  const [isLoadingSharedProject, setIsLoadingSharedProject] = React.useState(false)

  const [initializedSharedProjectId, setInitializedSharedProjectId] = React.useState<string | null>(
    null
  )

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
          session_duration_seconds: sessionDuration,
        })
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [project])

  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(() => {
    const stored = localStorage.getItem('contextflow.sidebar.collapsed')
    return stored === 'true'
  })

  const [sidebarTab, setSidebarTab] = React.useState<'repos' | 'teams'>(() => {
    const stored = localStorage.getItem('contextflow.sidebarTab')
    if (stored === 'repos' || stored === 'teams') return stored
    return 'repos'
  })

  const hasRepos = (project?.repos?.length ?? 0) > 0
  const hasTeams = (project?.teams?.length ?? 0) > 0
  // The sidebar is always reachable so teams/repos can be set up before anything
  // is assigned to a context; it hides only when the user collapses it.
  const showLeftSidebar = !isSidebarCollapsed

  // Auto-select appropriate tab when content changes
  const activeTab =
    sidebarTab === 'repos' && !hasRepos && hasTeams
      ? 'teams'
      : sidebarTab === 'teams' && !hasTeams && hasRepos
        ? 'repos'
        : sidebarTab
  const hasRightSidebar =
    !!selectedContextId ||
    !!selectedGroupId ||
    !!selectedUserId ||
    !!selectedUserNeedId ||
    !!selectedRelationshipId ||
    !!selectedUserNeedConnectionId ||
    !!selectedNeedContextConnectionId ||
    selectedStageIndex !== null ||
    !!selectedTeamId ||
    !!selectedRepoId

  const gridCols =
    showLeftSidebar && hasRightSidebar
      ? 'grid-cols-[240px_1fr_320px]'
      : showLeftSidebar
        ? 'grid-cols-[240px_1fr]'
        : hasRightSidebar
          ? 'grid-cols-[1fr_320px]'
          : 'grid-cols-[1fr]'

  const focusSubject: FocusSubject | null = React.useMemo(() => {
    if (!focus || !project) return null
    if (focus.kind === 'team') {
      const team = project.teams.find((t) => t.id === focus.id)
      if (!team) return null
      return {
        kind: 'team',
        label: team.name,
        color: getTopologyColors(team.topologyType).light.border,
      }
    }
    const context = project.contexts.find((c) => c.id === focus.id)
    if (!context) return null
    return { kind: 'context', label: context.name, color: '#2563eb' }
  }, [focus, project])

  const focusedCount = React.useMemo(() => {
    if (!focus || !project) return 0
    const focusedIds = computeFocusedContextIds(focus, project.contexts, project.relationships)
    return countFocusedContexts(focusedIds, project.contexts)
  }, [focus, project])

  // Teams a focused user can hop between: only those owning at least one context
  // (focusing an empty team would dim the whole map for nothing).
  const focusTeamOptions: FocusTeamOption[] = React.useMemo(() => {
    if (!project) return []
    return (project.teams ?? [])
      .map((team) => ({
        id: team.id,
        name: team.name,
        color: getTopologyColors(team.topologyType).light.border,
        count: project.contexts.filter((c) => c.teamId === team.id).length,
      }))
      .filter((team) => team.count > 0)
  }, [project])

  const handleSwitchFocusTeam = (teamId: string) => {
    trackEvent('focus_team_switched', project ?? null, { team_id: teamId })
    setFocus({ kind: 'team', id: teamId, depth: focus?.depth ?? 0 })
  }

  // Clicking a team's focus crosshair toggles: focus that team, or exit focus if
  // it is already the focused team.
  const handleToggleTeamFocus = (teamId: string) => {
    const next = toggleTeamFocus(focus, teamId)
    if (next) setFocus(next)
    else clearFocus()
  }

  const focusedTeamId = focus?.kind === 'team' ? focus.id : null

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const newValue = !prev
      localStorage.setItem('contextflow.sidebar.collapsed', String(newValue))
      return newValue
    })
  }

  const handleTabChange = (tab: 'repos' | 'teams') => {
    setSidebarTab(tab)
    localStorage.setItem('contextflow.sidebarTab', tab)
    trackEvent('sidebar_tab_changed', null, { tab })
  }

  return (
    <div className="w-screen h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-neutral-900 dark:text-neutral-100">
      <TopBar />

      {/* Multi-select floating panel */}
      {selectedContextIds.length > 0 && (
        <div
          className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg shadow-xl px-4 py-3 flex items-center gap-4"
          style={{ zIndex: Z_LAYERS.floating }}
        >
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
        <div
          className="fixed inset-0 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm"
          style={{ zIndex: Z_LAYERS.dialog }}
        >
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl px-8 py-6 flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Connecting to shared project...
            </div>
          </div>
        </div>
      )}

      {/* Offline blocking modal for shared projects */}
      {route === 'shared-project' &&
        !isLoadingSharedProject &&
        (connectionState === 'offline' || connectionState === 'error') && <OfflineBlockingModal />}

      <main className={`flex-1 grid ${gridCols} overflow-hidden`}>
        {/* Left Sidebar - collapsible, with Repos/Teams tabs */}
        {showLeftSidebar && (
          <aside className="border-r border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 flex flex-col min-h-0 min-w-0">
            {/* Tab bar - always show both tabs so either can be set up from empty */}
            <div className="flex items-center border-b border-slate-200 dark:border-neutral-700">
              <button
                onClick={() => handleTabChange('repos')}
                className={`flex-1 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider transition-colors ${
                  activeTab === 'repos'
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                    : 'text-slate-500 dark:text-neutral-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                Repos ({project?.repos?.length ?? 0})
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
                <X size={12} strokeWidth={2} />
              </button>
            </div>

            <div className="flex-1 min-h-0 min-w-0 text-xs">
              {activeTab === 'repos' ? (
                <RepoSidebar
                  repos={project?.repos || []}
                  teams={project?.teams || []}
                  contexts={project?.contexts || []}
                  onRepoAssign={(_repoId, _contextId) => {
                    // Will be implemented with drag-and-drop
                  }}
                  onAddRepo={(name) => addRepo(name, 'sidebar')}
                  onDeleteRepo={(repoId) => deleteRepo(repoId)}
                  selectedRepoId={selectedRepoId}
                  onSelectRepo={(repoId) => setSelectedRepo(repoId)}
                />
              ) : (
                <TeamSidebar
                  teams={project?.teams || []}
                  contexts={project?.contexts || []}
                  selectedTeamId={selectedTeamId}
                  focusedTeamId={focusedTeamId}
                  onSelectTeam={(teamId) => setSelectedTeam(teamId)}
                  onFocusTeam={(teamId) => handleToggleTeamFocus(teamId)}
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
          {isSidebarCollapsed && (
            <button
              onClick={toggleSidebar}
              className="absolute left-2 top-2 z-10 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded px-2 py-1.5 text-xs text-slate-500 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-neutral-700 hover:text-slate-700 dark:hover:text-slate-300 shadow-sm"
            >
              <div className="flex items-center gap-1">
                <ChevronRight size={10} strokeWidth={2} />
                <span className="font-medium">
                  {activeTab === 'repos'
                    ? `Repos (${project?.repos?.length ?? 0})`
                    : `Teams (${project?.teams?.length ?? 0})`}
                </span>
              </div>
            </button>
          )}
          {focusSubject && focus && (
            <FocusBar
              subject={focusSubject}
              depth={focus.depth}
              onDepthChange={setFocusDepth}
              visibleCount={focusedCount}
              totalCount={project?.contexts.length ?? 0}
              onExit={clearFocus}
              teamOptions={focusTeamOptions}
              currentTeamId={focus.kind === 'team' ? focus.id : undefined}
              onSwitchTeam={handleSwitchFocusTeam}
            />
          )}
          <CanvasArea />
        </section>

        {/* Inspector Panel - shown when context, group, user, userNeed, relationship, connection, stage, or team is selected */}
        {(selectedContextId ||
          selectedGroupId ||
          selectedUserId ||
          selectedUserNeedId ||
          selectedRelationshipId ||
          selectedUserNeedConnectionId ||
          selectedNeedContextConnectionId ||
          selectedStageIndex !== null ||
          selectedTeamId ||
          selectedRepoId) && (
          <aside className="border-l border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 flex flex-col min-h-0">
            <div className="flex-1 min-h-0 overflow-y-auto p-4 text-xs">
              <InspectorPanel />
            </div>
          </aside>
        )}
      </main>
    </div>
  )
}

export default App
