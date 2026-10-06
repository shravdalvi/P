import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import LiveMapPage from './pages/LiveMap.jsx'
import ZonesPage from './pages/Zones.jsx'
import AlertsPage from './pages/Alerts.jsx'
import DevicesPage from './pages/Devices.jsx'
import ProfilePage from './pages/Profile.jsx'
import AppShell from './components/layout/AppShell.jsx'
import { firebaseEnabled, subscribeAuth, signOutUser } from './lib/firebase.js'

export default function App() {
  const [role, setRole] = useState(() => sessionStorage.getItem('pc_role'))
  const [profile, setProfile] = useState(() => {
    const saved = sessionStorage.getItem('pc_profile')
    if (!saved) return null
    try { return JSON.parse(saved) } catch { return null }
  })
  const [authLoading, setAuthLoading] = useState(firebaseEnabled)

  useEffect(() => {
    if (!firebaseEnabled) return
    let unsubObj = null

    subscribeAuth((user) => {
      if (user) {
        const roleMatch = user.email ? user.email.split('@')[0] : 'ops'
        const roleLabel = roleMatch === 'admin' ? 'Event Admin' : roleMatch === 'security' ? 'Security' : 'Operations'
        const profileData = {
          name: roleLabel,
          email: user.email,
          roleId: roleMatch,
          customer: 'Meridian Arena',
          location: 'North Stand District'
        }
        sessionStorage.setItem('pc_role', roleLabel)
        sessionStorage.setItem('pc_profile', JSON.stringify(profileData))
        setRole(roleLabel)
        setProfile(profileData)
      } else {
        sessionStorage.removeItem('pc_role')
        sessionStorage.removeItem('pc_profile')
        setRole(null)
        setProfile(null)
      }
      setAuthLoading(false)
    }).then(unsub => {
      unsubObj = unsub
    }).catch(err => {
      console.error("Auth init failed:", err)
      setAuthLoading(false)
    })

    return () => { if (unsubObj) unsubObj() }
  }, [])

  const handleLogin = (userRole) => {
    const profileData = {
      name: userRole.label,
      email: userRole.email,
      roleId: userRole.id,
      customer: 'Meridian Arena',
      location: 'North Stand District'
    }

    sessionStorage.setItem('pc_role', userRole.label)
    sessionStorage.setItem('pc_profile', JSON.stringify(profileData))
    setRole(userRole.label)
    setProfile(profileData)
  }

  const handleLogout = async () => {
    if (firebaseEnabled) {
      await signOutUser()
    }
    sessionStorage.removeItem('pc_role')
    sessionStorage.removeItem('pc_profile')
    setRole(null)
    setProfile(null)
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-base text-ink-faint text-sm font-mono uppercase">
        Initializing Command Center...
      </div>
    )
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
