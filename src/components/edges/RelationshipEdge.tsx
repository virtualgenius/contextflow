import React from 'react'
import { createPortal } from 'react-dom'
import { EdgeProps, EdgeLabelRenderer, getBezierPath, useViewport, useReactFlow } from 'reactflow'
import { ArrowLeftRight, Trash2 } from 'lucide-react'
import { useEditorStore } from '../../model/store'
import type { Relationship } from '../../model/types'
import { getEdgeLabelInfo } from '../../lib/canvasHelpers'
import { getIndicatorBoxPosition } from '../../lib/edgeUtils'
import {
  getEdgeParams,
  getIndicatorBoxAttachment,
  shortenEdgeEndpoint,
  SIDE_NORMALS,
  tangentBezierPath,
} from '../../lib/edgeGeometry'
import { boxesOverlap } from '../../lib/sharedKernelGeometry'
import {
  ARROW_MARKER_LENGTH,
  EDGE_ENDPOINT_GAP,
  EDGE_HIT_AREA_WIDTH,
  EDGE_STROKE_WIDTH,
  EDGE_TRANSITION,
  PATTERN_EDGE_INDICATORS,
} from '../../lib/canvasConstants'
import {
  EDGE_INDICATORS,
  RELATIONSHIP_PATTERNS,
  UPSTREAM_DOWNSTREAM,
  perSideRelationshipConcept,
} from '../../model/conceptDefinitions'
import { createSelectionState } from '../../model/validation'

