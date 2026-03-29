import React, { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Settings } from 'lucide-react'
import { useEditorStore } from '../model/store'
import { ES_COLORS } from './nodes/ESStickyNode'
import { trackEvent } from '../utils/analytics'
import { getConnectionLabel } from '../lib/esConnectionRules'
import { reconcileStickiesInBounds } from './overlays/esContextUtils'

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const API_KEY_STORAGE_KEY = 'contextflow.anthropicApiKey'
const AI_MODEL = 'claude-sonnet-4-6'

const SYSTEM_PROMPT = `You are an Event Storming facilitator. Your response MUST always start with a fenced code block tagged "actions" containing valid JSON, followed by exactly one sentence of explanation. Never skip the JSON block.

OUTPUT FORMAT (mandatory, every response):
\`\`\`actions
{ ...json... }
\`\`\`
One sentence summary.

JSON SCHEMA:
{
  "stickies": [ { "id": string, "type": "command"|"aggregate"|"domainEvent"|"policy"|"hotSpot", "name": string, "col": number, "row": number, "context": string } ],
  "connections": [ { "from": string, "to": string } ],
  "contexts": [ { "name": string, "label": string, "ctxCol": number, "ctxRow": number } ]
}

LAYOUT RULES:
- col and row are RELATIVE per context, starting at 0.
- Standard flow per row: command(col 0) → aggregate(col 1) → domainEvent(col 2). Extend with policy/command.
- NEVER share an aggregate between commands. Each command gets its OWN aggregate (same name allowed, different id and row).
- Every sticky MUST have "context" matching a contexts label.
- ctxCol/ctxRow positions contexts on a 2D grid: same ctxRow = side by side, increment ctxCol for next context in sequence.
- Use 3-5 contexts, 1-3 flow rows each.
- Valid connections: command→aggregate, aggregate→domainEvent, domainEvent→policy, domainEvent→command, policy→command.

EXAMPLE:
\`\`\`actions
{
  "stickies": [
    {"id":"c1","type":"command","name":"PlaceOrder","col":0,"row":0,"context":"ordering"},
    {"id":"a1","type":"aggregate","name":"Order","col":1,"row":0,"context":"ordering"},
    {"id":"e1","type":"domainEvent","name":"OrderPlaced","col":2,"row":0,"context":"ordering"},
    {"id":"c2","type":"command","name":"CancelOrder","col":0,"row":1,"context":"ordering"},
    {"id":"a2","type":"aggregate","name":"Order","col":1,"row":1,"context":"ordering"},
    {"id":"e2","type":"domainEvent","name":"OrderCancelled","col":2,"row":1,"context":"ordering"},
    {"id":"p1","type":"policy","name":"NotifyKitchen","col":0,"row":0,"context":"kitchen"},
    {"id":"c3","type":"command","name":"PrepareOrder","col":1,"row":0,"context":"kitchen"},
    {"id":"a3","type":"aggregate","name":"Preparation","col":2,"row":0,"context":"kitchen"},
    {"id":"e3","type":"domainEvent","name":"OrderReady","col":3,"row":0,"context":"kitchen"}
  ],
  "connections": [
    {"from":"c1","to":"a1"},{"from":"a1","to":"e1"},
    {"from":"c2","to":"a2"},{"from":"a2","to":"e2"},
    {"from":"e1","to":"p1"},{"from":"p1","to":"c3"},{"from":"c3","to":"a3"},{"from":"a3","to":"e3"}
  ],
  "contexts": [
    {"name":"Ordering","label":"ordering","ctxCol":0,"ctxRow":0},
    {"name":"Kitchen","label":"kitchen","ctxCol":1,"ctxRow":0}
  ]
}
\`\`\`
Two contexts model the order placement and kitchen preparation flows.`

// Sticky note size in flow-px (matches ESStickyNode style: width 140, height 100)
const ES_W = 16000
const ES_H = 9000
const STICKY_W_PX = 140
const STICKY_H_PX = 100
const STICKY_GAP_X = 70   // gap between stickies within a context
const STICKY_GAP_Y = 100  // gap between rows
const CTX_GAP_X = 400     // gap between bounded contexts
const CANVAS_START_X = 300
const CANVAS_START_Y = 500

