import React from 'react'
import { HelpCircle, Trash2, X } from 'lucide-react'
import { useEditorStore } from '../../model/store'
import type { Project, User } from '../../model/types'
import { EXTERNAL_USER } from '../../model/conceptDefinitions'
import { InfoTooltip } from '../InfoTooltip'
import { SimpleTooltip } from '../SimpleTooltip'
import { Switch } from '../Switch'
import { INPUT_TITLE_CLASS, TEXTAREA_CLASS, Section } from './inspectorShared'

export function UserInspector({ project, userId }: { project: Project; userId: string }) {
  const updateUser = useEditorStore((s) => s.updateUser)
  const deleteUser = useEditorStore((s) => s.deleteUser)
  const deleteUserNeedConnection = useEditorStore((s) => s.deleteUserNeedConnection)

  const user = project.users?.find((u) => u.id === userId)
  if (!user) {
    return <div className="text-neutral-500 dark:text-neutral-400">User not found.</div>
  }

  const connections = (project.userNeedConnections || []).filter((uc) => uc.userId === user.id)
  const connectedUserNeeds = connections
    .map((conn) => {
      const userNeed = project.userNeeds?.find((un) => un.id === conn.userNeedId)
      return { connection: conn, userNeed }
    })
    .filter((item) => item.userNeed)

  const handleUpdate = (updates: Partial<User>) => {
    updateUser(user.id, updates)
  }

  const handleDelete = () => {
    if (
      window.confirm(
        `Delete user "${user.name}"? This will also delete all connections to user needs. This can be undone with Cmd/Ctrl+Z.`
      )
    ) {
      deleteUser(user.id)
    }
  }

  return (
    <div className="space-y-5">
      {/* Name */}
      <div>
        <input
          type="text"
          value={user.name}
          onChange={(e) => handleUpdate({ name: e.target.value })}
          className={INPUT_TITLE_CLASS}
        />
      </div>

      {/* Description */}
      <Section label="Description">
        <textarea
          value={user.description || ''}
          onChange={(e) => handleUpdate({ description: e.target.value })}
          placeholder="Describe this user type..."
          rows={2}
          className={TEXTAREA_CLASS}
        />
      </Section>

      {/* External Toggle */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Switch
            label="External"
            checked={user.isExternal || false}
            onCheckedChange={(checked) => handleUpdate({ isExternal: checked })}
          />
          <InfoTooltip content={EXTERNAL_USER} position="bottom">
            <HelpCircle size={14} className="text-slate-400 dark:text-slate-500 cursor-help" />
          </InfoTooltip>
        </div>
      </div>

      {/* Connected User Needs */}
      <Section label={`Connected User Needs (${connectedUserNeeds.length})`}>
        <div className="space-y-1">
          {connectedUserNeeds.length === 0 ? (
            <div className="text-slate-500 dark:text-slate-400 text-xs italic">
              No connections yet
            </div>
          ) : (
            connectedUserNeeds.map(({ connection, userNeed }) => (
              <div key={connection.id} className="flex items-center gap-2 group">
                <button
                  onClick={() =>
                    useEditorStore.setState({
                      selectedUserNeedId: userNeed!.id,
                      selectedUserId: null,
                    })
                  }
                  className="flex-1 text-left px-2 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-neutral-700 text-slate-700 dark:text-slate-300 text-xs"
                >
                  {userNeed!.name}
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

      {/* Delete User */}
      <div className="pt-4 border-t border-slate-200 dark:border-neutral-700">
        <button
          onClick={handleDelete}
          className="flex items-center gap-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1.5 rounded text-xs font-medium"
        >
          <Trash2 size={14} />
          Delete User
        </button>
      </div>
    </div>
  )
}
