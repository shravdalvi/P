import { useOutletContext } from 'react-router-dom'
import KPICards from '../components/dashboard/KPICards.jsx'
import CrowdMap from '../components/dashboard/CrowdMap.jsx'
import ZoneDetailDrawer from '../components/dashboard/ZoneDetailDrawer.jsx'
import AlertsPanel from '../components/dashboard/AlertsPanel.jsx'
import PredictionPanel from '../components/dashboard/PredictionPanel.jsx'
import RecommendationPanel from '../components/dashboard/RecommendationPanel.jsx'
import TransportWidget from '../components/dashboard/TransportWidget.jsx'
import ResponseTeamWidget from '../components/dashboard/ResponseTeamWidget.jsx'
import NetworkHealthWidget from '../components/dashboard/NetworkHealthWidget.jsx'
import ActivityLog from '../components/dashboard/ActivityLog.jsx'
import DemoControls from '../components/dashboard/DemoControls.jsx'

export default function Dashboard() {
  const engine = useOutletContext()
  if (!engine) return null

  return (
    <div className="space-y-4 p-4 lg:p-6 max-w-[1600px] mx-auto">
      {/* ── TOP: Simulation Scenario Controls ────────────────────────────── */}
      <DemoControls
        running={engine.running}
        scenario={engine.scenario}
        setRunning={engine.setRunning}
        setDemoScenario={engine.setDemoScenario}
        resetSimulation={engine.resetSimulation}
      />

      {/* ── KPI STRIP ─────────────────────────────────────────────────────── */}
      <KPICards kpis={engine.kpis} />

      {/* ── PRIMARY AREA (~60/40 split) ──────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* Left Column (~60%): Live Spatial Situation & Operational Alerts */}
        <div className="xl:col-span-7 space-y-4 flex flex-col">
          <CrowdMap
            zones={engine.zones}
            selectedZoneId={engine.selectedZone?.id ?? null}
            onSelect={engine.setSelectedZoneId}
          />
          <AlertsPanel
            alerts={engine.alerts}
            onAcknowledge={engine.acknowledgeAlert}
            onResolve={engine.resolveAlert}
          />
        </div>

        {/* Right Column (~40%): Predictive Risk & AI Orchestration Decision Plan */}
        <div className="xl:col-span-5 space-y-4 flex flex-col">
          <PredictionPanel
            zones={engine.zones}
            onSelect={engine.setSelectedZoneId}
          />
          <RecommendationPanel
            recommendations={engine.recommendations}
            onApprove={engine.approveRecommendation}
            onDismiss={engine.dismissRecommendation}
          />
        </div>
      </div>

      {/* ── RESOURCE ROW (3 columns) ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ResponseTeamWidget teams={engine.teams} />
        <TransportWidget routes={engine.transport} />
        <NetworkHealthWidget network={engine.network} />
      </div>

      {/* ── BOTTOM: Operations Audit Log ──────────────────────────────────── */}
      <ActivityLog log={engine.activityLog} />

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
