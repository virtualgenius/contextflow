import { useViewport } from 'reactflow'
import { InfoTooltip } from '../InfoTooltip'
import { DISTILLATION_AXES, DISTILLATION_REGIONS } from '../../model/conceptDefinitions'
import {
  DISTILLATION_GENERIC_MAX_X,
  DISTILLATION_CORE_MIN_X,
  DISTILLATION_CORE_MIN_Y,
} from '../../model/classification'

export function DistillationRegions() {
  const { x, y, zoom } = useViewport()

  // Define regions with background colors matching Nick Tune's chart
  // X-axis = Business Differentiation (0=Low, 100=High)
  // Y-axis = Model Complexity (0=Low, 100=High)
  const regions = [
    {
      name: 'GENERIC',
      key: 'generic',
      xStart: 0,
      xEnd: DISTILLATION_GENERIC_MAX_X,
      yStart: 0,
      yEnd: 100,
      color: 'rgba(153, 153, 153, 0.30)',
      textColor: '#fff',
      labelX: DISTILLATION_GENERIC_MAX_X / 2,
      labelY: 50,
    },
    {
      name: 'SUPPORTING',
      key: 'supporting',
      xStart: DISTILLATION_GENERIC_MAX_X,
      xEnd: 100,
      yStart: 0,
      yEnd: DISTILLATION_CORE_MIN_Y,
      color: 'rgba(162, 132, 193, 0.35)',
      textColor: '#fff',
      labelX: (DISTILLATION_GENERIC_MAX_X + 100) / 2,
      labelY: DISTILLATION_CORE_MIN_Y / 2,
    },
    {
      name: 'SUPPORTING',
      key: 'supporting',
      xStart: DISTILLATION_GENERIC_MAX_X,
      xEnd: DISTILLATION_CORE_MIN_X,
      yStart: DISTILLATION_CORE_MIN_Y,
      yEnd: 100,
      color: 'rgba(162, 132, 193, 0.35)',
      textColor: '#fff',
      labelX: (DISTILLATION_GENERIC_MAX_X + DISTILLATION_CORE_MIN_X) / 2,
      labelY: (DISTILLATION_CORE_MIN_Y + 100) / 2,
      hideLabel: true,
    },
    {
      name: 'CORE',
      key: 'core',
      xStart: DISTILLATION_CORE_MIN_X,
      xEnd: 100,
      yStart: DISTILLATION_CORE_MIN_Y,
      yEnd: 100,
      color: 'rgba(93, 186, 164, 0.35)',
      textColor: '#fff',
      labelX: (DISTILLATION_CORE_MIN_X + 100) / 2,
      labelY: (DISTILLATION_CORE_MIN_Y + 100) / 2,
    },
  ]

  const gridLines: { type: 'horizontal' | 'vertical'; position: number; label: string }[] = [
    { type: 'vertical', position: DISTILLATION_GENERIC_MAX_X, label: '' },
    { type: 'vertical', position: DISTILLATION_CORE_MIN_X, label: '' },
  ]

  // Axis labels - matching Nick Tune's layout
  // X-axis (bottom) = Business Differentiation (Low to High)
  const xAxisLabels = [
    { text: 'Low', xPos: 100, yPos: 980, hasTooltip: false },
    {
      text: 'Business Differentiation',
      xPos: 1000,
      yPos: 980,
      hasTooltip: true,
      tooltipKey: 'businessDifferentiation',
    },
    { text: 'High', xPos: 1900, yPos: 980, hasTooltip: false },
  ]

  // Y-axis (left) = Model Complexity (Low to High)
  const yAxisLabels = [
    { text: 'High', xPos: 50, yPos: 100, hasTooltip: false },
    {
      text: 'Model Complexity',
      xPos: 50,
      yPos: 500,
      hasTooltip: true,
      tooltipKey: 'modelComplexity',
    },
    { text: 'Low', xPos: 50, yPos: 900, hasTooltip: false },
  ]

  return (
    <>
      {/* Background regions - behind everything */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      >
        {regions.map((region, idx) => {
          const width = ((region.xEnd - region.xStart) / 100) * 2000
          const height = ((region.yEnd - region.yStart) / 100) * 1000
          const xPos = (region.xStart / 100) * 2000
          const yPos = (1 - region.yEnd / 100) * 1000

          const transformedX = xPos * zoom + x
          const transformedY = yPos * zoom + y
          const transformedWidth = width * zoom
          const transformedHeight = height * zoom

          return (
            <div
              key={`region-bg-${idx}`}
              style={{
                position: 'absolute',
                left: transformedX,
                top: transformedY,
                width: transformedWidth,
                height: transformedHeight,
                backgroundColor: region.color,
                border: '1px solid rgba(255, 255, 255, 0.15)',
              }}
            />
          )
        })}

        {/* Grid lines - dotted white like Nick Tune's chart */}
        {gridLines.map((line, idx) => {
          if (line.type === 'horizontal') {
            const yPos = (1 - line.position / 100) * 1000
            const transformedY = yPos * zoom + y
            return (
              <div
                key={`grid-h-${idx}`}
                style={{
                  position: 'absolute',
                  left: 0,
                  top: transformedY,
                  width: `${2000 * zoom}px`,
                  height: '1px',
                  background:
                    'repeating-linear-gradient(to right, rgba(255, 255, 255, 0.3) 0px, rgba(255, 255, 255, 0.3) 5px, transparent 5px, transparent 10px)',
                  marginLeft: `${x}px`,
                }}
              />
            )
          } else {
            const xPos = (line.position / 100) * 2000
            const transformedX = xPos * zoom + x
            return (
              <div
                key={`grid-v-${idx}`}
                style={{
                  position: 'absolute',
                  left: transformedX,
                  top: 0,
                  width: '1px',
                  height: `${1000 * zoom}px`,
                  background:
                    'repeating-linear-gradient(to bottom, rgba(255, 255, 255, 0.3) 0px, rgba(255, 255, 255, 0.3) 5px, transparent 5px, transparent 10px)',
                  marginTop: `${y}px`,
                }}
              />
            )
          }
        })}
      </div>

      {/* Region labels - in separate container with higher z-index for tooltip interactivity */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 15,
        }}
      >
        {regions.map((region, idx) => {
          if (region.hideLabel) return null

          const labelX = (region.labelX / 100) * 2000
          const labelY = (1 - region.labelY / 100) * 1000
          const transformedLabelX = labelX * zoom + x
          const transformedLabelY = labelY * zoom + y

          return (
            <div
              key={`region-label-${idx}`}
              style={{
                position: 'absolute',
                left: transformedLabelX,
                top: transformedLabelY,
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'auto',
              }}
            >
              <InfoTooltip content={DISTILLATION_REGIONS[region.key]} position="top">
                <span
                  className="cursor-help"
                  style={{
                    color: region.textColor,
                    fontSize: `${48 * zoom}px`,
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    opacity: 0.85,
                    textShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  }}
                >
                  {region.name}
                </span>
              </InfoTooltip>
            </div>
          )
        })}
      </div>

      {/* X-axis labels */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 5,
        }}
      >
        {xAxisLabels.map((label) => {
          const transformedX = label.xPos * zoom + x
          const transformedY = label.yPos * zoom + y

          const labelContent = (
            <span
              className={`text-slate-700 dark:text-slate-200 ${label.hasTooltip ? 'cursor-help' : ''}`}
              style={{
                whiteSpace: 'nowrap',
                fontSize: `${18 * zoom}px`,
                fontWeight: 600,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                opacity: 0.8,
              }}
            >
              {label.text}
            </span>
          )

          return (
            <div
              key={label.text}
              style={{
                position: 'absolute',
                left: transformedX,
                top: transformedY,
                transform: 'translate(-50%, -50%)',
                pointerEvents: label.hasTooltip ? 'auto' : 'none',
              }}
            >
              {label.hasTooltip && label.tooltipKey ? (
                <InfoTooltip content={DISTILLATION_AXES[label.tooltipKey]} position="top">
                  {labelContent}
                </InfoTooltip>
              ) : (
                labelContent
              )}
            </div>
          )
        })}
      </div>

      {/* Y-axis labels */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 5,
        }}
      >
        {yAxisLabels.map((label) => {
          const transformedX = label.xPos * zoom + x
          const transformedY = label.yPos * zoom + y

          const labelContent = (
            <span
              className={`text-slate-700 dark:text-slate-200 ${label.hasTooltip ? 'cursor-help' : ''}`}
              style={{
                whiteSpace: 'nowrap',
                fontSize: `${18 * zoom}px`,
                fontWeight: 600,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                opacity: 0.8,
              }}
            >
              {label.text}
            </span>
          )

          return (
            <div
              key={label.text}
              style={{
                position: 'absolute',
                left: transformedX,
                top: transformedY,
                transform: 'translate(0, -50%) rotate(-90deg)',
                transformOrigin: 'left center',
                pointerEvents: label.hasTooltip ? 'auto' : 'none',
              }}
            >
              {label.hasTooltip && label.tooltipKey ? (
                <InfoTooltip content={DISTILLATION_AXES[label.tooltipKey]} position="right">
                  {labelContent}
                </InfoTooltip>
              ) : (
                labelContent
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}
