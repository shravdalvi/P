import { ArrowLeft, Building2, Mail, MapPin, Shield, UserCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function ProfilePage({ profile }) {
  const navigate = useNavigate()

  const user = profile ?? {
    name: 'Event Admin',
    email: 'admin@pulsecommand.io',
    roleId: 'admin',
    customer: 'Meridian Arena',
    location: 'North Stand District'
  }

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#E7E6E1] bg-white text-ink hover:bg-[#F7F7F5]"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-ink-faint font-semibold">PROFILE</p>
          <h1 className="mt-2 font-display text-4xl text-ink">Customer account</h1>
        </div>
      </div>

      <div className="panel p-6 lg:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#0E3D34] text-2xl font-semibold text-white">
              {user.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.14em] text-ink-faint">Logged in as</p>
              <h2 className="mt-2 font-display text-4xl text-ink">{user.name}</h2>
            </div>
          </div>

          <span className="inline-flex items-center rounded-full bg-[#EAF7F3] px-3 py-1.5 text-[12px] font-medium text-[#1E6D5B]">
            Active account
          </span>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <InfoRow icon={<UserCircle size={16} />} label="Customer name" value={user.name} />
          <InfoRow icon={<Shield size={16} />} label="Role" value={user.name} />
          <InfoRow icon={<Mail size={16} />} label="Email" value={user.email} />
          <InfoRow icon={<Building2 size={16} />} label="Customer" value={user.customer} />
          <InfoRow icon={<MapPin size={16} />} label="Location" value={user.location} />
          <InfoRow icon={<Building2 size={16} />} label="Access status" value="Full dashboard access" />
        </div>
      </div>
    </div>
  )
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="rounded-2xl border border-[#EEF1EE] bg-[#F9FAF8] p-4">
      <div className="flex items-center gap-2 text-[#1E6D5B]">{icon}<span className="text-[11px] uppercase tracking-[0.12em] text-ink-faint">{label}</span></div>
      <p className="mt-3 text-[16px] font-medium text-ink">{value}</p>
    </div>
  )
}
