import React, { useMemo } from 'react'
import { X } from 'lucide-react'

interface KeyboardShortcutsModalProps {
  onClose: () => void
}

interface ShortcutEntry {
  label: string
  keys: string[]
}

interface ShortcutSection {
  title: string
  shortcuts: ShortcutEntry[]
}

function buildSections(): ShortcutSection[] {
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
  const mod = isMac ? '\u2318' : 'Ctrl'
  const shift = isMac ? '\u21E7' : 'Shift'
  const del = isMac ? '\u232B' : 'Delete'

  return [
    {
      title: 'Editing',
      shortcuts: [
        { label: 'Undo', keys: [mod, 'Z'] },
        { label: 'Redo', keys: [mod, shift, 'Z'] },
        { label: 'Delete selected edge', keys: [del] },
        { label: 'Deselect', keys: ['Esc'] },
      ],
    },
    {
      title: 'Canvas',
      shortcuts: [
        { label: 'Zoom', keys: ['Scroll / Pinch'] },
        { label: 'Pan canvas', keys: ['Click + Drag'] },
        { label: 'Move node', keys: ['Drag node'] },
        { label: 'Create relationship', keys: ['Drag from edge'] },
        { label: 'Multi-select', keys: [shift, 'Click'] },
      ],
    },
    {
      title: 'General',
      shortcuts: [
        { label: 'Show keyboard shortcuts', keys: [mod, '?'] },
      ],
    },
  ]
}

function KeyBadge({ text }: { text: string }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[24px] px-1.5 py-0.5 text-xs font-mono font-medium bg-slate-100 dark:bg-neutral-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-neutral-600 rounded shadow-sm">
      {text}
    </kbd>
  )
}

export function KeyboardShortcutsModal({ onClose }: KeyboardShortcutsModalProps) {
  const sections = useMemo(() => buildSections(), [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl w-[480px] max-w-[90vw] max-h-[85vh] border border-slate-200 dark:border-neutral-700 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-neutral-700 shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Keyboard Shortcuts
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Quick reference for all available shortcuts
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-neutral-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            aria-label="Close keyboard shortcuts"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {sections.map((section) => (
            <div key={section.title}>
              <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                {section.title}
              </h3>
              <div className="space-y-1">
                {section.shortcuts.map((shortcut) => (
                  <div
                    key={shortcut.label}
                    className="flex items-center justify-between py-1.5"
                  >
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      {shortcut.label}
                    </span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, i) => (
                        <React.Fragment key={i}>
                          {i > 0 && (
                            <span className="text-xs text-slate-400 dark:text-slate-500">+</span>
                          )}
                          <KeyBadge text={key} />
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-neutral-700 shrink-0">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-sm bg-slate-100 dark:bg-neutral-700 hover:bg-slate-200 dark:hover:bg-neutral-600 text-slate-700 dark:text-slate-200 rounded transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
