import { describe, it, expect } from 'vitest'
import {
  contrastRatio,
  relativeLuminance,
  parseColor,
  meetsWcagAA,
  WCAG_AA_NORMAL_TEXT,
  WCAG_AA_LARGE_TEXT_AND_UI,
} from '../colorContrast'

describe('parseColor', () => {
  it('parses 6-digit hex', () => {
    expect(parseColor('#dc2626')).toEqual([220, 38, 38])
  })
  it('parses 3-digit hex', () => {
    expect(parseColor('#fff')).toEqual([255, 255, 255])
  })
  it('parses rgb() and rgba()', () => {
    expect(parseColor('rgb(1, 2, 3)')).toEqual([1, 2, 3])
    expect(parseColor('rgba(1, 2, 3, 0.5)')).toEqual([1, 2, 3])
  })
  it('throws on an unparseable color', () => {
    expect(() => parseColor('var(--ink)')).toThrow(/unparseable/i)
  })
})

describe('relativeLuminance', () => {
  it('is 0 for black and 1 for white', () => {
    expect(relativeLuminance('#000000')).toBe(0)
    expect(relativeLuminance('#ffffff')).toBe(1)
  })
})

describe('contrastRatio', () => {
  it('is 21 for black on white', () => {
    expect(contrastRatio('#000', '#fff')).toBeCloseTo(21, 5)
  })
  it('is symmetric', () => {
    expect(contrastRatio('#dc2626', '#fef2f2')).toBeCloseTo(contrastRatio('#fef2f2', '#dc2626'), 10)
  })
  it('matches a published reference value', () => {
    // WebAIM: #767676 on #ffffff is 4.54:1
    expect(contrastRatio('#767676', '#ffffff')).toBeCloseTo(4.54, 2)
  })
})

describe('meetsWcagAA', () => {
  it('requires 4.5:1 for normal text', () => {
    expect(WCAG_AA_NORMAL_TEXT).toBe(4.5)
    expect(meetsWcagAA('#767676', '#ffffff')).toBe(true)
    expect(meetsWcagAA('#777777', '#ffffff')).toBe(false)
    expect(meetsWcagAA('#949494', '#ffffff')).toBe(false)
  })
  it('requires 3:1 for large text and UI components', () => {
    expect(WCAG_AA_LARGE_TEXT_AND_UI).toBe(3)
    expect(meetsWcagAA('#949494', '#ffffff', { largeText: true })).toBe(true)
    expect(meetsWcagAA('#bbbbbb', '#ffffff', { largeText: true })).toBe(false)
  })
})
