import React from 'react'
import { Handle, Position } from 'reactflow'

const STUB_DEFAULT_OPACITY = 0.35
const STUB_HOVER_OPACITY = 1
const STUB_SIZE = 26
const STUB_OFFSET = 16
const STUB_DEFAULT_COLOR = '#475569'
const STUB_HOVER_COLOR = '#2563eb'
const STUB_TOOLTIP_TEXT = 'Drag to another context to map the relationship'

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

function getStubWrapperStyle(side: Side, visible: boolean): React.CSSProperties {
  const base: React.CSSProperties = {
    position: 'absolute',
    width: STUB_SIZE,
    height: STUB_SIZE,
    background: 'transparent',
    border: 'none',
    pointerEvents: visible ? 'auto' : 'none',
    opacity: visible ? 1 : 0,
    transition: 'opacity 0.15s',
    zIndex: 2,
    minWidth: STUB_SIZE,
    minHeight: STUB_SIZE,
    transform: 'none',
    borderRadius: 0,
  }
  switch (side) {
    case 'top':
      return { ...base, top: -STUB_OFFSET - STUB_SIZE / 2, left: '50%', marginLeft: -STUB_SIZE / 2 }
    case 'right':
      return {
        ...base,
        right: -STUB_OFFSET - STUB_SIZE / 2,
        top: '50%',
        marginTop: -STUB_SIZE / 2,
      }
    case 'bottom':
      return {
        ...base,
        bottom: -STUB_OFFSET - STUB_SIZE / 2,
        left: '50%',
        marginLeft: -STUB_SIZE / 2,
      }
    case 'left':
      return { ...base, left: -STUB_OFFSET - STUB_SIZE / 2, top: '50%', marginTop: -STUB_SIZE / 2 }
  }
}

function getTooltipStyle(side: Side, hovered: boolean): React.CSSProperties {
  const base: React.CSSProperties = {
    position: 'absolute',
    background: '#0f172a',
    color: 'white',
    fontSize: 11,
    padding: '4px 8px',
    borderRadius: 4,
    whiteSpace: 'nowrap',
    pointerEvents: 'none',
    opacity: hovered ? 1 : 0,
    transition: 'opacity 0.12s',
    zIndex: 3,
  }
  switch (side) {
    case 'top':
      return { ...base, left: '50%', bottom: STUB_SIZE + 6, transform: 'translateX(-50%)' }
    case 'right':
      return { ...base, left: STUB_SIZE + 6, top: '50%', transform: 'translateY(-50%)' }
    case 'bottom':
      return { ...base, left: '50%', top: STUB_SIZE + 6, transform: 'translateX(-50%)' }
    case 'left':
      return { ...base, right: STUB_SIZE + 6, top: '50%', transform: 'translateY(-50%)' }
  }
}

function ContextStub({ side, parentHovered }: { side: Side; parentHovered: boolean }) {
  const [stubHovered, setStubHovered] = React.useState(false)
  const fill = stubHovered ? STUB_HOVER_COLOR : STUB_DEFAULT_COLOR
  const svgOpacity = stubHovered ? STUB_HOVER_OPACITY : STUB_DEFAULT_OPACITY
  return (
    <Handle
      type="source"
      position={SIDE_POSITION[side]}
      id={`stub-${side}`}
      style={getStubWrapperStyle(side, parentHovered)}
      isConnectable={true}
    >
      <div
        data-context-stub={side}
        onMouseEnter={() => setStubHovered(true)}
        onMouseLeave={() => setStubHovered(false)}
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'crosshair',
          pointerEvents: 'auto',
        }}
      >
        <svg
          width={STUB_SIZE}
          height={STUB_SIZE}
          viewBox="0 0 18 18"
          style={{ opacity: svgOpacity, transition: 'opacity 0.12s', pointerEvents: 'none' }}
        >
          <path d={STUB_PATHS[side]} fill={fill} />
        </svg>
        <div style={getTooltipStyle(side, stubHovered)}>{STUB_TOOLTIP_TEXT}</div>
      </div>
    </Handle>
  )
}

export function ContextNodeStubs({ visible }: { visible: boolean }) {
  return (
    <>
      <ContextStub side="top" parentHovered={visible} />
      <ContextStub side="right" parentHovered={visible} />
      <ContextStub side="bottom" parentHovered={visible} />
      <ContextStub side="left" parentHovered={visible} />
    </>
  )
}
