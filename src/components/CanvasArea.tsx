import React, { useMemo, useCallback, useEffect } from 'react'
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  useReactFlow,
  NodeDragHandler,
  useNodesState,
  ReactFlowProvider,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { useEditorStore, setFitViewCallback } from '../model/store'
import type { BoundedContext, UserNeedConnection, NeedContextConnection } from '../model/types'
import { X, ArrowRight } from 'lucide-react'
import { PATTERN_DEFINITIONS, POWER_DYNAMICS_ICONS } from '../model/patternDefinitions'
import { getHoverConnectedContextIds } from '../lib/canvasHelpers'
import { interpolatePosition, getContextOpacity } from '../lib/temporal'
import { generateBlobPath } from '../lib/blobShape'
import { calculateBoundingBox, translateContextsToRelative, calculateBlobPosition } from '../lib/blobPositioning'
import { shouldShowGettingStartedGuide, isSampleProject } from '../model/actions/projectHelpers'
import { createSelectionState } from '../model/validation'
import { NODE_SIZES } from '../lib/canvasConstants'
import { getContextCanvasPosition, clampDragDelta } from '../lib/positionUtils'
import { TimeSlider } from './TimeSlider'
import { ConnectionGuidanceTooltip } from './ConnectionGuidanceTooltip'
import { ValueChainGuideModal } from './ValueChainGuideModal'
import { GettingStartedGuideModal } from './GettingStartedGuideModal'
import { ContextNode, GroupNode, UserNode, UserNeedNode } from './nodes'
import { RelationshipEdge, UserConnectionEdge, UserNeedConnectionEdge, NeedContextConnectionEdge } from './edges'
import { StageLabels, StageBoundaryLines, IssueLabelsOverlay, TeamLabelsOverlay, EvolutionBands, ProblemSpaceBand, CanvasBoundary, YAxisLabels, DistillationRegions } from './overlays'

const nodeTypes = {
  context: ContextNode,
  group: GroupNode,
  user: UserNode,
  userNeed: UserNeedNode,
}

const edgeTypes = {
  relationship: RelationshipEdge,
  userConnection: UserConnectionEdge,
  userNeedConnection: UserNeedConnectionEdge,
  needContextConnection: NeedContextConnectionEdge,
}

function CustomControls() {
  const { fitBounds } = useReactFlow()
  const viewMode = useEditorStore(s => s.activeViewMode)

  const handleFitView = useCallback(() => {
    const bounds = viewMode === 'flow'
      ? { x: -120, y: -50, width: 2120, height: 1080 }
      : { x: 0, y: -50, width: 2000, height: 1080 }

    fitBounds(bounds, {
      padding: 0.1,
      duration: 200,
    })
  }, [fitBounds, viewMode])

  return <Controls position="bottom-right" onFitView={handleFitView} showInteractive={false} />
}

