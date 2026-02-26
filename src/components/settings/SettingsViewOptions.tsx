import { useEditorStore } from '../../model/store'
import { useTheme } from '../../hooks/useTheme'
import { Switch } from '../Switch'

export function SettingsViewOptions() {
  const showGroups = useEditorStore(s => s.showGroups)
  const showRelationships = useEditorStore(s => s.showRelationships)
  const showIssueLabels = useEditorStore(s => s.showIssueLabels)
  const showTeamLabels = useEditorStore(s => s.showTeamLabels)
  const showRelationshipLabels = useEditorStore(s => s.showRelationshipLabels)
  const toggleShowGroups = useEditorStore(s => s.toggleShowGroups)
  const toggleShowRelationships = useEditorStore(s => s.toggleShowRelationships)
  const toggleIssueLabels = useEditorStore(s => s.toggleIssueLabels)
  const toggleTeamLabels = useEditorStore(s => s.toggleTeamLabels)
  const toggleRelationshipLabels = useEditorStore(s => s.toggleRelationshipLabels)
  const groupOpacity = useEditorStore(s => s.groupOpacity)
  const setGroupOpacity = useEditorStore(s => s.setGroupOpacity)
  const colorByMode = useEditorStore(s => s.colorByMode)
  const setColorByMode = useEditorStore(s => s.setColorByMode)
  const { theme } = useTheme()

  return (
    <div>
      <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-3">View Options</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-xs text-slate-600 dark:text-slate-400 mb-2">
            Context Colors
          </label>
          <div className="flex gap-1 bg-slate-100 dark:bg-neutral-700 rounded-md p-1">
            <button
              onClick={() => setColorByMode('ownership')}
              className={`flex-1 text-xs py-1.5 px-2 rounded transition-colors ${
                colorByMode === 'ownership'
                  ? 'bg-white dark:bg-neutral-600 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Ownership
            </button>
            <button
              onClick={() => setColorByMode('strategic')}
              className={`flex-1 text-xs py-1.5 px-2 rounded transition-colors ${
                colorByMode === 'strategic'
                  ? 'bg-white dark:bg-neutral-600 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Strategic
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-600 dark:text-slate-400">Show Groups</span>
            <Switch checked={showGroups} onCheckedChange={() => toggleShowGroups()} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-600 dark:text-slate-400">Show Relationships</span>
            <Switch checked={showRelationships} onCheckedChange={() => toggleShowRelationships()} />
          </div>
          <div className="flex items-center justify-between pl-3">
            <span className="text-xs text-slate-600 dark:text-slate-400">Show Relationship Labels</span>
            <Switch checked={showRelationshipLabels} onCheckedChange={() => toggleRelationshipLabels()} />
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-500 mt-1">
            Available in Flow & Strategic views
          </p>
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-slate-600 dark:text-slate-400">Show Issue Labels</span>
            <Switch checked={showIssueLabels} onCheckedChange={() => toggleIssueLabels()} />
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-500 mt-1">
            Display issue titles on canvas
          </p>
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-slate-600 dark:text-slate-400">Show Team Labels</span>
            <Switch checked={showTeamLabels} onCheckedChange={() => toggleTeamLabels()} />
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-500 mt-1">
            Display team names on canvas
          </p>
        </div>
        <div>
          <label className="block text-xs text-slate-600 dark:text-slate-400 mb-2">
            Group Opacity: {Math.round(groupOpacity * 100)}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={groupOpacity * 100}
            onChange={(e) => setGroupOpacity(parseInt(e.target.value) / 100, { skipAnalytics: true })}
            onPointerUp={(e) => {
              const value = parseInt((e.target as HTMLInputElement).value) / 100
              setGroupOpacity(value)
            }}
            className="w-full h-2 bg-slate-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer"
            style={{
              accentColor: theme === 'light' ? '#3b82f6' : '#60a5fa'
            }}
          />
        </div>
      </div>
    </div>
  )
}
