import React from 'react'
import { Trash2, X } from 'lucide-react'
import { useEditorStore } from '../../model/store'
import type { Project } from '../../model/types'
import { trackEvent } from '../../utils/analytics'
import { getTopologyColors } from '../../lib/teamColors'
import { INPUT_TITLE_CLASS, SELECT_CLASS, InspectorHeader, Section } from './inspectorShared'

export function RepoInspector({ project, repoId }: { project: Project; repoId: string }) {
  const updateRepo = useEditorStore((s) => s.updateRepo)
  const deleteRepo = useEditorStore((s) => s.deleteRepo)
  const assignRepoToContext = useEditorStore((s) => s.assignRepoToContext)
  const unassignRepo = useEditorStore((s) => s.unassignRepo)

  const repo = project.repos?.find((r) => r.id === repoId)
  if (!repo) {
    return <div className="text-neutral-500 dark:text-neutral-400">Repository not found.</div>
  }

  const ownerTeams = project.teams.filter((t) => repo.teamIds.includes(t.id))
  const availableTeams = project.teams.filter((t) => !repo.teamIds.includes(t.id))

  const handleContextChange = (contextId: string) => {
    if (contextId) {
      assignRepoToContext(repo.id, contextId)
    } else {
      unassignRepo(repo.id)
    }
  }

  const addOwningTeam = (teamId: string) => {
    if (!teamId) return
    updateRepo(repo.id, { teamIds: [...repo.teamIds, teamId] })
    trackEvent('repo_team_added', project, {
      entity_type: 'repo',
      entity_id: repo.id,
      team_id: teamId,
    })
  }

  const removeOwningTeam = (teamId: string) => {
    updateRepo(repo.id, { teamIds: repo.teamIds.filter((id) => id !== teamId) })
    trackEvent('repo_team_removed', project, {
      entity_type: 'repo',
      entity_id: repo.id,
      team_id: teamId,
    })
  }

  return (
    <div className="space-y-5">
      {/* Name */}
      <InspectorHeader>
        <input
          type="text"
          value={repo.name}
          onChange={(e) => updateRepo(repo.id, { name: e.target.value })}
          className={INPUT_TITLE_CLASS}
        />
      </InspectorHeader>

      {/* Remote URL */}
      <Section label="Remote URL">
        <input
          type="text"
          value={repo.remoteUrl || ''}
          onChange={(e) => updateRepo(repo.id, { remoteUrl: e.target.value })}
          placeholder="github.com/org/repo"
          className="w-full text-xs px-2 py-1.5 rounded-md border border-slate-200 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 dark:focus:border-blue-400 placeholder:text-slate-400 dark:placeholder:text-neutral-500"
        />
      </Section>

      {/* Assigned context */}
      <Section label="Assigned context">
        <select
          aria-label="Assigned context"
          value={repo.contextId ?? ''}
          onChange={(e) => handleContextChange(e.target.value)}
          className={SELECT_CLASS}
        >
          <option value="">Not assigned</option>
          {project.contexts.map((ctx) => (
            <option key={ctx.id} value={ctx.id}>
              {ctx.name}
            </option>
          ))}
        </select>
      </Section>

      {/* Owning teams */}
      <Section label="Owning teams">
        <div className="flex flex-wrap items-center gap-1.5">
          {ownerTeams.length === 0 && (
            <span className="text-xs text-slate-400 dark:text-neutral-500 italic">
              No owning teams
            </span>
          )}
          {ownerTeams.map((team) => {
            const colors = getTopologyColors(team.topologyType).light
            return (
              <span
                key={team.id}
                className="px-1.5 py-0.5 rounded text-[10px] font-medium flex items-center gap-1"
                style={{
                  backgroundColor: colors.bg,
                  color: colors.text,
                  border: `1px solid ${colors.border}`,
                }}
              >
                {team.name}
                <button
                  aria-label={`Remove ${team.name}`}
                  onClick={() => removeOwningTeam(team.id)}
                  className="hover:opacity-70"
                >
                  <X size={10} />
                </button>
              </span>
            )
          })}
        </div>
        {availableTeams.length > 0 && (
          <select
            aria-label="Add owning team"
            value=""
            onChange={(e) => addOwningTeam(e.target.value)}
            className={`${SELECT_CLASS} mt-1.5`}
          >
            <option value="">+ team</option>
            {availableTeams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        )}
      </Section>

      {/* Delete Repository button */}
      <div className="pt-2 border-t border-slate-200 dark:border-neutral-700">
        <button
          onClick={() => deleteRepo(repo.id)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
        >
          <Trash2 size={14} />
          Delete repository
        </button>
      </div>
    </div>
  )
}
