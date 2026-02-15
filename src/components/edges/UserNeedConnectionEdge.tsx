import React from 'react'
import {
  EdgeProps,
  getStraightPath,
  useReactFlow,
} from 'reactflow'
import { useEditorStore } from '../../model/store'
import type { UserNeedConnection } from '../../model/types'
import { getVerticalEdgeEndpoints, getEdgeState, getEdgeStrokeWidth } from '../../lib/edgeUtils'
import { EDGE_HIT_AREA_WIDTH, EDGE_STROKE_WIDTH, EDGE_TRANSITION, EDGE_DASH_ARRAY } from '../../lib/canvasConstants'

function UserNeedConnectionEdge({
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
  const selectedUserId = useEditorStore(s => s.selectedUserId)
  const selectedUserNeedId = useEditorStore(s => s.selectedUserNeedId)
  const selectedUserNeedConnectionId = useEditorStore(s => s.selectedUserNeedConnectionId)
  const connection = data?.connection as UserNeedConnection | undefined

  const isSelected = id === selectedUserNeedConnectionId
  const isHighlighted = isSelected || source === selectedUserId || target === selectedUserNeedId
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
          stroke: isSelected ? '#3b82f6' : isHighlighted ? '#3b82f6' : isHovered ? '#60a5fa' : '#94a3b8',
          strokeWidth: getEdgeStrokeWidth(edgeState, EDGE_STROKE_WIDTH),
          strokeDasharray: EDGE_DASH_ARRAY,
          fill: 'none',
          transition: EDGE_TRANSITION,
        }}
        markerEnd="url(#user-arrow)"
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
            selectedUserNeedConnectionId: id,
            selectedContextId: null,
            selectedContextIds: [],
            selectedGroupId: null,
            selectedRelationshipId: null,
            selectedUserId: null,
            selectedUserNeedId: null,
            selectedStageIndex: null,
          })
        }}
      >
        <title>User-Need connection{connection?.notes ? `: ${connection.notes}` : ''}</title>
      </path>
    </>
  )
}

export default UserNeedConnectionEdge
