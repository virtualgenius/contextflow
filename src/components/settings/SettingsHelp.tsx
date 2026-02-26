import { useState } from 'react'
import { useEditorStore } from '../../model/store'
import { Switch } from '../Switch'
import { isAnalyticsEnabled, setAnalyticsEnabled, getAnalyticsPreference, getDeploymentContext } from '../../utils/analytics'
import { ChevronRight } from 'lucide-react'

interface SettingsHelpProps {
  onOpenGettingStarted: () => void
  onOpenKeyboardShortcuts: () => void
}

export function SettingsHelp({ onOpenGettingStarted, onOpenKeyboardShortcuts }: SettingsHelpProps) {
  const showHelpTooltips = useEditorStore(s => s.showHelpTooltips)
  const toggleHelpTooltips = useEditorStore(s => s.toggleHelpTooltips)
  const [analyticsOn, setAnalyticsOn] = useState(isAnalyticsEnabled)
  const [showDetails, setShowDetails] = useState(false)

  const deployment = getDeploymentContext()
  const hasExplicitPreference = getAnalyticsPreference() !== null
  const defaultLabel = deployment === 'hosted_demo' ? 'on' : 'off'

  function handleAnalyticsToggle(checked: boolean) {
    setAnalyticsOn(checked)
    setAnalyticsEnabled(checked)
  }

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

      <div className="flex items-center justify-between mt-3">
        <span className="text-xs text-slate-600 dark:text-slate-400">Anonymous usage analytics</span>
        <Switch checked={analyticsOn} onCheckedChange={handleAnalyticsToggle} />
      </div>
      <p className="text-[10px] text-slate-500 dark:text-slate-500 mt-1">
        Help improve ContextFlow by sharing anonymous usage data (no personal information)
        {!hasExplicitPreference && (
          <span className="text-slate-400 dark:text-slate-600"> · Default: {defaultLabel}</span>
        )}
      </p>

      <button
        onClick={() => setShowDetails(v => !v)}
        className="flex items-center gap-0.5 mt-2 text-[10px] text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
      >
        <ChevronRight
          className={`h-3 w-3 transition-transform duration-150 ${showDetails ? 'rotate-90' : ''}`}
        />
        What we track
      </button>

      {showDetails && (
        <div className="mt-1.5 ml-3.5 text-[10px] text-slate-500 dark:text-slate-500 space-y-1.5">
          <div>
            <p className="font-medium text-slate-600 dark:text-slate-400">We track:</p>
            <ul className="list-disc ml-3 space-y-0.5">
              <li>Feature usage (which views, tools, and actions you use)</li>
              <li>Project size metrics (counts of contexts, relationships, teams, etc.)</li>
              <li>Deployment type (cloud vs self-hosted) and app version</li>
              <li>First-time user milestones</li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-slate-600 dark:text-slate-400">We never track:</p>
            <ul className="list-disc ml-3 space-y-0.5">
              <li>Project names, context names, team names, or any text you type</li>
              <li>IP addresses or browser fingerprints</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
