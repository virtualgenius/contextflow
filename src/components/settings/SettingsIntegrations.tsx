import { useState } from 'react'
import { Switch } from '../Switch'

export function SettingsIntegrations() {
  const [useCodeCohesionAPI, setUseCodeCohesionAPI] = useState(() => {
    const stored = localStorage.getItem('contextflow.useCodeCohesionAPI')
    return stored === 'true'
  })

  return (
    <div>
      <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-3">
        Integrations
      </h3>
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-600 dark:text-slate-400">Use CodeCohesion API</span>
        <Switch
          checked={useCodeCohesionAPI}
          onCheckedChange={(checked) => {
            setUseCodeCohesionAPI(checked)
            localStorage.setItem('contextflow.useCodeCohesionAPI', String(checked))
          }}
        />
      </div>
      <p className="text-[10px] text-slate-500 dark:text-slate-500 mt-1">
        Enable live repository stats and contributors
      </p>
    </div>
  )
}
