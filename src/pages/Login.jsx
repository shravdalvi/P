import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Activity, Mail, Lock, ShieldCheck, ArrowRight } from 'lucide-react'
import { EVENT } from '../data/mockData.js'

const ROLES = [
  { id: 'admin', label: 'Event Admin', email: 'admin@pulsecommand.io' },
  { id: 'ops', label: 'Operations Team', email: 'ops@pulsecommand.io' },
  { id: 'security', label: 'Security / Response', email: 'security@pulsecommand.io' }
]

export default function Login({ onLogin }) {
  const navigate = useNavigate()
  const [roleId, setRoleId] = useState('admin')
  const [email, setEmail] = useState('admin@pulsecommand.io')
  const [password, setPassword] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    const role = ROLES.find((r) => r.id === roleId)
    onLogin(role.label)
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-base px-4 relative overflow-hidden">
      <div className="absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full bg-brand-600/20 blur-[120px]" />
      <div className="absolute -bottom-40 -right-40 w-[520px] h-[520px] rounded-full bg-status-info/10 blur-[120px]" />

      <div className="relative w-full max-w-[920px] grid lg:grid-cols-[1.1fr_1fr] rounded-2xl overflow-hidden border border-base-hair shadow-panel">
        <div className="hidden lg:flex flex-col justify-between p-9 bg-base-raised bg-grid-fade">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center">
              <Activity size={18} className="text-base" strokeWidth={2.5} />
            </div>
            <div>
              <p className="font-display font-semibold text-[16px]">Pulse Command</p>
              <p className="text-[11px] text-ink-faint">Mega-Event Crowd Orchestration</p>
            </div>
          </div>

          <div>
            <p className="font-display text-[26px] leading-tight font-semibold text-ink">
              One control room for<br />every gate, zone and route.
            </p>
            <p className="text-[13px] text-ink-dim mt-3 max-w-[320px]">
              Live occupancy, predictive risk and AI-drafted redistribution plans for {EVENT.name}.
            </p>
          </div>

          <div className="flex items-center gap-2 text-[12px] text-ink-faint">
            <ShieldCheck size={14} className="text-brand-400" />
            Role-based access · Firebase Auth
          </div>
        </div>

        <div className="bg-base-panel p-8 sm:p-10">
          <p className="text-[11px] uppercase tracking-[0.14em] text-ink-faint mb-1.5">Sign in</p>
          <h1 className="font-display font-semibold text-[21px] mb-6">Welcome back</h1>

          <div className="grid grid-cols-3 gap-1.5 mb-6 p-1 rounded-lg bg-base border border-base-hair">
            {ROLES.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => {
                  setRoleId(r.id)
                  setEmail(r.email)
                }}
                className={`text-[11px] py-1.5 rounded-md transition-colors ${
                  roleId === r.id ? 'bg-brand-500/15 text-brand-300' : 'text-ink-faint hover:text-ink-dim'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field icon={Mail} label="Email" type="email" value={email} onChange={setEmail} />
            <Field
              icon={Lock}
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="Demo mode - any password"
            />

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-400 text-base font-medium text-[14px] py-2.5 rounded-lg transition-colors mt-2"
            >
              Enter command center <ArrowRight size={15} />
            </button>
          </form>

          <p className="text-[11.5px] text-ink-faint mt-5">
            Demo credentials are pre-filled per role. This build runs on the local simulation engine - no live Firebase project required.
          </p>
        </div>
      </div>
    </div>
  )
}

function Field({ icon: Icon, label, type, value, onChange, placeholder }) {
  return (
    <label className="block">
      <span className="text-[11.5px] text-ink-dim mb-1.5 block">{label}</span>
      <div className="flex items-center gap-2.5 rounded-lg border border-base-hair bg-base px-3 py-2.5 focus-within:border-brand-500/50 transition-colors">
        <Icon size={15} className="text-ink-faint shrink-0" />
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="bg-transparent outline-none text-[13.5px] text-ink w-full placeholder:text-ink-faint"
          required={type === 'email'}
        />
      </div>
    </label>
  )
}
