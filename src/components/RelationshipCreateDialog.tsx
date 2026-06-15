import React from 'react'
import { X, HelpCircle } from 'lucide-react'
import type { BoundedContext, Relationship, UpstreamRole, DownstreamRole } from '../model/types'
import { InfoTooltip } from './InfoTooltip'
import { Z_LAYERS } from '../lib/zLayers'
import { RELATIONSHIP_PATTERNS } from '../model/conceptDefinitions'
import { PillGroup, type PillOption } from './inspector/inspectorShared'

interface RelationshipCreateDialogProps {
  fromContext: BoundedContext
  availableContexts: BoundedContext[]
  onConfirm: (
    toContextId: string,
    pattern: Relationship['pattern'] | undefined,
    description: string | undefined,
    extras: { upstreamRole?: UpstreamRole; downstreamRole?: DownstreamRole }
  ) => void
  onCancel: () => void
}

type PickerPattern = 'partnership' | 'customer-supplier'

const PATTERN_LABELS: Record<PickerPattern, { name: string; influence: string }> = {
  partnership: { name: 'Partnership', influence: 'Mutually Dependent' },
  'customer-supplier': { name: 'Customer-Supplier', influence: 'Upstream/Downstream' },
}

const UPSTREAM_ROLE_OPTIONS: ReadonlyArray<PillOption<UpstreamRole>> = [
  { value: 'open-host-service', label: 'Open Host Service' },
  { value: 'published-language', label: 'Published Language' },
]

const DOWNSTREAM_ROLE_OPTIONS: ReadonlyArray<PillOption<DownstreamRole>> = [
  { value: 'conformist', label: 'Conformist' },
  { value: 'anti-corruption-layer', label: 'Anti-Corruption Layer' },
]

