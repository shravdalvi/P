import { Activity, BatteryCharging, SignalHigh, Wifi } from 'lucide-react'

const stats = [
  { label: 'Active Wristbands', value: '18,420', icon: Activity },
  { label: 'Gateways Online', value: '41 / 45', icon: Wifi },
  { label: 'Avg Battery', value: '82%', icon: BatteryCharging },
  { label: 'Network Health', value: '96%', icon: SignalHigh }
]

const gateways = [
  { name: 'GW-01', status: 'Online', health: 'Good' },
  { name: 'GW-09', status: 'Online', health: 'Good' },
  { name: 'GW-19', status: 'Offline', health: 'Critical' },
  { name: 'GW-33', status: 'Offline', health: 'Critical' },
  { name: 'GW-41', status: 'Online', health: 'Stable' }
]

export default function DevicesPage() {
  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <p className="text-[11px] uppercase tracking-[0.18em] text-ink-faint font-semibold">DEVICES & NETWORK</p>
        <h1 className="mt-2 font-display text-4xl text-ink">Infrastructure overview</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="panel p-4 lg:p-5">
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EAF7F3] text-[#1E6D5B]">
                <Icon size={18} />
              </div>
              <span className="text-[10px] uppercase tracking-[0.12em] text-ink-faint">Live</span>
            </div>
            <p className="mt-5 font-data text-3xl font-semibold text-ink">{value}</p>
            <p className="mt-2 text-sm text-ink">{label}</p>
          </div>
        ))}
      </div>

      <div className="panel p-4 lg:p-5">
        <div className="overflow-hidden rounded-2xl border border-[#EEF1EE]">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#F7F7F5] text-ink-dim">
              <tr>
                <th className="px-4 py-3 font-medium">Gateway</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Health</th>
              </tr>
            </thead>
            <tbody>
              {gateways.map((gateway) => (
                <tr key={gateway.name} className="border-t border-[#EEF1EE]">
                  <td className="px-4 py-3 text-ink font-medium">{gateway.name}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[11px] font-medium ${gateway.status === 'Online' ? 'bg-[#EAF7F3] text-[#1E6D5B]' : 'bg-[#FDE9E7] text-[#C54D40]'}`}>
                      <span className={`h-2 w-2 rounded-full ${gateway.status === 'Online' ? 'bg-[#22A66F]' : 'bg-[#E15945]'}`} />
                      {gateway.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink-dim">{gateway.health}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
