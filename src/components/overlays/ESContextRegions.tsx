import React from 'react'
import { useViewport, useReactFlow } from 'reactflow'
import { useEditorStore } from '../../model/store'
import type { Project, BoundedContext } from '../../model/types'

const STRATEGIC_BG: Record<string, string> = {
  core: 'rgba(248, 231, 161, 0.22)',
  supporting: 'rgba(219, 234, 254, 0.22)',
  generic: 'rgba(243, 244, 246, 0.22)',
}

const OWNERSHIP_BG: Record<string, string> = {
  ours: 'rgba(209, 250, 229, 0.25)',
  internal: 'rgba(219, 234, 254, 0.25)',
  external: 'rgba(254, 215, 170, 0.25)',
}

const STRATEGIC_BORDER: Record<string, string> = {
  core: '#f59e0b',
  supporting: '#3b82f6',
  generic: '#94a3b8',
}

const OWNERSHIP_BORDER: Record<string, string> = {
  ours: '#10b981',
  internal: '#3b82f6',
  external: '#f97316',
}

const STICKY_W = 140
const STICKY_H = 100
const PADDING = 48

function toCanvas(pos: { x: number; y: number }) {
  return { x: (pos.x / 100) * 2000, y: (pos.y / 100) * 1000 }
}

function toPercent(canvas: { x: number; y: number }) {
  return { x: (canvas.x / 2000) * 100, y: (canvas.y / 1000) * 100 }
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

function moveContextStickies(contextId: string, canvasDx: number, canvasDy: number) {
  const st = useEditorStore.getState()
  const pid = st.activeProjectId
  const es = pid ? st.projects[pid]?.eventStorming : null
  if (!es) return

  const aggIds = new Set(es.aggregates.filter((a) => a.contextId === contextId).map((a) => a.id))

  for (const agg of es.aggregates) {
    if (!aggIds.has(agg.id)) continue
    const c = toCanvas(agg.position)
    st.updateESAggregate(agg.id, { position: toPercent({ x: c.x + canvasDx, y: c.y + canvasDy }) })
  }
  for (const evt of es.domainEvents) {
    if (!evt.aggregateId || !aggIds.has(evt.aggregateId)) continue
    const c = toCanvas(evt.position)
    st.updateDomainEvent(evt.id, { position: toPercent({ x: c.x + canvasDx, y: c.y + canvasDy }) })
  }
  for (const cmd of es.commands) {
    if (!cmd.aggregateId || !aggIds.has(cmd.aggregateId)) continue
    const c = toCanvas(cmd.position)
    st.updateCommand(cmd.id, { position: toPercent({ x: c.x + canvasDx, y: c.y + canvasDy }) })
  }
  for (const pol of es.policies) {
    if (pol.contextId !== contextId) continue
    const c = toCanvas(pol.position)
    st.updatePolicy(pol.id, { position: toPercent({ x: c.x + canvasDx, y: c.y + canvasDy }) })
  }
  for (const hs of es.hotSpots) {
    if (hs.contextId !== contextId) continue
    const c = toCanvas(hs.position)
    st.updateESHotSpot(hs.id, { position: toPercent({ x: c.x + canvasDx, y: c.y + canvasDy }) })
  }
}

interface ContextRegionProps {
  contextId: string
  ctx: BoundedContext
  positions: { x: number; y: number }[]
  colorByMode: 'strategic' | 'ownership'
}

function ContextRegion({ contextId, ctx, positions, colorByMode }: ContextRegionProps) {
  const { flowToScreenPosition, screenToFlowPosition } = useReactFlow()
  const esToolMode = useEditorStore((s) => s.esToolMode)
  const dragStart = React.useRef<{ screenX: number; screenY: number } | null>(null)
  const [edgeHovered, setEdgeHovered] = React.useState(false)
  const stickyPlaceTools = ['domainEvent', 'command', 'aggregate', 'policy', 'hotSpot']
  const isDraggable = esToolMode === 'select'
  // When placing stickies, edge strips must be transparent so clicks reach the RF pane
  const edgesActive = isDraggable && !stickyPlaceTools.includes(esToolMode)

  const xs = positions.map((p) => p.x)
  const ys = positions.map((p) => p.y)
  const minX = Math.min(...xs) - PADDING
  const maxX = Math.max(...xs) + STICKY_W + PADDING
  const minY = Math.min(...ys) - PADDING
  const maxY = Math.max(...ys) + STICKY_H + PADDING

  const topLeft = flowToScreenPosition({ x: minX, y: minY })
  const bottomRight = flowToScreenPosition({ x: maxX, y: maxY })
  const left = topLeft.x
  const top = topLeft.y
  const width = bottomRight.x - topLeft.x
  const height = bottomRight.y - topLeft.y

  const isOwnership = colorByMode === 'ownership'
  const key = isOwnership ? (ctx.ownership || 'ours') : (ctx.strategicClassification || 'generic')
  const bgColor = isOwnership ? OWNERSHIP_BG[key] : STRATEGIC_BG[key]
  const borderColor = isOwnership ? OWNERSHIP_BORDER[key] : STRATEGIC_BORDER[key]

  const onMouseDown = (e: React.MouseEvent) => {
    if (!isDraggable) return
    e.stopPropagation()
    dragStart.current = { screenX: e.clientX, screenY: e.clientY }

    const onMouseMove = (me: MouseEvent) => {
      if (!dragStart.current) return
      const dx = me.clientX - dragStart.current.screenX
      const dy = me.clientY - dragStart.current.screenY
      dragStart.current = { screenX: me.clientX, screenY: me.clientY }

      // Convert a screen delta to a canvas delta using screenToFlowPosition
      const origin = screenToFlowPosition({ x: 0, y: 0 })
      const delta = screenToFlowPosition({ x: dx, y: dy })
      const canvasDx = delta.x - origin.x
      const canvasDy = delta.y - origin.y

      moveContextStickies(contextId, canvasDx, canvasDy)
    }

    const onMouseUp = () => {
      dragStart.current = null
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  return (
    <div
      style={{
        position: 'fixed',
        left,
        top,
        width,
        height,
        borderRadius: 12,
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: bgColor,
          border: `2px solid ${edgeHovered && isDraggable ? borderColor : borderColor}`,
          borderRadius: 12,
          mixBlendMode: 'multiply',
          boxShadow: edgeHovered && isDraggable ? `0 0 0 3px ${borderColor}55` : undefined,
          transition: 'box-shadow 0.15s',
        }}
      />
      {/* Drag handles: 4 edge strips (16px wide) so stickies inside remain interactive */}
      {(['top','bottom','left','right'] as const).map((side) => (
        <div
          key={side}
          style={{
            position: 'absolute',
            pointerEvents: edgesActive ? 'auto' : 'none',
            cursor: isDraggable ? 'grab' : 'default',
            ...(side === 'top'    && { top: 0, left: 0, right: 0, height: 16 }),
            ...(side === 'bottom' && { bottom: 0, left: 0, right: 0, height: 16 }),
            ...(side === 'left'   && { left: 0, top: 16, bottom: 16, width: 16 }),
            ...(side === 'right'  && { right: 0, top: 16, bottom: 16, width: 16 }),
          }}
          onMouseEnter={() => setEdgeHovered(true)}
          onMouseLeave={() => setEdgeHovered(false)}
          onMouseDown={onMouseDown}
        />
      ))}
      {/* Label pill + detach button */}
      <div
        data-label-pill
        style={{
          position: 'absolute',
          top: -13,
          left: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          cursor: 'default',
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
      </div>
    </div>
  )
}

export function ESContextRegions({ project }: { project: Project }) {
  useViewport() // re-render on pan/zoom
  const colorByMode = useEditorStore((s) => s.colorByMode)

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

  return (
    <>
      {Array.from(contextPositions.entries()).map(([contextId, positions]) => {
        const ctx = project.contexts.find((c) => c.id === contextId)
        if (!ctx) return null
        return (
          <ContextRegion
            key={contextId}
            contextId={contextId}
            ctx={ctx}
            positions={positions}
            colorByMode={colorByMode}
          />
        )
      })}
    </>
  )
}
