import { useOutletContext } from 'react-router-dom'
import KPICards from '../components/dashboard/KPICards.jsx'
import CrowdMap from '../components/dashboard/CrowdMap.jsx'
import ZoneDetailDrawer from '../components/dashboard/ZoneDetailDrawer.jsx'
import AlertsPanel from '../components/dashboard/AlertsPanel.jsx'
import PredictionPanel from '../components/dashboard/PredictionPanel.jsx'
import RecommendationPanel from '../components/dashboard/RecommendationPanel.jsx'
import TransportWidget from '../components/dashboard/TransportWidget.jsx'
import HospitalityWidget from '../components/dashboard/HospitalityWidget.jsx'
import ResponseTeamWidget from '../components/dashboard/ResponseTeamWidget.jsx'
import NetworkHealthWidget from '../components/dashboard/NetworkHealthWidget.jsx'
import ActivityLog from '../components/dashboard/ActivityLog.jsx'
import DemoControls from '../components/dashboard/DemoControls.jsx'

export default function Dashboard() {
  const engine = useOutletContext()

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-[1600px] mx-auto">
      <DemoControls
        running={engine.running}
        scenario={engine.scenario}
        setRunning={engine.setRunning}
        setDemoScenario={engine.setDemoScenario}
        resetSimulation={engine.resetSimulation}
      />

      <KPICards kpis={engine.kpis} />

      <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_1fr] gap-4">
        <CrowdMap zones={engine.zones} selectedZoneId={engine.selectedZone?.id} onSelect={engine.setSelectedZoneId} />
        <AlertsPanel alerts={engine.alerts} onAcknowledge={engine.acknowledgeAlert} onResolve={engine.resolveAlert} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <PredictionPanel zones={engine.zones} onSelect={engine.setSelectedZoneId} />
        <RecommendationPanel
          recommendations={engine.recommendations}
          onApprove={engine.approveRecommendation}
          onDismiss={engine.dismissRecommendation}
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <TransportWidget routes={engine.transport} />
        <HospitalityWidget hospitality={engine.hospitality} />
        <ResponseTeamWidget teams={engine.teams} />
        <NetworkHealthWidget network={engine.network} />
      </div>

      <ActivityLog log={engine.activityLog} />

      <ZoneDetailDrawer zone={engine.selectedZone} onClose={() => engine.setSelectedZoneId(null)} />
    </div>
  )
}
