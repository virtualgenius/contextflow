import React, { useState } from 'react'
import { getStraightPath, EdgeLabelRenderer, type EdgeProps } from 'reactflow'
import { useEditorStore } from '../../model/store'
import { createSelectionState } from '../../model/validation'
import type { ESConnection } from '../../model/types'

const STROKE_WIDTH = { default: 1.5, selected: 2.5 }
const HIT_AREA_WIDTH = 20

export function ESConnectionEdge({ id, sourceX, sourceY, targetX, targetY, data }: EdgeProps) {
  const [isHovered, setIsHovered] = useState(false)
  const selectedESConnectionId = useEditorStore((s) => s.selectedESConnectionId)
  const isSelected = id === selectedESConnectionId
  const connection = data?.connection as ESConnection | undefined

  const [edgePath, labelX, labelY] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  })

  const color = isSelected ? '#3b82f6' : isHovered ? '#ff9800' : '#e65100'
  const strokeWidth = isSelected ? STROKE_WIDTH.selected : STROKE_WIDTH.default

  return (
    <>
      {/* Visible path */}
      <path
        id={id}
        d={edgePath}
        style={{
          stroke: color,
          strokeWidth,
          fill: 'none',
          transition: 'stroke 0.15s, stroke-width 0.15s',
        }}
        markerEnd="url(#es-arrow)"
      />

      {/* Invisible hit area for easier clicking */}
      <path
        d={edgePath}
        style={{
          stroke: 'transparent',
          strokeWidth: HIT_AREA_WIDTH,
          fill: 'none',
          cursor: 'pointer',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={(e) => {
          e.stopPropagation()
          useEditorStore.setState({
            ...createSelectionState(id, 'esConnection'),
          })
        }}
      />

      {/* Optional label */}
      {connection?.label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              fontSize: 10,
              fontWeight: 500,
              color: '#78350f',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              padding: '1px 5px',
              borderRadius: 3,
              border: '1px solid #e5e7eb',
              pointerEvents: 'none',
            }}
          >
            {connection.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}
