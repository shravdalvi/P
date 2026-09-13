import { History } from 'lucide-react'

export default function ActivityLog({ log }) {
  return (
    <div className="panel p-4 lg:p-5">
      <div className="flex items-center gap-2 mb-3.5">
        <History size={15} className="text-brand-400" />
        <h3 className="font-display font-semibold text-[13.5px]">Activity Log</h3>
      </div>
      <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
        {log.map((entry, i) => (
          <div key={i} className="flex gap-3 text-[12px]">
            <span className="font-data text-ink-faint shrink-0 w-12">{entry.time}</span>
            <span className="text-ink-dim leading-snug">{entry.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
