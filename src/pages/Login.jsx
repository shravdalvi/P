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
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4 py-8">
      <div className="w-full max-w-[420px] bg-white border border-slate-200 rounded-[6px] p-6 sm:p-7 shadow-md">
        {/* ── Brand Header ──────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 mb-5 pb-5 border-b border-slate-200">
          <div className="w-10 h-10 rounded-[6px] bg-slate-50 border border-slate-200 flex items-center justify-center text-teal-600 shrink-0">
            <Activity size={20} strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-[15px]  text-slate-900 ">
                Vibecheck Controller
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-teal-600 inline-block" />
            </div>
            <p className="text-[11px] font-mono  text-slate-400 ">
              Operations Command Center
            </p>
          </div>
        </div>

        {/* ── Event Context Banner ───────────────────────────────────────── */}
        <div className="mb-5 px-3 py-2 rounded-[4px] bg-slate-50 border border-slate-200 flex items-center justify-between text-[11.5px]">
          <div className="flex items-center gap-2 text-slate-500 truncate">
            <Radio size={13} className="text-teal-600 shrink-0 " />
            <span className="truncate">{EVENT.name}</span>
          </div>

        </div>

        {/* ── Role Selector Tabs ─────────────────────────────────────────── */}
        <div className="mb-5">
          <label className="text-[11px] font-mono  text-slate-400 block mb-2">
            Operational Role
          </label>
          <div className="grid grid-cols-3 gap-1 p-1 rounded-[6px] bg-slate-50 border border-slate-200">
            {ROLES.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => {
                  setRoleId(r.id)
                  setEmail(r.email)
                }}
                className={`text-[11.5px] py-1.5 rounded-[4px] font-medium transition-all ${
                  roleId === r.id
                    ? 'bg-teal-600 text-white font-semibold shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Error Banner ──────────────────────────────────────────────── */}
        {error && (
          <div className="mb-4 px-3 py-2 rounded-[4px] bg-red-600/10 border border-red-600/20 text-red-600 text-[12px]">
            {error}
          </div>
        )}

        {/* ── Login Form ────────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="text-[11px] font-mono  text-slate-400 block mb-1">
              Operator Identification
            </label>
            <div className="flex items-center gap-2.5 rounded-[6px] border border-slate-200 bg-slate-50 px-3 py-2 focus-within:border-teal-600 transition-colors">
              <Mail size={14} className="text-slate-400 shrink-0" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-transparent outline-none text-[13px] text-slate-900 w-full font-mono placeholder:text-slate-400"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-mono  text-slate-400 block mb-1">
              Access Credential
            </label>
            <div className="flex items-center gap-2.5 rounded-[6px] border border-slate-200 bg-slate-50 px-3 py-2 focus-within:border-teal-600 transition-colors">
              <Lock size={14} className="text-slate-400 shrink-0" />
              <input
                type="password"
                value={password}
                placeholder={firebaseEnabled ? "Password required" : "Demo mode — any password"}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-transparent outline-none text-[13px] text-slate-900 w-full placeholder:text-slate-400"
                required={firebaseEnabled}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-600-hover disabled:opacity-50 text-white font-semibold text-[13.5px] py-2.5 rounded-[6px] transition-colors mt-4"
          >
            {loading ? 'Authenticating...' : 'Enter Command Center'} <ArrowRight size={15} />
          </button>
        </form>

        {/* ── Security / Ingestion Footnote ─────────────────────────────── */}
        <div className="mt-5 pt-4 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={13} className="text-teal-600" />
            <span>Role-Gated Access</span>
          </div>
          <span className="font-mono">{firebaseEnabled ? 'Firebase Auth' : 'Local Engine v1.0'}</span>
        </div>
      </div>
    </div>
  )
}
