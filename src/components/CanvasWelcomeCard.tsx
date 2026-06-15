// First-run empty-canvas welcome. The Buckminster Fuller quote frames the whole
// product: the tool teaches the new way of thinking through use, so the canvas
// introduces itself with the quote and the one gesture that gets a map started,
// then disappears the moment a context exists.
export function CanvasWelcomeCard() {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <div className="max-w-md px-8 text-center">
        <p className="font-serif text-[15px] italic leading-relaxed text-slate-500 dark:text-neutral-400">
          &ldquo;If you want to teach people a new way of thinking, don&rsquo;t bother trying to
          teach them. Instead, give them a tool, the use of which will lead to new ways of
          thinking.&rdquo;
        </p>
        <p className="mt-2 text-xs font-medium tracking-wide text-slate-400 dark:text-neutral-500">
          RICHARD BUCKMINSTER FULLER
        </p>
        <p className="mt-6 text-sm text-slate-500 dark:text-neutral-400">
          Double-click anywhere, or press{' '}
          <kbd className="rounded border border-slate-300 bg-white px-1.5 py-0.5 text-xs font-semibold text-slate-600 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
            N
          </kbd>
          , to add your first bounded context.
        </p>
      </div>
    </div>
  )
}
