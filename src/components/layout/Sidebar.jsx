import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutGrid,
  Map,
  BellRing,
  Radio,
  LogOut,
  Activity
} from 'lucide-react'

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
  { to: '/live-map', label: 'Live Map', icon: Map },
  { to: '/zones', label: 'Zones & Crowd Analysis', icon: Map },
  { to: '/alerts', label: 'Alerts & Response', icon: BellRing },
  { to: '/devices', label: 'Devices & Network', icon: Radio }
]

export default function Sidebar({ role, onLogout, mobile = false }) {
  const navigate = useNavigate()

  return (
    <aside className={`${mobile ? 'flex lg:hidden' : 'hidden lg:flex'} flex-col w-72 shrink-0 bg-[#0E3D34] text-white shadow-[inset_-1px_0_0_rgba(255,255,255,0.06)]`}>
      <div className="h-20 flex items-center gap-3 px-5 border-b border-white/10">
        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
          <Activity size={18} className="text-white" strokeWidth={2.5} />
        </div>
        <div className="leading-tight">
          <p className="font-display text-lg tracking-tight">Pulse Command</p>
          <p className="text-[11px] text-white/70">Crowd orchestration</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-5 space-y-2">
        {NAV.map(({ to, label, icon: Icon }) => (
          <SidebarLink key={to} to={to} label={label} icon={Icon} />
        ))}
      </nav>

      <div className="p-3 border-t border-white/10 space-y-2">
        <button
          onClick={() => {
            onLogout?.()
            navigate('/')
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/75 hover:bg-white/5 transition-colors"
        >
          <LogOut size={16} strokeWidth={1.8} />
          Sign out
        </button>
        <div className="flex items-center gap-3 px-3 pt-3">
          <div className="w-8 h-8 rounded-full bg-white/10 text-[11px] font-semibold flex items-center justify-center">
            {role?.[0] ?? 'A'}
          </div>
          <div className="leading-tight">
            <p className="text-[12px] font-medium">{role}</p>
            <p className="text-[10px] text-white/65">Meridian Arena</p>
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
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
          isActive ? 'bg-white/10 text-white shadow-inner shadow-white/5' : 'text-white/75 hover:bg-white/5 hover:text-white'
        }`
      }
    >
      <Icon size={16} strokeWidth={1.8} />
      <span className="truncate">{label}</span>
    </NavLink>
  )
}
