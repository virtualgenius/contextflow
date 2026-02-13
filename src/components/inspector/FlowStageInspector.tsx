import React from 'react'
import { Trash2, Users } from 'lucide-react'
import { useEditorStore } from '../../model/store'
import type { Project } from '../../model/types'
import { INPUT_TITLE_CLASS, INPUT_TEXT_CLASS, TEXTAREA_CLASS, Section } from './inspectorShared'

export function FlowStageInspector({ project, stageIndex }: { project: Project; stageIndex: number }) {
  const updateFlowStage = useEditorStore(s => s.updateFlowStage)
  const deleteFlowStage = useEditorStore(s => s.deleteFlowStage)
  const setSelectedStage = useEditorStore(s => s.setSelectedStage)

  const stages = project.viewConfig?.flowStages || []
  const stage = stages[stageIndex]
  if (!stage) {
    return (
      <div className="text-neutral-500 dark:text-neutral-400">
        Stage not found.
      </div>
    )
  }

  const handleStageUpdate = (updates: Partial<{ name: string; description: string; owner: string; notes: string }>) => {
    updateFlowStage(stageIndex, updates)
  }

  const handleDeleteStage = () => {
    if (window.confirm(`Delete stage "${stage.name}"? This can be undone with Cmd/Ctrl+Z.`)) {
      deleteFlowStage(stageIndex)
      setSelectedStage(null)
    }
  }

  // Find users and user needs whose positions fall within this stage's boundary
  // Calculate stage boundaries (midpoints between adjacent stages)
  const sortedStages = [...stages].sort((a, b) => a.position - b.position)
  const stageIdx = sortedStages.findIndex(s => s.position === stage.position)
  const prevPosition = stageIdx > 0 ? sortedStages[stageIdx - 1].position : 0
  const nextPosition = stageIdx < sortedStages.length - 1 ? sortedStages[stageIdx + 1].position : 100
  const startBound = stageIdx === 0 ? 0 : (prevPosition + stage.position) / 2
  const endBound = stageIdx === sortedStages.length - 1 ? 100 : (stage.position + nextPosition) / 2

  // Find users in this stage
  const usersInStage = (project.users || []).filter(user => {
    const userPosition = user.position ?? 0
    return userPosition >= startBound && userPosition < endBound
  })

  // Find user needs in this stage
  const userNeedsInStage = (project.userNeeds || []).filter(need => {
    const needPosition = need.position ?? 0
    return needPosition >= startBound && needPosition < endBound
  })

  return (
    <div className="space-y-5">
      {/* Name */}
      <div>
        <input
          type="text"
          value={stage.name}
          onChange={(e) => handleStageUpdate({ name: e.target.value })}
          className={INPUT_TITLE_CLASS}
        />
      </div>

      {/* Description */}
      <Section label="Description">
        <textarea
          value={stage.description || ''}
          onChange={(e) => handleStageUpdate({ description: e.target.value })}
          placeholder="Describe this stage in the user journey..."
          rows={2}
          className={TEXTAREA_CLASS}
        />
      </Section>

      {/* Owner */}
      <Section label="Owner">
        <input
          type="text"
          value={stage.owner || ''}
          onChange={(e) => handleStageUpdate({ owner: e.target.value })}
          placeholder="Team or person responsible..."
          className={INPUT_TEXT_CLASS}
        />
      </Section>

      {/* Users in Stage */}
      {usersInStage.length > 0 && (
        <Section label={`Users in Stage (${usersInStage.length})`}>
          <div className="space-y-1">
            {usersInStage.map(user => (
              <button
                key={user.id}
                onClick={() => useEditorStore.setState({ selectedUserId: user.id, selectedStageIndex: null })}
                className="w-full text-left px-2 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-neutral-700 text-slate-700 dark:text-slate-300 text-xs flex items-center gap-2"
              >
                <Users size={12} className="text-blue-500 flex-shrink-0" />
                {user.name}
              </button>
            ))}
          </div>
        </Section>
      )}

      {/* User Needs in Stage */}
      {userNeedsInStage.length > 0 && (
        <Section label={`User Needs in Stage (${userNeedsInStage.length})`}>
          <div className="space-y-1">
            {userNeedsInStage.map(need => (
              <button
                key={need.id}
                onClick={() => useEditorStore.setState({ selectedUserNeedId: need.id, selectedStageIndex: null })}
                className="w-full text-left px-2 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-neutral-700 text-slate-700 dark:text-slate-300 text-xs"
              >
                {need.name}
              </button>
            ))}
          </div>
        </Section>
      )}

      {/* Notes */}
      <Section label="Notes">
        <textarea
          value={stage.notes || ''}
          onChange={(e) => handleStageUpdate({ notes: e.target.value })}
          placeholder="Additional notes about this stage..."
          rows={3}
          className={TEXTAREA_CLASS}
        />
      </Section>

      {/* Delete Stage */}
      <div className="pt-2 border-t border-slate-200 dark:border-neutral-700">
        <button
          onClick={handleDeleteStage}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
        >
          <Trash2 size={14} />
          Delete Stage
        </button>
      </div>
    </div>
  )
}
