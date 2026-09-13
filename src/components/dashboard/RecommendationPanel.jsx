import { Sparkles, ArrowRight, Check, Pencil, X } from 'lucide-react'

export default function RecommendationPanel({ recommendations, onApprove, onDismiss }) {
  const pending = recommendations.filter((r) => r.status === 'pending')
  const resolved = recommendations.filter((r) => r.status !== 'pending')

  return (
    <div id="recommendations" className="panel p-4 lg:p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-brand-400" />
          <h2 className="font-display font-semibold text-[15px]">AI Recommendations</h2>
        </div>
        <span className="text-[11px] text-ink-faint">{pending.length} pending</span>
      </div>

      {pending.length === 0 ? (
        <p className="text-[12.5px] text-ink-faint py-6 text-center">
          No action needed. Recommendations appear here automatically when a zone trends toward capacity.
        </p>
      ) : (
        <div className="space-y-4">
          {pending.map((rec) => (
            <div key={rec.id} className="rounded-xl border border-brand-500/25 bg-brand-500/[0.06] p-4">
              <div className="flex items-center justify-between mb-2.5">
                <p className="text-[13px] font-medium text-ink">
                  Problem: <span className="text-status-high">{rec.zone}</span> predicted to exceed capacity
                </p>
                <span className="text-[10.5px] font-data text-ink-faint">{rec.id}</span>
              </div>

              <ol className="space-y-1.5 mb-3">
                {rec.steps.map((s, i) => (
                  <li key={i} className="text-[12.5px] text-ink-dim flex gap-2">
                    <span className="text-brand-400 font-data shrink-0">{i + 1}.</span>
                    {s}
                  </li>
                ))}
              </ol>

              <div className="flex items-center gap-4 mb-3.5 text-[12px]">
                <div className="flex items-center gap-1.5">
                  <span className="text-ink-faint">{rec.zone}</span>
                  <span className="font-data text-status-high">{rec.before}%</span>
                  <ArrowRight size={12} className="text-ink-faint" />
                  <span className="font-data text-status-safe">{rec.projectedAfter}%</span>
                </div>
                {rec.altZone && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-ink-faint">{rec.altZone}</span>
                    <span className="font-data text-status-safe">{rec.altBefore}%</span>
                    <ArrowRight size={12} className="text-ink-faint" />
                    <span className="font-data text-status-moderate">{rec.altAfter}%</span>
                  </div>
                )}
                <span className="ml-auto text-brand-300 font-data">-{rec.reduction}% congestion</span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => onApprove(rec.id)}
                  className="flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-md bg-brand-500 text-base hover:bg-brand-400 transition-colors"
                >
                  <Check size={13} /> Approve plan
                </button>
                <button className="flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-md border border-base-hair text-ink-dim hover:text-ink transition-colors">
                  <Pencil size={13} /> Modify
                </button>
                <button
                  onClick={() => onDismiss(rec.id)}
                  className="flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-md border border-base-hair text-ink-dim hover:text-ink transition-colors ml-auto"
                >
                  <X size={13} /> Dismiss
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {resolved.length > 0 && (
        <div className="mt-4 pt-4 border-t border-base-hair space-y-1.5">
          {resolved.slice(0, 3).map((r) => (
            <div key={r.id} className="flex items-center justify-between text-[11.5px]">
              <span className="text-ink-faint">{r.zone}</span>
              <span className={r.status === 'approved' ? 'text-status-safe' : 'text-ink-faint'}>
                {r.status === 'approved' ? 'Approved & applied' : 'Dismissed'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
