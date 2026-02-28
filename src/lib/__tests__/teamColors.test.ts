import { describe, it, expect } from 'vitest'
import { getTopologyColors } from '../teamColors'

describe('getTopologyColors', () => {
  it('returns warm yellow palette for stream-aligned', () => {
    const colors = getTopologyColors('stream-aligned')
    expect(colors.light.bg).toBe('#FFEDB8')
    expect(colors.light.border).toBe('#FFD966')
    expect(colors.light.text).toBe('#92600a')
  })

  it('returns light blue palette for platform', () => {
    const colors = getTopologyColors('platform')
    expect(colors.light.bg).toBe('#B7CDF1')
    expect(colors.light.border).toBe('#6D9EEB')
    expect(colors.light.text).toBe('#1a4b8c')
  })

  it('returns pink palette for enabling', () => {
    const colors = getTopologyColors('enabling')
    expect(colors.light.bg).toBe('#DFBDCF')
    expect(colors.light.border).toBe('#D09CB7')
    expect(colors.light.text).toBe('#6b3a5c')
  })

  it('returns orange palette for complicated-subsystem', () => {
    const colors = getTopologyColors('complicated-subsystem')
    expect(colors.light.bg).toBe('#FFC08B')
    expect(colors.light.border).toBe('#E88814')
    expect(colors.light.text).toBe('#7c3a00')
  })

  it('returns neutral gray palette for unknown', () => {
    const colors = getTopologyColors('unknown')
    expect(colors.light.bg).toBe('#f8fafc')
    expect(colors.light.border).toBe('#cbd5e1')
    expect(colors.light.text).toBe('#475569')
  })

  it('falls back to unknown for undefined input', () => {
    const colors = getTopologyColors(undefined)
    expect(colors.light.bg).toBe('#f8fafc')
    expect(colors.light.border).toBe('#cbd5e1')
  })

  it('falls back to unknown for unrecognized string', () => {
    const colors = getTopologyColors('nonexistent')
    expect(colors.light.bg).toBe('#f8fafc')
  })

  it('returns dark mode colors for all topology types', () => {
    const streamDark = getTopologyColors('stream-aligned').dark
    expect(streamDark.bg).toBe('#3d2e00')
    expect(streamDark.border).toBe('#FFD966')
    expect(streamDark.text).toBe('#FFE8A0')

    const platformDark = getTopologyColors('platform').dark
    expect(platformDark.bg).toBe('#1a2a4a')
    expect(platformDark.border).toBe('#6D9EEB')
    expect(platformDark.text).toBe('#B7CDF1')
  })

  it('returns objects with light and dark keys each containing bg, border, text', () => {
    const colors = getTopologyColors('stream-aligned')
    expect(colors).toHaveProperty('light')
    expect(colors).toHaveProperty('dark')
    expect(colors.light).toHaveProperty('bg')
    expect(colors.light).toHaveProperty('border')
    expect(colors.light).toHaveProperty('text')
    expect(colors.dark).toHaveProperty('bg')
    expect(colors.dark).toHaveProperty('border')
    expect(colors.dark).toHaveProperty('text')
  })
})
