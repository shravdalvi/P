import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Activity, Mail, Lock, ShieldCheck, ArrowRight, Radio } from 'lucide-react'
import { EVENT } from '../data/mockData.js'
import { firebaseEnabled, signIn } from '../lib/firebase.js'

const ROLES = [
  { id: 'admin', label: 'Event Admin', email: 'admin@pulsecommand.io' },
  { id: 'ops', label: 'Operations', email: 'ops@pulsecommand.io' },
  { id: 'security', label: 'Security', email: 'security@pulsecommand.io' }
]

export default function Login({ onLogin }) {
  const navigate = useNavigate()
  const [roleId, setRoleId] = useState('admin')
  const [email, setEmail] = useState('admin@pulsecommand.io')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    const role = ROLES.find((r) => r.id === roleId)
    if (!role) return

    if (firebaseEnabled) {
      setLoading(true)
      try {
        await signIn(email, password)
        onLogin(role)
        navigate('/dashboard')
      } catch (err) {
        if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
          setError('Invalid credentials.')
        } else if (err.code === 'auth/too-many-requests') {
          setError('Too many attempts. Please try again later.')
        } else if (err.code === 'auth/network-request-failed') {
          setError('Network failure. Check your connection.')
        } else {
          setError('Authentication failed: ' + err.message)
        }
      } finally {
        setLoading(false)
      }
    } else {
      onLogin(role)
      navigate('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4 py-8 font-sans">
      <div className="w-full max-w-[420px] bg-white rounded-[24px] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-[16px] bg-[#FACC15] flex items-center justify-center text-black mb-4 shadow-sm">
            <Activity size={28} strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900">
            Vibecheck
          </h1>
          <p className="text-[13px] text-zinc-500 font-medium mt-1">
            Dashboard & Controller
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="mb-6">
          <div className="flex bg-zinc-100 p-1 rounded-[12px]">
            {ROLES.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => {
                  setRoleId(r.id)
                  setEmail(r.email)
                }}
                className={`flex-1 text-[13px] py-2 rounded-[8px] font-semibold transition-all ${
                  roleId === r.id
                    ? 'bg-white text-black shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-900'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 px-4 py-3 rounded-[12px] bg-red-50 text-red-600 text-[13px] font-medium border border-red-100 text-center">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex items-center gap-3 rounded-[12px] border border-zinc-200 bg-white px-4 py-3.5 focus-within:border-black focus-within:ring-1 focus-within:ring-black transition-all">
              <Mail size={18} className="text-zinc-400 shrink-0" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-transparent outline-none text-[15px] font-medium text-zinc-900 w-full placeholder:text-zinc-400"
                placeholder="Email address"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-3 rounded-[12px] border border-zinc-200 bg-white px-4 py-3.5 focus-within:border-black focus-within:ring-1 focus-within:ring-black transition-all">
              <Lock size={18} className="text-zinc-400 shrink-0" />
              <input
                type="password"
                value={password}
                placeholder={firebaseEnabled ? "Password" : "Any password works"}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-transparent outline-none text-[15px] font-medium text-zinc-900 w-full placeholder:text-zinc-400"
                required={firebaseEnabled}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-[#FACC15] hover:bg-[#EAB308] disabled:opacity-50 text-black font-bold text-[15px] py-4 rounded-[12px] transition-all mt-4"
          >
            {loading ? 'Signing in...' : 'Sign In'} <ArrowRight size={18} />
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center text-[12px] font-medium text-zinc-400">
          {EVENT.name} • {firebaseEnabled ? 'Secured by Firebase' : 'Local Dev Mode'}
        </div>
      </div>
    </div>
  )
}
