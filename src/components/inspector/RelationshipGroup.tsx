import React from 'react'
import { Trash2 } from 'lucide-react'
import { SimpleTooltip } from '../SimpleTooltip'
import type { Relationship, BoundedContext } from '../../model/types'

interface RelationshipGroupProps {
  title: string
  relationships: Relationship[]
  contexts: BoundedContext[]
  onDelete: (id: string) => void
  icon: React.ReactNode
  getTargetContextId: (rel: Relationship) => string
}

export function RelationshipGroup({
  title,
  relationships,
  contexts,
  onDelete,
  icon,
  getTargetContextId,
}: RelationshipGroupProps) {
  if (relationships.length === 0) return null

  return (
    <div className="mb-3">
      <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">
        {title}
      </div>
      <div className="space-y-2">
        {relationships.map((rel) => {
          const targetContext = contexts.find((c) => c.id === getTargetContextId(rel))
          return (
            <div key={rel.id} className="flex items-start justify-between gap-2 group/rel">
              <div className="flex-1">
                <div className="flex items-center gap-1.5 text-xs">
                  {icon}
                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                    {targetContext?.name || 'Unknown'}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 ml-5 mt-0.5">
                  {rel.pattern}
                </div>
                {rel.description && (
                  <div className="text-[10px] text-slate-600 dark:text-slate-400 ml-5 mt-1">
                    {rel.description}
                  </div>
                )}
              </div>
              <SimpleTooltip text="Delete relationship" position="top">
                <button
                  onClick={() => onDelete(rel.id)}
                  className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors opacity-0 group-hover/rel:opacity-100"
                >
                  <Trash2 size={11} />
                </button>
              </SimpleTooltip>
            </div>
          )
        })}
      </div>
    </div>
  )
}
