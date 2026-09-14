import { ArrowRight, Gauge, TrendingUp } from 'lucide-react'

const zones = [
  { name: 'Zone A', count: '850 / 1000', change: '+50/min', risk: 'High Risk', time: '~3 min to capacity', action: 'Redirect to Zone B', tone: 'bg-[#FBD9D3] text-[#C54D40]' },
  { name: 'Zone B', count: '760 / 1000', change: '+25/min', risk: 'Moderate', time: '~8 min to capacity', action: 'Keep open flow lane', tone: 'bg-[#FBEAC7] text-[#A76F0C]' },
  { name: 'Zone C', count: '1,230 / 1,400', change: '+80/min', risk: 'High Risk', time: '~2 min to capacity', action: 'Activate crowd buffer', tone: 'bg-[#FBD9D3] text-[#C54D40]' },
  { name: 'Zone D', count: '670 / 900', change: '+18/min', risk: 'Low Risk', time: '~12 min to capacity', action: 'Maintain normal flow', tone: 'bg-[#DFF5EA] text-[#1E6D5B]' }
]

export default function ZonesPage() {
  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <p className="text-[11px] uppercase tracking-[0.18em] text-ink-faint font-semibold">ZONES & CROWD ANALYSIS</p>
        <h1 className="mt-2 font-display text-4xl text-ink">Zone-by-zone insights</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2">
        {zones.map((zone) => (
          <div key={zone.name} className="panel p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.14em] text-ink-faint">{zone.name}</p>
                <h3 className="mt-2 font-display text-3xl text-ink">{zone.count}</h3>
              </div>
              <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${zone.tone}`}>{zone.risk}</span>
            </div>

            <div className="mt-5 space-y-3 text-sm text-ink-dim">
              <div className="flex items-center justify-between"><span className="flex items-center gap-2"><TrendingUp size={14} className="text-[#1E6D5B]" /> Rate of change</span><span className="font-medium text-ink">{zone.change}</span></div>
              <div className="flex items-center justify-between"><span className="flex items-center gap-2"><Gauge size={14} className="text-[#1E6D5B]" /> Predicted capacity</span><span className="font-medium text-ink">{zone.time}</span></div>
              <div className="flex items-center justify-between pt-2 border-t border-[#EEF1EE]">
                <span className="text-ink-faint">AI recommendation</span>
                <span className="font-medium text-ink">{zone.action}</span>
              </div>
            </div>

            <button className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-[#1E6D5B]">
              View details <ArrowRight size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
