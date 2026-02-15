import React from 'react'
import { createPortal } from 'react-dom'
import {
  NodeProps,
  Position,
  Handle,
} from 'reactflow'
import { useEditorStore } from '../../model/store'
import type { BoundedContext } from '../../model/types'
import { AlertTriangle, AlertOctagon, Info } from 'lucide-react'
import { getContextTooltipLines } from '../../lib/contextTooltip'
import { getContextNodeBorderStyle } from '../../lib/nodeStyles'
import { NODE_SIZES } from '../../lib/canvasConstants'
import { SimpleTooltip } from '../SimpleTooltip'

// Custom node component
export function ContextNode({ data }: NodeProps) {
  const context = data.context as BoundedContext
  const isSelected = data.isSelected as boolean
  const isMemberOfSelectedGroup = data.isMemberOfSelectedGroup as boolean
  const opacity = data.opacity as number | undefined
  const [isHovered, setIsHovered] = React.useState(false)
  const [showTooltip, setShowTooltip] = React.useState(false)
  const tooltipTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const [isDragOver, setIsDragOver] = React.useState(false)
  const [contextMenu, setContextMenu] = React.useState<{ x: number; y: number } | null>(null)
  const assignRepoToContext = useEditorStore(s => s.assignRepoToContext)
  const projectId = useEditorStore(s => s.activeProjectId)
  const project = useEditorStore(s => (projectId ? s.projects[projectId] : undefined))
  const viewMode = useEditorStore(s => s.activeViewMode)
  const activeKeyframeId = useEditorStore(s => s.temporal.activeKeyframeId)
  const updateKeyframe = useEditorStore(s => s.updateKeyframe)
  const colorByMode = useEditorStore(s => s.colorByMode)
  const showHelpTooltips = useEditorStore(s => s.showHelpTooltips)
  const setHoveredContext = useEditorStore(s => s.setHoveredContext)
  const isHoveredByRelationship = data.isHoveredByRelationship as boolean
  const nodeRef = React.useRef<HTMLDivElement>(null)

  const size = NODE_SIZES[context.codeSize?.bucket || 'medium']
  const hideDescription = context.codeSize?.bucket === 'tiny' || context.codeSize?.bucket === 'small'

  // Get team name if assigned
  const team = context.teamId && project?.teams?.find(t => t.id === context.teamId)

  // Calculate tooltip position from node bounds
  const getTooltipPosition = () => {
    if (!nodeRef.current) return { x: 0, y: 0 }
    const rect = nodeRef.current.getBoundingClientRect()
    return {
      x: rect.left + rect.width / 2,
      y: rect.top - 8,
    }
  }

  // Handle context menu
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // Only show context menu in Strategic View with an active keyframe
    const isEditingKeyframe = viewMode === 'strategic' && project?.temporal?.enabled && activeKeyframeId
    if (!isEditingKeyframe) return

    setContextMenu({ x: e.clientX, y: e.clientY })
  }

  // Close context menu
  React.useEffect(() => {
    const handleClick = () => setContextMenu(null)
    if (contextMenu) {
      window.addEventListener('click', handleClick)
      return () => window.removeEventListener('click', handleClick)
    }
  }, [contextMenu])

  // Handle hide/show in keyframe
  const handleToggleVisibility = () => {
    if (!activeKeyframeId || !project?.temporal) return

    const keyframe = project.temporal.keyframes.find(kf => kf.id === activeKeyframeId)
    if (!keyframe) return

    const isCurrentlyVisible = keyframe.activeContextIds.includes(context.id)
    const newActiveContextIds = isCurrentlyVisible
      ? keyframe.activeContextIds.filter(id => id !== context.id)
      : [...keyframe.activeContextIds, context.id]

    updateKeyframe(activeKeyframeId, { activeContextIds: newActiveContextIds })
    setContextMenu(null)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer.types.includes('application/contextflow-repo')) {
      setIsDragOver(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    const repoId = e.dataTransfer.getData('application/contextflow-repo')
    if (repoId) {
      assignRepoToContext(repoId, context.id)
    }
  }

  // Fill color based on colorByMode setting
  const OWNERSHIP_COLORS = {
    ours: '#d1fae5',      // green-100
    internal: '#dbeafe',  // blue-100
    external: '#fed7aa',  // orange-200
  }
  const STRATEGIC_COLORS = {
    core: '#f8e7a1',      // yellow
    supporting: '#dbeafe', // blue
    generic: '#f3f4f6',   // gray
  }
  const fillColor = colorByMode === 'ownership'
    ? OWNERSHIP_COLORS[context.ownership || 'ours']
    : STRATEGIC_COLORS[context.strategicClassification || 'generic']

  // Consolidated highlight state for selected or group member contexts
  const isHighlighted = isSelected || isMemberOfSelectedGroup || isHoveredByRelationship
  const { borderWidth, borderStyle, borderColor, shadow } = getContextNodeBorderStyle(context, isDragOver, isHighlighted, isHovered)

  return (
    <div
      ref={nodeRef}
      onMouseEnter={() => {
        setIsHovered(true)
        setHoveredContext(context.id)
        if (showHelpTooltips) {
          tooltipTimerRef.current = setTimeout(() => setShowTooltip(true), 500)
        }
      }}
      onMouseLeave={() => {
        setIsHovered(false)
        setHoveredContext(null)
        if (tooltipTimerRef.current) { clearTimeout(tooltipTimerRef.current); tooltipTimerRef.current = null }
        setShowTooltip(false)
      }}
      onMouseDown={() => {
        if (tooltipTimerRef.current) { clearTimeout(tooltipTimerRef.current); tooltipTimerRef.current = null }
        setShowTooltip(false)
      }}
      style={{ position: 'relative' }}
    >
      {/* Connection handles - styled via CSS in index.css, visible on node hover */}
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      {/* Top handle for receiving connections from User Needs in Strategic View */}
      <Handle type="target" position={Position.Top} id="top" />

      <div
        style={{
          width: size.width,
          height: size.height,
          backgroundColor: fillColor,
          borderWidth,
          borderStyle: context.ownership === 'external' ? 'dashed' : borderStyle,
          borderColor,
          borderRadius: '8px',
          padding: '8px',
          boxShadow: shadow,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          cursor: 'pointer',
          opacity: opacity ?? 1,
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onContextMenu={handleContextMenu}
        title={hideDescription && context.purpose ? context.purpose : undefined}
      >
      {/* Legacy badge */}
      {context.isLegacy && (
        <div
          style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            fontSize: '16px',
          }}
          title="Legacy"
        >
          ⚠
        </div>
      )}

      {/* External badge */}
      {context.ownership === 'external' && (
        <div
          style={{
            position: 'absolute',
            top: '6px',
            left: '6px',
            fontSize: '9px',
            backgroundColor: '#f1f5f9',
            color: '#64748b',
            padding: '3px 7px',
            borderRadius: '6px',
            fontWeight: 600,
            letterSpacing: '0.03em',
            textTransform: 'uppercase',
          }}
        >
          External
        </div>
      )}

      {/* Issue indicators */}
      {context.issues && context.issues.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '4px',
            left: context.ownership === 'external' ? undefined : '4px',
            right: context.ownership === 'external' ? (context.isLegacy ? '24px' : '4px') : undefined,
            display: 'flex',
            gap: '2px',
          }}
        >
          {context.issues.map((issue) => {
            const severityColors = {
              critical: '#dc2626',
              warning: '#d97706',
              info: '#3b82f6',
            }
            return (
              <SimpleTooltip key={issue.id} text={issue.title || 'Untitled issue'} position="bottom">
                <div style={{ cursor: 'default' }}>
                  {issue.severity === 'info' ? (
                    <Info size={14} color={severityColors[issue.severity]} />
                  ) : issue.severity === 'critical' ? (
                    <AlertOctagon size={14} color={severityColors[issue.severity]} />
                  ) : (
                    <AlertTriangle size={14} color={severityColors[issue.severity]} />
                  )}
                </div>
              </SimpleTooltip>
            )
          })}
        </div>
      )}

      {/* Context name */}
      <div
        style={{
          fontSize: '13px',
          fontWeight: 600,
          color: '#0f172a',
          marginTop: context.ownership === 'external' ? '20px' : (context.isLegacy || (context.issues && context.issues.length > 0)) ? '20px' : '0',
          lineHeight: '1.3',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {context.name}
      </div>

      {/* Purpose */}
      {context.purpose && !hideDescription && (
        <div
          style={{
            fontSize: '10.5px',
            color: '#64748b',
            marginTop: '6px',
            lineHeight: '1.4',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {context.purpose}
        </div>
      )}
      </div>

      {/* Context Menu */}
      {contextMenu && activeKeyframeId && project?.temporal && (
        <div
          className="fixed bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-md shadow-lg py-1 z-50"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleToggleVisibility}
            className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-neutral-700"
          >
            {(() => {
              const keyframe = project.temporal.keyframes.find(kf => kf.id === activeKeyframeId)
              const isVisible = keyframe?.activeContextIds.includes(context.id)
              return isVisible ? 'Hide in this keyframe' : 'Show in this keyframe'
            })()}
          </button>
        </div>
      )}

      {/* Rich tooltip on hover */}
      {showHelpTooltips && showTooltip && (() => {
        const tooltipPos = getTooltipPosition()
        const lines = getContextTooltipLines({
          context,
          viewMode: viewMode as 'flow' | 'strategic' | 'distillation',
          colorByMode,
          relationships: project?.relationships || [],
          contexts: project?.contexts || [],
        })
        if (lines.length === 0) return null
        const lastLine = lines[lines.length - 1]
        const contentLines = lines.slice(0, -1)
        const isGuidanceLine = lastLine === 'Drag handles to connect to other contexts'
          || lastLine === 'Drag to classify as Core, Supporting, or Generic'

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
              <div className="font-semibold text-sm mb-1">{context.name}</div>
              {context.purpose && (
                <div className="text-xs text-slate-300 mb-2">{context.purpose}</div>
              )}
              <ul className="text-xs text-slate-300 space-y-0.5">
                {(isGuidanceLine ? contentLines : lines).map((item, index) => (
                  <li key={index} className="flex items-start gap-1.5">
                    <span className="text-slate-500 mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
                {isGuidanceLine && (
                  <li className="flex items-start gap-1.5">
                    <span className="text-slate-500 mt-0.5">•</span>
                    <span className="italic text-slate-400">{lastLine}</span>
                  </li>
                )}
              </ul>
            </div>
          </div>,
          document.body
        )
      })()}
    </div>
  )
}
