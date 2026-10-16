import type { IssueSeverity } from '../model/types'

export const SEVERITY_COLORS: Record<IssueSeverity, string> = {
  critical: '#dc2626',
  warning: '#b45309', // amber-700; amber-600 is 3.19:1 on white, below AA
  info: '#2563eb',
}

export const ISSUE_LABEL_STYLES: Record<
  IssueSeverity,
  { bg: string; border: string; text: string }
> = {
  critical: { bg: '#fef2f2', border: '#fca5a5', text: '#b91c1c' },
  warning: { bg: '#fffbeb', border: '#fcd34d', text: '#b45309' },
  info: { bg: '#eff6ff', border: '#93c5fd', text: '#1d4ed8' },
}
