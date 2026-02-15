import React from 'react'
import { Trash2, X, Users, Plus, ArrowRight, HelpCircle, Clock } from 'lucide-react'
import { useEditorStore } from '../../model/store'
import { RelationshipCreateDialog } from '../RelationshipCreateDialog'
import { Switch } from '../Switch'
import { interpolatePosition } from '../../lib/temporal'
import { classifyFromStrategicPosition } from '../../model/classification'
import { InfoTooltip } from '../InfoTooltip'
import { SimpleTooltip } from '../SimpleTooltip'
import { EVOLUTION_STAGES, STRATEGIC_CLASSIFICATIONS, BOUNDARY_INTEGRITY, CODE_SIZE_TIERS, LEGACY_CONTEXT, POWER_DYNAMICS, OWNERSHIP_DEFINITIONS } from '../../model/conceptDefinitions'
import type { ContextOwnership, Project } from '../../model/types'
import { getConnectedUsers, categorizeRelationships } from '../../lib/inspectorHelpers'
import { RepoCard } from './ContextRepoCard'
import { RelationshipGroup } from './RelationshipGroup'
import { IssueSeverityButton } from './IssueSeverityButton'
import { INPUT_TITLE_CLASS, TEXTAREA_CLASS, Section } from './inspectorShared'

