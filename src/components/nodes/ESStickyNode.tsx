import React, { useState } from 'react'
import { Handle, Position, type NodeProps } from 'reactflow'

// Event Storming sticky note colors (standard Brandolini palette)
export const ES_COLORS = {
  domainEvent: { bg: '#ff9800', text: '#000', label: 'Event' },
  command: { bg: '#42a5f5', text: '#000', label: 'Command' },
  aggregate: { bg: '#ffeb3b', text: '#000', label: 'Aggregate' },
  policy: { bg: '#ce93d8', text: '#000', label: 'Policy' },
  hotSpot: { bg: '#ef5350', text: '#fff', label: 'Hot Spot' },
} as const

export type ESStickyType = keyof typeof ES_COLORS

interface ESStickyData {
  stickyType: ESStickyType
  name: string
  isSelected: boolean
  isValidTarget?: boolean // true when another node is dragging and this is a valid drop target
  isConnecting?: boolean // true when any connection drag is in progress
}

export function ESStickyNode({ data }: NodeProps) {
  const { stickyType, name, isSelected, isValidTarget, isConnecting } = data as ESStickyData
  const colors = ES_COLORS[stickyType]
  const [isHovered, setIsHovered] = useState(false)

  const showHandles = isHovered || isSelected
  // During connection drag: valid targets glow, invalid ones dim
  const isDimmed = isConnecting && !isValidTarget && !isSelected

  const handleStyle: React.CSSProperties = {
    width: 14,
    height: 14,
    background: isValidTarget ? '#22c55e' : isSelected ? '#3b82f6' : 'rgba(0,0,0,0.25)',
    border: isValidTarget ? '2px solid #16a34a' : '2px solid rgba(255,255,255,0.9)',
    borderRadius: '50%',
    opacity: showHandles || isValidTarget ? 1 : 0,
    transition: 'opacity 0.15s, background 0.15s',
  }

  return (
    <div onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
      <Handle type="target" position={Position.Left} id="left" style={handleStyle} />
      <Handle type="source" position={Position.Right} id="right" style={handleStyle} />
      <Handle type="target" position={Position.Top} id="top" style={handleStyle} />
      <Handle type="source" position={Position.Bottom} id="bottom" style={handleStyle} />

      <div
        style={{
          width: 140,
          height: 100,
          backgroundColor: colors.bg,
          color: colors.text,
          borderRadius: 4,
          padding: '8px 10px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          cursor: 'pointer',
          boxShadow: isValidTarget
            ? '0 0 0 3px #22c55e, 2px 4px 8px rgba(0,0,0,0.15)'
            : isSelected
              ? '0 0 0 3px #3b82f6, 2px 4px 8px rgba(0,0,0,0.15)'
              : isHovered
                ? '2px 4px 12px rgba(0,0,0,0.25)'
                : '2px 4px 8px rgba(0,0,0,0.15)',
          border: isValidTarget
            ? '2px solid #22c55e'
            : isSelected
              ? '2px solid #3b82f6'
              : '1px solid rgba(0,0,0,0.1)',
          opacity: isDimmed ? 0.35 : 1,
          userSelect: 'none',
          transition: 'box-shadow 0.15s, opacity 0.15s, border 0.15s',
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            lineHeight: 1.3,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {name}
        </div>
        <div
          style={{
            fontSize: 9,
            fontWeight: 500,
            opacity: 0.6,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          {colors.label}
        </div>
      </div>
    </div>
  )
}
