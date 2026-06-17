import { Crosshair, X } from 'lucide-react'
import { Z_LAYERS } from '../lib/zLayers'

export interface FocusSubject {
  kind: 'team' | 'context'
  label: string
  color: string
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
}

/**
 * Overlay shown while a focus is active. Presentational: it names the focused
 * subject, lets the neighborhood widen by adjacency hops, and reports how much
 * of the map is in focus. Takes the subject as input so entry points (team card,
 * context menu) and future controls (switcher) reuse it without a rewrite.
 */
export function FocusBar({
  subject,
  depth,
  onDepthChange,
  visibleCount,
  totalCount,
  onExit,
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

      <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-md px-2 py-0.5">
        <span
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: subject.color }}
        />
        <span>{subject.label}</span>
      </span>

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
