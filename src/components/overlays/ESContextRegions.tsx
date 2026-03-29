import React from 'react'
import { useViewport } from 'reactflow'
import type { Project } from '../../model/types'

const STRATEGIC_COLORS: Record<string, string> = {
  core: 'rgba(248, 231, 161, 0.25)',
  supporting: 'rgba(219, 234, 254, 0.25)',
  generic: 'rgba(243, 244, 246, 0.25)',
}

const BORDER_COLORS: Record<string, string> = {
  core: 'rgba(248, 231, 161, 0.6)',
  supporting: 'rgba(219, 234, 254, 0.6)',
  generic: 'rgba(243, 244, 246, 0.6)',
}

export function ESContextRegions({ project }: { project: Project }) {
  const { x, y, zoom } = useViewport()

  const es = project.eventStorming
  if (!es?.enabled) return null

  // Group aggregates by contextId
  const contextGroups = new Map<string, { x: number; y: number }[]>()
  for (const agg of es.aggregates) {
    if (!agg.contextId) continue
    if (!contextGroups.has(agg.contextId)) {
      contextGroups.set(agg.contextId, [])
    }
    contextGroups.get(agg.contextId)!.push(agg.position)
  }

  if (contextGroups.size === 0) return null

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', zIndex: 1 }}>
      {Array.from(contextGroups.entries()).map(([contextId, positions]) => {
        const ctx = project.contexts.find((c) => c.id === contextId)
        if (!ctx) return null

        // Compute bounding box with padding
        const padding = 40
        const xs = positions.map((p) => (p.x / 100) * 2000)
        const ys = positions.map((p) => (p.y / 100) * 1000)
        const minX = Math.min(...xs) - padding
        const maxX = Math.max(...xs) + 140 + padding // 140 = sticky width
        const minY = Math.min(...ys) - padding
        const maxY = Math.max(...ys) + 100 + padding // 100 = sticky height

        const classification = ctx.strategicClassification || 'generic'
        const bgColor = STRATEGIC_COLORS[classification] || STRATEGIC_COLORS.generic
        const borderColor = BORDER_COLORS[classification] || BORDER_COLORS.generic

        return (
          <div
            key={contextId}
            style={{
              position: 'absolute',
              left: minX * zoom + x,
              top: minY * zoom + y,
              width: (maxX - minX) * zoom,
              height: (maxY - minY) * zoom,
              backgroundColor: bgColor,
              border: `1.5px dashed ${borderColor}`,
              borderRadius: 8,
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 4,
                left: 8,
                fontSize: 10,
                fontWeight: 600,
                color: '#64748b',
                backgroundColor: 'rgba(255,255,255,0.8)',
                padding: '1px 6px',
                borderRadius: 3,
                pointerEvents: 'auto',
              }}
            >
              {ctx.name}
            </div>
          </div>
        )
      })}
    </div>
  )
}
