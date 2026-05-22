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

const SIDES: Position[] = [Position.Top, Position.Right, Position.Bottom, Position.Left]

export const SIDE_NORMALS: Record<Position, { x: number; y: number }> = {
  [Position.Left]: { x: -1, y: 0 },
  [Position.Right]: { x: 1, y: 0 },
  [Position.Top]: { x: 0, y: -1 },
  [Position.Bottom]: { x: 0, y: 1 },
}

const HEMISPHERE_PENALTY = 1.5

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

  const distToLeft = Math.abs(intersectionPoint.x - nx)
  const distToRight = Math.abs(intersectionPoint.x - (nx + nw))
  const distToTop = Math.abs(intersectionPoint.y - ny)
  const distToBottom = Math.abs(intersectionPoint.y - (ny + nh))

  const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom)

  if (minDist === distToLeft) return Position.Left
  if (minDist === distToRight) return Position.Right
  if (minDist === distToTop) return Position.Top
  return Position.Bottom
}

export function sideMidpoint(node: GeometryNode, side: Position): { x: number; y: number } {
  const w = node.width ?? 0
  const h = node.height ?? 0
  const cx = node.position.x + w / 2
  const cy = node.position.y + h / 2
  switch (side) {
    case Position.Left:
      return { x: node.position.x, y: cy }
    case Position.Right:
      return { x: node.position.x + w, y: cy }
    case Position.Top:
      return { x: cx, y: node.position.y }
    case Position.Bottom:
      return { x: cx, y: node.position.y + h }
  }
}

function nodeCenter(node: GeometryNode): { x: number; y: number } {
  return {
    x: node.position.x + (node.width ?? 0) / 2,
    y: node.position.y + (node.height ?? 0) / 2,
  }
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Joint selection of source/target anchor sides.
 *
 * Why: independent per-end selection (using center-to-center direction) picks
 * non-facing sides when contexts have different aspect ratios or sit diagonally,
 * producing wrap-around bezier curves. Joint enumeration of all 16 pairs with a
 * facing-side preference keeps the line on naturally facing sides. See GH #21.
 */
export function selectAnchorSides(
  source: GeometryNode,
  target: GeometryNode
): { sourcePos: Position; targetPos: Position } {
  const cS = nodeCenter(source)
  const cT = nodeCenter(target)
  const dx = cT.x - cS.x
  const dy = cT.y - cS.y
  const len = Math.sqrt(dx * dx + dy * dy) || 1
  const ux = dx / len
  const uy = dy / len

  let bestScore = Infinity
  let bestSource: Position = Position.Right
  let bestTarget: Position = Position.Left

  for (const sSide of SIDES) {
    for (const tSide of SIDES) {
      const pS = sideMidpoint(source, sSide)
      const pT = sideMidpoint(target, tSide)
      const d = distance(pS, pT)
      const nS = SIDE_NORMALS[sSide]
      const nT = SIDE_NORMALS[tSide]
      const sourceFaces = nS.x * ux + nS.y * uy > 0
      const targetFaces = nT.x * -ux + nT.y * -uy > 0
      const facing = sourceFaces && targetFaces
      const score = facing ? d : d * HEMISPHERE_PENALTY
      if (score < bestScore) {
        bestScore = score
        bestSource = sSide
        bestTarget = tSide
      }
    }
  }

  return { sourcePos: bestSource, targetPos: bestTarget }
}

/**
 * Attachment on the outer edge of an ACL/OHS indicator box: the edge of the box
 * facing AWAY from its parent context. Returns the midpoint of that edge plus
 * its outward normal, for use with tangent-aware bezier paths. See contextflow-if3.
 */
export function getIndicatorBoxAttachment(
  boxCenter: { x: number; y: number },
  boxWidth: number,
  boxHeight: number,
  indicatorSide: Position
): { point: { x: number; y: number }; normal: { x: number; y: number } } {
  const halfW = boxWidth / 2
  const halfH = boxHeight / 2
  const normal = SIDE_NORMALS[indicatorSide]
  return {
    point: {
      x: boxCenter.x + normal.x * halfW,
      y: boxCenter.y + normal.y * halfH,
    },
    normal,
  }
}

/**
 * Tangent-aware cubic bezier between two endpoints. Each endpoint's control
 * point lies along the outward tangent at that endpoint, so the path leaves
 * and enters perpendicular to the attachment edges. Control-point distance
 * scales with endpoint distance so a visible perpendicular stub reads at each
 * end before the curve bends. See contextflow-if3.
 */
export function tangentBezierPath(
  a: { x: number; y: number },
  b: { x: number; y: number },
  aTangent: { x: number; y: number },
  bTangent: { x: number; y: number }
): string {
  const dist = Math.hypot(b.x - a.x, b.y - a.y)
  const k = Math.max(60, dist * 0.5)
  const c1x = a.x + aTangent.x * k
  const c1y = a.y + aTangent.y * k
  const c2x = b.x + bTangent.x * k
  const c2y = b.y + bTangent.y * k
  return `M ${a.x},${a.y} C ${c1x},${c1y} ${c2x},${c2y} ${b.x},${b.y}`
}

/**
 * Pull the path endpoint back by `length` along the outward normal of `targetPos`,
 * so the bezier tail ends at the back of the arrow marker rather than at the
 * box edge under it. See GH #24.
 */
export function shortenEdgeEndpoint(
  x: number,
  y: number,
  targetPos: Position,
  length: number
): { x: number; y: number } {
  const n = SIDE_NORMALS[targetPos]
  return { x: x + n.x * length, y: y + n.y * length }
}

export function getEdgeParams(source: GeometryNode, target: GeometryNode) {
  const { sourcePos, targetPos } = selectAnchorSides(source, target)
  const sourceMid = sideMidpoint(source, sourcePos)
  const targetMid = sideMidpoint(target, targetPos)
  return {
    sx: sourceMid.x,
    sy: sourceMid.y,
    tx: targetMid.x,
    ty: targetMid.y,
    sourcePos,
    targetPos,
  }
}
