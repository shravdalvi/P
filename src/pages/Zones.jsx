import { useState } from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import { Plus, ArrowRight, Gauge, TrendingUp, AlertTriangle } from 'lucide-react'

export default function ZonesPage() {
  const engine = useOutletContext()
  const navigate = useNavigate()
  const [newZoneName, setNewZoneName] = useState('')
  const [newZoneCap, setNewZoneCap] = useState('')

  const handleAddZone = (e) => {
    e.preventDefault()
    if (!newZoneName.trim() || !newZoneCap) return
    engine.addZone(newZoneName.trim(), newZoneCap)
    setNewZoneName('')
    setNewZoneCap('')
  }

  const getRiskStyles = (risk) => {
    switch (risk) {
      case 'overcapacity':
      case 'critical':
        return 'bg-status-critical/15 text-status-critical border border-status-critical/30'
      case 'high':
        return 'bg-status-critical/10 text-status-critical border border-status-critical/20'
      case 'moderate':
        return 'bg-accent/15 text-accent border border-accent/30'
      default:
        return 'bg-status-safe/15 text-status-safe border border-status-safe/30'
    }
  }

  const getRiskLabel = (risk) => {
    switch (risk) {
      case 'overcapacity': return 'Overcapacity'
      case 'critical': return 'Critical Risk'
      case 'high': return 'High Risk'
      case 'moderate': return 'Moderate'
      default: return 'Safe'
    }
  }

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-ink-faint font-semibold">ZONES & CROWD ANALYSIS</p>
          <h1 className="mt-2 font-display text-3xl text-ink">Zone-by-zone insights</h1>
        </div>

        {/* Add Zone Form */}
        <form onSubmit={handleAddZone} className="flex items-center gap-2 bg-surface-raised p-2 rounded-[8px] border border-border-default">
          <input
            type="text"
            placeholder="New Zone Name"
            value={newZoneName}
            onChange={(e) => setNewZoneName(e.target.value)}
            className="w-40 md:w-48 bg-surface-base border border-border-default rounded-[4px] px-3 py-1.5 text-[13px] text-ink outline-none focus:border-accent transition-colors"
            required
          />
          <input
            type="number"
            placeholder="Max Cap"
            value={newZoneCap}
            onChange={(e) => setNewZoneCap(e.target.value)}
            className="w-24 bg-surface-base border border-border-default rounded-[4px] px-3 py-1.5 text-[13px] text-ink outline-none focus:border-accent transition-colors"
            required
            min="10"
          />
          <button
            type="submit"
            className="flex items-center justify-center gap-1.5 bg-accent text-white px-3 py-1.5 rounded-[4px] text-[13px] font-medium hover:bg-accent/90 transition-colors shrink-0"
          >
            <Plus size={16} /> Add Zone
          </button>
        </form>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {engine.zones.map((zone) => (
          <div key={zone.id} className="bg-surface-panel border border-border-default rounded-[8px] p-5 flex flex-col hover:border-border-muted transition-colors shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-[0.14em] text-ink-faint truncate" title={zone.name}>{zone.name}</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <h3 className="font-display text-3xl text-ink truncate">{zone.count.toLocaleString()}</h3>
                  <span className="text-[13px] text-ink-dim font-mono">/ {zone.capacity.toLocaleString()}</span>
                </div>
              </div>
              <span className={`shrink-0 inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${getRiskStyles(zone.risk)}`}>
                {getRiskLabel(zone.risk)}
              </span>
            </div>

            <div className="mt-6 space-y-3 text-[13px] text-ink-dim flex-1">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-ink-faint">
                  <Gauge size={14} className="text-ink-dim" /> Occupancy %
                </span>
                <span className="font-mono font-medium text-ink">{(zone.ratio * 100).toFixed(1)}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-ink-faint">
                  <TrendingUp size={14} className={zone.netFlow > 0 ? 'text-status-critical' : 'text-status-safe'} /> Net Flow
                </span>
                <span className="font-mono font-medium text-ink">{zone.netFlow > 0 ? '+' : ''}{zone.netFlow}/min</span>
              </div>
              {zone.prediction?.breachIn && (
                <div className="flex items-center justify-between pt-3 border-t border-border-default mt-2">
                  <span className="flex items-center gap-2 text-ink-faint">
                    <AlertTriangle size={14} className="text-status-critical" /> Predicted Breach
                  </span>
                  <span className="font-medium text-status-critical">~{zone.prediction.breachIn} mins</span>
                </div>
              )}
            </div>

            <button
              onClick={() => {
                engine.setSelectedZoneId(zone.id)
                navigate('/dashboard')
              }}
              className="mt-6 w-full flex items-center justify-center gap-2 text-[12px] font-medium text-ink bg-surface-raised hover:bg-surface-base border border-border-default rounded-[4px] py-2 transition-colors"
            >
              View on Dashboard <ArrowRight size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
