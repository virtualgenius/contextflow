import { useViewport } from 'reactflow'
import { PROBLEM_SPACE_HEIGHT } from '../../lib/canvasConstants'

export function ProblemSpaceBand() {
  const { x, y, zoom } = useViewport()

  const CANVAS_WIDTH = 2000

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: CANVAS_WIDTH * zoom,
        height: PROBLEM_SPACE_HEIGHT * zoom,
        backgroundColor: 'rgba(94, 234, 212, 0.12)',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  )
}
