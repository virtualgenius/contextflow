import React from 'react'
import { useEditorStore } from '../../model/store'
import { Trash2 } from 'lucide-react'
import type { Project } from '../../model/types'
import { Section, INPUT_TITLE_CLASS, TEXTAREA_CLASS } from './inspectorShared'

export function PivotalEventInspector({ project, eventId }: { project: Project; eventId: string }) {
  const updatePivotalEvent = useEditorStore((s) => s.updatePivotalEvent)
  const deletePivotalEvent = useEditorStore((s) => s.deletePivotalEvent)

  const event = project.eventStorming?.pivotalEvents.find((e) => e.id === eventId)
  if (!event) return <div className="text-slate-400 italic">Pivotal event not found.</div>

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#f97316' }} />
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          Pivotal Event
        </span>
      </div>

      <input
        type="text"
        value={event.name}
        onChange={(e) => updatePivotalEvent(eventId, { name: e.target.value })}
        className={INPUT_TITLE_CLASS}
        placeholder="Pivotal event name..."
      />

      <Section label="Description">
        <textarea
          value={event.description || ''}
          onChange={(e) => updatePivotalEvent(eventId, { description: e.target.value })}
          className={TEXTAREA_CLASS}
          placeholder="Describe this phase boundary..."
          rows={3}
        />
      </Section>

      <Section label="Timeline Position">
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={0}
            max={100}
            value={event.position}
            onChange={(e) => updatePivotalEvent(eventId, { position: Number(e.target.value) })}
            className="flex-1"
          />
          <span className="text-xs text-slate-500 w-8 text-right">
            {Math.round(event.position)}%
          </span>
        </div>
      </Section>

      <div className="pt-4 border-t border-slate-200 dark:border-neutral-700">
        <button
          onClick={() => {
            if (window.confirm(`Delete "${event.name}"?`)) {
              deletePivotalEvent(eventId)
            }
          }}
          className="text-red-600 dark:text-red-400 flex items-center gap-2 text-xs hover:underline"
        >
          <Trash2 size={14} />
          Delete Pivotal Event
        </button>
      </div>
    </div>
  )
}
