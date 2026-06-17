import { Crosshair, X } from 'lucide-react'
import { Z_LAYERS } from '../lib/zLayers'

export interface FocusSubject {
  kind: 'team' | 'context'
  label: string
  color: string
}

interface FocusBarProps {
  subject: FocusSubject
  onExit: () => void
}

/**
 * Overlay shown while a focus is active. Presentational: it names the focused
 * subject and offers a single off switch. Later slices grow it (hop stepper,
 * "N of M" count, subject switcher) by adding props, not by rewriting markup,
 * so it takes the subject as input rather than reading the store itself.
 */
export function FocusBar({ subject, onExit }: FocusBarProps) {
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
