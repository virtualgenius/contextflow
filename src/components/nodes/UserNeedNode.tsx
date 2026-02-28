import React from 'react'
import { createPortal } from 'react-dom'
import { NodeProps, Position, Handle } from 'reactflow'
import { useEditorStore } from '../../model/store'
import type { UserNeed } from '../../model/types'

// UserNeed node component - displayed in middle layer of Strategic View
export function UserNeedNode({ data }: NodeProps) {
  const userNeed = data.userNeed as UserNeed
  const isSelected = data.isSelected as boolean
  const isHighlightedByConnection = data.isHighlightedByConnection as boolean
  const [isHovered, setIsHovered] = React.useState(false)
  const showHelpTooltips = useEditorStore((s) => s.showHelpTooltips)
  const nodeRef = React.useRef<HTMLDivElement>(null)

  const isHighlighted = isSelected || isHighlightedByConnection

  // Calculate tooltip position from node bounds
  const getTooltipPosition = () => {
    if (!nodeRef.current) return { x: 0, y: 0 }
    const rect = nodeRef.current.getBoundingClientRect()
    return {
      x: rect.left + rect.width / 2,
      y: rect.top - 8,
    }
  }

  const hasTooltipContent = !!userNeed.description
  const tooltipPos = getTooltipPosition()

  return (
    <>
      {/* Handles for edge connections */}
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />

      <div
        ref={nodeRef}
        style={{
          width: 100,
          height: 50,
          backgroundColor: isHighlighted || isHovered ? '#f0fdf4' : '#f8fafc',
          border: isHighlighted ? '2px solid #3b82f6' : '2px solid #cbd5e1',
          borderRadius: '8px',
          padding: '8px',
          boxShadow: isHighlighted
            ? '0 0 0 3px rgba(59, 130, 246, 0.3), 0 4px 12px -2px rgba(59, 130, 246, 0.25)'
            : isHovered
              ? '0 4px 12px -2px rgba(0, 0, 0, 0.15)'
              : '0 2px 6px 0 rgba(0, 0, 0, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* UserNeed name */}
        <div
          style={{
            fontSize: '11px',
            fontWeight: 600,
            color: '#0f172a',
            lineHeight: '1.3',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {userNeed.name}
        </div>
      </div>

      {/* Tooltip on hover */}
      {showHelpTooltips &&
        isHovered &&
        hasTooltipContent &&
        createPortal(
          <div
            className="fixed z-[9999] pointer-events-none"
            style={{
              left: Math.max(8, Math.min(tooltipPos.x - 128, window.innerWidth - 264)),
              top: tooltipPos.y,
              transform: 'translateY(-100%)',
            }}
          >
            <div className="w-64 p-3 bg-slate-800 dark:bg-slate-700 text-white rounded-lg shadow-lg text-left">
              <div className="font-semibold text-sm mb-1">{userNeed.name}</div>
              <div className="text-xs text-slate-300">{userNeed.description}</div>
            </div>
          </div>,
          document.body
        )}
    </>
  )
}
