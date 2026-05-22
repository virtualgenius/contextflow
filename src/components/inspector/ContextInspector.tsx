import React from 'react'
import { Trash2, X, Users, Plus, ArrowRight, HelpCircle, Clock } from 'lucide-react'
import { useEditorStore } from '../../model/store'
import { RelationshipCreateDialog } from '../RelationshipCreateDialog'
import { Switch } from '../Switch'
import { interpolatePosition } from '../../lib/temporal'
import { classifyFromStrategicPosition } from '../../model/classification'
import { InfoTooltip } from '../InfoTooltip'
import { SimpleTooltip } from '../SimpleTooltip'
import {
  EVOLUTION_STAGES,
  STRATEGIC_CLASSIFICATIONS,
  CODE_SIZE_TIERS,
  LEGACY_CONTEXT,
  BIG_BALL_OF_MUD,
  BUSINESS_MODEL_ROLE,
  POWER_DYNAMICS,
  STRATEGIC_CLASSIFICATION_CONCEPT,
  WARDLEY_EVOLUTION_CONCEPT,
  OWNERSHIP_CONCEPT,
  TEAM_ASSIGNMENT_CONCEPT,
  GROUPS_CONCEPT,
  NOTES_CONCEPT,
  ISSUES_CONCEPT,
  BOUNDARY_CONCEPT,
  type ConceptDefinition,
} from '../../model/conceptDefinitions'
import type { ContextOwnership, Project } from '../../model/types'
import { getConnectedUsers, categorizeRelationships } from '../../lib/inspectorHelpers'
import { RepoCard } from './ContextRepoCard'
import { RelationshipGroup } from './RelationshipGroup'
import { IssueSeverityButton } from './IssueSeverityButton'
import {
  INPUT_TITLE_CLASS,
  TEXTAREA_CLASS,
  SELECT_CLASS,
  FIELD_LABEL_CLASS,
  InspectorHeader,
  Section,
  SectionDivider,
  PillGroup,
  type PillOption,
} from './inspectorShared'

type BusinessModelRole = NonNullable<Project['contexts'][number]['businessModelRole']>
type BoundaryIntegrity = NonNullable<Project['contexts'][number]['boundaryIntegrity']>
type CodeSizeBucket = NonNullable<NonNullable<Project['contexts'][number]['codeSize']>['bucket']>

const OWNERSHIP_OPTIONS: ReadonlyArray<PillOption<ContextOwnership>> = [
  { value: 'ours', label: 'Our Team' },
  { value: 'internal', label: 'Internal' },
  { value: 'external', label: 'External' },
]

const ROLE_OPTIONS: ReadonlyArray<PillOption<BusinessModelRole>> = [
  { value: 'revenue-generator', label: 'Revenue' },
  { value: 'engagement-creator', label: 'Engagement' },
  { value: 'compliance-enforcer', label: 'Compliance' },
  { value: 'cost-reduction', label: 'Cost Reduction' },
]

const CODE_SIZE_DOT_PX: Record<CodeSizeBucket, number> = {
  tiny: 6,
  small: 8,
  medium: 10,
  large: 12,
  huge: 14,
}

function CodeSizeDot({ size }: { size: number }) {
  return (
    <span
      aria-hidden
      className="inline-block bg-slate-500 dark:bg-slate-400 rounded-[2px] mr-1.5 align-middle"
      style={{ width: size, height: size }}
    />
  )
}

const CODE_SIZE_OPTIONS: ReadonlyArray<PillOption<CodeSizeBucket>> = (
  ['tiny', 'small', 'medium', 'large', 'huge'] as const
).map((value) => ({
  value,
  label: value.charAt(0).toUpperCase() + value.slice(1),
  adornment: <CodeSizeDot size={CODE_SIZE_DOT_PX[value]} />,
}))

function BoundarySwatch({ style }: { style: BoundaryIntegrity }) {
  const styleMap: Record<BoundaryIntegrity, React.CSSProperties> = {
    weak: { border: '1.5px dotted currentColor' },
    moderate: { border: '2px solid currentColor' },
    strong: { border: '3px solid currentColor' },
  }
  return (
    <span
      aria-hidden
      className="inline-block rounded-[2px] mr-1.5 align-middle text-slate-500 dark:text-slate-400"
      style={{ width: 14, height: 10, ...styleMap[style] }}
    />
  )
}

