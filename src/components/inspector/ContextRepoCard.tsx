import React from 'react'
import { ExternalLink, GitBranch, X } from 'lucide-react'
import { config } from '../../config'
import type { Person, ContributorRef } from '../../model/types'

export function RepoCard({
  repo,
  project,
  useAPI,
  expandedTeamId,
  expandedRepoId,
  onToggleTeam: _onToggleTeam,
  onToggleRepo,
  onUnassign,
}: {
  repo: any
  project: any
  useAPI: boolean
  expandedTeamId: string | null
  expandedRepoId: string | null
  onToggleTeam: (id: string | null) => void
  onToggleRepo: (id: string | null) => void
  onUnassign: (repoId: string) => void
}) {
  const repoTeams = project.teams.filter((t: any) => repo.teamIds.includes(t.id))
  const staticContributors: Person[] = repo.contributors
    .map((c: ContributorRef) => project.people.find((p: Person) => p.id === c.personId))
    .filter((p: Person | undefined): p is Person => !!p)

  const isExpanded = expandedRepoId === repo.id

  // Fetch API data if enabled
  const {
    contributors: apiContributors,
    loading: loadingContributors,
    error: contributorsError,
  } = useCodeCohesionContributors(repo.name, useAPI)
  const {
    stats,
    loading: loadingStats,
    error: statsError,
  } = useCodeCohesionRepoStats(repo.name, useAPI)

  // Determine which contributors to display
  const contributorsToDisplay = useAPI
    ? apiContributors || []
    : staticContributors.map((c) => c.displayName)

  const dataSource = useAPI ? 'Top 5, last 90 days' : 'Static'

  // Format stats for display
  const getPrimaryLanguage = () => {
    if (!stats?.filesByExtension) return null
    const entries = Object.entries(stats.filesByExtension) as [string, number][]
    if (entries.length === 0) return null
    const sorted = entries.sort((a, b) => b[1] - a[1])
    const [ext, count] = sorted[0]
    return { ext: ext.replace('.', '').toUpperCase(), count }
  }

  const formatNumber = (num: number) => {
    return num.toLocaleString()
  }

  return (
    <div>
      {/* Collapsed: Repo chip only (no team chips - teams shown above purpose) */}
      <div className="flex flex-wrap gap-1 items-center group">
        {/* Repo chip */}
        <button
          onClick={() => onToggleRepo(isExpanded ? null : repo.id)}
          className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded text-[10px] font-medium hover:bg-blue-200 dark:hover:bg-blue-900/60 transition-colors flex items-center gap-1"
        >
          <GitBranch size={10} />
          {repo.name}
          {isExpanded ? ' ▼' : ' ▶'}
        </button>

        {/* Unassign button (visible on hover) */}
        <button
          onClick={() => onUnassign(repo.id)}
          className="p-0.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
          title="Unassign repo"
        >
          <X size={10} />
        </button>
      </div>

      {/* Expanded: Repo details panel */}
      {isExpanded && (
        <div className="bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-600 rounded p-2.5 mt-1.5">
          {/* Remote URL */}
          {repo.remoteUrl && (
            <a
              href={repo.remoteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-700 dark:text-blue-400 text-[11px] flex items-center gap-1 hover:underline mb-3"
            >
              <span className="truncate">{repo.remoteUrl}</span>
              <ExternalLink size={10} className="flex-shrink-0" />
            </a>
          )}

          {/* Repo Stats */}
          {useAPI && (
            <div className="mb-3">
              <div className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                Repository Stats
              </div>
              {loadingStats && (
                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                  Loading stats...
                </div>
              )}
              {statsError && (
                <div className="text-[10px] text-red-600 dark:text-red-400">
                  Error loading stats
                </div>
              )}
              {stats && !loadingStats && !statsError && (
                <div className="text-[10px] text-slate-600 dark:text-slate-400 space-y-0.5">
                  <div>• {formatNumber(stats.totalFiles)} files</div>
                  <div>• {formatNumber(stats.totalLoc)} lines of code</div>
                  {getPrimaryLanguage() && (
                    <div>
                      • Primary: {getPrimaryLanguage()!.ext} (
                      {formatNumber(getPrimaryLanguage()!.count)} files)
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Contributors */}
          <div>
            <div className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              Contributors ({dataSource})
            </div>
            {useAPI && loadingContributors && (
              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                Loading contributors...
              </div>
            )}
            {useAPI && contributorsError && (
              <div className="text-[10px] text-red-600 dark:text-red-400">
                Error loading contributors
              </div>
            )}
            {!loadingContributors && !contributorsError && contributorsToDisplay.length > 0 && (
              <div className="text-[10px] text-slate-600 dark:text-slate-400">
                {contributorsToDisplay.join(', ')}
              </div>
            )}
          </div>

          {/* Expanded team details (if a team is selected) */}
          {expandedTeamId && repoTeams.some((t: any) => t.id === expandedTeamId) && (
            <div className="bg-slate-50 dark:bg-neutral-700 border border-slate-200 dark:border-neutral-600 rounded p-2 mt-2">
              {(() => {
                const team = repoTeams.find((t: any) => t.id === expandedTeamId)
                if (!team) return null
                return (
                  <>
                    <div className="font-medium text-slate-900 dark:text-slate-100 mb-1 text-[11px]">
                      {team.name}
                    </div>
                    {team.topologyType && (
                      <div className="text-[10px] text-slate-600 dark:text-slate-400 mb-1">
                        Type: {team.topologyType}
                      </div>
                    )}
                    {team.jiraBoard && (
                      <a
                        href={team.jiraBoard}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 text-[10px] flex items-center gap-1 hover:underline"
                      >
                        <span className="truncate">Jira Board</span>
                        <ExternalLink size={9} className="flex-shrink-0" />
                      </a>
                    )}
                  </>
                )
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Hook to fetch contributors from CodeCohesion API
export function useCodeCohesionContributors(repoName: string, enabled: boolean) {
  const [contributors, setContributors] = React.useState<string[] | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!enabled || !repoName) {
      setContributors(null)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    const {
      apiBaseUrl,
      contributors: { limit, days },
    } = config.integrations.codecohesion
    fetch(`${apiBaseUrl}/repos/${repoName}/contributors?limit=${limit}&days=${days}`)
      .then((res) => {
        if (!res.ok) throw new Error(`API error: ${res.status}`)
        return res.json()
      })
      .then((data) => {
        const names = Array.isArray(data.contributors)
          ? data.contributors.map((c: any) => c.name || c.login || c.email || 'Unknown')
          : []
        setContributors(names)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Failed to fetch contributors:', err)
        setError(err.message)
        setLoading(false)
      })
  }, [repoName, enabled])

  return { contributors, loading, error }
}

// Hook to fetch repo stats from CodeCohesion API
export function useCodeCohesionRepoStats(repoName: string, enabled: boolean) {
  const [stats, setStats] = React.useState<any | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!enabled || !repoName) {
      setStats(null)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    fetch(`${config.integrations.codecohesion.apiBaseUrl}/repos/${repoName}/stats`)
      .then((res) => {
        if (!res.ok) throw new Error(`API error: ${res.status}`)
        return res.json()
      })
      .then((data) => {
        setStats(data.stats)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Failed to fetch repo stats:', err)
        setError(err.message)
        setLoading(false)
      })
  }, [repoName, enabled])

  return { stats, loading, error }
}
