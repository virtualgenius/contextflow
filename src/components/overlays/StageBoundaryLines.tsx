import { useViewport } from 'reactflow'

export function StageBoundaryLines({
  stages,
}: {
  stages: Array<{ name: string; position: number }>
}) {
  const { x, y, zoom } = useViewport()

  // Sort stages by position
  const sortedStages = [...stages].sort((a, b) => a.position - b.position)

  // Calculate boundary positions (midpoints between adjacent stages)
  const boundaries: number[] = []
  for (let i = 0; i < sortedStages.length - 1; i++) {
    const midpoint = (sortedStages[i].position + sortedStages[i + 1].position) / 2
    boundaries.push(midpoint)
  }

  if (boundaries.length === 0) return null

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 3,
      }}
    >
      {boundaries.map((position, index) => {
        const xPos = (position / 100) * 2000
        const transformedX = xPos * zoom + x

        return (
          <div
            key={`stage-boundary-${index}`}
            style={{
              position: 'absolute',
              left: transformedX,
              top: 0,
              width: '1px',
              height: `${1000 * zoom}px`,
              background:
                'repeating-linear-gradient(to bottom, rgba(148, 163, 184, 0.3) 0px, rgba(148, 163, 184, 0.3) 5px, transparent 5px, transparent 10px)',
              marginTop: `${y}px`,
            }}
          />
        )
      })}
    </div>
  )
}
