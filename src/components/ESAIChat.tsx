import React, { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Settings, Pencil, Trash2, ChevronDown, ChevronRight } from 'lucide-react'
import { useEditorStore } from '../model/store'
import { ES_COLORS } from './nodes/ESStickyNode'
import { trackEvent } from '../utils/analytics'
import { getConnectionLabel } from '../lib/esConnectionRules'
import { reconcileStickiesInBounds } from './overlays/esContextUtils'

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const API_KEY_STORAGE_KEY = 'contextflow.anthropicApiKey'
const AI_MODEL = 'claude-opus-4-6'

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are an Event Storming facilitator working on a shared canvas. Your response MUST always start with a fenced code block tagged "actions" containing valid JSON, followed by exactly one sentence of explanation. Never skip the JSON block.

The CURRENT CANVAS STATE is provided in every message with exact pixel coordinates (x_px, y_px) for every element. The canvas is 16000×9000 px. Stickies are 140×100 px. Use coordinates to reason about layout — place elements compactly and intelligently.

OUTPUT FORMAT (mandatory every response):
\`\`\`actions
{ ...json... }
\`\`\`
One sentence summary.

OPERATIONS:
{
  "add_stickies":    [ { "id": string, "type": "command"|"aggregate"|"domainEvent"|"policy"|"hotSpot", "name": string, "x_px": number, "y_px": number, "context": string } ],
  "update_stickies": [ { "id": "<real canvas id>", "name"?: string, "x_px"?: number, "y_px"?: number } ],
  "delete_stickies": [ "<real canvas id>", ... ],
  "add_contexts":    [ { "name": string, "label": string } ],
  "delete_contexts": [ "<real canvas context id>", ... ],
  "add_connections": [ { "from": "<sticky id>", "to": "<sticky id>" } ],
  "delete_connections": [ "<real canvas connection id>", ... ]
}

ID RULES (critical — violations break the canvas):
- Every sticky in add_stickies MUST have a UNIQUE id within the response. Use simple sequential ids: "c1","c2","a1","a2","e1","e2","p1","p2" etc. NEVER reuse an id even if two stickies have the same name.
- add_connections references ONLY ids defined in add_stickies (for new stickies) or real canvas ids (for existing ones).

LAYOUT RULES:
- Sticky size: 140 wide × 100 tall. Leave 30px gap between stickies horizontally, 30px vertically.
- Standard flow left-to-right: command (x) → aggregate (x+170) → domainEvent (x+340). Next row: y+130.
- NEVER share an aggregate between two commands. Each command needs its OWN aggregate (separate x/y, can reuse same name).
- EVERY sticky MUST have a "context" field — the exact label= value from CANVAS STATE or a label from add_contexts.
- When adding to an EXISTING context: use its label= from CANVAS STATE. Place new stickies BELOW existing ones (use max_y from CANVAS STATE + 130). If adding beside existing, use max_x + 170.
- For NEW contexts: place them to the right of max_x_all (the rightmost thing on canvas) + 200. Stack multiple new contexts vertically with 30px gap between context boxes.
- Contexts BETWEEN existing ones that need to grow: the system will automatically push neighbors right — so don't worry about collisions.
- Valid connections: command→aggregate, aggregate→domainEvent, domainEvent→policy, domainEvent→command, policy→command.

EXAMPLE (fresh canvas, 2 contexts, notice all ids are unique c1..c3, a1..a3, e1..e3):
\`\`\`actions
{
  "add_stickies": [
    {"id":"c1","type":"command","name":"PlaceOrder","x_px":350,"y_px":550,"context":"ordering"},
    {"id":"a1","type":"aggregate","name":"Order","x_px":520,"y_px":550,"context":"ordering"},
    {"id":"e1","type":"domainEvent","name":"OrderPlaced","x_px":690,"y_px":550,"context":"ordering"},
    {"id":"c2","type":"command","name":"CancelOrder","x_px":350,"y_px":680,"context":"ordering"},
    {"id":"a2","type":"aggregate","name":"Order","x_px":520,"y_px":680,"context":"ordering"},
    {"id":"e2","type":"domainEvent","name":"OrderCancelled","x_px":690,"y_px":680,"context":"ordering"},
    {"id":"c3","type":"command","name":"PrepareOrder","x_px":1050,"y_px":550,"context":"kitchen"},
    {"id":"a3","type":"aggregate","name":"Preparation","x_px":1220,"y_px":550,"context":"kitchen"},
    {"id":"e3","type":"domainEvent","name":"OrderReady","x_px":1390,"y_px":550,"context":"kitchen"}
  ],
  "add_connections": [
    {"from":"c1","to":"a1"},{"from":"a1","to":"e1"},
    {"from":"c2","to":"a2"},{"from":"a2","to":"e2"},
    {"from":"e1","to":"c3"},{"from":"c3","to":"a3"},{"from":"a3","to":"e3"}
  ],
  "add_contexts": [
    {"name":"Ordering","label":"ordering"},
    {"name":"Kitchen","label":"kitchen"}
  ]
}
\`\`\`
Two contexts placed compactly left-to-right.

EXAMPLE (iterating — ordering has max_x=830, max_y=680; new row + new context, continuing from c3/a3/e3 so next are c4..c6):
\`\`\`actions
{
  "add_stickies": [
    {"id":"c4","type":"command","name":"RefundOrder","x_px":350,"y_px":810,"context":"ordering"},
    {"id":"a4","type":"aggregate","name":"Order","x_px":520,"y_px":810,"context":"ordering"},
    {"id":"e4","type":"domainEvent","name":"OrderRefunded","x_px":690,"y_px":810,"context":"ordering"},
    {"id":"c5","type":"command","name":"AssignRider","x_px":1800,"y_px":550,"context":"delivery"},
    {"id":"a5","type":"aggregate","name":"Delivery","x_px":1970,"y_px":550,"context":"delivery"},
    {"id":"e5","type":"domainEvent","name":"RiderAssigned","x_px":2140,"y_px":550,"context":"delivery"}
  ],
  "add_connections": [
    {"from":"c4","to":"a4"},{"from":"a4","to":"e4"},
    {"from":"c5","to":"a5"},{"from":"a5","to":"e5"}
  ],
  "add_contexts": [{"name":"Delivery","label":"delivery"}]
}
\`\`\`
Added a Refund row inside Ordering and a new Delivery context to the right.`

