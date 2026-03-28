import React from 'react'
import { useEditorStore } from '../../model/store'
import { Trash2 } from 'lucide-react'
import type { Project } from '../../model/types'
import { Section, INPUT_TITLE_CLASS, TEXTAREA_CLASS } from './inspectorShared'
import { ES_COLORS, type ESStickyType } from '../nodes/ESStickyNode'

interface ESInspectorProps {
  project: Project
  entityType: ESStickyType
  entityId: string
}

export function ESInspector({ project, entityType, entityId }: ESInspectorProps) {
  const es = project.eventStorming
  if (!es) return null

  const colors = ES_COLORS[entityType]

  // Find the entity based on type
  let entity: { name?: string; title?: string; description?: string } | undefined
  let updateFn: (id: string, updates: Record<string, unknown>) => void
  let deleteFn: (id: string) => void
  let nameField: 'name' | 'title' = 'name'

  const state = useEditorStore.getState()

  switch (entityType) {
    case 'domainEvent':
      entity = es.domainEvents.find((e) => e.id === entityId)
      updateFn = state.updateDomainEvent
      deleteFn = state.deleteDomainEvent
      break
    case 'command':
      entity = es.commands.find((c) => c.id === entityId)
      updateFn = state.updateCommand
      deleteFn = state.deleteCommand
      break
    case 'aggregate':
      entity = es.aggregates.find((a) => a.id === entityId)
      updateFn = state.updateESAggregate
      deleteFn = state.deleteESAggregate
      break
    case 'policy':
      entity = es.policies.find((p) => p.id === entityId)
      updateFn = state.updatePolicy
      deleteFn = state.deletePolicy
      break
    case 'hotSpot':
      entity = es.hotSpots.find((h) => h.id === entityId)
      updateFn = state.updateESHotSpot
      deleteFn = state.deleteESHotSpot
      nameField = 'title'
      break
    default:
      return null
  }

  if (!entity) return <div className="text-slate-400 italic">{colors.label} not found.</div>

  const displayName = nameField === 'title' ? entity.title : entity.name

  return (
    <div className="space-y-5">
      {/* Color indicator */}
      <div className="flex items-center gap-2 mb-1">
        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: colors.bg }} />
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          {colors.label}
        </span>
      </div>

      {/* Name */}
      <input
        type="text"
        value={displayName || ''}
        onChange={(e) => updateFn(entityId, { [nameField]: e.target.value })}
        className={INPUT_TITLE_CLASS}
        placeholder={`${colors.label} name...`}
      />

      {/* Description */}
      <Section label="Description">
        <textarea
          value={entity.description || ''}
          onChange={(e) => updateFn(entityId, { description: e.target.value })}
          className={TEXTAREA_CLASS}
          placeholder={`Describe this ${colors.label.toLowerCase()}...`}
          rows={3}
        />
      </Section>

      {/* Aggregate -> Bounded Context link */}
      {entityType === 'aggregate' && (
        <Section label="Bounded Context">
          <select
            value={((entity as Record<string, unknown>).contextId as string) || ''}
            onChange={(e) => updateFn(entityId, { contextId: e.target.value || undefined })}
            className="w-full text-xs bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded px-2 py-1.5"
          >
            <option value="">None (unlinked)</option>
            {project.contexts.map((ctx) => (
              <option key={ctx.id} value={ctx.id}>
                {ctx.name}
              </option>
            ))}
          </select>
        </Section>
      )}

      {/* Command -> Actor link */}
      {entityType === 'command' && project.users && project.users.length > 0 && (
        <Section label="Actor">
          <select
            value={((entity as Record<string, unknown>).actorId as string) || ''}
            onChange={(e) => updateFn(entityId, { actorId: e.target.value || undefined })}
            className="w-full text-xs bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded px-2 py-1.5"
          >
            <option value="">None</option>
            {project.users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </Section>
      )}

      {/* Delete */}
      <div className="pt-4 border-t border-slate-200 dark:border-neutral-700">
        <button
          onClick={() => {
            if (window.confirm(`Delete "${displayName}"?`)) {
              deleteFn(entityId)
            }
          }}
          className="text-red-600 dark:text-red-400 flex items-center gap-2 text-xs hover:underline"
        >
          <Trash2 size={14} />
          Delete {colors.label}
        </button>
      </div>
    </div>
  )
}
