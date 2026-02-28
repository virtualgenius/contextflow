import { Position } from 'reactflow'

/**
 * Minimal node shape for edge geometry calculations.
 * Compatible with React Flow's Node type.
 */
interface GeometryNode {
  position: { x: number; y: number }
  width?: number | null
  height?: number | null
}

export function getBoxEdgePoint(
  boxCenter: { x: number; y: number },
  boxWidth: number,
  boxHeight: number,
  towardPoint: { x: number; y: number }
): { x: number; y: number } {
  const dx = towardPoint.x - boxCenter.x
  const dy = towardPoint.y - boxCenter.y
  const length = Math.sqrt(dx * dx + dy * dy)

  if (length === 0) return boxCenter

  const nx = dx / length
  const ny = dy / length

  const halfW = boxWidth / 2
  const halfH = boxHeight / 2

  if (Math.abs(nx) * halfH > Math.abs(ny) * halfW) {
    const edgeX = nx > 0 ? halfW : -halfW
    return {
      x: boxCenter.x + edgeX,
      y: boxCenter.y + (ny / Math.abs(nx)) * Math.abs(edgeX),
    }
  } else {
    const edgeY = ny > 0 ? halfH : -halfH
    return {
      x: boxCenter.x + (nx / Math.abs(ny)) * Math.abs(edgeY),
      y: boxCenter.y + edgeY,
    }
  }
}

export function getNodeIntersection(intersectionNode: GeometryNode, targetNode: GeometryNode) {
  const w = intersectionNode.width ?? 0
  const h = intersectionNode.height ?? 0

  const x2 = intersectionNode.position.x + w / 2
  const y2 = intersectionNode.position.y + h / 2
  const x1 = targetNode.position.x + (targetNode.width ?? 0) / 2
  const y1 = targetNode.position.y + (targetNode.height ?? 0) / 2

  const xx1 = (x1 - x2) / (2 * w) - (y1 - y2) / (2 * h)
  const yy1 = (x1 - x2) / (2 * w) + (y1 - y2) / (2 * h)
  const a = 1 / (Math.abs(xx1) + Math.abs(yy1))
  const xx3 = a * xx1
  const yy3 = a * yy1
  const x = w * (xx3 + yy3) + x2
  const y = h * (-xx3 + yy3) + y2

  return { x, y }
}

export function getEdgePosition(node: GeometryNode, intersectionPoint: { x: number; y: number }) {
  const nx = node.position.x
  const ny = node.position.y
  const nw = node.width ?? 0
  const nh = node.height ?? 0

  // Calculate distances to each edge
  const distToLeft = Math.abs(intersectionPoint.x - nx)
  const distToRight = Math.abs(intersectionPoint.x - (nx + nw))
  const distToTop = Math.abs(intersectionPoint.y - ny)
  const distToBottom = Math.abs(intersectionPoint.y - (ny + nh))

  // Return the closest edge
  const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom)

  if (minDist === distToLeft) return Position.Left
  if (minDist === distToRight) return Position.Right
  if (minDist === distToTop) return Position.Top
  return Position.Bottom
}

export function getEdgeParams(source: GeometryNode, target: GeometryNode) {
  const sourceIntersectionPoint = getNodeIntersection(source, target)
  const targetIntersectionPoint = getNodeIntersection(target, source)

  const sourcePos = getEdgePosition(source, sourceIntersectionPoint)
  const targetPos = getEdgePosition(target, targetIntersectionPoint)

  // Calculate handle positions (center of the edge side)
  const sourceX = source.position.x + (source.width ?? 0) / 2
  const sourceY = source.position.y + (source.height ?? 0) / 2
  const targetX = target.position.x + (target.width ?? 0) / 2
  const targetY = target.position.y + (target.height ?? 0) / 2

  // Adjust to edge center based on position
  const sx =
    sourcePos === Position.Left
      ? source.position.x
      : sourcePos === Position.Right
        ? source.position.x + (source.width ?? 0)
        : sourceX
  const sy =
    sourcePos === Position.Top
      ? source.position.y
      : sourcePos === Position.Bottom
        ? source.position.y + (source.height ?? 0)
        : sourceY
  const tx =
    targetPos === Position.Left
      ? target.position.x
      : targetPos === Position.Right
        ? target.position.x + (target.width ?? 0)
        : targetX
  const ty =
    targetPos === Position.Top
      ? target.position.y
      : targetPos === Position.Bottom
        ? target.position.y + (target.height ?? 0)
        : targetY

  return { sx, sy, tx, ty, sourcePos, targetPos }
}