export function ContextInspector({ project, contextId }: { project: Project; contextId: string }) {
  const viewMode = useEditorStore(s => s.activeViewMode)
  const updateContext = useEditorStore(s => s.updateContext)
  const deleteContext = useEditorStore(s => s.deleteContext)
  const unassignRepo = useEditorStore(s => s.unassignRepo)
  const addRelationship = useEditorStore(s => s.addRelationship)
  const deleteRelationship = useEditorStore(s => s.deleteRelationship)
  const addContextIssue = useEditorStore(s => s.addContextIssue)
  const updateContextIssue = useEditorStore(s => s.updateContextIssue)
  const deleteContextIssue = useEditorStore(s => s.deleteContextIssue)
  const assignTeamToContext = useEditorStore(s => s.assignTeamToContext)
  const unassignTeamFromContext = useEditorStore(s => s.unassignTeamFromContext)
  const removeContextFromGroup = useEditorStore(s => s.removeContextFromGroup)

  // Temporal state
  const currentDate = useEditorStore(s => s.temporal.currentDate)
  const activeKeyframeId = useEditorStore(s => s.temporal.activeKeyframeId)

  const [expandedTeamId, setExpandedTeamId] = React.useState<string | null>(null)
  const [expandedRepoId, setExpandedRepoId] = React.useState<string | null>(null)
  const [showRelationshipDialog, setShowRelationshipDialog] = React.useState(false)
  const [useCodeCohesionAPI, setUseCodeCohesionAPI] = React.useState(() => {
    const stored = localStorage.getItem('contextflow.useCodeCohesionAPI')
    return stored === 'true'
  })

  const context = project.contexts.find(c => c.id === contextId)
  if (!context) {
    return (
      <div className="text-neutral-500 dark:text-neutral-400">
        Context not found.
      </div>
    )
  }

  // Find assigned repos
  const assignedRepos = project.repos.filter(r => r.contextId === context.id)

  // Get team names from repos
  const teamIds = new Set(assignedRepos.flatMap(r => r.teamIds))
  const teams = project.teams.filter(t => teamIds.has(t.id))

  // Find groups this context is a member of
  const memberOfGroups = project.groups.filter(g => g.contextIds.includes(context.id))

  const handleUpdate = (updates: Partial<typeof context>) => {
    updateContext(context.id, updates)
  }

  const handleDelete = () => {
    if (window.confirm(`Delete "${context.name}"? This can be undone with Cmd/Ctrl+Z.`)) {
      deleteContext(context.id)
    }
  }

  return (
    <div className="space-y-5">
      {/* Name */}
      <div>
        <input
          type="text"
          value={context.name}
          onChange={(e) => handleUpdate({ name: e.target.value })}
          className={INPUT_TITLE_CLASS}
        />
      </div>

      {/* Users connected via user needs - between name and purpose, no heading */}
      {(() => {
        const usersForContext = getConnectedUsers(project, context.id)

        return usersForContext.length > 0 ? (
          <div className="space-y-1">
            {usersForContext.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-2 group/user"
              >
                <button
                  onClick={() => useEditorStore.setState({ selectedUserId: user.id, selectedContextId: null })}
                  className="flex-1 text-left px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-neutral-700 text-xs flex items-center gap-2 text-slate-600 dark:text-slate-400"
                >
                  <Users size={12} className="text-blue-500 flex-shrink-0" />
                  {user.name}
                </button>
              </div>
            ))}
          </div>
        ) : null
      })()}

      {/* Purpose - no section header */}
      <textarea
        value={context.purpose || ''}
        onChange={(e) => handleUpdate({ purpose: e.target.value })}
        placeholder="What does this context do for the business?"
        rows={2}
        className={TEXTAREA_CLASS}
      />

      {/* Teams - under purpose, no heading */}
      {teams.length > 0 && (
        <div className="space-y-1">
          {teams.map(team => (
            <div key={team.id} className="text-xs text-slate-600 dark:text-slate-400">
              {team.name}
              {team.topologyType && (
                <span className="text-slate-500 dark:text-slate-500 ml-1">
                  ({team.topologyType})
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Ownership */}
      <div className="space-y-1">
        <div className="flex items-center gap-1">
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Ownership</span>
        </div>
        <div className="flex gap-1.5">
          {(['ours', 'internal', 'external'] as const).map((value) => (
            <InfoTooltip key={value} content={OWNERSHIP_DEFINITIONS[value]} position="bottom">
              <button
                onClick={() => handleUpdate({ ownership: value as ContextOwnership })}
                className={`px-2 py-1 text-xs font-medium rounded transition-colors cursor-help ${
                  context.ownership === value || (!context.ownership && value === 'ours')
                    ? value === 'ours'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 ring-1 ring-green-400'
                      : value === 'internal'
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 ring-1 ring-blue-400'
                      : 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 ring-1 ring-orange-400'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {value === 'ours' && 'Our Team'}
                {value === 'internal' && 'Internal'}
                {value === 'external' && 'External'}
              </button>
            </InfoTooltip>
          ))}
        </div>
      </div>

      {/* Legacy toggle */}
      <div className="flex items-center gap-2">
        <Switch
          label="Legacy"
          checked={context.isLegacy || false}
          onCheckedChange={(checked) => handleUpdate({ isLegacy: checked })}
        />
        <InfoTooltip content={LEGACY_CONTEXT} position="bottom">
          <HelpCircle size={14} className="text-slate-400 dark:text-slate-500 cursor-help" />
        </InfoTooltip>
      </div>

      {/* Team Assignment - only for non-external contexts */}
      {context.ownership !== 'external' && project.teams && project.teams.length > 0 && (
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Team</span>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={context.teamId || ''}
              onChange={(e) => {
                const teamId = e.target.value
                if (teamId) {
                  assignTeamToContext(context.id, teamId)
                } else {
                  unassignTeamFromContext(context.id)
                }
              }}
              className="flex-1 text-xs px-2 py-1.5 rounded-md border border-slate-200 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 dark:focus:border-blue-400"
            >
              <option value="">No team assigned</option>
              {project.teams.map(team => (
                <option key={team.id} value={team.id}>
                  {team.name}{team.topologyType ? ` (${team.topologyType})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Member of Groups - under pills, no heading */}
      {memberOfGroups.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {memberOfGroups.map(group => (
            <div
              key={group.id}
              className="inline-flex items-center gap-1.5 px-2 py-1 rounded border transition-all group/chip"
              style={{
                backgroundColor: group.color ? `${group.color}15` : '#3b82f615',
                borderColor: group.color || '#3b82f6',
              }}
            >
              <button
                onClick={() => useEditorStore.setState({ selectedGroupId: group.id, selectedContextId: null })}
                className="text-xs font-medium hover:underline"
                style={{ color: group.color || '#3b82f6' }}
              >
                {group.label}
              </button>
              <SimpleTooltip text="Remove from group" position="top">
                <button
                  onClick={() => removeContextFromGroup(group.id, context.id)}
                  className="opacity-0 group-hover/chip:opacity-100 transition-opacity hover:bg-white/50 dark:hover:bg-black/20 rounded p-0.5"
                >
                  <X size={10} />
                </button>
              </SimpleTooltip>
            </div>
          ))}
        </div>
      )}

      {/* Domain Classification - position-based, no section header */}
      <div>
        {context.strategicClassification && STRATEGIC_CLASSIFICATIONS[context.strategicClassification] ? (
          <InfoTooltip content={STRATEGIC_CLASSIFICATIONS[context.strategicClassification]} position="bottom">
            <span
              className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md cursor-help ${
                context.strategicClassification === 'core'
                  ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300'
                  : context.strategicClassification === 'supporting'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              {context.strategicClassification === 'core' && '⚡ Core'}
              {context.strategicClassification === 'supporting' && '🔧 Supporting'}
              {context.strategicClassification === 'generic' && '📦 Generic'}
            </span>
          </InfoTooltip>
        ) : (
          <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            Not classified
          </span>
        )}
      </div>

      {/* Evolution Stage - position-based, no section header */}
      <div>
        {context.evolutionStage && EVOLUTION_STAGES[context.evolutionStage] ? (
          <InfoTooltip content={EVOLUTION_STAGES[context.evolutionStage]} position="bottom">
            <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md bg-violet-100 dark:bg-violet-900/30 text-violet-800 dark:text-violet-300 cursor-help">
              {context.evolutionStage === 'genesis' && '🌱 Genesis'}
              {context.evolutionStage === 'custom-built' && '🔨 Custom-Built'}
              {context.evolutionStage === 'product/rental' && '📦 Product'}
              {context.evolutionStage === 'commodity/utility' && '⚡ Commodity'}
            </span>
          </InfoTooltip>
        ) : (
          <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md bg-violet-100 dark:bg-violet-900/30 text-violet-800 dark:text-violet-300">
            {context.evolutionStage === 'genesis' && '🌱 Genesis'}
            {context.evolutionStage === 'custom-built' && '🔨 Custom-Built'}
            {context.evolutionStage === 'product/rental' && '📦 Product'}
            {context.evolutionStage === 'commodity/utility' && '⚡ Commodity'}
          </span>
        )}
      </div>

      {/* Temporal Position (only in Strategic View with temporal mode enabled) */}
      {viewMode === 'strategic' && project.temporal?.enabled && currentDate && (
        <Section label={<div className="flex items-center gap-1"><Clock size={14} /> Position at {currentDate}</div>}>
          <div className="space-y-2">
            {(() => {
              const keyframes = project.temporal.keyframes || []
              const activeKeyframe = activeKeyframeId
                ? keyframes.find(kf => kf.id === activeKeyframeId)
                : null

              // Calculate interpolated position
              const basePosition = {
                x: context.positions.strategic.x,
                y: context.positions.shared.y,
              }
              const position = interpolatePosition(context.id, currentDate, keyframes, basePosition)
              const evolutionStage = classifyFromStrategicPosition(position.x)

              return (
                <>
                  <div className="text-xs text-slate-600 dark:text-slate-400 space-y-0.5">
                    <div>Evolution: {position.x.toFixed(1)}% ({evolutionStage.replace('-', ' ')})</div>
                    <div>Value Chain: {position.y.toFixed(1)}%</div>
                  </div>
                  {activeKeyframe ? (
                    <div className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                      📍 Viewing keyframe: {activeKeyframe.label || activeKeyframe.date}
                    </div>
                  ) : (
                    <div className="text-xs text-amber-600 dark:text-amber-400">
                      ⚡ Interpolated between keyframes
                    </div>
                  )}
                </>
              )
            })()}
          </div>
        </Section>
      )}

      {/* Assigned Repos - no heading */}
      {assignedRepos.length > 0 && (
        <div className="space-y-2">
          {assignedRepos.map(repo => {
            return (
              <RepoCard
                key={repo.id}
                repo={repo}
                project={project}
                useAPI={useCodeCohesionAPI}
                expandedTeamId={expandedTeamId}
                expandedRepoId={expandedRepoId}
                onToggleTeam={setExpandedTeamId}
                onToggleRepo={setExpandedRepoId}
                onUnassign={unassignRepo}
              />
            )
          })}
        </div>
      )}

      {/* Code */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 w-16">Code</span>
        <select
          value={context.codeSize?.bucket || ''}
          onChange={(e) => handleUpdate({ codeSize: { ...context.codeSize, bucket: e.target.value as any } })}
          className="w-32 text-xs px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 dark:focus:border-blue-400"
        >
          <option value="">Not set</option>
          <option value="tiny">Tiny</option>
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
          <option value="huge">Huge</option>
        </select>
        <InfoTooltip content={CODE_SIZE_TIERS} position="bottom">
          <HelpCircle size={14} className="text-slate-400 dark:text-slate-500 cursor-help" />
        </InfoTooltip>
      </div>

      {/* Boundary */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 w-16">Boundary</span>
          <select
            value={context.boundaryIntegrity || ''}
            onChange={(e) => handleUpdate({ boundaryIntegrity: e.target.value as any })}
            className="w-32 text-xs px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 dark:focus:border-blue-400"
          >
            <option value="">Not set</option>
            <option value="strong">Strong</option>
            <option value="moderate">Moderate</option>
            <option value="weak">Weak</option>
          </select>
          {context.boundaryIntegrity && BOUNDARY_INTEGRITY[context.boundaryIntegrity] && (
            <InfoTooltip content={BOUNDARY_INTEGRITY[context.boundaryIntegrity]} position="bottom">
              <HelpCircle size={14} className="text-slate-400 dark:text-slate-500 cursor-help" />
            </InfoTooltip>
          )}
        </div>
        <textarea
          value={context.boundaryNotes || ''}
          onChange={(e) => handleUpdate({ boundaryNotes: e.target.value })}
          placeholder="Why is the boundary strong or weak?"
          rows={2}
          className={TEXTAREA_CLASS}
        />
      </div>

      {/* Notes */}
      <Section label="Notes">
        <textarea
          value={context.notes || ''}
          onChange={(e) => handleUpdate({ notes: e.target.value })}
          placeholder="Assumptions, politics, bottlenecks, risks..."
          rows={3}
          className={TEXTAREA_CLASS}
        />
      </Section>

      {/* Issues */}
      <Section label={`Issues${context.issues?.length ? ` (${context.issues.length})` : ''}`}>
        {context.issues && context.issues.length > 0 ? (
          <div className="space-y-1">
            {context.issues.map((issue, index) => (
              <div key={issue.id} className="group/issue flex items-center gap-1.5">
                <div className="flex-shrink-0 flex items-center gap-0.5">
                  {(['info', 'warning', 'critical'] as const).map(severity => (
                    <IssueSeverityButton
                      key={severity}
                      severity={severity}
                      isActive={issue.severity === severity}
                      onClick={() => updateContextIssue(context.id, issue.id, { severity })}
                    />
                  ))}
                </div>
                <input
                  type="text"
                  value={issue.title}
                  onChange={(e) => updateContextIssue(context.id, issue.id, { title: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addContextIssue(context.id, '')
                    }
                  }}
                  onFocus={(e) => {
                    if (issue.title === 'New issue') {
                      e.target.select()
                    }
                  }}
                  autoFocus={index === context.issues!.length - 1 && (issue.title === '' || issue.title === 'New issue')}
                  placeholder="Issue title..."
                  className="flex-1 min-w-0 text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-neutral-700 border border-slate-200 dark:border-neutral-600 hover:border-slate-300 dark:hover:border-neutral-500 focus:border-blue-500 dark:focus:border-blue-400 rounded px-2 py-0.5 outline-none"
                />
                <button
                  onClick={() => deleteContextIssue(context.id, issue.id)}
                  className="opacity-0 group-hover/issue:opacity-100 p-0.5 text-slate-400 hover:text-red-500 transition-opacity"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 dark:text-slate-500 italic">No issues marked</p>
        )}
        <button
          onClick={() => addContextIssue(context.id, 'New issue')}
          className="mt-2 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          <Plus size={12} />
          Add Issue
        </button>
      </Section>

      {/* Relationships */}
      {(() => {
        const { upstream, downstream, mutual } = categorizeRelationships(project.relationships, context.id)

        return (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Relationships
              </span>
              <InfoTooltip content={POWER_DYNAMICS} position="bottom">
                <HelpCircle size={12} className="text-slate-400 dark:text-slate-500 cursor-help" />
              </InfoTooltip>
            </div>
            <div className="text-[13px]">
            <RelationshipGroup
              title="Upstream"
              relationships={upstream}
              contexts={project.contexts}
              onDelete={deleteRelationship}
              icon={<ArrowRight size={12} className="text-slate-400 flex-shrink-0" />}
              getTargetContextId={rel => rel.toContextId}
            />
            <RelationshipGroup
              title="Downstream"
              relationships={downstream}
              contexts={project.contexts}
              onDelete={deleteRelationship}
              icon={<ArrowRight size={12} className="text-slate-400 flex-shrink-0 rotate-180" />}
              getTargetContextId={rel => rel.fromContextId}
            />
            <RelationshipGroup
              title="Mutual"
              relationships={mutual}
              contexts={project.contexts}
              onDelete={deleteRelationship}
              icon={<span className="text-slate-400 flex-shrink-0 text-[10px]">⟷</span>}
              getTargetContextId={rel => rel.fromContextId === context.id ? rel.toContextId : rel.fromContextId}
            />

            {/* Add Relationship button */}
            <button
              onClick={() => setShowRelationshipDialog(true)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs bg-slate-100 dark:bg-neutral-700 hover:bg-slate-200 dark:hover:bg-neutral-600 text-slate-700 dark:text-slate-300 rounded transition-colors"
            >
              <Plus size={12} />
              Add Relationship
            </button>
            </div>
          </div>
        )
      })()}

      {/* Relationship Dialog */}
      {showRelationshipDialog && (
        <RelationshipCreateDialog
          fromContext={context}
          availableContexts={project.contexts.filter(c => c.id !== context.id)}
          onConfirm={(toContextId, pattern, description) => {
            addRelationship(context.id, toContextId, pattern, description)
            setShowRelationshipDialog(false)
          }}
          onCancel={() => setShowRelationshipDialog(false)}
        />
      )}

      {/* Delete Context - at bottom to avoid confusion with close button */}
      <div className="pt-2 border-t border-slate-200 dark:border-neutral-700">
        <button
          onClick={handleDelete}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
        >
          <Trash2 size={14} />
          Delete Context
        </button>
      </div>
    </div>
  )
}
