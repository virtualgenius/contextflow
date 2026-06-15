/**
 * Single source of truth for stacking order of the app's overlay layer:
 * elements positioned `fixed` or portalled to `document.body`, which escape
 * the React Flow canvas stacking context.
 *
 * Canvas-internal stacking (React Flow node/overlay `zIndex` styles) is a
 * separate concern and is not governed by this scale.
 *
 * A dialog must sit above canvas tooltips (so an open dialog is never occluded
 * by a hovered or selected relationship tooltip), while a tooltip spawned from
 * inside a dialog must sit above the dialog (so in-dialog help stays visible).
 */
export const Z_LAYERS = {
  floating: 40,
  popover: 50,
  tooltip: 60,
  dialog: 70,
  dialogTooltip: 80,
} as const

export type ZLayer = keyof typeof Z_LAYERS
