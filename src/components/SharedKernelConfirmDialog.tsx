import { X, Layers } from 'lucide-react'

interface SharedKernelConfirmDialogProps {
  draggedContextName: string
  otherContextName: string
  existingPatternLabel: string
  onConfirm: () => void
  onCancel: () => void
}

export function SharedKernelConfirmDialog({
  draggedContextName,
  otherContextName,
  existingPatternLabel,
  onConfirm,
  onCancel,
}: SharedKernelConfirmDialogProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      data-testid="shared-kernel-confirm-dialog"
    >
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl w-[440px] max-w-[90vw] border border-slate-200 dark:border-neutral-700">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-neutral-700">
          <div className="flex items-center gap-2">
            <Layers size={18} className="text-violet-500" />
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Convert to Shared Kernel?
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-neutral-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            <strong className="text-slate-800 dark:text-slate-200">{draggedContextName}</strong> and{' '}
            <strong className="text-slate-800 dark:text-slate-200">{otherContextName}</strong>{' '}
            already have a{' '}
            <strong className="text-slate-800 dark:text-slate-200">{existingPatternLabel}</strong>{' '}
            relationship.
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Overlapping their bodies converts it to a Shared Kernel. The existing pattern and any
            per-side roles (Open Host Service, Anti-Corruption Layer, Published Language,
            Conformist) will be cleared.
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-500">
            You can undo this with Cmd/Ctrl+Z.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 px-4 pb-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-neutral-700 rounded transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-3 py-1.5 text-sm bg-violet-600 hover:bg-violet-700 text-white rounded transition-colors"
          >
            Convert to Shared Kernel
          </button>
        </div>
      </div>
    </div>
  )
}
