import { useState, useEffect } from 'react'
import { Sparkles, ArrowRight, Check, Pencil, X, Save, ChevronRight } from 'lucide-react'

export default function RecommendationPanel({ recommendations, onApprove, onDismiss, onUpdate }) {
  const pending = recommendations.filter((r) => r.status === 'pending')
  const resolved = recommendations.filter((r) => r.status !== 'pending')

  const [selectedId, setSelectedId] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editSteps, setEditSteps] = useState([])

  useEffect(() => {
    if (pending.length > 0 && (!selectedId || !pending.find(r => r.id === selectedId))) {
      setSelectedId(pending[0].id)
      setIsEditing(false)
    } else if (pending.length === 0) {
      setSelectedId(null)
      setIsEditing(false)
    }
  }, [pending, selectedId])

  const activeRec = pending.find(r => r.id === selectedId)

  const handleModifyClick = () => {
    if (!activeRec) return
    setEditSteps([...activeRec.steps])
    setIsEditing(true)
  }

  const handleStepChange = (index, val) => {
    const newSteps = [...editSteps]
    newSteps[index] = val
    setEditSteps(newSteps)
  }

  const handleSave = () => {
    if (onUpdate && activeRec) {
      onUpdate(activeRec.id, editSteps)
    }
    setIsEditing(false)
  }

  return (
    <div id="recommendations" className="panel p-4 lg:p-5 flex flex-col h-full bg-surface-panel border border-border-default rounded-[6px]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-accent" />
          <h2 className="font-display font-semibold text-[15px] uppercase tracking-wider text-ink">AI Recommendations</h2>
        </div>
        <span className="text-[11px] font-mono text-ink-faint bg-surface-raised px-2 py-0.5 rounded-[4px] border border-border-default">
          {pending.length} pending
        </span>
      </div>

      {pending.length > 1 && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
          {pending.map(r => (
            <button
              key={r.id}
              onClick={() => { setSelectedId(r.id); setIsEditing(false) }}
              className={`px-3 py-1.5 rounded-[4px] text-[11px] font-mono whitespace-nowrap transition-colors border ${
                selectedId === r.id
                  ? 'bg-accent/15 border-accent text-accent font-semibold'
                  : 'bg-surface-raised border-border-default text-ink-dim hover:text-ink hover:border-border-muted'
              }`}
            >
              {r.zone.split('·')[0].trim()}
            </button>
          ))}
        </div>
      )}

      {pending.length === 0 || !activeRec ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-ink-faint">
          <Sparkles size={24} className="text-border-default mb-2" />
          <p className="text-[13px] text-ink-dim">No pending recommendations</p>
          <p className="text-[11.5px] mt-1">Recommendations will appear automatically when zones trend toward capacity.</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="rounded-[6px] border border-accent/30 bg-accent/5 p-4 flex-1 flex flex-col overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[13px] font-medium text-ink">
                Problem: <span className="text-status-high">{activeRec.zone}</span> predicted to exceed capacity
              </p>
              <span className="text-[10.5px] font-mono text-ink-faint">{activeRec.id}</span>
            </div>

            <div className="flex-1 mb-4">
              {isEditing ? (
                <div className="space-y-2">
                  {editSteps.map((s, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <span className="text-accent font-mono text-[11px] shrink-0 mt-2">{i + 1}.</span>
                      <textarea
                        value={s}
                        onChange={(e) => handleStepChange(i, e.target.value)}
                        className="w-full bg-surface-raised border border-border-default rounded-[4px] p-2 text-[12.5px] text-ink focus:outline-none focus:border-accent resize-y min-h-[60px]"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <ol className="space-y-2">
                  {activeRec.steps.map((s, i) => (
                    <li key={i} className="text-[12.5px] text-ink-dim flex gap-2">
                      <span className="text-accent font-mono shrink-0">{i + 1}.</span>
                      <span className="leading-relaxed">{s}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 mb-4 text-[12px] bg-surface-raised p-3 rounded-[4px] border border-border-default">
              <div className="flex items-center gap-1.5">
                <span className="text-ink-faint">{activeRec.zone.split('·')[0].trim()}</span>
                <span className="font-mono font-bold text-status-high">{activeRec.before}%</span>
                <ArrowRight size={12} className="text-ink-faint" />
                <span className="font-mono font-bold text-status-safe">{activeRec.projectedAfter}%</span>
              </div>
              {activeRec.altZone && (
                <div className="flex items-center gap-1.5">
                  <span className="text-ink-faint">{activeRec.altZone.split('·')[0].trim()}</span>
                  <span className="font-mono font-bold text-status-safe">{activeRec.altBefore}%</span>
                  <ArrowRight size={12} className="text-ink-faint" />
                  <span className="font-mono font-bold text-status-moderate">{activeRec.altAfter}%</span>
                </div>
              )}
              <span className="ml-auto text-accent font-mono text-[11px]">-{activeRec.reduction}% congestion</span>
            </div>

            <div className="flex gap-2 flex-wrap">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-[4px] bg-accent text-surface-panel hover:bg-accent/90 transition-colors"
                  >
                    <Save size={13} /> Save Plan
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-[4px] border border-border-default bg-surface-raised text-ink-dim hover:text-ink hover:border-border-muted transition-colors"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => onApprove(activeRec.id)}
                    className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-[4px] bg-accent text-surface-panel hover:bg-accent/90 transition-colors"
                  >
                    <Check size={13} /> Approve & Execute
                  </button>
                  <button
                    onClick={handleModifyClick}
                    className="flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-[4px] border border-border-default bg-surface-raised text-ink-dim hover:text-ink hover:border-border-muted transition-colors"
                  >
                    <Pencil size={13} /> Modify
                  </button>
                  <button
                    onClick={() => onDismiss(activeRec.id)}
                    className="flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-[4px] border border-border-default bg-surface-raised text-ink-dim hover:text-ink hover:border-border-muted transition-colors ml-auto"
                  >
                    <X size={13} /> Dismiss
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