type SideIndicatorKey = 'open-host-service' | 'anti-corruption-layer'

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
  const [hoveredIndicator, setHoveredIndicator] = React.useState<SideIndicatorKey | null>(null)
  const [contextMenu, setContextMenu] = React.useState<{ x: number; y: number } | null>(null)
  const selectedRelationshipId = useEditorStore((s) => s.selectedRelationshipId)
  const deleteRelationship = useEditorStore((s) => s.deleteRelationship)
  const swapRelationshipDirection = useEditorStore((s) => s.swapRelationshipDirection)
  const showHelpTooltips = useEditorStore((s) => s.showHelpTooltips)
  const showRelationshipLabels = useEditorStore((s) => s.showRelationshipLabels)
  const hoveredContextId = useEditorStore((s) => s.hoveredContextId)
  const setHoveredRelationship = useEditorStore((s) => s.setHoveredRelationship)
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

  // Shared Kernel suppression: when the relationship pattern is shared-kernel
  // AND both endpoint contexts overlap, the SharedKernelOverlay renders the
  // hatched intersection region instead of an edge line (cqi). Skip the entire
  // edge to avoid a redundant connector and double-selection target.
  if (
    pattern === 'shared-kernel' &&
    sourceNode &&
    targetNode &&
    sourceNode.width &&
    sourceNode.height &&
    targetNode.width &&
    targetNode.height &&
    boxesOverlap(
      {
        x: sourceNode.position.x,
        y: sourceNode.position.y,
        width: sourceNode.width,
        height: sourceNode.height,
      },
      {
        x: targetNode.position.x,
        y: targetNode.position.y,
        width: targetNode.width,
        height: targetNode.height,
      }
    )
  ) {
    return null
  }

  // Calculate dynamic edge positions if nodes are available with valid dimensions
  let sx = sourceX
  let sy = sourceY
  let tx = targetX
  let ty = targetY
  let sourcePos = sourcePosition
  let targetPos = targetPosition

  if (
    sourceNode &&
    targetNode &&
    sourceNode.width &&
    sourceNode.height &&
    targetNode.width &&
    targetNode.height
  ) {
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
  const isSymmetric = pattern === 'shared-kernel' || pattern === 'partnership'

  // Visible path: pulled back from both context borders so the line floats
  // BETWEEN contexts rather than tied flush to their edges. Source side gets
  // EDGE_ENDPOINT_GAP; target side gets ARROW_MARKER_LENGTH for directional
  // patterns (marker size + gap, so arrow tip lands inside the gap) or
  // EDGE_ENDPOINT_GAP for symmetric patterns (no marker). The hit area uses
  // the full geometry above so hover/click works against the longer line.
  const visibleSource = shortenEdgeEndpoint(sx, sy, sourcePos, EDGE_ENDPOINT_GAP)
  const visibleTarget = isSymmetric
    ? shortenEdgeEndpoint(tx, ty, targetPos, EDGE_ENDPOINT_GAP)
    : shortenEdgeEndpoint(tx, ty, targetPos, ARROW_MARKER_LENGTH)
  const [visibleEdgePath] = getBezierPath({
    sourceX: visibleSource.x,
    sourceY: visibleSource.y,
    sourcePosition: sourcePos,
    targetX: visibleTarget.x,
    targetY: visibleTarget.y,
    targetPosition: targetPos,
  })

  // Use ReactFlow's built-in marker system (automatically handles rotation)
  const markerId = isSelected
    ? 'arrow-selected'
    : isHovered || isHighlightedByHover
      ? 'arrow-hover'
      : 'arrow-default'

  // Per-side roles drive on-canvas indicator boxes. PL upstream and Conformist
  // downstream are intentionally not surfaced on the canvas
  // (design_pl_conformist_no_canvas_visual); only OHS and ACL get boxes.
  const upstreamIndicatorKey: SideIndicatorKey | null =
    relationship?.upstreamRole === 'open-host-service' ? 'open-host-service' : null

  const downstreamIndicatorKey: SideIndicatorKey | null =
    relationship?.downstreamRole === 'anti-corruption-layer' ? 'anti-corruption-layer' : null

  const upstreamConfig = upstreamIndicatorKey ? PATTERN_EDGE_INDICATORS[upstreamIndicatorKey] : null
  const downstreamConfig = downstreamIndicatorKey
    ? PATTERN_EDGE_INDICATORS[downstreamIndicatorKey]
    : null

  const upstreamBoxPos = upstreamConfig
    ? getIndicatorBoxPosition(
        targetNode,
        targetPos,
        upstreamConfig.boxWidth,
        upstreamConfig.boxHeight
      )
    : null
  const downstreamBoxPos = downstreamConfig
    ? getIndicatorBoxPosition(
        sourceNode,
        sourcePos,
        downstreamConfig.boxWidth,
        downstreamConfig.boxHeight
      )
    : null

  const upstreamBoxAttachment =
    upstreamBoxPos && upstreamConfig
      ? getIndicatorBoxAttachment(
          upstreamBoxPos,
          upstreamConfig.boxWidth,
          upstreamConfig.boxHeight,
          targetPos
        )
      : null
  const downstreamBoxAttachment =
    downstreamBoxPos && downstreamConfig
      ? getIndicatorBoxAttachment(
          downstreamBoxPos,
          downstreamConfig.boxWidth,
          downstreamConfig.boxHeight,
          sourcePos
        )
      : null

  // ACL/OHS edge geometry (contextflow-if3): box hugs its parent context;
  // line attaches to the box's outer-edge midpoint with EDGE_ENDPOINT_GAP.
  // Path is tangent-aware so it leaves/enters perpendicular to attachment
  // edges. Arrow always points to the upstream (target) end.
  const useBoxPath = upstreamBoxAttachment !== null || downstreamBoxAttachment !== null

  const sourceEndpoint = downstreamBoxAttachment
    ? {
        point: {
          x: downstreamBoxAttachment.point.x + downstreamBoxAttachment.normal.x * EDGE_ENDPOINT_GAP,
          y: downstreamBoxAttachment.point.y + downstreamBoxAttachment.normal.y * EDGE_ENDPOINT_GAP,
        },
        tangent: downstreamBoxAttachment.normal,
      }
    : { point: visibleSource, tangent: SIDE_NORMALS[sourcePos] }

  const targetEndpoint = upstreamBoxAttachment
    ? {
        point: {
          x: upstreamBoxAttachment.point.x + upstreamBoxAttachment.normal.x * ARROW_MARKER_LENGTH,
          y: upstreamBoxAttachment.point.y + upstreamBoxAttachment.normal.y * ARROW_MARKER_LENGTH,
        },
        tangent: upstreamBoxAttachment.normal,
      }
    : { point: visibleTarget, tangent: SIDE_NORMALS[targetPos] }

  const aclOhsPath = useBoxPath
    ? tangentBezierPath(
        sourceEndpoint.point,
        targetEndpoint.point,
        sourceEndpoint.tangent,
        targetEndpoint.tangent
      )
    : null

  // Edge color based on state
  const isEmphasized = isSelected || isHovered || isHighlightedByHover
  const edgeColor = isSelected
    ? '#3b82f6'
    : isHighlightedByHover
      ? '#64748b'
      : isHovered
        ? '#475569'
        : '#cbd5e1'
  const strokeWidth = isEmphasized ? EDGE_STROKE_WIDTH.selected : EDGE_STROKE_WIDTH.default

  const renderIndicatorBox = (
    key: SideIndicatorKey,
    config: NonNullable<typeof upstreamConfig>,
    boxPos: { x: number; y: number }
  ) => (
    <g key={key}>
      {/* Invisible hit area for easier hovering */}
      <rect
        x={boxPos.x - config.boxWidth / 2 - 4}
        y={boxPos.y - config.boxHeight / 2 - 4}
        width={config.boxWidth + 8}
        height={config.boxHeight + 8}
        fill="transparent"
        style={{ cursor: 'help' }}
        onMouseEnter={() => setHoveredIndicator(key)}
        onMouseLeave={() => setHoveredIndicator(null)}
      />
      {/* Visible box */}
      <rect
        x={boxPos.x - config.boxWidth / 2}
        y={boxPos.y - config.boxHeight / 2}
        width={config.boxWidth}
        height={config.boxHeight}
        rx={3}
        fill={config.colors.bg}
        stroke={config.colors.border}
        strokeWidth={1.5}
        style={{ transition: EDGE_TRANSITION, pointerEvents: 'none' }}
      />
      <text
        x={boxPos.x}
        y={boxPos.y + 4}
        textAnchor="middle"
        fontSize={9}
        fontWeight="bold"
        fill={config.colors.text}
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        {config.label}
      </text>
    </g>
  )

  const renderIndicatorTooltip = (key: SideIndicatorKey, boxPos: { x: number; y: number }) => {
    const indicatorContent =
      key === 'anti-corruption-layer' ? EDGE_INDICATORS.acl : EDGE_INDICATORS.ohs
    const screenX = boxPos.x * zoom + vpX
    const screenY = boxPos.y * zoom + vpY
    const tooltipWidth = 256
    const tooltipX = Math.max(
      8,
      Math.min(screenX - tooltipWidth / 2, window.innerWidth - tooltipWidth - 8)
    )
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
  }

  return (
    <>
      {/* Box-attached path: used whenever an ACL or OHS indicator is present
          (per-side roles or legacy pattern). Arrow always points to upstream. */}
      {useBoxPath && aclOhsPath && (
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

      {/* Default: normal bezier path for relationships without ACL/OHS boxes */}
      {!useBoxPath && (
        <path
          id={id}
          className="react-flow__edge-path"
          d={visibleEdgePath}
          style={{
            stroke: edgeColor,
            strokeWidth: strokeWidth,
            fill: 'none',
            transition: EDGE_TRANSITION,
          }}
          markerEnd={isSymmetric ? undefined : `url(#${markerId})`}
        />
      )}

      {downstreamConfig &&
        downstreamBoxPos &&
        renderIndicatorBox('anti-corruption-layer', downstreamConfig, downstreamBoxPos)}
      {upstreamConfig &&
        upstreamBoxPos &&
        renderIndicatorBox('open-host-service', upstreamConfig, upstreamBoxPos)}

      {showHelpTooltips &&
        hoveredIndicator === 'anti-corruption-layer' &&
        downstreamBoxPos &&
        renderIndicatorTooltip('anti-corruption-layer', downstreamBoxPos)}
      {showHelpTooltips &&
        hoveredIndicator === 'open-host-service' &&
        upstreamBoxPos &&
        renderIndicatorTooltip('open-host-service', upstreamBoxPos)}
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
        onMouseEnter={() => {
          setIsHovered(true)
          setHoveredRelationship(id)
        }}
        onMouseLeave={() => {
          setIsHovered(false)
          setHoveredRelationship(null)
        }}
        onClick={(e) => {
          e.stopPropagation()
          useEditorStore.setState({
            ...createSelectionState(id, 'relationship'),
            selectedContextIds: [source, target],
          })
        }}
        onDoubleClick={(e) => {
          e.stopPropagation()
          if (!isSymmetric) {
            swapRelationshipDirection(id)
          }
        }}
        onContextMenu={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setContextMenu({ x: e.clientX, y: e.clientY })
        }}
      />

      {/* Tooltip on hover or when selected - uses portal to render above all layers */}
      {showHelpTooltips &&
        (isHovered || isSelected) &&
        (() => {
          const patternContent =
            RELATIONSHIP_PATTERNS[pattern] ||
            perSideRelationshipConcept(relationship?.upstreamRole, relationship?.downstreamRole) ||
            (relationship ? UPSTREAM_DOWNSTREAM : null)
          if (!patternContent) return null

          // Convert canvas coordinates to screen coordinates
          const screenX = labelX * zoom + vpX
          const screenY = labelY * zoom + vpY

          // Position tooltip above the edge label point
          const tooltipWidth = 256
          const tooltipX = Math.max(
            8,
            Math.min(screenX - tooltipWidth / 2, window.innerWidth - tooltipWidth - 8)
          )
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
      {(showRelationshipLabels || isEmphasized || isHighlightedByHover) &&
        (() => {
          const labelInfo = getEdgeLabelInfo(
            pattern || undefined,
            relationship?.upstreamRole,
            relationship?.downstreamRole
          )
          if (!labelInfo) return null
          return (
            <EdgeLabelRenderer>
              <div
                style={{
                  position: 'absolute',
                  transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
                  pointerEvents: 'none',
                  zIndex: 10,
                }}
                className="text-[10px] font-medium leading-tight whitespace-nowrap px-1.5 py-0.5 rounded bg-white/90 dark:bg-neutral-800/90 border border-slate-200 dark:border-neutral-600 text-slate-600 dark:text-slate-300 shadow-sm"
              >
                {labelInfo.directionIcon && (
                  <span className="mr-0.5">{labelInfo.directionIcon}</span>
                )}
                {labelInfo.label}
              </div>
            </EdgeLabelRenderer>
          )
        })()}
    </>
  )
}

export default RelationshipEdge
