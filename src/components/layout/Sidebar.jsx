import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Map,
  ShieldAlert,
  Radio,
  Activity,
  PanelLeftClose,
  PanelLeftOpen,
  LayoutGrid
} from 'lucide-react'

const NAV = [
  { to: '/dashboard', label: 'Command', icon: LayoutDashboard },
  { to: '/live-map', label: 'Live Map', icon: Map },
  { to: '/zones', label: 'Zones', icon: LayoutGrid },
  { to: '/alerts', label: 'Alerts', icon: ShieldAlert },
  { to: '/devices', label: 'Systems', icon: Radio }
]

export default function Sidebar({ role, mobile = false }) {
  const [collapsed, setCollapsed] = useState(false)
  const isCollapsed = collapsed && !mobile

  return (
    <aside
      className={`${
        mobile ? 'flex lg:hidden w-72' : 'hidden lg:flex transition-all duration-300 z-20'
      } ${isCollapsed ? 'w-[68px]' : 'w-64'} flex-col shrink-0 bg-surface-panel border-r border-border-default text-ink select-none`}
    >
      {/* ── Brand Header ─────────────────────────────────────────────────── */}
      <div className={`h-14 mt-2 flex items-center ${isCollapsed ? 'justify-center px-0' : 'justify-between px-4'} shrink-0`}>
        {!isCollapsed && (
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-surface-raised flex items-center justify-center text-ink shrink-0">
              <Activity size={18} strokeWidth={2.2} />
            </div>
            <div className="min-w-0 leading-tight">
              <p className="text-[14.5px] font-semibold tracking-wide text-ink truncate">
                Pulse Command
              </p>
            </div>
          </div>
        )}

        {/* Collapse Toggle */}
        {!mobile && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`w-9 h-9 flex items-center justify-center rounded-[8px] text-ink-dim hover:text-ink hover:bg-surface-raised transition-colors shrink-0 ${isCollapsed ? '' : '-mr-1'}`}
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <PanelLeftOpen size={18} strokeWidth={2} /> : <PanelLeftClose size={18} strokeWidth={2} />}
          </button>
        )}
      </div>

      {/* ── Navigation Links ─────────────────────────────────────────────── */}
      <nav className={`flex-1 ${isCollapsed ? 'px-2' : 'px-3'} py-4 space-y-1 overflow-x-hidden`}>
        {NAV.map(({ to, label, icon: Icon }) => (
          <SidebarLink key={to} to={to} label={label} icon={Icon} isCollapsed={isCollapsed} />
        ))}
      </nav>

      {/* ── Footer / Operator Identity ───────────────────────────────────── */}
      <div className="p-3">
        <div className={`flex items-center ${isCollapsed ? 'justify-center w-11 h-11 mx-auto' : 'gap-3 px-2 py-2'} rounded-[8px] hover:bg-surface-raised cursor-pointer transition-colors overflow-hidden`}>
          <div className="w-8 h-8 rounded-full bg-accent/20 text-accent text-[12.5px] font-bold flex items-center justify-center shrink-0">
            {role?.[0] ?? 'A'}
          </div>
          {!isCollapsed && (
            <div className="min-w-0 leading-tight flex-1">
              <p className="text-[13.5px] font-medium text-ink truncate whitespace-nowrap">{role || 'Operator'}</p>
              <p className="text-[11px] text-ink-faint truncate whitespace-nowrap mt-0.5">Meridian Arena</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}

function SidebarLink({ to, label, icon: Icon, isCollapsed }) {
  return (
    <NavLink
      to={to}
      title={isCollapsed ? label : undefined}
      className={({ isActive }) =>
        `flex items-center ${isCollapsed ? 'justify-center w-11 h-11 mx-auto' : 'gap-3 px-3 py-2.5'} rounded-[8px] text-[13.5px] transition-colors whitespace-nowrap ${
          isActive
            ? 'bg-surface-raised text-ink font-medium'
            : 'text-ink-dim hover:text-ink hover:bg-surface-raised/50'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={18} strokeWidth={isActive ? 2.2 : 2} className="shrink-0" />
          {!isCollapsed && <span className="truncate">{label}</span>}
        </>
      )}
    </NavLink>
  )
}
