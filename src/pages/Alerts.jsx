import { useState } from 'react'
import { AlertTriangle, BellRing, CheckCheck, ShieldAlert } from 'lucide-react'

const data = [
  { id: 1, title: 'Queue spillover detected', zone: 'Zone C', time: '09:14', severity: 'Critical', status: 'Open', icon: ShieldAlert, tone: 'bg-[#FBD9D3] text-[#C54D40]' },
  { id: 2, title: 'Crowd flow imbalance near north gate', zone: 'Zone A', time: '08:48', severity: 'High', status: 'Acknowledged', icon: BellRing, tone: 'bg-[#FBEAC7] text-[#A76F0C]' },
  { id: 3, title: 'Staggered exit pattern recommended', zone: 'Exit Concourse', time: '08:21', severity: 'Medium', status: 'Resolved', icon: CheckCheck, tone: 'bg-[#DFF5EA] text-[#1E6D5B]' },
  { id: 4, title: 'Device heartbeat gap reported', zone: 'Gate 4', time: '07:40', severity: 'High', status: 'Open', icon: AlertTriangle, tone: 'bg-[#FBEAC7] text-[#A76F0C]' }
]

const filters = ['All', 'Critical', 'High', 'Medium']

export default function AlertsPage() {
  const [activeFilter, setActiveFilter] = useState('All')

  const visibleAlerts = activeFilter === 'All'
    ? data
    : data.filter((alert) => alert.severity === activeFilter)

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-ink-faint font-semibold">ALERTS & RESPONSE</p>
          <h1 className="mt-2 font-display text-4xl text-ink">Operational alerts</h1>
        </div>
        <div className="flex gap-2 rounded-full bg-[#F5F7F4] p-1">
          {filters.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              className={`rounded-full px-3 py-1.5 text-[12px] font-medium transition ${activeFilter === filter ? 'bg-white text-[#1E6D5B] shadow-sm' : 'text-ink-dim'}`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {visibleAlerts.map((alert) => {
          const Icon = alert.icon
          return (
            <div key={alert.id} className="panel p-4 lg:p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-4">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${alert.tone}`}>
                    <Icon size={18} />
                  </div>

                  <div>
                    <p className="font-medium text-ink">{alert.title}</p>
                    <p className="mt-1 text-[12px] text-ink-dim">{alert.zone} • {alert.time}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${alert.tone}`}>{alert.severity}</span>
                  <span className="inline-flex rounded-full border border-[#E7E6E1] bg-[#F7F7F5] px-2.5 py-1 text-[11px] font-medium text-ink-dim">{alert.status}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
