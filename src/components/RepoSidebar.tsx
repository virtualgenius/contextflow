import React from 'react'
import { ExternalLink, Search, X } from 'lucide-react'
import type { Repo, Team, BoundedContext } from '../model/types'
import { getTopologyColors, TOPOLOGY_LABELS } from '../lib/teamColors'

interface RepoSidebarProps {
  repos: Repo[]
  teams: Team[]
  contexts: BoundedContext[]
  onRepoAssign: (repoId: string, contextId: string) => void
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
}: RepoSidebarProps) {
  const [searchQuery, setSearchQuery] = React.useState('')

  const filteredRepos = React.useMemo(() => {
    if (!searchQuery.trim()) return repos
    const query = searchQuery.toLowerCase()
    return repos.filter((r) => r.name.toLowerCase().includes(query))
  }, [repos, searchQuery])

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

  const renderRepoCard = (repo: Repo, isAssigned: boolean) => {
    const repoTeams = getTeamsForRepo(repo)
    const ctxName = isAssigned ? contextNameForRepo(repo, contexts) : null

    return (
      <div
        key={repo.id}
        data-testid={`repo-card-${repo.id}`}
        draggable={!isAssigned}
        onDragStart={isAssigned ? undefined : (e) => handleDragStart(e, repo.id)}
        className={`bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded p-2.5 transition-colors ${
          isAssigned
            ? 'cursor-default opacity-75'
            : 'cursor-move hover:border-blue-400 dark:hover:border-blue-500 hover:bg-white dark:hover:bg-neutral-800'
        }`}
      >
        <div className="font-medium text-slate-900 dark:text-slate-100 mb-1">{repo.name}</div>

        {repo.remoteUrl && (
          <a
            href={repo.remoteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 text-[11px] flex items-center gap-1 hover:underline mb-2"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="truncate">{repo.remoteUrl}</span>
            <ExternalLink size={10} className="flex-shrink-0" />
          </a>
        )}

        {ctxName && (
          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-200 dark:bg-neutral-700 text-slate-600 dark:text-slate-300 mb-1">
            {ctxName}
          </span>
        )}

        {repoTeams.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {repoTeams.map((team) => {
              const colors = getTopologyColors(team.topologyType)
              const label = team.topologyType ? TOPOLOGY_LABELS[team.topologyType] : undefined
              return (
                <span
                  key={team.id}
                  className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                  style={{
                    backgroundColor: colors.light.bg,
                    color: colors.light.text,
                    border: `1px solid ${colors.light.border}`,
                  }}
                  title={label ? `${team.name} (${label})` : team.name}
                >
                  {team.name}
                </span>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {repos.length > 1 && (
        <div className="relative mb-2">
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
      )}

      {searchQuery.trim() && (
        <div className="text-[10px] text-slate-500 dark:text-neutral-400 mb-1">
          {filteredRepos.length} of {repos.length} repos
        </div>
      )}

      {filteredRepos.length === 0 && searchQuery.trim() && (
        <div className="text-xs text-slate-500 dark:text-neutral-400 italic py-2">
          No repos match your search
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
  )
}
