import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Switch } from '../Switch'
import { trackEvent } from '../../utils/analytics'

const ANTHROPIC_KEY_STORAGE = 'contextflow.anthropicApiKey'

export function SettingsIntegrations() {
  const [useCodeCohesionAPI, setUseCodeCohesionAPI] = useState(() => {
    const stored = localStorage.getItem('contextflow.useCodeCohesionAPI')
    return stored === 'true'
  })

  const [anthropicKey, setAnthropicKey] = useState(() => {
    return localStorage.getItem(ANTHROPIC_KEY_STORAGE) ?? ''
  })
  const [showKey, setShowKey] = useState(false)
  const [keySaved, setKeySaved] = useState(false)

  const handleKeySave = () => {
    const trimmed = anthropicKey.trim()
    localStorage.setItem(ANTHROPIC_KEY_STORAGE, trimmed)
    setAnthropicKey(trimmed)
    setKeySaved(true)
    trackEvent('integration_toggled', null, { integration: 'anthropic_api_key', enabled: trimmed.length > 0 })
    setTimeout(() => setKeySaved(false), 2000)
  }

  const handleKeyChange = (value: string) => {
    setAnthropicKey(value)
    setKeySaved(false)
  }

  return (
    <div className="space-y-5">
      {/* AI Assistant section */}
      <div>
        <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-3">
          AI Assistant
        </h3>
        <div>
          <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1.5">
            Anthropic API Key
          </label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type={showKey ? 'text' : 'password'}
                value={anthropicKey}
                onChange={(e) => handleKeyChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleKeySave()}
                placeholder="sk-ant-…"
                autoComplete="off"
                spellCheck={false}
                className="w-full text-xs px-2.5 py-1.5 pr-8 rounded border border-slate-200 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-400 dark:focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                tabIndex={-1}
                title={showKey ? 'Hide key' : 'Show key'}
              >
                {showKey ? <EyeOff size={12} /> : <Eye size={12} />}
              </button>
            </div>
            <button
              onClick={handleKeySave}
              className={`flex-shrink-0 text-xs px-2.5 py-1.5 rounded font-medium transition-colors ${
                keySaved
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {keySaved ? 'Saved' : 'Save'}
            </button>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-500 mt-1.5 leading-relaxed">
            Used by the ES Assistant to suggest stickies on your Event Storming canvas.
            Your key is stored locally and never sent to our servers.
          </p>
        </div>
      </div>

      {/* CodeCohesion section */}
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
              trackEvent('integration_toggled', null, {
                integration: 'codecohesion',
                enabled: checked,
              })
            }}
          />
        </div>
        <p className="text-[10px] text-slate-500 dark:text-slate-500 mt-1">
          Enable live repository stats and contributors
        </p>
      </div>
    </div>
  )
}
