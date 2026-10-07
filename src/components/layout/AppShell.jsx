import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'
import Header from './Header.jsx'
import { useCrowdEngine } from '../../lib/crowdEngine.js'
import { useBackendSync } from '../../hooks/useBackendSync.js'

export default function AppShell({ role, onLogout }) {
  const baseEngine = useCrowdEngine()
  const engine = useBackendSync(baseEngine)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      <Sidebar role={role} />

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileOpen(false)} />
          <div className={`absolute left-0 top-0 h-full w-72 transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <Sidebar role={role} mobile />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 bg-slate-100">
        <Header 
          alertCount={engine.kpis.activeAlerts} 
          onMenuClick={() => setMobileOpen(true)} 
          onLogout={onLogout}
          isConnected={engine.isBackendSynced}
          lastUpdated={engine.lastUpdated}
          activeDevices={engine.activeDevices}
        />
        <main className="flex-1 overflow-y-auto bg-slate-100">
          <Outlet context={{ ...engine, role }} />
        </main>
      </div>
    </div>
  )
}
