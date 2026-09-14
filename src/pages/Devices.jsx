import { useOutletContext } from 'react-router-dom'
import { Activity, Radio, SignalHigh, Wifi } from 'lucide-react'

const ALL_GATEWAYS = [
  { name: 'GW-01', location: 'North Stand District', ip: '10.24.1.11' },
  { name: 'GW-09', location: 'East Concourse Ribbon', ip: '10.24.1.19' },
  { name: 'GW-14', location: 'Main Stage Front Corridor', ip: '10.24.1.24' },
  { name: 'GW-19', location: 'West Concourse Sector D', ip: '10.24.1.29' },
  { name: 'GW-22', location: 'Plaza South Hub', ip: '10.24.1.32' },
  { name: 'GW-27', location: 'Main Stage Pit Front', ip: '10.24.1.37' },
  { name: 'GW-33', location: 'South Stand Primary', ip: '10.24.1.43' },
  { name: 'GW-38', location: 'Food Court & Concessions', ip: '10.24.1.48' },
  { name: 'GW-41', location: 'Exit Concourse Terminal', ip: '10.24.1.51' }
]

export default function DevicesPage() {
  const engine = useOutletContext()
  const network = engine?.network || {
    bandsActive: 18420,
    gatewaysTotal: 45,
    gatewaysOffline: ['GW-19', 'GW-33'],
    latency: '1.1',
    health: 96
  }

  const gatewaysOnline = network.gatewaysTotal - network.gatewaysOffline.length

  const stats = [
    { label: 'Active Wristbands', value: network.bandsActive.toLocaleString(), icon: Activity, tone: 'text-accent' },
    { label: 'Gateways Online', value: `${gatewaysOnline} / ${network.gatewaysTotal}`, icon: Wifi, tone: network.gatewaysOffline.length > 0 ? 'text-status-moderate' : 'text-status-safe' },
    { label: 'Network Health', value: `${network.health}%`, icon: SignalHigh, tone: network.health < 85 ? 'text-status-moderate' : 'text-status-safe' },
    { label: 'Ingestion Latency', value: `${network.latency}s`, icon: Radio, tone: Number(network.latency) > 2 ? 'text-status-high' : 'text-status-safe' }
  ]

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto space-y-5">
      <div className="pb-2 border-b border-border-default">
        <p className="text-[10.5px] uppercase font-mono tracking-widest text-ink-faint">
          INFRASTRUCTURE & SENSOR MESH
        </p>
        <div className="flex items-center gap-3 mt-1">
          <h1 className="font-display font-bold text-2xl text-ink">IoT Telemetry & Gateways</h1>
          <span className="font-mono text-[11px] px-2 py-0.5 rounded-[4px] bg-status-safe/10 border border-status-safe/30 text-status-safe">
            915 MHz Mesh Active
          </span>
        </div>
      </div>

      {/* ── KPI Metric Cards ────────────────────────────────────────────── */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="panel p-4">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-[4px] bg-surface-raised border border-border-default flex items-center justify-center text-ink-dim">
                <Icon size={16} />
              </div>
              <span className="font-mono text-[10px] text-ink-faint uppercase">Telemetry</span>
            </div>
            <p className={`mt-3 font-data text-2xl font-bold ${tone}`}>{value}</p>
            <p className="mt-1 text-[12px] text-ink-faint">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Gateways Mesh Status Table ───────────────────────────────────── */}
      <div className="panel p-4 lg:p-5">
        <div className="flex items-center justify-between mb-3.5">
          <div>
            <h2 className="font-display font-semibold text-[14px] uppercase tracking-wider text-ink">
              Gateway Nodes Roster
            </h2>
            <p className="text-[11.5px] text-ink-faint font-mono mt-0.5">
              Sub-GHz LoRa / BLE Mesh Relays
            </p>
          </div>
          {network.gatewaysOffline.length > 0 && (
            <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-status-critical/15 text-status-critical border border-status-critical/30">
              {network.gatewaysOffline.length} Node(s) Offline
            </span>
          )}
        </div>

        <div className="overflow-x-auto rounded-[4px] border border-border-default">
          <table className="min-w-full text-left text-xs font-mono">
            <thead className="bg-surface-raised text-ink-dim border-b border-border-default uppercase tracking-wider text-[10.5px]">
              <tr>
                <th className="px-3.5 py-2.5">Node ID</th>
                <th className="px-3.5 py-2.5">Physical Location</th>
                <th className="px-3.5 py-2.5">Gateway IP</th>
                <th className="px-3.5 py-2.5">Mesh Status</th>
                <th className="px-3.5 py-2.5">Health State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-muted">
              {ALL_GATEWAYS.map((gw) => {
                const isOffline = network.gatewaysOffline.includes(gw.name)
                return (
                  <tr key={gw.name} className="hover:bg-surface-raised/40 transition-colors">
                    <td className="px-3.5 py-2.5 text-ink font-semibold">{gw.name}</td>
                    <td className="px-3.5 py-2.5 text-ink-dim font-sans">{gw.location}</td>
                    <td className="px-3.5 py-2.5 text-ink-faint">{gw.ip}</td>
                    <td className="px-3.5 py-2.5">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[3px] text-[10.5px] ${
                        isOffline
                          ? 'bg-status-critical/15 text-status-critical border border-status-critical/30'
                          : 'bg-status-safe/15 text-status-safe border border-status-safe/30'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isOffline ? 'bg-status-critical' : 'bg-status-safe'}`} />
                        {isOffline ? 'OFFLINE' : 'ONLINE'}
                      </span>
                    </td>
                    <td className={`px-3.5 py-2.5 ${isOffline ? 'text-status-critical font-semibold' : 'text-status-safe'}`}>
                      {isOffline ? 'CRITICAL - NO HEARTBEAT' : 'OPTIMAL'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
