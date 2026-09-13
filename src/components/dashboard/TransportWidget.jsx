import { Bus } from 'lucide-react'

function loadStatus(load) {
  if (load >= 0.9) return { label: 'Congested', className: 'text-status-critical' }
  if (load >= 0.7) return { label: 'Moderate', className: 'text-status-moderate' }
  return { label: 'Normal', className: 'text-status-safe' }
}

export default function TransportWidget({ routes }) {
  return (
    <div id="transport" className="panel p-4">
      <div className="flex items-center gap-2 mb-3.5">
        <Bus size={15} className="text-brand-400" />
        <h3 className="font-display font-semibold text-[13.5px]">Transport</h3>
      </div>
      <div className="space-y-3">
        {routes.map((r) => {
          const s = loadStatus(r.load)
          return (
            <div key={r.id}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11.5px] text-ink-dim truncate pr-2">{r.name}</span>
                <span className={`text-[11px] font-data ${s.className}`}>{Math.round(r.load * 100)}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-base-panel overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    r.load >= 0.9 ? 'bg-status-critical' : r.load >= 0.7 ? 'bg-status-moderate' : 'bg-status-safe'
                  }`}
                  style={{ width: `${Math.min(100, r.load * 100)}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
