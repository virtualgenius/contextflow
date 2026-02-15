import { useViewport } from 'reactflow'

export function CanvasBoundary() {
  const { x, y, zoom } = useViewport()

  // Canvas dimensions
  const canvasWidth = 2000
  const canvasHeight = 1000

  // Transform canvas coordinates to screen coordinates
  const transformedX = 0 * zoom + x
  const transformedY = 0 * zoom + y
  const width = canvasWidth * zoom
  const height = canvasHeight * zoom

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
        <rect
          x={transformedX}
          y={transformedY}
          width={width}
          height={height}
          rx={12 * zoom}
          ry={12 * zoom}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className="text-slate-300 dark:text-neutral-700"
          opacity={0.4}
        />
      </svg>
    </div>
  )
}
