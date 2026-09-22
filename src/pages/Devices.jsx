import { useOutletContext } from 'react-router-dom'
import { Activity, Radio, SignalHigh, Wifi, Cpu, Database, Zap, CheckCircle2, XCircle, AlertTriangle, PlayCircle, PauseCircle, RotateCcw } from 'lucide-react'

export default function DevicesPage() {
  const engine = useOutletContext()
  const isConnected = engine?.isBackendSynced ?? false
  const running = engine?.running ?? true
  const scenario = engine?.scenario ?? 'normal'
  const zones = engine?.zones ?? []
  const kpis = engine?.kpis ?? {}
  const alerts = engine?.alerts ?? []
  const lastTick = new Date().toLocaleTimeString()

  const totalCrowd = zones.reduce((s, z) => s + (z.count ?? 0), 0)
  const activeZones = zones.length
  const criticalZones = zones.filter(z => z.status === 'OFF-LIMIT').length
  const totalCapacity = zones.reduce((s, z) => s + (z.capacity ?? 0), 0)
  const globalPressure = totalCapacity > 0 ? Math.round((totalCrowd / totalCapacity) * 100) : 0

  const SCENARIOS = {
    normal: { label: 'Normal Operations', desc: 'Balanced crowd distribution across all zones' },
    surge: { label: 'Crowd Surge', desc: 'Stage area experiencing rapid occupancy increase' },
    gate: { label: 'Gate Congestion', desc: 'Entry gate pressure building — increased inflow' },
    release: { label: 'Stage Release', desc: 'Dispersal wave from main stage pit' },
    exit: { label: 'Exit Pressure', desc: 'Outflow concentration toward exit concourse' }
  }

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto space-y-6 bg-surface-base min-h-full">
      <div className="pb-2 border-b border-border-default">
        <h1 className="text-2xl font-display font-bold text-ink">Systems</h1>
        <p className="text-sm text-ink-dim mt-1">Runtime state, data pipeline, and simulation controls</p>
      </div>

      {/* System Status Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={`bg-surface-panel rounded-md border p-4 ${isConnected ? 'border-status-safe/40' : 'border-status-moderate/40'}`}>
          <div className="flex items-center gap-2 mb-2">
            <Wifi size={16} className={isConnected ? 'text-status-safe' : 'text-status-moderate'} />
            <span className="text-[10px] font-mono uppercase tracking-wider text-ink-faint">Backend</span>
          </div>
          <div className={`text-sm font-bold ${isConnected ? 'text-status-safe' : 'text-status-moderate'}`}>
            {isConnected ? 'CONNECTED' : 'LOCAL ONLY'}
          </div>
          <div className="text-[11px] text-ink-faint mt-1">
            {isConnected ? 'WebSocket active' : 'Simulator only mode'}
          </div>
        </div>

        <div className={`bg-surface-panel rounded-md border p-4 ${running ? 'border-accent/40' : 'border-border-default'}`}>
          <div className="flex items-center gap-2 mb-2">
            <Cpu size={16} className={running ? 'text-accent' : 'text-ink-dim'} />
            <span className="text-[10px] font-mono uppercase tracking-wider text-ink-faint">Simulator</span>
          </div>
          <div className={`text-sm font-bold ${running ? 'text-accent' : 'text-ink-dim'}`}>
            {running ? 'RUNNING' : 'PAUSED'}
          </div>
          <div className="text-[11px] text-ink-faint mt-1">Tick interval: 3s</div>
        </div>

        <div className="bg-surface-panel rounded-md border border-border-default p-4">
          <div className="flex items-center gap-2 mb-2">
            <Database size={16} className="text-ink-dim" />
            <span className="text-[10px] font-mono uppercase tracking-wider text-ink-faint">Zones</span>
          </div>
          <div className="text-sm font-bold text-ink">{activeZones} Active</div>
          <div className="text-[11px] text-ink-faint mt-1">{criticalZones} OFF-LIMIT</div>
        </div>

        <div className="bg-surface-panel rounded-md border border-border-default p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={16} className={globalPressure > 80 ? 'text-status-critical' : 'text-status-safe'} />
            <span className="text-[10px] font-mono uppercase tracking-wider text-ink-faint">Global Pressure</span>
          </div>
          <div className={`text-sm font-bold ${globalPressure > 80 ? 'text-status-critical' : globalPressure > 65 ? 'text-status-moderate' : 'text-status-safe'}`}>
            {globalPressure}%
          </div>
          <div className="text-[11px] text-ink-faint mt-1">{totalCrowd.toLocaleString()} / {totalCapacity.toLocaleString()}</div>
        </div>
      </div>

      {/* Simulation Controls */}
      <div className="bg-surface-panel border border-border-default rounded-md p-5">
        <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
          <Cpu size={16} className="text-accent" /> Simulation Controls
        </h3>

        <div className="flex flex-wrap gap-3 mb-5">
          <button
            onClick={() => engine?.setRunning(!running)}
            className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-semibold border transition-colors ${
              running
                ? 'bg-status-moderate/10 border-status-moderate/40 text-status-moderate hover:bg-status-moderate/20'
                : 'bg-status-safe/10 border-status-safe/40 text-status-safe hover:bg-status-safe/20'
            }`}
          >
            {running ? <PauseCircle size={16} /> : <PlayCircle size={16} />}
            {running ? 'Pause Simulation' : 'Resume Simulation'}
          </button>
          <button
            onClick={() => engine?.resetSimulation?.()}
            className="flex items-center gap-2 px-4 py-2 rounded text-sm font-semibold border border-border-default text-ink-dim hover:text-ink hover:border-border-muted transition-colors"
          >
            <RotateCcw size={16} /> Reset Event
          </button>
        </div>

        <div>
          <p className="text-[11px] font-mono uppercase tracking-wider text-ink-faint mb-3">Demo Scenario</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
            {Object.entries(SCENARIOS).map(([key, s]) => (
              <button
                key={key}
                onClick={() => engine?.setScenario?.(key)}
                className={`flex flex-col text-left p-3 rounded border text-xs transition-colors ${
                  scenario === key
                    ? 'bg-accent/10 border-accent text-accent'
                    : 'bg-surface-raised border-border-default text-ink-dim hover:text-ink hover:border-border-muted'
                }`}
              >
                <span className="font-bold uppercase tracking-wide">{s.label}</span>
                <span className="text-[10px] mt-1 opacity-70 leading-snug">{s.desc}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Zone State Table */}
      <div className="bg-surface-panel border border-border-default rounded-md overflow-hidden">
        <div className="px-5 py-3 border-b border-border-default">
          <h3 className="font-semibold text-sm">Live Zone Telemetry Snapshot</h3>
          <p className="text-[11px] text-ink-faint mt-0.5">All values from the single canonical simulator state</p>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-raised border-b border-border-default text-ink-dim text-[11px] font-mono uppercase tracking-wider">
            <tr>
              <th className="px-4 py-2.5">Zone</th>
              <th className="px-4 py-2.5 text-right">Count</th>
              <th className="px-4 py-2.5 text-right">Capacity</th>
              <th className="px-4 py-2.5 text-right">Pressure</th>
              <th className="px-4 py-2.5 text-right">In/m</th>
              <th className="px-4 py-2.5 text-right">Out/m</th>
              <th className="px-4 py-2.5 text-right">Risk</th>
            </tr>
          </thead>
          <tbody>
            {zones.map(z => {
              const ratio = z.ratio ?? z.occupancyPercentage ?? 0
              return (
                <tr key={z.id} className="border-b border-border-muted/30 hover:bg-surface-raised/50 transition-colors">
                  <td className="px-4 py-2.5 font-medium text-ink">{z.name}</td>
                  <td className="px-4 py-2.5 font-data text-right">{(z.count ?? 0).toLocaleString()}</td>
                  <td className="px-4 py-2.5 font-data text-right text-ink-dim">{(z.capacity ?? 0).toLocaleString()}</td>
                  <td className="px-4 py-2.5 font-data text-right">
                    <span className={ratio > 0.85 ? 'text-status-critical font-bold' : ratio > 0.7 ? 'text-status-moderate' : 'text-status-safe'}>
                      {Math.round(ratio * 100)}%
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-data text-right text-status-safe">{z.incoming ?? 0}</td>
                  <td className="px-4 py-2.5 font-data text-right text-ink-dim">{z.outgoing ?? 0}</td>
                  <td className="px-4 py-2.5 text-right">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      z.status === 'OFF-LIMIT' ? 'bg-status-critical/10 text-status-critical border border-status-critical/30' :
                      z.risk === 'high' ? 'bg-status-high/10 text-status-high border border-status-high/30' :
                      'bg-status-safe/10 text-status-safe border border-status-safe/30'
                    }`}>
                      {z.status === 'OFF-LIMIT' ? 'OFF-LIMIT' : z.risk}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Data Pipeline Status */}
      <div className="bg-surface-panel border border-border-default rounded-md p-5">
        <h3 className="font-semibold text-sm mb-4">Data Pipeline</h3>
        <div className="space-y-3">
          {[
            { label: 'Crowd Simulator', status: running ? 'active' : 'paused', detail: running ? `Tick every 3s · ${scenario} scenario` : 'Paused by operator' },
            { label: 'Zone Telemetry Engine', status: 'active', detail: `${zones.length} zones · ${zones.reduce((s, z) => s + (z.count ?? 0), 0).toLocaleString()} aggregate occupancy` },
            { label: 'AI Intelligence Engine', status: 'active', detail: 'Prediction + Recommendation computed per tick' },
            { label: 'Backend WebSocket', status: isConnected ? 'active' : 'degraded', detail: isConnected ? 'Connected · zone.updated events streaming' : 'Not connected — running on local simulator' },
            { label: 'Alert Pipeline', status: alerts.length > 0 ? 'active' : 'idle', detail: `${alerts.filter(a => a.status !== 'resolved').length} active alerts · ${alerts.filter(a => a.status === 'resolved').length} resolved` },
          ].map(item => (
            <div key={item.label} className="flex items-start gap-3">
              {item.status === 'active' ? (
                <CheckCircle2 size={16} className="text-status-safe mt-0.5 shrink-0" />
              ) : item.status === 'paused' ? (
                <AlertTriangle size={16} className="text-status-moderate mt-0.5 shrink-0" />
              ) : item.status === 'degraded' ? (
                <XCircle size={16} className="text-status-moderate mt-0.5 shrink-0" />
              ) : (
                <CheckCircle2 size={16} className="text-ink-faint mt-0.5 shrink-0" />
              )}
              <div className="flex-1">
                <div className="text-sm font-semibold text-ink">{item.label}</div>
                <div className="text-[11px] text-ink-faint">{item.detail}</div>
              </div>
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                item.status === 'active' ? 'text-status-safe border-status-safe/30 bg-status-safe/10' :
                item.status === 'paused' ? 'text-status-moderate border-status-moderate/30 bg-status-moderate/10' :
                item.status === 'degraded' ? 'text-status-moderate border-status-moderate/30 bg-status-moderate/10' :
                'text-ink-faint border-border-default bg-surface-raised'
              }`}>
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
