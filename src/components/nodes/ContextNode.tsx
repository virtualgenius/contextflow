import React from 'react'
import { createPortal } from 'react-dom'
import { NodeProps, Position, Handle } from 'reactflow'
import { useEditorStore } from '../../model/store'
import type { BoundedContext } from '../../model/types'
import { Archive, CloudFog } from 'lucide-react'
import { getContextTooltipLines } from '../../lib/contextTooltip'
import { getContextNodeBorderStyle } from '../../lib/nodeStyles'
import { NODE_SIZES } from '../../lib/canvasConstants'
import { InfoTooltip } from '../InfoTooltip'
import { LEGACY_CONTEXT, BIG_BALL_OF_MUD } from '../../model/conceptDefinitions'
import { ContextNodeStubs } from './ContextNodeStubs'
import { IssueCounterPill } from './IssueCounterPill'

// Custom node component
export function ContextNode({ data }: NodeProps) {
  const context = data.context as BoundedContext
  const isSelected = data.isSelected as boolean
  const isMemberOfSelectedGroup = data.isMemberOfSelectedGroup as boolean
  const opacity = data.opacity as number | undefined
  const [isHovered, setIsHovered] = React.useState(false)
  const [showTooltip, setShowTooltip] = React.useState(false)
  const [isDragOver, setIsDragOver] = React.useState(false)
  const [contextMenu, setContextMenu] = React.useState<{ x: number; y: number } | null>(null)
  const assignRepoToContext = useEditorStore((s) => s.assignRepoToContext)
  const assignTeamToContext = useEditorStore((s) => s.assignTeamToContext)
  const projectId = useEditorStore((s) => s.activeProjectId)
  const project = useEditorStore((s) => (projectId ? s.projects[projectId] : undefined))
  const viewMode = useEditorStore((s) => s.activeViewMode)
  const activeKeyframeId = useEditorStore((s) => s.temporal.activeKeyframeId)
  const updateKeyframe = useEditorStore((s) => s.updateKeyframe)
  const colorByMode = useEditorStore((s) => s.colorByMode)
  const showHelpTooltips = useEditorStore((s) => s.showHelpTooltips)
  const setHoveredContext = useEditorStore((s) => s.setHoveredContext)
  const setSelectedContext = useEditorStore((s) => s.setSelectedContext)
  const isHoveredByRelationship = data.isHoveredByRelationship as boolean
  const nodeRef = React.useRef<HTMLDivElement>(null)

  const size = NODE_SIZES[context.codeSize?.bucket || 'medium']
  const hideDescription =
    context.codeSize?.bucket === 'tiny' || context.codeSize?.bucket === 'small'

  // Get team name if assigned
  const _team = context.teamId && project?.teams?.find((t) => t.id === context.teamId)

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
    const isEditingKeyframe =
      viewMode === 'strategic' && project?.temporal?.enabled && activeKeyframeId
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

    const keyframe = project.temporal.keyframes.find((kf) => kf.id === activeKeyframeId)
    if (!keyframe) return

    const isCurrentlyVisible = keyframe.activeContextIds.includes(context.id)
    const newActiveContextIds = isCurrentlyVisible
      ? keyframe.activeContextIds.filter((id) => id !== context.id)
      : [...keyframe.activeContextIds, context.id]

    updateKeyframe(activeKeyframeId, { activeContextIds: newActiveContextIds })
    setContextMenu(null)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const hasRepo = e.dataTransfer.types.includes('application/contextflow-repo')
    const hasTeam = e.dataTransfer.types.includes('application/contextflow-team')
    if (hasRepo || (hasTeam && context.ownership !== 'external')) {
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

    const teamId = e.dataTransfer.getData('application/contextflow-team')
    if (teamId && context.ownership !== 'external') {
      assignTeamToContext(context.id, teamId)
    }
  }

  // Fill color based on colorByMode setting
  const OWNERSHIP_COLORS = {
    ours: '#d1fae5', // green-100
    internal: '#dbeafe', // blue-100
    external: '#fed7aa', // orange-200
  }
  const STRATEGIC_COLORS = {
    core: '#f8e7a1', // yellow
    supporting: '#dbeafe', // blue
    generic: '#f3f4f6', // gray
  }
  const fillColor =
    colorByMode === 'ownership'
      ? OWNERSHIP_COLORS[context.ownership || 'ours']
      : STRATEGIC_COLORS[context.strategicClassification || 'generic']

  // Reserve horizontal space for the absolutely-positioned identity icons in
  // the top-right corner so a long context name does not slide under them.
  const identityIconCount = (context.isLegacy ? 1 : 0) + (context.isBigBallOfMud ? 1 : 0)
  const topRightBadgeReserve = identityIconCount === 2 ? 44 : identityIconCount === 1 ? 24 : 0
  const hasIssues = (context.issues?.length ?? 0) > 0

  // Consolidated highlight state for selected or group member contexts
  const isHighlighted = isSelected || isMemberOfSelectedGroup || isHoveredByRelationship
  const { borderWidth, borderStyle, borderColor, shadow } = getContextNodeBorderStyle(
    context,
    isDragOver,
    isHighlighted,
    isHovered
  )

  return (
    <div
      ref={nodeRef}
      onMouseEnter={() => {
        setIsHovered(true)
        setHoveredContext(context.id)
        if (showHelpTooltips) {
          setShowTooltip(true)
        }
      }}
      onMouseLeave={() => {
        setIsHovered(false)
        setHoveredContext(null)
        setShowTooltip(false)
      }}
      onMouseDown={() => {
        setShowTooltip(false)
      }}
      style={{ position: 'relative' }}
    >
      {/* Whole-shape transparent target Handle: any drop on the body completes
         a connection. Pointer-events are toggled by index.css so body-drag
         still works while idle and the body becomes a drop target during a
         connection drag (GH #22). */}
      <Handle
        type="target"
        position={Position.Left}
        id="body"
        isConnectable={true}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          background: 'transparent',
          border: 'none',
          borderRadius: 8,
          transform: 'none',
          opacity: 0,
          zIndex: 0,
        }}
      />

      {/* Top target handle preserved for User Need to Context connections in Strategic View */}
      <Handle type="target" position={Position.Top} id="top" />

      {/* Hover-revealed directional source stubs on all four sides (GH #22) */}
      <ContextNodeStubs visible={isHovered} />

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
          cursor: 'grab',
          opacity: opacity ?? 1,
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onContextMenu={handleContextMenu}
        title={hideDescription && context.purpose ? context.purpose : undefined}
      >
        {/* Identity icons: Legacy then BBoM, in a single top-right container */}
        {identityIconCount > 0 && (
          <div
            data-testid="identity-icons"
            style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            {context.isLegacy && (
              <div data-testid="legacy-badge" style={{ color: '#d97706', display: 'inline-flex' }}>
                <InfoTooltip content={LEGACY_CONTEXT} position="bottom">
                  <span className="inline-flex">
                    <Archive size={16} />
                  </span>
                </InfoTooltip>
              </div>
            )}
            {context.isBigBallOfMud && (
              <div data-testid="bbom-badge" style={{ color: '#78350f', display: 'inline-flex' }}>
                <InfoTooltip content={BIG_BALL_OF_MUD} position="bottom">
                  <span className="inline-flex">
                    <CloudFog size={16} />
                  </span>
                </InfoTooltip>
              </div>
            )}
          </div>
        )}

        {/* Context name */}
        <div
          data-testid="context-name"
          style={{
            fontSize: '13px',
            fontWeight: 600,
            color: '#0f172a',
            marginTop: 0,
            paddingRight: topRightBadgeReserve,
            lineHeight: '1.3',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
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

        {/* Per-severity issue counter pill (bottom-right) */}
        {hasIssues && (
          <IssueCounterPill
            issues={context.issues!}
            onSelect={() => setSelectedContext(context.id)}
          />
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
              const keyframe = project.temporal.keyframes.find((kf) => kf.id === activeKeyframeId)
              const isVisible = keyframe?.activeContextIds.includes(context.id)
              return isVisible ? 'Hide in this keyframe' : 'Show in this keyframe'
            })()}
          </button>
        </div>
      )}

      {/* Rich tooltip on hover */}
      {showHelpTooltips &&
        showTooltip &&
        (() => {
          const tooltipPos = getTooltipPosition()
          const lines = getContextTooltipLines({
            context,
            viewMode: viewMode as 'flow' | 'strategic' | 'distillation',
            colorByMode,
            relationships: project?.relationships || [],
            contexts: project?.contexts || [],
          })
          if (lines.length === 0 && !context.purpose) return null
          const lastLine = lines.length > 0 ? lines[lines.length - 1] : ''
          const contentLines = lines.slice(0, -1)
          const isGuidanceLine = lastLine === 'Drag to classify as Core, Supporting, or Generic'

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
