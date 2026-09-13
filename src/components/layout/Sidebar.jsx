import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutGrid,
  Map,
  LineChart,
  BellRing,
  Sparkles,
  Bus,
  BedDouble,
  ShieldAlert,
  Users,
  Radio,
  Settings,
  LogOut,
  Activity
} from 'lucide-react'

const NAV = [
  { to: '/dashboard', label: 'Command Center', icon: LayoutGrid, section: 'top' },
  { to: '/dashboard#map', label: 'Live Map', icon: Map, section: 'top' },
  { to: '/analytics', label: 'Analytics', icon: LineChart, section: 'top' },
  { to: '/dashboard#alerts', label: 'Alerts', icon: BellRing, section: 'mid' },
  { to: '/dashboard#recommendations', label: 'Recommendations', icon: Sparkles, section: 'mid' },
  { to: '/dashboard#transport', label: 'Transport', icon: Bus, section: 'mid' },
  { to: '/dashboard#hospitality', label: 'Hospitality', icon: BedDouble, section: 'mid' },
  { to: '/dashboard#incidents', label: 'Incidents', icon: ShieldAlert, section: 'mid' },
  { to: '/dashboard#teams', label: 'Response Teams', icon: Users, section: 'mid' },
  { to: '/dashboard#network', label: 'System Health', icon: Radio, section: 'mid' }
]

export default function Sidebar({ role, onLogout }) {
  const navigate = useNavigate()

  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-base-hair bg-base-raised/60 backdrop-blur-xl">
      <div className="h-16 flex items-center gap-2.5 px-5 border-b border-base-hair">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center">
          <Activity size={17} className="text-base" strokeWidth={2.5} />
        </div>
        <div className="leading-tight">
          <p className="font-display font-semibold text-[15px] tracking-tight">Pulse Command</p>
          <p className="text-[11px] text-ink-faint">Crowd Orchestration</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        <div className="space-y-1">
          {NAV.filter((n) => n.section === 'top').map((item) => (
            <SidebarLink key={item.label} {...item} />
          ))}
        </div>
        <div>
          <p className="px-3 mb-2 text-[10.5px] uppercase tracking-[0.14em] text-ink-faint">Operations</p>
          <div className="space-y-1">
            {NAV.filter((n) => n.section === 'mid').map((item) => (
              <SidebarLink key={item.label} {...item} />
            ))}
          </div>
        </div>
      </nav>

      <div className="p-3 border-t border-base-hair space-y-1">
        <SidebarLink to="/dashboard#settings" label="Settings" icon={Settings} />
        <button
          onClick={() => {
            onLogout?.()
            navigate('/')
          }}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-ink-dim hover:text-ink hover:bg-base-panel transition-colors"
        >
          <LogOut size={16} strokeWidth={1.8} />
          Sign out
        </button>
        <div className="flex items-center gap-2.5 px-3 pt-2">
          <div className="w-7 h-7 rounded-full bg-brand-500/20 text-brand-400 text-[11px] font-semibold flex items-center justify-center">
            {role?.[0] ?? 'A'}
          </div>
          <div className="leading-tight">
            <p className="text-[12px] text-ink">{role}</p>
            <p className="text-[10.5px] text-ink-faint">Meridian Arena</p>
          </div>
        </div>
      </div>
    </aside>
  )
}

function SidebarLink({ to, label, icon: Icon }) {
  return (
    <NavLink
      to={to}
      end={to === '/dashboard'}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
          isActive
            ? 'bg-brand-500/12 text-brand-300'
            : 'text-ink-dim hover:text-ink hover:bg-base-panel'
        }`
      }
    >
      <Icon size={16} strokeWidth={1.8} />
      {label}
    </NavLink>
  )
}
