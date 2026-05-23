import React from 'react'
import { ArrowRight, ArrowLeftRight, HelpCircle, BookOpen } from 'lucide-react'
import { useEditorStore } from '../../model/store'
import type { Project, UpstreamRole, DownstreamRole, Relationship } from '../../model/types'
import { getPatternDefinition } from '../../model/patternDefinitions'
import { InfoTooltip } from '../InfoTooltip'
import { PatternsGuideModal } from '../PatternsGuideModal'
import { COMMUNICATION_MODE, RELATIONSHIP_PATTERNS } from '../../model/conceptDefinitions'
import {
  INPUT_TEXT_CLASS,
  TEXTAREA_CLASS,
  InspectorHeader,
  PillGroup,
  Section,
  type PillOption,
} from './inspectorShared'

type PickerPattern = 'partnership' | 'customer-supplier'

const PATTERN_LABELS: Record<PickerPattern, { name: string; influence: string }> = {
  partnership: { name: 'Partnership', influence: 'Mutually Dependent' },
  'customer-supplier': { name: 'Customer-Supplier', influence: 'Upstream/Downstream' },
}

const UPSTREAM_ROLE_OPTIONS: ReadonlyArray<PillOption<UpstreamRole>> = [
  { value: 'open-host-service', label: 'Open Host Service' },
  { value: 'published-language', label: 'Published Language' },
]

const DOWNSTREAM_ROLE_OPTIONS: ReadonlyArray<PillOption<DownstreamRole>> = [
  { value: 'conformist', label: 'Conformist' },
  { value: 'anti-corruption-layer', label: 'Anti-Corruption Layer' },
]

