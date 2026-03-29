import React from 'react'
import { MousePointer2, Square, Hand, SeparatorVertical, SeparatorHorizontal } from 'lucide-react'
import { useEditorStore } from '../model/store'
import { ES_COLORS } from './nodes/ESStickyNode'
import type { ESToolMode } from '../model/storeTypes'

interface ToolItem {
  mode: ESToolMode
  label: string
  hint: string
  icon?: React.ReactNode
  color?: string
  shortcut?: string
}

const TOOLS: ToolItem[] = [
  { mode: 'select', label: 'Select', icon: <MousePointer2 size={16} />, shortcut: 'V', hint: 'Click to select, drag to move.' },
  { mode: 'pan', label: 'Pan', icon: <Hand size={16} />, shortcut: 'H', hint: 'Drag to pan the canvas.' },
  { mode: 'areaSelect', label: 'Area Select', icon: <Square size={16} />, shortcut: 'A', hint: 'Drag a rectangle to select multiple stickies.' },
]

const DIVIDER_TOOLS: ToolItem[] = [
  { mode: 'pivotalEvent', label: 'Phase Divider', icon: <SeparatorVertical size={16} />, shortcut: '6', hint: 'Click to place a vertical phase divider. Drag to reposition.' },
  { mode: 'swimLane', label: 'Swim Lane', icon: <SeparatorHorizontal size={16} />, shortcut: '7', hint: 'Click to place a horizontal swim lane divider.' },
]

const STICKY_TOOLS: ToolItem[] = [
  { mode: 'domainEvent', label: 'Domain Event', color: ES_COLORS.domainEvent.bg, shortcut: '1', hint: 'Something that happened in the domain. Past tense.' },
  { mode: 'command', label: 'Command', color: ES_COLORS.command.bg, shortcut: '2', hint: 'An action that triggers a domain event. Imperative.' },
  { mode: 'aggregate', label: 'Aggregate', color: ES_COLORS.aggregate.bg, shortcut: '3', hint: 'A cluster of related domain objects with a root.' },
  { mode: 'policy', label: 'Policy', color: ES_COLORS.policy.bg, shortcut: '4', hint: 'A rule that reacts to an event and triggers a command.' },
  { mode: 'hotSpot', label: 'Hot Spot', color: ES_COLORS.hotSpot.bg, shortcut: '5', hint: 'A problem, question, or point of contention.' },
]

const ALL_TOOLS = [...TOOLS, ...STICKY_TOOLS, ...DIVIDER_TOOLS]
const DEFAULT_HINT = 'Select a tool or sticky type to get started.'

const DEFAULT_NAMES: Record<string, string> = {
  domainEvent: 'New Event',
  command: 'New Command',
  aggregate: 'New Aggregate',
  policy: 'New Policy',
  hotSpot: 'New Hot Spot',
}

export { DEFAULT_NAMES as ES_DEFAULT_NAMES }

export function ESStickyPalette() {
  const esToolMode = useEditorStore((s) => s.esToolMode)
  const setESToolMode = useEditorStore((s) => s.setESToolMode)

  const handleDragStart = (e: React.DragEvent, type: string) => {
    e.dataTransfer.setData(
      'application/contextflow-es-sticky',
      JSON.stringify({ stickyType: type, defaultName: DEFAULT_NAMES[type] || 'New Sticky' })
    )
    e.dataTransfer.effectAllowed = 'copy'
  }

  return (
    <div className="p-3 space-y-4">
      {/* Tools section */}
      <div>
        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Tools
        </div>
        <div className="space-y-1">
          {TOOLS.map((tool) => (
            <button
              key={tool.mode}
              onClick={() => setESToolMode(tool.mode)}
              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
                esToolMode === tool.mode
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-neutral-700'
              }`}
            >
              <span className="w-5 flex justify-center">{tool.icon}</span>
              <span className="flex-1 text-left">{tool.label}</span>
              <span className="text-[9px] text-slate-400 font-mono">{tool.shortcut}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Sticky types section */}
      <div>
        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Stickies
        </div>
        <div className="space-y-1">
          {STICKY_TOOLS.map((tool) => (
            <button
              key={tool.mode}
              onClick={() => setESToolMode(tool.mode)}
              draggable
              onDragStart={(e) => handleDragStart(e, tool.mode)}
              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-xs font-medium transition-colors cursor-grab active:cursor-grabbing ${
                esToolMode === tool.mode
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 ring-1 ring-blue-300 dark:ring-blue-700'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-neutral-700'
              }`}
            >
              <div
                className="w-5 h-4 rounded-sm flex-shrink-0"
                style={{
                  backgroundColor: tool.color,
                  border: '1px solid rgba(0,0,0,0.1)',
                }}
              />
              <span className="flex-1 text-left">{tool.label}</span>
              <span className="text-[9px] text-slate-400 font-mono">{tool.shortcut}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Dividers section */}
      <div>
        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Dividers
        </div>
        <div className="space-y-1">
          {DIVIDER_TOOLS.map((tool) => (
            <button
              key={tool.mode}
              onClick={() => setESToolMode(tool.mode)}
              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
                esToolMode === tool.mode
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-neutral-700'
              }`}
            >
              <span className="w-5 flex justify-center">{tool.icon}</span>
              <span className="flex-1 text-left">{tool.label}</span>
              <span className="text-[9px] text-slate-400 font-mono">{tool.shortcut}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Hint */}
      <div className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed">
        {ALL_TOOLS.find((t) => t.mode === esToolMode)?.hint ?? DEFAULT_HINT}
      </div>
    </div>
  )
}
