import { useViewport } from 'reactflow'
import { InfoTooltip } from '../InfoTooltip'
import { VALUE_CHAIN_VISIBILITY } from '../../model/conceptDefinitions'

export function YAxisLabels() {
  const { x, y, zoom } = useViewport()

  const labels = [
    { text: 'Visible', key: 'visible', yPos: 80 },
    { text: 'Invisible', key: 'invisible', yPos: 1000 }
  ]

  return (
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
      {labels.map((label) => {
        const xPos = -20
        const transformedX = xPos * zoom + x
        const transformedY = label.yPos * zoom + y

        return (
          <div
            key={label.text}
            style={{
              position: 'absolute',
              left: transformedX,
              top: transformedY,
              transform: 'translate(0, -50%) rotate(-90deg)',
              transformOrigin: 'left center',
              pointerEvents: 'auto',
            }}
          >
            <InfoTooltip content={VALUE_CHAIN_VISIBILITY[label.key]} position="right">
              <span
                className="text-slate-700 dark:text-slate-200 cursor-help"
                style={{
                  whiteSpace: 'nowrap',
                  fontSize: `${16.5 * zoom}px`,
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  opacity: 0.9,
                }}
              >
                {label.text}
              </span>
            </InfoTooltip>
          </div>
        )
      })}
    </div>
  )
}
