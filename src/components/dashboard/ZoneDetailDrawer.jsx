import { X, ArrowUpRight, ArrowDownRight, Clock, TrendingUp } from 'lucide-react'
import { RISK_STYLES } from '../../lib/statusStyles.js'

export default function ZoneDetailDrawer({ zone, onClose }) {
  if (!zone) return null
  const style = RISK_STYLES[zone.risk]

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-md h-full bg-base-raised border-l border-base-hair overflow-y-auto">
        <div className="flex items-center justify-between px-5 h-16 border-b border-base-hair sticky top-0 bg-base-raised/95 backdrop-blur">
          <div>
            <p className="font-display font-semibold text-[15px]">{zone.name}</p>
            <span className={`text-[11px] font-medium ${style.text}`}>{style.label}</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-base-panel text-ink-dim">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div className={`rounded-xl border ${style.border} ${style.soft} p-4`}>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[11px] text-ink-faint mb-1">Current population</p>
                <p className="font-data text-2xl font-semibold">{zone.count.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-ink-faint mb-1">Capacity</p>
                <p className="font-data text-[15px] text-ink-dim">{zone.capacity.toLocaleString()}</p>
              </div>
            </div>
            <div className="mt-3 h-2 rounded-full bg-base-panel overflow-hidden">
              <div
                className={`${style.bg} h-full rounded-full transition-all`}
                style={{ width: `${Math.min(100, zone.ratio * 100)}%` }}
              />
            </div>
            <p className={`mt-2 font-data text-[13px] font-semibold ${style.text}`}>
              {Math.round(zone.ratio * 100)}% occupancy
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <MiniStat icon={ArrowUpRight} label="Incoming" value={`+${zone.incoming}/min`} tone="safe" />
            <MiniStat icon={ArrowDownRight} label="Outgoing" value={`-${zone.outgoing}/min`} tone="info" />
            <MiniStat icon={TrendingUp} label="Net flow" value={`${zone.netFlow >= 0 ? '+' : ''}${zone.netFlow}/min`} tone={zone.netFlow > 4 ? 'critical' : 'safe'} />
          </div>

          <div>
            <p className="text-[11px] text-ink-faint mb-1 flex items-center gap-1.5">
              <Clock size={12} /> Average dwell time
            </p>
            <p className="text-[14px] text-ink">{zone.dwell} minutes</p>
          </div>

          <div className="rounded-xl border border-base-hair bg-base-panel p-4">
            <p className="text-[12px] font-medium text-ink mb-3">Prediction</p>
            <div className="space-y-2">
              {zone.prediction.projections.map((p) => (
                <div key={p.min} className="flex items-center justify-between text-[13px]">
                  <span className="text-ink-faint">In {p.min} minutes</span>
                  <span className="font-data text-ink">{p.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
            {zone.prediction.breachIn ? (
              <div className="mt-3 pt-3 border-t border-base-hair">
                <p className="text-[12.5px] text-status-critical font-medium">
                  Capacity breach expected in approx. {zone.prediction.breachIn} minutes
                </p>
              </div>
            ) : (
              <div className="mt-3 pt-3 border-t border-base-hair">
                <p className="text-[12.5px] text-status-safe font-medium">No breach expected on current trend</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function MiniStat({ icon: Icon, label, value, tone }) {
  const toneClass = { safe: 'text-status-safe', info: 'text-status-info', critical: 'text-status-critical' }[tone]
  return (
    <div className="rounded-lg border border-base-hair bg-base-panel p-3">
      <Icon size={14} className={toneClass} />
      <p className="text-[10.5px] text-ink-faint mt-1.5">{label}</p>
      <p className="font-data text-[13px] text-ink mt-0.5">{value}</p>
    </div>
  )
}
