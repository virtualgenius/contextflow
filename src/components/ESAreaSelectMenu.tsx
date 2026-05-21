import React from 'react'
import { useEditorStore } from '../model/store'
import type { Project } from '../model/types'

/** Assigns all selected stickies to a context.
 *  - Aggregates get contextId directly.
 *  - DomainEvents + Commands: if there's already a selected aggregate, they link to it;
 *    otherwise a new aggregate is created automatically under that context.
 */
function assignStickiesToContext(idsToLink: string[], contextId: string, contextName: string) {
  const st = useEditorStore.getState()
  const pid = st.activeProjectId
  const es = pid ? st.projects[pid]?.eventStorming : null
  if (!es) return

  const aggregateIds = idsToLink.filter((id) => es.aggregates.some((a) => a.id === id))
  const domainEventIds = idsToLink.filter((id) => es.domainEvents.some((e) => e.id === id))
  const commandIds = idsToLink.filter((id) => es.commands.some((c) => c.id === id))
  const policyIds = idsToLink.filter((id) => es.policies.some((p) => p.id === id))
  const hotSpotIds = idsToLink.filter((id) => es.hotSpots.some((h) => h.id === id))

  // Aggregates: assign contextId directly
  for (const id of aggregateIds) st.updateESAggregate(id, { contextId })

  // Policies and hotspots: assign contextId directly
  for (const id of policyIds) st.updatePolicy(id, { contextId })
  for (const id of hotSpotIds) st.updateESHotSpot(id, { contextId })

  // Domain events and commands: link via aggregate (create one if none selected)
  if (domainEventIds.length > 0 || commandIds.length > 0) {
    let aggregateId: string | null = aggregateIds[0] ?? null
    if (!aggregateId) {
      st.addESAggregate(contextName)
      aggregateId = useEditorStore.getState().selectedESAggregateId
      if (aggregateId) st.updateESAggregate(aggregateId, { contextId })
    }
    if (aggregateId) {
      for (const id of domainEventIds) st.updateDomainEvent(id, { aggregateId: aggregateId })
      for (const id of commandIds) st.updateCommand(id, { aggregateId: aggregateId })
    }
  }
}

interface ESAreaSelectMenuProps {
  selectedStickyIds: string[]
  areaSelectRect: { startX: number; startY: number; endX: number; endY: number } | null
  project: Project | undefined
  stickyMenuMode: 'menu' | 'newContext' | 'pickContext'
  setStickyMenuMode: React.Dispatch<React.SetStateAction<'menu' | 'newContext' | 'pickContext'>>
  newContextName: string
  setNewContextName: React.Dispatch<React.SetStateAction<string>>
  onClearSelection: () => void
}

