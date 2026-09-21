import { useMemo } from 'react'
import { TrendingUp, Gauge } from 'lucide-react'
import { RISK_STYLES } from '../../lib/statusStyles.js'

export default function PredictionPanel({ zones, onSelect }) {
  const focusZone = useMemo(() => {
    return [...zones].sort((a, b) => (b.occupancyPercentage ?? b.ratio) - (a.occupancyPercentage ?? a.ratio))[0]
  }, [zones])

  if (!focusZone) return null
  const style = RISK_STYLES[focusZone.risk]
  const maxProjected = Math.max(...focusZone.prediction.projections.map((p) => p.value), focusZone.capacity)

  return (
    <div id="predictions" className="panel p-4 lg:p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Gauge size={16} className="text-brand-400" />
          <h2 className="font-display font-semibold text-[15px]">Crowd Prediction Engine</h2>
        </div>
        <button
          onClick={() => onSelect(focusZone.id)}
          className="text-[11.5px] text-brand-300 hover:text-brand-200"
        >
          View zone →
        </button>
      </div>

      <p className="text-[12.5px] text-ink-faint mb-4">
        Highest-risk zone right now: <span className="text-ink">{focusZone.name}</span>
      </p>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <Stat label="Current" value={`${(focusZone.occupancy ?? focusZone.count).toLocaleString()}`} sub={`/ ${focusZone.capacity.toLocaleString()}`} />
        <Stat
          label="Net flow"
          value={`${focusZone.netFlow >= 0 ? '+' : ''}${focusZone.netFlow}`}
          sub="people/min"
        />
        <Stat label="Occupancy" value={`${Math.round((focusZone.occupancyPercentage ?? focusZone.ratio) * 100)}%`} tone={style.text} />
      </div>

      <div className="space-y-2 mb-4">
        {focusZone.prediction.projections.map((p) => (
          <div key={p.min} className="flex items-center gap-3">
            <span className="text-[11px] text-ink-faint w-14 shrink-0">+{p.min} min</span>
            <div className="flex-1 h-2 rounded-full bg-base-panel overflow-hidden">
              <div
                className={`${style.bg} h-full rounded-full`}
                style={{ width: `${Math.min(100, (p.value / maxProjected) * 100)}%` }}
              />
            </div>
            <span className="font-data text-[12px] text-ink w-14 text-right shrink-0">{p.value}</span>
          </div>
        ))}
      </div>

      <div className={`rounded-lg border ${style.border} ${style.soft} px-3.5 py-3 flex items-start gap-2.5`}>
        <TrendingUp size={15} className={`${style.text} shrink-0 mt-0.5`} />
        <p className="text-[12.5px] text-ink leading-snug">
          {focusZone.prediction.breachIn
            ? `Capacity breach expected in approximately ${focusZone.prediction.breachIn} minutes at the current flow rate.`
            : 'No capacity breach expected on the current trend.'}
        </p>
      </div>
    </div>
  )
}

function Stat({ label, value, sub, tone = 'text-ink' }) {
  return (
    <div className="rounded-lg border border-base-hair bg-base-panel px-3 py-2.5">
      <p className="text-[10.5px] text-ink-faint">{label}</p>
      <p className={`font-data text-[16px] font-semibold ${tone}`}>
        {value}
        {sub && <span className="text-[10.5px] text-ink-faint font-body ml-1">{sub}</span>}
      </p>
    </div>
  )
}