// ---------------------------------------------------------------------------
// Layout constants
// ---------------------------------------------------------------------------

const ES_W = 16000
const ES_H = 9000
const STICKY_W_PX = 140
const STICKY_H_PX = 100
const STICKY_GAP_Y = 100
const CANVAS_START_X = 300
const CANVAS_START_Y = 500

function pxToPercent(px: number, py: number): { x: number; y: number } {
  return { x: (px / ES_W) * 100, y: (py / ES_H) * 100 }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type StickyType = 'domainEvent' | 'command' | 'aggregate' | 'policy' | 'hotSpot'

interface AddStickyOp {
  id: string
  type: StickyType
  name: string
  x_px?: number
  y_px?: number
  // legacy col/row fallback
  col?: number
  row?: number
  context: string
}

interface UpdateStickyOp {
  id: string
  name?: string
  x_px?: number
  y_px?: number
}

interface AddContextOp {
  name: string
  label: string
  ctxCol?: number
  ctxRow?: number
}

interface AddConnectionOp {
  from: string
  to: string
}

interface ActionsPayload {
  add_stickies?: AddStickyOp[]
  update_stickies?: UpdateStickyOp[]
  delete_stickies?: string[]
  add_contexts?: AddContextOp[]
  delete_contexts?: string[]
  add_connections?: AddConnectionOp[]
  delete_connections?: string[]
  // legacy support (old format)
  stickies?: AddStickyOp[]
  connections?: AddConnectionOp[]
  contexts?: AddContextOp[]
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  addedCount?: number
}

// ---------------------------------------------------------------------------
// Canvas state serialization
// ---------------------------------------------------------------------------

function buildCanvasContext(): string {
  const state = useEditorStore.getState()
  const projectId = state.activeProjectId
  const project = projectId ? state.projects[projectId] : undefined
  const es = project?.eventStorming
  if (!es || !es.enabled) return 'CANVAS: empty'

  const lines: string[] = ['CANVAS STATE (use these IDs for update/delete/connect):']
  const ctxName = (id?: string) => project?.contexts.find((c) => c.id === id)?.name ?? '—'

  if (project && project.contexts.length > 0) {
    lines.push('CONTEXTS:')
    // Build per-context sticky bounds to expose layout info to the AI
    const allStickies = [
      ...es.commands.map((s) => ({ ctxId: s.contextId, pos: s.position })),
      ...es.aggregates.map((s) => ({ ctxId: s.contextId, pos: s.position })),
      ...es.domainEvents.map((s) => ({ ctxId: s.contextId, pos: s.position })),
      ...es.policies.map((s) => ({ ctxId: s.contextId, pos: s.position })),
      ...es.hotSpots.map((s) => ({ ctxId: s.contextId, pos: s.position })),
    ]
    for (const ctx of project.contexts) {
      const label = ctx.name.toLowerCase().replace(/\s+/g, '-')
      // Count rows already in this context
      const members = allStickies.filter((s) => s.ctxId === ctx.id)
      const rowsUsed = members.length > 0
        ? Math.round((Math.max(...members.map((s) => (s.pos.y / 100) * ES_H)) - CANVAS_START_Y) / (STICKY_H_PX + STICKY_GAP_Y)) + 1
        : 0
      // Expose bounds as canvas coords (percentage of 16000×9000)
      const eb = ctx.esBounds
      const boundsStr = eb
        ? ` bounds_pct="x:${eb.minX.toFixed(1)}-${eb.maxX.toFixed(1)} y:${eb.minY.toFixed(1)}-${eb.maxY.toFixed(1)}"`
        : ''
      lines.push(`  id=${ctx.id} name="${ctx.name}" label="${label}" rows_used=${rowsUsed}${boundsStr}`)
    }
  }

  const fmt = (id: string, type: string, name: string, ctxId?: string) =>
    `  id=${id} type=${type} name="${name}" context="${ctxName(ctxId)}"`

  if (es.commands.length > 0) {
    lines.push('COMMANDS:')
    es.commands.forEach((s) => lines.push(fmt(s.id, 'command', s.name, s.contextId)))
  }
  if (es.aggregates.length > 0) {
    lines.push('AGGREGATES:')
    es.aggregates.forEach((s) => lines.push(fmt(s.id, 'aggregate', s.name, s.contextId)))
  }
  if (es.domainEvents.length > 0) {
    lines.push('DOMAIN EVENTS:')
    es.domainEvents.forEach((s) => lines.push(fmt(s.id, 'domainEvent', s.name, s.contextId)))
  }
  if (es.policies.length > 0) {
    lines.push('POLICIES:')
    es.policies.forEach((s) => lines.push(fmt(s.id, 'policy', s.name, s.contextId)))
  }
  if (es.hotSpots.length > 0) {
    lines.push('HOT SPOTS:')
    es.hotSpots.forEach((s) => lines.push(fmt(s.id, 'hotSpot', s.title, s.contextId)))
  }
  if (es.connections.length > 0) {
    lines.push('CONNECTIONS:')
    es.connections.forEach((c) => lines.push(`  id=${c.id} from=${c.sourceId} to=${c.targetId}`))
  }

  return lines.join('\n')
}

// ---------------------------------------------------------------------------
// Payload parsing
// ---------------------------------------------------------------------------

function parseActions(text: string): ActionsPayload | null {
  const matches = [...text.matchAll(/```actions\n([\s\S]*?)\n```/g)]
  if (matches.length === 0) return null
  const lastMatch = matches[matches.length - 1]
  try {
    const parsed = JSON.parse(lastMatch[1])
    if (Array.isArray(parsed)) return { add_stickies: parsed as AddStickyOp[] }
    // Normalize legacy format
    if (parsed.stickies && !parsed.add_stickies) {
      parsed.add_stickies = parsed.stickies
      parsed.add_connections = parsed.connections ?? []
      parsed.add_contexts = parsed.contexts ?? []
    }
    return parsed as ActionsPayload
  } catch {
    return null
  }
}

function stripActionsBlock(text: string): string {
  return text.replace(/```actions\n[\s\S]*?\n```/g, '').trim()
}

// ---------------------------------------------------------------------------
// Push all stickies of contexts whose left edge is past splitX rightward by dx
// ---------------------------------------------------------------------------

function pushNeighborsRight(growingCtxId: string, splitX: number, dx: number) {
  const st = useEditorStore.getState()
  const pid = st.activeProjectId
  const project = pid ? st.projects[pid] : undefined
  const es = project?.eventStorming
  if (!es || !project) return

  // Find contexts whose bounds start to the right of splitX (they are neighbors)
  const neighborsToShift = project.contexts.filter((c) => {
    if (c.id === growingCtxId) return false
    if (!c.esBounds) return false
    return (c.esBounds.minX / 100) * ES_W >= splitX - 1
  })

  for (const ctx of neighborsToShift) {
    const eb = ctx.esBounds!
    const newEb = {
      minX: Math.min(100, eb.minX + (dx / ES_W) * 100),
      minY: eb.minY,
      maxX: Math.min(100, eb.maxX + (dx / ES_W) * 100),
      maxY: eb.maxY,
    }
    st.updateContext(ctx.id, { esBounds: newEb })

    // Shift all stickies inside this context
    const shiftSticky = (pos: { x: number; y: number }) =>
      ({ x: Math.min(100, pos.x + (dx / ES_W) * 100), y: pos.y })

    for (const s of es.domainEvents.filter((s) => s.contextId === ctx.id))
      st.updateDomainEvent(s.id, { position: shiftSticky(s.position) })
    for (const s of es.commands.filter((s) => s.contextId === ctx.id))
      st.updateCommand(s.id, { position: shiftSticky(s.position) })
    for (const s of es.aggregates.filter((s) => s.contextId === ctx.id))
      st.updateESAggregate(s.id, { position: shiftSticky(s.position) })
    for (const s of es.policies.filter((s) => s.contextId === ctx.id))
      st.updatePolicy(s.id, { position: shiftSticky(s.position) })
    for (const s of es.hotSpots.filter((s) => s.contextId === ctx.id))
      st.updateESHotSpot(s.id, { position: shiftSticky(s.position) })
  }
}

// ---------------------------------------------------------------------------
// Apply payload
// ---------------------------------------------------------------------------

function applyPayload(payload: ActionsPayload): number {
  const st = useEditorStore.getState

  // delete_stickies
  for (const id of payload.delete_stickies ?? []) {
    const es = st().projects[st().activeProjectId ?? '']?.eventStorming
    if (!es) continue
    if (es.commands.find((s) => s.id === id)) st().deleteCommand(id)
    else if (es.aggregates.find((s) => s.id === id)) st().deleteESAggregate(id)
    else if (es.domainEvents.find((s) => s.id === id)) st().deleteDomainEvent(id)
    else if (es.policies.find((s) => s.id === id)) st().deletePolicy(id)
    else if (es.hotSpots.find((s) => s.id === id)) st().deleteESHotSpot(id)
  }

  // update_stickies
  for (const op of payload.update_stickies ?? []) {
    if (!op.name && op.x_px === undefined && op.y_px === undefined) continue
    const es = st().projects[st().activeProjectId ?? '']?.eventStorming
    if (!es) continue
    const pos = (op.x_px !== undefined && op.y_px !== undefined)
      ? pxToPercent(op.x_px, op.y_px)
      : undefined
    const updates = { ...(op.name ? { name: op.name } : {}), ...(pos ? { position: pos } : {}) }
    if (es.commands.find((s) => s.id === op.id)) st().updateCommand(op.id, updates)
    else if (es.aggregates.find((s) => s.id === op.id)) st().updateESAggregate(op.id, updates)
    else if (es.domainEvents.find((s) => s.id === op.id)) st().updateDomainEvent(op.id, updates)
    else if (es.policies.find((s) => s.id === op.id)) st().updatePolicy(op.id, updates)
    else if (es.hotSpots.find((s) => s.id === op.id)) st().updateESHotSpot(op.id, updates)
  }

  // delete_contexts
  for (const id of payload.delete_contexts ?? []) st().deleteContext(id)

  // delete_connections
  for (const id of payload.delete_connections ?? []) st().deleteESConnection(id)

  // add_stickies + add_contexts
  // Deduplicate: if the AI emits multiple stickies with the same temp id, give each a unique id
  const rawStickies = payload.add_stickies ?? []
  const seenIds = new Map<string, number>()
  const newStickies: AddStickyOp[] = rawStickies.map((s) => {
    const count = (seenIds.get(s.id) ?? 0) + 1
    seenIds.set(s.id, count)
    return count > 1 ? { ...s, id: `${s.id}_dup${count}` } : s
  })
  if (newStickies.length === 0) return 0

  const newContextDefs = payload.add_contexts ?? []
  const newCtxLabels = new Set(newContextDefs.map((c) => c.label))
  const firstLabel = newContextDefs[0]?.label ?? null

  // Build label→existing-context lookup
  const state = useEditorStore.getState()
  const pid = state.activeProjectId
  const existingContexts = pid ? (state.projects[pid]?.contexts ?? []) : []
  const existingLabelMap = new Map<string, string>() // label → contextId
  for (const ctx of existingContexts) {
    existingLabelMap.set(ctx.name.toLowerCase().replace(/\s+/g, '-'), ctx.id)
    existingLabelMap.set(ctx.name.toLowerCase(), ctx.id)
    existingLabelMap.set(ctx.id, ctx.id)
  }

  // Group stickies by context label
  interface Group { ctxDef: AddContextOp | null; existingCtxId?: string; stickies: AddStickyOp[] }
  const groupMap = new Map<string, Group>()
  for (const ctxDef of newContextDefs) groupMap.set(ctxDef.label, { ctxDef, stickies: [] })

  for (const s of newStickies) {
    const rawLabel = s.context ?? ''
    let label: string
    if (newCtxLabels.has(rawLabel)) {
      label = rawLabel
    } else if (existingLabelMap.has(rawLabel)) {
      label = rawLabel
    } else {
      label = firstLabel ?? rawLabel
    }
    if (!groupMap.has(label)) {
      groupMap.set(label, { ctxDef: null, existingCtxId: existingLabelMap.get(label), stickies: [] })
    }
    groupMap.get(label)!.stickies.push(s)
  }

  // Place stickies.
  // The AI often reuses the same temp id for multiple stickies (Date.now() collision).
  // We map by array index to guarantee uniqueness, then build two lookup structures:
  //   stickyRealIds[i]      = real store id for newStickies[i]
  //   stickyPx[realId]      = pixel coords for that real id (used by updateContextBounds)
  const stickyRealIds: string[] = []
  const stickyPx: Record<string, { px: number; py: number }> = {}

  for (let i = 0; i < newStickies.length; i++) {
    const action = newStickies[i]
    const px = action.x_px ?? CANVAS_START_X
    const py = action.y_px ?? CANVAS_START_Y
    const pos = pxToPercent(px, py)
    let realId = ''
    if (action.type === 'domainEvent') {
      st().addDomainEvent(action.name, pos)
      realId = st().selectedDomainEventId ?? ''
    } else if (action.type === 'command') {
      st().addCommand(action.name, pos)
      realId = st().selectedCommandId ?? ''
    } else if (action.type === 'aggregate') {
      st().addESAggregate(action.name, pos)
      realId = st().selectedESAggregateId ?? ''
    } else if (action.type === 'policy') {
      st().addPolicy(action.name, pos)
      realId = st().selectedPolicyId ?? ''
    } else if (action.type === 'hotSpot') {
      st().addESHotSpot(action.name, pos)
      realId = st().selectedESHotSpotId ?? ''
    }
    stickyRealIds.push(realId)
    if (realId) stickyPx[realId] = { px, py }
  }

  // Build idMap: AI temp id → real id.
  // For duplicate temp ids, map to the FIRST occurrence (connections written before the
  // duplicate refer to the first sticky with that id).
  const idMap: Record<string, string> = {}
  for (let i = 0; i < newStickies.length; i++) {
    const tempId = newStickies[i].id
    if (!idMap[tempId]) idMap[tempId] = stickyRealIds[i]
  }

  // add_connections — resolve temp ids OR pass real ids through
  const resolve = (id: string) => idMap[id] ?? id
  for (const conn of payload.add_connections ?? []) {
    const sourceId = resolve(conn.from)
    const targetId = resolve(conn.to)
    if (sourceId && targetId) {
      const connId = st().createESConnection(sourceId, targetId)
      if (connId) {
        const srcType = newStickies.find((s) => s.id === conn.from)?.type
        const tgtType = newStickies.find((s) => s.id === conn.to)?.type
        if (srcType && tgtType) {
          const label = getConnectionLabel(srcType, tgtType)
          if (label) st().updateESConnection(connId, { label })
        }
      }
    }
  }

  // Create/expand context bounds and push overlapping neighbors
  const CTX_PADDING = 50

  const updateContextBounds = (ctxId: string, memberIds: string[]) => {
    if (memberIds.length === 0) return
    const pxs = memberIds.map((id) => stickyPx[id]?.px ?? 0)
    const pys = memberIds.map((id) => stickyPx[id]?.py ?? 0)
    const newMinX = Math.min(...pxs) - CTX_PADDING
    const newMinY = Math.min(...pys) - CTX_PADDING
    const newMaxX = Math.max(...pxs) + STICKY_W_PX + CTX_PADDING
    const newMaxY = Math.max(...pys) + STICKY_H_PX + CTX_PADDING

    // Merge with existing bounds
    const existingCtx = st().projects[st().activeProjectId ?? '']?.contexts.find((c) => c.id === ctxId)
    const eb = existingCtx?.esBounds
    const mergedMinX = eb ? Math.min((eb.minX / 100) * ES_W, newMinX) : newMinX
    const mergedMinY = eb ? Math.min((eb.minY / 100) * ES_H, newMinY) : newMinY
    const mergedMaxX = eb ? Math.max((eb.maxX / 100) * ES_W, newMaxX) : newMaxX
    const mergedMaxY = eb ? Math.max((eb.maxY / 100) * ES_H, newMaxY) : newMaxY

    const esBounds = {
      minX: Math.max(0, (mergedMinX / ES_W) * 100),
      minY: Math.max(0, (mergedMinY / ES_H) * 100),
      maxX: Math.min(100, (mergedMaxX / ES_W) * 100),
      maxY: Math.min(100, (mergedMaxY / ES_H) * 100),
    }
    st().updateContext(ctxId, { esBounds })
    reconcileStickiesInBounds(ctxId, { minX: mergedMinX, minY: mergedMinY, maxX: mergedMaxX, maxY: mergedMaxY })

    // Push any context whose left edge is to the right of this context's old right edge
    // and now overlaps the new right edge
    if (eb) {
      const oldMaxX = (eb.maxX / 100) * ES_W
      const overflow = mergedMaxX - oldMaxX
      if (overflow > 0) {
        pushNeighborsRight(ctxId, oldMaxX, overflow)
      }
    }
  }

  // Helper: resolve temp AI id → real id, then get px coords
  const realIdsFor = (stickies: AddStickyOp[]) =>
    stickies.map((s) => idMap[s.id]).filter(Boolean)

  // add_contexts (new ones)
  for (const ctxDef of newContextDefs) {
    const g = groupMap.get(ctxDef.label)
    const members = g?.stickies ?? []
    if (members.length === 0) continue
    st().addContext(ctxDef.name)
    const newCtxId = st().selectedContextId
    if (newCtxId) updateContextBounds(newCtxId, realIdsFor(members))
  }

  // Expand existing contexts that got new stickies
  for (const [, g] of groupMap) {
    if (g.ctxDef !== null || !g.existingCtxId) continue
    if (g.stickies.length === 0) continue
    updateContextBounds(g.existingCtxId, realIdsFor(g.stickies))
  }

  // Resolve context collisions: sort contexts left-to-right, push any overlap right
  {
    const GAP_PX = 40
    const ctxsNow = [...(st().projects[st().activeProjectId ?? '']?.contexts ?? [])]
      .filter((c) => c.esBounds)
      .sort((a, b) => a.esBounds!.minX - b.esBounds!.minX)
    for (let i = 1; i < ctxsNow.length; i++) {
      const prev = ctxsNow[i - 1]
      const cur = ctxsNow[i]
      const prevMaxX = (prev.esBounds!.maxX / 100) * ES_W
      const curMinX = (cur.esBounds!.minX / 100) * ES_W
      if (curMinX < prevMaxX + GAP_PX) {
        const shift = prevMaxX + GAP_PX - curMinX
        const eb = cur.esBounds!
        const newEb = {
          minX: Math.min(100, eb.minX + (shift / ES_W) * 100),
          minY: eb.minY,
          maxX: Math.min(100, eb.maxX + (shift / ES_W) * 100),
          maxY: eb.maxY,
        }
        st().updateContext(cur.id, { esBounds: newEb })
        const es2 = st().projects[st().activeProjectId ?? '']?.eventStorming
        if (es2) {
          const shiftPct = (shift / ES_W) * 100
          const shiftPos = (pos: { x: number; y: number }) => ({ x: Math.min(100, pos.x + shiftPct), y: pos.y })
          for (const s of es2.domainEvents.filter((s) => s.contextId === cur.id))
            st().updateDomainEvent(s.id, { position: shiftPos(s.position) })
          for (const s of es2.commands.filter((s) => s.contextId === cur.id))
            st().updateCommand(s.id, { position: shiftPos(s.position) })
          for (const s of es2.aggregates.filter((s) => s.contextId === cur.id))
            st().updateESAggregate(s.id, { position: shiftPos(s.position) })
          for (const s of es2.policies.filter((s) => s.contextId === cur.id))
            st().updatePolicy(s.id, { position: shiftPos(s.position) })
          for (const s of es2.hotSpots.filter((s) => s.contextId === cur.id))
            st().updateESHotSpot(s.id, { position: shiftPos(s.position) })
        }
        // Update the sorted array so the next iteration sees the moved bounds
        ctxsNow[i] = { ...cur, esBounds: newEb }
      }
    }
  }

  // Assign any orphaned stickies (no contextId) to the nearest context by proximity
  const allContextsAfter = st().projects[st().activeProjectId ?? '']?.contexts ?? []
  const orphanIds = newStickies
    .filter((s) => !s.context || (!newCtxLabels.has(s.context) && !existingLabelMap.has(s.context)))
    .map((s) => idMap[s.id])
    .filter(Boolean)
  if (orphanIds.length > 0) {
    for (const realId of orphanIds) {
      // Find which context has bounds containing this sticky's position
      const esNow = st().projects[st().activeProjectId ?? '']?.eventStorming
      if (!esNow) continue
      const allStickyArrays = [
        ...esNow.domainEvents, ...esNow.commands, ...esNow.aggregates,
        ...esNow.policies, ...esNow.hotSpots,
      ]
      const sticky = allStickyArrays.find((s) => s.id === realId)
      if (!sticky || sticky.contextId) continue
      const px = (sticky.position.x / 100) * ES_W
      const py = (sticky.position.y / 100) * ES_H
      // Find context whose bounds contain this sticky
      let bestCtxId: string | null = null
      let bestArea = Infinity
      for (const ctx of allContextsAfter) {
        const eb = ctx.esBounds
        if (!eb) continue
        const minX = (eb.minX / 100) * ES_W
        const minY = (eb.minY / 100) * ES_H
        const maxX = (eb.maxX / 100) * ES_W
        const maxY = (eb.maxY / 100) * ES_H
        if (px >= minX && px <= maxX && py >= minY && py <= maxY) {
          const area = (maxX - minX) * (maxY - minY)
          if (area < bestArea) { bestArea = area; bestCtxId = ctx.id }
        }
      }
      // Fall back: closest context center
      if (!bestCtxId) {
        let minDist = Infinity
        for (const ctx of allContextsAfter) {
          const eb = ctx.esBounds
          if (!eb) continue
          const cx = ((eb.minX + eb.maxX) / 2 / 100) * ES_W
          const cy = ((eb.minY + eb.maxY) / 2 / 100) * ES_H
          const d = Math.hypot(px - cx, py - cy)
          if (d < minDist) { minDist = d; bestCtxId = ctx.id }
        }
      }
      if (bestCtxId) {
        if (esNow.domainEvents.find((s) => s.id === realId)) st().updateDomainEvent(realId, { contextId: bestCtxId })
        else if (esNow.commands.find((s) => s.id === realId)) st().updateCommand(realId, { contextId: bestCtxId })
        else if (esNow.aggregates.find((s) => s.id === realId)) st().updateESAggregate(realId, { contextId: bestCtxId })
        else if (esNow.policies.find((s) => s.id === realId)) st().updatePolicy(realId, { contextId: bestCtxId })
        // Expand context bounds to include this sticky (pass real id)
        updateContextBounds(bestCtxId, [realId])
      }
    }
  }

  return newStickies.length
}

// ---------------------------------------------------------------------------
// Canvas clear
// ---------------------------------------------------------------------------

function clearCanvas() {
  const st = useEditorStore.getState()
  const pid = st.activeProjectId
  const es = pid ? st.projects[pid]?.eventStorming : undefined
  const project = pid ? st.projects[pid] : undefined
  if (!es) return
  ;[...es.domainEvents].forEach((s) => st.deleteDomainEvent(s.id))
  ;[...es.commands].forEach((s) => st.deleteCommand(s.id))
  ;[...es.aggregates].forEach((s) => st.deleteESAggregate(s.id))
  ;[...es.policies].forEach((s) => st.deletePolicy(s.id))
  ;[...es.hotSpots].forEach((s) => st.deleteESHotSpot(s.id))
  ;[...(project?.contexts ?? [])].forEach((c) => st.deleteContext(c.id))
}

// ---------------------------------------------------------------------------
// UI helpers
// ---------------------------------------------------------------------------

function getApiKey(): string {
  return localStorage.getItem(API_KEY_STORAGE_KEY) ?? ''
}

const TYPE_DOT_COLORS: Record<StickyType, string> = {
  domainEvent: ES_COLORS.domainEvent.bg,
  command: ES_COLORS.command.bg,
  aggregate: ES_COLORS.aggregate.bg,
  policy: ES_COLORS.policy.bg,
  hotSpot: ES_COLORS.hotSpot.bg,
}

const TYPE_LABELS: Record<StickyType, string> = {
  domainEvent: 'Event',
  command: 'Command',
  aggregate: 'Aggregate',
  policy: 'Policy',
  hotSpot: 'Hot Spot',
}

function stripActionsBlockDisplay(text: string): string {
  return stripActionsBlock(text)
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'
  const displayContent = isUser ? message.content : stripActionsBlockDisplay(message.content)

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-tr-sm px-3 py-2 bg-blue-600 text-white text-xs leading-relaxed">
          {displayContent}
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-2">
      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-200 dark:bg-neutral-700 flex items-center justify-center mt-0.5">
        <Bot size={12} className="text-slate-500 dark:text-slate-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="rounded-2xl rounded-tl-sm px-3 py-2 bg-slate-100 dark:bg-neutral-700 text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
          {displayContent || (message.addedCount ? `${message.addedCount} stickies placed on canvas.` : '')}
        </div>
        {message.addedCount !== undefined && message.addedCount > 0 && (
          <div className="mt-1 px-1">
            <span className="text-[10px] text-slate-400 dark:text-slate-500">+{message.addedCount} stickies added</span>
          </div>
        )}
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex gap-2">
      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-200 dark:bg-neutral-700 flex items-center justify-center">
        <Bot size={12} className="text-slate-500 dark:text-slate-400" />
      </div>
      <div className="rounded-2xl rounded-tl-sm px-3 py-2.5 bg-slate-100 dark:bg-neutral-700 flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce [animation-delay:0ms]" />
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce [animation-delay:150ms]" />
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Canvas tab
// ---------------------------------------------------------------------------

interface StickyRow {
  id: string
  type: StickyType
  name: string
  contextName: string
}

function useCanvasItems() {
  return useEditorStore((s) => {
    const pid = s.activeProjectId
    const project = pid ? s.projects[pid] : undefined
    const es = project?.eventStorming
    const contexts = project?.contexts ?? []
    const ctxName = (id?: string) => contexts.find((c) => c.id === id)?.name ?? '—'

    const stickies: StickyRow[] = [
      ...(es?.commands.map((s) => ({ id: s.id, type: 'command' as StickyType, name: s.name, contextName: ctxName(s.contextId) })) ?? []),
      ...(es?.aggregates.map((s) => ({ id: s.id, type: 'aggregate' as StickyType, name: s.name, contextName: ctxName(s.contextId) })) ?? []),
      ...(es?.domainEvents.map((s) => ({ id: s.id, type: 'domainEvent' as StickyType, name: s.name, contextName: ctxName(s.contextId) })) ?? []),
      ...(es?.policies.map((s) => ({ id: s.id, type: 'policy' as StickyType, name: s.name, contextName: ctxName(s.contextId) })) ?? []),
      ...(es?.hotSpots.map((s) => ({ id: s.id, type: 'hotSpot' as StickyType, name: s.title, contextName: ctxName(s.contextId) })) ?? []),
    ]
    return { stickies, contexts }
  })
}

export function ESCanvasTab() {
  const { stickies, contexts } = useCanvasItems()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [expandedCtx, setExpandedCtx] = useState<Record<string, boolean>>({})
  const [confirmClear, setConfirmClear] = useState(false)

  const startEdit = (id: string, name: string) => { setEditingId(id); setEditValue(name) }

  const commitEdit = (id: string, isContext: boolean) => {
    const trimmed = editValue.trim()
    if (trimmed) {
      const st = useEditorStore.getState()
      const es = st.projects[st.activeProjectId ?? '']?.eventStorming
      if (isContext) {
        st.updateContext(id, { name: trimmed })
      } else if (es) {
        if (es.commands.find((s) => s.id === id)) st.updateCommand(id, { name: trimmed })
        else if (es.aggregates.find((s) => s.id === id)) st.updateESAggregate(id, { name: trimmed })
        else if (es.domainEvents.find((s) => s.id === id)) st.updateDomainEvent(id, { name: trimmed })
        else if (es.policies.find((s) => s.id === id)) st.updatePolicy(id, { name: trimmed })
        else if (es.hotSpots.find((s) => s.id === id)) st.updateESHotSpot(id, { title: trimmed })
      }
    }
    setEditingId(null)
  }

  const deleteSticky = (id: string) => {
    const st = useEditorStore.getState()
    const es = st.projects[st.activeProjectId ?? '']?.eventStorming
    if (!es) return
    if (es.commands.find((s) => s.id === id)) st.deleteCommand(id)
    else if (es.aggregates.find((s) => s.id === id)) st.deleteESAggregate(id)
    else if (es.domainEvents.find((s) => s.id === id)) st.deleteDomainEvent(id)
    else if (es.policies.find((s) => s.id === id)) st.deletePolicy(id)
    else if (es.hotSpots.find((s) => s.id === id)) st.deleteESHotSpot(id)
  }

  const toggleCtx = (id: string) => setExpandedCtx((prev) => ({ ...prev, [id]: !prev[id] }))

  // Group stickies by context name
  const byContext = new Map<string, StickyRow[]>()
  for (const s of stickies) {
    if (!byContext.has(s.contextName)) byContext.set(s.contextName, [])
    byContext.get(s.contextName)!.push(s)
  }

  if (contexts.length === 0 && stickies.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-center px-4">
        <p className="text-[11px] text-slate-400 dark:text-slate-500">Canvas is empty. Use the chat to generate stickies.</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto min-h-0 flex flex-col">
      {/* Clear button */}
      <div className="flex-shrink-0 px-2 pt-2 pb-1 flex justify-end">
        {confirmClear ? (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-500 dark:text-slate-400">Clear all?</span>
            <button
              onClick={() => { clearCanvas(); setConfirmClear(false) }}
              className="text-[10px] px-2 py-0.5 rounded bg-red-500 text-white hover:bg-red-600 transition-colors"
            >
              Yes, clear
            </button>
            <button
              onClick={() => setConfirmClear(false)}
              className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-neutral-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-neutral-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmClear(true)}
            className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
          >
            <Trash2 size={10} />
            Clear canvas
          </button>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto min-h-0 px-2 pb-2 space-y-1">
        {/* Contexts with their stickies */}
        {contexts.map((ctx) => {
          const members = byContext.get(ctx.name) ?? []
          const expanded = expandedCtx[ctx.id] !== false
          return (
            <div key={ctx.id} className="rounded-lg border border-slate-200 dark:border-neutral-600 overflow-hidden">
              <div className="flex items-center gap-1 px-2 py-1.5 bg-slate-50 dark:bg-neutral-700/50">
                <button onClick={() => toggleCtx(ctx.id)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex-shrink-0">
                  {expanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                </button>
                {editingId === ctx.id ? (
                  <input
                    autoFocus
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(ctx.id, true); if (e.key === 'Escape') setEditingId(null) }}
                    onBlur={() => commitEdit(ctx.id, true)}
                    className="flex-1 text-[11px] font-medium bg-white dark:bg-neutral-600 border border-blue-400 rounded px-1 outline-none text-slate-700 dark:text-slate-200"
                  />
                ) : (
                  <span className="flex-1 text-[11px] font-medium text-slate-600 dark:text-slate-300 truncate">{ctx.name}</span>
                )}
                <span className="text-[9px] text-slate-400 dark:text-slate-500 mr-1">{members.length}</span>
                <button onClick={() => startEdit(ctx.id, ctx.name)} className="text-slate-300 hover:text-slate-500 dark:hover:text-slate-300 transition-colors flex-shrink-0" title="Rename">
                  <Pencil size={10} />
                </button>
                <button onClick={() => useEditorStore.getState().deleteContext(ctx.id)} className="text-slate-300 hover:text-red-500 dark:hover:text-red-400 transition-colors flex-shrink-0 ml-0.5" title="Delete context">
                  <Trash2 size={10} />
                </button>
              </div>
              {expanded && members.map((s) => (
                <div key={s.id} className="flex items-center gap-1.5 px-2 py-1 border-t border-slate-100 dark:border-neutral-600/50 group">
                  <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: TYPE_DOT_COLORS[s.type] }} />
                  {editingId === s.id ? (
                    <input
                      autoFocus
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(s.id, false); if (e.key === 'Escape') setEditingId(null) }}
                      onBlur={() => commitEdit(s.id, false)}
                      className="flex-1 text-[11px] bg-white dark:bg-neutral-600 border border-blue-400 rounded px-1 outline-none text-slate-700 dark:text-slate-200"
                    />
                  ) : (
                    <span className="flex-1 text-[11px] text-slate-600 dark:text-slate-300 truncate">{s.name}</span>
                  )}
                  <span className="text-[9px] text-slate-300 dark:text-slate-600 group-hover:text-slate-400 flex-shrink-0">{TYPE_LABELS[s.type]}</span>
                  <button onClick={() => startEdit(s.id, s.name)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-slate-500 transition-all flex-shrink-0" title="Rename">
                    <Pencil size={10} />
                  </button>
                  <button onClick={() => deleteSticky(s.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all flex-shrink-0" title="Delete">
                    <Trash2 size={10} />
                  </button>
                </div>
              ))}
            </div>
          )
        })}

        {/* Stickies with no context */}
        {(() => {
          const noCtx = stickies.filter((s) => s.contextName === '—')
          if (noCtx.length === 0) return null
          return (
            <div className="rounded-lg border border-dashed border-slate-200 dark:border-neutral-600 overflow-hidden">
              <div className="px-2 py-1.5 bg-slate-50 dark:bg-neutral-700/30">
                <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">No context</span>
              </div>
              {noCtx.map((s) => (
                <div key={s.id} className="flex items-center gap-1.5 px-2 py-1 border-t border-slate-100 dark:border-neutral-600/50 group">
                  <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: TYPE_DOT_COLORS[s.type] }} />
                  {editingId === s.id ? (
                    <input
                      autoFocus
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(s.id, false); if (e.key === 'Escape') setEditingId(null) }}
                      onBlur={() => commitEdit(s.id, false)}
                      className="flex-1 text-[11px] bg-white dark:bg-neutral-600 border border-blue-400 rounded px-1 outline-none text-slate-700 dark:text-slate-200"
                    />
                  ) : (
                    <span className="flex-1 text-[11px] text-slate-600 dark:text-slate-300 truncate">{s.name}</span>
                  )}
                  <button onClick={() => startEdit(s.id, s.name)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-slate-500 transition-all flex-shrink-0"><Pencil size={10} /></button>
                  <button onClick={() => deleteSticky(s.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all flex-shrink-0"><Trash2 size={10} /></button>
                </div>
              ))}
            </div>
          )
        })()}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface AnthropicMessage {
  role: 'user' | 'assistant'
  content: string
}

export function ESAIChat() {
  const activeProjectId = useEditorStore((s) => s.activeProjectId)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasApiKey, setHasApiKey] = useState(() => Boolean(getApiKey()))
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Reset chat history when switching projects
  useEffect(() => {
    setMessages([])
    setInput('')
    setError(null)
  }, [activeProjectId])

  useEffect(() => {
    const handleFocus = () => setHasApiKey(Boolean(getApiKey()))
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const openSettings = () => {
    document.dispatchEvent(new CustomEvent('contextflow:open-settings', { detail: { tab: 'integrations' } }))
  }

  const sendMessage = async () => {
    const trimmed = input.trim()
    if (!trimmed || isLoading) return
    const apiKey = getApiKey()
    if (!apiKey) { setHasApiKey(false); return }
    setHasApiKey(true)
    setError(null)

    const canvasContext = buildCanvasContext()
    const userContent = `${trimmed}\n\n---\n${canvasContext}`

    const userMessage: ChatMessage = { role: 'user', content: trimmed }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput('')
    setIsLoading(true)

    trackEvent('es_ai_chat_sent', null, { message_length: trimmed.length })

    const apiHistory: AnthropicMessage[] = updatedMessages.map((m, i) => ({
      role: m.role,
      content: i === updatedMessages.length - 1 ? userContent : m.content,
    }))

    try {
      const response = await fetch(ANTHROPIC_API_URL, {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: AI_MODEL,
          max_tokens: 4000,
          system: SYSTEM_PROMPT,
          messages: apiHistory,
        }),
      })

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        const detail = (body as { error?: { message?: string } })?.error?.message ?? response.statusText
        throw new Error(`API error ${response.status}: ${detail}`)
      }

      interface AnthropicResponse { content: Array<{ type: string; text: string }> }
      const data = (await response.json()) as AnthropicResponse
      const assistantText = data.content.find((c) => c.type === 'text')?.text ?? ''

      const payload = parseActions(assistantText)
      let addedCount = 0
      if (payload) {
        addedCount = applyPayload(payload)
        trackEvent('es_ai_stickies_placed', null, { count: addedCount })
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: assistantText, addedCount }])
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setError(msg)
      if (msg.includes('401') || msg.includes('authentication') || msg.includes('API key')) setHasApiKey(false)
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-neutral-800">
      <>
          {!hasApiKey && (
            <div className="mx-3 mt-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 flex-shrink-0">
              <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                An Anthropic API key is required.{' '}
                <button onClick={openSettings} className="underline font-medium hover:text-amber-900 dark:hover:text-amber-200 transition-colors">
                  Add key in Settings
                </button>
              </p>
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-0">
            {messages.length === 0 && hasApiKey && (
              <div className="text-center py-6">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-neutral-700 flex items-center justify-center mx-auto mb-3">
                  <User size={18} className="text-slate-400" />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed px-4">
                  Describe a business process and I'll populate your Event Storming canvas.
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 px-4">
                  e.g. "Model a food delivery app" or "Add a ratings context"
                </p>
              </div>
            )}
            {messages.map((msg, i) => <MessageBubble key={i} message={msg} />)}
            {isLoading && <TypingIndicator />}
            {error && (
              <div className="rounded-lg px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50">
                <p className="text-[11px] text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="flex-shrink-0 px-3 pb-3 pt-2 border-t border-slate-200 dark:border-neutral-700">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={hasApiKey ? 'Describe a domain process…' : 'API key required'}
                disabled={isLoading || !hasApiKey}
                rows={2}
                className="flex-1 resize-none rounded-lg border border-slate-200 dark:border-neutral-600 bg-slate-50 dark:bg-neutral-700 text-xs text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-400 dark:focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed leading-relaxed"
              />
              <button
                onClick={sendMessage}
                disabled={isLoading || !input.trim() || !hasApiKey}
                className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                title="Send (Enter)"
              >
                <Send size={13} className="text-white" />
              </button>
            </div>
            {hasApiKey && (
              <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-1.5 text-center">Press Enter · Shift+Enter for newline</p>
            )}
            {!hasApiKey && (
              <button onClick={openSettings} className="mt-2 w-full flex items-center justify-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                <Settings size={11} />
                Open Settings to add API key
              </button>
            )}
          </div>
      </>
    </div>
  )
}
