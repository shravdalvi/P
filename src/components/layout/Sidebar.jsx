import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Map,
  ShieldAlert,
  Radio,
  LogOut,
  Activity
} from 'lucide-react'

const NAV = [
  { to: '/dashboard', label: 'Command', icon: LayoutDashboard },
  { to: '/live-map', label: 'Live Map', icon: Map },
  { to: '/alerts', label: 'Alerts', icon: ShieldAlert },
  { to: '/devices', label: 'Systems', icon: Radio }
]

export default function Sidebar({ role, onLogout, mobile = false }) {
  const navigate = useNavigate()

  return (
    <aside
      className={`${
        mobile ? 'flex lg:hidden' : 'hidden lg:flex'
      } flex-col w-60 shrink-0 bg-surface-panel border-r border-border-default text-ink select-none`}
    >
      {/* ── Brand Header ─────────────────────────────────────────────────── */}
      <div className="h-14 flex items-center gap-2.5 px-4 border-b border-border-default">
        <div className="w-8 h-8 rounded-[4px] bg-surface-raised border border-border-default flex items-center justify-center text-accent shrink-0">
          <Activity size={16} strokeWidth={2.5} />
        </div>
        <div className="min-w-0 leading-tight">
          <p className="font-display text-[13px] font-bold tracking-wider uppercase text-ink">
            Pulse Command
          </p>
          <p className="text-[10px] font-mono tracking-wide text-ink-faint">
            OPERATIONS RAIL
          </p>
        </div>
      </div>

      {/* ── Navigation Links ─────────────────────────────────────────────── */}
      <nav className="flex-1 px-2.5 py-4 space-y-1">
        <div className="px-2 pb-2">
          <p className="text-[10px] font-mono uppercase tracking-widest text-ink-faint">
            Navigation
          </p>
        </div>
        {NAV.map(({ to, label, icon: Icon }) => (
          <SidebarLink key={to} to={to} label={label} icon={Icon} />
        ))}
      </nav>

      {/* ── Footer / Operator Identity ───────────────────────────────────── */}
      <div className="p-2.5 border-t border-border-default space-y-2">
        <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-[4px] bg-surface-raised border border-border-muted">
          <div className="w-7 h-7 rounded-[4px] bg-accent/20 border border-accent/40 text-accent text-[11px] font-mono font-bold flex items-center justify-center shrink-0">
            {role?.[0] ?? 'A'}
          </div>
          <div className="min-w-0 leading-tight">
            <p className="text-[11.5px] font-medium text-ink truncate">{role}</p>
            <p className="text-[10px] text-ink-faint font-mono truncate">Meridian Arena</p>
          </div>
        </div>

        <button
          onClick={() => {
            onLogout?.()
            navigate('/')
          }}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[4px] text-[12px] text-ink-dim hover:text-status-critical hover:bg-surface-raised transition-colors"
        >
          <LogOut size={14} strokeWidth={1.8} />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  )
}

function SidebarLink({ to, label, icon: Icon }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-2.5 px-2.5 py-2 rounded-[4px] text-[12.5px] transition-all ${
          isActive
            ? 'bg-surface-raised text-accent border border-border-default font-medium shadow-sm'
            : 'text-ink-dim hover:text-ink hover:bg-surface-raised/50 border border-transparent'
        }`
      }
    >
      <Icon size={15} strokeWidth={1.8} className="shrink-0" />
      <span className="truncate">{label}</span>
    </NavLink>
  )
}
