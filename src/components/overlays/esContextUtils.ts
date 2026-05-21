import { useEditorStore } from '../../model/store'
import { ES_W, ES_H } from '../../lib/esCanvasConfig'

const STICKY_W = 140
const STICKY_H = 100

function toCanvas(pos: { x: number; y: number }) {
  return { x: (pos.x / 100) * ES_W, y: (pos.y / 100) * ES_H }
}

export function reconcileStickiesInBounds(
  contextId: string,
  boundsCanvas: { minX: number; minY: number; maxX: number; maxY: number }
) {
  const st = useEditorStore.getState()
  const pid = st.activeProjectId
  const es = pid ? st.projects[pid]?.eventStorming : null
  if (!es) return

  const isInside = (pos: { x: number; y: number }) => {
    const cx = toCanvas(pos).x + STICKY_W / 2
    const cy = toCanvas(pos).y + STICKY_H / 2
    return (
      cx >= boundsCanvas.minX &&
      cx <= boundsCanvas.maxX &&
      cy >= boundsCanvas.minY &&
      cy <= boundsCanvas.maxY
    )
  }

  for (const ev of es.domainEvents) {
    const inside = isInside(ev.position)
    if (inside && ev.contextId !== contextId) st.updateDomainEvent(ev.id, { contextId })
    else if (!inside && ev.contextId === contextId) st.updateDomainEvent(ev.id, { contextId: undefined })
  }
  for (const cmd of es.commands) {
    const inside = isInside(cmd.position)
    if (inside && cmd.contextId !== contextId) st.updateCommand(cmd.id, { contextId })
    else if (!inside && cmd.contextId === contextId) st.updateCommand(cmd.id, { contextId: undefined })
  }
  for (const agg of es.aggregates) {
    const inside = isInside(agg.position)
    if (inside && agg.contextId !== contextId) st.updateESAggregate(agg.id, { contextId })
    else if (!inside && agg.contextId === contextId) st.updateESAggregate(agg.id, { contextId: undefined })
  }
  for (const pol of es.policies) {
    const inside = isInside(pol.position)
    if (inside && pol.contextId !== contextId) st.updatePolicy(pol.id, { contextId })
    else if (!inside && pol.contextId === contextId) st.updatePolicy(pol.id, { contextId: undefined })
  }
  for (const hs of es.hotSpots) {
    const inside = isInside(hs.position)
    if (inside && hs.contextId !== contextId) st.updateESHotSpot(hs.id, { contextId })
    else if (!inside && hs.contextId === contextId) st.updateESHotSpot(hs.id, { contextId: undefined })
  }
}

/** Run reconciliation for ALL contexts that have an esBounds override */
export function reconcileAllContextBounds() {
  const st = useEditorStore.getState()
  const pid = st.activeProjectId
  const project = pid ? st.projects[pid] : null
  if (!project) return

  for (const ctx of project.contexts) {
    if (!ctx.esBounds) continue
    reconcileStickiesInBounds(ctx.id, {
      minX: (ctx.esBounds.minX / 100) * ES_W,
      minY: (ctx.esBounds.minY / 100) * ES_H,
      maxX: (ctx.esBounds.maxX / 100) * ES_W,
      maxY: (ctx.esBounds.maxY / 100) * ES_H,
    })
  }
}
