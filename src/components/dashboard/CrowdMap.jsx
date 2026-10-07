import { RISK_STYLES } from '../../lib/statusStyles.js'
import { useState } from 'react'
import DeckGL from '@deck.gl/react'
import { ScatterplotLayer } from '@deck.gl/layers'
import { OrthographicView } from '@deck.gl/core'
import { usePositions } from '../../hooks/usePositions.js'
import { Layers } from 'lucide-react'

const RISK_FILL = {
  safe: '#22A66F',
  moderate: '#E4A93B',
  high: '#F0864B',
  critical: '#E15945',
  overcapacity: '#E15945'
}

function lngLatToPixel(lng, lat) {
  return [
    115 + (lng - (-0.004)) * 22666,
    85 + (0.0050 - lat) * 30000
  ]
}

export default function CrowdMap({ zones, selectedZoneId, onSelect, hasPermission = false }) {
  const width = Math.max(570, ...zones.map(z => 115 + (z.lng - (-0.004)) * 22666 + (z.w / 2) + 20))
  const height = Math.max(460, ...zones.map(z => 85 + (0.0050 - z.lat) * 30000 + (z.h / 2) + 20))

  const flows = zones.filter((z) => z.netFlow > 3 && z.risk !== 'safe')
  
  const [viewMode, setViewMode] = useState('heatmap') // 'heatmap' or 'dots'
  const showDots = viewMode === 'dots' && hasPermission;
  
  // Throttle render is handled internally by DeckGL and usePositions hook frequency
  const positions = usePositions(showDots);

  const dotLayer = new ScatterplotLayer({
    id: 'scatter-plot',
    data: positions,
    radiusScale: 1,
    radiusMinPixels: 2,
    radiusMaxPixels: 6,
    getPosition: d => {
      const [x, y] = lngLatToPixel(d.lng, d.lat);
      return [x, y, 0];
    },
    getFillColor: d => d.stale ? [150, 150, 150, 180] : [255, 255, 255, 255],
    pickable: true,
    // Add simple tooltip handling if needed
  });

  return (
    <div id="map" className="panel p-4 lg:p-5 relative flex flex-col">
      <div className="flex items-center justify-between mb-4 z-10">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="font-display font-semibold text-[15px] text-slate-900">Live Crowd Map</h2>
            {hasPermission && (
              <div className="flex items-center bg-slate-100 p-0.5 rounded-[6px] border border-slate-200">
                <button
                  onClick={() => setViewMode('heatmap')}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-[4px] transition-colors ${viewMode === 'heatmap' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Heatmap
                </button>
                <button
                  onClick={() => setViewMode('dots')}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-[4px] transition-colors flex items-center gap-1 ${viewMode === 'dots' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <Layers size={12} />
                  Live Dots
                </button>
              </div>
            )}
          </div>
          <p className="text-[12px] text-slate-400 mt-1">Tap a zone for the full breakdown</p>
        </div>
        <Legend />
      </div>

      <div className="overflow-x-auto relative flex-1 min-h-[460px]">
        <div style={{ width, height, position: 'relative' }}>
          {/* Base SVG Map */}
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="absolute inset-0 w-full h-full"
            style={{ position: 'absolute', top: 0, left: 0 }}
          >
            <defs>
              <pattern id="grid" width="22" height="22" patternUnits="userSpaceOnUse">
                <path d="M 22 0 L 0 0 0 22" fill="none" stroke="#21262D" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="#161B22" rx="10" />
            <rect width="100%" height="100%" fill="url(#grid)" rx="10" />

            {/* DIRECTIONAL WAVES / FLOWS */}
            {flows.map((z) => {
              const target = zones.find((n) => n.neighbors?.includes(z.id) && n.ratio < z.ratio)
              if (!target) return null
              const [x1, y1] = lngLatToPixel(z.lng, z.lat);
              const [x2, y2] = lngLatToPixel(target.lng, target.lat);

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
              const [cx, cy] = lngLatToPixel(z.lng, z.lat);
              const zx = cx - (z.w / 2)
              const zy = cy - (z.h / 2)
              const isSelected = z.id === selectedZoneId
              const fill = RISK_FILL[z.risk] ?? RISK_FILL.safe

              return (
                <g
                  key={z.id}
                  transform={`translate(${zx}, ${zy})`}
                  onClick={() => onSelect(z.id)}
                  className="cursor-pointer"
                >
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
                  
                  {/* Heatmap visualization - hidden when dots are active */}
                  {viewMode === 'heatmap' && z.ratio > 0.05 && (
                    <g className="pointer-events-none transition-all duration-700 ease-out">
                      <circle cx={z.w / 2} cy={z.h / 2} r={(Math.min(z.w, z.h) * 0.55) * z.ratio} fill={fill} fillOpacity={0.06} />
                      <circle cx={z.w / 2} cy={z.h / 2} r={(Math.min(z.w, z.h) * 0.35) * z.ratio} fill={fill} fillOpacity={0.12} />
                      <circle cx={z.w / 2} cy={z.h / 2} r={(Math.min(z.w, z.h) * 0.15) * z.ratio} fill={fill} fillOpacity={0.25} />
                    </g>
                  )}

                  <text x="10" y="20" fontSize="11.5" fontFamily="-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" fontWeight="600" fill="#E6EDF3">
                    {z.name.split('·')[0].trim()}
                  </text>
                  <text x="10" y="37" fontSize="10.5" fontFamily="-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" fill="#8B949E">
                    {z.name.includes('·') ? z.name.split('·')[1].trim() : ''}
                  </text>
                  <text
                    x="10"
                    y={z.h - 12}
                    fontSize="15"
                    fontFamily="'SF Mono', ui-monospace, 'JetBrains Mono', 'Roboto Mono', monospace"
                    fontWeight="600"
                    fill={fill}
                  >
                    {Math.round(z.ratio * 100)}%
                  </text>
                  <text
                    x={z.w - 10}
                    y={z.h - 12}
                    fontSize="10"
                    fontFamily="'SF Mono', ui-monospace, 'JetBrains Mono', 'Roboto Mono', monospace"
                    fill="#8B949E"
                    textAnchor="end"
                  >
                    {z.count}/{z.capacity}
                  </text>
                </g>
              )
            })}
          </svg>
          
          {/* Deck.gl overlay for live dots */}
          {showDots && (
             <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 10 }}>
                <DeckGL
                  views={new OrthographicView({ id: 'ortho' })}
                  initialViewState={{ target: [width/2, height/2, 0], zoom: 1 }}
                  controller={false}
                  width={width}
                  height={height}
                  layers={[dotLayer]}
                  getTooltip={({object}) => object && `ID: ${object.short_id}\nZone: ${object.zone}\nScore: ${object.score}`}
                />
             </div>
          )}
        </div>
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
          <span className="text-[11px] text-slate-400">{RISK_STYLES[k].label}</span>
        </div>
      ))}
    </div>
  )
}