// Inner component that has access to React Flow context
function CanvasContent() {
  const projectId = useEditorStore(s => s.activeProjectId)
  const project = useEditorStore(s => (projectId ? s.projects[projectId] : undefined))
  const selectedContextId = useEditorStore(s => s.selectedContextId)
  const selectedContextIds = useEditorStore(s => s.selectedContextIds)
  const selectedGroupId = useEditorStore(s => s.selectedGroupId)
  const selectedUserId = useEditorStore(s => s.selectedUserId)
  const selectedRelationshipId = useEditorStore(s => s.selectedRelationshipId)
  const selectedUserNeedConnectionId = useEditorStore(s => s.selectedUserNeedConnectionId)
  const selectedNeedContextConnectionId = useEditorStore(s => s.selectedNeedContextConnectionId)
  const hoveredContextId = useEditorStore(s => s.hoveredContextId)
  const viewMode = useEditorStore(s => s.activeViewMode)
  const showGroups = useEditorStore(s => s.showGroups)
  const showRelationships = useEditorStore(s => s.showRelationships)
  const showIssueLabels = useEditorStore(s => s.showIssueLabels)
  const showTeamLabels = useEditorStore(s => s.showTeamLabels)
  const updateContextPosition = useEditorStore(s => s.updateContextPosition)
  const updateMultipleContextPositions = useEditorStore(s => s.updateMultipleContextPositions)
  const updateUserPosition = useEditorStore(s => s.updateUserPosition)
  const updateUserNeedPosition = useEditorStore(s => s.updateUserNeedPosition)
  const setSelectedUser = useEditorStore(s => s.setSelectedUser)
  const setSelectedTeam = useEditorStore(s => s.setSelectedTeam)
  const assignRepoToContext = useEditorStore(s => s.assignRepoToContext)
  const deleteContext = useEditorStore(s => s.deleteContext)
  const deleteUser = useEditorStore(s => s.deleteUser)
  const deleteUserNeed = useEditorStore(s => s.deleteUserNeed)
  const deleteGroup = useEditorStore(s => s.deleteGroup)
  const hasSeenWelcome = useEditorStore(s => s.hasSeenWelcome)

  // Temporal state
  const currentDate = useEditorStore(s => s.temporal.currentDate)
  const activeKeyframeId = useEditorStore(s => s.temporal.activeKeyframeId)
  const updateKeyframeContextPosition = useEditorStore(s => s.updateKeyframeContextPosition)

  const isDragging = useEditorStore(s => s.isDragging)
  const setDragging = useEditorStore(s => s.setDragging)

  // Pending connection state for context→context relationships (needs pattern selection)
  const [pendingConnection, setPendingConnection] = React.useState<{ sourceId: string; targetId: string } | null>(null)

  // Invalid connection state (for showing guidance tooltip)
  const [invalidConnectionAttempt, setInvalidConnectionAttempt] = React.useState<{
    sourceType: 'user' | 'userNeed' | 'context'
    targetType: 'user' | 'userNeed' | 'context'
    sourceId: string
    targetId: string
    position: { x: number; y: number }
  } | null>(null)

  // Value chain guide modal
  const [showValueChainGuide, setShowValueChainGuide] = React.useState(false)

  // Getting started guide modal - auto-opens when project is empty or first time viewing sample
  const [showGettingStartedGuide, setShowGettingStartedGuide] = React.useState(false)
  const [dismissedGuideForEmptyProject, setDismissedGuideForEmptyProject] = React.useState(false)
  const [seenSampleProjects, setSeenSampleProjects] = React.useState<Set<string>>(new Set())
  const setActiveProject = useEditorStore(s => s.setActiveProject)

  const { fitBounds } = useReactFlow()

  const getBounds = useCallback(() => {
    return viewMode === 'flow'
      ? { x: -120, y: -50, width: 2120, height: 1080 }
      : { x: 0, y: -50, width: 2000, height: 1080 }
  }, [viewMode])

  useEffect(() => {
    setFitViewCallback(() => {
      fitBounds(getBounds(), { padding: 0.1, duration: 200 })
    })
  }, [fitBounds, getBounds])

  const onInit = useCallback(() => {
    fitBounds(getBounds(), { padding: 0.1 })
  }, [fitBounds, getBounds])

  // Convert BoundedContexts and Groups to React Flow nodes
  const baseNodes: Node[] = useMemo(() => {
    if (!project) return []

    // Find the selected group (if any)
    const selectedGroup = selectedGroupId ? project.groups.find(g => g.id === selectedGroupId) : null

    // Find connected contexts for selected user (via user needs)
    const selectedUserNeedConnectionsForUser = selectedUserId
      ? project.userNeedConnections?.filter((uc: UserNeedConnection) => uc.userId === selectedUserId) || []
      : []
    const connectedUserNeedIds = new Set(selectedUserNeedConnectionsForUser.map((uc: UserNeedConnection) => uc.userNeedId))
    const connectedContextIds = new Set(
      project.needContextConnections
        ?.filter((nc: NeedContextConnection) => connectedUserNeedIds.has(nc.userNeedId))
        .map((nc: NeedContextConnection) => nc.contextId) || []
    )

    // Find connected contexts for selected relationship
    const selectedRelationship = selectedRelationshipId
      ? project.relationships.find(r => r.id === selectedRelationshipId)
      : null
    const relationshipConnectedContextIds = new Set(
      selectedRelationship ? [selectedRelationship.fromContextId, selectedRelationship.toContextId] : []
    )

    // Find connected user and user need for selected user-need connection
    const selectedUserNeedConnection = selectedUserNeedConnectionId
      ? project.userNeedConnections?.find(c => c.id === selectedUserNeedConnectionId)
      : null
    const userNeedConnectionUserId = selectedUserNeedConnection?.userId || null
    const userNeedConnectionUserNeedId = selectedUserNeedConnection?.userNeedId || null

    // Find connected user need and context for selected need-context connection
    const selectedNeedContextConnection = selectedNeedContextConnectionId
      ? project.needContextConnections?.find(c => c.id === selectedNeedContextConnectionId)
      : null
    const needContextConnectionUserNeedId = selectedNeedContextConnection?.userNeedId || null
    const needContextConnectionContextId = selectedNeedContextConnection?.contextId || null

    const hoverConnectedContextIds = getHoverConnectedContextIds(hoveredContextId, project.relationships)

    const contextNodes = project.contexts.map((context) => {
      const size = NODE_SIZES[context.codeSize?.bucket || 'medium']

      const keyframes = project.temporal?.keyframes || []
      const { x, y } = getContextCanvasPosition(
        context.positions,
        viewMode as 'flow' | 'strategic' | 'distillation',
        (viewMode === 'strategic' && project.temporal?.enabled) ? currentDate : null,
        keyframes as any,
        interpolatePosition as any,
        context.id,
      )

      // Check if this context is highlighted (by group, user, relationship, or need-context connection selection)
      const isMemberOfSelectedGroup = selectedGroup?.contextIds.includes(context.id)
        || connectedContextIds.has(context.id)
        || relationshipConnectedContextIds.has(context.id)
        || context.id === needContextConnectionContextId
        || false

      // Calculate opacity based on temporal visibility (Strategic View only)
      let opacity = 1
      if (viewMode === 'strategic' && project.temporal?.enabled && currentDate) {
        const keyframes = project.temporal.keyframes || []
        if (keyframes.length > 0) {
          opacity = getContextOpacity(context.id, currentDate, keyframes)
        }
      }

      return {
        id: context.id,
        type: 'context',
        position: { x, y },
        data: {
          context,
          isSelected: context.id === selectedContextId || selectedContextIds.includes(context.id),
          isMemberOfSelectedGroup,
          isHoveredByRelationship: hoverConnectedContextIds.has(context.id),
          opacity,
        },
        style: {
          width: size.width,
          height: size.height,
          zIndex: 10,
        },
        width: size.width,
        height: size.height,
        draggable: true,
        selectable: true,
        connectable: true,
      }
    })

    // Create group nodes (not shown in distillation view)
    const groupNodes = viewMode !== 'distillation' && project.groups?.map((group) => {
      const contexts = project.contexts.filter(c => group.contextIds.includes(c.id))
      if (contexts.length === 0) return null

      // Since we're already in a non-distillation view (checked above), compute positions
      const xPositions = contexts.map(c => (viewMode === 'flow' ? c.positions.flow.x : c.positions.strategic.x) * 20)
      const yPositions = contexts.map(c => c.positions.shared.y * 10)

      const BLOB_PADDING = 60

      const contextsWithSizes = contexts.map((c, idx) => {
        const size = NODE_SIZES[c.codeSize?.bucket || 'medium']
        return {
          x: xPositions[idx],
          y: yPositions[idx],
          width: size.width,
          height: size.height
        }
      })

      const boundingBox = calculateBoundingBox(contextsWithSizes)
      const relativeContexts = translateContextsToRelative(contextsWithSizes, boundingBox)
      const blobMetadata = generateBlobPath(relativeContexts, BLOB_PADDING, true)
      const blobPosition = calculateBlobPosition(contextsWithSizes, blobMetadata, boundingBox)

      return {
        id: `group-${group.id}`,
        type: 'group',
        position: {
          x: blobPosition.containerX,
          y: blobPosition.containerY
        },
        data: {
          group,
          isSelected: group.id === selectedGroupId,
          blobPath: blobPosition.blobPath,
          blobBounds: { width: blobPosition.containerWidth, height: blobPosition.containerHeight },
        },
        style: {
          width: blobPosition.containerWidth,
          height: blobPosition.containerHeight,
          zIndex: 0,
          background: 'transparent',
          border: 'none',
          borderRadius: 0,
          padding: 0,
        },
        className: 'group-node',
        width: blobPosition.containerWidth,
        height: blobPosition.containerHeight,
        draggable: false,
        selectable: true,
        connectable: false,
      }
    }).filter(Boolean) as Node[] || []

    // Reorder groups to bring selected group to front (renders last = on top)
    const reorderedGroupNodes = selectedGroupId
      ? [
          ...groupNodes.filter(g => g.id !== `group-${selectedGroupId}`),
          ...groupNodes.filter(g => g.id === `group-${selectedGroupId}`)
        ]
      : groupNodes

    // Apply group visibility filter
    const finalGroupNodes = showGroups ? reorderedGroupNodes : []

    // Create user nodes (visible in Strategic and Value Stream views, not Distillation)
    const userNodes: Node[] = viewMode !== 'distillation' && project.users
      ? project.users.map((user) => {
          const x = (user.position / 100) * 2000
          const y = 10 // Fixed y position at top inside boundary
          const isHighlightedByConnection = user.id === userNeedConnectionUserId

          return {
            id: user.id,
            type: 'user',
            position: { x, y },
            data: {
              user,
              isSelected: user.id === selectedUserId,
              isHighlightedByConnection,
            },
            style: {
              width: 100,
              height: 50,
              zIndex: 15, // Above contexts but below user connections
            },
            width: 100,
            height: 50,
            draggable: true,
            selectable: true,
            selected: false,
            connectable: false,
          }
        })
      : []

    // Create userNeed nodes (visible in Strategic and Value Stream views, not Distillation)
    const userNeedNodes: Node[] = viewMode !== 'distillation' && project.userNeeds
      ? project.userNeeds
          .filter(need => need.visibility !== false)
          .map((userNeed) => {
            const x = (userNeed.position / 100) * 2000
            const y = 90 // Fixed y position below users, inside boundary
            const isHighlightedByConnection = userNeed.id === userNeedConnectionUserNeedId || userNeed.id === needContextConnectionUserNeedId

            return {
              id: userNeed.id,
              type: 'userNeed',
              position: { x, y },
              data: {
                userNeed,
                isSelected: userNeed.id === useEditorStore.getState().selectedUserNeedId,
                isHighlightedByConnection,
              },
              style: {
                width: 100,
                height: 50,
                zIndex: 14, // Between users (15) and contexts (10)
              },
              width: 100,
              height: 50,
              draggable: true,
              selectable: true,
              selected: false,
              connectable: false,
            }
          })
      : []

    // Return groups first (with selected on top), then contexts, then user needs, then users
    return [...finalGroupNodes, ...contextNodes, ...userNeedNodes, ...userNodes]
  }, [project, selectedContextId, selectedContextIds, selectedGroupId, selectedUserId, selectedRelationshipId, selectedUserNeedConnectionId, selectedNeedContextConnectionId, hoveredContextId, viewMode, showGroups, currentDate])

  // Use React Flow's internal nodes state for smooth updates
  const [nodes, setNodes, onNodesChangeOriginal] = useNodesState(baseNodes)

  // Update nodes when baseNodes change (view mode switch or context updates)
  useEffect(() => {
    setNodes((currentNodes) => {
      return baseNodes.map((baseNode) => {
        const existingNode = currentNodes.find(n => n.id === baseNode.id)
        // Preserve any internal React Flow state while updating position
        return existingNode ? { ...existingNode, ...baseNode } : baseNode
      })
    })
  }, [baseNodes, setNodes, selectedContextIds, selectedGroupId])

  // Convert Relationships and UserConnections to React Flow edges
  const edges: Edge[] = useMemo(() => {
    if (!project) return []

    // Filter relationships based on view mode and visibility toggle
    const relationshipEdges = (viewMode !== 'distillation' && showRelationships)
      ? project.relationships.map((rel) => ({
          id: rel.id,
          source: rel.fromContextId,
          target: rel.toContextId,
          type: 'relationship',
          data: { relationship: rel },
          animated: false,
          zIndex: 5, // Above groups (0) but below contexts (10)
        }))
      : []

    // Add user-need connection edges (Strategic and Value Stream views, not Distillation)
    const userNeedConnectionEdges: Edge[] = viewMode !== 'distillation' && project.userNeedConnections
      ? project.userNeedConnections.map((conn) => ({
          id: conn.id,
          source: conn.userId,
          target: conn.userNeedId,
          type: 'userNeedConnection',
          data: { connection: conn },
          animated: false,
          zIndex: 12,
        }))
      : []

    // Add need-context connection edges (Strategic and Value Stream views, not Distillation)
    const needContextConnectionEdges: Edge[] = viewMode !== 'distillation' && project.needContextConnections
      ? project.needContextConnections.map((conn) => ({
          id: conn.id,
          source: conn.userNeedId,
          target: conn.contextId,
          type: 'needContextConnection',
          data: { connection: conn },
          animated: false,
          zIndex: 11,
        }))
      : []

    return [...relationshipEdges, ...userNeedConnectionEdges, ...needContextConnectionEdges]
  }, [project, viewMode, showRelationships, selectedUserId, selectedRelationshipId])

  // Handle edge click
  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    // Only handle relationship edges, not user connections
    if (edge.type === 'relationship') {
      const relationship = project?.relationships.find(r => r.id === edge.id)
      const connectedContextIds = relationship
        ? [relationship.fromContextId, relationship.toContextId]
        : []

      useEditorStore.setState({
        ...createSelectionState(edge.id, 'relationship'),
        selectedContextIds: connectedContextIds,
      })
    }
  }, [project])

  // Handle node click
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    // Handle group node clicks
    if (node.type === 'group') {
      const groupId = node.id.replace('group-', '')
      useEditorStore.setState({
        ...createSelectionState(groupId, 'group'),
      })
      return
    }

    // Handle user node clicks
    if (node.type === 'user') {
      useEditorStore.getState().setSelectedUser(node.id)
      return
    }

    // Handle userNeed node clicks
    if (node.type === 'userNeed') {
      useEditorStore.getState().setSelectedUserNeed(node.id)
      return
    }

    // Handle context node clicks
    if (event.shiftKey || event.metaKey || event.ctrlKey) {
      // Multi-select mode (Shift or Cmd/Ctrl)
      useEditorStore.getState().toggleContextSelection(node.id)
    } else {
      // Single select
      useEditorStore.setState({
          ...createSelectionState(node.id, 'context'),
        })
    }
  }, [])

  // Handle pane click (deselect)
  const onPaneClick = useCallback(() => {
    useEditorStore.setState({
      ...createSelectionState(null, 'context'),
    })
  }, [])

  // Handle edge connection (User → User Need → Context, or Context → Context)
  const onConnect = useCallback((connection: any) => {
    const { source, target } = connection
    const sourceNode = nodes.find(n => n.id === source)
    const targetNode = nodes.find(n => n.id === target)

    if (!sourceNode || !targetNode) return

    // User → User Need
    if (sourceNode.type === 'user' && targetNode.type === 'userNeed') {
      useEditorStore.getState().createUserNeedConnection(source, target)
      return
    }

    // User Need → Context
    if (sourceNode.type === 'userNeed' && targetNode.type === 'context') {
      useEditorStore.getState().createNeedContextConnection(source, target)
      return
    }

    // Context → Context (relationship - needs pattern selection)
    if (sourceNode.type === 'context' && targetNode.type === 'context') {
      // Store pending connection, show pattern picker dialog
      setPendingConnection({ sourceId: source, targetId: target })
      return
    }

    // Invalid connection - show guidance tooltip
    const targetNodeElement = document.querySelector(`[data-id="${target}"]`)
    const rect = targetNodeElement?.getBoundingClientRect()

    setInvalidConnectionAttempt({
      sourceType: sourceNode.type as 'user' | 'userNeed' | 'context',
      targetType: targetNode.type as 'user' | 'userNeed' | 'context',
      sourceId: source,
      targetId: target,
      position: rect
        ? { x: rect.x + rect.width / 2, y: rect.y }
        : { x: window.innerWidth / 2, y: window.innerHeight / 3 },
    })
  }, [nodes])

  // Wrap onNodesChange to handle multi-select drag
  const onNodesChange = useCallback((changes: any[]) => {
    // Get currently selected nodes from React Flow's internal state
    const selectedNodes = nodes.filter(n => n.selected && n.type === 'context')
    const reactFlowSelectedIds = selectedNodes.map(n => n.id)

    // Combine React Flow selection with our store selection
    const allSelectedIds = [...new Set([...selectedContextIds, ...reactFlowSelectedIds])]

    const positionChanges = changes.filter(c => c.type === 'position')

    // Check if React Flow is already handling multi-select drag
    // (sending position changes for all selected nodes at once)
    const isReactFlowMultiDrag = positionChanges.length > 1 &&
                                  positionChanges.length === allSelectedIds.length

    if (isReactFlowMultiDrag) {
      // React Flow is already handling multi-select drag correctly for box selection
      // Just pass through the changes
      onNodesChangeOriginal(changes)

      // Check if this is the end of the drag (dragging: false)
      const dragEndChanges = positionChanges.filter(c => c.dragging === false)
      if (dragEndChanges.length > 0 && project) {
        // Save positions for all selected nodes
        const positionsMap: Record<string, BoundedContext['positions']> = {}

        allSelectedIds.forEach(contextId => {
          const ctx = project.contexts.find(c => c.id === contextId)
          const visualNode = nodes.find(n => n.id === contextId)
          if (!ctx || !visualNode) return

          const newX = (visualNode.position.x / 2000) * 100
          const newY = (visualNode.position.y / 1000) * 100

          if (viewMode === 'distillation') {
            positionsMap[contextId] = {
              flow: { x: ctx.positions.flow.x },
              strategic: { x: ctx.positions.strategic.x },
              distillation: { x: newX, y: 100 - newY }, // Invert Y back to 0=bottom, 100=top
              shared: { y: ctx.positions.shared.y },
            }
          } else if (viewMode === 'flow') {
            positionsMap[contextId] = {
              flow: { x: newX },
              strategic: { x: ctx.positions.strategic.x },
              distillation: { x: ctx.positions.distillation.x, y: ctx.positions.distillation.y },
              shared: { y: newY },
            }
          } else {
            positionsMap[contextId] = {
              flow: { x: ctx.positions.flow.x },
              strategic: { x: newX },
              distillation: { x: ctx.positions.distillation.x, y: ctx.positions.distillation.y },
              shared: { y: newY },
            }
          }
        })

        updateMultipleContextPositions(positionsMap)
      }
      return
    }

    // Handle case where React Flow sends position change for only one node
    // but multiple are selected (happens with Shift+Click selection)
    const positionChange = changes.find(
      (change) =>
        change.type === 'position' &&
        change.position &&
        allSelectedIds.includes(change.id) &&
        allSelectedIds.length > 1
    )

    if (positionChange) {
      // Find the node being dragged
      const draggedNode = nodes.find(n => n.id === positionChange.id)
      if (!draggedNode) {
        onNodesChangeOriginal(changes)
        return
      }

      // Calculate proposed delta
      let deltaX = positionChange.position.x - draggedNode.position.x
      let deltaY = positionChange.position.y - draggedNode.position.y

      // Clamp delta so no selected node exceeds boundaries
      const PROBLEM_SPACE_HEIGHT = 150
      const selectedDragNodes = allSelectedIds
        .map(id => nodes.find(node => node.id === id))
        .filter((n): n is Node => n != null && n.type === 'context')
        .map(n => ({
          position: n.position,
          width: n.width ?? 170,
          height: n.height ?? 100,
        }))
      const clamped = clampDragDelta(
        { x: deltaX, y: deltaY },
        selectedDragNodes,
        { width: 2000, height: 1000, minY: PROBLEM_SPACE_HEIGHT },
      )
      deltaX = clamped.x
      deltaY = clamped.y

      // Update the original position change with clamped delta
      positionChange.position = {
        x: draggedNode.position.x + deltaX,
        y: draggedNode.position.y + deltaY,
      }

      // Create position changes for all other selected nodes with clamped delta
      const additionalChanges = allSelectedIds
        .filter(id => id !== positionChange.id)
        .map(id => {
          const node = nodes.find(n => n.id === id)
          if (!node) return null

          return {
            type: 'position',
            id,
            dragging: true,
            position: {
              x: node.position.x + deltaX,
              y: node.position.y + deltaY,
            },
          }
        })
        .filter(Boolean)

      // Apply all changes together
      onNodesChangeOriginal([...changes, ...additionalChanges])
    } else {
      // Normal change, pass through
      onNodesChangeOriginal(changes)
    }
  }, [nodes, selectedContextIds, onNodesChangeOriginal])

  const constrainNodePosition: NodeDragHandler = useCallback((event, node) => {
    if (node.type === 'user') {
      node.position.y = 10
      return
    }

    if (node.type === 'userNeed') {
      node.position.y = 90
      return
    }

    if (node.type !== 'context') return

    // Single node constraint (multi-select constraints are handled in onNodesChange)
    const CANVAS_WIDTH = 2000
    const CANVAS_HEIGHT = 1000
    const PROBLEM_SPACE_HEIGHT = 150

    const w = node.width ?? 170
    const h = node.height ?? 100
    node.position.x = Math.max(0, Math.min(CANVAS_WIDTH - w, node.position.x))
    node.position.y = Math.max(PROBLEM_SPACE_HEIGHT, Math.min(CANVAS_HEIGHT - h, node.position.y))
  }, [])

  const onNodeDragStop: NodeDragHandler = useCallback((event, node) => {
    setDragging(false)

    if (!project) return

    // Handle user drag (horizontal only)
    if (node.type === 'user') {
      const user = project.users?.find(u => u.id === node.id)
      if (!user) return

      // Only update horizontal position, constrain to 0-100%
      const newPosition = Math.max(0, Math.min(100, (node.position.x / 2000) * 100))
      updateUserPosition(node.id, newPosition)
      return
    }

    // Handle userNeed drag (horizontal only)
    if (node.type === 'userNeed') {
      const userNeed = project.userNeeds?.find(n => n.id === node.id)
      if (!userNeed) return

      // Only update horizontal position, constrain to 0-100%
      const newPosition = Math.max(0, Math.min(100, (node.position.x / 2000) * 100))
      updateUserNeedPosition(node.id, newPosition)
      return
    }

    // Check if we're in temporal mode with an active keyframe (Strategic View only)
    const isEditingKeyframe = viewMode === 'strategic' && project.temporal?.enabled && activeKeyframeId

    // Get currently selected nodes from React Flow's internal state
    const selectedNodes = nodes.filter(n => n.selected && n.type === 'context')
    const reactFlowSelectedIds = selectedNodes.map(n => n.id)

    // Combine React Flow selection with our store selection
    const allSelectedIds = [...new Set([...selectedContextIds, ...reactFlowSelectedIds])]

    // Check if this node is part of a multi-selection
    const isMultiSelected = allSelectedIds.includes(node.id) && allSelectedIds.length > 1

    if (isMultiSelected) {
      // For multi-select, save the current visual positions of ALL selected nodes
      // (React Flow has already moved them visually during the drag)

      if (isEditingKeyframe) {
        // Update keyframe positions for all selected nodes
        allSelectedIds.forEach(contextId => {
          const visualNode = nodes.find(n => n.id === contextId)
          if (!visualNode) return

          const newX = (visualNode.position.x / 2000) * 100
          const newY = (visualNode.position.y / 1000) * 100
          updateKeyframeContextPosition(activeKeyframeId!, contextId, newX, newY)
        })
      } else {
        // Update base positions
        const positionsMap: Record<string, BoundedContext['positions']> = {}

        allSelectedIds.forEach(contextId => {
          const ctx = project.contexts.find(c => c.id === contextId)
          const visualNode = nodes.find(n => n.id === contextId)
          if (!ctx || !visualNode) return

          // Get the CURRENT visual position (after React Flow's drag)
          const newX = (visualNode.position.x / 2000) * 100
          const newY = (visualNode.position.y / 1000) * 100

          if (viewMode === 'distillation') {
            positionsMap[contextId] = {
              flow: { x: ctx.positions.flow.x },
              strategic: { x: ctx.positions.strategic.x },
              distillation: { x: newX, y: 100 - newY }, // Invert Y back to 0=bottom, 100=top
              shared: { y: ctx.positions.shared.y },
            }
          } else if (viewMode === 'flow') {
            positionsMap[contextId] = {
              flow: { x: newX },
              strategic: { x: ctx.positions.strategic.x },
              distillation: { x: ctx.positions.distillation.x, y: ctx.positions.distillation.y },
              shared: { y: newY },
            }
          } else {
            positionsMap[contextId] = {
              flow: { x: ctx.positions.flow.x },
              strategic: { x: newX },
              distillation: { x: ctx.positions.distillation.x, y: ctx.positions.distillation.y },
              shared: { y: newY },
            }
          }
        })

        updateMultipleContextPositions(positionsMap)
      }
    } else {
      // Single node move
      const context = project.contexts.find(c => c.id === node.id)
      if (!context) return

      const xPercent = (node.position.x / 2000) * 100
      const yPercent = (node.position.y / 1000) * 100

      // If editing a keyframe in Strategic View, update keyframe positions
      if (isEditingKeyframe) {
        updateKeyframeContextPosition(activeKeyframeId!, node.id, xPercent, yPercent)
      } else {
        // Otherwise update base positions
        if (viewMode === 'distillation') {
          updateContextPosition(node.id, {
            flow: { x: context.positions.flow.x },
            strategic: { x: context.positions.strategic.x },
            distillation: { x: xPercent, y: 100 - yPercent }, // Invert Y back to 0=bottom, 100=top
            shared: { y: context.positions.shared.y },
          })
        } else if (viewMode === 'flow') {
          updateContextPosition(node.id, {
            flow: { x: xPercent },
            strategic: { x: context.positions.strategic.x },
            distillation: { x: context.positions.distillation.x, y: context.positions.distillation.y },
            shared: { y: yPercent },
          })
        } else {
          updateContextPosition(node.id, {
            flow: { x: context.positions.flow.x },
            strategic: { x: xPercent },
            distillation: { x: context.positions.distillation.x, y: context.positions.distillation.y },
            shared: { y: yPercent },
          })
        }
      }
    }
  }, [viewMode, updateContextPosition, updateMultipleContextPositions, updateUserPosition, updateUserNeedPosition, updateKeyframeContextPosition, project, selectedContextIds, nodes, activeKeyframeId, setDragging])

  // Handle node deletion via keyboard (Delete/Backspace key)
  const onNodesDelete = useCallback((deletedNodes: Node[]) => {
    for (const node of deletedNodes) {
      switch (node.type) {
        case 'context':
          deleteContext(node.id)
          break
        case 'user':
          deleteUser(node.id)
          break
        case 'userNeed':
          deleteUserNeed(node.id)
          break
        case 'group':
          deleteGroup(node.id)
          break
      }
    }
  }, [deleteContext, deleteUser, deleteUserNeed, deleteGroup])

  // Handle keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        useEditorStore.setState({ selectedContextId: null })
      }
      // Delete/Backspace: Delete selected connection edges
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const state = useEditorStore.getState()
        // Delete selected user-need connection
        if (state.selectedUserNeedConnectionId) {
          e.preventDefault()
          state.deleteUserNeedConnection(state.selectedUserNeedConnectionId)
        }
        // Delete selected need-context connection
        if (state.selectedNeedContextConnectionId) {
          e.preventDefault()
          state.deleteNeedContextConnection(state.selectedNeedContextConnectionId)
        }
      }
      // Undo: Cmd/Ctrl + Z
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        useEditorStore.getState().undo()
      }
      // Redo: Cmd/Ctrl + Shift + Z
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault()
        useEditorStore.getState().redo()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const flowStages = project?.viewConfig.flowStages || []

  return (
    <div className="relative w-full h-full">
      <TimeSlider />
      <div className={`react-flow-wrapper w-full h-full ${isDragging ? 'dragging' : ''}`}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onNodesDelete={onNodesDelete}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodeClick={onNodeClick}
          onEdgeClick={onEdgeClick}
          onPaneClick={onPaneClick}
          onNodeDragStart={() => setDragging(true)}
          onNodeDrag={constrainNodePosition}
          onNodeDragStop={onNodeDragStop}
          onInit={onInit}
          elementsSelectable
          deleteKeyCode={['Backspace', 'Delete']}
          minZoom={0.1}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
        >
        {/* Wardley-style background with very subtle dots */}
        <Background gap={24} size={0.4} color="#e5e7eb" />

        {/* Canvas boundary - marks the edges of the workspace */}
        <CanvasBoundary />

        <CustomControls />

        {viewMode === 'distillation' ? (
          <DistillationRegions />
        ) : viewMode === 'flow' ? (
          <>
            <ProblemSpaceBand />
            <StageBoundaryLines stages={flowStages} />
            <StageLabels stages={flowStages} />
            <YAxisLabels />
          </>
        ) : (
          <>
            <ProblemSpaceBand />
            <EvolutionBands />
            <YAxisLabels />
          </>
        )}

        {/* Issue labels overlay - visible in all views when enabled */}
        {showIssueLabels && project && (
          <IssueLabelsOverlay contexts={project.contexts} viewMode={viewMode} />
        )}

        {/* Team labels overlay - visible in all views when enabled */}
        {showTeamLabels && project && project.teams && (
          <TeamLabelsOverlay contexts={project.contexts} teams={project.teams} viewMode={viewMode} onTeamClick={setSelectedTeam} />
        )}

        {/* Arrow marker definitions */}
        <svg style={{ position: 'absolute', top: 0, left: 0 }}>
          <defs>
            {/* Marker for relationship edges - default state */}
            <marker
              id="arrow-default"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto"
            >
              <path
                d="M 0 0 L 10 5 L 0 10 z"
                fill="#cbd5e1"
              />
            </marker>
            {/* Marker for relationship edges - hover state */}
            <marker
              id="arrow-hover"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto"
            >
              <path
                d="M 0 0 L 10 5 L 0 10 z"
                fill="#475569"
              />
            </marker>
            {/* Marker for relationship edges - selected state */}
            <marker
              id="arrow-selected"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto"
            >
              <path
                d="M 0 0 L 10 5 L 0 10 z"
                fill="#3b82f6"
              />
            </marker>
            {/* Marker for user connection edges */}
            <marker
              id="user-arrow"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto"
            >
              <path
                d="M 0 0 L 10 5 L 0 10 z"
                fill="#94a3b8"
              />
            </marker>
            {/* Marker for need-context connection edges */}
            <marker
              id="need-arrow"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto"
            >
              <path
                d="M 0 0 L 10 5 L 0 10 z"
                fill="#10b981"
              />
            </marker>
          </defs>
        </svg>
        </ReactFlow>
      </div>

      {/* Pattern Picker Dialog for context→context relationships */}
      {pendingConnection && project && (() => {
        const sourceContext = project.contexts.find(c => c.id === pendingConnection.sourceId)
        const targetContext = project.contexts.find(c => c.id === pendingConnection.targetId)
        if (!sourceContext || !targetContext) return null

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl w-[400px] max-w-[90vw] border border-slate-200 dark:border-neutral-700">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-neutral-700">
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Create Relationship
                </h2>
                <button
                  onClick={() => setPendingConnection(null)}
                  className="p-1 rounded hover:bg-slate-100 dark:hover:bg-neutral-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Context Preview */}
              <div className="px-4 pt-4 pb-2">
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <span className="font-medium text-slate-900 dark:text-slate-100">{sourceContext.name}</span>
                  <ArrowRight size={14} />
                  <span className="font-medium text-slate-900 dark:text-slate-100">{targetContext.name}</span>
                </div>
              </div>

              {/* Pattern Selection */}
              <div className="px-4 py-3 space-y-2 max-h-[400px] overflow-y-auto">
                {PATTERN_DEFINITIONS.map(p => (
                  <button
                    key={p.value}
                    onClick={() => {
                      useEditorStore.getState().addRelationship(
                        pendingConnection.sourceId,
                        pendingConnection.targetId,
                        p.value
                      )
                      setPendingConnection(null)
                    }}
                    className="w-full text-left px-3 py-2 rounded-md border border-slate-200 dark:border-neutral-600 hover:bg-slate-50 dark:hover:bg-neutral-700 hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
                  >
                    <div className="font-medium text-sm text-slate-900 dark:text-slate-100">
                      <span className="mr-1.5 text-slate-400">{POWER_DYNAMICS_ICONS[p.powerDynamics]}</span>
                      {p.label}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{p.shortDescription}</div>
                  </button>
                ))}
              </div>

              {/* Cancel button */}
              <div className="px-4 py-3 border-t border-slate-200 dark:border-neutral-700">
                <button
                  onClick={() => setPendingConnection(null)}
                  className="w-full px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-neutral-700 rounded transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Connection Guidance Tooltip for invalid connections */}
      {invalidConnectionAttempt && (
        <ConnectionGuidanceTooltip
          sourceType={invalidConnectionAttempt.sourceType}
          targetType={invalidConnectionAttempt.targetType}
          position={invalidConnectionAttempt.position}
          onDismiss={() => setInvalidConnectionAttempt(null)}
          onCreateUserNeed={() => {
            // Only handle User → Context case
            if (invalidConnectionAttempt.sourceType === 'user' && invalidConnectionAttempt.targetType === 'context') {
              const name = prompt('User need name:')
              if (name) {
                const store = useEditorStore.getState()
                const userId = invalidConnectionAttempt.sourceId
                const contextId = invalidConnectionAttempt.targetId

                // Get user position to place user need nearby
                const user = project?.users?.find(u => u.id === userId)
                const userPosition = user?.position ?? 50

                // Create the user need
                const newUserNeedId = store.addUserNeed(name)

                if (newUserNeedId) {
                  // Position user need at same horizontal position as user
                  store.updateUserNeed(newUserNeedId, { position: userPosition })

                  // Create User → UserNeed connection
                  store.createUserNeedConnection(userId, newUserNeedId)

                  // Create UserNeed → Context connection
                  store.createNeedContextConnection(newUserNeedId, contextId)
                }
              }
            }
            setInvalidConnectionAttempt(null)
          }}
          onLearnMore={() => {
            setShowValueChainGuide(true)
            setInvalidConnectionAttempt(null)
          }}
        />
      )}

      {/* Value Chain Guide Modal */}
      {showValueChainGuide && (
        <ValueChainGuideModal onClose={() => setShowValueChainGuide(false)} />
      )}

      {project && shouldShowGettingStartedGuide(project, seenSampleProjects, showGettingStartedGuide, hasSeenWelcome, dismissedGuideForEmptyProject) && (
        <GettingStartedGuideModal
          onClose={() => {
            setShowGettingStartedGuide(false)
            if (isSampleProject(project)) {
              setSeenSampleProjects(prev => new Set(prev).add(project.id))
            } else {
              setDismissedGuideForEmptyProject(true)
            }
          }}
        />
      )}
    </div>
  )
}

// Outer wrapper component with ReactFlowProvider
export function CanvasArea() {
  return (
    <ReactFlowProvider>
      <CanvasContent />
    </ReactFlowProvider>
  )
}
