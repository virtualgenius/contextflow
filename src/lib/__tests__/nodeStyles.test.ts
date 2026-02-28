import { describe, it, expect } from 'vitest'
import { getContextNodeBorderStyle, parseRgbColor } from '../nodeStyles'

describe('getContextNodeBorderStyle', () => {
  describe('border width by boundary integrity', () => {
    it('returns 3px for strong integrity', () => {
      const result = getContextNodeBorderStyle({ boundaryIntegrity: 'strong' }, false, false, false)
      expect(result.borderWidth).toBe('3px')
    })

    it('returns 2px for moderate integrity', () => {
      const result = getContextNodeBorderStyle(
        { boundaryIntegrity: 'moderate' },
        false,
        false,
        false
      )
      expect(result.borderWidth).toBe('2px')
    })

    it('returns 1.5px for weak integrity', () => {
      const result = getContextNodeBorderStyle({ boundaryIntegrity: 'weak' }, false, false, false)
      expect(result.borderWidth).toBe('1.5px')
    })

    it('returns 1.5px for undefined integrity', () => {
      const result = getContextNodeBorderStyle({}, false, false, false)
      expect(result.borderWidth).toBe('1.5px')
    })
  })

  describe('border style', () => {
    it('returns dotted for weak integrity', () => {
      const result = getContextNodeBorderStyle({ boundaryIntegrity: 'weak' }, false, false, false)
      expect(result.borderStyle).toBe('dotted')
    })

    it('returns solid for strong integrity', () => {
      const result = getContextNodeBorderStyle({ boundaryIntegrity: 'strong' }, false, false, false)
      expect(result.borderStyle).toBe('solid')
    })

    it('returns solid for moderate integrity', () => {
      const result = getContextNodeBorderStyle(
        { boundaryIntegrity: 'moderate' },
        false,
        false,
        false
      )
      expect(result.borderStyle).toBe('solid')
    })
  })

  describe('border color', () => {
    it('returns blue when drag over', () => {
      const result = getContextNodeBorderStyle({}, true, false, false)
      expect(result.borderColor).toBe('#3b82f6')
    })

    it('returns blue when highlighted', () => {
      const result = getContextNodeBorderStyle({}, false, true, false)
      expect(result.borderColor).toBe('#3b82f6')
    })

    it('returns slate when not highlighted or drag over', () => {
      const result = getContextNodeBorderStyle({}, false, false, false)
      expect(result.borderColor).toBe('#64748b')
    })
  })

  describe('shadow', () => {
    it('returns drag over shadow', () => {
      const result = getContextNodeBorderStyle({}, true, false, false)
      expect(result.shadow).toContain('3px #3b82f6')
      expect(result.shadow).toContain('rgba(59, 130, 246')
    })

    it('returns highlighted shadow', () => {
      const result = getContextNodeBorderStyle({}, false, true, false)
      expect(result.shadow).toContain('3px #3b82f6')
    })

    it('returns hover shadow for non-external context', () => {
      const result = getContextNodeBorderStyle({}, false, false, true)
      expect(result.shadow).toContain('rgba(0, 0, 0')
    })

    it('returns external ring shadow on hover', () => {
      const result = getContextNodeBorderStyle({ ownership: 'external' }, false, false, true)
      expect(result.shadow).toContain('0 0 0 2px white')
      expect(result.shadow).toContain('0 0 0 3px #64748b')
    })

    it('returns external ring shadow in default state', () => {
      const result = getContextNodeBorderStyle({ ownership: 'external' }, false, false, false)
      expect(result.shadow).toContain('0 0 0 2px white')
    })

    it('returns default shadow for non-external context', () => {
      const result = getContextNodeBorderStyle({}, false, false, false)
      expect(result.shadow).toBe('0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)')
    })
  })
})

describe('parseRgbColor', () => {
  describe('hex colors', () => {
    it('parses a hex color', () => {
      expect(parseRgbColor('#3b82f6')).toEqual([59, 130, 246])
    })

    it('parses black', () => {
      expect(parseRgbColor('#000000')).toEqual([0, 0, 0])
    })

    it('parses white', () => {
      expect(parseRgbColor('#ffffff')).toEqual([255, 255, 255])
    })

    it('parses uppercase hex', () => {
      expect(parseRgbColor('#FF0000')).toEqual([255, 0, 0])
    })
  })

  describe('rgb colors', () => {
    it('parses rgb() format', () => {
      expect(parseRgbColor('rgb(59, 130, 246)')).toEqual([59, 130, 246])
    })

    it('parses rgba() format', () => {
      expect(parseRgbColor('rgba(255, 0, 128, 0.5)')).toEqual([255, 0, 128])
    })

    it('parses rgb with no spaces', () => {
      expect(parseRgbColor('rgb(10,20,30)')).toEqual([10, 20, 30])
    })
  })
})
