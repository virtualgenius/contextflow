import React from 'react'
import { createPortal } from 'react-dom'
import {
  NodeProps,
  Position,
  Handle,
  useViewport,
} from 'reactflow'
import { useEditorStore } from '../../model/store'
import type { User as UserType } from '../../model/types'
import { User as UserIcon } from 'lucide-react'

// User node component - displayed at the top of Strategic View
export function UserNode({ data }: NodeProps) {
  const user = data.user as UserType
  const isSelected = data.isSelected as boolean
  const isHighlightedByConnection = data.isHighlightedByConnection as boolean
  const [isHovered, setIsHovered] = React.useState(false)
  const showHelpTooltips = useEditorStore(s => s.showHelpTooltips)
  const { x: vpX, y: vpY, zoom } = useViewport()
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

  // Build tooltip content
  const hasTooltipContent = user.description || user.isExternal
  const tooltipPos = getTooltipPosition()

  return (
    <>
      {/* Handle for edge connections */}
      <Handle type="source" position={Position.Bottom} />

      <div
        ref={nodeRef}
        style={{
          width: 100,
          height: 50,
          backgroundColor: isHighlighted || isHovered ? '#eff6ff' : '#f8fafc',
          borderWidth: '2px',
          borderStyle: user.isExternal ? 'dashed' : 'solid',
          borderColor: isHighlighted ? '#3b82f6' : '#cbd5e1',
          borderRadius: '8px',
          padding: '8px',
          boxShadow: isHighlighted
            ? '0 0 0 3px #3b82f6, 0 4px 12px -2px rgba(59, 130, 246, 0.25)'
            : isHovered
            ? user.isExternal
              ? '0 0 0 2px white, 0 0 0 3px #cbd5e1, 0 4px 8px -1px rgba(0, 0, 0, 0.12)'
              : '0 4px 12px -2px rgba(0, 0, 0, 0.15)'
            : user.isExternal
            ? '0 0 0 2px white, 0 0 0 3px #cbd5e1, 0 2px 6px 0 rgba(0, 0, 0, 0.06)'
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
        {/* User icon and name */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '4px',
          }}
        >
          <UserIcon size={12} color="#3b82f6" strokeWidth={2.5} style={{ flexShrink: 0, marginTop: '1px' }} />
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
            {user.name}
          </div>
        </div>
      </div>

      {/* Tooltip on hover */}
      {showHelpTooltips && isHovered && hasTooltipContent && createPortal(
        <div
          className="fixed z-[9999] pointer-events-none"
          style={{
            left: Math.max(8, Math.min(tooltipPos.x - 128, window.innerWidth - 264)),
            top: tooltipPos.y,
            transform: 'translateY(-100%)',
          }}
        >
          <div className="w-64 p-3 bg-slate-800 dark:bg-slate-700 text-white rounded-lg shadow-lg text-left">
            <div className="font-semibold text-sm mb-1 flex items-center gap-2">
              {user.name}
              {user.isExternal && (
                <span className="text-[10px] bg-slate-600 px-1.5 py-0.5 rounded uppercase">External</span>
              )}
            </div>
            {user.description && (
              <div className="text-xs text-slate-300">{user.description}</div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
