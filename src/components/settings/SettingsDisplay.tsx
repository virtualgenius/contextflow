import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../../hooks/useTheme'
import { Switch } from '../Switch'

export function SettingsDisplay() {
  const { theme, toggleTheme } = useTheme()

  return (
    <div>
      <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-3">Display</h3>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {theme === 'light' ? (
            <Sun size={14} className="text-slate-600 dark:text-slate-400" />
          ) : (
            <Moon size={14} className="text-slate-600 dark:text-slate-400" />
          )}
          <span className="text-xs text-slate-600 dark:text-slate-400">
            {theme === 'light' ? 'Light Mode' : 'Dark Mode'}
          </span>
        </div>
        <Switch checked={theme === 'dark'} onCheckedChange={() => toggleTheme()} />
      </div>
    </div>
  )
}
