import { Users } from 'lucide-react'

const STATUS_DOT = {
  active: 'bg-red-600',
  busy: 'bg-amber-500',
  available: 'bg-teal-600'
}

export default function ResponseTeamWidget({ teams }) {
  return (
    <div id="teams" className="panel p-4">
      <div className="flex items-center gap-2 mb-3.5">
        <Users size={15} className="text-brand-400" />
        <h3 className="font-display font-semibold text-[13.5px]">Response Teams</h3>
      </div>
      <div className="space-y-2.5">
        {teams.map((t) => (
          <div key={t.id} className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <span className={`status-dot ${STATUS_DOT[t.status]}`} />
              <div className="min-w-0">
                <p className="text-[11.5px] text-slate-500 truncate">{t.name}</p>
                <p className="text-[10.5px] text-slate-400">{t.members} members · {t.zone}</p>
              </div>
            </div>
            <span className="text-[10.5px] text-slate-400 capitalize shrink-0">{t.status}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
