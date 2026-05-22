import React from 'react'
import { X } from 'lucide-react'
import { useEditorStore } from '../../model/store'
import { CLEARED_SELECTION } from '../../lib/selectionDismiss'

// Shared input styles for consistency across all inspector panels
export const INPUT_TITLE_CLASS =
  'w-full font-semibold text-sm text-slate-900 dark:text-slate-100 leading-tight bg-transparent border border-transparent hover:border-slate-300 dark:hover:border-neutral-600 focus:border-blue-500 dark:focus:border-blue-400 rounded px-2 py-0.5 -ml-2 outline-none'

export const INPUT_TEXT_CLASS =
  'w-full text-xs px-3 py-1.5 rounded-md border border-slate-200 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 dark:focus:border-blue-400'

export const TEXTAREA_CLASS =
  'w-full text-xs text-slate-700 dark:text-slate-300 leading-normal bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 hover:border-slate-300 dark:hover:border-neutral-600 focus:border-blue-500 dark:focus:border-blue-400 rounded px-2 py-1 outline-none resize-none'

export const SELECT_CLASS =
  'w-full text-xs px-2 py-1.5 rounded-md border border-slate-200 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 dark:focus:border-blue-400'

export const FIELD_LABEL_CLASS = 'text-xs text-slate-500 dark:text-slate-400 mb-1'

export function InspectorHeader({ children }: { children: React.ReactNode }) {
  const handleClose = () => {
    useEditorStore.setState(CLEARED_SELECTION)
  }
  return (
    <div className="flex items-start gap-2 -mt-1 -mr-1">
      <div className="flex-1 min-w-0">{children}</div>
      <button
        onClick={handleClose}
        aria-label="Close inspector"
        className="p-1.5 rounded text-slate-400 hover:bg-slate-100 dark:hover:bg-neutral-700 hover:text-slate-600 dark:hover:text-slate-300 transition-colors flex-shrink-0"
      >
        <X size={16} />
      </button>
    </div>
  )
}

export function Section({
  label,
  children,
}: {
  label: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
        {label}
      </div>
      <div className="text-[13px]">{children}</div>
    </div>
  )
}

export function SectionDivider({
  label,
  children,
}: {
  label?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="border-t border-slate-200 dark:border-neutral-700 mt-4 pt-4 space-y-3">
      {label && (
        <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {label}
        </div>
      )}
      {children}
    </div>
  )
}

export type PillOption<T extends string> = {
  value: T
  label: string
  adornment?: React.ReactNode
}

export type PillVariant = 'green' | 'slate'
export type PillLayout = 'horizontal' | 'grid-2' | 'grid-3'

const PILL_BASE =
  'px-2 py-1 text-[11px] font-medium rounded transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400 focus-visible:ring-offset-1'
const PILL_INACTIVE =
  'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-neutral-800 dark:text-slate-400 dark:hover:bg-neutral-700'
const PILL_ACTIVE_GREEN =
  'bg-green-100 text-green-800 ring-1 ring-green-400 dark:bg-green-900/40 dark:text-green-300 dark:ring-green-600'
const PILL_ACTIVE_SLATE =
  'bg-slate-200 text-slate-900 ring-1 ring-slate-500 dark:bg-neutral-700 dark:text-slate-100 dark:ring-neutral-500'

const LAYOUT_CLASS: Record<PillLayout, string> = {
  horizontal: 'flex gap-1.5',
  'grid-2': 'grid grid-cols-2 gap-1.5',
  'grid-3': 'grid grid-cols-3 gap-1.5',
}

function getTabbableIndex<T extends string>(
  options: ReadonlyArray<PillOption<T>>,
  value: T | undefined
): number {
  const selected = options.findIndex((opt) => opt.value === value)
  return selected >= 0 ? selected : 0
}

function nextIndex(current: number, length: number, delta: number): number {
  return (current + delta + length) % length
}

const TOGGLE_PILL_ACTIVE_AMBER =
  'bg-amber-100 text-amber-800 ring-1 ring-amber-400 dark:bg-amber-900/40 dark:text-amber-300 dark:ring-amber-600'

export function TogglePill({
  active,
  onToggle,
  icon,
  label,
  ariaLabel,
  labelAdornment,
}: {
  active: boolean
  onToggle: () => void
  icon: React.ReactNode
  label: string
  ariaLabel?: string
  labelAdornment?: React.ReactNode
}) {
  return (
    <div className="inline-flex items-center gap-1">
      <button
        type="button"
        role="switch"
        aria-checked={active}
        aria-label={ariaLabel || label}
        onClick={onToggle}
        className={`${PILL_BASE} inline-flex items-center gap-1.5 ${active ? TOGGLE_PILL_ACTIVE_AMBER : PILL_INACTIVE}`}
      >
        {icon}
        <span>{label}</span>
      </button>
      {labelAdornment}
    </div>
  )
}

export function PillGroup<T extends string>({
  options,
  value,
  onChange,
  layout,
  variant,
  labelId,
  ariaLabel,
}: {
  options: ReadonlyArray<PillOption<T>>
  value: T | undefined
  onChange: (next: T | undefined) => void
  layout: PillLayout
  variant: PillVariant
  labelId?: string
  ariaLabel?: string
}) {
  const activeClass = variant === 'green' ? PILL_ACTIVE_GREEN : PILL_ACTIVE_SLATE
  const pillRefs = React.useRef<Array<HTMLButtonElement | null>>([])
  const tabbableIndex = getTabbableIndex(options, value)

  const selectAt = (index: number) => {
    const target = options[index]
    if (!target) return
    pillRefs.current[index]?.focus()
    if (target.value !== value) {
      onChange(target.value)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault()
        selectAt(nextIndex(index, options.length, 1))
        return
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault()
        selectAt(nextIndex(index, options.length, -1))
        return
      case 'Home':
        e.preventDefault()
        selectAt(0)
        return
      case 'End':
        e.preventDefault()
        selectAt(options.length - 1)
        return
      case ' ':
      case 'Enter':
        e.preventDefault()
        selectAt(index)
        return
    }
  }

  return (
    <div
      role="radiogroup"
      aria-labelledby={labelId}
      aria-label={labelId ? undefined : ariaLabel}
      className={LAYOUT_CLASS[layout]}
    >
      {options.map((opt, index) => {
        const isActive = value === opt.value
        const stretch = layout === 'horizontal' ? 'flex-1 text-center' : 'text-center'
        return (
          <button
            key={opt.value}
            ref={(el) => {
              pillRefs.current[index] = el
            }}
            type="button"
            role="radio"
            aria-checked={isActive}
            tabIndex={index === tabbableIndex ? 0 : -1}
            onClick={() => {
              pillRefs.current[index]?.focus()
              onChange(isActive ? undefined : opt.value)
            }}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={`${PILL_BASE} ${stretch} ${isActive ? activeClass : PILL_INACTIVE} inline-flex items-center justify-center`}
          >
            {opt.adornment}
            <span>{opt.label}</span>
          </button>
        )
      })}
    </div>
  )
}