const BOUNDARY_OPTIONS: ReadonlyArray<PillOption<BoundaryIntegrity>> = [
  { value: 'weak', label: 'Weak', adornment: <BoundarySwatch style="weak" /> },
  { value: 'moderate', label: 'Moderate', adornment: <BoundarySwatch style="moderate" /> },
  { value: 'strong', label: 'Strong', adornment: <BoundarySwatch style="strong" /> },
]

function FieldLabel({
  text,
  tooltip,
}: {
  text: string
  tooltip?: { content: Parameters<typeof InfoTooltip>[0]['content'] }
}) {
  return (
    <div className={`${FIELD_LABEL_CLASS} flex items-center gap-1`}>
      <span>{text}</span>
      {tooltip && (
        <InfoTooltip content={tooltip.content} position="bottom">
          <HelpCircle size={14} className="text-slate-400 dark:text-slate-500 cursor-help" />
        </InfoTooltip>
      )}
    </div>
  )
}

function SectionHeader({ text, tooltip }: { text: string; tooltip: ConceptDefinition }) {
  return (
    <div className="flex items-center gap-2">
      <span>{text}</span>
      <InfoTooltip content={tooltip} position="bottom">
        <HelpCircle size={12} className="text-slate-400 dark:text-slate-500 cursor-help" />
      </InfoTooltip>
    </div>
  )
}

function MiniLabel({ text, tooltip }: { text: string; tooltip: ConceptDefinition }) {
  return (
    <div className="flex items-center gap-1 mb-1">
      <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">
        {text}
      </span>
      <InfoTooltip content={tooltip} position="bottom">
        <HelpCircle size={10} className="text-slate-400 dark:text-slate-500 cursor-help" />
      </InfoTooltip>
    </div>
  )
}

