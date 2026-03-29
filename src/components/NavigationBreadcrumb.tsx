import React, { useEffect, useRef } from 'react'
import { useEditorStore } from '../model/store'
import { ChevronRight } from 'lucide-react'
import type { ViewMode } from '../model/storeTypes'

interface BreadcrumbEntry {
  viewMode: ViewMode
  label: string
}

const VIEW_LABELS: Record<ViewMode, string> = {
  flow: 'Value Stream',
  strategic: 'Strategic',
  distillation: 'Distillation',
  eventstorming: 'Event Storming',
}

const MAX_ENTRIES = 4

export function NavigationBreadcrumb() {
  const viewMode = useEditorStore((s) => s.activeViewMode)
  const setViewMode = useEditorStore((s) => s.setViewMode)
  const selectedContextId = useEditorStore((s) => s.selectedContextId)
  const selectedESAggregateId = useEditorStore((s) => s.selectedESAggregateId)
  const projectId = useEditorStore((s) => s.activeProjectId)
  const project = useEditorStore((s) => (projectId ? s.projects[projectId] : undefined))

  const historyRef = useRef<BreadcrumbEntry[]>([])

  // Track view changes
  useEffect(() => {
    const currentLabel = VIEW_LABELS[viewMode]
    let entityLabel = ''

    if (viewMode !== 'eventstorming' && selectedContextId && project) {
      const ctx = project.contexts.find((c) => c.id === selectedContextId)
      if (ctx) entityLabel = ctx.name
    } else if (viewMode === 'eventstorming' && selectedESAggregateId && project?.eventStorming) {
      const agg = project.eventStorming.aggregates.find((a) => a.id === selectedESAggregateId)
      if (agg) entityLabel = agg.name
    }

    const label = entityLabel ? `${currentLabel} > ${entityLabel}` : currentLabel
    const history = historyRef.current
    const last = history[history.length - 1]

    if (!last || last.viewMode !== viewMode || last.label !== label) {
      history.push({ viewMode, label })
      if (history.length > MAX_ENTRIES) {
        history.shift()
      }
    }
  }, [viewMode, selectedContextId, selectedESAggregateId, project])

  const history = historyRef.current
  if (history.length <= 1) return null

  return (
    <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm border border-slate-200 dark:border-neutral-700">
      {history.slice(0, -1).map((entry, i) => (
        <React.Fragment key={i}>
          <button
            onClick={() => setViewMode(entry.viewMode)}
            className="text-[10px] text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 truncate max-w-[120px]"
          >
            {entry.label}
          </button>
          <ChevronRight size={10} className="text-slate-300 dark:text-slate-600 flex-shrink-0" />
        </React.Fragment>
      ))}
      <span className="text-[10px] font-medium text-slate-700 dark:text-slate-200 truncate max-w-[120px]">
        {history[history.length - 1].label}
      </span>
    </div>
  )
}
