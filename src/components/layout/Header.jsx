import { useEffect, useState } from 'react'
import { Bell, CircleDot, Menu } from 'lucide-react'
import { EVENT } from '../../data/mockData.js'

export default function Header({ alertCount, onMenuClick }) {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <header className="h-16 shrink-0 flex items-center justify-between px-4 lg:px-6 border-b border-base-hair bg-base/80 backdrop-blur-xl sticky top-0 z-30">
      <div className="flex items-center gap-3 min-w-0">
        <button onClick={onMenuClick} className="lg:hidden p-1.5 -ml-1.5 text-ink-dim">
          <Menu size={20} />
        </button>
        <div className="min-w-0">
          <p className="font-display font-semibold text-[15px] truncate">{EVENT.name}</p>
          <p className="text-[11.5px] text-ink-faint truncate">
            {EVENT.venue} · {EVENT.date} · Gates {EVENT.gatesOpen} · Kickoff {EVENT.kickoff}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 lg:gap-5">
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-status-safe/10 border border-status-safe/25">
          <CircleDot size={12} className="text-status-safe" />
          <span className="text-[12px] text-status-safe font-medium">All systems nominal</span>
        </div>

        <span className="hidden sm:block text-[13px] font-data text-ink-dim tabular-nums">
          {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>

        <button className="relative p-2 rounded-lg hover:bg-base-panel text-ink-dim hover:text-ink transition-colors">
          <Bell size={17} strokeWidth={1.8} />
          {alertCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 rounded-full bg-status-critical text-white text-[9.5px] font-semibold flex items-center justify-center">
              {alertCount}
            </span>
          )}
        </button>
      </div>
    </header>
  )
}
