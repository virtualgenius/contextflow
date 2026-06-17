import React from 'react'
import { Check, ChevronDown, Crosshair, X } from 'lucide-react'
import { Z_LAYERS } from '../lib/zLayers'

export interface FocusSubject {
  kind: 'team' | 'context'
  label: string
  color: string
}

export interface FocusTeamOption {
  id: string
  name: string
  color: string
  count: number
}

export const FOCUS_MAX_DEPTH = 2

// Subject-aware hop labels. The neighborhood grows outward by relationship hops;
// the seed wording differs by subject so depth 0 reads naturally for each.
const HOP_LABELS: Record<FocusSubject['kind'], string[]> = {
  team: ["team's contexts", '+ neighbors', '+2 hops'],
  context: ['just this', '+1 hop', '+2 hops'],
}

interface FocusBarProps {
  subject: FocusSubject
  depth: number
  onDepthChange: (depth: number) => void
  visibleCount: number
  totalCount: number
  onExit: () => void
  // Team switcher (team focus only): the teams a user can hop to, the currently
  // focused team, and the switch handler. Omitted/empty renders a static pill.
  teamOptions?: FocusTeamOption[]
  currentTeamId?: string
  onSwitchTeam?: (teamId: string) => void
}

function SubjectGlyph({ subject }: { subject: FocusSubject }) {
  return (
    <span
      className={`w-2.5 h-2.5 flex-shrink-0 ${
        subject.kind === 'context' ? 'rounded-[2px]' : 'rounded-full'
      }`}
      style={{ backgroundColor: subject.color }}
    />
  )
}

/**
 * The focused-subject pill. For a team focus with switch options it becomes a
 * dropdown to hop between teams; otherwise it is a static label. Team-hopping
 * lives here (not the sidebar) so focus never shifts the canvas layout.
 */
function SubjectPill({
  subject,
  teamOptions,
  currentTeamId,
  onSwitchTeam,
}: Pick<FocusBarProps, 'subject' | 'teamOptions' | 'currentTeamId' | 'onSwitchTeam'>) {
  const [isOpen, setIsOpen] = React.useState(false)
  const canSwitch = subject.kind === 'team' && !!teamOptions?.length && !!onSwitchTeam

  // Close on outside click or Esc. Esc is handled in the capture phase and its
  // propagation stopped so the canvas-level Esc (exit focus) does not also fire:
  // one key, one action. With the switcher closed, Esc falls through to exit.
  React.useEffect(() => {
    if (!isOpen) return
    const close = () => setIsOpen(false)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        e.preventDefault()
        setIsOpen(false)
      }
    }
    window.addEventListener('click', close)
    window.addEventListener('keydown', handleKeyDown, true)
    return () => {
      window.removeEventListener('click', close)
      window.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [isOpen])

  const pillClasses =
    'inline-flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-md px-2 py-0.5'

  if (!canSwitch) {
    return (
      <span className={pillClasses}>
        <SubjectGlyph subject={subject} />
        <span>{subject.label}</span>
      </span>
    )
  }

  return (
    <div className="relative">
      <button
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen((open) => !open)
        }}
        className={`${pillClasses} hover:bg-slate-100 dark:hover:bg-neutral-700 transition-colors`}
      >
        <SubjectGlyph subject={subject} />
        <span>{subject.label}</span>
        <ChevronDown size={12} className="text-slate-400" />
      </button>

      {isOpen && (
        <div
          role="listbox"
          onClick={(e) => e.stopPropagation()}
          className="absolute left-0 top-full mt-1 min-w-[200px] max-h-64 overflow-y-auto bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-md shadow-lg py-1"
        >
          {teamOptions!.map((team) => {
            const isCurrent = team.id === currentTeamId
            return (
              <button
                key={team.id}
                role="option"
                aria-selected={isCurrent}
                onClick={(e) => {
                  e.stopPropagation()
                  setIsOpen(false)
                  if (!isCurrent) onSwitchTeam!(team.id)
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-neutral-700"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: team.color }}
                />
                <span className="flex-1 font-medium truncate">{team.name}</span>
                <span className="text-slate-400 dark:text-neutral-500 tabular-nums">
                  {team.count}
                </span>
                {isCurrent && <Check size={12} className="text-blue-600 dark:text-blue-400" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

/**
 * Overlay shown while a focus is active. Presentational: it names the focused
 * subject, lets the neighborhood widen by adjacency hops, and reports how much
 * of the map is in focus. Takes the subject as input so entry points (team card,
 * context menu) and the team switcher reuse it without a rewrite.
 */
export function FocusBar({
  subject,
  depth,
  onDepthChange,
  visibleCount,
  totalCount,
  onExit,
  teamOptions,
  currentTeamId,
  onSwitchTeam,
}: FocusBarProps) {
  const hopLabels = HOP_LABELS[subject.kind]

  return (
    <div
      data-testid="focus-bar"
      style={{ zIndex: Z_LAYERS.floating }}
      className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-2.5 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg shadow-md px-2.5 py-1.5 text-xs"
    >
      <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
        <Crosshair size={14} />
        <span className="font-medium text-slate-500 dark:text-neutral-400">Focused on</span>
      </span>

      <SubjectPill
        subject={subject}
        teamOptions={teamOptions}
        currentTeamId={currentTeamId}
        onSwitchTeam={onSwitchTeam}
      />

      <div className="w-px h-5 bg-slate-200 dark:bg-neutral-700" />

      <span className="text-slate-500 dark:text-neutral-400 font-medium">Adjacency</span>
      <div className="flex items-center bg-slate-100 dark:bg-neutral-900 rounded-md p-0.5">
        {hopLabels.map((label, hop) => {
          const isActive = hop === depth
          return (
            <button
              key={hop}
              aria-pressed={isActive}
              onClick={() => onDepthChange(hop)}
              className={`px-2 py-0.5 text-[11px] font-medium rounded transition-colors ${
                isActive
                  ? 'bg-white dark:bg-neutral-700 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {label}
            </button>
          )
        })}
      </div>

      <div className="w-px h-5 bg-slate-200 dark:bg-neutral-700" />

      <span className="text-slate-500 dark:text-neutral-400 tabular-nums">
        {visibleCount} of {totalCount} shown
      </span>

      <button
        onClick={onExit}
        className="ml-0.5 flex items-center gap-1 px-1.5 py-0.5 rounded text-slate-500 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-700 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
      >
        <X size={14} />
        <span className="font-medium">Exit focus</span>
      </button>
    </div>
  )
}
