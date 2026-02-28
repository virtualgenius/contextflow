import React from 'react'

// Shared input styles for consistency across all inspector panels
export const INPUT_TITLE_CLASS =
  'w-full font-semibold text-sm text-slate-900 dark:text-slate-100 leading-tight bg-transparent border border-transparent hover:border-slate-300 dark:hover:border-neutral-600 focus:border-blue-500 dark:focus:border-blue-400 rounded px-2 py-0.5 -ml-2 outline-none'

export const INPUT_TEXT_CLASS =
  'w-full text-xs px-3 py-1.5 rounded-md border border-slate-200 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 dark:focus:border-blue-400'

export const TEXTAREA_CLASS =
  'w-full text-xs text-slate-700 dark:text-slate-300 leading-normal bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 hover:border-slate-300 dark:hover:border-neutral-600 focus:border-blue-500 dark:focus:border-blue-400 rounded px-2 py-1 outline-none resize-none'

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
