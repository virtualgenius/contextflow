import React from 'react'
import { useViewport } from 'reactflow'
import { useEditorStore } from '../../model/store'
import type { Project } from '../../model/types'

const STRATEGIC_COLORS: Record<string, string> = {
  core: 'rgba(248, 231, 161, 0.22)',
  supporting: 'rgba(219, 234, 254, 0.22)',
  generic: 'rgba(243, 244, 246, 0.22)',
}

const BORDER_COLORS: Record<string, string> = {
  core: '#f59e0b',
  supporting: '#3b82f6',
  generic: '#94a3b8',
}

const STICKY_W = 140
const STICKY_H = 100
const PADDING = 48

function toCanvas(pos: { x: number; y: number }) {
  return { x: (pos.x / 100) * 2000, y: (pos.y / 100) * 1000 }
}

function detachContext(contextId: string) {
  const st = useEditorStore.getState()
  const pid = st.activeProjectId
  const es = pid ? st.projects[pid]?.eventStorming : null
  if (!es) return

  const aggIds = new Set(es.aggregates.filter((a) => a.contextId === contextId).map((a) => a.id))
  for (const id of aggIds) st.updateESAggregate(id, { contextId: undefined })

  for (const evt of es.domainEvents) {
    if (evt.aggregateId && aggIds.has(evt.aggregateId)) st.updateDomainEvent(evt.id, { aggregateId: undefined })
  }
  for (const cmd of es.commands) {
    if (cmd.aggregateId && aggIds.has(cmd.aggregateId)) st.updateCommand(cmd.id, { aggregateId: undefined })
  }
  for (const pol of es.policies) {
    if (pol.contextId === contextId) st.updatePolicy(pol.id, { contextId: undefined })
  }
  for (const hs of es.hotSpots) {
    if (hs.contextId === contextId) st.updateESHotSpot(hs.id, { contextId: undefined })
  }
}

export function ESContextRegions({ project }: { project: Project }) {
  const { x: vpX, y: vpY, zoom } = useViewport()
  const [hoveredContextId, setHoveredContextId] = React.useState<string | null>(null)

  const es = project.eventStorming
  if (!es?.enabled) return null

  const contextPositions = new Map<string, { x: number; y: number }[]>()

  const addPos = (contextId: string, pos: { x: number; y: number }) => {
    if (!contextPositions.has(contextId)) contextPositions.set(contextId, [])
    contextPositions.get(contextId)!.push(toCanvas(pos))
  }

  const aggregateContextMap = new Map<string, string>()
  for (const agg of es.aggregates) {
    if (!agg.contextId) continue
    aggregateContextMap.set(agg.id, agg.contextId)
    addPos(agg.contextId, agg.position)
  }
  for (const evt of es.domainEvents) {
    const ctxId = evt.aggregateId ? aggregateContextMap.get(evt.aggregateId) : undefined
    if (ctxId) addPos(ctxId, evt.position)
  }
  for (const cmd of es.commands) {
    const ctxId = cmd.aggregateId ? aggregateContextMap.get(cmd.aggregateId) : undefined
    if (ctxId) addPos(ctxId, cmd.position)
  }
  for (const pol of es.policies) {
    if (pol.contextId) addPos(pol.contextId, pol.position)
  }
  for (const hs of es.hotSpots) {
    if (hs.contextId) addPos(hs.contextId, hs.position)
  }

  if (contextPositions.size === 0) return null

  // Rendered inside ReactFlow's .react-flow__renderer (pointer-events: none by default).
  // We use position:absolute in the viewport coordinate space (vpX/vpY/zoom already applied
  // by ReactFlow's transform layer), so we work in canvas coords and scale by zoom.
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: 0, height: 0, overflow: 'visible', pointerEvents: 'none' }}>
      {Array.from(contextPositions.entries()).map(([contextId, positions]) => {
        const ctx = project.contexts.find((c) => c.id === contextId)
        if (!ctx) return null

        const xs = positions.map((p) => p.x)
        const ys = positions.map((p) => p.y)
        const minX = Math.min(...xs) - PADDING
        const maxX = Math.max(...xs) + STICKY_W + PADDING
        const minY = Math.min(...ys) - PADDING
        const maxY = Math.max(...ys) + STICKY_H + PADDING

        // Convert canvas coords to screen (viewport) coords
        const left = minX * zoom + vpX
        const top = minY * zoom + vpY
        const width = (maxX - minX) * zoom
        const height = (maxY - minY) * zoom

        const classification = ctx.strategicClassification || 'generic'
        const bgColor = STRATEGIC_COLORS[classification] ?? STRATEGIC_COLORS.generic
        const borderColor = BORDER_COLORS[classification] ?? BORDER_COLORS.generic
        const isHovered = hoveredContextId === contextId

        return (
          <div
            key={contextId}
            style={{
              position: 'fixed',
              left,
              top,
              width,
              height,
              backgroundColor: bgColor,
              border: `2px solid ${borderColor}`,
              borderRadius: 12,
              pointerEvents: 'none',
            }}
          >
            {/* Label pill — only interactive element */}
            <div
              onMouseEnter={() => setHoveredContextId(contextId)}
              onMouseLeave={() => setHoveredContextId(null)}
              style={{
                position: 'absolute',
                top: -13,
                left: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                pointerEvents: 'auto',
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: borderColor,
                  backgroundColor: 'white',
                  border: `1.5px solid ${borderColor}`,
                  padding: '1px 8px',
                  borderRadius: 20,
                  letterSpacing: '0.02em',
                  whiteSpace: 'nowrap',
                }}
              >
                {ctx.name}
              </div>
              {isHovered && (
                <button
                  title="Remove from context (stickies stay)"
                  onClick={(e) => { e.stopPropagation(); detachContext(contextId) }}
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    border: `1.5px solid ${borderColor}`,
                    backgroundColor: 'white',
                    color: borderColor,
                    fontSize: 10,
                    fontWeight: 700,
                    lineHeight: 1,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                    flexShrink: 0,
                  }}
                >
                  ×
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
