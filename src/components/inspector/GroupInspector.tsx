import React from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import { useEditorStore } from '../../model/store'
import type { Project } from '../../model/types'
import { SimpleTooltip } from '../SimpleTooltip'
import { INPUT_TITLE_CLASS, TEXTAREA_CLASS, Section } from './inspectorShared'

export function GroupInspector({ project, groupId }: { project: Project; groupId: string }) {
  const updateGroup = useEditorStore(s => s.updateGroup)
  const deleteGroup = useEditorStore(s => s.deleteGroup)
  const removeContextFromGroup = useEditorStore(s => s.removeContextFromGroup)
  const addContextToGroup = useEditorStore(s => s.addContextToGroup)
  const addContextsToGroup = useEditorStore(s => s.addContextsToGroup)

  const group = project.groups.find(g => g.id === groupId)
  if (!group) {
    return (
      <div className="text-neutral-500 dark:text-neutral-400">
        Group not found.
      </div>
    )
  }

  const handleDeleteGroup = () => {
    if (window.confirm(`Delete group "${group.label}"? Member contexts will not be deleted. This can be undone with Cmd/Ctrl+Z.`)) {
      deleteGroup(group.id)
    }
  }

  const memberContexts = project.contexts.filter(c => group.contextIds.includes(c.id))
  const availableContexts = project.contexts.filter(c => !group.contextIds.includes(c.id))

  const handleAddAllContexts = () => {
    if (availableContexts.length > 0) {
      addContextsToGroup(group.id, availableContexts.map(c => c.id))
    }
  }

  return (
    <div className="space-y-5">
      {/* Label */}
      <div>
        <input
          type="text"
          value={group.label}
          onChange={(e) => updateGroup(group.id, { label: e.target.value })}
          className={INPUT_TITLE_CLASS}
        />
      </div>

      {/* Notes */}
      <Section label="Notes">
        <textarea
          value={group.notes || ''}
          onChange={(e) => updateGroup(group.id, { notes: e.target.value })}
          placeholder="Describe this group..."
          rows={2}
          className={TEXTAREA_CLASS}
        />
      </Section>

      {/* Member Contexts */}
      <Section label={`Member Contexts (${memberContexts.length})`}>
        <div className="space-y-1">
          {memberContexts.map(context => (
            <div
              key={context.id}
              className="flex items-center gap-2 group"
            >
              <button
                onClick={() => useEditorStore.setState({ selectedContextId: context.id, selectedGroupId: null })}
                className="flex-1 text-left px-2 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-neutral-700 text-slate-700 dark:text-slate-300 text-xs"
              >
                {context.name}
              </button>
              <SimpleTooltip text="Remove this context from the group">
                <button
                  onClick={() => removeContextFromGroup(group.id, context.id)}
                  className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <X size={12} />
                </button>
              </SimpleTooltip>
            </div>
          ))}
        </div>
      </Section>

      {/* Add Contexts to Group */}
      {availableContexts.length > 0 && (
        <Section label={`Add Contexts (${availableContexts.length} available)`}>
          <div className="space-y-2">
            <div className="space-y-1">
              {availableContexts.map(context => (
                <button
                  key={context.id}
                  onClick={() => addContextToGroup(group.id, context.id)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-700 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-300 text-xs transition-colors text-left"
                >
                  <Plus size={12} className="flex-shrink-0" />
                  {context.name}
                </button>
              ))}
            </div>
            <button
              onClick={handleAddAllContexts}
              className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors border border-blue-200 dark:border-blue-800"
            >
              <Plus size={12} />
              Add All Available
            </button>
          </div>
        </Section>
      )}

      {/* Delete Group - at bottom to avoid confusion with close button */}
      <div className="pt-2 border-t border-slate-200 dark:border-neutral-700">
        <button
          onClick={handleDeleteGroup}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
        >
          <Trash2 size={14} />
          Delete Group
        </button>
      </div>
    </div>
  )
}
