import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Menu, ShieldAlert, User, LogOut, Radio, Clock, Smartphone } from 'lucide-react'
import { EVENT } from '../../data/mockData.js'

export default function Header({ alertCount, onMenuClick, onLogout, isConnected, lastUpdated, activeDevices }) {
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

  // Check if data is stale (>10 seconds)
  const isStale = lastUpdated ? (now - lastUpdated) > 10000 : false;

  return (
    <header className="h-[56px] shrink-0 flex items-center justify-between px-4 lg:px-6 border-b border-slate-200 bg-white sticky top-0 z-30 select-none">
      {/* Left: Mobile Toggle & Event Context */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-1.5 -ml-1 rounded-[4px] text-slate-500 hover:text-slate-900 hover:bg-transparent transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu size={18} />
        </button>

        <div className="flex items-center gap-2 truncate">
          <span className="font-display font-semibold text-[13px] text-slate-900 truncate">
            {EVENT.name}
          </span>
          <span className="hidden sm:inline-block text-slate-400 text-[12px] font-medium">
            / {EVENT.venue}
          </span>
        </div>
      </div>

      {/* Right: Telemetry & Controls */}
      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
        
        {/* Active Devices Badge */}
        {activeDevices !== undefined && (
           <div className="hidden md:flex items-center gap-1.5 text-slate-500 text-[12px] font-medium border-r border-slate-200 pr-3">
             <Smartphone size={14} className="text-slate-400" />
             <span>{activeDevices.toLocaleString()} active</span>
           </div>
        )}

        {/* System Online Status / Stale Indicator */}
        <div className="hidden md:flex items-center gap-1.5 text-[12px] font-medium mr-1">
          {isConnected ? (
             isStale ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block animate-pulse"></span>
                  <span className="text-amber-600">Stale Data</span>
                </>
             ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-1000 inline-block"></span>
                  <span className="text-slate-500">Live</span>
                </>
             )
          ) : (
             <>
               <span className="w-1.5 h-1.5 rounded-full bg-slate-300 inline-block"></span>
               <span className="text-slate-500">Offline</span>
             </>
          )}
        </div>

        {/* Digital Clock & Last Updated */}
        <div className="hidden sm:flex flex-col items-end justify-center text-slate-500 px-3 py-0.5 border-r border-slate-200">
          <div className="text-[12px] font-medium leading-tight">
            {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
          {lastUpdated && (
            <div className="text-[9px] font-medium text-slate-400 leading-tight">
              upd: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
          )}
        </div>

        {/* Alert Indicator */}
        <button
          onClick={() => navigate('/alerts')}
          className="relative p-1.5 rounded-[4px] border border-slate-200 bg-transparent text-slate-500 hover:text-slate-900 hover:border-teal-600/40 transition-colors flex items-center gap-1.5"
          title="View Operational Alerts"
        >
          {alertCount > 0 ? (
            <ShieldAlert size={15} className="text-red-600" />
          ) : (
            <Bell size={15} />
          )}
          {alertCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] flex items-center justify-center rounded-[3px] bg-red-600 px-1 text-[10px] font-data font-semibold text-white leading-none">
              {alertCount}
            </span>
          )}
        </button>

        {/* Operator Profile Menu */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className="flex items-center gap-2 px-2 py-1 transition-colors text-slate-500 hover:text-slate-900"
            title="Operator Profile"
          >
            <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center">
              <User size={13} />
            </div>
            <span className="hidden md:inline-block text-[11.5px] font-medium text-slate-500">
              Profile
            </span>
          </button>

          {profileMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 rounded-[6px] bg-white border border-slate-200 shadow-xl p-1.5 flex flex-col gap-1 z-50">
              <div className="px-2.5 py-2 border-b border-slate-200 mb-1">
                <p className="text-[10px] font-medium text-slate-400">Operator</p>
                <p className="text-[12.5px] font-medium text-slate-900 mt-0.5">Active Session</p>
              </div>
              <button
                onClick={() => {
                  setProfileMenuOpen(false)
                  navigate('/profile')
                }}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-[4px] text-[12.5px] text-slate-500 hover:text-slate-900 hover:bg-transparent transition-colors"
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
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-[4px] text-[12.5px] text-red-600 hover:bg-red-50 transition-colors"
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

