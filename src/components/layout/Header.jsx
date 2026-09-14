import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, CircleDot, Menu, ShieldAlert, User, LogOut } from 'lucide-react'
import { EVENT } from '../../data/mockData.js'

export default function Header({ alertCount, onMenuClick, onLogout }) {
  const navigate = useNavigate()
  const [now, setNow] = useState(new Date())
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setProfileMenuOpen(false)
      }
    }
    if (profileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [profileMenuOpen])

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

        {/* Operator Profile Menu */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className={`flex items-center gap-2 rounded-[4px] border border-border-default px-2 py-1 transition-colors ${
              profileMenuOpen ? 'bg-surface-overlay border-accent/40' : 'bg-surface-raised hover:border-accent/40'
            }`}
            title="Operator Profile"
          >
            <div className="w-6 h-6 rounded-[3px] bg-accent/20 border border-accent/40 text-accent text-[10.5px] font-mono font-bold flex items-center justify-center">
              <User size={13} />
            </div>
            <span className="hidden md:inline-block text-[11.5px] font-medium text-ink-dim">
              Profile
            </span>
          </button>

          {profileMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 rounded-[6px] bg-surface-overlay border border-border-default shadow-xl p-1.5 flex flex-col gap-1 z-50">
              <div className="px-2.5 py-2 border-b border-border-default mb-1">
                <p className="text-[10px] font-mono tracking-widest uppercase text-ink-faint">Operator</p>
                <p className="text-[12.5px] font-medium text-ink mt-0.5">Active Session</p>
              </div>
              <button
                onClick={() => {
                  setProfileMenuOpen(false)
                  navigate('/profile')
                }}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-[4px] text-[12.5px] text-ink-dim hover:text-ink hover:bg-surface-raised transition-colors"
              >
                <User size={14} />
                <span>My Profile</span>
              </button>
              <button
                onClick={() => {
                  setProfileMenuOpen(false)
                  onLogout?.()
                  navigate('/')
                }}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-[4px] text-[12.5px] text-status-critical hover:bg-status-critical/10 transition-colors"
              >
                <LogOut size={14} />
                <span>Sign out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
