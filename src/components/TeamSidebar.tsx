import React from 'react'
import { Trash2 } from 'lucide-react'
import type { Team, BoundedContext } from '../model/types'
import { getTopologyColors } from '../lib/teamColors'

interface TeamSidebarProps {
  teams: Team[]
  contexts: BoundedContext[]
  selectedTeamId: string | null
  onSelectTeam: (teamId: string) => void
  onAddTeam: (name: string) => void
  onDeleteTeam: (teamId: string) => void
}

const TOPOLOGY_LABELS: Record<string, string> = {
  'stream-aligned': 'Stream',
  'platform': 'Platform',
  'enabling': 'Enabling',
  'complicated-subsystem': 'Subsystem',
}

function contextCountForTeam(teamId: string, contexts: BoundedContext[]): number {
  return contexts.filter(c => c.teamId === teamId).length
}

function contextCountLabel(count: number): string {
  return count === 1 ? '1 context' : `${count} contexts`
}

export function TeamSidebar({
  teams,
  contexts,
  selectedTeamId,
  onSelectTeam,
  onAddTeam,
  onDeleteTeam,
}: TeamSidebarProps) {
  const [newTeamName, setNewTeamName] = React.useState('')

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
    <div className="space-y-2">
      {teams.length === 0 && (
        <div className="text-xs text-slate-500 dark:text-neutral-400 italic py-2">
          No teams yet
        </div>
      )}

      {teams.map(team => {
        const count = contextCountForTeam(team.id, contexts)
        const isSelected = team.id === selectedTeamId
        const badgeColors = team.topologyType ? getTopologyColors(team.topologyType).light : null

        return (
          <div
            key={team.id}
            data-testid={`team-card-${team.id}`}
            draggable
            onDragStart={(e) => handleDragStart(e, team.id)}
            onClick={() => onSelectTeam(team.id)}
            className={`bg-slate-50 dark:bg-neutral-900 border rounded p-2.5 cursor-move hover:border-blue-400 dark:hover:border-blue-500 hover:bg-white dark:hover:bg-neutral-800 transition-colors ${
              isSelected
                ? 'border-blue-400 dark:border-blue-500 ring-1 ring-blue-400 dark:ring-blue-500'
                : 'border-slate-200 dark:border-neutral-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="font-medium text-slate-900 dark:text-slate-100">
                {team.name}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (count > 0) {
                    if (!window.confirm(`Delete team "${team.name}"? ${count} context${count > 1 ? 's' : ''} will be unassigned.`)) {
                      return
                    }
                  }
                  onDeleteTeam(team.id)
                }}
                className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              >
                <Trash2 size={12} />
              </button>
            </div>

            <div className="flex items-center gap-2 mt-1">
              {team.topologyType && team.topologyType !== 'unknown' && badgeColors && (
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
              )}
              <span className="text-[11px] text-slate-500 dark:text-neutral-400">
                {contextCountLabel(count)}
              </span>
            </div>
          </div>
        )
      })}

      {/* Add team input */}
      <div className="flex gap-1.5 pt-1">
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
  )
}
