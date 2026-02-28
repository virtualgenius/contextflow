import React from 'react'
import { EdgeProps, getStraightPath, useReactFlow } from 'reactflow'
import { useEditorStore } from '../../model/store'
import type { NeedContextConnection } from '../../model/types'
import { getVerticalEdgeEndpoints, getEdgeState, getEdgeStrokeWidth } from '../../lib/edgeUtils'
import {
  EDGE_HIT_AREA_WIDTH,
  EDGE_STROKE_WIDTH,
  EDGE_TRANSITION,
  EDGE_DASH_ARRAY,
} from '../../lib/canvasConstants'

function NeedContextConnectionEdge({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition: _sourcePosition,
  targetPosition: _targetPosition,
  data,
}: EdgeProps) {
  const [isHovered, setIsHovered] = React.useState(false)
  const selectedUserNeedId = useEditorStore((s) => s.selectedUserNeedId)
  const selectedContextId = useEditorStore((s) => s.selectedContextId)
  const selectedNeedContextConnectionId = useEditorStore((s) => s.selectedNeedContextConnectionId)
  const connection = data?.connection as NeedContextConnection | undefined

  const isSelected = id === selectedNeedContextConnectionId
  const isHighlighted = isSelected || source === selectedUserNeedId || target === selectedContextId
  const edgeState = getEdgeState(isSelected, isHighlighted, isHovered)

  const { getNode } = useReactFlow()
  const sourceNode = getNode(source)
  const targetNode = getNode(target)

  const endpoints = getVerticalEdgeEndpoints(sourceNode, targetNode)
  const sx = endpoints?.sourceX ?? sourceX
  const sy = endpoints?.sourceY ?? sourceY
  const tx = endpoints?.targetX ?? targetX
  const ty = endpoints?.targetY ?? targetY

  const [edgePath] = getStraightPath({
    sourceX: sx,
    sourceY: sy,
    targetX: tx,
    targetY: ty,
  })

  return (
    <>
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        style={{
          stroke: isSelected
            ? '#10b981'
            : isHighlighted
              ? '#10b981'
              : isHovered
                ? '#34d399'
                : '#94a3b8',
          strokeWidth: getEdgeStrokeWidth(edgeState, EDGE_STROKE_WIDTH),
          strokeDasharray: EDGE_DASH_ARRAY,
          fill: 'none',
          transition: EDGE_TRANSITION,
        }}
        markerEnd="url(#need-arrow)"
      />
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
            selectedNeedContextConnectionId: id,
            selectedContextId: null,
            selectedContextIds: [],
            selectedGroupId: null,
            selectedRelationshipId: null,
            selectedUserId: null,
            selectedUserNeedId: null,
            selectedUserNeedConnectionId: null,
            selectedStageIndex: null,
          })
        }}
      >
        <title>Need-Context connection{connection?.notes ? `: ${connection.notes}` : ''}</title>
      </path>
    </>
  )
}

export default NeedContextConnectionEdge