function pxToPercent(px: number, py: number): { x: number; y: number } {
  return { x: (px / ES_W) * 100, y: (py / ES_H) * 100 }
}

interface StickyAction {
  id: string
  type: 'domainEvent' | 'command' | 'aggregate' | 'policy' | 'hotSpot'
  name: string
  col: number
  row: number
  context?: string  // context label this sticky belongs to
}

interface ConnectionAction {
  from: string
  to: string
}

interface ContextAction {
  name: string       // context name
  label: string      // same label used in stickies' context field
  ctxCol?: number    // column position of this context block on canvas (0-based)
  ctxRow?: number    // row position of this context block on canvas (0-based)
}

interface ActionsPayload {
  stickies: StickyAction[]
  connections: ConnectionAction[]
  contexts?: ContextAction[]
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  payload?: ActionsPayload
}

function parseActions(text: string): ActionsPayload | null {
  // Match ALL actions blocks, use the last one (the actual response, not any example)
  const matches = [...text.matchAll(/```actions\n([\s\S]*?)\n```/g)]
  if (matches.length === 0) return null
  const lastMatch = matches[matches.length - 1]
  try {
    const parsed = JSON.parse(lastMatch[1])
    if (Array.isArray(parsed)) {
      return { stickies: parsed as StickyAction[], connections: [] }
    }
    return parsed as ActionsPayload
  } catch {
    return null
  }
}

function stripActionsBlock(text: string): string {
  return text.replace(/```actions\n[\s\S]*?\n```/g, '').trim()
}

function getApiKey(): string {
  return localStorage.getItem(API_KEY_STORAGE_KEY) ?? ''
}

function buildCanvasContext(): string {
  const state = useEditorStore.getState()
  const projectId = state.activeProjectId
  const project = projectId ? state.projects[projectId] : undefined
  const es = project?.eventStorming
  if (!es || !es.enabled) return 'Canvas is empty.'

  const parts: string[] = []
  if (es.domainEvents.length > 0) {
    parts.push(`Domain Events: ${es.domainEvents.map((e) => e.name).join(', ')}`)
  }
  if (es.commands.length > 0) {
    parts.push(`Commands: ${es.commands.map((c) => c.name).join(', ')}`)
  }
  if (es.aggregates.length > 0) {
    parts.push(`Aggregates: ${es.aggregates.map((a) => a.name).join(', ')}`)
  }
  if (es.policies.length > 0) {
    parts.push(`Policies: ${es.policies.map((p) => p.name).join(', ')}`)
  }
  if (es.hotSpots.length > 0) {
    parts.push(`Hot Spots: ${es.hotSpots.map((h) => h.title).join(', ')}`)
  }
  if (parts.length === 0) return 'Canvas is empty. Start col at 0.'
  const total = getExistingStickyCount()
  return `Current canvas (${total} stickies total, start new cols at ${total}): ${parts.join(' | ')}`
}

function getExistingStickyCount(): number {
  const state = useEditorStore.getState()
  const projectId = state.activeProjectId
  const es = projectId ? state.projects[projectId]?.eventStorming : undefined
  if (!es) return 0
  return (
    (es.domainEvents?.length ?? 0) +
    (es.commands?.length ?? 0) +
    (es.aggregates?.length ?? 0) +
    (es.policies?.length ?? 0) +
    (es.hotSpots?.length ?? 0)
  )
}

