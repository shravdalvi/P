import { Users, LayoutGrid, ShieldAlert, BellRing, Bus, BedDouble } from 'lucide-react'

function Card({ icon: Icon, label, value, suffix, tone = 'ink' }) {
  const toneClass = {
    ink: 'text-ink',
    safe: 'text-status-safe',
    critical: 'text-status-critical',
    brand: 'text-brand-300'
  }[tone]

  return (
    <div className="panel px-4 py-3.5 flex items-center gap-3.5 min-w-0">
      <div className="w-9 h-9 rounded-lg bg-base-panel border border-base-hair flex items-center justify-center shrink-0">
        <Icon size={16} strokeWidth={1.8} className="text-ink-dim" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-ink-faint truncate">{label}</p>
        <p className={`font-data text-[19px] font-semibold tabular-nums ${toneClass}`}>
          {value}
          {suffix && <span className="text-[12px] text-ink-faint ml-0.5 font-body">{suffix}</span>}
        </p>
      </div>
    </div>
  )
}

export default function KPICards({ kpis }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
      <Card icon={Users} label="Total visitors" value={kpis.totalVisitors.toLocaleString()} />
      <Card icon={LayoutGrid} label="Active zones" value={kpis.activeZones} />
      <Card
        icon={ShieldAlert}
        label="High-risk zones"
        value={kpis.highRisk}
        tone={kpis.highRisk > 0 ? 'critical' : 'safe'}
      />
      <Card
        icon={BellRing}
        label="Active alerts"
        value={kpis.activeAlerts}
        tone={kpis.activeAlerts > 0 ? 'critical' : 'safe'}
      />
      <Card icon={Bus} label="Transport load" value={kpis.transportLoad} suffix="%" />
      <Card icon={BedDouble} label="Hospitality occupancy" value={kpis.hospitalityOcc} suffix="%" />
    </div>
  )
}
