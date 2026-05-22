import React, { useEffect } from 'react'
import { X } from 'lucide-react'
import { SettingsViewOptions } from './SettingsViewOptions'
import { SettingsHelp } from './SettingsHelp'
import { SettingsDisplay } from './SettingsDisplay'
import { SettingsIntegrations } from './SettingsIntegrations'

interface SettingsPopoverProps {
  onClose: () => void
  onOpenGettingStarted: () => void
  onOpenKeyboardShortcuts: () => void
}

export function SettingsPopover({
  onClose,
  onOpenGettingStarted,
  onOpenKeyboardShortcuts,
}: SettingsPopoverProps) {
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
    <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg shadow-lg p-4 z-50">
      <div className="flex items-start justify-between mb-1">
        <h2 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          Settings
        </h2>
        <button
          onClick={onClose}
          aria-label="Close settings"
          className="p-1 -mt-0.5 -mr-0.5 rounded text-slate-400 hover:bg-slate-100 dark:hover:bg-neutral-700 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        >
          <X size={14} />
        </button>
      </div>
      <div className="space-y-4">
        <SettingsViewOptions />
        <div className="border-t border-slate-200 dark:border-neutral-700" />
        <SettingsHelp
          onOpenGettingStarted={onOpenGettingStarted}
          onOpenKeyboardShortcuts={onOpenKeyboardShortcuts}
        />
        <div className="border-t border-slate-200 dark:border-neutral-700" />
        <SettingsDisplay />
        <div className="border-t border-slate-200 dark:border-neutral-700" />
        <SettingsIntegrations />
      </div>
    </div>
  )
}
