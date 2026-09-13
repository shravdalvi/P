import { AlertTriangle, Check, CircleCheck } from 'lucide-react'
import { SEVERITY_STYLES } from '../../lib/statusStyles.js'

export default function AlertsPanel({ alerts, onAcknowledge, onResolve }) {
  const visible = alerts.filter((a) => a.status !== 'resolved')

  return (
    <div id="alerts" className="panel p-4 lg:p-5 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display font-semibold text-[15px]">Active Alerts</h2>
        <span className="text-[11px] text-ink-faint">{visible.length} open</span>
      </div>

      {visible.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-10 text-center">
          <CircleCheck size={26} className="text-status-safe mb-2" />
          <p className="text-[13px] text-ink-dim">No open alerts</p>
          <p className="text-[11.5px] text-ink-faint mt-0.5">All zones within configured thresholds</p>
        </div>
      ) : (
        <div className="space-y-2.5 overflow-y-auto max-h-[380px] pr-1 -mr-1">
          {visible.map((a) => {
            const style = SEVERITY_STYLES[a.severity]
            return (
              <div key={a.id} className={`rounded-lg border ${style.border} ${style.soft} p-3`}>
                <div className="flex items-start gap-2.5">
                  <AlertTriangle size={15} className={`${style.text} shrink-0 mt-0.5`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[10.5px] font-semibold uppercase tracking-wide ${style.text}`}>
                        {a.severity}
                      </span>
                      <span className="text-[10.5px] text-ink-faint font-data">{a.time}</span>
                    </div>
                    <p className="text-[13px] text-ink mt-1 leading-snug">{a.description}</p>
                    <p className="text-[11.5px] text-ink-faint mt-1">→ {a.action}</p>

                    {a.status === 'new' && (
                      <div className="flex gap-2 mt-2.5">
                        <button
                          onClick={() => onAcknowledge(a.id)}
                          className="text-[11.5px] px-2.5 py-1 rounded-md border border-base-hair text-ink-dim hover:text-ink hover:bg-base-panel transition-colors"
                        >
                          Acknowledge
                        </button>
                        <button
                          onClick={() => onResolve(a.id)}
                          className="text-[11.5px] px-2.5 py-1 rounded-md bg-brand-500/15 text-brand-300 hover:bg-brand-500/25 transition-colors flex items-center gap-1"
                        >
                          <Check size={12} /> Resolve
                        </button>
                      </div>
                    )}
                    {a.status === 'acknowledged' && (
                      <div className="flex items-center gap-2 mt-2.5">
                        <span className="text-[11px] text-status-info">Acknowledged</span>
                        <button
                          onClick={() => onResolve(a.id)}
                          className="text-[11.5px] px-2.5 py-1 rounded-md bg-brand-500/15 text-brand-300 hover:bg-brand-500/25 transition-colors"
                        >
                          Resolve
                        </button>
                      </div>
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
