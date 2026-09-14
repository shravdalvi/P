import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Activity, Mail, Lock, ShieldCheck, ArrowRight, Radio } from 'lucide-react'
import { EVENT } from '../data/mockData.js'

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

  const handleSubmit = (e) => {
    e.preventDefault()
    const role = ROLES.find((r) => r.id === roleId)
    if (!role) return

    onLogin(role)
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-base px-4 py-8">
      <div className="w-full max-w-[420px] bg-surface-panel border border-border-default rounded-[6px] p-6 sm:p-7 shadow-2xl">
        {/* ── Brand Header ──────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 mb-5 pb-5 border-b border-border-muted">
          <div className="w-10 h-10 rounded-[6px] bg-surface-raised border border-border-default flex items-center justify-center text-accent shrink-0">
            <Activity size={20} strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-[15px] tracking-wider text-ink uppercase">
                Pulse Command
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block" />
            </div>
            <p className="text-[11px] font-mono tracking-wide text-ink-faint uppercase">
              Operations Command Center
            </p>
          </div>
        </div>

        {/* ── Event Context Banner ───────────────────────────────────────── */}
        <div className="mb-5 px-3 py-2 rounded-[4px] bg-surface-raised border border-border-muted flex items-center justify-between text-[11.5px]">
          <div className="flex items-center gap-2 text-ink-dim truncate">
            <Radio size={13} className="text-accent shrink-0 animate-pulse" />
            <span className="truncate">{EVENT.name}</span>
          </div>
          <span className="text-ink-faint shrink-0 font-mono text-[10.5px]">LIVE SIM</span>
        </div>

        {/* ── Role Selector Tabs ─────────────────────────────────────────── */}
        <div className="mb-5">
          <label className="text-[11px] font-mono uppercase tracking-wider text-ink-faint block mb-2">
            Operational Role
          </label>
          <div className="grid grid-cols-3 gap-1 p-1 rounded-[6px] bg-surface-raised border border-border-default">
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
                    ? 'bg-accent text-surface-base font-semibold shadow-sm'
                    : 'text-ink-dim hover:text-ink hover:bg-surface-panel/60'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Login Form ────────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="text-[11px] font-mono uppercase tracking-wider text-ink-faint block mb-1">
              Operator Identification
            </label>
            <div className="flex items-center gap-2.5 rounded-[6px] border border-border-default bg-surface-raised px-3 py-2 focus-within:border-accent transition-colors">
              <Mail size={14} className="text-ink-faint shrink-0" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-transparent outline-none text-[13px] text-ink w-full font-mono placeholder:text-ink-faint"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-mono uppercase tracking-wider text-ink-faint block mb-1">
              Access Credential
            </label>
            <div className="flex items-center gap-2.5 rounded-[6px] border border-border-default bg-surface-raised px-3 py-2 focus-within:border-accent transition-colors">
              <Lock size={14} className="text-ink-faint shrink-0" />
              <input
                type="password"
                value={password}
                placeholder="Demo mode — any password"
                onChange={(e) => setPassword(e.target.value)}
                className="bg-transparent outline-none text-[13px] text-ink w-full placeholder:text-ink-faint"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-surface-base font-semibold text-[13.5px] py-2.5 rounded-[6px] transition-colors mt-4"
          >
            Enter Command Center <ArrowRight size={15} />
          </button>
        </form>

        {/* ── Security / Ingestion Footnote ─────────────────────────────── */}
        <div className="mt-5 pt-4 border-t border-border-muted flex items-center justify-between text-[11px] text-ink-faint">
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={13} className="text-status-safe" />
            <span>Role-Gated Access</span>
          </div>
          <span className="font-mono">Local Engine v1.0</span>
        </div>
      </div>
    </div>
  )
}
