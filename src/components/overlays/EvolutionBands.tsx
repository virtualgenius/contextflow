import { useViewport } from 'reactflow'
import { InfoTooltip } from '../InfoTooltip'
import { EVOLUTION_STAGES } from '../../model/conceptDefinitions'

export function EvolutionBands() {
  const { x, y, zoom } = useViewport()

  const bands = [
    { label: 'Genesis', key: 'genesis', position: 12.5, width: 25 },
    { label: 'Custom-Built', key: 'custom-built', position: 37.5, width: 25 },
    { label: 'Product', key: 'product/rental', position: 62.5, width: 25 },
    { label: 'Commodity', key: 'commodity/utility', position: 87.5, width: 25 },
  ]

  const zoneDividers = [25, 50, 75]

  return (
    <>
      {/* Zone divider lines */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 3,
        }}
      >
        {zoneDividers.map((position) => {
          const xPos = (position / 100) * 2000
          const transformedX = xPos * zoom + x

          return (
            <div
              key={`divider-${position}`}
              style={{
                position: 'absolute',
                left: transformedX,
                top: 0,
                width: '1px',
                height: `${1000 * zoom}px`,
                background:
                  'repeating-linear-gradient(to bottom, rgba(148, 163, 184, 0.3) 0px, rgba(148, 163, 184, 0.3) 5px, transparent 5px, transparent 10px)',
                marginTop: `${y}px`,
              }}
            />
          )
        })}
      </div>

      {/* Band labels */}
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
        {bands.map((band) => {
          const xPos = (band.position / 100) * 2000
          const yPos = 1040

          const transformedX = xPos * zoom + x
          const transformedY = yPos * zoom + y

          return (
            <div
              key={band.label}
              style={{
                position: 'absolute',
                left: transformedX,
                top: transformedY,
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'auto',
              }}
            >
              <InfoTooltip content={EVOLUTION_STAGES[band.key]} position="top">
                <span
                  className="text-slate-700 dark:text-slate-200 cursor-help"
                  style={{
                    whiteSpace: 'nowrap',
                    fontSize: `${22.5 * zoom}px`,
                    fontWeight: 600,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {band.label}
                </span>
              </InfoTooltip>
            </div>
          )
        })}
      </div>
    </>
  )
}
