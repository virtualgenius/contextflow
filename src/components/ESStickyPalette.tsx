import React from 'react'
import { ES_COLORS, type ESStickyType } from './nodes/ESStickyNode'

const PALETTE_ITEMS: { type: ESStickyType | 'pivotalEvent'; label: string; defaultName: string }[] =
  [
    { type: 'domainEvent', label: 'Domain Event', defaultName: 'New Event' },
    { type: 'command', label: 'Command', defaultName: 'New Command' },
    { type: 'aggregate', label: 'Aggregate', defaultName: 'New Aggregate' },
    { type: 'policy', label: 'Policy', defaultName: 'New Policy' },
    { type: 'hotSpot', label: 'Hot Spot', defaultName: 'New Hot Spot' },
  ]

export function ESStickyPalette() {
  const handleDragStart = (e: React.DragEvent, type: string, defaultName: string) => {
    e.dataTransfer.setData(
      'application/contextflow-es-sticky',
      JSON.stringify({ stickyType: type, defaultName })
    )
    e.dataTransfer.effectAllowed = 'copy'
  }

  return (
    <div className="p-3 space-y-2">
      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
        Drag to canvas
      </div>
      {PALETTE_ITEMS.map((item) => {
        const colors = ES_COLORS[item.type as ESStickyType]
        return (
          <div
            key={item.type}
            draggable
            onDragStart={(e) => handleDragStart(e, item.type, item.defaultName)}
            className="flex items-center gap-2.5 px-2 py-2 rounded-md cursor-grab active:cursor-grabbing hover:bg-slate-100 dark:hover:bg-neutral-700 transition-colors select-none"
          >
            <div
              className="w-8 h-6 rounded-sm shadow-sm flex-shrink-0"
              style={{
                backgroundColor: colors.bg,
                border: '1px solid rgba(0,0,0,0.1)',
              }}
            />
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
              {item.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
