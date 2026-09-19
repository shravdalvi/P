import { RISK_STYLES } from '../../lib/statusStyles.js'

const RISK_FILL = {
  safe: '#22A66F',
  moderate: '#E4A93B',
  high: '#F0864B',
  critical: '#E15945',
  overcapacity: '#E15945'
}

export default function CrowdMap({ zones, selectedZoneId, onSelect }) {
    const width = Math.max(570, ...zones.map(z => 115 + (z.lng - (-0.004)) * 22666 + (z.w / 2) + 20))
  const height = Math.max(460, ...zones.map(z => 85 + (0.0050 - z.lat) * 30000 + (z.h / 2) + 20))

  const flows = zones.filter((z) => z.netFlow > 3 && z.risk !== 'safe')

  return (
    <div id="map" className="panel p-4 lg:p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-display font-semibold text-[15px] text-ink">Live Crowd Map</h2>
          <p className="text-[12px] text-ink-faint mt-0.5">Tap a zone for the full breakdown</p>
        </div>
        <Legend />
      </div>

      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto"
          style={{ height: "auto" }}
        >
          <defs>
            <pattern id="grid" width="22" height="22" patternUnits="userSpaceOnUse">
              <path d="M 22 0 L 0 0 0 22" fill="none" stroke="#21262D" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="#161B22" rx="10" />
          <rect width="100%" height="100%" fill="url(#grid)" rx="10" />

          {/* DIRECTIONAL WAVES / FLOWS (rendered beneath zones) */}
          {flows.map((z) => {
            const target = zones.find((n) => n.neighbors?.includes(z.id) && n.ratio < z.ratio)
            if (!target) return null
            const x1 = 115 + (z.lng - (-0.004)) * 22666
            const y1 = 85 + (0.0050 - z.lat) * 30000
            const x2 = 115 + (target.lng - (-0.004)) * 22666
            const y2 = 85 + (0.0050 - target.lat) * 30000

            // Subtle bezier curve for flow
            const dx = x2 - x1
            const dy = y2 - y1
            const cx = x1 + dx * 0.5 - dy * 0.25
            const cy = y1 + dy * 0.5 + dx * 0.25

            return (
              <path
                key={`flow-${z.id}`}
                d={`M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`}
                fill="none"
                stroke="#58A6A6"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                className="flow-line"
                opacity="0.6"
              />
            )
          })}

          {zones.map((z) => {
            const zx = 115 + (z.lng - (-0.004)) * 22666 - (z.w / 2)
            const zy = 85 + (0.0050 - z.lat) * 30000 - (z.h / 2)
            const isSelected = z.id === selectedZoneId
            const fill = RISK_FILL[z.risk] ?? RISK_FILL.safe

            return (
              <g
                key={z.id}
                transform={`translate(${zx}, ${zy})`}
                onClick={() => onSelect(z.id)}
                className="cursor-pointer"
              >
                {/* Base Zone Plate */}
                <rect
                  width={z.w}
                  height={z.h}
                  rx="6"
                  fill="#1C2128"
                  fillOpacity={0.4}
                  stroke={fill}
                  strokeOpacity={isSelected ? 0.95 : 0.3}
                  strokeWidth={isSelected ? 2 : 1}
                  className={z.risk === 'critical' || z.risk === 'overcapacity' ? 'critical-pulse' : ''}
                />

                {/* Core / Center Dot */}
                <circle cx={z.w / 2} cy={z.h / 2} r="4" fill={fill} stroke="#000" strokeWidth="2" />
                {/* Subtle Real-Time Heat/Pressure Visualization */}
                {z.ratio > 0.05 && (
                  <g className="pointer-events-none transition-all duration-700 ease-out">
                    <circle cx={z.w / 2} cy={z.h / 2} r={(Math.min(z.w, z.h) * 0.55) * z.ratio} fill={fill} fillOpacity={0.06} />
                    <circle cx={z.w / 2} cy={z.h / 2} r={(Math.min(z.w, z.h) * 0.35) * z.ratio} fill={fill} fillOpacity={0.12} />
                    <circle cx={z.w / 2} cy={z.h / 2} r={(Math.min(z.w, z.h) * 0.15) * z.ratio} fill={fill} fillOpacity={0.25} />
                  </g>
                )}

                <text x="10" y="20" fontSize="11.5" fontFamily="Space Grotesk, sans-serif" fontWeight="600" fill="#E6EDF3">
                  {z.name.split('·')[0].trim()}
                </text>
                <text x="10" y="37" fontSize="10.5" fontFamily="Inter, sans-serif" fill="#8B949E">
                  {z.name.includes('·') ? z.name.split('·')[1].trim() : ''}
                </text>
                <text
                  x="10"
                  y={z.h - 12}
                  fontSize="15"
                  fontFamily="JetBrains Mono, monospace"
                  fontWeight="600"
                  fill={fill}
                >
                  {Math.round(z.ratio * 100)}%
                </text>
                <text
                  x={z.w - 10}
                  y={z.h - 12}
                  fontSize="10"
                  fontFamily="JetBrains Mono, monospace"
                  fill="#8B949E"
                  textAnchor="end"
                >
                  {z.count}/{z.capacity}
                </text>
              </g>
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
