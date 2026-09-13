import { BedDouble } from 'lucide-react'

export default function HospitalityWidget({ hospitality }) {
  return (
    <div id="hospitality" className="panel p-4">
      <div className="flex items-center gap-2 mb-3.5">
        <BedDouble size={15} className="text-brand-400" />
        <h3 className="font-display font-semibold text-[13.5px]">Hospitality</h3>
      </div>
      <div className="space-y-3">
        {hospitality.map((h) => (
          <div key={h.id} className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-[11.5px] text-ink-dim truncate">{h.zone}</p>
              <p className="text-[10.5px] text-ink-faint">{h.rooms} rooms · {h.distance}</p>
            </div>
            <span
              className={`font-data text-[12px] shrink-0 ${
                h.occupied >= 0.85 ? 'text-status-critical' : h.occupied >= 0.65 ? 'text-status-moderate' : 'text-status-safe'
              }`}
            >
              {Math.round(h.occupied * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
