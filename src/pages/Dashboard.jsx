import { useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'
import LiveMapPage from './LiveMap.jsx'
import PredictionPanel from '../components/dashboard/PredictionPanel.jsx'
import RecommendationPanel from '../components/dashboard/RecommendationPanel.jsx'
import ZoneDetailDrawer from '../components/dashboard/ZoneDetailDrawer.jsx'
import {
  Users,
  LayoutGrid,
  ShieldAlert,
  BellRing,
  Radio,
  TrendingUp,
  ArrowRight,
  Clock,
  Activity
} from 'lucide-react'

export default function Dashboard() {
  const engine = useOutletContext()

  const focusZone = useMemo(() => {
    if (!engine?.zones || engine.zones.length === 0) return null
    return [...engine.zones].sort((a, b) => b.ratio - a.ratio)[0]
  }, [engine?.zones])

  const divertZone = useMemo(() => {
    if (!focusZone || !engine?.zones) return null
    const safeNeighbors = engine.zones.filter(
      (z) => focusZone.neighbors?.includes(z.id) && z.risk === 'safe'
    )
    if (safeNeighbors.length > 0) {
      return [...safeNeighbors].sort((a, b) => a.ratio - b.ratio)[0]
    }
    const anyNeighbors = engine.zones.filter((z) => focusZone.neighbors?.includes(z.id))
    if (anyNeighbors.length > 0) {
      return [...anyNeighbors].sort((a, b) => a.ratio - b.ratio)[0]
    }
    return engine.zones.filter((z) => z.risk === 'safe')[0]
  }, [focusZone, engine?.zones])

  const riskWindow = focusZone?.prediction?.breachIn
    ? `< ${focusZone.prediction.breachIn}m`
    : 'Stable'
  const actionWindow = focusZone?.prediction?.breachIn
    ? `< ${Math.max(1, focusZone.prediction.breachIn - 5)}m`
    : 'Monitoring'

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-[1600px] mx-auto min-h-full flex flex-col">

      {/* ── TOP COMPACT STATUS AREA ────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        {/* Row 1: Total Crowd + Tactical Prediction */}
        <div className="flex flex-col lg:flex-row lg:items-stretch gap-3">
          <div className="bg-surface-panel p-4 rounded-[6px] border border-border-default flex items-center justify-between lg:w-72 shrink-0">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-widest text-ink-faint block mb-1">
                Total Crowd
              </span>
              <span className="font-data text-3xl font-bold text-ink leading-none">
                {engine?.kpis?.totalVisitors?.toLocaleString() ?? 0}
              </span>
            </div>
            <Users size={32} className="text-accent opacity-20" />
          </div>

          {focusZone && (
            <div className="bg-surface-panel p-4 rounded-[6px] border border-border-default flex-1 flex flex-col justify-center">
              <span className="text-[10px] font-mono uppercase tracking-widest text-ink-faint block mb-2.5">
                Tactical Prediction Intelligence
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11.5px]">
                <div className="flex items-center gap-2">
                  <TrendingUp size={14} className="text-status-critical shrink-0" />
                  <div>
                    <span className="text-[9.5px] font-mono uppercase text-ink-faint block leading-tight">Rush Toward</span>
                    <span className="font-bold text-status-critical truncate">{focusZone.name.split('·')[0].trim()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <ArrowRight size={14} className="text-accent shrink-0" />
                  <div>
                    <span className="text-[9.5px] font-mono uppercase text-ink-faint block leading-tight">Divert To</span>
                    <span className="font-bold text-accent truncate">{divertZone ? divertZone.name.split('·')[0].trim() : 'N/A'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-status-moderate shrink-0" />
                  <div>
                    <span className="text-[9.5px] font-mono uppercase text-ink-faint block leading-tight">Risk Window</span>
                    <span className="font-mono font-bold text-status-moderate">{riskWindow}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-status-safe animate-pulse shrink-0" />
                  <div>
                    <span className="text-[9.5px] font-mono uppercase text-ink-faint block leading-tight">Action Window</span>
                    <span className="font-mono font-bold text-status-safe">{actionWindow}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Row 2: Secondary Operational Metrics */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-surface-panel px-3 py-2 rounded-[6px] border border-border-default flex-1 min-w-[140px]">
            <LayoutGrid size={14} className="text-ink-dim shrink-0" />
            <div>
              <span className="text-[9.5px] font-mono uppercase tracking-wider text-ink-faint block leading-none mb-1">Active Sectors</span>
              <span className="font-data text-[14px] font-bold text-ink leading-none">{engine?.kpis?.activeZones ?? 0} / 12</span>
            </div>
          </div>
          <div className={`flex items-center gap-2 px-3 py-2 rounded-[6px] border flex-1 min-w-[140px] transition-colors ${
            (engine?.kpis?.highRisk ?? 0) > 0 ? 'bg-status-critical/10 border-status-critical/30 text-status-critical' : 'bg-surface-panel border-border-default text-ink'
          }`}>
            <ShieldAlert size={14} className={(engine?.kpis?.highRisk ?? 0) > 0 ? 'text-status-critical' : 'text-status-safe'} />
            <div>
              <span className="text-[9.5px] font-mono uppercase tracking-wider text-ink-faint block leading-none mb-1">At Risk</span>
              <span className={`font-data text-[14px] font-bold leading-none ${(engine?.kpis?.highRisk ?? 0) > 0 ? 'text-status-critical' : 'text-status-safe'}`}>
                {engine?.kpis?.highRisk ?? 0}
              </span>
            </div>
          </div>
          <div className={`flex items-center gap-2 px-3 py-2 rounded-[6px] border flex-1 min-w-[140px] transition-colors ${
            (engine?.kpis?.activeAlerts ?? 0) > 0 ? 'bg-status-critical/10 border-status-critical/30 text-status-critical' : 'bg-surface-panel border-border-default text-ink'
          }`}>
            <BellRing size={14} className={(engine?.kpis?.activeAlerts ?? 0) > 0 ? 'text-status-critical animate-pulse' : 'text-ink-dim'} />
            <div>
              <span className="text-[9.5px] font-mono uppercase tracking-wider text-ink-faint block leading-none mb-1">Alerts</span>
              <span className={`font-data text-[14px] font-bold leading-none ${(engine?.kpis?.activeAlerts ?? 0) > 0 ? 'text-status-critical' : 'text-ink'}`}>
                {engine?.kpis?.activeAlerts ?? 0}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-surface-panel px-3 py-2 rounded-[6px] border border-border-default flex-1 min-w-[140px]">
            <Radio size={14} className="text-status-safe shrink-0" />
            <div>
              <span className="text-[9.5px] font-mono uppercase tracking-wider text-ink-faint block leading-none mb-1">System</span>
              <span className="font-data text-[14px] font-bold text-status-safe leading-none">{engine?.network?.health ?? 98}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN MAP AREA ──────────────────────────────────────────────────── */}
      <div className="flex flex-col h-[480px] rounded-[6px] overflow-hidden border border-border-default shadow-sm relative">
        <LiveMapPage isDashboardMode={true} />
      </div>

      {/* ── ZONE INFORMATION CARDS ─────────────────────────────────────────── */}
      <div>
        <span className="text-[11px] font-mono uppercase tracking-widest text-ink-faint block mb-3">
          Live Sector Telemetry
        </span>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {(engine?.zones || []).map(z => {
            const isHighRisk = z.risk === 'critical' || z.risk === 'high'
            return (
              <button
                key={z.id}
                onClick={() => engine?.setSelectedZoneId(z.id)}
                className={`flex flex-col text-left p-3 rounded-[6px] border transition-all ${
                  isHighRisk
                    ? 'bg-status-critical/5 border-status-critical/30 hover:border-status-critical/60'
                    : 'bg-surface-panel border-border-default hover:border-border-muted hover:bg-surface-raised'
                }`}
              >
                <div className="flex items-center justify-between mb-2 w-full">
                  <span className="font-semibold text-[12px] text-ink truncate pr-2">
                    {z.name.split('·')[0].trim()}
                  </span>
                  <span className={`text-[10px] font-mono font-bold uppercase ${isHighRisk ? 'text-status-critical' : 'text-status-safe'}`}>
                    {Math.round(z.ratio * 100)}%
                  </span>
                </div>

                <div className="w-full h-1.5 rounded-full bg-surface-overlay overflow-hidden mb-2.5">
                  <div
                    className={`h-full rounded-full ${isHighRisk ? 'bg-status-critical' : z.risk === 'moderate' ? 'bg-status-moderate' : 'bg-status-safe'}`}
                    style={{ width: `${Math.min(100, z.ratio * 100)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10.5px] font-data text-ink-dim w-full mt-auto">
                  <span>{z.count.toLocaleString()}</span>
                  <span className="text-ink-faint">/ {z.capacity.toLocaleString()}</span>
                </div>

                <div className="flex items-center gap-1 mt-1.5 pt-1.5 border-t border-border-muted/50 w-full text-[10px] font-data">
                  <Activity size={10} className="text-ink-faint" />
                  <span className={z.netFlow > 2 ? 'text-status-critical' : z.netFlow < -2 ? 'text-accent' : 'text-ink-dim'}>
                    {z.netFlow > 0 ? '+' : ''}{z.netFlow}/m net flow
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── AI / OPERATIONAL INTELLIGENCE ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start pb-6">
        {/* LEFT: CROWD PREDICTION ENGINE */}
        <div className="flex flex-col h-full">
          <PredictionPanel
            zones={engine?.zones || []}
            onSelect={engine?.setSelectedZoneId}
          />
        </div>

        {/* RIGHT: AI RECOMMENDATIONS */}
        <div className="flex flex-col h-full">
          <RecommendationPanel
            recommendations={engine?.recommendations || []}
            onApprove={engine?.approveRecommendation}
            onDismiss={engine?.dismissRecommendation}
            onUpdate={engine?.updateRecommendation}
          />
        </div>
      </div>

      {/* ── CONDITIONAL: Zone Detail Drawer ───────────────────────────────── */}
      {engine?.selectedZone && (
        <ZoneDetailDrawer
          zone={engine.selectedZone}
          onClose={() => engine?.setSelectedZoneId(null)}
        />
      )}
    </div>
  )
}
