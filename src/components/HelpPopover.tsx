import { useEffect } from 'react'
import { X, BookOpen, Keyboard } from 'lucide-react'
import { version } from '../../package.json'

interface HelpPopoverProps {
  onClose: () => void
  onOpenGettingStarted: () => void
  onOpenKeyboardShortcuts: () => void
}

export function HelpPopover({
  onClose,
  onOpenGettingStarted,
  onOpenKeyboardShortcuts,
}: HelpPopoverProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div className="absolute right-0 top-full mt-2 w-60 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg shadow-lg p-4 z-50">
      <div className="flex items-start justify-between mb-2">
        <h2 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          Help
        </h2>
        <button
          onClick={onClose}
          aria-label="Close help"
          className="p-1 -mt-0.5 -mr-0.5 rounded text-slate-400 hover:bg-slate-100 dark:hover:bg-neutral-700 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        >
          <X size={14} />
        </button>
      </div>
      <div className="space-y-0.5">
        <HelpLink
          icon={<BookOpen size={15} />}
          label="Getting Started Guide"
          onClick={onOpenGettingStarted}
        />
        <HelpLink
          icon={<Keyboard size={15} />}
          label="Keyboard Shortcuts"
          onClick={onOpenKeyboardShortcuts}
        />
      </div>
      <div className="mt-3 pt-2 border-t border-slate-200 dark:border-neutral-700">
        <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center">v{version}</p>
      </div>
    </div>
  )
}

interface HelpLinkProps {
  icon: React.ReactNode
  label: string
  onClick: () => void
}

function HelpLink({ icon, label, onClick }: HelpLinkProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 w-full px-2 py-1.5 rounded text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-neutral-700 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
    >
      <span className="text-slate-400 dark:text-slate-500">{icon}</span>
      {label}
    </button>
  )
}
