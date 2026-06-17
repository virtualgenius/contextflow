import React from 'react'
import { ExternalLink, FolderGit2, Search, Trash2, X } from 'lucide-react'
import type { Repo, Team, BoundedContext } from '../model/types'
import { getTopologyColors, TOPOLOGY_LABELS } from '../lib/teamColors'
import { SimpleTooltip } from './SimpleTooltip'
import { SidebarFilterChips, type FilterChipOption } from './SidebarFilterChips'
import { trackEvent } from '../utils/analytics'

type StatusFilter = 'all' | 'unassigned' | 'assigned'

const STATUS_FILTER_OPTIONS: FilterChipOption<StatusFilter>[] = [
  { value: 'all', label: 'All' },
  { value: 'unassigned', label: 'Unassigned' },
  { value: 'assigned', label: 'Assigned' },
]

function isRepoAssigned(repo: Repo, contexts: BoundedContext[]): boolean {
  return contextNameForRepo(repo, contexts) !== null
}

interface RepoSidebarProps {
  repos: Repo[]
  teams: Team[]
  contexts: BoundedContext[]
  onRepoAssign: (repoId: string, contextId: string) => void
  onAddRepo?: (name: string) => void
  onDeleteRepo?: (repoId: string) => void
  selectedRepoId?: string | null
  onSelectRepo?: (repoId: string) => void
}

function contextNameForRepo(repo: Repo, contexts: BoundedContext[]): string | null {
  if (!repo.contextId) return null
  const ctx = contexts.find((c) => c.id === repo.contextId)
  return ctx?.name ?? null
}

