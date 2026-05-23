import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, AlertOctagon, Info } from 'lucide-react'
import type { Issue, IssueSeverity } from '../../model/types'

const SEVERITY_ORDER: IssueSeverity[] = ['info', 'warning', 'critical']

const SEVERITY_COLORS: Record<IssueSeverity, string> = {
  critical: '#dc2626',
  warning: '#d97706',
  info: '#2563eb',
}

const SEVERITY_LABELS: Record<IssueSeverity, string> = {
  critical: 'Critical',
  warning: 'Warnings',
  info: 'Info',
}

const SEVERITY_ICONS: Record<IssueSeverity, typeof AlertOctagon> = {
  critical: AlertOctagon,
  warning: AlertTriangle,
  info: Info,
}

interface IssueCounterPillProps {
  issues: Issue[]
  onSelect: () => void
}

export function IssueCounterPill({ issues, onSelect }: IssueCounterPillProps) {
  const [tooltipVisible, setTooltipVisible] = useState(false)
  const [coords, setCoords] = useState({ x: 0, y: 0 })
  const pillRef = useRef<HTMLDivElement>(null)

  const grouped: Record<IssueSeverity, Issue[]> = {
    critical: [],
    warning: [],
    info: [],
  }
  for (const issue of issues) {
    grouped[issue.severity].push(issue)
  }
  const presentSeverities = SEVERITY_ORDER.filter((s) => grouped[s].length > 0)

  useEffect(() => {
    if (!tooltipVisible || !pillRef.current) return
    const rect = pillRef.current.getBoundingClientRect()
    setCoords({ x: rect.left + rect.width / 2, y: rect.top - 8 })
  }, [tooltipVisible])

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onSelect()
  }

  return (
    <div
      ref={pillRef}
      data-testid="issue-counter-pill"
      style={{
        position: 'absolute',
        right: '6px',
        bottom: '6px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '2px 6px',
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        borderRadius: '999px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
        backdropFilter: 'blur(2px)',
        cursor: 'pointer',
        zIndex: 1,
      }}
      onClick={handleClick}
      onMouseEnter={() => setTooltipVisible(true)}
      onMouseLeave={() => setTooltipVisible(false)}
    >
      {presentSeverities.map((severity) => {
        const Icon = SEVERITY_ICONS[severity]
        return (
          <span
            key={severity}
            data-testid={`issue-counter-${severity}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '2px',
              fontSize: '10px',
              fontWeight: 600,
              lineHeight: 1,
              color: SEVERITY_COLORS[severity],
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            <Icon size={11} />
            {grouped[severity].length}
          </span>
        )
      })}
      {tooltipVisible &&
        createPortal(
          <div
            data-testid="issue-counter-tooltip"
            className="fixed z-[9999] pointer-events-none"
            style={{
              left: Math.max(8, Math.min(coords.x - 128, window.innerWidth - 264)),
              top: coords.y,
              transform: 'translateY(-100%)',
            }}
          >
            <div className="w-64 p-3 bg-slate-800 dark:bg-slate-700 text-white rounded-lg shadow-lg text-left">
              {presentSeverities.map((severity) => (
                <div key={severity} className="mb-2 last:mb-0">
                  <div
                    className="font-semibold text-xs mb-1"
                    style={{ color: SEVERITY_COLORS[severity] }}
                  >
                    {SEVERITY_LABELS[severity]} ({grouped[severity].length})
                  </div>
                  <ul className="text-xs text-slate-300 space-y-0.5">
                    {grouped[severity].map((issue) => (
                      <li key={issue.id} className="flex items-start gap-1.5">
                        <span className="text-slate-500 mt-0.5">•</span>
                        <span>{issue.title || 'Untitled issue'}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}
