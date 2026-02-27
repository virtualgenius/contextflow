import React from 'react'
import { ExternalLink, Trash2, Plus } from 'lucide-react'
import { useEditorStore } from '../../model/store'
import type { Project } from '../../model/types'
import { TEAM_TOPOLOGIES } from '../../model/conceptDefinitions'
import { InfoTooltip } from '../InfoTooltip'
import { SimpleTooltip } from '../SimpleTooltip'
import { INPUT_TITLE_CLASS, Section } from './inspectorShared'
import { getTopologyColors } from '../../lib/teamColors'

export function TeamInspector({ project, teamId }: { project: Project; teamId: string }) {
  const updateTeam = useEditorStore(s => s.updateTeam)
  const addTeam = useEditorStore(s => s.addTeam)
  const deleteTeam = useEditorStore(s => s.deleteTeam)

  const team = project.teams?.find(t => t.id === teamId)
  if (!team) {
    return (
      <div className="text-neutral-500 dark:text-neutral-400">
        Team not found.
      </div>
    )
  }

  // Find contexts assigned to this team
  const assignedContexts = project.contexts.filter(c => c.teamId === teamId)

  return (
    <div className="space-y-5">
      {/* Name */}
      <div>
        <input
          type="text"
          value={team.name}
          onChange={(e) => updateTeam(team.id, { name: e.target.value })}
          className={INPUT_TITLE_CLASS}
        />
      </div>

      {/* Team Topology Type */}
      <Section label="Team Topology">
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => updateTeam(team.id, { topologyType: undefined })}
            className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
              !team.topologyType
                ? 'ring-1'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
            style={!team.topologyType ? {
              backgroundColor: getTopologyColors('unknown').light.bg,
              color: getTopologyColors('unknown').light.text,
              '--tw-ring-color': getTopologyColors('unknown').light.border,
            } as React.CSSProperties : undefined}
          >
            Undefined
          </button>
          {(['stream-aligned', 'platform', 'enabling', 'complicated-subsystem'] as const).map((value) => {
            const isActive = team.topologyType === value
            const colors = isActive ? getTopologyColors(value).light : null
            return (
              <InfoTooltip key={value} content={TEAM_TOPOLOGIES[value]} position="bottom">
                <button
                  onClick={() => updateTeam(team.id, { topologyType: isActive ? undefined : value })}
                  className={`px-2 py-1 text-xs font-medium rounded transition-colors cursor-help ${
                    isActive
                      ? 'ring-1'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                  style={colors ? {
                    backgroundColor: colors.bg,
                    color: colors.text,
                    '--tw-ring-color': colors.border,
                  } as React.CSSProperties : undefined}
                >
                  {value === 'stream-aligned' && 'Stream'}
                  {value === 'platform' && 'Platform'}
                  {value === 'enabling' && 'Enabling'}
                  {value === 'complicated-subsystem' && 'Subsystem'}
                </button>
              </InfoTooltip>
            )
          })}
        </div>
      </Section>

      {/* Jira Board */}
      <Section label="Jira Board">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={team.jiraBoard || ''}
            onChange={(e) => updateTeam(team.id, { jiraBoard: e.target.value })}
            placeholder="https://jira.example.com/..."
            className="flex-1 text-xs px-2 py-1.5 rounded-md border border-slate-200 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 dark:focus:border-blue-400 placeholder:text-slate-400 dark:placeholder:text-neutral-500"
          />
          {team.jiraBoard && (
            <SimpleTooltip text="Open Jira Board">
              <a
                href={team.jiraBoard}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
              >
                <ExternalLink size={16} />
              </a>
            </SimpleTooltip>
          )}
        </div>
      </Section>

      {/* Assigned Contexts */}
      <Section label={`Assigned Contexts (${assignedContexts.length})`}>
        {assignedContexts.length === 0 ? (
          <div className="text-xs text-slate-500 dark:text-slate-400 italic">
            No contexts assigned to this team
          </div>
        ) : (
          <div className="space-y-1">
            {assignedContexts.map(ctx => (
              <div
                key={ctx.id}
                className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-neutral-800 px-2 py-1 rounded"
              >
                {ctx.name}
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Add Team button */}
      <div className="pt-2 border-t border-slate-200 dark:border-neutral-700">
        <button
          onClick={() => addTeam('New Team')}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs bg-slate-100 dark:bg-neutral-700 hover:bg-slate-200 dark:hover:bg-neutral-600 text-slate-700 dark:text-slate-300 rounded transition-colors"
        >
          <Plus size={12} />
          Add Team
        </button>
      </div>

      {/* Delete Team button */}
      <div className="pt-2">
        <button
          onClick={() => {
            if (window.confirm(`Delete team "${team.name}"? ${assignedContexts.length > 0 ? `${assignedContexts.length} context${assignedContexts.length > 1 ? 's' : ''} will be unassigned.` : ''}`)) {
              deleteTeam(team.id)
            }
          }}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
        >
          <Trash2 size={14} />
          Delete Team
        </button>
      </div>
    </div>
  )
}