export function RelationshipInspector({
  project,
  relationshipId,
}: {
  project: Project
  relationshipId: string
}) {
  const deleteRelationship = useEditorStore((s) => s.deleteRelationship)
  const updateRelationship = useEditorStore((s) => s.updateRelationship)
  const swapRelationshipDirection = useEditorStore((s) => s.swapRelationshipDirection)

  const [showPatternsGuide, setShowPatternsGuide] = React.useState(false)

  const relationship = project.relationships.find((r) => r.id === relationshipId)
  if (!relationship) {
    return <div className="text-neutral-500 dark:text-neutral-400">Relationship not found.</div>
  }

  const fromContext = project.contexts.find((c) => c.id === relationship.fromContextId)
  const toContext = project.contexts.find((c) => c.id === relationship.toContextId)
  const patternDef = getPatternDefinition(relationship.pattern)
  const isSharedKernel = relationship.pattern === 'shared-kernel'
  const showDirectionArrow = !isSharedKernel && relationship.pattern !== 'partnership'

  const handleRemoveRelationship = () => {
    if (
      window.confirm(
        `Remove the relationship between "${fromContext?.name}" and "${toContext?.name}"? A removed relationship is Free by definition (no integration). This can be undone with Cmd/Ctrl+Z.`
      )
    ) {
      deleteRelationship(relationship.id)
    }
  }

  const handlePickPattern = (next: PickerPattern) => {
    const toggleOff = relationship.pattern === next
    updateRelationship(relationship.id, { pattern: toggleOff ? undefined : next })
  }

  const handleUpstreamRoleChange = (next: UpstreamRole | undefined) => {
    updateRelationship(relationship.id, { upstreamRole: next })
  }

  const handleDownstreamRoleChange = (next: DownstreamRole | undefined) => {
    updateRelationship(relationship.id, { downstreamRole: next })
  }

  const handleCommunicationModeChange = (e: React.FocusEvent<HTMLInputElement>) => {
    const newValue = e.target.value.trim()
    if (newValue !== relationship.communicationMode) {
      updateRelationship(relationship.id, { communicationMode: newValue || undefined })
    }
  }

  const handleDescriptionChange = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value.trim()
    if (newValue !== relationship.description) {
      updateRelationship(relationship.id, { description: newValue || undefined })
    }
  }

  return (
    <div className="space-y-5">
      <InspectorHeader>
        <div className="font-semibold text-base text-slate-900 dark:text-slate-100 leading-tight">
          Relationship
        </div>
      </InspectorHeader>

      {isSharedKernel && (
        <div className="rounded border-l-[3px] border-purple-500 bg-purple-50 dark:bg-purple-900/20 px-3 py-2">
          <div className="text-xs font-semibold text-purple-800 dark:text-purple-300 mb-0.5">
            Currently: Shared Kernel
          </div>
          <div className="text-[11px] text-purple-700 dark:text-purple-300/80 leading-snug">
            These contexts share part of their model and code. Drag them apart to change this
            relationship, or pick a different pattern below.
          </div>
        </div>
      )}

      <Section label={showDirectionArrow ? 'Direction' : 'Contexts'}>
        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={() =>
              useEditorStore.setState({
                selectedContextId: fromContext?.id,
                selectedRelationshipId: null,
              })
            }
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            {fromContext?.name || 'Unknown'}
          </button>
          {showDirectionArrow ? (
            <ArrowRight size={14} className="text-slate-400" />
          ) : patternDef?.powerDynamics === 'mutual' ? (
            <ArrowLeftRight size={14} className="text-slate-400" />
          ) : (
            <span className="text-slate-400 text-sm">·</span>
          )}
          <button
            onClick={() =>
              useEditorStore.setState({
                selectedContextId: toContext?.id,
                selectedRelationshipId: null,
              })
            }
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            {toContext?.name || 'Unknown'}
          </button>
          {showDirectionArrow && (
            <button
              onClick={() => swapRelationshipDirection(relationship.id)}
              className="ml-auto p-1.5 rounded hover:bg-slate-100 dark:hover:bg-neutral-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              title="Swap direction"
            >
              <ArrowLeftRight size={14} />
            </button>
          )}
        </div>
      </Section>

      <Section label="Pattern">
        <div className="space-y-2">
          <PatternChoiceButton
            label={PATTERN_LABELS.partnership.name}
            influence={PATTERN_LABELS.partnership.influence}
            active={relationship.pattern === 'partnership'}
            onClick={() => handlePickPattern('partnership')}
          />
          <div className="text-[11px] italic text-slate-500 dark:text-slate-400 pl-3">
            For a Shared Kernel, drag the contexts to overlap.
          </div>

          <OrDivider />

          <PatternChoiceButton
            label={PATTERN_LABELS['customer-supplier'].name}
            influence={PATTERN_LABELS['customer-supplier'].influence}
            active={relationship.pattern === 'customer-supplier'}
            onClick={() => handlePickPattern('customer-supplier')}
          />
          <div className="text-[11px] italic text-slate-500 dark:text-slate-400 pl-3">
            The upstream accommodates the downstream.
          </div>

          <OrDivider />

          <CharacterizeSides
            relationship={relationship}
            fromContextName={fromContext?.name || 'Unknown'}
            toContextName={toContext?.name || 'Unknown'}
            onUpstreamChange={handleUpstreamRoleChange}
            onDownstreamChange={handleDownstreamRoleChange}
          />

          {(relationship.pattern === 'partnership' ||
            relationship.pattern === 'customer-supplier') && (
            <div className="mt-2 px-2.5 py-1.5 rounded bg-slate-50 dark:bg-neutral-800 text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
              Picking a per-side role above will clear the{' '}
              <strong className="text-slate-700 dark:text-slate-200">
                {PATTERN_LABELS[relationship.pattern].name}
              </strong>{' '}
              pattern (they&apos;re mutually exclusive).
            </div>
          )}
        </div>

        <button
          onClick={() => setShowPatternsGuide(true)}
          className="mt-3 flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
        >
          <BookOpen size={12} />
          <span>View all patterns</span>
        </button>
      </Section>

      <Section
        label={
          <div className="flex items-center gap-1.5">
            <span>Communication Mode</span>
            <InfoTooltip content={COMMUNICATION_MODE} position="bottom">
              <HelpCircle size={12} className="text-slate-400 dark:text-slate-500 cursor-help" />
            </InfoTooltip>
          </div>
        }
      >
        <input
          type="text"
          defaultValue={relationship.communicationMode || ''}
          onBlur={handleCommunicationModeChange}
          placeholder="e.g., REST API, gRPC, Event Bus..."
          className={INPUT_TEXT_CLASS}
        />
      </Section>

      <Section label="Description">
        <textarea
          defaultValue={relationship.description || ''}
          onBlur={handleDescriptionChange}
          placeholder="Additional details about this relationship..."
          rows={3}
          className={TEXTAREA_CLASS}
        />
      </Section>

      <div className="pt-3 border-t border-slate-200 dark:border-neutral-700">
        <button
          onClick={handleRemoveRelationship}
          className="w-full px-3 py-2 text-sm text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/40 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          Remove relationship
        </button>
        <div className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400 text-center leading-snug">
          Removing = Free / no integration. Document non-integration in context notes if needed.
        </div>
      </div>

      {showPatternsGuide && <PatternsGuideModal onClose={() => setShowPatternsGuide(false)} />}
    </div>
  )
}

