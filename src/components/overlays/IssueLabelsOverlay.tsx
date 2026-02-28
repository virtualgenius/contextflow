import { useViewport } from 'reactflow'
import { AlertTriangle, AlertOctagon, Info } from 'lucide-react'
import type { BoundedContext } from '../../model/types'
import { NODE_SIZES } from '../../lib/canvasConstants'

export function IssueLabelsOverlay({
  contexts,
  viewMode,
}: {
  contexts: BoundedContext[]
  viewMode: 'flow' | 'strategic' | 'distillation'
}) {
  const { x, y, zoom } = useViewport()

  // Don't render if zoom is too low (labels become unreadable)
  if (zoom < 0.4) return null

  // Filter contexts with issues
  const contextsWithIssues = contexts.filter((ctx) => ctx.issues && ctx.issues.length > 0)

  if (contextsWithIssues.length === 0) return null

  const severityStyles = {
    critical: { bg: '#fef2f2', border: '#fca5a5', text: '#b91c1c' },
    warning: { bg: '#fffbeb', border: '#fcd34d', text: '#b45309' },
    info: { bg: '#eff6ff', border: '#93c5fd', text: '#1d4ed8' },
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 15,
      }}
    >
      {contextsWithIssues.map((context) => {
        const nodeSize = NODE_SIZES[context.codeSize?.bucket || 'medium']

        // Calculate position based on view mode
        let xPos: number, yPos: number
        if (viewMode === 'distillation') {
          xPos = (context.positions.distillation.x / 100) * 2000
          yPos = ((100 - context.positions.distillation.y) / 100) * 1000
        } else if (viewMode === 'strategic') {
          xPos = (context.positions.strategic.x / 100) * 2000
          yPos = (context.positions.shared.y / 100) * 1000
        } else {
          xPos = (context.positions.flow.x / 100) * 2000
          yPos = (context.positions.shared.y / 100) * 1000
        }

        // Position label below node center
        const labelX = xPos + nodeSize.width / 2
        const labelY = yPos + nodeSize.height + 8

        const transformedX = labelX * zoom + x
        const transformedY = labelY * zoom + y

        // Limit to 3 visible issues
        const visibleIssues = context.issues!.slice(0, 3)
        const remainingCount = context.issues!.length - 3

        return (
          <div
            key={`issue-labels-${context.id}`}
            style={{
              position: 'absolute',
              left: transformedX,
              top: transformedY,
              transform: 'translateX(-50%)',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: `${6 * zoom}px`,
            }}
          >
            {visibleIssues.map((issue) => {
              const colors = severityStyles[issue.severity]

              return (
                <div
                  key={issue.id}
                  style={{
                    padding: `${6 * zoom}px ${8 * zoom}px`,
                    backgroundColor: colors.bg,
                    border: `${Math.max(1, 2 * zoom)}px solid ${colors.border}`,
                    borderRadius: `${4 * zoom}px`,
                    fontSize: `${10 * zoom}px`,
                    fontWeight: 500,
                    color: colors.text,
                    width: `${120 * zoom}px`,
                    minHeight: `${75 * zoom}px`,
                    boxShadow: `0 ${3 * zoom}px ${6 * zoom}px rgba(0,0,0,0.1)`,
                  }}
                >
                  <span
                    style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 6,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      lineHeight: 1.3,
                      wordBreak: 'break-word',
                    }}
                  >
                    <span style={{ float: 'left', marginRight: `${3 * zoom}px` }}>
                      {issue.severity === 'critical' && (
                        <AlertOctagon size={Math.max(10, 12 * zoom)} />
                      )}
                      {issue.severity === 'warning' && (
                        <AlertTriangle size={Math.max(10, 12 * zoom)} />
                      )}
                      {issue.severity === 'info' && <Info size={Math.max(10, 12 * zoom)} />}
                    </span>
                    {issue.title}
                  </span>
                </div>
              )
            })}
            {remainingCount > 0 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: `${6 * zoom}px`,
                  backgroundColor: '#f1f5f9',
                  border: `${Math.max(1, 2 * zoom)}px solid #cbd5e1`,
                  borderRadius: `${4 * zoom}px`,
                  fontSize: `${12 * zoom}px`,
                  fontWeight: 600,
                  color: '#64748b',
                  minHeight: `${75 * zoom}px`,
                  boxShadow: `0 ${3 * zoom}px ${6 * zoom}px rgba(0,0,0,0.1)`,
                }}
              >
                +{remainingCount}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
