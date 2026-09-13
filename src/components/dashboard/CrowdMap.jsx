import { RISK_STYLES } from '../../lib/statusStyles.js'

const RISK_FILL = {
  safe: '#49D17A',
  moderate: '#E8B93F',
  high: '#F0873F',
  critical: '#EF4A55',
  overcapacity: '#EF4A55'
}

export default function CrowdMap({ zones, selectedZoneId, onSelect }) {
  const width = 570
  const height = 460

  const flows = zones.filter((z) => z.netFlow > 3 && z.risk !== 'safe')

  return (
    <div id="map" className="panel p-4 lg:p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-display font-semibold text-[15px]">Live Crowd Map</h2>
          <p className="text-[12px] text-ink-faint mt-0.5">Tap a zone for the full breakdown</p>
        </div>
        <Legend />
      </div>

      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full min-w-[520px]"
          style={{ maxHeight: 460 }}
        >
          <defs>
            <pattern id="grid" width="22" height="22" patternUnits="userSpaceOnUse">
              <path d="M 22 0 L 0 0 0 22" fill="none" stroke="#132420" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width={width} height={height} fill="url(#grid)" rx="14" />

          {zones.map((z) => {
            const isSelected = z.id === selectedZoneId
            const fill = RISK_FILL[z.risk] ?? RISK_FILL.safe
            return (
              <g
                key={z.id}
                transform={`translate(${z.x}, ${z.y})`}
                onClick={() => onSelect(z.id)}
                className="cursor-pointer"
              >
                <rect
                  width={z.w}
                  height={z.h}
                  rx="10"
                  fill={fill}
                  fillOpacity={isSelected ? 0.26 : 0.14}
                  stroke={fill}
                  strokeOpacity={isSelected ? 0.9 : 0.45}
                  strokeWidth={isSelected ? 2 : 1.2}
                  className={z.risk === 'critical' || z.risk === 'overcapacity' ? 'critical-pulse' : ''}
                />
                <text x="10" y="20" fontSize="11.5" fontFamily="Space Grotesk" fontWeight="600" fill="#EAF4F0">
                  {z.name.split('·')[0].trim()}
                </text>
                <text x="10" y="37" fontSize="10.5" fontFamily="Inter" fill="#9FB6AE">
                  {z.name.includes('·') ? z.name.split('·')[1].trim() : ''}
                </text>
                <text
                  x="10"
                  y={z.h - 12}
                  fontSize="15"
                  fontFamily="JetBrains Mono"
                  fontWeight="600"
                  fill={fill}
                >
                  {Math.round(z.ratio * 100)}%
                </text>
                <text
                  x={z.w - 10}
                  y={z.h - 12}
                  fontSize="10"
                  fontFamily="JetBrains Mono"
                  fill="#9FB6AE"
                  textAnchor="end"
                >
                  {z.count}/{z.capacity}
                </text>
              </g>
            )
          })}

          {flows.map((z) => {
            const target = zones.find((n) => n.neighbors?.includes(z.id) && n.ratio < z.ratio)
            if (!target) return null
            const x1 = z.x + z.w / 2
            const y1 = z.y + z.h / 2
            const x2 = target.x + target.w / 2
            const y2 = target.y + target.h / 2
            return (
              <line
                key={`flow-${z.id}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#3FDBA6"
                strokeWidth="1.6"
                className="flow-line"
                opacity="0.7"
              />
            )
          })}
        </svg>
      </div>
    </div>
  )
}

function Legend() {
  const items = ['safe', 'moderate', 'high', 'critical']
  return (
    <div className="hidden sm:flex items-center gap-3">
      {items.map((k) => (
        <div key={k} className="flex items-center gap-1.5">
          <span className={`status-dot ${RISK_STYLES[k].bg}`} />
          <span className="text-[11px] text-ink-faint">{RISK_STYLES[k].label}</span>
        </div>
      ))}
    </div>
  )
}
