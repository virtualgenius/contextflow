import React, { useState } from 'react'
import { Handle, Position, type NodeProps } from 'reactflow'
import { useEditorStore } from '../../model/store'

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
  isAreaSelected?: boolean // true when included in an area selection
  isValidTarget?: boolean // true when another node is dragging and this is a valid drop target
  isConnecting?: boolean // true when any connection drag is in progress
  votes?: number
}

export function ESStickyNode({ id: nodeId, data }: NodeProps) {
  const { stickyType, name, isSelected, isAreaSelected, isValidTarget, isConnecting, votes } = data as ESStickyData
  const colors = ES_COLORS[stickyType]
  const [isHovered, setIsHovered] = useState(false)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)

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
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false)
        setContextMenu(null)
      }}
      onContextMenu={(e) => {
        e.preventDefault()
        e.stopPropagation()
        setContextMenu({ x: e.clientX, y: e.clientY })
      }}
    >
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
            : isSelected || isAreaSelected
              ? '0 0 0 3px #3b82f6, 2px 4px 8px rgba(0,0,0,0.15)'
              : isHovered
                ? '2px 4px 12px rgba(0,0,0,0.25)'
                : '2px 4px 8px rgba(0,0,0,0.15)',
          border: isValidTarget
            ? '2px solid #22c55e'
            : isSelected || isAreaSelected
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

        {/* Vote badge */}
        {(votes ?? 0) > 0 && (
          <div
            style={{
              position: 'absolute',
              top: -6,
              right: -6,
              width: 20,
              height: 20,
              borderRadius: '50%',
              backgroundColor: '#ef4444',
              color: '#fff',
              fontSize: 10,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid #fff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            }}
          >
            {votes}
          </div>
        )}
      </div>

      {/* Right-click context menu */}
      {contextMenu && (
        <div
          className="fixed bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-600 rounded-lg shadow-lg py-1 z-50"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              const st = useEditorStore.getState()
              const updateFns: Record<string, (id: string, u: Record<string, unknown>) => void> = {
                domainEvent: st.updateDomainEvent,
                command: st.updateCommand,
                aggregate: st.updateESAggregate,
                policy: st.updatePolicy,
                hotSpot: st.updateESHotSpot,
              }
              updateFns[stickyType]?.(nodeId, { votes: (votes ?? 0) + 1 })
              setContextMenu(null)
            }}
            className="w-full px-4 py-2 text-left text-xs hover:bg-slate-100 dark:hover:bg-neutral-700"
          >
            +1 Vote ({votes ?? 0})
          </button>
          {stickyType === 'aggregate' && (
            <button
              onClick={() => {
                useEditorStore.getState().deriveContextFromAggregate(nodeId)
                setContextMenu(null)
              }}
              className="w-full px-4 py-2 text-left text-xs hover:bg-slate-100 dark:hover:bg-neutral-700"
            >
              Create Bounded Context
            </button>
          )}
          {stickyType === 'hotSpot' && (
            <button
              onClick={() => {
                useEditorStore.getState().promoteHotSpotToIssue(nodeId)
                setContextMenu(null)
              }}
              className="w-full px-4 py-2 text-left text-xs hover:bg-slate-100 dark:hover:bg-neutral-700"
            >
              Promote to Issue
            </button>
          )}
        </div>
      )}
    </div>
  )
}
