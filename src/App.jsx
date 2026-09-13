import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Analytics from './pages/Analytics.jsx'
import AppShell from './components/layout/AppShell.jsx'

export default function App() {
  const [role, setRole] = useState(() => sessionStorage.getItem('pc_role'))

  const handleLogin = (r) => {
    sessionStorage.setItem('pc_role', r)
    setRole(r)
  }

  const handleLogout = () => {
    sessionStorage.removeItem('pc_role')
    setRole(null)
  }

  return (
    <Routes>
      <Route path="/" element={role ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} />} />

      <Route
        element={role ? <AppShell role={role} onLogout={handleLogout} /> : <Navigate to="/" />}
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/analytics" element={<Analytics />} />
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}
