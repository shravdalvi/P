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
import { AlertTriangle, ArrowRight, Gauge, MapPinned, ShieldCheck, Users, Wifi } from 'lucide-react'

const stats = [
  { label: 'Total Crowd', value: '18.4k', hint: '+1.2k in 30m', icon: Users },
  { label: 'Active Alerts', value: '12', hint: '4 critical', icon: AlertTriangle },
  { label: 'Zones at Risk', value: '3', hint: '2 rising fast', icon: Gauge },
  { label: 'Devices Online', value: '94%', hint: '41 / 44 active', icon: Wifi }
]

const alerts = [
  { zone: 'Zone C', detail: 'Capacity threshold exceeded at gate entry', time: '2 min ago', severity: 'Critical' },
  { zone: 'Zone A', detail: 'Crowd flow slowing near north concourse', time: '8 min ago', severity: 'High' },
  { zone: 'Food Court', detail: 'Queue length above steady-state forecast', time: '14 min ago', severity: 'Medium' }
]

export default function Dashboard() {
  const engine = useOutletContext()

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-ink-faint font-semibold">LIVE STATUS</p>
          <h1 className="mt-3 font-display text-4xl leading-tight text-ink">Good morning, Test</h1>
          <p className="mt-2 text-sm text-ink-dim">Sunday, 22 Sep 2026 • 12 zones monitored, 4 response teams active</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#EAF7F3] px-3 py-1.5 text-[12px] font-medium text-[#1E6D5B]">
            <span className="inline-block w-2 h-2 rounded-full bg-[#22A66F]" />
            System Online
          </span>
          <span className="rounded-full bg-[#F3F6F4] px-3 py-1.5 text-[12px] text-ink-dim">12 zones monitored</span>
        </div>
      </div>

      <div className="panel bg-[#0E3D34] text-white p-6 lg:p-7 overflow-hidden relative">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-xl">
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/70">AI-POWERED ANALYSIS</p>
            <h2 className="mt-3 font-display text-3xl leading-tight">Overall risk level is elevated in the main event bowl.</h2>
            <p className="mt-3 text-sm text-white/75">Crowd density is trending above the predicted threshold near Zone C and Gate 1. Recommended action is to redistribute foot traffic toward Zone B and the west concourse.</p>
          </div>

          <button className="inline-flex items-center gap-2 self-start rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-[#0E3D34] hover:bg-[#EAF7F3] transition-colors">
            View Live Map <ArrowRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, hint, icon: Icon }) => (
          <div key={label} className="panel p-4 lg:p-5">
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EAF7F3] text-[#1E6D5B]">
                <Icon size={18} />
              </div>
              <span className="text-[11px] uppercase tracking-[0.12em] text-ink-faint">Live</span>
            </div>
            <div className="mt-5">
              <p className="font-data text-3xl font-semibold text-ink leading-none">{value}</p>
              <p className="mt-2 text-sm font-medium text-ink">{label}</p>
              <p className="mt-1 text-[12px] text-ink-dim">{hint}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="panel p-5 lg:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-ink-faint font-semibold">Recent Alerts</p>
              <h3 className="mt-1 font-display text-2xl text-ink">Response queue</h3>
            </div>
            <button className="text-sm font-medium text-[#1E6D5B]">View all</button>
          </div>

          <div className="space-y-3">
            {alerts.map((alert) => (
              <div key={alert.zone} className="flex items-start justify-between gap-4 rounded-2xl border border-[#EEF1EE] bg-[#F9FAF8] p-3">
                <div className="flex gap-3">
                  <div className={`mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl text-white ${alert.severity === 'Critical' ? 'bg-[#E15945]' : alert.severity === 'High' ? 'bg-[#F0864B]' : 'bg-[#E4A93B]'}`}>
                    <ShieldCheck size={16} />
                  </div>
                  <div>
                    <p className="font-medium text-ink">{alert.detail}</p>
                    <p className="mt-1 text-[12px] text-ink-dim">{alert.zone} • {alert.time}</p>
                  </div>
                </div>
                <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${alert.severity === 'Critical' ? 'bg-[#FDE9E7] text-[#C54D40]' : alert.severity === 'High' ? 'bg-[#FFF2E7] text-[#C76E3B]' : 'bg-[#FBF3DD] text-[#A8892F]'}`}>
                  {alert.severity}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel bg-[#0E3D34] text-white p-5 lg:p-6">
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/70">Urgent Zone</p>
            <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-white/80">High Risk</span>
          </div>

          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-display text-3xl">Zone C</p>
                <p className="text-sm text-white/70">Main Stage Front</p>
              </div>
              <MapPinned className="text-white/80" size={22} />
            </div>

            <div className="rounded-2xl bg-white/5 p-4">
              <div className="flex items-center justify-between text-sm text-white/80">
                <span>Current occupancy</span>
                <span className="font-data text-lg text-white">94%</span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full w-[94%] rounded-full bg-[#7BCFB6]" />
              </div>
              <p className="mt-3 text-sm text-white/75">Forecasted capacity in ~3 minutes • redirect to Zone B</p>
            </div>

            <button className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-[#0E3D34]">
              View Zone Details <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