function applyPayload(payload: ActionsPayload): void {
  // --- 1. Compute pixel positions for every sticky ---
  const contextOrder = payload.contexts?.map((c) => c.label) ?? []

  // Fallback: assign ungrouped stickies to the first context (if any)
  const firstContext = contextOrder[0] ?? null
  const groups: { label: string | null; ctx: ContextAction | null; stickies: StickyAction[] }[] = []

  for (const ctxDef of payload.contexts ?? []) {
    const members = payload.stickies.filter((s) => {
      const label = s.context ?? firstContext
      return label === ctxDef.label
    })
    if (members.length > 0) groups.push({ label: ctxDef.label, ctx: ctxDef, stickies: members })
  }

  // Ungrouped stickies (no context or unknown context) — attach to first group
  const ungrouped = payload.stickies.filter((s) => !s.context || !contextOrder.includes(s.context))
  if (ungrouped.length > 0) {
    if (groups.length > 0) {
      groups[0].stickies.push(...ungrouped)
    } else {
      groups.push({ label: null, ctx: null, stickies: ungrouped })
    }
  }

  // --- Compute per-context block width (in px) so we can do 2D grid layout ---
  // Each context block: width = (maxLocalCol+1) * (STICKY_W_PX + STICKY_GAP_X)
  //                     height = (maxRow+1) * (STICKY_H_PX + STICKY_GAP_Y)
  const CTX_GAP_Y = 300 // vertical gap between context rows

  // Find the maximum ctxCol to compute column widths
  // Build a map: ctxCol → max block width in that column
  const colWidths: Record<number, number> = {}
  const rowHeights: Record<number, number> = {}

  for (const group of groups) {
    const ctxCol = group.ctx?.ctxCol ?? 0
    const ctxRow = group.ctx?.ctxRow ?? 0
    const minCol = Math.min(...group.stickies.map((s) => s.col))
    const maxLocalCol = Math.max(...group.stickies.map((s) => s.col)) - minCol
    const maxRow = Math.max(...group.stickies.map((s) => s.row))
    const blockW = (maxLocalCol + 1) * (STICKY_W_PX + STICKY_GAP_X) + CTX_GAP_X
    const blockH = (maxRow + 1) * (STICKY_H_PX + STICKY_GAP_Y) + CTX_GAP_Y
    colWidths[ctxCol] = Math.max(colWidths[ctxCol] ?? 0, blockW)
    rowHeights[ctxRow] = Math.max(rowHeights[ctxRow] ?? 0, blockH)
  }

  // Cumulative X offsets per ctxCol
  const colOffsets: Record<number, number> = {}
  const existingCount = getExistingStickyCount()
  const startX = CANVAS_START_X + existingCount * (STICKY_W_PX + STICKY_GAP_X)
  let accX = startX
  const maxCtxCol = Math.max(0, ...Object.keys(colWidths).map(Number))
  for (let c = 0; c <= maxCtxCol; c++) {
    colOffsets[c] = accX
    accX += colWidths[c] ?? (STICKY_W_PX + STICKY_GAP_X + CTX_GAP_X)
  }

  // Cumulative Y offsets per ctxRow
  const rowOffsets: Record<number, number> = {}
  let accY = CANVAS_START_Y
  const maxCtxRow = Math.max(0, ...Object.keys(rowHeights).map(Number))
  for (let r = 0; r <= maxCtxRow; r++) {
    rowOffsets[r] = accY
    accY += rowHeights[r] ?? (STICKY_H_PX + STICKY_GAP_Y + CTX_GAP_Y)
  }

  // Map sticky id → final pixel position
  const stickyPx: Record<string, { px: number; py: number }> = {}

  for (const group of groups) {
    const ctxCol = group.ctx?.ctxCol ?? 0
    const ctxRow = group.ctx?.ctxRow ?? 0
    const originX = colOffsets[ctxCol] ?? startX
    const originY = rowOffsets[ctxRow] ?? CANVAS_START_Y
    const minCol = Math.min(...group.stickies.map((s) => s.col))
    for (const s of group.stickies) {
      const localCol = s.col - minCol
      const px = originX + localCol * (STICKY_W_PX + STICKY_GAP_X)
      const py = originY + s.row * (STICKY_H_PX + STICKY_GAP_Y)
      stickyPx[s.id] = { px, py }
    }
  }

  // --- 2. Place stickies on canvas ---
  const idMap: Record<string, string> = {}

  for (const action of payload.stickies) {
    const { px, py } = stickyPx[action.id] ?? { px: CANVAS_START_X, py: CANVAS_START_Y }
    const pos = pxToPercent(px, py)

    if (action.type === 'domainEvent') {
      useEditorStore.getState().addDomainEvent(action.name, pos)
      idMap[action.id] = useEditorStore.getState().selectedDomainEventId ?? ''
    } else if (action.type === 'command') {
      useEditorStore.getState().addCommand(action.name, pos)
      idMap[action.id] = useEditorStore.getState().selectedCommandId ?? ''
    } else if (action.type === 'aggregate') {
      useEditorStore.getState().addESAggregate(action.name, pos)
      idMap[action.id] = useEditorStore.getState().selectedESAggregateId ?? ''
    } else if (action.type === 'policy') {
      useEditorStore.getState().addPolicy(action.name, pos)
      idMap[action.id] = useEditorStore.getState().selectedPolicyId ?? ''
    } else if (action.type === 'hotSpot') {
      useEditorStore.getState().addESHotSpot(action.name, pos)
      idMap[action.id] = useEditorStore.getState().selectedESHotSpotId ?? ''
    }
  }

  // --- 3. Create connections ---
  for (const conn of payload.connections ?? []) {
    const sourceId = idMap[conn.from]
    const targetId = idMap[conn.to]
    if (sourceId && targetId) {
      const connId = useEditorStore.getState().createESConnection(sourceId, targetId)
      if (connId) {
        const srcSticky = payload.stickies.find((s) => s.id === conn.from)
        const tgtSticky = payload.stickies.find((s) => s.id === conn.to)
        if (srcSticky && tgtSticky) {
          const label = getConnectionLabel(srcSticky.type, tgtSticky.type)
          if (label) useEditorStore.getState().updateESConnection(connId, { label })
        }
      }
    }
  }

  // --- 4. Create bounded contexts wrapping their stickies ---
  const CTX_PADDING_PX = 60 // pixel padding around context group
  for (const ctx of payload.contexts ?? []) {
    const members = groups.find((g) => g.label === ctx.label)?.stickies ?? []
    if (members.length === 0) continue

    const pxs = members.map((s) => stickyPx[s.id]?.px ?? 0)
    const pys = members.map((s) => stickyPx[s.id]?.py ?? 0)
    const bMinX = Math.min(...pxs) - CTX_PADDING_PX
    const bMinY = Math.min(...pys) - CTX_PADDING_PX
    const bMaxX = Math.max(...pxs) + STICKY_W_PX + CTX_PADDING_PX
    const bMaxY = Math.max(...pys) + STICKY_H_PX + CTX_PADDING_PX

    const esBounds = {
      minX: Math.max(0, (bMinX / ES_W) * 100),
      minY: Math.max(0, (bMinY / ES_H) * 100),
      maxX: Math.min(100, (bMaxX / ES_W) * 100),
      maxY: Math.min(100, (bMaxY / ES_H) * 100),
    }

    useEditorStore.getState().addContext(ctx.name)
    const newCtxId = useEditorStore.getState().selectedContextId
    if (newCtxId) {
      useEditorStore.getState().updateContext(newCtxId, { esBounds })
      reconcileStickiesInBounds(newCtxId, {
        minX: bMinX, minY: bMinY, maxX: bMaxX, maxY: bMaxY,
      })
    }
  }
}

