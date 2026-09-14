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
    if (!role) return

    onLogin(role)
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6] px-4 relative overflow-hidden">
      <div className="absolute -top-40 -left-40 w-[440px] h-[440px] rounded-full bg-[#EAF7F3] blur-[120px]" />
      <div className="absolute -bottom-32 -right-32 w-[440px] h-[440px] rounded-full bg-[#EAF0FF] blur-[120px]" />

      <div className="relative w-full max-w-[980px] grid lg:grid-cols-[1.08fr_0.92fr] overflow-hidden rounded-[28px] border border-[#E7E6E1] bg-white shadow-panel">
        <div className="hidden lg:flex flex-col justify-between p-9 bg-[#F5F7F4]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0E3D34] text-white flex items-center justify-center">
              <Activity size={18} strokeWidth={2.5} />
            </div>
            <div>
              <p className="font-display text-[18px] text-ink">Pulse Command</p>
              <p className="text-[11px] text-ink-faint">Mega-Event Crowd Orchestration</p>
            </div>
          </div>

          <div>
            <p className="font-display text-[30px] leading-tight text-ink">One control room for every gate, zone and route.</p>
            <p className="text-[13px] text-ink-dim mt-3 max-w-[340px]">
              Live occupancy, predictive risk and AI-drafted redistribution plans for {EVENT.name}.
            </p>
          </div>

          <div className="flex items-center gap-2 text-[12px] text-ink-dim">
            <ShieldCheck size={14} className="text-[#1E6D5B]" />
            Role-based access · local simulation engine
          </div>
        </div>

        <div className="bg-white p-8 sm:p-10">
          <p className="text-[11px] uppercase tracking-[0.16em] text-ink-faint mb-2">Sign in</p>
          <h1 className="font-display font-semibold text-[26px] text-ink mb-6">Welcome back</h1>

          <div className="grid grid-cols-3 gap-1.5 mb-6 p-1 rounded-xl bg-[#F5F7F4] border border-[#E7E6E1]">
            {ROLES.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => {
                  setRoleId(r.id)
                  setEmail(r.email)
                }}
                className={`text-[11px] py-2 rounded-lg transition-colors ${
                  roleId === r.id ? 'bg-[#0E3D34] text-white' : 'text-ink-dim hover:text-ink'
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
              className="w-full flex items-center justify-center gap-2 bg-[#0E3D34] hover:bg-[#114E42] text-white font-medium text-[14px] py-2.75 rounded-xl transition-colors mt-2"
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
      <div className="flex items-center gap-2.5 rounded-xl border border-[#E7E6E1] bg-[#F9FAF8] px-3 py-2.5 focus-within:border-[#0E3D34]/30 transition-colors">
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
