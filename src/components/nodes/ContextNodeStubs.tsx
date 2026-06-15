import React from 'react'
import { createPortal } from 'react-dom'
import { Z_LAYERS } from '../../lib/zLayers'
import { Handle, Position } from 'reactflow'

const STUB_DEFAULT_OPACITY = 0.2
const STUB_HOVER_OPACITY = 1
export const STUB_SIZE = 26
export const STUB_OFFSET = 16
const STUB_DEFAULT_COLOR = '#475569'
const STUB_HOVER_COLOR = '#2563eb'
const SIDE_SPAWN_LABEL: Record<Side, string> = {
  top: 'upstream',
  right: 'shared kernel',
  bottom: 'downstream',
  left: 'partnership',
}
const STUB_TOOLTIP_MAX_WIDTH = 160
const STUB_TOOLTIP_OFFSET = 8
const STUB_TOOLTIP_VIEWPORT_PADDING = 8

type Side = 'top' | 'right' | 'bottom' | 'left'

const SIDE_POSITION: Record<Side, Position> = {
  top: Position.Top,
  right: Position.Right,
  bottom: Position.Bottom,
  left: Position.Left,
}

const STUB_PATHS: Record<Side, string> = {
  top: 'M9 1 L17 13 L1 13 Z',
  right: 'M17 9 L5 17 L5 1 Z',
  bottom: 'M9 17 L1 5 L17 5 Z',
  left: 'M1 9 L13 1 L13 17 Z',
}

// The Handle is rendered as a 1px transparent dot at the card edge so
// React Flow's connection-line origin lands ON the card border (matching
// the mockup), rather than 29px out at the visible nub position. We omit
// opacity here because CSS opacity cascades to descendants, which would
// also fade the visible nub child.
function getHandleEdgeStyle(side: Side): React.CSSProperties {
  const base: React.CSSProperties = {
    position: 'absolute',
    width: 1,
    height: 1,
    background: 'transparent',
    border: 'none',
    pointerEvents: 'none',
    zIndex: 2,
    minWidth: 1,
    minHeight: 1,
    transform: 'none',
    borderRadius: 0,
  }
  switch (side) {
    case 'top':
      return { ...base, top: 0, left: '50%', marginLeft: -0.5 }
    case 'right':
      return { ...base, right: 0, top: '50%', marginTop: -0.5 }
    case 'bottom':
      return { ...base, bottom: 0, left: '50%', marginLeft: -0.5 }
    case 'left':
      return { ...base, left: 0, top: '50%', marginTop: -0.5 }
  }
}

// The visible nub is a child of the Handle, positioned outside the card
// via absolute offsets. We add the 'source' class manually so React Flow's
// elementFromPoint hit-test identifies a mousedown on the nub as a source
// handle (its parent Handle has the same class but is 1px and hidden).
function getNubStyle(side: Side, visible: boolean): React.CSSProperties {
  // pointer-events follows visibility: invisible stubs must not intercept
  // hover for edges or other elements behind them. The brief hover-leave
  // delay on the parent node keeps visibility alive long enough for the
  // cursor to traverse the air gap from the node body to the stub.
  const base: React.CSSProperties = {
    position: 'absolute',
    width: STUB_SIZE,
    height: STUB_SIZE,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'crosshair',
    pointerEvents: visible ? 'auto' : 'none',
    opacity: visible ? 1 : 0,
    transition: 'opacity 0.15s',
  }
  switch (side) {
    case 'top':
      return { ...base, top: -STUB_OFFSET - STUB_SIZE / 2, left: -STUB_SIZE / 2 }
    case 'right':
      return { ...base, right: -STUB_OFFSET - STUB_SIZE / 2, top: -STUB_SIZE / 2 }
    case 'bottom':
      return { ...base, bottom: -STUB_OFFSET - STUB_SIZE / 2, left: -STUB_SIZE / 2 }
    case 'left':
      return { ...base, left: -STUB_OFFSET - STUB_SIZE / 2, top: -STUB_SIZE / 2 }
  }
}

