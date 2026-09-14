import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, CircleDot, Menu, ShieldAlert, User } from 'lucide-react'
import { EVENT } from '../../data/mockData.js'

export default function Header({ alertCount, onMenuClick }) {
  const navigate = useNavigate()
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <header className="h-14 shrink-0 flex items-center justify-between px-4 lg:px-6 border-b border-border-default bg-surface-panel sticky top-0 z-30 select-none">
      {/* ── Left: Mobile Toggle & Event Context ──────────────────────────── */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-1.5 -ml-1 rounded-[4px] text-ink-dim hover:text-ink hover:bg-surface-raised transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu size={18} />
        </button>

        <div className="flex items-center gap-2 truncate">
          <span className="font-display font-semibold text-[13px] text-ink truncate">
            {EVENT.name}
          </span>
          <span className="hidden sm:inline-block text-ink-faint text-[12px] font-mono">
            / {EVENT.venue}
          </span>
        </div>
      </div>

      {/* ── Right: Telemetry & Controls ──────────────────────────────────── */}
      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
        {/* LIVE Telemetry Badge */}
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] bg-status-safe/10 border border-status-safe/30 text-status-safe text-[11px] font-mono font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-status-safe animate-pulse inline-block" />
          <span>LIVE</span>
        </div>

        {/* System Online Status */}
        <div className="hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] bg-surface-raised border border-border-default text-ink-dim text-[11px] font-mono">
          <CircleDot size={10} className="text-accent" />
          <span>Engine Online</span>
        </div>

        {/* Digital Clock */}
        <div className="hidden sm:flex items-center px-2 py-0.5 rounded-[4px] bg-surface-raised border border-border-muted text-ink-dim text-[11px] font-data">
          {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>

        {/* Alert Indicator (clickable -> /alerts) */}
        <button
          onClick={() => navigate('/alerts')}
          className="relative p-1.5 rounded-[4px] border border-border-default bg-surface-raised text-ink-dim hover:text-ink hover:border-accent/40 transition-colors flex items-center gap-1.5"
          title="View Operational Alerts"
        >
          {alertCount > 0 ? (
            <ShieldAlert size={15} className="text-status-critical" />
          ) : (
            <Bell size={15} />
          )}
          {alertCount > 0 && (
            <span className="min-w-[16px] h-[16px] flex items-center justify-center rounded-[3px] bg-status-critical px-1 text-[10px] font-data font-bold text-white leading-none">
              {alertCount}
            </span>
          )}
        </button>

        {/* Operator Profile Shortcut */}
        <button
          type="button"
          onClick={() => navigate('/profile')}
          className="flex items-center gap-2 rounded-[4px] border border-border-default bg-surface-raised px-2 py-1 hover:border-accent/40 transition-colors"
          title="Operator Profile"
        >
          <div className="w-6 h-6 rounded-[3px] bg-accent/20 border border-accent/40 text-accent text-[10.5px] font-mono font-bold flex items-center justify-center">
            <User size={13} />
          </div>
          <span className="hidden md:inline-block text-[11.5px] font-medium text-ink-dim">
            Profile
          </span>
        </button>
      </div>
    </header>
  )
}
