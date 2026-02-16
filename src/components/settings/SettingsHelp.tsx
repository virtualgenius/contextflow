import { useEditorStore } from '../../model/store'
import { Switch } from '../Switch'

interface SettingsHelpProps {
  onOpenGettingStarted: () => void
  onOpenKeyboardShortcuts: () => void
}

export function SettingsHelp({ onOpenGettingStarted, onOpenKeyboardShortcuts }: SettingsHelpProps) {
  const showHelpTooltips = useEditorStore(s => s.showHelpTooltips)
  const toggleHelpTooltips = useEditorStore(s => s.toggleHelpTooltips)

  return (
    <div>
      <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-3">Help</h3>

      <button
        onClick={onOpenGettingStarted}
        className="block text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
      >
        Getting Started Guide
      </button>

      <button
        onClick={onOpenKeyboardShortcuts}
        className="block mt-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
      >
        Keyboard Shortcuts
      </button>

      <div className="flex items-center justify-between mt-3">
        <span className="text-xs text-slate-600 dark:text-slate-400">Show concept tooltips</span>
        <Switch checked={showHelpTooltips} onCheckedChange={() => toggleHelpTooltips()} />
      </div>
      <p className="text-[10px] text-slate-500 dark:text-slate-500 mt-1">
        Hover explanations for DDD & Wardley concepts
      </p>
    </div>
  )
}
