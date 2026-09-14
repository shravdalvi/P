import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'
import Header from './Header.jsx'
import { useCrowdEngine } from '../../lib/crowdEngine.js'

export default function AppShell({ role, onLogout }) {
  const engine = useCrowdEngine()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-[#FAF9F6]">
      <Sidebar role={role} onLogout={onLogout} />

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileOpen(false)} />
          <div className={`absolute left-0 top-0 h-full w-72 transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <Sidebar role={role} onLogout={onLogout} mobile />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 bg-[#FAF9F6]">
        <Header alertCount={engine.kpis.activeAlerts} onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto bg-[#FAF9F6]">
          <Outlet context={engine} />
        </main>
      </div>
    </div>
  )
}
