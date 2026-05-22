import { ConnectionLineComponentProps, useStore } from 'reactflow'
import { selectAnchorSides, sideMidpoint } from '../lib/edgeGeometry'

// While a connection is being dragged, snap the ghost line's endpoint to
// the closest side midpoint of the hovered target context (via the joint
// anchor algorithm shared with rendered edges in GH #21). Without the snap
// the line follows the cursor and only resolves to the side on drop, which
// makes it unclear where the connection will land. Matches the mockup.
export function StubConnectionLine({
  fromX,
  fromY,
  toX,
  toY,
  fromNode,
}: ConnectionLineComponentProps) {
  const endNodeId = useStore((s) => s.connectionEndHandle?.nodeId ?? null)
  const endHandleId = useStore((s) => s.connectionEndHandle?.handleId ?? null)
  const targetNode = useStore((s) => (endNodeId ? s.nodeInternals.get(endNodeId) : null))

  let endX = toX
  let endY = toY

  if (
    endHandleId === 'body' &&
    targetNode &&
    targetNode.positionAbsolute &&
    targetNode.width &&
    targetNode.height &&
    fromNode &&
    fromNode.positionAbsolute &&
    fromNode.width &&
    fromNode.height
  ) {
    const source = {
      position: fromNode.positionAbsolute,
      width: fromNode.width,
      height: fromNode.height,
    }
    const target = {
      position: targetNode.positionAbsolute,
      width: targetNode.width,
      height: targetNode.height,
    }
    const { targetPos } = selectAnchorSides(source, target)
    const tMid = sideMidpoint(target, targetPos)
    endX = tMid.x
    endY = tMid.y
  }

  return <path d={`M${fromX},${fromY} L${endX},${endY}`} className="react-flow__connection-path" />
}
