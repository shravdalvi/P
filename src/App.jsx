import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import LiveMapPage from './pages/LiveMap.jsx'
import ZonesPage from './pages/Zones.jsx'
import AlertsPage from './pages/Alerts.jsx'
import DevicesPage from './pages/Devices.jsx'
import ProfilePage from './pages/Profile.jsx'
import AppShell from './components/layout/AppShell.jsx'

export default function App() {
  const [role, setRole] = useState(() => sessionStorage.getItem('pc_role'))
  const [profile, setProfile] = useState(() => {
    const saved = sessionStorage.getItem('pc_profile')
    if (!saved) return null

    try {
      return JSON.parse(saved)
    } catch {
      return null
    }
  })

  const handleLogin = (user) => {
    const profileData = {
      name: user.label,
      email: user.email,
      roleId: user.id,
      customer: 'Meridian Arena',
      location: 'North Stand District'
    }

    sessionStorage.setItem('pc_role', user.label)
    sessionStorage.setItem('pc_profile', JSON.stringify(profileData))
    setRole(user.label)
    setProfile(profileData)
  }

  const handleLogout = () => {
    sessionStorage.removeItem('pc_role')
    sessionStorage.removeItem('pc_profile')
    setRole(null)
    setProfile(null)
  }

  return (
    <Routes>
      <Route path="/" element={role ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} />} />

      <Route element={role ? <AppShell role={role} onLogout={handleLogout} /> : <Navigate to="/" />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/live-map" element={<LiveMapPage />} />
        <Route path="/zones" element={<ZonesPage />} />
        <Route path="/alerts" element={<AlertsPage />} />
        <Route path="/devices" element={<DevicesPage />} />
        <Route path="/profile" element={<ProfilePage profile={profile} />} />
        <Route path="/analytics" element={<Navigate to="/zones" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  )
}
