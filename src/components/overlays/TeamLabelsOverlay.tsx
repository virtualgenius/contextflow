import { useViewport } from 'reactflow'
import { Users } from 'lucide-react'
import type { BoundedContext, Team } from '../../model/types'
import { NODE_SIZES } from '../../lib/canvasConstants'

export function TeamLabelsOverlay({
  contexts,
  teams,
  viewMode,
  onTeamClick,
}: {
  contexts: BoundedContext[]
  teams: Team[]
  viewMode: 'flow' | 'strategic' | 'distillation'
  onTeamClick?: (teamId: string) => void
}) {
  const { x, y, zoom } = useViewport()

  // Don't render if zoom is too low (labels become unreadable)
  if (zoom < 0.4) return null

  // Create a map for quick team lookup
  const teamMap = new Map(teams.map(t => [t.id, t]))

  // Filter contexts with team assignments
  const contextsWithTeams = contexts.filter(ctx => ctx.teamId && teamMap.has(ctx.teamId))

  if (contextsWithTeams.length === 0) return null

  // Team topology type colors (Team Topologies inspired)
  const topologyColors: Record<string, { bg: string; border: string; text: string }> = {
    'stream-aligned': { bg: '#f0fdf4', border: '#86efac', text: '#166534' },
    'platform': { bg: '#faf5ff', border: '#d8b4fe', text: '#7c3aed' },
    'enabling': { bg: '#fffbeb', border: '#fcd34d', text: '#b45309' },
    'complicated-subsystem': { bg: '#fef2f2', border: '#fca5a5', text: '#b91c1c' },
    'unknown': { bg: '#f8fafc', border: '#cbd5e1', text: '#475569' },
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 14,
      }}
    >
      {contextsWithTeams.map(context => {
        const team = teamMap.get(context.teamId!)!
        const nodeSize = NODE_SIZES[context.codeSize?.bucket || 'medium']
        const colors = topologyColors[team.topologyType || 'unknown']

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

        // Position label above node center
        const labelX = xPos + nodeSize.width / 2
        const labelY = yPos - 8

        const transformedX = labelX * zoom + x
        const transformedY = labelY * zoom + y

        const truncatedName = team.name.length > 25
          ? team.name.substring(0, 22) + '...'
          : team.name

        return (
          <div
            key={`team-label-${context.id}`}
            onClick={onTeamClick ? (e) => { e.stopPropagation(); onTeamClick(team.id) } : undefined}
            style={{
              position: 'absolute',
              left: transformedX,
              top: transformedY,
              transform: 'translate(-50%, -100%)',
              display: 'flex',
              alignItems: 'center',
              gap: `${3 * zoom}px`,
              padding: `${2 * zoom}px ${6 * zoom}px`,
              backgroundColor: colors.bg,
              border: `${Math.max(1, 1 * zoom)}px solid ${colors.border}`,
              borderRadius: `${4 * zoom}px`,
              fontSize: `${10 * zoom}px`,
              fontWeight: 500,
              color: colors.text,
              whiteSpace: 'nowrap',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              pointerEvents: onTeamClick ? 'auto' : 'none',
              cursor: onTeamClick ? 'pointer' : 'default',
            }}
          >
            <Users size={Math.max(10, 12 * zoom)} />
            <span>{truncatedName}</span>
          </div>
        )
      })}
    </div>
  )
}
