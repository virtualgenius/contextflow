import React from 'react'
import { useViewport } from 'reactflow'
import { useEditorStore } from '../../model/store'

export function StageLabels({ stages }: { stages: Array<{ name: string; position: number; description?: string; owner?: string; notes?: string }> }) {
  const { x, y, zoom } = useViewport()
  const updateFlowStage = useEditorStore(s => s.updateFlowStage)
  const completeFlowStageMove = useEditorStore(s => s.completeFlowStageMove)
  const setSelectedStage = useEditorStore(s => s.setSelectedStage)
  const selectedStageIndex = useEditorStore(s => s.selectedStageIndex)
  const [draggingIndex, setDraggingIndex] = React.useState<number | null>(null)
  const [dragStartX, setDragStartX] = React.useState(0)
  const [dragStartPosition, setDragStartPosition] = React.useState(0)
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null)

  const handleClick = (e: React.MouseEvent, index: number) => {
    e.stopPropagation()
    // Select stage to open inspector panel
    setSelectedStage(index)
  }

  const handleMouseDown = (e: React.MouseEvent, index: number) => {
    setDraggingIndex(index)
    setDragStartX(e.clientX)
    setDragStartPosition(stages[index].position)
    e.preventDefault()
  }

  React.useEffect(() => {
    if (draggingIndex === null) return

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = (e.clientX - dragStartX) / zoom
      const currentPosition = stages[draggingIndex].position
      const newPosition = Math.max(0, Math.min(100, currentPosition + (deltaX / 2000) * 100))

      try {
        updateFlowStage(draggingIndex, { position: Math.round(newPosition * 10) / 10 })
      } catch (err) {
        // Position conflict, ignore
      }
      setDragStartX(e.clientX)
    }

    const handleMouseUp = () => {
      completeFlowStageMove(draggingIndex, dragStartPosition)
      setDraggingIndex(null)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [draggingIndex, dragStartX, dragStartPosition, stages, updateFlowStage, completeFlowStageMove, zoom])

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 5,
      }}
    >
      {stages.map((stage, index) => {
        const xPos = (stage.position / 100) * 2000
        const yPos = -15 // Just above canvas boundary

        const transformedX = xPos * zoom + x
        const transformedY = yPos * zoom + y

        const isDragging = draggingIndex === index
        const isHovered = hoveredIndex === index
        const isSelected = selectedStageIndex === index

        return (
          <div
            key={stage.name}
            className={`text-slate-700 dark:text-slate-200 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} group`}
            style={{
              position: 'absolute',
              left: transformedX,
              top: transformedY,
              transform: 'translate(-50%, -50%)',
              whiteSpace: 'nowrap',
              fontSize: `${22.5 * zoom}px`,
              fontWeight: 600,
              letterSpacing: '-0.01em',
              pointerEvents: 'auto',
              userSelect: 'none',
            }}
            onMouseDown={(e) => handleMouseDown(e, index)}
            onClick={(e) => !isDragging && handleClick(e, index)}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            {/* Stage name with selection underline */}
            <span
              style={{
                textDecoration: isSelected ? 'underline' : 'none',
                textDecorationColor: isSelected ? '#3b82f6' : 'transparent',
                textDecorationThickness: '2px',
                textUnderlineOffset: '4px',
              }}
            >
              {stage.name}
            </span>

            {/* Description tooltip */}
            {isHovered && stage.description && (
              <div
                className="absolute left-1/2 -translate-x-1/2 mt-1 px-2 py-1 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs rounded shadow-lg z-50"
                style={{
                  top: '100%',
                  maxWidth: '300px',
                  whiteSpace: 'normal',
                }}
              >
                {stage.description}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
