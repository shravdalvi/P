import { useState } from 'react'
import { CheckCircle2, RefreshCw, ArrowRight, X, AlertTriangle, Activity } from 'lucide-react'

export default function ActionHistory({ history = [], zones = [] }) {
  const [selectedAction, setSelectedAction] = useState(null)

  const getZoneName = (id) => zones.find(z => z.id === id)?.name.split('·')[0].trim() || id

  return (
    <>
      <div className="flex flex-col bg-surface-panel rounded-[6px] border border-border-default shadow-sm p-4 w-full">
        <h3 className="text-[11px] font-mono uppercase tracking-widest text-ink-dim mb-4">
          Recent Approved Actions
        </h3>

        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-ink-faint">
            <span className="text-xs">No recent actions taken.</span>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {history.map(entry => (
              <div
                key={entry.id}
                onClick={() => setSelectedAction(entry)}
                className="flex items-start gap-3 p-3 rounded bg-surface-base border border-border-muted/50 cursor-pointer hover:border-border-muted hover:bg-surface-raised transition-colors"
              >
                <div className="mt-0.5">
                  {entry.status === 'RESOLVED' ? (
                    <CheckCircle2 size={16} className="text-status-safe" />
                  ) : (
                    <RefreshCw size={16} className="text-status-resolved animate-spin-slow" />
                  )}
                </div>
                <div className="flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono text-ink-dim">{entry.timestamp}</span>
                    <span className={`text-[10px] font-bold uppercase ${entry.status === 'RESOLVED' ? 'text-status-safe' : 'text-status-resolved'}`}>
                      {entry.status}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-ink">
                    Redirect {getZoneName(entry.sourceZoneId)} <ArrowRight size={12} className="inline mx-1 text-ink-dim" /> {getZoneName(entry.targetZoneId)}
                  </span>
                  <span className="text-[10px] text-ink-faint mt-1 click-affordance">Click for details</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-surface-panel w-full max-w-2xl rounded-lg border border-border-default shadow-lg flex flex-col overflow-hidden max-h-[90vh]">

            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border-default bg-surface-raised">
              <div>
                <h2 className="text-sm font-bold text-ink uppercase tracking-wider flex items-center gap-2">
                  <Activity size={16} className="text-accent" />
                  ACTION DETAILS
                </h2>
                <div className="text-xs text-ink-dim mt-1">
                  Redirect {getZoneName(selectedAction.sourceZoneId)} to {getZoneName(selectedAction.targetZoneId)}
                </div>
              </div>
              <button onClick={() => setSelectedAction(null)} className="p-2 text-ink-dim hover:text-ink hover:bg-surface-base rounded">
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 overflow-y-auto flex-1 space-y-6">

              {/* Meta */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-[10px] font-mono uppercase text-ink-faint mb-1">Action ID</div>
                  <div className="text-xs font-mono font-medium">{selectedAction.id}</div>
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase text-ink-faint mb-1">Approved</div>
                  <div className="text-xs font-medium">{selectedAction.timestamp}</div>
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase text-ink-faint mb-1">Approved By</div>
                  <div className="text-xs font-medium">{selectedAction.approvedBy || 'Event Admin'}</div>
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase text-ink-faint mb-1">Current Status</div>
                  <div className={`text-xs font-bold uppercase ${selectedAction.status === 'RESOLVED' ? 'text-status-safe' : 'text-status-resolved'}`}>
                    {selectedAction.status}
                  </div>
                </div>
              </div>

              {/* Lifecycle */}
              {selectedAction.lifecycle && (
                <div>
                  <div className="text-[10px] font-mono uppercase text-ink-faint mb-2">Lifecycle</div>
                  <div className="flex items-center gap-2 text-xs">
                    {selectedAction.lifecycle.map((step, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        {idx > 0 && <ArrowRight size={12} className="text-border-muted" />}
                        <span className={`px-2 py-1 rounded border ${step.status === selectedAction.status ? 'bg-surface-raised border-border-default font-semibold' : 'bg-transparent border-transparent text-ink-dim'}`}>
                          {step.status} <span className="text-[9px] ml-1 opacity-60">{step.timestamp}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Snapshot Comparison */}
              {selectedAction.source && selectedAction.target && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Source Snapshot */}
                  <div className="border border-border-default rounded bg-surface-raised p-4">
                    <div className="text-xs font-bold mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-status-critical"></span>
                      SOURCE: {selectedAction.source.zoneName}
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-ink-dim">Occupancy</span>
                        <span className="font-mono font-medium">{selectedAction.source.occupancy} / {selectedAction.source.capacity}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-ink-dim">Pressure</span>
                        <span className="font-mono font-medium text-status-critical">{Math.round((selectedAction.source.occupancyPercentage || 0)*100)}%</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-ink-dim">Net Flow</span>
                        <span className="font-mono font-medium">{selectedAction.source.netFlow > 0 ? '+' : ''}{selectedAction.source.netFlow}/min</span>
                      </div>
                    </div>
                  </div>

                  {/* Target Snapshot */}
                  <div className="border border-border-default rounded bg-surface-raised p-4">
                    <div className="text-xs font-bold mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-status-safe"></span>
                      TARGET: {selectedAction.target.zoneName}
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-ink-dim">Occupancy</span>
                        <span className="font-mono font-medium">{selectedAction.target.occupancy} / {selectedAction.target.capacity}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-ink-dim">Pressure</span>
                        <span className="font-mono font-medium text-status-safe">{Math.round((selectedAction.target.occupancyPercentage || 0)*100)}%</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-ink-dim">Net Flow</span>
                        <span className="font-mono font-medium">{selectedAction.target.netFlow > 0 ? '+' : ''}{selectedAction.target.netFlow}/min</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Rationale & Outcome */}
              <div className="space-y-4">
                {selectedAction.rationale && (
                  <div className="bg-surface-raised rounded p-4 border border-border-default">
                    <div className="text-[10px] font-mono uppercase text-ink-dim mb-2">Rationale</div>
                    <ul className="list-disc pl-4 space-y-1 text-xs text-ink">
                      {selectedAction.rationale.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedAction.outcome && (
                  <div className="bg-status-safe/10 rounded p-4 border border-status-safe/30">
                    <div className="text-[10px] font-mono uppercase text-status-safe font-bold mb-2 flex items-center gap-2">
                      <CheckCircle2 size={12} />
                      Outcome
                    </div>
                    <div className="text-xs text-ink font-medium">
                      {selectedAction.outcome.resolutionSummary}
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border-default bg-surface-raised flex justify-end">
              <button onClick={() => setSelectedAction(null)} className="px-4 py-2 bg-surface-panel border border-border-default rounded text-xs font-bold uppercase text-ink-dim hover:text-ink hover:border-border-muted transition-colors">
                Close
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  )
}
