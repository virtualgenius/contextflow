import React from 'react'
import { useViewport, useReactFlow } from 'reactflow'
import type { ESSwimLane } from '../../model/types'
import { useEditorStore } from '../../model/store'
import { ES_W, ES_H } from '../../lib/esCanvasConfig'

export function SwimLaneLines({ swimLanes }: { swimLanes: ESSwimLane[] }) {
  useViewport()
  const { flowToScreenPosition, screenToFlowPosition } = useReactFlow()
  const selectedSwimLaneId = useEditorStore((s) => s.selectedSwimLaneId)
  const setSelectedSwimLane = useEditorStore((s) => s.setSelectedSwimLane)
  const updateSwimLane = useEditorStore((s) => s.updateSwimLane)
  const esToolMode = useEditorStore((s) => s.esToolMode)

  const [canvasBounds, setCanvasBounds] = React.useState<DOMRect | null>(null)

  React.useEffect(() => {
    const el = document.querySelector('.react-flow-wrapper')
    if (!el) return
    const update = () => setCanvasBounds(el.getBoundingClientRect())
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  if (swimLanes.length === 0) return null
  if (!canvasBounds) return null

  const startDrag = (
    e: React.MouseEvent,
    lane: ESSwimLane,
    mode: 'move' | 'left' | 'right' | 'top' | 'bottom'
  ) => {
    if (esToolMode !== 'select') return
    e.stopPropagation()
    setSelectedSwimLane(lane.id)

    const startSX = e.clientX
    const startSY = e.clientY
    const snap = { x: lane.x, y: lane.y, width: lane.width }

    const onMouseMove = (me: MouseEvent) => {
      const dx = me.clientX - startSX
      const dy = me.clientY - startSY
      const orig = screenToFlowPosition({ x: 0, y: 0 })
      const dFlow = screenToFlowPosition({ x: dx, y: dy })
      const dfx = (dFlow.x - orig.x) / ES_W * 100
      const dfy = (dFlow.y - orig.y) / ES_H * 100

      if (mode === 'move') {
        updateSwimLane(lane.id, {
          x: Math.max(0, Math.min(100 - snap.width, snap.x + dfx)),
          y: Math.max(0, Math.min(100, snap.y + dfy)),
        })
      } else if (mode === 'left') {
        const newX = Math.max(0, Math.min(snap.x + snap.width - 5, snap.x + dfx))
        const newW = snap.x + snap.width - newX
        updateSwimLane(lane.id, { x: newX, width: newW })
      } else if (mode === 'right') {
        const newW = Math.max(5, Math.min(100 - snap.x, snap.width + dfx))
        updateSwimLane(lane.id, { width: newW })
      } else if (mode === 'top') {
        updateSwimLane(lane.id, { y: Math.max(0, Math.min(100, snap.y + dfy)) })
      } else if (mode === 'bottom') {
        updateSwimLane(lane.id, { y: Math.max(0, Math.min(100, snap.y + dfy)) })
      }
    }
    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  return (
    <>
      {swimLanes.map((lane) => {
        const leftFlow = (lane.x / 100) * ES_W
        const rightFlow = ((lane.x + lane.width) / 100) * ES_W
        const yFlow = (lane.y / 100) * ES_H

        const leftScreen = flowToScreenPosition({ x: leftFlow, y: yFlow })
        const rightScreen = flowToScreenPosition({ x: rightFlow, y: yFlow })
        const isSelected = lane.id === selectedSwimLaneId

        const screenLeft = leftScreen.x
        const screenTop = leftScreen.y
        const width = rightScreen.x - leftScreen.x
        const color = isSelected ? '#3b82f6' : '#94a3b8'
        const lineH = isSelected ? 3 : 2

        return (
          <div
            key={lane.id}
            style={{
              position: 'fixed',
              left: screenLeft,
              top: screenTop,
              width,
              height: 0,
              pointerEvents: 'none',
              zIndex: 5,
            }}
          >
            {/* Main line (drag to move) */}
            <div
              style={{
                position: 'absolute',
                top: -lineH / 2,
                left: 0,
                width: '100%',
                height: lineH + 16,
                marginTop: -8,
                pointerEvents: 'auto',
                cursor: esToolMode === 'select' ? 'move' : 'default',
              }}
              onClick={(e) => { e.stopPropagation(); setSelectedSwimLane(isSelected ? null : lane.id) }}
              onMouseDown={(e) => startDrag(e, lane, 'move')}
            >
              <div style={{
                position: 'absolute',
                top: 8,
                left: 0,
                width: '100%',
                height: lineH,
                background: isSelected ? color : `repeating-linear-gradient(to right, ${color} 0, ${color} 8px, transparent 8px, transparent 16px)`,
              }} />
            </div>

            {/* Left handle */}
            <div
              style={{
                position: 'absolute',
                left: -5,
                top: -5,
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: color,
                border: '2px solid white',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                pointerEvents: 'auto',
                cursor: 'ew-resize',
                opacity: isSelected ? 1 : 0.4,
              }}
              onMouseDown={(e) => { e.stopPropagation(); startDrag(e, lane, 'left') }}
            />

            {/* Right handle */}
            <div
              style={{
                position: 'absolute',
                right: -5,
                top: -5,
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: color,
                border: '2px solid white',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                pointerEvents: 'auto',
                cursor: 'ew-resize',
                opacity: isSelected ? 1 : 0.4,
              }}
              onMouseDown={(e) => { e.stopPropagation(); startDrag(e, lane, 'right') }}
            />
          </div>
        )
      })}
    </>
  )
}