export function RepoSidebar({
  repos,
  teams,
  contexts,
  onRepoAssign: _onRepoAssign,
  onAddRepo,
  onDeleteRepo,
  selectedRepoId,
  onSelectRepo,
}: RepoSidebarProps) {
  const [searchQuery, setSearchQuery] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('all')
  const [newRepoName, setNewRepoName] = React.useState('')

  const handleStatusFilter = (value: StatusFilter) => {
    setStatusFilter(value)
    trackEvent('sidebar_filter_changed', null, { tab: 'repos', value })
  }

  const handleAddRepo = () => {
    const trimmed = newRepoName.trim()
    if (!trimmed) return
    onAddRepo?.(trimmed)
    setNewRepoName('')
  }

  const handleAddKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddRepo()
    }
  }

  const filteredRepos = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return repos.filter((r) => {
      if (query && !r.name.toLowerCase().includes(query)) return false
      if (statusFilter === 'assigned' && !isRepoAssigned(r, contexts)) return false
      if (statusFilter === 'unassigned' && isRepoAssigned(r, contexts)) return false
      return true
    })
  }, [repos, searchQuery, statusFilter, contexts])

  const isFiltering = searchQuery.trim().length > 0 || statusFilter !== 'all'

  const { unassigned, assigned } = React.useMemo(() => {
    const unassignedList: Repo[] = []
    const assignedList: Repo[] = []
    for (const repo of filteredRepos) {
      const ctxName = contextNameForRepo(repo, contexts)
      if (ctxName) {
        assignedList.push(repo)
      } else {
        unassignedList.push(repo)
      }
    }
    return { unassigned: unassignedList, assigned: assignedList }
  }, [filteredRepos, contexts])

  const hasBothSections = unassigned.length > 0 && assigned.length > 0

  const getTeamsForRepo = (repo: Repo): Team[] => {
    return teams.filter((t) => repo.teamIds.includes(t.id))
  }

  const handleDragStart = (e: React.DragEvent, repoId: string) => {
    e.dataTransfer.setData('application/contextflow-repo', repoId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDeleteRepo = (e: React.MouseEvent, repo: Repo, isAssigned: boolean) => {
    e.stopPropagation()
    if (isAssigned) {
      if (!window.confirm(`Delete repo "${repo.name}"? It will be removed from its context.`)) {
        return
      }
    }
    onDeleteRepo?.(repo.id)
  }

  const renderRepoCard = (repo: Repo, isAssigned: boolean) => {
    const repoTeams = getTeamsForRepo(repo)
    const ctxName = isAssigned ? contextNameForRepo(repo, contexts) : null
    const isSelected = repo.id === selectedRepoId

    const card = (
      <div
        data-testid={`repo-card-${repo.id}`}
        draggable={!isAssigned}
        onDragStart={isAssigned ? undefined : (e) => handleDragStart(e, repo.id)}
        onClick={() => onSelectRepo?.(repo.id)}
        className={`w-full bg-slate-50 dark:bg-neutral-900 border rounded p-2.5 transition-colors ${
          isSelected
            ? 'border-blue-400 dark:border-blue-500 ring-1 ring-blue-400 dark:ring-blue-500'
            : 'border-slate-200 dark:border-neutral-700'
        } ${
          isAssigned
            ? 'cursor-pointer opacity-75 hover:opacity-100'
            : 'cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 hover:bg-white dark:hover:bg-neutral-800'
        }`}
      >
        {/* Row 1: name + status pill (top-right) */}
        <div className="flex items-center justify-between gap-2">
          <div className="font-medium text-slate-900 dark:text-slate-100 truncate min-w-0">
            {repo.name}
          </div>
          {ctxName ? (
            <span className="flex-shrink-0 truncate max-w-[96px] text-[10px] px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-neutral-700 text-slate-600 dark:text-slate-300">
              {ctxName}
            </span>
          ) : (
            <span className="flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700">
              Unassigned
            </span>
          )}
        </div>

        {repo.remoteUrl && (
          <a
            href={repo.remoteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 text-[11px] flex items-center gap-1 hover:underline mt-1 min-w-0"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="truncate min-w-0">{repo.remoteUrl}</span>
            <ExternalLink size={10} className="flex-shrink-0" />
          </a>
        )}

        {/* Row 2: team ownership badges (left) + delete (bottom-right) */}
        <div className="flex items-end justify-between gap-2 mt-1.5">
          <div className="flex flex-wrap gap-1">
            {repoTeams.map((team) => {
              const colors = getTopologyColors(team.topologyType)
              const label = team.topologyType ? TOPOLOGY_LABELS[team.topologyType] : undefined
              return (
                <SimpleTooltip
                  key={team.id}
                  text={label ? `${team.name} (${label})` : team.name}
                  position="top"
                >
                  <span
                    className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                    style={{
                      backgroundColor: colors.light.bg,
                      color: colors.light.text,
                      border: `1px solid ${colors.light.border}`,
                    }}
                  >
                    {team.name}
                  </span>
                </SimpleTooltip>
              )
            })}
          </div>
          <button
            aria-label={`Delete ${repo.name}`}
            onClick={(e) => handleDeleteRepo(e, repo, isAssigned)}
            className="p-1 rounded flex-shrink-0 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    )

    if (isAssigned) return <React.Fragment key={repo.id}>{card}</React.Fragment>

    return (
      <SimpleTooltip
        key={repo.id}
        text="Drag onto a context to assign"
        position="right"
        className="block w-full min-w-0"
      >
        {card}
      </SimpleTooltip>
    )
  }

  return (
    <div className="flex flex-col h-full min-h-0 min-w-0">
      {/* Pinned filter chrome */}
      {repos.length > 1 && (
        <div className="px-3 pt-3 pb-2 border-b border-slate-100 dark:border-neutral-800 space-y-2">
          <div className="relative">
            <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
              placeholder="Filter repos..."
              className="w-full text-xs pl-7 pr-7 py-1.5 rounded border border-slate-200 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-blue-500 dark:focus:border-blue-400"
            />
            {searchQuery && (
              <button
                aria-label="clear"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X size={12} />
              </button>
            )}
          </div>
          <SidebarFilterChips
            options={STATUS_FILTER_OPTIONS}
            active={statusFilter}
            onChange={handleStatusFilter}
          />
        </div>
      )}

      {/* Scrollable card list */}
      <div data-testid="repo-scroll" className="flex-1 min-w-0 overflow-y-auto px-3 py-2 space-y-2">
        {repos.length === 0 && (
          <div className="flex flex-col items-center text-center gap-2 px-4 py-8">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-slate-400">
              <FolderGit2 size={18} />
            </div>
            <div className="text-sm font-medium text-slate-600 dark:text-neutral-300">
              No repos yet
            </div>
            <p className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed">
              Add the repositories in your system, then drag each one onto the context it belongs
              to.
            </p>
          </div>
        )}

        {isFiltering && (
          <div className="text-[10px] text-slate-500 dark:text-neutral-400 mb-1">
            {filteredRepos.length} of {repos.length} repos
          </div>
        )}

        {filteredRepos.length === 0 && isFiltering && (
          <div className="text-xs text-slate-500 dark:text-neutral-400 italic py-2">
            No repos match your filter
          </div>
        )}

        {hasBothSections && (
          <div className="text-[10px] font-semibold text-slate-400 dark:text-neutral-500 uppercase tracking-wider pt-1">
            Ready to assign
          </div>
        )}

        {unassigned.map((repo) => renderRepoCard(repo, false))}

        {hasBothSections && (
          <div className="text-[10px] font-semibold text-slate-400 dark:text-neutral-500 uppercase tracking-wider pt-2">
            Assigned
          </div>
        )}

        {assigned.map((repo) => renderRepoCard(repo, true))}
      </div>

      {/* Pinned add repo input */}
      <div className="border-t border-slate-200 dark:border-neutral-700 p-2.5">
        <div className="flex gap-1.5">
          <input
            type="text"
            value={newRepoName}
            onChange={(e) => setNewRepoName(e.target.value)}
            onKeyDown={handleAddKeyDown}
            placeholder="Add repo..."
            className="flex-1 text-xs px-2 py-1.5 rounded border border-slate-200 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 dark:focus:border-blue-400 placeholder:text-slate-400 dark:placeholder:text-neutral-500"
          />
          <button
            onClick={handleAddRepo}
            disabled={!newRepoName.trim()}
            className="px-2 py-1.5 text-xs font-medium rounded bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  )
}
