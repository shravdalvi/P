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
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <p className="text-[10.5px]  font-mono  text-slate-400">
            INCIDENT MANAGEMENT
          </p>
          <div className="flex items-center gap-2.5 mt-1">
            <h1 className="font-display font-bold text-2xl text-slate-900">Operational Alerts Queue</h1>
            <span className="font-mono text-[11px] px-2 py-0.5 rounded-[4px] bg-red-50 text-red-600 border border-red-200">
              {alerts.filter((a) => a.status !== 'resolved').length} Active
            </span>
          </div>
        </div>

        <div className="flex gap-1 p-1 rounded-[6px] bg-white border border-slate-200">
          {filters.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              className={`px-3 py-1 rounded-[4px] text-[11.5px] font-mono transition-colors ${
                activeFilter === filter
                  ? 'bg-teal-600 text-surface-base font-semibold'
                  : 'text-slate-500 hover:text-slate-900'
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
          <CheckCheck size={28} className="text-teal-600 mb-2" />
          <p className="text-sm text-slate-900 font-medium">No alerts matching filter</p>
          <p className="text-[12px] text-slate-400 mt-0.5">All event sectors are operating within normal parameters.</p>
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
                    ? 'border-red-200 bg-white '
                    : 'border-slate-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-[4px] flex items-center justify-center shrink-0 ${style.soft} ${style.border} border`}>
                      <Icon size={17} className={style.text} />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-mono font-bold  px-1.5 py-0.5 rounded-[3px] ${style.soft} ${style.text} border ${style.border}`}>
                          {alert.severity}
                        </span>
                        <span className="font-mono text-[11px] text-slate-400">{alert.id}</span>
                        <span className="text-[11px] text-slate-400 font-mono">· {alert.time}</span>
                      </div>

                      <p className="font-medium text-sm text-slate-900 mt-1.5 leading-snug">
                        {alert.description}
                      </p>
                      <p className="text-[12px] text-teal-600 mt-1">
                        Recommended: {alert.action}
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono mt-1">
                        Affected Sector: <span className="text-slate-500">{alert.zone}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-start">
                    {alert.status === 'new' && (
                      <>
                        <button
                          onClick={() => engine?.acknowledgeAlert(alert.id)}
                          className="px-2.5 py-1 text-[11.5px] font-mono rounded-[4px] border border-slate-200 bg-slate-50 text-slate-500 hover:text-slate-900 hover:border-teal-600 transition-colors"
                        >
                          Acknowledge
                        </button>
                        <button
                          onClick={() => engine?.resolveAlert(alert.id)}
                          className="px-2.5 py-1 text-[11.5px] font-mono rounded-[4px] bg-teal-50 border border-teal-200 text-teal-600 hover:bg-teal-100 transition-colors flex items-center gap-1"
                        >
                          <Check size={12} /> Resolve
                        </button>
                      </>
                    )}

                    {alert.status === 'acknowledged' && (
                      <>
                        <span className="text-[11px] font-mono text-amber-500 px-2 py-0.5 rounded bg-amber-50 border border-amber-200">
                          Acknowledged
                        </span>
                        <button
                          onClick={() => engine?.resolveAlert(alert.id)}
                          className="px-2.5 py-1 text-[11.5px] font-mono rounded-[4px] bg-teal-50 border border-teal-200 text-teal-600 hover:bg-teal-100 transition-colors"
                        >
                          Resolve
                        </button>
                      </>
                    )}

                    {alert.status === 'resolved' && (
                      <span className="text-[11px] font-mono text-slate-400 px-2 py-0.5 rounded bg-slate-50 border border-slate-200">
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
