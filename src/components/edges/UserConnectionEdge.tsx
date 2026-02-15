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

function UserConnectionEdge({
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
  const connection = data?.connection as UserNeedConnection | undefined

  // Highlight if this connection belongs to the selected user
  const isHighlighted = source === selectedUserId
  const edgeState = getEdgeState(false, isHighlighted, isHovered)

  // Get node objects from React Flow to calculate dynamic positions
  const { getNode } = useReactFlow()
  const sourceNode = getNode(source)
  const targetNode = getNode(target)

  // Calculate dynamic edge positions if nodes are available with valid dimensions
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
          stroke: isHighlighted ? '#3b82f6' : isHovered ? '#60a5fa' : '#94a3b8',
          strokeWidth: getEdgeStrokeWidth(edgeState, EDGE_STROKE_WIDTH),
          strokeDasharray: EDGE_DASH_ARRAY,
          fill: 'none',
          transition: EDGE_TRANSITION,
        }}
        markerEnd="url(#user-arrow)"
      />
      {/* Invisible wider path for easier hovering */}
      <path
        d={edgePath}
        style={{
          stroke: 'transparent',
          strokeWidth: EDGE_HIT_AREA_WIDTH,
          fill: 'none',
          cursor: 'pointer',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <title>User connection{connection?.notes ? `: ${connection.notes}` : ''}</title>
      </path>
    </>
  )
}

export default UserConnectionEdge