const TYPE_DOT_COLORS: Record<StickyAction['type'], string> = {
  domainEvent: ES_COLORS.domainEvent.bg,
  command: ES_COLORS.command.bg,
  aggregate: ES_COLORS.aggregate.bg,
  policy: ES_COLORS.policy.bg,
  hotSpot: ES_COLORS.hotSpot.bg,
}

const TYPE_LABELS: Record<StickyAction['type'], string> = {
  domainEvent: 'Event',
  command: 'Command',
  aggregate: 'Aggregate',
  policy: 'Policy',
  hotSpot: 'Hot Spot',
}

function ActionBadge({ action }: { action: StickyAction }) {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 dark:bg-black/20">
      <span
        className="w-2 h-2 rounded-sm flex-shrink-0"
        style={{ backgroundColor: TYPE_DOT_COLORS[action.type] }}
      />
      <span className="text-slate-200 dark:text-slate-300 truncate max-w-[80px]">{action.name}</span>
    </span>
  )
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'
  const displayContent = isUser ? message.content : stripActionsBlock(message.content)
  const actions = message.payload?.stickies ?? []

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
          {displayContent || (actions.length > 0 ? 'Stickies placed on canvas.' : '')}
        </div>
        {actions.length > 0 && (
          <div className="mt-1.5 px-1 flex flex-wrap gap-1">
            {actions.map((action, i) => (
              <ActionBadge key={i} action={action} />
            ))}
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

interface AnthropicMessage {
  role: 'user' | 'assistant'
  content: string
}

export function ESAIChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasApiKey, setHasApiKey] = useState(() => Boolean(getApiKey()))
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Re-check key on focus (in case user set it in settings)
  useEffect(() => {
    const handleFocus = () => setHasApiKey(Boolean(getApiKey()))
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const openSettings = () => {
    // Navigate to settings by dispatching a custom event the app can handle,
    // or simply let the user know where to go via a tooltip.
    // Since there is no global settings-open action in the store, we fire an
    // event that TopBar listens to (or we can programmatically click it).
    document.dispatchEvent(new CustomEvent('contextflow:open-settings', { detail: { tab: 'integrations' } }))
  }

  const sendMessage = async () => {
    const trimmed = input.trim()
    if (!trimmed || isLoading) return

    const apiKey = getApiKey()
    if (!apiKey) {
      setHasApiKey(false)
      return
    }
    setHasApiKey(true)
    setError(null)

    const canvasContext = buildCanvasContext()
    const userContent = `${trimmed}\n\n[${canvasContext}]`

    const userMessage: ChatMessage = { role: 'user', content: trimmed }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput('')
    setIsLoading(true)

    trackEvent('es_ai_chat_sent', null, { message_length: trimmed.length })

    // Build history for Anthropic (exclude the canvas context suffix from history)
    const apiHistory: AnthropicMessage[] = updatedMessages.map((m, i) => ({
      role: m.role,
      // For the last user message, include the canvas context
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
          max_tokens: 3000,
          system: SYSTEM_PROMPT,
          messages: apiHistory,
        }),
      })

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        const detail = (body as { error?: { message?: string } })?.error?.message ?? response.statusText
        throw new Error(`API error ${response.status}: ${detail}`)
      }

      interface AnthropicResponse {
        content: Array<{ type: string; text: string }>
      }
      const data = (await response.json()) as AnthropicResponse
      const assistantText = data.content.find((c) => c.type === 'text')?.text ?? ''

      const payload = parseActions(assistantText)
      if (payload && payload.stickies.length > 0) {
        applyPayload(payload)
        trackEvent('es_ai_stickies_placed', null, { count: payload.stickies.length })
      }

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: assistantText,
        payload: payload ?? undefined,
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setError(msg)
      // Check if it's an auth error to prompt re-entry of key
      if (msg.includes('401') || msg.includes('authentication') || msg.includes('API key')) {
        setHasApiKey(false)
      }
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-neutral-800">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-slate-200 dark:border-neutral-700 flex-shrink-0">
        <Bot size={14} className="text-blue-500 flex-shrink-0" />
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">ES Assistant</span>
        <span className="text-[10px] text-slate-400 dark:text-slate-500 ml-auto">AI-powered</span>
      </div>

      {/* No API key prompt */}
      {!hasApiKey && (
        <div className="mx-3 mt-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 flex-shrink-0">
          <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
            An Anthropic API key is required to use the ES Assistant.{' '}
            <button
              onClick={openSettings}
              className="underline font-medium hover:text-amber-900 dark:hover:text-amber-200 transition-colors"
            >
              Add key in Settings
            </button>
          </p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-0">
        {messages.length === 0 && hasApiKey && (
          <div className="text-center py-6">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-neutral-700 flex items-center justify-center mx-auto mb-3">
              <User size={18} className="text-slate-400" />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed px-4">
              Describe a business process and I'll suggest stickies for your Event Storming canvas.
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 px-4">
              e.g. "Model an e-commerce order placement flow"
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}

        {isLoading && <TypingIndicator />}

        {error && (
          <div className="rounded-lg px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50">
            <p className="text-[11px] text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
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
          <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-1.5 text-center">
            Press Enter to send · Shift+Enter for newline
          </p>
        )}
        {!hasApiKey && (
          <button
            onClick={openSettings}
            className="mt-2 w-full flex items-center justify-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <Settings size={11} />
            Open Settings to add API key
          </button>
        )}
      </div>
    </div>
  )
}
