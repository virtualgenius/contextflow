import React from 'react'
import { X, Lightbulb } from 'lucide-react'
import { Z_LAYERS } from '../lib/zLayers'

interface GettingStartedGuideModalProps {
  onClose: () => void
}

interface StepCardProps {
  number: number
  title: string
  children: React.ReactNode
}

function StepCard({ number, title, children }: StepCardProps) {
  return (
    <div className="border border-slate-200 dark:border-neutral-700 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center text-sm font-semibold shrink-0">
          {number}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2">{title}</h4>
          <div className="text-sm text-slate-600 dark:text-slate-400 space-y-2">{children}</div>
        </div>
      </div>
    </div>
  )
}

function TipBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md p-3 mt-1">
      <Lightbulb size={14} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
      <p className="text-xs text-amber-700 dark:text-amber-400">{children}</p>
    </div>
  )
}

function ExampleCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-md p-2 text-slate-600 dark:text-slate-400 italic space-y-1">
      {children}
    </div>
  )
}

function ContextMapSteps() {
  return (
    <>
      <StepCard number={1} title="Add your contexts">
        <p>Map outward from yourself—don't try to map everything. Add contexts in this order:</p>
        <ol className="list-decimal ml-5 space-y-1.5">
          <li>
            Your own application first, as the{' '}
            <strong className="text-slate-700 dark:text-slate-300">primary context</strong> at the
            center (ownership:{' '}
            <strong className="text-slate-700 dark:text-slate-300">Our Team</strong>
            ).
          </li>
          <li>
            The third-party APIs and applications it integrates with, as{' '}
            <strong className="text-slate-700 dark:text-slate-300">External</strong> contexts
            (outside your organization).
          </li>
          <li>
            Systems and APIs owned by other teams in your organization that you integrate with, as{' '}
            <strong className="text-slate-700 dark:text-slate-300">Internal</strong> contexts.
          </li>
        </ol>
        <p>
          To add one, double-click anywhere on the canvas (or press{' '}
          <strong className="text-slate-700 dark:text-slate-300">N</strong>, or use the{' '}
          <strong className="text-slate-700 dark:text-slate-300">Context</strong> button) and type
          its name. Then set its ownership in the inspector.
        </p>
        <TipBox>
          Put your context at the center and map from there. A useful map of your corner beats an
          exhaustive map of everything.
        </TipBox>
      </StepCard>

      <StepCard number={2} title="Connect them">
        <p>Drag from one context to another to show how they integrate.</p>
        <p>
          To grow the map quickly, hover a context and click one of its directional arrows, or
          select it and press an arrow key, to spawn a new connected context on that side (up for an
          upstream provider, down for a downstream consumer, left for a partnership, right for a
          shared kernel).
        </p>
        <p>
          Pick a DDD pattern—<em>Customer-Supplier</em>, <em>Anti-Corruption Layer</em>,{' '}
          <em>Open Host Service</em>, <em>Shared Kernel</em>, <em>Partnership</em>—to describe the
          relationship.
        </p>
        <TipBox>
          Don't worry about getting patterns perfect at first. You can always change them later.
        </TipBox>
      </StepCard>

      <StepCard number={3} title="Make your contexts richer">
        <p>Select a context to open the inspector, then add detail:</p>
        <ul className="list-disc ml-5 space-y-1 text-slate-500 dark:text-slate-400">
          <li>
            Refine its <strong className="text-slate-700 dark:text-slate-300">properties</strong>
            —purpose, boundary type, code size, classification.
          </li>
          <li>
            Assign a <strong className="text-slate-700 dark:text-slate-300">repository</strong> so
            the map links to real code—for contexts your organization owns (Our Team or Internal).
          </li>
          <li>
            Assign a <strong className="text-slate-700 dark:text-slate-300">team</strong> to show
            ownership.
          </li>
        </ul>
        <TipBox>
          All of this stays in Context Map—no need to switch views to enrich a context.
        </TipBox>
      </StepCard>

      <StepCard number={4} title="Flag issues">
        <p>
          Capture what's wrong or worth discussing as issues on a context. They show up on the map
          and drive the conversation.
        </p>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mt-2">
          Context problems
        </p>
        <ExampleCard>
          <p>"Application has too many responsibilities and is hard / risky to change."</p>
        </ExampleCard>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mt-2">
          Relationship problems
        </p>
        <p className="text-xs">
          Record these on the affected context—usually the{' '}
          <strong className="text-slate-700 dark:text-slate-300">downstream</strong> one, where the
          symptoms show up:
        </p>
        <ExampleCard>
          <p>"Upstream thinks it's Customer-Supplier, but it's actually a Partnership."</p>
          <p>"Downstream from a big ball of mud. Needs an ACL to support the new domain model."</p>
        </ExampleCard>
      </StepCard>

      <div className="border border-slate-200 dark:border-neutral-700 rounded-lg p-4 bg-slate-50 dark:bg-neutral-900/50">
        <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2">
          Go further: switch views
        </h4>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
          Context Map is your starting point. As your model grows, switch views to reveal more:
        </p>
        <ul className="list-disc ml-5 space-y-2 text-sm text-slate-500 dark:text-slate-400">
          <li>
            <strong className="text-slate-700 dark:text-slate-300">Value Stream</strong> — add the
            users, needs, and stages your contexts serve, to see how they support value delivery.
            (Start from a user journey here.)
          </li>
          <li>
            <strong className="text-slate-700 dark:text-slate-300">Distillation</strong> — classify
            each context as Core, Supporting, or Generic.
          </li>
          <li>
            <strong className="text-slate-700 dark:text-slate-300">Strategic</strong> — position
            contexts on the Wardley evolution axis.
          </li>
        </ul>
      </div>
    </>
  )
}

export function GettingStartedGuideModal({ onClose }: GettingStartedGuideModalProps) {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/50"
      style={{ zIndex: Z_LAYERS.dialog }}
    >
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl w-[600px] max-w-[90vw] max-h-[85vh] border border-slate-200 dark:border-neutral-700 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-neutral-700 shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Getting Started Guide
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              How to create your first context map
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-neutral-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            aria-label="Close getting started guide"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Introduction */}
          <div className="text-sm text-slate-600 dark:text-slate-400">
            <p>
              A context map shows how the parts of your system connect: your{' '}
              <strong className="text-slate-700 dark:text-slate-200">bounded contexts</strong> and
              the <strong className="text-slate-700 dark:text-slate-200">relationships</strong>{' '}
              between them. Start here, then reveal more as your model grows.
            </p>
          </div>

          {/* Philosophy callout */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 dark:text-blue-200 text-sm mb-2">
              Focus on usefulness, not perfection
            </h4>
            <p className="text-sm text-blue-800 dark:text-blue-300">
              Your map is a discovery tool—use it to explore the landscape, challenge assumptions,
              and guide future investment. Don't aim for a perfect model. Aim for one that sparks
              useful conversations and helps you make better decisions.
            </p>
          </div>

          <ContextMapSteps />
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
