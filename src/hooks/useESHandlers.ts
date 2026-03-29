import { useCallback, useState } from 'react'
import { useEditorStore } from '../model/store'
import type { ESStickyType } from '../components/nodes/ESStickyNode'
import type { ESToolMode } from '../model/storeTypes'
import type { Project } from '../model/types'
import { isValidESConnection, getConnectionLabel } from '../lib/esConnectionRules'
import type { Node } from 'reactflow'

// Module-level clipboard for ES sticky copy/paste
let esClipboard: { stickyType: string; name: string; description?: string } | null = null

export function useESHandlers() {
  const [esConnectingFromType, setEsConnectingFromType] = useState<ESStickyType | null>(null)

  // Handle dragover for ES sticky palette drops
  const handleESDragOver = useCallback((e: React.DragEvent) => {
    if (e.dataTransfer.types.includes('application/contextflow-es-sticky')) {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'copy'
    }
  }, [])

  // Handle drop of ES sticky from palette onto canvas
  const handleESDrop = useCallback(
    (
      e: React.DragEvent,
      screenToFlowPosition: (p: { x: number; y: number }) => { x: number; y: number }
    ) => {
      const data = e.dataTransfer.getData('application/contextflow-es-sticky')
      if (!data) return
      e.preventDefault()

      const { stickyType, defaultName } = JSON.parse(data)
      const flowPos = screenToFlowPosition({ x: e.clientX, y: e.clientY })
      const xPercent = Math.max(0, Math.min(100, (flowPos.x / 2000) * 100))
      const yPercent = Math.max(0, Math.min(100, (flowPos.y / 1000) * 100))
      const pos = { x: xPercent, y: yPercent }

      const state = useEditorStore.getState()
      if (stickyType === 'domainEvent') state.addDomainEvent(defaultName, pos)
      else if (stickyType === 'command') state.addCommand(defaultName, pos)
      else if (stickyType === 'aggregate') state.addESAggregate(defaultName, pos)
      else if (stickyType === 'policy') state.addPolicy(defaultName, pos)
      else if (stickyType === 'hotSpot') state.addESHotSpot(defaultName, pos)
    },
    []
  )

  // Handle ES sticky node click: update selection in store
  const handleESNodeClick = useCallback((nodeId: string, stickyType: string) => {
    const state = useEditorStore.getState()
    if (stickyType === 'domainEvent') state.setSelectedDomainEvent(nodeId)
    else if (stickyType === 'command') state.setSelectedCommand(nodeId)
    else if (stickyType === 'aggregate') state.setSelectedESAggregate(nodeId)
    else if (stickyType === 'policy') state.setSelectedPolicy(nodeId)
    else if (stickyType === 'hotSpot') state.setSelectedESHotSpot(nodeId)
  }, [])

  // Track which sticky type is being dragged from (to highlight valid targets)
  const handleESConnectStart = useCallback((nodeId: string | null, nodes: Node[]) => {
    if (!nodeId) return
    const sourceNode = nodes.find((n) => n.id === nodeId)
    if (sourceNode?.type === 'esSticky') {
      setEsConnectingFromType(sourceNode.data?.stickyType as ESStickyType)
    }
  }, [])

  // Clear the connecting-from type when connection drag ends
  const handleESConnectEnd = useCallback(() => {
    setEsConnectingFromType(null)
  }, [])

  // Validate and create an ES sticky-to-sticky connection
  const handleESConnect = useCallback(
    (
      source: string,
      target: string,
      sourceNode: Node | undefined,
      targetNode: Node | undefined
    ) => {
      if (!sourceNode || !targetNode) return
      const srcType = sourceNode.data?.stickyType as ESStickyType
      const tgtType = targetNode.data?.stickyType as ESStickyType
      if (!isValidESConnection(srcType, tgtType)) return
      const connId = useEditorStore.getState().createESConnection(source, target)
      const label = getConnectionLabel(srcType, tgtType)
      if (connId && label) {
        useEditorStore.getState().updateESConnection(connId, { label })
      }
    },
    []
  )

  // Handle pane click in ES view: create sticky if a sticky tool is active.
  // Returns true if the click was handled (caller should return early).
  const handleESPaneClick = useCallback(
    (flowPos: { x: number; y: number }): boolean => {
      const currentTool = useEditorStore.getState().esToolMode
      const stickyTypes = ['domainEvent', 'command', 'aggregate', 'policy', 'hotSpot']

      if (!stickyTypes.includes(currentTool)) return false

      const xPercent = Math.max(0, Math.min(100, (flowPos.x / 2000) * 100))
      const yPercent = Math.max(0, Math.min(100, (flowPos.y / 1000) * 100))
      const pos = { x: xPercent, y: yPercent }

      const defaultNames: Record<string, string> = {
        domainEvent: 'New Event',
        command: 'New Command',
        aggregate: 'New Aggregate',
        policy: 'New Policy',
        hotSpot: 'New Hot Spot',
      }

      const state = useEditorStore.getState()
      if (currentTool === 'domainEvent') state.addDomainEvent(defaultNames.domainEvent, pos)
      else if (currentTool === 'command') state.addCommand(defaultNames.command, pos)
      else if (currentTool === 'aggregate') state.addESAggregate(defaultNames.aggregate, pos)
      else if (currentTool === 'policy') state.addPolicy(defaultNames.policy, pos)
      else if (currentTool === 'hotSpot') state.addESHotSpot(defaultNames.hotSpot, pos)
      return true
    },
    []
  )

  // Delete an ES sticky node from the store
  const handleESNodeDelete = useCallback((nodeId: string, stickyType: string) => {
    const st = useEditorStore.getState()
    if (stickyType === 'domainEvent') st.deleteDomainEvent(nodeId)
    else if (stickyType === 'command') st.deleteCommand(nodeId)
    else if (stickyType === 'aggregate') st.deleteESAggregate(nodeId)
    else if (stickyType === 'policy') st.deletePolicy(nodeId)
    else if (stickyType === 'hotSpot') st.deleteESHotSpot(nodeId)
  }, [])

  // Handle ALL ES keyboard shortcuts: tool modes, escape, copy, paste
  const handleESKeyDown = useCallback(
    (e: KeyboardEvent, viewMode: string, project: Project | undefined) => {
      if (viewMode !== 'eventstorming') return

      const currentState = useEditorStore.getState()

      // Tool mode shortcuts (only when not in inputs, no modifier keys)
      if (!e.metaKey && !e.ctrlKey) {
        const tag = (e.target as HTMLElement)?.tagName
        if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
          const toolShortcuts: Record<string, string> = {
            v: 'select',
            h: 'pan',
            '1': 'domainEvent',
            '2': 'command',
            '3': 'aggregate',
            '4': 'policy',
            '5': 'hotSpot',
            c: 'connect',
            a: 'areaSelect',
          }
          const tool = toolShortcuts[e.key.toLowerCase()]
          if (tool) {
            currentState.setESToolMode(tool as ESToolMode)
            return
          }
          // Escape returns to select
          if (e.key === 'Escape') {
            currentState.setESToolMode('select')
            return
          }
        }
      }

      // Copy: Ctrl/Cmd+C
      if ((e.metaKey || e.ctrlKey) && e.key === 'c') {
        const tag = (e.target as HTMLElement)?.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA') return
        const es = project?.eventStorming
        if (!es) return
        const s = useEditorStore.getState()
        if (s.selectedDomainEventId) {
          const evt = es.domainEvents.find((ev) => ev.id === s.selectedDomainEventId)
          if (evt)
            esClipboard = {
              stickyType: 'domainEvent',
              name: evt.name,
              description: evt.description,
            }
        } else if (s.selectedCommandId) {
          const cmd = es.commands.find((c) => c.id === s.selectedCommandId)
          if (cmd)
            esClipboard = { stickyType: 'command', name: cmd.name, description: cmd.description }
        } else if (s.selectedESAggregateId) {
          const agg = es.aggregates.find((a) => a.id === s.selectedESAggregateId)
          if (agg)
            esClipboard = {
              stickyType: 'aggregate',
              name: agg.name,
              description: agg.description,
            }
        } else if (s.selectedPolicyId) {
          const pol = es.policies.find((p) => p.id === s.selectedPolicyId)
          if (pol)
            esClipboard = { stickyType: 'policy', name: pol.name, description: pol.description }
        } else if (s.selectedESHotSpotId) {
          const hs = es.hotSpots.find((h) => h.id === s.selectedESHotSpotId)
          if (hs)
            esClipboard = { stickyType: 'hotSpot', name: hs.title, description: hs.description }
        }
        return
      }

      // Paste: Ctrl/Cmd+V
      if ((e.metaKey || e.ctrlKey) && e.key === 'v' && esClipboard) {
        const tag = (e.target as HTMLElement)?.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA') return
        e.preventDefault()
        const pasteState = useEditorStore.getState()
        const name = `${esClipboard.name} (copy)`
        const offset = { x: 50 + Math.random() * 10, y: 50 + Math.random() * 10 }
        if (esClipboard.stickyType === 'domainEvent') pasteState.addDomainEvent(name, offset)
        else if (esClipboard.stickyType === 'command') pasteState.addCommand(name, offset)
        else if (esClipboard.stickyType === 'aggregate') pasteState.addESAggregate(name, offset)
        else if (esClipboard.stickyType === 'policy') pasteState.addPolicy(name, offset)
        else if (esClipboard.stickyType === 'hotSpot') pasteState.addESHotSpot(name, offset)
      }
    },
    []
  )

  return {
    esConnectingFromType,
    handleESDragOver,
    handleESDrop,
    handleESNodeClick,
    handleESConnectStart,
    handleESConnectEnd,
    handleESConnect,
    handleESPaneClick,
    handleESNodeDelete,
    handleESKeyDown,
  }
}
