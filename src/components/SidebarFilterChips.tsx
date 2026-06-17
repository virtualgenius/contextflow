export interface FilterChipOption<T extends string> {
  value: T
  label: string
}

interface SidebarFilterChipsProps<T extends string> {
  options: FilterChipOption<T>[]
  active: T
  onChange: (value: T) => void
}

export function SidebarFilterChips<T extends string>({
  options,
  active,
  onChange,
}: SidebarFilterChipsProps<T>) {
  return (
    <div className="flex flex-wrap gap-1">
      {options.map((opt) => {
        const isActive = active === opt.value
        return (
          <button
            key={opt.value}
            aria-label={`Filter by ${opt.label}`}
            aria-pressed={isActive}
            onClick={() => onChange(opt.value)}
            className={`px-1.5 py-0.5 text-[10px] font-medium rounded-full border transition-colors ${
              isActive
                ? 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                : 'border-slate-200 dark:border-neutral-700 text-slate-500 dark:text-neutral-400 hover:border-slate-300 dark:hover:border-neutral-600'
            }`}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
