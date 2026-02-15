import { useViewport } from 'reactflow'
import { Users } from 'lucide-react'
import type { BoundedContext, Team } from '../../model/types'
import { NODE_SIZES } from '../../lib/canvasConstants'
import { getTopologyColors } from '../../lib/teamColors'
import { SimpleTooltip } from '../SimpleTooltip'
import { TEAM_TOPOLOGIES } from '../../model/conceptDefinitions'

const TOPOLOGY_SHORT_LABELS: Record<string, string> = {
  'stream-aligned': 'Stream',
  'platform': 'Platform',
  'enabling': 'Enabling',
  'complicated-subsystem': 'Subsystem',
}

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
        const colors = getTopologyColors(team.topologyType).light

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

        const topologyDef = team.topologyType && team.topologyType !== 'unknown'
          ? TEAM_TOPOLOGIES[team.topologyType]
          : null
        const tooltipText = topologyDef
          ? `${topologyDef.title}: ${topologyDef.description}`
          : team.name

        return (
          <SimpleTooltip key={`team-label-${context.id}`} text={tooltipText} position="top">
            <div
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
                pointerEvents: 'auto',
                cursor: onTeamClick ? 'pointer' : 'default',
              }}
            >
              <Users size={Math.max(10, 12 * zoom)} />
              <span>{truncatedName}</span>
              {team.topologyType && team.topologyType !== 'unknown' && (
                <span style={{
                  fontSize: `${8 * zoom}px`,
                  opacity: 0.7,
                  fontWeight: 400,
                }}>
                  ({TOPOLOGY_SHORT_LABELS[team.topologyType]})
                </span>
              )}
            </div>
          </SimpleTooltip>
        )
      })}
    </div>
  )
}
