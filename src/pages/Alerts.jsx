import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { AlertTriangle, BellRing, CheckCheck, ShieldAlert, Check } from 'lucide-react'
import { SEVERITY_STYLES } from '../lib/statusStyles.js'

const SEVERITY_ICONS = {
  critical: ShieldAlert,
  high: AlertTriangle,
  medium: BellRing,
  info: CheckCheck
}

export default function AlertsPage() {
  const engine = useOutletContext()
  const [activeFilter, setActiveFilter] = useState('All')

  const alerts = engine?.alerts || []
  const filters = ['All', 'Critical', 'High', 'Medium']

  const visibleAlerts = activeFilter === 'All'
    ? alerts
    : alerts.filter((a) => a.severity.toLowerCase() === activeFilter.toLowerCase())

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto space-y-5">
      {/* ── Header & Filter Bar ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 pb-2 border-b border-border-default">
        <div>
          <p className="text-[10.5px] uppercase font-mono tracking-widest text-ink-faint">
            INCIDENT MANAGEMENT
          </p>
          <div className="flex items-center gap-2.5 mt-1">
            <h1 className="font-display font-bold text-2xl text-ink">Operational Alerts Queue</h1>
            <span className="font-mono text-[11px] px-2 py-0.5 rounded-[4px] bg-status-critical/15 text-status-critical border border-status-critical/30">
              {alerts.filter((a) => a.status !== 'resolved').length} Active
            </span>
          </div>
        </div>

        <div className="flex gap-1 p-1 rounded-[6px] bg-surface-panel border border-border-default">
          {filters.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              className={`px-3 py-1 rounded-[4px] text-[11.5px] font-mono transition-colors ${
                activeFilter === filter
                  ? 'bg-accent text-surface-base font-semibold'
                  : 'text-ink-dim hover:text-ink'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* ── Alerts Feed ─────────────────────────────────────────────────── */}
      {visibleAlerts.length === 0 ? (
        <div className="panel p-10 flex flex-col items-center justify-center text-center">
          <CheckCheck size={28} className="text-status-safe mb-2" />
          <p className="text-sm text-ink font-medium">No alerts matching filter</p>
          <p className="text-[12px] text-ink-faint mt-0.5">All event sectors are operating within normal parameters.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleAlerts.map((alert) => {
            const style = SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.info
            const Icon = SEVERITY_ICONS[alert.severity] || AlertTriangle
            const isResolved = alert.status === 'resolved'

            return (
              <div
                key={alert.id}
                className={`panel p-4 transition-all ${
                  alert.severity === 'critical' && !isResolved
                    ? 'border-status-critical/40 bg-surface-panel shadow-[0_0_12px_rgba(225,89,69,0.06)]'
                    : 'border-border-default'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-[4px] flex items-center justify-center shrink-0 ${style.soft} ${style.border} border`}>
                      <Icon size={17} className={style.text} />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-[3px] ${style.soft} ${style.text} border ${style.border}`}>
                          {alert.severity}
                        </span>
                        <span className="font-mono text-[11px] text-ink-faint">{alert.id}</span>
                        <span className="text-[11px] text-ink-faint font-mono">· {alert.time}</span>
                      </div>

                      <p className="font-medium text-sm text-ink mt-1.5 leading-snug">
                        {alert.description}
                      </p>
                      <p className="text-[12px] text-accent mt-1">
                        Recommended: {alert.action}
                      </p>
                      <p className="text-[11px] text-ink-faint font-mono mt-1">
                        Affected Sector: <span className="text-ink-dim">{alert.zone}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-start">
                    {alert.status === 'new' && (
                      <>
                        <button
                          onClick={() => engine?.acknowledgeAlert(alert.id)}
                          className="px-2.5 py-1 text-[11.5px] font-mono rounded-[4px] border border-border-default bg-surface-raised text-ink-dim hover:text-ink hover:border-accent transition-colors"
                        >
                          Acknowledge
                        </button>
                        <button
                          onClick={() => engine?.resolveAlert(alert.id)}
                          className="px-2.5 py-1 text-[11.5px] font-mono rounded-[4px] bg-status-safe/15 border border-status-safe/30 text-status-safe hover:bg-status-safe/25 transition-colors flex items-center gap-1"
                        >
                          <Check size={12} /> Resolve
                        </button>
                      </>
                    )}

                    {alert.status === 'acknowledged' && (
                      <>
                        <span className="text-[11px] font-mono text-status-moderate px-2 py-0.5 rounded bg-status-moderate/10 border border-status-moderate/30">
                          Acknowledged
                        </span>
                        <button
                          onClick={() => engine?.resolveAlert(alert.id)}
                          className="px-2.5 py-1 text-[11.5px] font-mono rounded-[4px] bg-status-safe/15 border border-status-safe/30 text-status-safe hover:bg-status-safe/25 transition-colors"
                        >
                          Resolve
                        </button>
                      </>
                    )}

                    {alert.status === 'resolved' && (
                      <span className="text-[11px] font-mono text-ink-faint px-2 py-0.5 rounded bg-surface-raised border border-border-muted">
                        Resolved
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
