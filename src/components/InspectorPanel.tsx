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
import { ContextInspector } from './inspector/ContextInspector'
import { ESInspector } from './inspector/ESInspector'
import { PivotalEventInspector } from './inspector/PivotalEventInspector'
import { ESConnectionInspector } from './inspector/ESConnectionInspector'

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
  const selectedDomainEventId = useEditorStore((s) => s.selectedDomainEventId)
  const selectedCommandId = useEditorStore((s) => s.selectedCommandId)
  const selectedESAggregateId = useEditorStore((s) => s.selectedESAggregateId)
  const selectedPolicyId = useEditorStore((s) => s.selectedPolicyId)
  const selectedESHotSpotId = useEditorStore((s) => s.selectedESHotSpotId)
  const selectedPivotalEventId = useEditorStore((s) => s.selectedPivotalEventId)
  const selectedESConnectionId = useEditorStore((s) => s.selectedESConnectionId)

  if (!project) {
    return null
  }

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
      <UserNeedConnectionInspector project={project} connectionId={selectedUserNeedConnectionId} />
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

  // Event Storming entity inspectors
  if (selectedDomainEventId) {
    return (
      <ESInspector project={project} entityType="domainEvent" entityId={selectedDomainEventId} />
    )
  }

  if (selectedCommandId) {
    return <ESInspector project={project} entityType="command" entityId={selectedCommandId} />
  }

  if (selectedESAggregateId) {
    return <ESInspector project={project} entityType="aggregate" entityId={selectedESAggregateId} />
  }

  if (selectedPolicyId) {
    return <ESInspector project={project} entityType="policy" entityId={selectedPolicyId} />
  }

  if (selectedESHotSpotId) {
    return <ESInspector project={project} entityType="hotSpot" entityId={selectedESHotSpotId} />
  }

  if (selectedPivotalEventId) {
    return <PivotalEventInspector project={project} eventId={selectedPivotalEventId} />
  }

  if (selectedESConnectionId) {
    return <ESConnectionInspector project={project} connectionId={selectedESConnectionId} />
  }

  if (selectedContextId) {
    return <ContextInspector project={project} contextId={selectedContextId} />
  }

  return null
}
