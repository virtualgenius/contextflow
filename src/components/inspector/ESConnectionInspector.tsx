import React from 'react'
import { useEditorStore } from '../../model/store'
import { Trash2 } from 'lucide-react'
import type { Project } from '../../model/types'
import { Section, TEXTAREA_CLASS } from './inspectorShared'

function findESEntityName(project: Project, entityId: string): string {
  const es = project.eventStorming
  if (!es) return entityId

  const event = es.domainEvents.find((e) => e.id === entityId)
  if (event) return event.name

  const cmd = es.commands.find((c) => c.id === entityId)
  if (cmd) return cmd.name

  const agg = es.aggregates.find((a) => a.id === entityId)
  if (agg) return agg.name

  const pol = es.policies.find((p) => p.id === entityId)
  if (pol) return pol.name

  const hs = es.hotSpots.find((h) => h.id === entityId)
  if (hs) return hs.title

  return entityId
}

export function ESConnectionInspector({
  project,
  connectionId,
}: {
  project: Project
  connectionId: string
}) {
  const updateESConnection = useEditorStore((s) => s.updateESConnection)
  const deleteESConnection = useEditorStore((s) => s.deleteESConnection)

  const connection = project.eventStorming?.connections.find((c) => c.id === connectionId)
  if (!connection) return <div className="text-slate-400 italic">Connection not found.</div>

  const sourceName = findESEntityName(project, connection.sourceId)
  const targetName = findESEntityName(project, connection.targetId)

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#e65100' }} />
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          Connection
        </span>
      </div>

      <Section label="From">
        <div className="text-xs font-medium text-slate-700 dark:text-slate-300">{sourceName}</div>
      </Section>

      <Section label="To">
        <div className="text-xs font-medium text-slate-700 dark:text-slate-300">{targetName}</div>
      </Section>

      <Section label="Label">
        <textarea
          value={connection.label || ''}
          onChange={(e) => updateESConnection(connectionId, { label: e.target.value })}
          className={TEXTAREA_CLASS}
          placeholder="Optional label for this connection..."
          rows={2}
        />
      </Section>

      <div className="pt-4 border-t border-slate-200 dark:border-neutral-700">
        <button
          onClick={() => {
            if (window.confirm('Delete this connection?')) {
              deleteESConnection(connectionId)
            }
          }}
          className="text-red-600 dark:text-red-400 flex items-center gap-2 text-xs hover:underline"
        >
          <Trash2 size={14} />
          Delete Connection
        </button>
      </div>
    </div>
  )
}
