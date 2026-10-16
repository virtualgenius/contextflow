// WCAG 2.x contrast math. Pure functions; the palette test and
// scripts/check-contrast.mjs are the enforcement points.

export const WCAG_AA_NORMAL_TEXT = 4.5
export const WCAG_AA_LARGE_TEXT_AND_UI = 3

export type Rgb = [number, number, number]

const HEX_SHORT = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i
const HEX_LONG = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i
const RGB_FUNC = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i

export function parseColor(color: string): Rgb {
  const trimmed = color.trim()
  const short = trimmed.match(HEX_SHORT)
  if (short) return [1, 2, 3].map((i) => parseInt(short[i] + short[i], 16)) as Rgb
  const long = trimmed.match(HEX_LONG)
  if (long) return [1, 2, 3].map((i) => parseInt(long[i], 16)) as Rgb
  const rgb = trimmed.match(RGB_FUNC)
  if (rgb) return [1, 2, 3].map((i) => Number(rgb[i])) as Rgb
  throw new Error(`Unparseable color: ${color}`)
}

const SRGB_LINEAR_THRESHOLD = 0.03928
const SRGB_LINEAR_DIVISOR = 12.92
const SRGB_GAMMA_OFFSET = 0.055
const SRGB_GAMMA_DIVISOR = 1.055
const SRGB_GAMMA = 2.4

function linearizeChannel(channel: number): number {
  const c = channel / 255
  if (c <= SRGB_LINEAR_THRESHOLD) return c / SRGB_LINEAR_DIVISOR
  return Math.pow((c + SRGB_GAMMA_OFFSET) / SRGB_GAMMA_DIVISOR, SRGB_GAMMA)
}

const LUMINANCE_WEIGHTS: Rgb = [0.2126, 0.7152, 0.0722]

export function relativeLuminance(color: string): number {
  const rgb = parseColor(color)
  return rgb.reduce((sum, channel, i) => sum + LUMINANCE_WEIGHTS[i] * linearizeChannel(channel), 0)
}

const CONTRAST_OFFSET = 0.05

export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a)
  const lb = relativeLuminance(b)
  const [lighter, darker] = la >= lb ? [la, lb] : [lb, la]
  return (lighter + CONTRAST_OFFSET) / (darker + CONTRAST_OFFSET)
}

export interface ContrastOptions {
  largeText?: boolean
}

export function meetsWcagAA(fg: string, bg: string, options: ContrastOptions = {}): boolean {
  const threshold = options.largeText ? WCAG_AA_LARGE_TEXT_AND_UI : WCAG_AA_NORMAL_TEXT
  return contrastRatio(fg, bg) >= threshold
}
