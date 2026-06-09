import React from 'react'
import { NodeProps } from 'reactflow'
import { useEditorStore } from '../../model/store'
import type { ContextDraft, DraftEntity } from '../../model/storeTypes'
import { NODE_SIZES } from '../../lib/canvasConstants'

interface ContextDraftData {
  draft: ContextDraft
  // Flow-percentage position for standalone (kind 'at'/'center') creations.
  position: { x: number; y: number }
}

const ENTITY_PLACEHOLDERS: Record<DraftEntity, string> = {
  user: 'User name...',
  userNeed: 'User need name...',
  stage: 'Stage name...',
}

function placeholderFor(draft: ContextDraft): string {
  return draft.kind === 'entity' ? ENTITY_PLACEHOLDERS[draft.entity] : 'Context name...'
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
  const addUser = useEditorStore((s) => s.addUser)
  const addUserNeed = useEditorStore((s) => s.addUserNeed)
  const addFlowStage = useEditorStore((s) => s.addFlowStage)
  const cancelContextDraft = useEditorStore((s) => s.cancelContextDraft)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const settledRef = React.useRef(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const size = NODE_SIZES.medium

  const settle = (): void => {
    settledRef.current = true
    cancelContextDraft()
    returnFocusToCanvas()
  }

  // Throws to keep the field open when the chosen action rejects the name
  // (only stage creation does this today, on a duplicate name).
  const createEntity = (entity: DraftEntity, name: string): void => {
    if (entity === 'user') addUser(name)
    else if (entity === 'userNeed') addUserNeed(name)
    else addFlowStage(name)
  }

  const createFromDraft = (name: string): void => {
    if (draft.kind === 'related') {
      createRelatedContext(draft.sourceId, draft.direction, name)
    } else if (draft.kind === 'entity') {
      createEntity(draft.entity, name)
    } else {
      addContext(name, position)
    }
  }

  const commit = (): void => {
    if (settledRef.current) return
    const name = inputRef.current?.value.trim() ?? ''
    if (!name) {
      settle()
      return
    }
    try {
      createFromDraft(name)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create this item')
      return
    }
    settle()
  }

  const cancel = (): void => {
    if (settledRef.current) return
    settle()
  }

  return (
    <div
      className="nodrag nopan box-border flex flex-col items-start rounded-lg border-2 border-dashed border-blue-600 bg-emerald-100/50 p-2.5"
      style={{ width: size.width, height: size.height }}
      onClick={(e) => e.stopPropagation()}
    >
      <input
        ref={inputRef}
        className="w-full min-w-0 rounded border-[1.5px] border-blue-600 bg-white px-1.5 py-1 text-[13px] font-semibold text-slate-900 outline-none"
        placeholder={placeholderFor(draft)}
        autoComplete="off"
        onChange={() => {
          if (error) setError(null)
        }}
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
      {error && <div className="mt-1 text-[11px] font-medium text-red-600">{error}</div>}
    </div>
  )
}
