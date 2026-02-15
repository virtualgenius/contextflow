import React from 'react'
import { Info, AlertTriangle, AlertOctagon } from 'lucide-react'
import { SimpleTooltip } from '../SimpleTooltip'
import type { IssueSeverity } from '../../model/types'

interface SeverityConfig {
  activeBg: string
  activeText: string
  tooltip: string
  Icon: typeof Info
}

const SEVERITY_CONFIG: Record<IssueSeverity, SeverityConfig> = {
  info: {
    activeBg: 'bg-blue-100 dark:bg-blue-900/40',
    activeText: 'text-blue-600 dark:text-blue-400',
    tooltip: 'Info: General note',
    Icon: Info,
  },
  warning: {
    activeBg: 'bg-amber-100 dark:bg-amber-900/40',
    activeText: 'text-amber-600 dark:text-amber-400',
    tooltip: 'Warning: Needs attention',
    Icon: AlertTriangle,
  },
  critical: {
    activeBg: 'bg-red-100 dark:bg-red-900/40',
    activeText: 'text-red-600 dark:text-red-400',
    tooltip: 'Critical: Urgent problem',
    Icon: AlertOctagon,
  },
}

interface IssueSeverityButtonProps {
  severity: IssueSeverity
  isActive: boolean
  onClick: () => void
}

export function IssueSeverityButton({ severity, isActive, onClick }: IssueSeverityButtonProps) {
  const config = SEVERITY_CONFIG[severity]
  const { Icon } = config

  return (
    <SimpleTooltip text={config.tooltip} position="top">
      <button
        onClick={onClick}
        className={`p-0.5 rounded transition-colors ${
          isActive
            ? config.activeBg
            : 'hover:bg-slate-200 dark:hover:bg-neutral-700'
        }`}
      >
        <Icon size={14} className={isActive ? config.activeText : 'text-slate-400 dark:text-slate-500'} />
      </button>
    </SimpleTooltip>
  )
}
