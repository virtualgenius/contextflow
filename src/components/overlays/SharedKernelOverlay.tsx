import { useState } from 'react'
import { useViewport } from 'reactflow'
import { useEditorStore } from '../../model/store'
import { createSelectionState } from '../../model/validation'
import type { BoundedContext, Relationship } from '../../model/types'
import { NODE_SIZES } from '../../lib/canvasConstants'
import { computeOverlapRegion, type Box } from '../../lib/sharedKernelGeometry'

type ViewMode = 'flow' | 'strategic' | 'distillation'

const ZOOM_LABEL_CUTOFF = 0.4

const SK_LABEL_CLASSES =
  'text-[10px] font-medium leading-tight whitespace-nowrap px-1.5 py-0.5 rounded bg-white/90 dark:bg-neutral-800/90 border border-slate-200 dark:border-neutral-600 text-slate-600 dark:text-slate-300 shadow-sm'

function getContextBox(context: BoundedContext, viewMode: ViewMode): Box {
  const size = NODE_SIZES[context.codeSize?.bucket || 'medium']
  let x: number
  let y: number
  if (viewMode === 'distillation') {
    x = (context.positions.distillation.x / 100) * 2000
    y = ((100 - context.positions.distillation.y) / 100) * 1000
  } else if (viewMode === 'strategic') {
    x = (context.positions.strategic.x / 100) * 2000
    y = (context.positions.shared.y / 100) * 1000
  } else {
    x = (context.positions.flow.x / 100) * 2000
    y = (context.positions.shared.y / 100) * 1000
  }
  return { x, y, width: size.width, height: size.height }
}

interface SharedKernelOverlayProps {
  contexts: BoundedContext[]
  relationships: Relationship[]
  viewMode: ViewMode
}

export function SharedKernelOverlay({
  contexts,
  relationships,
  viewMode,
}: SharedKernelOverlayProps) {
  const { x: vpX, y: vpY, zoom } = useViewport()
  const selectedRelationshipId = useEditorStore((s) => s.selectedRelationshipId)
  const hoveredRelationshipId = useEditorStore((s) => s.hoveredRelationshipId)
  const setHoveredRelationship = useEditorStore((s) => s.setHoveredRelationship)
  const [hoveredOverlayId, setHoveredOverlayId] = useState<string | null>(null)

  const contextById = new Map(contexts.map((c) => [c.id, c]))

  const regions = relationships
    .filter((rel) => rel.pattern === 'shared-kernel')
    .map((rel) => {
      const from = contextById.get(rel.fromContextId)
      const to = contextById.get(rel.toContextId)
      if (!from || !to) return null
      const boxA = getContextBox(from, viewMode)
      const boxB = getContextBox(to, viewMode)
      const overlap = computeOverlapRegion(boxA, boxB)
      if (!overlap) return null
      return { rel, overlap }
    })
    .filter((entry): entry is { rel: Relationship; overlap: Box } => entry !== null)

  if (regions.length === 0) return null

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 12,
      }}
    >
      {regions.map(({ rel, overlap }) => {
        const isSelected = rel.id === selectedRelationshipId
        const isHovered = rel.id === hoveredRelationshipId || rel.id === hoveredOverlayId
        const isEmphasized = isSelected || isHovered
        const screenX = overlap.x * zoom + vpX
        const screenY = overlap.y * zoom + vpY
        const screenWidth = overlap.width * zoom
        const screenHeight = overlap.height * zoom

        const hatchBaseAlpha = isEmphasized ? 0.32 : 0.2
        const hatchDarkAlpha = isEmphasized ? 0.5 : 0.35
        const borderColor = '#7c3aed'
        const borderWidth = isSelected ? 3 : 2
        const showLabel = zoom >= ZOOM_LABEL_CUTOFF

        // The hatched fill is purely visual and must not intercept pointer
        // events: otherwise users can't drag contexts apart when an SK
        // covers them entirely. The label pill is the SK's interactive
        // surface (click to select, hover to emphasize).
        return (
          <div
            key={`shared-kernel-${rel.id}`}
            data-shared-kernel-id={rel.id}
            style={{
              position: 'absolute',
              left: screenX,
              top: screenY,
              width: screenWidth,
              height: screenHeight,
              background: `repeating-linear-gradient(45deg, rgba(124,58,237,${hatchBaseAlpha}), rgba(124,58,237,${hatchBaseAlpha}) 5px, rgba(124,58,237,${hatchDarkAlpha}) 5px, rgba(124,58,237,${hatchDarkAlpha}) 10px)`,
              borderTop: `${borderWidth}px dashed ${borderColor}`,
              borderBottom: `${borderWidth}px dashed ${borderColor}`,
              outline: isSelected ? `1px solid ${borderColor}` : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            {showLabel && (
              <button
                type="button"
                data-shared-kernel-label={rel.id}
                onClick={(e) => {
                  e.stopPropagation()
                  useEditorStore.setState({
                    ...createSelectionState(rel.id, 'relationship'),
                    selectedContextIds: [rel.fromContextId, rel.toContextId],
                  })
                }}
                onMouseEnter={() => {
                  setHoveredOverlayId(rel.id)
                  setHoveredRelationship(rel.id)
                }}
                onMouseLeave={() => {
                  setHoveredOverlayId(null)
                  setHoveredRelationship(null)
                }}
                className={`${SK_LABEL_CLASSES} cursor-pointer`}
                style={{ pointerEvents: 'auto' }}
              >
                Shared Kernel
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