function OrDivider() {
  return (
    <div className="flex items-center gap-2 my-2 text-[10px] uppercase tracking-widest font-semibold text-slate-400 dark:text-slate-500">
      <div className="flex-1 h-px bg-slate-200 dark:bg-neutral-700" />
      <span>or</span>
      <div className="flex-1 h-px bg-slate-200 dark:bg-neutral-700" />
    </div>
  )
}

function PatternChoiceButton({
  label,
  influence,
  active,
  onClick,
}: {
  label: string
  influence: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`w-full flex items-baseline justify-between gap-3 px-3 py-2 rounded-md border text-left transition-colors ${
        active
          ? 'bg-slate-900 dark:bg-slate-100 border-slate-900 dark:border-slate-100 text-white dark:text-slate-900'
          : 'bg-white dark:bg-neutral-900 border-slate-200 dark:border-neutral-600 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-neutral-800'
      }`}
    >
      <span className="text-sm font-semibold">{label}</span>
      <span className={`text-[10px] ${active ? 'opacity-80' : 'opacity-65'}`}>{influence}</span>
    </button>
  )
}

function CharacterizeSides({
  relationship,
  fromContextName,
  toContextName,
  onUpstreamChange,
  onDownstreamChange,
}: {
  relationship: Relationship
  fromContextName: string
  toContextName: string
  onUpstreamChange: (next: UpstreamRole | undefined) => void
  onDownstreamChange: (next: DownstreamRole | undefined) => void
}) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-300">
        <span>Characterize each side</span>
        <span className="text-slate-400 dark:text-slate-500 font-normal">
          (Upstream/Downstream)
        </span>
        <InfoTooltip
          content={{
            title: 'Per-Side Roles',
            description:
              'Describe how each context plays its part. The upstream side can act as an Open Host Service or define a Published Language. The downstream side can be a Conformist or build an Anti-Corruption Layer.',
          }}
          position="bottom"
        >
          <HelpCircle size={11} className="text-slate-400 dark:text-slate-500 cursor-help" />
        </InfoTooltip>
      </div>

      <div>
        <div className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
          <span className="font-medium text-slate-600 dark:text-slate-300">Upstream</span>
          <span className="text-slate-400 dark:text-slate-500">({toContextName})</span>
          <InfoTooltip content={RELATIONSHIP_PATTERNS['open-host-service']} position="bottom">
            <HelpCircle size={11} className="text-slate-400 dark:text-slate-500 cursor-help" />
          </InfoTooltip>
        </div>
        <PillGroup<UpstreamRole>
          options={UPSTREAM_ROLE_OPTIONS}
          value={relationship.upstreamRole}
          onChange={onUpstreamChange}
          layout="horizontal"
          variant="green"
          ariaLabel="Upstream role"
        />
      </div>

      <div>
        <div className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
          <span className="font-medium text-slate-600 dark:text-slate-300">Downstream</span>
          <span className="text-slate-400 dark:text-slate-500">({fromContextName})</span>
          <InfoTooltip content={RELATIONSHIP_PATTERNS['anti-corruption-layer']} position="bottom">
            <HelpCircle size={11} className="text-slate-400 dark:text-slate-500 cursor-help" />
          </InfoTooltip>
        </div>
        <PillGroup<DownstreamRole>
          options={DOWNSTREAM_ROLE_OPTIONS}
          value={relationship.downstreamRole}
          onChange={onDownstreamChange}
          layout="horizontal"
          variant="green"
          ariaLabel="Downstream role"
        />
      </div>
    </div>
  )
}