export function ContextInspector({ project, contextId }: { project: Project; contextId: string }) {
  const viewMode = useEditorStore((s) => s.activeViewMode)
  const updateContext = useEditorStore((s) => s.updateContext)
  const deleteContext = useEditorStore((s) => s.deleteContext)
  const unassignRepo = useEditorStore((s) => s.unassignRepo)
  const addRelationship = useEditorStore((s) => s.addRelationship)
  const deleteRelationship = useEditorStore((s) => s.deleteRelationship)
  const addContextIssue = useEditorStore((s) => s.addContextIssue)
  const updateContextIssue = useEditorStore((s) => s.updateContextIssue)
  const deleteContextIssue = useEditorStore((s) => s.deleteContextIssue)
  const assignTeamToContext = useEditorStore((s) => s.assignTeamToContext)
  const unassignTeamFromContext = useEditorStore((s) => s.unassignTeamFromContext)
  const removeContextFromGroup = useEditorStore((s) => s.removeContextFromGroup)
  const addTeam = useEditorStore((s) => s.addTeam)
  const addRepo = useEditorStore((s) => s.addRepo)
  const assignRepoToContext = useEditorStore((s) => s.assignRepoToContext)

  // Temporal state
  const currentDate = useEditorStore((s) => s.temporal.currentDate)
  const activeKeyframeId = useEditorStore((s) => s.temporal.activeKeyframeId)

  const [expandedTeamId, setExpandedTeamId] = React.useState<string | null>(null)
  const [expandedRepoId, setExpandedRepoId] = React.useState<string | null>(null)
  const [showRelationshipDialog, setShowRelationshipDialog] = React.useState(false)
  const [useCodeCohesionAPI, _setUseCodeCohesionAPI] = React.useState(() => {
    const stored = localStorage.getItem('contextflow.useCodeCohesionAPI')
    return stored === 'true'
  })

  const context = project.contexts.find((c) => c.id === contextId)
  if (!context) {
    return <div className="text-neutral-500 dark:text-neutral-400">Context not found.</div>
  }

  const assignedRepos = project.repos.filter((r) => r.contextId === context.id)
  const teamIds = new Set(assignedRepos.flatMap((r) => r.teamIds))
  const teams = project.teams.filter((t) => teamIds.has(t.id))
  const memberOfGroups = project.groups.filter((g) => g.contextIds.includes(context.id))

  const handleUpdate = (updates: Partial<typeof context>) => {
    updateContext(context.id, updates)
  }

  const handleDelete = () => {
    if (window.confirm(`Delete "${context.name}"? This can be undone with Cmd/Ctrl+Z.`)) {
      deleteContext(context.id)
    }
  }

  const usersForContext = getConnectedUsers(project, context.id)
  const hasTemporal = viewMode === 'strategic' && project.temporal?.enabled && Boolean(currentDate)

  return (
    <div className="space-y-3">
      {/* ---------- 1. Identity ---------- */}
      <InspectorHeader>
        <input
          type="text"
          value={context.name}
          onChange={(e) => handleUpdate({ name: e.target.value })}
          className={INPUT_TITLE_CLASS}
        />
      </InspectorHeader>

      <textarea
        value={context.purpose || ''}
        onChange={(e) => handleUpdate({ purpose: e.target.value })}
        placeholder="What does this context do for the business?"
        rows={2}
        className={TEXTAREA_CLASS}
      />

      {usersForContext.length > 0 && (
        <div className="space-y-1">
          {usersForContext.map((user) => (
            <div key={user.id} className="flex items-center gap-2 group/user">
              <button
                onClick={() =>
                  useEditorStore.setState({ selectedUserId: user.id, selectedContextId: null })
                }
                className="flex-1 text-left px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-neutral-700 text-xs flex items-center gap-2 text-slate-600 dark:text-slate-400"
              >
                <Users size={12} className="text-blue-500 flex-shrink-0" />
                {user.name}
              </button>
            </div>
          ))}
        </div>
      )}

      {teams.length > 0 && (
        <div className="space-y-1">
          {teams.map((team) => (
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

      {/* ---------- 2. Strategic Profile ---------- */}
      <SectionDivider label="Strategic Profile">
        <div className="flex flex-wrap gap-3">
          <div>
            <MiniLabel text="Domain" tooltip={STRATEGIC_CLASSIFICATION_CONCEPT} />
            <ClassificationBadge classification={context.strategicClassification} />
          </div>
          <div>
            <MiniLabel text="Evolution" tooltip={WARDLEY_EVOLUTION_CONCEPT} />
            <EvolutionBadge stage={context.evolutionStage} />
          </div>
        </div>

        <div>
          <FieldLabel text="Role" tooltip={{ content: BUSINESS_MODEL_ROLE }} />
          <PillGroup
            options={ROLE_OPTIONS}
            value={context.businessModelRole}
            onChange={(next) => handleUpdate({ businessModelRole: next })}
            layout="grid-2"
            variant="green"
            ariaLabel="Business Model Role"
          />
        </div>
      </SectionDivider>

      {/* ---------- Temporal Position (conditional, after Strategic Profile) ---------- */}
      {hasTemporal && (
        <SectionDivider
          label={
            <div className="flex items-center gap-1">
              <Clock size={14} /> Position at {currentDate}
            </div>
          }
        >
          <TemporalPositionBlock
            project={project}
            contextId={context.id}
            currentDate={currentDate!}
            activeKeyframeId={activeKeyframeId}
            basePosition={{
              x: context.positions.strategic.x,
              y: context.positions.shared.y,
            }}
          />
        </SectionDivider>
      )}

      {/* ---------- 3. Team & Organization ---------- */}
      <SectionDivider label="Team & Organization">
        <div>
          <FieldLabel text="Ownership" tooltip={{ content: OWNERSHIP_CONCEPT }} />
          <PillGroup
            options={OWNERSHIP_OPTIONS}
            value={(context.ownership || 'ours') as ContextOwnership}
            onChange={(next) => handleUpdate({ ownership: (next ?? 'ours') as ContextOwnership })}
            layout="horizontal"
            variant="green"
            ariaLabel="Ownership"
          />
        </div>

        {context.ownership !== 'external' && (
          <div>
            <FieldLabel text="Team" tooltip={{ content: TEAM_ASSIGNMENT_CONCEPT }} />
            {project.teams && project.teams.length > 0 ? (
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
                className={SELECT_CLASS}
              >
                <option value="">No team assigned</option>
                {project.teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                    {team.topologyType ? ` (${team.topologyType})` : ''}
                  </option>
                ))}
              </select>
            ) : (
              <button
                onClick={() => {
                  const name = window.prompt('Team name:')
                  if (name) {
                    addTeam(name)
                  }
                }}
                className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                <Plus size={12} />
                Add Team
              </button>
            )}
          </div>
        )}

        {memberOfGroups.length > 0 && (
          <div>
            <FieldLabel text="Groups" tooltip={{ content: GROUPS_CONCEPT }} />
            <div className="flex flex-wrap gap-2">
              {memberOfGroups.map((group) => (
                <div
                  key={group.id}
                  className="inline-flex items-center gap-1.5 px-2 py-1 rounded border transition-all group/chip"
                  style={{
                    backgroundColor: group.color ? `${group.color}15` : '#3b82f615',
                    borderColor: group.color || '#3b82f6',
                  }}
                >
                  <button
                    onClick={() =>
                      useEditorStore.setState({
                        selectedGroupId: group.id,
                        selectedContextId: null,
                      })
                    }
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
          </div>
        )}
      </SectionDivider>

      {/* ---------- 4. Codebase ---------- */}
      <SectionDivider label="Codebase">
        <div className="space-y-2">
          {assignedRepos.map((repo) => (
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
          ))}
          <button
            onClick={() => {
              const name = window.prompt('Repo name:')
              if (name) {
                const repoId = addRepo(name)
                assignRepoToContext(repoId, context.id)
              }
            }}
            className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <Plus size={12} />
            Add Repo
          </button>
        </div>

        <div>
          <FieldLabel text="Code Size" tooltip={{ content: CODE_SIZE_TIERS }} />
          <PillGroup
            options={CODE_SIZE_OPTIONS}
            value={context.codeSize?.bucket}
            onChange={(next) =>
              handleUpdate({ codeSize: { ...context.codeSize, bucket: next as CodeSizeBucket } })
            }
            layout="grid-3"
            variant="slate"
            ariaLabel="Code Size"
          />
        </div>

        <div>
          <FieldLabel text="Boundary" tooltip={{ content: BOUNDARY_CONCEPT }} />
          <PillGroup
            options={BOUNDARY_OPTIONS}
            value={context.boundaryIntegrity}
            onChange={(next) => handleUpdate({ boundaryIntegrity: next })}
            layout="grid-3"
            variant="slate"
            ariaLabel="Boundary Integrity"
          />
          {context.boundaryIntegrity && (
            <textarea
              value={context.boundaryNotes || ''}
              onChange={(e) => handleUpdate({ boundaryNotes: e.target.value })}
              placeholder="Why is the boundary strong or weak?"
              rows={2}
              className={`${TEXTAREA_CLASS} mt-2`}
            />
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
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
          <div className="flex items-center gap-2">
            <Switch
              label="Big Ball of Mud"
              checked={context.isBigBallOfMud || false}
              onCheckedChange={(checked) => handleUpdate({ isBigBallOfMud: checked })}
            />
            <InfoTooltip content={BIG_BALL_OF_MUD} position="bottom">
              <HelpCircle size={14} className="text-slate-400 dark:text-slate-500 cursor-help" />
            </InfoTooltip>
          </div>
        </div>
      </SectionDivider>

      {/* ---------- 5. Notes & Issues ---------- */}
      <SectionDivider label="Notes & Issues">
        <Section label={<SectionHeader text="Notes" tooltip={NOTES_CONCEPT} />}>
          <textarea
            value={context.notes || ''}
            onChange={(e) => handleUpdate({ notes: e.target.value })}
            placeholder="Assumptions, politics, bottlenecks, risks..."
            rows={3}
            className={TEXTAREA_CLASS}
          />
        </Section>

        <Section
          label={
            <SectionHeader
              text={`Issues${context.issues?.length ? ` (${context.issues.length})` : ''}`}
              tooltip={ISSUES_CONCEPT}
            />
          }
        >
          {context.issues && context.issues.length > 0 ? (
            <div className="space-y-1">
              {context.issues.map((issue, index) => (
                <div key={issue.id} className="group/issue flex items-center gap-1.5">
                  <div className="flex-shrink-0 flex items-center gap-0.5">
                    {(['info', 'warning', 'critical'] as const).map((severity) => (
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
                    onChange={(e) =>
                      updateContextIssue(context.id, issue.id, { title: e.target.value })
                    }
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
                    autoFocus={
                      index === context.issues!.length - 1 &&
                      (issue.title === '' || issue.title === 'New issue')
                    }
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
      </SectionDivider>

      {/* ---------- 6. Relationships ---------- */}
      <SectionDivider
        label={
          <div className="flex items-center gap-2">
            <span>Relationships</span>
            <InfoTooltip content={POWER_DYNAMICS} position="bottom">
              <HelpCircle size={12} className="text-slate-400 dark:text-slate-500 cursor-help" />
            </InfoTooltip>
          </div>
        }
      >
        <RelationshipsBlock
          project={project}
          context={context}
          onDelete={deleteRelationship}
          onAdd={() => setShowRelationshipDialog(true)}
        />
      </SectionDivider>

      {showRelationshipDialog && (
        <RelationshipCreateDialog
          fromContext={context}
          availableContexts={project.contexts.filter((c) => c.id !== context.id)}
          onConfirm={(toContextId, pattern, description) => {
            addRelationship(context.id, toContextId, pattern, description)
            setShowRelationshipDialog(false)
          }}
          onCancel={() => setShowRelationshipDialog(false)}
        />
      )}

      {/* ---------- Danger Zone ---------- */}
      <div className="pt-2 border-t border-slate-200 dark:border-neutral-700 mt-4">
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

function ClassificationBadge({
  classification,
}: {
  classification: 'core' | 'supporting' | 'generic' | undefined
}) {
  if (!classification || !STRATEGIC_CLASSIFICATIONS[classification]) {
    return (
      <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
        Not classified
      </span>
    )
  }
  return (
    <InfoTooltip content={STRATEGIC_CLASSIFICATIONS[classification]} position="bottom">
      <span
        className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md cursor-help ${
          classification === 'core'
            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300'
            : classification === 'supporting'
              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
        }`}
      >
        {classification === 'core' && '⚡ Core'}
        {classification === 'supporting' && '🔧 Supporting'}
        {classification === 'generic' && '📦 Generic'}
      </span>
    </InfoTooltip>
  )
}

function EvolutionBadge({
  stage,
}: {
  stage: 'genesis' | 'custom-built' | 'product/rental' | 'commodity/utility' | undefined
}) {
  if (!stage) {
    return (
      <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
        Not set
      </span>
    )
  }
  const label =
    stage === 'genesis'
      ? '🌱 Genesis'
      : stage === 'custom-built'
        ? '🔨 Custom-Built'
        : stage === 'product/rental'
          ? '📦 Product'
          : '⚡ Commodity'
  if (!EVOLUTION_STAGES[stage]) {
    return (
      <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md bg-violet-100 dark:bg-violet-900/30 text-violet-800 dark:text-violet-300">
        {label}
      </span>
    )
  }
  return (
    <InfoTooltip content={EVOLUTION_STAGES[stage]} position="bottom">
      <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md bg-violet-100 dark:bg-violet-900/30 text-violet-800 dark:text-violet-300 cursor-help">
        {label}
      </span>
    </InfoTooltip>
  )
}

function TemporalPositionBlock({
  project,
  contextId,
  currentDate,
  activeKeyframeId,
  basePosition,
}: {
  project: Project
  contextId: string
  currentDate: string
  activeKeyframeId: string | null
  basePosition: { x: number; y: number }
}) {
  const keyframes = project.temporal?.keyframes || []
  const activeKeyframe = activeKeyframeId
    ? keyframes.find((kf) => kf.id === activeKeyframeId)
    : null
  const position = interpolatePosition(contextId, currentDate, keyframes, basePosition)
  const evolutionStage = classifyFromStrategicPosition(position.x)

  return (
    <div className="space-y-2">
      <div className="text-xs text-slate-600 dark:text-slate-400 space-y-0.5">
        <div>
          Evolution: {position.x.toFixed(1)}% ({evolutionStage.replace('-', ' ')})
        </div>
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
    </div>
  )
}

function RelationshipsBlock({
  project,
  context,
  onDelete,
  onAdd,
}: {
  project: Project
  context: Project['contexts'][number]
  onDelete: (id: string) => void
  onAdd: () => void
}) {
  const { upstream, downstream, mutual } = categorizeRelationships(
    project.relationships,
    context.id
  )
  return (
    <div className="text-[13px]">
      <RelationshipGroup
        title="Upstream"
        relationships={upstream}
        contexts={project.contexts}
        onDelete={onDelete}
        icon={<ArrowRight size={12} className="text-slate-400 flex-shrink-0" />}
        getTargetContextId={(rel) => rel.toContextId}
      />
      <RelationshipGroup
        title="Downstream"
        relationships={downstream}
        contexts={project.contexts}
        onDelete={onDelete}
        icon={<ArrowRight size={12} className="text-slate-400 flex-shrink-0 rotate-180" />}
        getTargetContextId={(rel) => rel.fromContextId}
      />
      <RelationshipGroup
        title="Mutual"
        relationships={mutual}
        contexts={project.contexts}
        onDelete={onDelete}
        icon={<span className="text-slate-400 flex-shrink-0 text-[10px]">⟷</span>}
        getTargetContextId={(rel) =>
          rel.fromContextId === context.id ? rel.toContextId : rel.fromContextId
        }
      />

      <button
        onClick={onAdd}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs bg-slate-100 dark:bg-neutral-700 hover:bg-slate-200 dark:hover:bg-neutral-600 text-slate-700 dark:text-slate-300 rounded transition-colors"
      >
        <Plus size={12} />
        Add Relationship
      </button>
    </div>
  )
}
