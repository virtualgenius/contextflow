import React from 'react'
import { Trash2, X } from 'lucide-react'
import { useEditorStore } from '../../model/store'
import type { Project } from '../../model/types'
import { SimpleTooltip } from '../SimpleTooltip'
import { INPUT_TITLE_CLASS, TEXTAREA_CLASS, Section } from './inspectorShared'

export function UserNeedInspector({ project, userNeedId }: { project: Project; userNeedId: string }) {
  const updateUserNeed = useEditorStore(s => s.updateUserNeed)
  const deleteUserNeed = useEditorStore(s => s.deleteUserNeed)
  const deleteUserNeedConnection = useEditorStore(s => s.deleteUserNeedConnection)
  const deleteNeedContextConnection = useEditorStore(s => s.deleteNeedContextConnection)

  const userNeed = project.userNeeds?.find(n => n.id === userNeedId)
  if (!userNeed) {
    return (
      <div className="text-neutral-500 dark:text-neutral-400">
        User Need not found.
      </div>
    )
  }

  // Find connections for this user need
  const userConnections = (project.userNeedConnections || []).filter(c => c.userNeedId === userNeed.id)
  const connectedUsers = userConnections.map(conn => {
    const user = project.users?.find(u => u.id === conn.userId)
    return { connection: conn, user }
  }).filter(item => item.user)

  const contextConnections = (project.needContextConnections || []).filter(c => c.userNeedId === userNeed.id)
  const connectedContexts = contextConnections.map(conn => {
    const context = project.contexts.find(c => c.id === conn.contextId)
    return { connection: conn, context }
  }).filter(item => item.context)

  const handleUpdate = (updates: Partial<typeof userNeed>) => {
    updateUserNeed(userNeed.id, updates)
  }

  const handleDelete = () => {
    if (confirm(`Delete user need "${userNeed.name}"?`)) {
      deleteUserNeed(userNeed.id)
    }
  }

  return (
    <div className="space-y-4">
      {/* Name */}
      <Section label="User Need">
        <input
          type="text"
          value={userNeed.name}
          onChange={(e) => handleUpdate({ name: e.target.value })}
          className={INPUT_TITLE_CLASS}
        />
      </Section>

      {/* Description */}
      <Section label="Description">
        <textarea
          value={userNeed.description || ''}
          onChange={(e) => handleUpdate({ description: e.target.value })}
          placeholder="Describe this user need..."
          rows={2}
          className={TEXTAREA_CLASS}
        />
      </Section>

      {/* Connected Users */}
      <Section label={`Users (${connectedUsers.length})`}>
        <div className="space-y-1">
          {connectedUsers.length === 0 ? (
            <div className="text-slate-500 dark:text-slate-400 text-xs italic">
              No users connected
            </div>
          ) : (
            connectedUsers.map(({ connection, user }) => (
              <div
                key={connection.id}
                className="flex items-center gap-2 group"
              >
                <button
                  onClick={() => useEditorStore.setState({ selectedUserId: user!.id, selectedUserNeedId: null })}
                  className="flex-1 text-left px-2 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-neutral-700 text-slate-700 dark:text-slate-300 text-xs"
                >
                  {user!.name}
                </button>
                <SimpleTooltip text="Remove this connection">
                  <button
                    onClick={() => deleteUserNeedConnection(connection.id)}
                    className="opacity-0 group-hover:opacity-100 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 p-1 rounded"
                  >
                    <X size={14} />
                  </button>
                </SimpleTooltip>
              </div>
            ))
          )}
        </div>
      </Section>

      {/* Connected Contexts */}
      <Section label={`Contexts (${connectedContexts.length})`}>
        <div className="space-y-1">
          {connectedContexts.length === 0 ? (
            <div className="text-slate-500 dark:text-slate-400 text-xs italic">
              No contexts connected
            </div>
          ) : (
            connectedContexts.map(({ connection, context }) => (
              <div
                key={connection.id}
                className="flex items-center gap-2 group"
              >
                <button
                  onClick={() => useEditorStore.setState({ selectedContextId: context!.id, selectedUserNeedId: null })}
                  className="flex-1 text-left px-2 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-neutral-700 text-slate-700 dark:text-slate-300 text-xs"
                >
                  {context!.name}
                </button>
                <SimpleTooltip text="Remove this connection">
                  <button
                    onClick={() => deleteNeedContextConnection(connection.id)}
                    className="opacity-0 group-hover:opacity-100 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 p-1 rounded"
                  >
                    <X size={14} />
                  </button>
                </SimpleTooltip>
              </div>
            ))
          )}
        </div>
      </Section>

      {/* Delete User Need */}
      <div className="pt-4 border-t border-slate-200 dark:border-neutral-700">
        <button
          onClick={handleDelete}
          className="flex items-center gap-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1.5 rounded text-xs font-medium"
        >
          <Trash2 size={14} />
          Delete User Need
        </button>
      </div>
    </div>
  )
}
