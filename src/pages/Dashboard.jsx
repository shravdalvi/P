import { useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'
import DemoControls from '../components/dashboard/DemoControls.jsx'
import CrowdMap from '../components/dashboard/CrowdMap.jsx'
import PredictionPanel from '../components/dashboard/PredictionPanel.jsx'
import RecommendationPanel from '../components/dashboard/RecommendationPanel.jsx'
import ZoneDetailDrawer from '../components/dashboard/ZoneDetailDrawer.jsx'
import { EVENT } from '../data/mockData.js'
import {
  Users,
  LayoutGrid,
  ShieldAlert,
  BellRing,
  Radio,
  TrendingUp,
  ArrowRight,
  Clock
} from 'lucide-react'

export default function Dashboard() {
  const engine = useOutletContext()

  // Tactical AI prediction intelligence derived directly from existing engine state
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
    return [...engine.zones].filter((z) => z.id !== focusZone.id).sort((a, b) => a.ratio - b.ratio)[0]
  }, [engine?.zones, focusZone])

  if (!engine) return null

  const isBreach = Boolean(focusZone?.prediction?.breachIn) || (focusZone?.ratio ?? 0) >= 0.88
  const breachMinutes = focusZone?.prediction?.breachIn ?? ((focusZone?.ratio ?? 0) >= 0.88 ? 3 : null)
  const riskWindow = breachMinutes ? `~${breachMinutes} min` : focusZone?.risk === 'high' ? '~5 min' : 'Nominal (>15m)'
  const actionWindow = isBreach ? 'Now' : focusZone?.risk === 'high' ? 'Next 3 min' : 'Monitoring'

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-[1600px] mx-auto min-h-full flex flex-col">
      {/* ── SIMULATION SCENARIO CONTROLS ──────────────────────────────────── */}
      <DemoControls
        running={engine.running}
        scenario={engine.scenario}
        setRunning={engine.setRunning}
        setDemoScenario={engine.setDemoScenario}
        resetSimulation={engine.resetSimulation}
      />

      {/* ── AREA 2: EVENT & CROWD STATUS + OPERATOR PROFILE ──────────────── */}
      <section aria-label="Event Status" className="panel p-3 lg:px-4 lg:py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Operator Profile & Event Context */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0">
            <div className="w-8 h-8 rounded-[4px] bg-accent/15 border border-accent/40 text-accent font-mono font-bold text-[12px] flex items-center justify-center">
              O
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-status-safe border border-surface-panel" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[12.5px] font-semibold text-ink leading-none">
                Operator: Lead Safety Controller
              </span>
              <span className="inline-flex items-center gap-1 rounded bg-status-safe/10 border border-status-safe/30 px-1.5 py-0.2 text-[9.5px] font-mono text-status-safe">
                <span className="w-1 h-1 rounded-full bg-status-safe animate-pulse" />
                ACTIVE WATCH
              </span>
            </div>
            <p className="text-[11px] font-mono text-ink-faint mt-1 truncate">
              {EVENT.name} · {EVENT.venue}
              {engine.selectedZone && (
                <span className="text-accent ml-2">
                  [Selected: {engine.selectedZone.name.split('·')[0].trim()}]
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Compact Operational Telemetry Strip */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* TOTAL CROWD */}
          <div className="flex items-center gap-2 bg-surface-raised px-2.5 py-1.5 rounded-[4px] border border-border-default">
            <Users size={13} className="text-accent shrink-0" />
            <div>
              <span className="text-[9px] font-mono uppercase tracking-wider text-ink-faint block leading-none">
                Total Crowd
              </span>
              <span className="font-data text-[13px] font-bold text-ink">
                {engine.kpis.totalVisitors.toLocaleString()}
              </span>
            </div>
          </div>

          {/* ACTIVE SECTORS */}
          <div className="flex items-center gap-2 bg-surface-raised px-2.5 py-1.5 rounded-[4px] border border-border-default">
            <LayoutGrid size={13} className="text-ink-dim shrink-0" />
            <div>
              <span className="text-[9px] font-mono uppercase tracking-wider text-ink-faint block leading-none">
                Active Sectors
              </span>
              <span className="font-data text-[13px] font-bold text-ink">
                {engine.kpis.activeZones} / 12
              </span>
            </div>
          </div>

          {/* AT RISK */}
          <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-[4px] border transition-colors ${
            engine.kpis.highRisk > 0
              ? 'bg-status-critical/10 border-status-critical/30 text-status-critical'
              : 'bg-surface-raised border-border-default text-ink'
          }`}>
            <ShieldAlert size={13} className={engine.kpis.highRisk > 0 ? 'text-status-critical shrink-0' : 'text-status-safe shrink-0'} />
            <div>
              <span className="text-[9px] font-mono uppercase tracking-wider text-ink-faint block leading-none">
                At Risk
              </span>
              <span className={`font-data text-[13px] font-bold ${engine.kpis.highRisk > 0 ? 'text-status-critical' : 'text-status-safe'}`}>
                {engine.kpis.highRisk}
              </span>
            </div>
          </div>

          {/* CRITICAL ALERTS */}
          <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-[4px] border transition-colors ${
            engine.kpis.activeAlerts > 0
              ? 'bg-status-critical/15 border-status-critical/40 text-status-critical'
              : 'bg-surface-raised border-border-default text-ink'
          }`}>
            <BellRing size={13} className={engine.kpis.activeAlerts > 0 ? 'text-status-critical animate-pulse shrink-0' : 'text-ink-dim shrink-0'} />
            <div>
              <span className="text-[9px] font-mono uppercase tracking-wider text-ink-faint block leading-none">
                Alerts
              </span>
              <span className={`font-data text-[13px] font-bold ${engine.kpis.activeAlerts > 0 ? 'text-status-critical' : 'text-ink'}`}>
                {engine.kpis.activeAlerts}
              </span>
            </div>
          </div>

          {/* SYSTEM HEALTH */}
          <div className="flex items-center gap-2 bg-surface-raised px-2.5 py-1.5 rounded-[4px] border border-border-default">
            <Radio size={13} className="text-status-safe shrink-0" />
            <div>
              <span className="text-[9px] font-mono uppercase tracking-wider text-ink-faint block leading-none">
                System
              </span>
              <span className="font-data text-[13px] font-bold text-status-safe">
                {engine.network?.health ?? 98}%
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRIMARY OPERATIONAL AREAS (MAP-FIRST HERO + AI PANELS) ────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 flex-1 items-stretch">
        {/* ── AREA 1: LIVE CROWD MAP (HERO — ~60% WIDTH) ─────────────────── */}
        <div className="xl:col-span-7 flex flex-col min-h-[500px]">
          <CrowdMap
            zones={engine.zones}
            selectedZoneId={engine.selectedZone?.id ?? null}
            onSelect={engine.setSelectedZoneId}
          />
        </div>

        {/* ── RIGHT COLUMN: AI PREDICTION (AREA 3) & AI RESPONSE (AREA 4) ── */}
        <div className="xl:col-span-5 flex flex-col gap-4">
          {/* ── AREA 3: AI PREDICTION ───────────────────────────────────── */}
          <div className="flex flex-col gap-2">
            <PredictionPanel
              zones={engine.zones}
              onSelect={engine.setSelectedZoneId}
            />

            {/* Tactical Operational Decision Matrix */}
            {focusZone && (
              <div className="panel p-3 bg-surface-panel border border-border-default rounded-[6px]">
                <span className="text-[9.5px] font-mono uppercase tracking-widest text-ink-faint block mb-2">
                  Tactical Prediction Intelligence
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div className="bg-surface-raised p-2 rounded-[4px] border border-border-default">
                    <span className="text-[9px] font-mono uppercase text-ink-faint block mb-0.5">
                      Rush Toward
                    </span>
                    <span className="font-bold text-[12px] text-status-critical flex items-center gap-1 truncate">
                      <TrendingUp size={12} className="shrink-0" />
                      {focusZone.name.split('·')[0].trim()}
                    </span>
                  </div>

                  <div className="bg-surface-raised p-2 rounded-[4px] border border-border-default">
                    <span className="text-[9px] font-mono uppercase text-ink-faint block mb-0.5">
                      Divert To
                    </span>
                    <span className="font-bold text-[12px] text-accent flex items-center gap-1 truncate">
                      <ArrowRight size={12} className="shrink-0" />
                      {divertZone ? divertZone.name.split('·')[0].trim() : 'Zone D'}
                    </span>
                  </div>

                  <div className="bg-surface-raised p-2 rounded-[4px] border border-border-default">
                    <span className="text-[9px] font-mono uppercase text-ink-faint block mb-0.5">
                      Risk Window
                    </span>
                    <span className="font-mono font-bold text-[12px] text-status-moderate flex items-center gap-1">
                      <Clock size={12} className="shrink-0" />
                      {riskWindow}
                    </span>
                  </div>

                  <div className="bg-surface-raised p-2 rounded-[4px] border border-border-default">
                    <span className="text-[9px] font-mono uppercase text-ink-faint block mb-0.5">
                      Action Window
                    </span>
                    <span className="font-mono font-bold text-[12px] text-status-safe flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-status-safe animate-pulse shrink-0" />
                      {actionWindow}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── AREA 4: AI RESPONSE PLAN ─────────────────────────────────── */}
          <div className="flex-1 flex flex-col">
            <RecommendationPanel
              recommendations={engine.recommendations}
              onApprove={engine.approveRecommendation}
              onDismiss={engine.dismissRecommendation}
            />
          </div>
        </div>
      </div>

      {/* ── CONDITIONAL: Zone Detail Drawer ───────────────────────────────── */}
      {engine.selectedZone && (
        <ZoneDetailDrawer
          zone={engine.selectedZone}
          onClose={() => engine.setSelectedZoneId(null)}
        />
      )}
    </div>
  )
}
