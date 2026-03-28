import React from 'react'
import { useViewport } from 'reactflow'
import type { PivotalEvent } from '../../model/types'
import { useEditorStore } from '../../model/store'

export function PivotalEventLines({ pivotalEvents }: { pivotalEvents: PivotalEvent[] }) {
  const { x, y, zoom } = useViewport()
  const selectedPivotalEventId = useEditorStore((s) => s.selectedPivotalEventId)
  const setSelectedPivotalEvent = useEditorStore((s) => s.setSelectedPivotalEvent)

  if (pivotalEvents.length === 0) return null

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', zIndex: 5 }}>
      {pivotalEvents.map((pe) => {
        const xPos = (pe.position / 100) * 2000
        const transformedX = xPos * zoom + x
        const transformedY = y
        const height = 1000 * zoom
        const isSelected = pe.id === selectedPivotalEventId

        return (
          <div
            key={pe.id}
            style={{
              position: 'absolute',
              left: transformedX,
              top: transformedY,
              height,
              pointerEvents: 'auto',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
            onClick={(e) => {
              e.stopPropagation()
              setSelectedPivotalEvent(isSelected ? null : pe.id)
            }}
          >
            {/* Vertical line */}
            <div
              style={{
                width: isSelected ? 3 : 2,
                height: '100%',
                background: isSelected
                  ? '#3b82f6'
                  : 'repeating-linear-gradient(to bottom, #f97316 0, #f97316 8px, transparent 8px, transparent 16px)',
              }}
            />
            {/* Label */}
            <div
              style={{
                position: 'absolute',
                top: 4,
                left: 8,
                fontSize: 11,
                fontWeight: 600,
                color: isSelected ? '#3b82f6' : '#f97316',
                backgroundColor: 'rgba(255,255,255,0.9)',
                padding: '2px 6px',
                borderRadius: 3,
                whiteSpace: 'nowrap',
                border: isSelected ? '1px solid #3b82f6' : '1px solid #f97316',
              }}
            >
              {pe.name}
            </div>
          </div>
        )
      })}
    </div>
  )
}
