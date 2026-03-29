import React from 'react'
import { useEditorStore } from '../model/store'

export interface ESAreaSelectState {
  areaSelectRect: { startX: number; startY: number; endX: number; endY: number } | null
  selectedStickyIds: string[]
  setSelectedStickyIds: React.Dispatch<React.SetStateAction<string[]>>
  stickyMenuMode: 'menu' | 'newContext' | 'pickContext'
  setStickyMenuMode: React.Dispatch<React.SetStateAction<'menu' | 'newContext' | 'pickContext'>>
  newContextName: string
  setNewContextName: React.Dispatch<React.SetStateAction<string>>
  clearSelection: () => void
  toggleStickySelection: (id: string) => void
  onWrapperMouseDown: (e: React.MouseEvent) => void
  onWrapperMouseMove: (e: React.MouseEvent) => void
  onWrapperMouseUp: () => void
}

export function useESAreaSelect(): ESAreaSelectState {
  const esToolMode = useEditorStore((s) => s.esToolMode)
  const viewMode = useEditorStore((s) => s.activeViewMode)

  const [areaSelectRect, setAreaSelectRect] = React.useState<{
    startX: number
    startY: number
    endX: number
    endY: number
  } | null>(null)

  const [selectedStickyIds, setSelectedStickyIds] = React.useState<string[]>([])
  const [stickyMenuMode, setStickyMenuMode] = React.useState<'menu' | 'newContext' | 'pickContext'>('menu')
  const [newContextName, setNewContextName] = React.useState('')

  const clearSelection = React.useCallback(() => {
    setSelectedStickyIds([])
    setStickyMenuMode('menu')
    setNewContextName('')
  }, [])

  // Toggle a single sticky in/out of the multi-selection (used by shift+click in select mode)
  const toggleStickySelection = React.useCallback((id: string) => {
    setSelectedStickyIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }, [])

  const onWrapperMouseDown = React.useCallback(
    (e: React.MouseEvent) => {
      const isSelectMode = viewMode === 'eventstorming' && (esToolMode === 'areaSelect' || esToolMode === 'select')
      if (!isSelectMode) return
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'BUTTON' || tag === 'INPUT') return
      // Only start drag-rect if clicking on canvas background (not on a sticky node)
      const target = e.target as HTMLElement
      const isOnNode = !!target.closest('.react-flow__node')
      if (isOnNode) return
      setAreaSelectRect({ startX: e.clientX, startY: e.clientY, endX: e.clientX, endY: e.clientY })
      setSelectedStickyIds([])
    },
    [viewMode, esToolMode]
  )

  const onWrapperMouseMove = React.useCallback(
    (e: React.MouseEvent) => {
      if (areaSelectRect) {
        setAreaSelectRect((r) => (r ? { ...r, endX: e.clientX, endY: e.clientY } : null))
      }
    },
    [areaSelectRect]
  )

  const onWrapperMouseUp = React.useCallback(() => {
    if (areaSelectRect && viewMode === 'eventstorming') {
      const rect = {
        left: Math.min(areaSelectRect.startX, areaSelectRect.endX),
        top: Math.min(areaSelectRect.startY, areaSelectRect.endY),
        right: Math.max(areaSelectRect.startX, areaSelectRect.endX),
        bottom: Math.max(areaSelectRect.startY, areaSelectRect.endY),
      }
      const insideIds: string[] = []
      const nodeElements = document.querySelectorAll('.react-flow__node')
      nodeElements.forEach((el) => {
        const nodeRect = el.getBoundingClientRect()
        const cx = nodeRect.left + nodeRect.width / 2
        const cy = nodeRect.top + nodeRect.height / 2
        if (cx >= rect.left && cx <= rect.right && cy >= rect.top && cy <= rect.bottom) {
          const nodeId = el.getAttribute('data-id')
          if (nodeId) insideIds.push(nodeId)
        }
      })
      setSelectedStickyIds(insideIds)
      setAreaSelectRect(null)
    }
  }, [areaSelectRect, viewMode])

  return {
    areaSelectRect,
    selectedStickyIds,
    setSelectedStickyIds,
    stickyMenuMode,
    setStickyMenuMode,
    newContextName,
    setNewContextName,
    clearSelection,
    toggleStickySelection,
    onWrapperMouseDown,
    onWrapperMouseMove,
    onWrapperMouseUp,
  }
}
