import React from 'react'
import { X } from 'lucide-react'
import { useEditorStore } from '../model/store'
import { CLEARED_SELECTION } from '../lib/selectionDismiss'
import { GroupInspector } from './inspector/GroupInspector'
import { UserInspector } from './inspector/UserInspector'
import { UserNeedInspector } from './inspector/UserNeedInspector'
import { RelationshipInspector } from './inspector/RelationshipInspector'
import { UserNeedConnectionInspector } from './inspector/UserNeedConnectionInspector'
import { NeedContextConnectionInspector } from './inspector/NeedContextConnectionInspector'
import { FlowStageInspector } from './inspector/FlowStageInspector'
import { TeamInspector } from './inspector/TeamInspector'
import { ContextInspector } from './inspector/ContextInspector'

function CloseButton({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex justify-end -mt-1 -mr-1 mb-2">
      <button
        onClick={onClose}
        aria-label="Close inspector"
        className="p-1.5 rounded text-slate-400 hover:bg-slate-100 dark:hover:bg-neutral-700 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  )
}

export function InspectorPanel() {
  const projectId = useEditorStore((s) => s.activeProjectId)
  const project = useEditorStore((s) => (projectId ? s.projects[projectId] : undefined))
  const selectedContextId = useEditorStore((s) => s.selectedContextId)
  const selectedGroupId = useEditorStore((s) => s.selectedGroupId)
  const selectedUserId = useEditorStore((s) => s.selectedUserId)
  const selectedUserNeedId = useEditorStore((s) => s.selectedUserNeedId)
  const selectedRelationshipId = useEditorStore((s) => s.selectedRelationshipId)
  const selectedUserNeedConnectionId = useEditorStore((s) => s.selectedUserNeedConnectionId)
  const selectedNeedContextConnectionId = useEditorStore((s) => s.selectedNeedContextConnectionId)
  const selectedStageIndex = useEditorStore((s) => s.selectedStageIndex)
  const selectedTeamId = useEditorStore((s) => s.selectedTeamId)

  const handleClose = () => {
    useEditorStore.setState(CLEARED_SELECTION)
  }

  if (!project) {
    return null
  }

  const renderInspector = () => {
    if (selectedGroupId) {
      return <GroupInspector project={project} groupId={selectedGroupId} />
    }
    if (selectedUserId) {
      return <UserInspector project={project} userId={selectedUserId} />
    }
    if (selectedUserNeedId) {
      return <UserNeedInspector project={project} userNeedId={selectedUserNeedId} />
    }
    if (selectedRelationshipId) {
      return <RelationshipInspector project={project} relationshipId={selectedRelationshipId} />
    }
    if (selectedUserNeedConnectionId) {
      return (
        <UserNeedConnectionInspector
          project={project}
          connectionId={selectedUserNeedConnectionId}
        />
      )
    }
    if (selectedNeedContextConnectionId) {
      return (
        <NeedContextConnectionInspector
          project={project}
          connectionId={selectedNeedContextConnectionId}
        />
      )
    }
    if (selectedStageIndex !== null) {
      return <FlowStageInspector project={project} stageIndex={selectedStageIndex} />
    }
    if (selectedTeamId) {
      return <TeamInspector project={project} teamId={selectedTeamId} />
    }
    if (selectedContextId) {
      return <ContextInspector project={project} contextId={selectedContextId} />
    }
    return null
  }

  const inspector = renderInspector()
  if (!inspector) {
    return null
  }

  return (
    <>
      <CloseButton onClose={handleClose} />
      {inspector}
    </>
  )
}
