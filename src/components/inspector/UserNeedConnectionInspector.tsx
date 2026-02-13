import React from 'react'
import { ArrowRight, Trash2 } from 'lucide-react'
import { useEditorStore } from '../../model/store'
import type { Project } from '../../model/types'
import { TEXTAREA_CLASS, Section } from './inspectorShared'

export function UserNeedConnectionInspector({ project, connectionId }: { project: Project; connectionId: string }) {
  const deleteUserNeedConnection = useEditorStore(s => s.deleteUserNeedConnection)
  const updateUserNeedConnection = useEditorStore(s => s.updateUserNeedConnection)

  const connection = project.userNeedConnections?.find(c => c.id === connectionId)
  if (!connection) {
    return (
      <div className="text-neutral-500 dark:text-neutral-400">
        Connection not found.
      </div>
    )
  }

  const user = project.users?.find(u => u.id === connection.userId)
  const userNeed = project.userNeeds?.find(n => n.id === connection.userNeedId)

  const handleDeleteConnection = () => {
    if (window.confirm(`Delete connection from "${user?.name}" to "${userNeed?.name}"? This can be undone with Cmd/Ctrl+Z.`)) {
      deleteUserNeedConnection(connection.id)
    }
  }

  const handleNotesChange = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value.trim()
    if (newValue !== connection.notes) {
      updateUserNeedConnection(connection.id, { notes: newValue || undefined })
    }
  }

  return (
    <div className="space-y-5">
      {/* Connection Title */}
      <div className="font-semibold text-base text-slate-900 dark:text-slate-100 leading-tight">
        User → Need Connection
      </div>

      {/* From/To - User and User Need */}
      <Section label="Connection">
        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={() => useEditorStore.setState({ selectedUserId: user?.id, selectedUserNeedConnectionId: null })}
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            {user?.name || 'Unknown'}
          </button>
          <ArrowRight size={14} className="text-slate-400" />
          <button
            onClick={() => useEditorStore.setState({ selectedUserNeedId: userNeed?.id, selectedUserNeedConnectionId: null })}
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            {userNeed?.name || 'Unknown'}
          </button>
        </div>
      </Section>

      {/* Notes (autosaves) */}
      <Section label="Notes">
        <textarea
          defaultValue={connection.notes || ''}
          onBlur={handleNotesChange}
          placeholder="Additional details about this connection..."
          rows={3}
          className={TEXTAREA_CLASS}
        />
      </Section>

      {/* Delete Connection */}
      <div className="pt-2 border-t border-slate-200 dark:border-neutral-700">
        <button
          onClick={handleDeleteConnection}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
        >
          <Trash2 size={14} />
          Delete Connection
        </button>
      </div>
    </div>
  )
}
