import React from 'react'
import { Crosshair, Search, Trash2, Users, X } from 'lucide-react'
import type { Team, BoundedContext } from '../model/types'
import { getTopologyColors, TOPOLOGY_LABELS } from '../lib/teamColors'
import { SimpleTooltip } from './SimpleTooltip'
import { SidebarFilterChips, type FilterChipOption } from './SidebarFilterChips'
import { trackEvent } from '../utils/analytics'

type TopologyFilter = 'all' | 'stream-aligned' | 'platform' | 'enabling' | 'complicated-subsystem'

const TOPOLOGY_FILTER_OPTIONS: FilterChipOption<TopologyFilter>[] = [
  { value: 'all', label: 'All' },
  { value: 'stream-aligned', label: 'Stream' },
  { value: 'platform', label: 'Platform' },
  { value: 'enabling', label: 'Enabling' },
  { value: 'complicated-subsystem', label: 'Subsystem' },
]

interface TeamSidebarProps {
  teams: Team[]
  contexts: BoundedContext[]
  selectedTeamId: string | null
  focusedTeamId?: string | null
  onSelectTeam: (teamId: string) => void
  onFocusTeam: (teamId: string) => void
  onAddTeam: (name: string) => void
  onDeleteTeam: (teamId: string) => void
}

function contextCountForTeam(teamId: string, contexts: BoundedContext[]): number {
  return contexts.filter((c) => c.teamId === teamId).length
}

function contextCountLabel(count: number): string {
  return count === 1 ? '1 context' : `${count} contexts`
}

