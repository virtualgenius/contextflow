import React from 'react'
import { ArrowRight, ArrowLeftRight, Trash2, ChevronDown, ChevronRight, HelpCircle, BookOpen } from 'lucide-react'
import { useEditorStore } from '../../model/store'
import type { Project } from '../../model/types'
import {
  PATTERN_DEFINITIONS,
  POWER_DYNAMICS_ICONS,
  getPatternDefinition,
} from '../../model/patternDefinitions'
import { InfoTooltip } from '../InfoTooltip'
import { PatternsGuideModal } from '../PatternsGuideModal'
import { COMMUNICATION_MODE } from '../../model/conceptDefinitions'
import { INPUT_TEXT_CLASS, TEXTAREA_CLASS, Section } from './inspectorShared'

export function RelationshipInspector({ project, relationshipId }: { project: Project; relationshipId: string }) {
  const deleteRelationship = useEditorStore(s => s.deleteRelationship)
  const updateRelationship = useEditorStore(s => s.updateRelationship)
  const swapRelationshipDirection = useEditorStore(s => s.swapRelationshipDirection)

  const [showPatternDetails, setShowPatternDetails] = React.useState(false)
  const [showPatternsGuide, setShowPatternsGuide] = React.useState(false)

  const relationship = project.relationships.find(r => r.id === relationshipId)
  if (!relationship) {
    return (
      <div className="text-neutral-500 dark:text-neutral-400">
        Relationship not found.
      </div>
    )
  }

  const fromContext = project.contexts.find(c => c.id === relationship.fromContextId)
  const toContext = project.contexts.find(c => c.id === relationship.toContextId)
  const patternDef = getPatternDefinition(relationship.pattern)

  const handleDeleteRelationship = () => {
    if (window.confirm(`Delete relationship from "${fromContext?.name}" to "${toContext?.name}"? This can be undone with Cmd/Ctrl+Z.`)) {
      deleteRelationship(relationship.id)
    }
  }

  const handlePatternChange = (newPattern: string) => {
    updateRelationship(relationship.id, { pattern: newPattern as any })
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
      {/* Relationship Title */}
      <div className="font-semibold text-base text-slate-900 dark:text-slate-100 leading-tight">
        Relationship
      </div>

      {/* From/To Contexts */}
      <Section label={patternDef?.powerDynamics === 'mutual' || patternDef?.powerDynamics === 'none' ? "Contexts" : "Direction"}>
        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={() => useEditorStore.setState({ selectedContextId: fromContext?.id, selectedRelationshipId: null })}
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            {fromContext?.name || 'Unknown'}
          </button>
          {patternDef?.powerDynamics === 'mutual' ? (
            <ArrowLeftRight size={14} className="text-slate-400" />
          ) : patternDef?.powerDynamics === 'none' ? (
            <span className="text-slate-400 text-sm">·</span>
          ) : (
            <ArrowRight size={14} className="text-slate-400" />
          )}
          <button
            onClick={() => useEditorStore.setState({ selectedContextId: toContext?.id, selectedRelationshipId: null })}
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            {toContext?.name || 'Unknown'}
          </button>
          {patternDef?.powerDynamics !== 'mutual' && patternDef?.powerDynamics !== 'none' && (
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

      {/* Pattern (undoable) */}
      <Section label="DDD Pattern">
        <select
          value={relationship.pattern}
          onChange={(e) => handlePatternChange(e.target.value)}
          className="w-full text-sm px-3 py-2 rounded-md border border-slate-200 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 dark:focus:border-blue-400"
        >
          {PATTERN_DEFINITIONS.map(p => (
            <option key={p.value} value={p.value}>
              {POWER_DYNAMICS_ICONS[p.powerDynamics]} {p.label}
            </option>
          ))}
        </select>
        <div className="mt-1.5 text-xs text-slate-600 dark:text-slate-400">
          {getPatternDefinition(relationship.pattern)?.shortDescription}
        </div>

        {/* Collapsible pattern details */}
        {(() => {
          const patternDef = getPatternDefinition(relationship.pattern)
          if (!patternDef) return null
          return (
            <div className="mt-3">
              <button
                onClick={() => setShowPatternDetails(!showPatternDetails)}
                className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              >
                {showPatternDetails ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                <HelpCircle size={12} />
                <span>About this pattern</span>
              </button>

              {showPatternDetails && (
                <div className="mt-2 p-3 bg-slate-50 dark:bg-neutral-800 rounded-md border border-slate-200 dark:border-neutral-700 space-y-3">
                  {/* Power dynamics */}
                  <div>
                    <div className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Power Dynamics
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                      <span className="text-base">{POWER_DYNAMICS_ICONS[patternDef.powerDynamics]}</span>
                      {patternDef.powerDynamics === 'upstream' && 'Upstream team has control'}
                      {patternDef.powerDynamics === 'downstream' && 'Downstream team protects itself'}
                      {patternDef.powerDynamics === 'mutual' && 'Shared control between teams'}
                      {patternDef.powerDynamics === 'none' && 'No integration or dependency'}
                    </div>
                  </div>

                  {/* Detailed description */}
                  <div>
                    <div className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Description
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {patternDef.detailedDescription}
                    </div>
                  </div>

                  {/* When to use */}
                  <div>
                    <div className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      When to Use
                    </div>
                    <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1 ml-3">
                      {patternDef.whenToUse.map((item, i) => (
                        <li key={i} className="list-disc">{item}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Example */}
                  <div>
                    <div className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Example
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 italic leading-relaxed">
                      {patternDef.example}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })()}

        {/* View all patterns link */}
        <button
          onClick={() => setShowPatternsGuide(true)}
          className="mt-2 flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
        >
          <BookOpen size={12} />
          <span>View all patterns</span>
        </button>
      </Section>

      {/* Communication Mode (autosaves) */}
      <Section label={
        <div className="flex items-center gap-1.5">
          <span>Communication Mode</span>
          <InfoTooltip content={COMMUNICATION_MODE} position="bottom">
            <HelpCircle size={12} className="text-slate-400 dark:text-slate-500 cursor-help" />
          </InfoTooltip>
        </div>
      }>
        <input
          type="text"
          defaultValue={relationship.communicationMode || ''}
          onBlur={handleCommunicationModeChange}
          placeholder="e.g., REST API, gRPC, Event Bus..."
          className={INPUT_TEXT_CLASS}
        />
      </Section>

      {/* Description (autosaves) */}
      <Section label="Description">
        <textarea
          defaultValue={relationship.description || ''}
          onBlur={handleDescriptionChange}
          placeholder="Additional details about this relationship..."
          rows={3}
          className={TEXTAREA_CLASS}
        />
      </Section>

      {/* Delete Relationship */}
      <div className="pt-2 border-t border-slate-200 dark:border-neutral-700">
        <button
          onClick={handleDeleteRelationship}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
        >
          <Trash2 size={14} />
          Delete Relationship
        </button>
      </div>

      {/* Patterns Guide Modal */}
      {showPatternsGuide && (
        <PatternsGuideModal onClose={() => setShowPatternsGuide(false)} />
      )}
    </div>
  )
}