export function ESAreaSelectMenu({
  selectedStickyIds,
  areaSelectRect,
  project,
  stickyMenuMode,
  setStickyMenuMode,
  newContextName,
  setNewContextName,
  onClearSelection,
}: ESAreaSelectMenuProps) {
  return (
    <>
      {/* Drag rectangle while selecting */}
      {areaSelectRect && (
        <div
          style={{
            position: 'fixed',
            left: Math.min(areaSelectRect.startX, areaSelectRect.endX),
            top: Math.min(areaSelectRect.startY, areaSelectRect.endY),
            width: Math.abs(areaSelectRect.endX - areaSelectRect.startX),
            height: Math.abs(areaSelectRect.endY - areaSelectRect.startY),
            border: '2px dashed #3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.06)',
            borderRadius: 4,
            pointerEvents: 'none',
            zIndex: 9999,
          }}
        />
      )}

      {/* Area select floating action menu */}
      {selectedStickyIds.length > 0 && !areaSelectRect && (
        <div
          className="fixed bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-600 rounded-lg shadow-lg py-1 z-[10000]"
          style={{ left: '50%', top: 80, transform: 'translateX(-50%)' }}
        >
          <div className="px-4 py-1.5 text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-neutral-700">
            {selectedStickyIds.length} stickies selected
          </div>

          {stickyMenuMode === 'menu' && (
            <>
              <button
                onClick={() => setStickyMenuMode('newContext')}
                className="w-full px-4 py-2 text-left text-xs hover:bg-slate-100 dark:hover:bg-neutral-700"
              >
                Create new Bounded Context
              </button>
              {project && project.contexts.length > 0 && (
                <button
                  onClick={() => setStickyMenuMode('pickContext')}
                  className="w-full px-4 py-2 text-left text-xs hover:bg-slate-100 dark:hover:bg-neutral-700"
                >
                  Assign to existing Context
                </button>
              )}
              <button
                onClick={() => {
                  const idsToDelete = [...selectedStickyIds]
                  onClearSelection()
                  const st = useEditorStore.getState()
                  const pid = st.activeProjectId
                  const es = pid ? st.projects[pid]?.eventStorming : null
                  if (!es) return
                  for (const id of idsToDelete) {
                    if (es.domainEvents.some((e) => e.id === id)) st.deleteDomainEvent(id)
                    else if (es.commands.some((c) => c.id === id)) st.deleteCommand(id)
                    else if (es.aggregates.some((a) => a.id === id)) st.deleteESAggregate(id)
                    else if (es.policies.some((p) => p.id === id)) st.deletePolicy(id)
                    else if (es.hotSpots.some((h) => h.id === id)) st.deleteESHotSpot(id)
                  }
                }}
                className="w-full px-4 py-2 text-left text-xs text-red-500 hover:bg-slate-100 dark:hover:bg-neutral-700"
              >
                Delete all
              </button>
              <button
                onClick={onClearSelection}
                className="w-full px-4 py-2 text-left text-xs text-slate-400 hover:bg-slate-100 dark:hover:bg-neutral-700"
              >
                Cancel
              </button>
            </>
          )}

          {stickyMenuMode === 'newContext' && (
            <div className="px-3 py-2 flex flex-col gap-2 w-56">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Context name</div>
              <input
                autoFocus
                type="text"
                value={newContextName}
                onChange={(e) => setNewContextName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setStickyMenuMode('menu')
                    setNewContextName('')
                  }
                  if (e.key === 'Enter' && newContextName.trim()) {
                    const idsToLink = [...selectedStickyIds]
                    const name = newContextName.trim()
                    onClearSelection()
                    useEditorStore.getState().addContext(name)
                    const newContextId = useEditorStore.getState().selectedContextId
                    if (newContextId) assignStickiesToContext(idsToLink, newContextId, name)
                  }
                }}
                placeholder="e.g. Order Management"
                className="text-xs border border-slate-300 dark:border-neutral-600 rounded px-2 py-1 bg-white dark:bg-neutral-900 outline-none focus:border-blue-500"
              />
              <div className="flex gap-1">
                <button
                  onClick={() => {
                    if (!newContextName.trim()) return
                    const idsToLink = [...selectedStickyIds]
                    const name = newContextName.trim()
                    onClearSelection()
                    useEditorStore.getState().addContext(name)
                    const newContextId = useEditorStore.getState().selectedContextId
                    if (newContextId) assignStickiesToContext(idsToLink, newContextId, name)
                  }}
                  className="flex-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded px-2 py-1"
                >
                  Create
                </button>
                <button
                  onClick={() => {
                    setStickyMenuMode('menu')
                    setNewContextName('')
                  }}
                  className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {stickyMenuMode === 'pickContext' && project && (
            <div className="w-56 max-h-60 overflow-y-auto">
              {project.contexts.map((ctx) => (
                <button
                  key={ctx.id}
                  onClick={() => {
                    const idsToLink = [...selectedStickyIds]
                    onClearSelection()
                    assignStickiesToContext(idsToLink, ctx.id, ctx.name)
                  }}
                  className="w-full px-4 py-2 text-left text-xs hover:bg-slate-100 dark:hover:bg-neutral-700"
                >
                  {ctx.name}
                </button>
              ))}
              <button
                onClick={() => setStickyMenuMode('menu')}
                className="w-full px-4 py-2 text-left text-xs text-slate-400 hover:bg-slate-100 dark:hover:bg-neutral-700"
              >
                Back
              </button>
            </div>
          )}
        </div>
      )}
    </>
  )
}
