import React from 'react'
import { useEditorStore } from '../model/store'
import { GroupInspector } from './inspector/GroupInspector'
import { UserInspector } from './inspector/UserInspector'
import { UserNeedInspector } from './inspector/UserNeedInspector'
import { RelationshipInspector } from './inspector/RelationshipInspector'
import { UserNeedConnectionInspector } from './inspector/UserNeedConnectionInspector'
import { NeedContextConnectionInspector } from './inspector/NeedContextConnectionInspector'
import { FlowStageInspector } from './inspector/FlowStageInspector'
import { TeamInspector } from './inspector/TeamInspector'
import { RepoInspector } from './inspector/RepoInspector'
import { ContextInspector } from './inspector/ContextInspector'

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
  const selectedRepoId = useEditorStore((s) => s.selectedRepoId)

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
    if (selectedRepoId) {
      return <RepoInspector project={project} repoId={selectedRepoId} />
    }
    if (selectedContextId) {
      return <ContextInspector project={project} contextId={selectedContextId} />
    }
    return null
  }

  return renderInspector()
}
