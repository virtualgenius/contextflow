import React from 'react'
import { useViewport, useReactFlow } from 'reactflow'
import type { PivotalEvent } from '../../model/types'
import { useEditorStore } from '../../model/store'
import { ES_W, ES_H } from '../../lib/esCanvasConfig'

export function PivotalEventLines({ pivotalEvents }: { pivotalEvents: PivotalEvent[] }) {
  useViewport()
  const { flowToScreenPosition, screenToFlowPosition } = useReactFlow()
  const selectedPivotalEventId = useEditorStore((s) => s.selectedPivotalEventId)
  const setSelectedPivotalEvent = useEditorStore((s) => s.setSelectedPivotalEvent)
  const updatePivotalEvent = useEditorStore((s) => s.updatePivotalEvent)
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

  if (pivotalEvents.length === 0) return null
  if (!canvasBounds) return null

  const startDrag = (
    e: React.MouseEvent,
    pe: PivotalEvent,
    mode: 'move' | 'top' | 'bottom'
  ) => {
    if (esToolMode !== 'select') return
    e.stopPropagation()
    setSelectedPivotalEvent(pe.id)

    const startSX = e.clientX
    const startSY = e.clientY
    const snap = { x: pe.x, y: pe.y, height: pe.height }

    const onMouseMove = (me: MouseEvent) => {
      const dx = me.clientX - startSX
      const dy = me.clientY - startSY
      const orig = screenToFlowPosition({ x: 0, y: 0 })
      const dFlow = screenToFlowPosition({ x: dx, y: dy })
      const dfx = (dFlow.x - orig.x) / ES_W * 100
      const dfy = (dFlow.y - orig.y) / ES_H * 100

      if (mode === 'move') {
        updatePivotalEvent(pe.id, {
          x: Math.max(0, Math.min(100, snap.x + dfx)),
          y: Math.max(0, Math.min(100 - snap.height, snap.y + dfy)),
        })
      } else if (mode === 'top') {
        const newY = Math.max(0, Math.min(snap.y + snap.height - 5, snap.y + dfy))
        const newH = snap.y + snap.height - newY
        updatePivotalEvent(pe.id, { y: newY, height: newH })
      } else if (mode === 'bottom') {
        const newH = Math.max(5, Math.min(100 - snap.y, snap.height + dfy))
        updatePivotalEvent(pe.id, { height: newH })
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
      {pivotalEvents.map((pe) => {
        const topScreen = flowToScreenPosition({ x: (pe.x / 100) * ES_W, y: (pe.y / 100) * ES_H })
        const bottomScreen = flowToScreenPosition({ x: (pe.x / 100) * ES_W, y: ((pe.y + pe.height) / 100) * ES_H })
        const isSelected = pe.id === selectedPivotalEventId
        const color = isSelected ? '#3b82f6' : '#f97316'
        const lineW = isSelected ? 3 : 2
        const height = bottomScreen.y - topScreen.y

        // Clamp to canvas bounds
        const clampedTop = Math.max(canvasBounds.top, topScreen.y)
        const clampedBottom = Math.min(canvasBounds.top + canvasBounds.height, bottomScreen.y)
        const clampedHeight = Math.max(0, clampedBottom - clampedTop)

        return (
          <div
            key={pe.id}
            style={{
              position: 'fixed',
              left: topScreen.x,
              top: clampedTop,
              width: 0,
              height: clampedHeight,
              pointerEvents: 'none',
              zIndex: 5,
            }}
          >
            {/* Main line (drag to move) */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: -8,
                width: 16,
                height: '100%',
                pointerEvents: 'auto',
                cursor: esToolMode === 'select' ? 'move' : 'default',
              }}
              onClick={(e) => { e.stopPropagation(); setSelectedPivotalEvent(isSelected ? null : pe.id) }}
              onMouseDown={(e) => startDrag(e, pe, 'move')}
            >
              <div style={{
                position: 'absolute',
                top: 0,
                left: 8,
                width: lineW,
                height: '100%',
                background: isSelected
                  ? color
                  : `repeating-linear-gradient(to bottom, ${color} 0, ${color} 8px, transparent 8px, transparent 16px)`,
              }} />
            </div>

            {/* Label */}
            {height > 20 && (
              <div style={{
                position: 'absolute',
                top: 8,
                left: 10,
                fontSize: 11,
                fontWeight: 600,
                color,
                backgroundColor: 'rgba(255,255,255,0.9)',
                padding: '2px 6px',
                borderRadius: 3,
                whiteSpace: 'nowrap',
                border: `1px solid ${color}`,
                pointerEvents: 'none',
              }}>
                {pe.name}
              </div>
            )}

            {/* Top handle */}
            {topScreen.y >= canvasBounds.top && (
              <div
                style={{
                  position: 'absolute',
                  top: -5,
                  left: -5,
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: color,
                  border: '2px solid white',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                  pointerEvents: 'auto',
                  cursor: 'ns-resize',
                  opacity: isSelected ? 1 : 0.4,
                }}
                onMouseDown={(e) => { e.stopPropagation(); startDrag(e, pe, 'top') }}
              />
            )}

            {/* Bottom handle */}
            {bottomScreen.y <= canvasBounds.top + canvasBounds.height && (
              <div
                style={{
                  position: 'absolute',
                  bottom: -5,
                  left: -5,
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: color,
                  border: '2px solid white',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                  pointerEvents: 'auto',
                  cursor: 'ns-resize',
                  opacity: isSelected ? 1 : 0.4,
                }}
                onMouseDown={(e) => { e.stopPropagation(); startDrag(e, pe, 'bottom') }}
              />
            )}
          </div>
        )
      })}
    </>
  )
}
