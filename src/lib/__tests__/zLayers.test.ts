import { describe, it, expect } from 'vitest'
import { Z_LAYERS } from '../zLayers'

describe('Z_LAYERS stacking scale (GH #34)', () => {
  it('stacks canvas tooltips below dialogs so an open dialog is never occluded by a relationship tooltip', () => {
    expect(Z_LAYERS.tooltip).toBeLessThan(Z_LAYERS.dialog)
  })

  it('stacks dialog-spawned tooltips above dialogs so in-dialog help is still visible', () => {
    expect(Z_LAYERS.dialogTooltip).toBeGreaterThan(Z_LAYERS.dialog)
  })

  it('orders the full overlay scale from floating controls up to dialog tooltips', () => {
    const ascending = [
      Z_LAYERS.floating,
      Z_LAYERS.popover,
      Z_LAYERS.tooltip,
      Z_LAYERS.dialog,
      Z_LAYERS.dialogTooltip,
    ]
    const sorted = [...ascending].sort((a, b) => a - b)
    expect(ascending).toEqual(sorted)
  })

  it('uses strictly distinct layer values so ordering is unambiguous', () => {
    const values = Object.values(Z_LAYERS)
    expect(new Set(values).size).toBe(values.length)
  })
})
