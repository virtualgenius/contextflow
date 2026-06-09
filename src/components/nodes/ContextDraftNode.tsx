import React from 'react'
import { NodeProps } from 'reactflow'
import { useEditorStore } from '../../model/store'
import type { ContextDraft } from '../../model/storeTypes'
import { NODE_SIZES } from '../../lib/canvasConstants'

interface ContextDraftData {
  draft: ContextDraft
  // Flow-percentage position for standalone (kind 'at'/'center') creations.
  position: { x: number; y: number }
}

// Return focus to the canvas so the next arrow keystroke reaches the canvas
// keydown handler. Without this, focus falls back to <body> after the input is
// removed and the keystroke is lost, breaking keyboard chaining.
function returnFocusToCanvas(): void {
  const wrapper = document.querySelector('.react-flow-wrapper') as HTMLElement | null
  wrapper?.focus()
}

export function ContextDraftNode({ data }: NodeProps) {
  const { draft, position } = data as ContextDraftData
  const addContext = useEditorStore((s) => s.addContext)
  const createRelatedContext = useEditorStore((s) => s.createRelatedContext)
  const cancelContextDraft = useEditorStore((s) => s.cancelContextDraft)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const settledRef = React.useRef(false)

  React.useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const size = NODE_SIZES.medium

  const settle = (): void => {
    cancelContextDraft()
    returnFocusToCanvas()
  }

  const commit = (): void => {
    if (settledRef.current) return
    settledRef.current = true
    const name = inputRef.current?.value.trim() ?? ''
    if (name) {
      if (draft.kind === 'related') {
        createRelatedContext(draft.sourceId, draft.direction, name)
      } else {
        addContext(name, position)
      }
    }
    settle()
  }

  const cancel = (): void => {
    if (settledRef.current) return
    settledRef.current = true
    settle()
  }

  return (
    <div
      className="nodrag nopan box-border flex items-start rounded-lg border-2 border-dashed border-blue-600 bg-emerald-100/50 p-2.5"
      style={{ width: size.width, height: size.height }}
      onClick={(e) => e.stopPropagation()}
    >
      <input
        ref={inputRef}
        className="w-full min-w-0 rounded border-[1.5px] border-blue-600 bg-white px-1.5 py-1 text-[13px] font-semibold text-slate-900 outline-none"
        placeholder="Context name..."
        autoComplete="off"
        onKeyDown={(e) => {
          e.stopPropagation()
          if (e.key === 'Enter') {
            e.preventDefault()
            commit()
          } else if (e.key === 'Escape') {
            e.preventDefault()
            cancel()
          }
        }}
        onBlur={commit}
      />
    </div>
  )
}
