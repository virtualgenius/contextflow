import React from 'react'

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

const PILL_BASE = 'px-2 py-1 text-[11px] font-medium rounded transition-colors cursor-pointer'
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

export function PillGroup<T extends string>({
  options,
  value,
  onChange,
  layout,
  variant,
  ariaLabel,
}: {
  options: ReadonlyArray<PillOption<T>>
  value: T | undefined
  onChange: (next: T | undefined) => void
  layout: PillLayout
  variant: PillVariant
  ariaLabel?: string
}) {
  const activeClass = variant === 'green' ? PILL_ACTIVE_GREEN : PILL_ACTIVE_SLATE
  return (
    <div role="group" aria-label={ariaLabel} className={LAYOUT_CLASS[layout]}>
      {options.map((opt) => {
        const isActive = value === opt.value
        const stretch = layout === 'horizontal' ? 'flex-1 text-center' : 'text-center'
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(isActive ? undefined : opt.value)}
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
