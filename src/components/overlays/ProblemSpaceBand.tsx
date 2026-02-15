import { useViewport } from 'reactflow'

export function ProblemSpaceBand() {
  const { x, y, zoom } = useViewport()

  const BAND_HEIGHT = 150
  const CANVAS_WIDTH = 2000

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: CANVAS_WIDTH * zoom,
        height: BAND_HEIGHT * zoom,
        backgroundColor: 'rgba(94, 234, 212, 0.12)',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  )
}
