import React from 'react'
import { createPortal } from 'react-dom'
import { NodeProps } from 'reactflow'
import { useEditorStore } from '../../model/store'
import type { Group } from '../../model/types'
import { parseRgbColor } from '../../lib/nodeStyles'

// Group node component - renders as a ReactFlow node for proper pan/zoom
export function GroupNode({ data }: NodeProps) {
  const group = data.group as Group
  const isSelected = data.isSelected as boolean
  const [isHovered, setIsHovered] = React.useState(false)
  const groupOpacity = useEditorStore((s) => s.groupOpacity)
  const showHelpTooltips = useEditorStore((s) => s.showHelpTooltips)
  const blobPath = data.blobPath as string
  const blobBounds = data.blobBounds as { width: number; height: number }
  const nodeRef = React.useRef<HTMLDivElement>(null)

  const isDarkMode = document.documentElement.classList.contains('dark')

  // Calculate tooltip position from node bounds
  const getTooltipPosition = () => {
    if (!nodeRef.current) return { x: 0, y: 0 }
    const rect = nodeRef.current.getBoundingClientRect()
    return {
      x: rect.left + rect.width / 2,
      y: rect.top - 8,
    }
  }

  const memberCount = group.contextIds?.length || 0
  const hasTooltipContent = group.notes || memberCount > 0

  const groupColor = group.color || '#3b82f6'

  const [r, g, b] = parseRgbColor(groupColor)

  const backgroundColor = `rgba(${r}, ${g}, ${b}, ${groupOpacity})`
  const borderColor = `rgb(${r}, ${g}, ${b})`

  return (
    <div
      ref={nodeRef}
      className="nodrag nopan"
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        cursor: 'pointer',
        outline: 'none',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <svg
        width={blobBounds.width}
        height={blobBounds.height}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          overflow: 'visible',
        }}
      >
        <path
          d={blobPath}
          fill={backgroundColor}
          stroke={borderColor}
          strokeWidth={isSelected ? 2 : 1}
          strokeDasharray={isSelected ? 'none' : '5,5'}
          style={{
            filter: isDarkMode ? 'none' : `drop-shadow(0 2px 10px rgba(${r}, ${g}, ${b}, 0.3))`,
            transition: 'all 0.2s',
          }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          top: '8px',
          left: '12px',
          fontSize: '12px',
          fontWeight: 600,
          color: isDarkMode ? '#e2e8f0' : '#1e293b',
          backgroundColor: 'transparent',
          padding: '4px 10px',
          borderRadius: '6px',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          transition: 'all 0.15s',
          transform: isHovered ? 'scale(1.05)' : 'scale(1)',
          pointerEvents: 'none',
        }}
      >
        {group.label}
      </div>

      {/* Tooltip on hover */}
      {showHelpTooltips &&
        isHovered &&
        hasTooltipContent &&
        (() => {
          const tooltipPos = getTooltipPosition()
          return createPortal(
            <div
              className="fixed z-[9999] pointer-events-none"
              style={{
                left: Math.max(8, Math.min(tooltipPos.x - 128, window.innerWidth - 264)),
                top: tooltipPos.y,
                transform: 'translateY(-100%)',
              }}
            >
              <div className="w-64 p-3 bg-slate-800 dark:bg-slate-700 text-white rounded-lg shadow-lg text-left">
                <div className="font-semibold text-sm mb-1">{group.label}</div>
                {group.notes && <div className="text-xs text-slate-300 mb-2">{group.notes}</div>}
                <div className="text-xs text-slate-400">
                  {memberCount} {memberCount === 1 ? 'context' : 'contexts'}
                </div>
              </div>
            </div>,
            document.body
          )
        })()}
    </div>
  )
}