export function RelationshipCreateDialog({
  fromContext,
  availableContexts,
  onConfirm,
  onCancel,
}: RelationshipCreateDialogProps) {
  const [toContextId, setToContextId] = React.useState('')
  const [pattern, setPattern] = React.useState<PickerPattern | undefined>('customer-supplier')
  const [upstreamRole, setUpstreamRole] = React.useState<UpstreamRole | undefined>(undefined)
  const [downstreamRole, setDownstreamRole] = React.useState<DownstreamRole | undefined>(undefined)
  const [description, setDescription] = React.useState('')

  const handlePickPattern = (next: PickerPattern) => {
    if (pattern === next) {
      setPattern(undefined)
      return
    }
    setPattern(next)
    setUpstreamRole(undefined)
    setDownstreamRole(undefined)
  }

  const handleUpstreamRoleChange = (next: UpstreamRole | undefined) => {
    setUpstreamRole(next)
    if (next != null) setPattern(undefined)
  }

  const handleDownstreamRoleChange = (next: DownstreamRole | undefined) => {
    setDownstreamRole(next)
    if (next != null) setPattern(undefined)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!toContextId) return
    onConfirm(toContextId, pattern, description.trim() || undefined, {
      upstreamRole,
      downstreamRole,
    })
  }

  const toContextName =
    availableContexts.find((c) => c.id === toContextId)?.name || 'Target context'

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/50"
      style={{ zIndex: Z_LAYERS.dialog }}
    >
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl w-[480px] max-w-[90vw] max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-neutral-700">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-neutral-700">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Add Relationship
          </h2>
          <button
            onClick={onCancel}
            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-neutral-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              From
            </label>
            <div className="w-full text-sm px-3 py-2 rounded-md border border-slate-200 dark:border-neutral-600 bg-slate-50 dark:bg-neutral-900 text-slate-700 dark:text-slate-300">
              {fromContext.name}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              To (Target Context)
            </label>
            <select
              value={toContextId}
              onChange={(e) => setToContextId(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-md border border-slate-200 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 dark:focus:border-blue-400"
              required
            >
              <option value="">Select target context...</option>
              {availableContexts.map((ctx) => (
                <option key={ctx.id} value={ctx.id}>
                  {ctx.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Pattern
            </div>
            <div className="space-y-2">
              <PatternChoiceButton
                label={PATTERN_LABELS.partnership.name}
                influence={PATTERN_LABELS.partnership.influence}
                active={pattern === 'partnership'}
                onClick={() => handlePickPattern('partnership')}
              />
              <div className="text-[11px] italic text-slate-500 dark:text-slate-400 pl-3">
                For a Shared Kernel, drag the contexts to overlap.
              </div>

              <DialogOrDivider />

              <PatternChoiceButton
                label={PATTERN_LABELS['customer-supplier'].name}
                influence={PATTERN_LABELS['customer-supplier'].influence}
                active={pattern === 'customer-supplier'}
                onClick={() => handlePickPattern('customer-supplier')}
              />
              <div className="text-[11px] italic text-slate-500 dark:text-slate-400 pl-3">
                The upstream accommodates the downstream.
              </div>

              <DialogOrDivider />

              <div className="space-y-2.5">
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-300">
                  <span>Characterize each side</span>
                  <span className="text-slate-400 dark:text-slate-500 font-normal">
                    (Upstream/Downstream)
                  </span>
                </div>

                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                    <span className="font-medium text-slate-600 dark:text-slate-300">Upstream</span>
                    <span className="text-slate-400 dark:text-slate-500">({toContextName})</span>
                    <InfoTooltip
                      content={RELATIONSHIP_PATTERNS['open-host-service']}
                      position="bottom"
                    >
                      <HelpCircle
                        size={11}
                        className="text-slate-400 dark:text-slate-500 cursor-help"
                      />
                    </InfoTooltip>
                  </div>
                  <PillGroup<UpstreamRole>
                    options={UPSTREAM_ROLE_OPTIONS}
                    value={upstreamRole}
                    onChange={handleUpstreamRoleChange}
                    layout="horizontal"
                    variant="green"
                    ariaLabel="Upstream role"
                  />
                </div>

                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                    <span className="font-medium text-slate-600 dark:text-slate-300">
                      Downstream
                    </span>
                    <span className="text-slate-400 dark:text-slate-500">({fromContext.name})</span>
                    <InfoTooltip
                      content={RELATIONSHIP_PATTERNS['anti-corruption-layer']}
                      position="bottom"
                    >
                      <HelpCircle
                        size={11}
                        className="text-slate-400 dark:text-slate-500 cursor-help"
                      />
                    </InfoTooltip>
                  </div>
                  <PillGroup<DownstreamRole>
                    options={DOWNSTREAM_ROLE_OPTIONS}
                    value={downstreamRole}
                    onChange={handleDownstreamRoleChange}
                    layout="horizontal"
                    variant="green"
                    ariaLabel="Downstream role"
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Notes (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Additional details about this relationship..."
              rows={3}
              className="w-full text-sm px-3 py-2 rounded-md border border-slate-200 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 dark:focus:border-blue-400 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-neutral-700 rounded transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!toContextId}
              className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-neutral-600 text-white rounded transition-colors disabled:cursor-not-allowed"
            >
              Add Relationship
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function DialogOrDivider() {
  return (
    <div className="flex items-center gap-2 my-2 text-[10px] uppercase tracking-widest font-semibold text-slate-400 dark:text-slate-500">
      <div className="flex-1 h-px bg-slate-200 dark:bg-neutral-700" />
      <span>or</span>
      <div className="flex-1 h-px bg-slate-200 dark:bg-neutral-700" />
    </div>
  )
}

function PatternChoiceButton({
  label,
  influence,
  active,
  onClick,
}: {
  label: string
  influence: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`w-full flex items-baseline justify-between gap-3 px-3 py-2 rounded-md border text-left transition-colors ${
        active
          ? 'bg-slate-900 dark:bg-slate-100 border-slate-900 dark:border-slate-100 text-white dark:text-slate-900'
          : 'bg-white dark:bg-neutral-900 border-slate-200 dark:border-neutral-600 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-neutral-800'
      }`}
    >
      <span className="text-sm font-semibold">{label}</span>
      <span className={`text-[10px] ${active ? 'opacity-80' : 'opacity-65'}`}>{influence}</span>
    </button>
  )
}