function computeTooltipPosition(
  side: Side,
  triggerRect: DOMRect,
  tooltipSize: { width: number; height: number }
): { left: number; top: number } {
  let left = 0
  let top = 0
  switch (side) {
    case 'top':
      left = triggerRect.left + triggerRect.width / 2 - tooltipSize.width / 2
      top = triggerRect.top - tooltipSize.height - STUB_TOOLTIP_OFFSET
      break
    case 'right':
      left = triggerRect.right + STUB_TOOLTIP_OFFSET
      top = triggerRect.top + triggerRect.height / 2 - tooltipSize.height / 2
      break
    case 'bottom':
      left = triggerRect.left + triggerRect.width / 2 - tooltipSize.width / 2
      top = triggerRect.bottom + STUB_TOOLTIP_OFFSET
      break
    case 'left':
      left = triggerRect.left - tooltipSize.width - STUB_TOOLTIP_OFFSET
      top = triggerRect.top + triggerRect.height / 2 - tooltipSize.height / 2
      break
  }
  const maxLeft = window.innerWidth - tooltipSize.width - STUB_TOOLTIP_VIEWPORT_PADDING
  const maxTop = window.innerHeight - tooltipSize.height - STUB_TOOLTIP_VIEWPORT_PADDING
  return {
    left: Math.max(STUB_TOOLTIP_VIEWPORT_PADDING, Math.min(left, maxLeft)),
    top: Math.max(STUB_TOOLTIP_VIEWPORT_PADDING, Math.min(top, maxTop)),
  }
}

function ContextStub({
  side,
  parentHovered,
  onHoverChange,
}: {
  side: Side
  parentHovered: boolean
  onHoverChange: (side: Side, hovered: boolean) => void
}) {
  const [stubHovered, setStubHovered] = React.useState(false)
  const nubRef = React.useRef<HTMLDivElement>(null)
  const tooltipRef = React.useRef<HTMLDivElement>(null)
  const [coords, setCoords] = React.useState({ left: 0, top: 0 })

  React.useEffect(() => {
    if (!stubHovered || !nubRef.current) return
    const triggerRect = nubRef.current.getBoundingClientRect()
    const tooltipRect = tooltipRef.current?.getBoundingClientRect()
    const tooltipSize = {
      width: tooltipRect?.width || STUB_TOOLTIP_MAX_WIDTH,
      height: tooltipRect?.height || 24,
    }
    setCoords(computeTooltipPosition(side, triggerRect, tooltipSize))
  }, [stubHovered, side])

  const fill = stubHovered ? STUB_HOVER_COLOR : STUB_DEFAULT_COLOR
  const svgOpacity = stubHovered ? STUB_HOVER_OPACITY : STUB_DEFAULT_OPACITY

  const tooltip =
    stubHovered &&
    createPortal(
      <div
        ref={tooltipRef}
        className="fixed pointer-events-none"
        style={{ left: coords.left, top: coords.top, zIndex: Z_LAYERS.tooltip }}
      >
        <div
          className="px-2 py-1 bg-slate-800 dark:bg-slate-700 text-white text-xs rounded shadow-lg"
          style={{ maxWidth: STUB_TOOLTIP_MAX_WIDTH, whiteSpace: 'normal' }}
        >
          {`Click: new ${SIDE_SPAWN_LABEL[side]} · Drag: connect`}
        </div>
      </div>,
      document.body
    )

  return (
    <Handle
      type="source"
      position={SIDE_POSITION[side]}
      id={`stub-${side}`}
      style={getHandleEdgeStyle(side)}
      isConnectable={true}
    >
      <div
        ref={nubRef}
        className="source"
        data-context-stub={side}
        onMouseEnter={() => {
          setStubHovered(true)
          onHoverChange(side, true)
        }}
        onMouseLeave={() => {
          setStubHovered(false)
          onHoverChange(side, false)
        }}
        style={getNubStyle(side, parentHovered)}
      >
        <svg
          width={STUB_SIZE}
          height={STUB_SIZE}
          viewBox="0 0 18 18"
          style={{
            opacity: svgOpacity,
            transition: 'opacity 0.12s',
            pointerEvents: 'none',
          }}
        >
          <path d={STUB_PATHS[side]} fill={fill} />
        </svg>
      </div>
      {tooltip}
    </Handle>
  )
}

export function ContextNodeStubs({
  visible,
  onStubHoveredChange,
}: {
  visible: boolean
  onStubHoveredChange?: (hovered: boolean) => void
}) {
  const [hoveredSides, setHoveredSides] = React.useState<Set<Side>>(() => new Set())

  const handleHoverChange = React.useCallback((side: Side, hovered: boolean) => {
    setHoveredSides((prev) => {
      const next = new Set(prev)
      if (hovered) next.add(side)
      else next.delete(side)
      return next
    })
  }, [])

  const anyStubHovered = hoveredSides.size > 0
  React.useEffect(() => {
    onStubHoveredChange?.(anyStubHovered)
  }, [anyStubHovered, onStubHoveredChange])

  return (
    <>
      <ContextStub side="top" parentHovered={visible} onHoverChange={handleHoverChange} />
      <ContextStub side="right" parentHovered={visible} onHoverChange={handleHoverChange} />
      <ContextStub side="bottom" parentHovered={visible} onHoverChange={handleHoverChange} />
      <ContextStub side="left" parentHovered={visible} onHoverChange={handleHoverChange} />
    </>
  )
}