export function TeamSidebar({
  teams,
  contexts,
  selectedTeamId,
  focusedTeamId,
  onSelectTeam,
  onFocusTeam,
  onAddTeam,
  onDeleteTeam,
}: TeamSidebarProps) {
  const [newTeamName, setNewTeamName] = React.useState('')
  const [searchQuery, setSearchQuery] = React.useState('')
  const [topologyFilter, setTopologyFilter] = React.useState<TopologyFilter>('all')

  const handleTopologyFilter = (value: TopologyFilter) => {
    setTopologyFilter(value)
    trackEvent('sidebar_filter_changed', null, { tab: 'teams', value })
  }

  const filteredTeams = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return teams.filter((t) => {
      if (query && !t.name.toLowerCase().includes(query)) return false
      if (topologyFilter !== 'all' && t.topologyType !== topologyFilter) return false
      return true
    })
  }, [teams, searchQuery, topologyFilter])

  const isFiltering = searchQuery.trim().length > 0 || topologyFilter !== 'all'

  const handleDragStart = (e: React.DragEvent, teamId: string) => {
    e.dataTransfer.setData('application/contextflow-team', teamId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleAddTeam = () => {
    const trimmed = newTeamName.trim()
    if (!trimmed) return
    onAddTeam(trimmed)
    setNewTeamName('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTeam()
    }
  }

  return (
    <div className="flex flex-col h-full min-h-0 min-w-0">
      {/* Pinned filter chrome */}
      {teams.length > 1 && (
        <div className="px-3 pt-3 pb-2 border-b border-slate-100 dark:border-neutral-800 space-y-2">
          <div className="relative">
            <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
              placeholder="Filter teams..."
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
            options={TOPOLOGY_FILTER_OPTIONS}
            active={topologyFilter}
            onChange={handleTopologyFilter}
          />
        </div>
      )}

      {/* Scrollable card list */}
      <div data-testid="team-scroll" className="flex-1 min-w-0 overflow-y-auto px-3 py-2 space-y-2">
        {teams.length === 0 && (
          <div className="flex flex-col items-center text-center gap-2 px-4 py-8">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-slate-400">
              <Users size={18} />
            </div>
            <div className="text-sm font-medium text-slate-600 dark:text-neutral-300">
              No teams yet
            </div>
            <p className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed">
              Add the teams in your system, then drag each one onto the context it owns.
            </p>
          </div>
        )}

        {isFiltering && (
          <div className="text-[10px] text-slate-500 dark:text-neutral-400 mb-1">
            {filteredTeams.length} of {teams.length} teams
          </div>
        )}

        {filteredTeams.length === 0 && isFiltering && (
          <div className="text-xs text-slate-500 dark:text-neutral-400 italic py-2">
            No teams match your filter
          </div>
        )}

        {filteredTeams.map((team) => {
          const count = contextCountForTeam(team.id, contexts)
          const isSelected = team.id === selectedTeamId
          const isFocused = team.id === focusedTeamId
          const badgeColors = team.topologyType ? getTopologyColors(team.topologyType).light : null

          return (
            <SimpleTooltip
              key={team.id}
              text="Drag onto a context to assign"
              position="right"
              className="block w-full min-w-0"
            >
              <div
                data-testid={`team-card-${team.id}`}
                draggable
                onDragStart={(e) => handleDragStart(e, team.id)}
                onClick={() => onSelectTeam(team.id)}
                className={`w-full bg-slate-50 dark:bg-neutral-900 border rounded p-2.5 cursor-move hover:border-blue-400 dark:hover:border-blue-500 hover:bg-white dark:hover:bg-neutral-800 transition-colors ${
                  isSelected
                    ? 'border-blue-400 dark:border-blue-500 ring-1 ring-blue-400 dark:ring-blue-500'
                    : 'border-slate-200 dark:border-neutral-700'
                }`}
              >
                {/* Row 1: name + focus crosshair (top-right) */}
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium text-slate-900 dark:text-slate-100 truncate min-w-0">
                    {team.name}
                  </div>
                  {count > 0 && (
                    <SimpleTooltip
                      text={isFocused ? 'Exit focus' : "Focus on this team's contexts"}
                      position="top"
                    >
                      <button
                        aria-label={
                          isFocused ? `Exit focus on ${team.name}` : `Focus on ${team.name}`
                        }
                        aria-pressed={isFocused}
                        onClick={(e) => {
                          e.stopPropagation()
                          onFocusTeam(team.id)
                        }}
                        className={`p-1 rounded flex-shrink-0 transition-colors ${
                          isFocused
                            ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'
                            : 'text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400'
                        }`}
                      >
                        <Crosshair size={12} />
                      </button>
                    </SimpleTooltip>
                  )}
                </div>

                {/* Row 2: topology + context count (left) + delete (bottom-right) */}
                <div className="flex items-end justify-between gap-2 mt-1.5">
                  <div className="flex items-center gap-2">
                    {team.topologyType && team.topologyType !== 'unknown' && badgeColors ? (
                      <span
                        className="px-1.5 py-0.5 text-[10px] font-medium rounded"
                        style={{
                          backgroundColor: badgeColors.bg,
                          color: badgeColors.text,
                          border: `1px solid ${badgeColors.border}`,
                        }}
                      >
                        {TOPOLOGY_LABELS[team.topologyType]}
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 text-[10px] font-medium rounded border border-slate-200 dark:border-neutral-700 text-slate-400 dark:text-neutral-500">
                        No type
                      </span>
                    )}
                    <span className="text-[11px] text-slate-500 dark:text-neutral-400">
                      {contextCountLabel(count)}
                    </span>
                  </div>
                  <button
                    aria-label={`Delete ${team.name}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (count > 0) {
                        if (
                          !window.confirm(
                            `Delete team "${team.name}"? ${count} context${count > 1 ? 's' : ''} will be unassigned.`
                          )
                        ) {
                          return
                        }
                      }
                      onDeleteTeam(team.id)
                    }}
                    className="p-1 rounded flex-shrink-0 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </SimpleTooltip>
          )
        })}
      </div>

      {/* Pinned add team input */}
      <div className="border-t border-slate-200 dark:border-neutral-700 p-2.5">
        <div className="flex gap-1.5">
          <input
            type="text"
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add team..."
            className="flex-1 text-xs px-2 py-1.5 rounded border border-slate-200 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 dark:focus:border-blue-400 placeholder:text-slate-400 dark:placeholder:text-neutral-500"
          />
          <button
            onClick={handleAddTeam}
            disabled={!newTeamName.trim()}
            className="px-2 py-1.5 text-xs font-medium rounded bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  )
}
