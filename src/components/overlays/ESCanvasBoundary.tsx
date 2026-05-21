import { useViewport } from 'reactflow'

export function ESCanvasBoundary() {
  const { x, y, zoom } = useViewport()

  const canvasWidth = 16000
  const canvasHeight = 9000

  const bx = 0 * zoom + x
  const by = 0 * zoom + y
  const bw = canvasWidth * zoom
  const bh = canvasHeight * zoom

  // Large enough to cover any viewport
  const big = 50000

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        overflow: 'visible',
        zIndex: 1,
      }}
    >
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          overflow: 'visible',
        }}
      >
        <defs>
          <mask id="es-canvas-mask">
            {/* White = show overlay; black = hide overlay (show working area) */}
            <rect x={-big} y={-big} width={big * 2} height={big * 2} fill="white" />
            <rect x={bx} y={by} width={bw} height={bh} fill="black" />
          </mask>
        </defs>

        {/* Outside-boundary tint */}
        <rect
          x={-big}
          y={-big}
          width={big * 2}
          height={big * 2}
          fill="#f1f5f9"
          opacity={0.7}
          mask="url(#es-canvas-mask)"
        />

        {/* Boundary border */}
        <rect
          x={bx}
          y={by}
          width={bw}
          height={bh}
          fill="none"
          stroke="#94a3b8"
          strokeWidth={1.5}
          strokeDasharray="8 5"
          opacity={0.5}
        />
      </svg>
    </div>
  )
}
