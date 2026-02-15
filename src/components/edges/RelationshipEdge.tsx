import React from 'react'
import { createPortal } from 'react-dom'
import {
  EdgeProps,
  EdgeLabelRenderer,
  getBezierPath,
  useViewport,
  useReactFlow,
} from 'reactflow'
import { ArrowLeftRight, Trash2 } from 'lucide-react'
import { useEditorStore } from '../../model/store'
import type { Relationship } from '../../model/types'
import { getEdgeLabelInfo } from '../../lib/canvasHelpers'
import { getIndicatorBoxPosition } from '../../lib/edgeUtils'
import { getEdgeParams, getBoxEdgePoint } from '../../lib/edgeGeometry'
import { EDGE_HIT_AREA_WIDTH, EDGE_STROKE_WIDTH, EDGE_TRANSITION, PATTERN_EDGE_INDICATORS } from '../../lib/canvasConstants'
import { EDGE_INDICATORS, RELATIONSHIP_PATTERNS } from '../../model/conceptDefinitions'

function RelationshipEdge({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: EdgeProps) {
  const [isHovered, setIsHovered] = React.useState(false)
  const [isIndicatorHovered, setIsIndicatorHovered] = React.useState(false)
  const [contextMenu, setContextMenu] = React.useState<{ x: number; y: number } | null>(null)
  const selectedRelationshipId = useEditorStore(s => s.selectedRelationshipId)
  const deleteRelationship = useEditorStore(s => s.deleteRelationship)
  const swapRelationshipDirection = useEditorStore(s => s.swapRelationshipDirection)
  const showHelpTooltips = useEditorStore(s => s.showHelpTooltips)
  const hoveredContextId = useEditorStore(s => s.hoveredContextId)
  const relationship = data?.relationship as Relationship | undefined
  const pattern = relationship?.pattern || ''
  const isSelected = id === selectedRelationshipId
  const isHighlightedByHover = hoveredContextId === source || hoveredContextId === target
  const { x: vpX, y: vpY, zoom } = useViewport()

  // Close context menu on outside click
  React.useEffect(() => {
    if (!contextMenu) return
    const handleClick = () => setContextMenu(null)
    window.addEventListener('click', handleClick)
    return () => window.removeEventListener('click', handleClick)
  }, [contextMenu])

  // Get node objects from React Flow to calculate dynamic positions
  const { getNode } = useReactFlow()
  const sourceNode = getNode(source)
  const targetNode = getNode(target)

  // Calculate dynamic edge positions if nodes are available with valid dimensions
  let sx = sourceX
  let sy = sourceY
  let tx = targetX
  let ty = targetY
  let sourcePos = sourcePosition
  let targetPos = targetPosition

  if (sourceNode && targetNode &&
      sourceNode.width && sourceNode.height &&
      targetNode.width && targetNode.height) {
    const edgeParams = getEdgeParams(sourceNode, targetNode)
    sx = edgeParams.sx
    sy = edgeParams.sy
    tx = edgeParams.tx
    ty = edgeParams.ty
    sourcePos = edgeParams.sourcePos
    targetPos = edgeParams.targetPos
  }

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX: sx,
    sourceY: sy,
    sourcePosition: sourcePos,
    targetX: tx,
    targetY: ty,
    targetPosition: targetPos,
  })

  // Non-directional patterns (no arrow)
  const isSymmetric = pattern === 'shared-kernel' || pattern === 'partnership' || pattern === 'separate-ways'

  // Use ReactFlow's built-in marker system (automatically handles rotation)
  const markerId = isSelected ? 'arrow-selected' : (isHovered || isHighlightedByHover) ? 'arrow-hover' : 'arrow-default'

  const indicatorConfig = PATTERN_EDGE_INDICATORS[pattern as Relationship['pattern']]
  const isACL = pattern === 'anti-corruption-layer'
  const isOHS = pattern === 'open-host-service'

  const indicatorNode = indicatorConfig?.position === 'source' ? sourceNode : targetNode
  const indicatorEdgePos = indicatorConfig?.position === 'source' ? sourcePos : targetPos

  const boxPos = indicatorConfig
    ? getIndicatorBoxPosition(indicatorNode, indicatorEdgePos, indicatorConfig.boxWidth, indicatorConfig.boxHeight)
    : null

  const boxEdgePoint = boxPos && indicatorConfig
    ? getBoxEdgePoint(
        boxPos,
        indicatorConfig.boxWidth,
        indicatorConfig.boxHeight,
        indicatorConfig.position === 'source' ? { x: tx, y: ty } : { x: sx, y: sy }
      )
    : null

  const [aclOhsPath] = boxEdgePoint
    ? getBezierPath({
        sourceX: isACL ? boxEdgePoint.x : sx,
        sourceY: isACL ? boxEdgePoint.y : sy,
        sourcePosition: sourcePos,
        targetX: isOHS ? boxEdgePoint.x : tx,
        targetY: isOHS ? boxEdgePoint.y : ty,
        targetPosition: targetPos,
      })
    : [null]

  // Edge color based on state
  const isEmphasized = isSelected || isHovered || isHighlightedByHover
  const edgeColor = isSelected ? '#3b82f6' : isHighlightedByHover ? '#64748b' : isHovered ? '#475569' : '#cbd5e1'
  const strokeWidth = isEmphasized ? EDGE_STROKE_WIDTH.selected : EDGE_STROKE_WIDTH.default

  return (
    <>
      {/* ACL: curved line from box edge to target (upstream) with arrow */}
      {isACL && aclOhsPath && (
        <path
          id={id}
          className="react-flow__edge-path"
          d={aclOhsPath}
          style={{
            stroke: edgeColor,
            strokeWidth: strokeWidth,
            fill: 'none',
            transition: EDGE_TRANSITION,
          }}
          markerEnd={`url(#${markerId})`}
        />
      )}

      {isOHS && aclOhsPath && (
        <path
          id={id}
          className="react-flow__edge-path"
          d={aclOhsPath}
          style={{
            stroke: edgeColor,
            strokeWidth: strokeWidth,
            fill: 'none',
            transition: EDGE_TRANSITION,
          }}
          markerEnd={`url(#${markerId})`}
        />
      )}

      {/* Default: normal bezier path for other patterns */}
      {!isACL && !isOHS && (
        <path
          id={id}
          className="react-flow__edge-path"
          d={edgePath}
          style={{
            stroke: edgeColor,
            strokeWidth: strokeWidth,
            fill: 'none',
            transition: EDGE_TRANSITION,
          }}
          markerEnd={isSymmetric ? undefined : `url(#${markerId})`}
        />
      )}

      {/* Pattern indicator box (ACL/OHS) */}
      {indicatorConfig && boxPos && (
        <g>
          {/* Invisible hit area for easier hovering */}
          <rect
            x={boxPos.x - indicatorConfig.boxWidth / 2 - 4}
            y={boxPos.y - indicatorConfig.boxHeight / 2 - 4}
            width={indicatorConfig.boxWidth + 8}
            height={indicatorConfig.boxHeight + 8}
            fill="transparent"
            style={{ cursor: 'help' }}
            onMouseEnter={() => setIsIndicatorHovered(true)}
            onMouseLeave={() => setIsIndicatorHovered(false)}
          />
          {/* Visible box */}
          <rect
            x={boxPos.x - indicatorConfig.boxWidth / 2}
            y={boxPos.y - indicatorConfig.boxHeight / 2}
            width={indicatorConfig.boxWidth}
            height={indicatorConfig.boxHeight}
            rx={3}
            fill={indicatorConfig.colors.bg}
            stroke={indicatorConfig.colors.border}
            strokeWidth={1.5}
            style={{ transition: EDGE_TRANSITION, pointerEvents: 'none' }}
          />
          <text
            x={boxPos.x}
            y={boxPos.y + 4}
            textAnchor="middle"
            fontSize={9}
            fontWeight="bold"
            fill={indicatorConfig.colors.text}
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            {indicatorConfig.label}
          </text>
        </g>
      )}
      {/* Indicator box tooltip */}
      {showHelpTooltips && isIndicatorHovered && indicatorConfig && boxPos && (() => {
        const indicatorContent = isACL ? EDGE_INDICATORS.acl : EDGE_INDICATORS.ohs
        // Convert canvas coordinates to screen coordinates
        const screenX = boxPos.x * zoom + vpX
        const screenY = boxPos.y * zoom + vpY

        const tooltipWidth = 256
        const tooltipX = Math.max(8, Math.min(screenX - tooltipWidth / 2, window.innerWidth - tooltipWidth - 8))
        const tooltipY = Math.max(8, screenY - 8)

        return createPortal(
          <div
            className="fixed z-[9999] pointer-events-none"
            style={{ left: tooltipX, top: tooltipY, transform: 'translateY(-100%)' }}
          >
            <div className="w-64 p-3 bg-slate-800 dark:bg-slate-700 text-white rounded-lg shadow-lg text-left">
              <div className="font-semibold text-sm mb-1">{indicatorContent.title}</div>
              <div className="text-xs text-slate-300 mb-2">{indicatorContent.description}</div>
              {indicatorContent.characteristics && indicatorContent.characteristics.length > 0 && (
                <ul className="text-xs text-slate-300 space-y-0.5">
                  {indicatorContent.characteristics.map((item, index) => (
                    <li key={index} className="flex items-start gap-1.5">
                      <span className="text-slate-500 mt-0.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>,
          document.body
        )
      })()}
      {/* Invisible wider path for easier hovering and clicking */}
      <path
        d={edgePath}
        style={{
          stroke: 'transparent',
          strokeWidth: EDGE_HIT_AREA_WIDTH,
          fill: 'none',
          cursor: 'pointer',
          pointerEvents: 'all',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={(e) => {
          e.stopPropagation()
          useEditorStore.setState({
            selectedRelationshipId: id,
            selectedContextId: null,
            selectedContextIds: [source, target],
            selectedGroupId: null,
            selectedUserId: null,
            selectedUserNeedId: null,
            selectedNeedContextConnectionId: null,
            selectedUserNeedConnectionId: null,
            selectedStageIndex: null,
          })
        }}
        onContextMenu={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setContextMenu({ x: e.clientX, y: e.clientY })
        }}
      >
        <title>{pattern}</title>
      </path>
      {/* Tooltip on hover or when selected - uses portal to render above all layers */}
      {showHelpTooltips && (isHovered || isSelected) && (() => {
        const patternContent = RELATIONSHIP_PATTERNS[pattern]
        if (!patternContent) return null

        // Convert canvas coordinates to screen coordinates
        const screenX = labelX * zoom + vpX
        const screenY = labelY * zoom + vpY

        // Position tooltip above the edge label point
        const tooltipWidth = 256
        const tooltipX = Math.max(8, Math.min(screenX - tooltipWidth / 2, window.innerWidth - tooltipWidth - 8))
        const tooltipY = Math.max(8, screenY - 8) // 8px above the label point

        return createPortal(
          <div
            className="fixed z-[9999] pointer-events-none"
            style={{ left: tooltipX, top: tooltipY, transform: 'translateY(-100%)' }}
          >
            <div className="w-64 p-3 bg-slate-800 dark:bg-slate-700 text-white rounded-lg shadow-lg text-left">
              <div className="font-semibold text-sm mb-1">{patternContent.title}</div>
              <div className="text-xs text-slate-300 mb-2">{patternContent.description}</div>
              {patternContent.characteristics && patternContent.characteristics.length > 0 && (
                <ul className="text-xs text-slate-300 space-y-0.5">
                  {patternContent.characteristics.map((item, index) => (
                    <li key={index} className="flex items-start gap-1.5">
                      <span className="text-slate-500 mt-0.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>,
          document.body
        )
      })()}
      {/* Context Menu */}
      {contextMenu && (
        <foreignObject x={0} y={0} width={1} height={1} style={{ overflow: 'visible' }}>
          <div
            style={{
              position: 'fixed',
              left: contextMenu.x,
              top: contextMenu.y,
              zIndex: 1000,
            }}
            className="bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg shadow-xl py-1 min-w-[160px]"
            onClick={(e) => e.stopPropagation()}
          >
            {!isSymmetric && (
              <button
                onClick={() => {
                  swapRelationshipDirection(id)
                  setContextMenu(null)
                }}
                className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-neutral-700 transition-colors flex items-center gap-2"
              >
                <ArrowLeftRight size={14} />
                Swap Direction
              </button>
            )}
            <button
              onClick={() => {
                deleteRelationship(id)
                setContextMenu(null)
              }}
              className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2"
            >
              <Trash2 size={14} />
              Delete Relationship
            </button>
          </div>
        </foreignObject>
      )}
      {/* Edge label showing pattern name and direction */}
      {(isEmphasized || isHighlightedByHover) && (() => {
        const labelInfo = getEdgeLabelInfo(pattern)
        if (!labelInfo) return null
        return (
          <EdgeLabelRenderer>
            <div
              style={{
                position: 'absolute',
                transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
                pointerEvents: 'none',
              }}
              className="text-[10px] font-medium leading-tight whitespace-nowrap px-1.5 py-0.5 rounded bg-white/90 dark:bg-neutral-800/90 border border-slate-200 dark:border-neutral-600 text-slate-600 dark:text-slate-300 shadow-sm"
            >
              {labelInfo.directionIcon && <span className="mr-0.5">{labelInfo.directionIcon}</span>}
              {labelInfo.label}
            </div>
          </EdgeLabelRenderer>
        )
      })()}
    </>
  )
}

export default RelationshipEdge
