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
    <div className="p-4 lg:p-6 max-w-4xl mx-auto space-y-5">
      <div className="flex items-center gap-3 pb-2 border-b border-border-default">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="flex h-8 w-8 items-center justify-center rounded-[4px] border border-border-default bg-surface-panel text-ink hover:border-accent transition-colors"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <p className="text-[10.5px] uppercase font-mono tracking-widest text-ink-faint">OPERATOR ACCESS</p>
          <h1 className="font-display font-bold text-2xl text-ink">Operator Account</h1>
        </div>
      </div>

      <div className="panel p-6 lg:p-7 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-border-default">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-[6px] bg-accent/20 border border-accent/40 text-accent text-xl font-mono font-bold">
              {user.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div>
              <p className="text-[11px] uppercase font-mono tracking-wider text-ink-faint">Active Session</p>
              <h2 className="font-display font-bold text-2xl text-ink mt-0.5">{user.name}</h2>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-[4px] bg-status-safe/10 border border-status-safe/30 px-3 py-1 text-[11.5px] font-mono text-status-safe self-start sm:self-auto">
            <span className="w-1.5 h-1.5 rounded-full bg-status-safe inline-block" />
            Authenticated
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <InfoRow icon={<UserCircle size={15} />} label="Operator Name" value={user.name} />
          <InfoRow icon={<Shield size={15} />} label="Operational Role" value={user.name} />
          <InfoRow icon={<Mail size={15} />} label="Contact Email" value={user.email} />
          <InfoRow icon={<Building2 size={15} />} label="Assigned Venue" value={user.customer} />
          <InfoRow icon={<MapPin size={15} />} label="Tactical Sector" value={user.location} />
          <InfoRow icon={<Building2 size={15} />} label="Access Clearance" value="Full Dashboard & Response Control" />
        </div>
      </div>
    </div>
  )
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="rounded-[4px] border border-border-default bg-surface-raised p-3.5">
      <div className="flex items-center gap-2 text-accent">
        {icon}
        <span className="text-[10.5px] font-mono uppercase tracking-wider text-ink-faint">{label}</span>
      </div>
      <p className="mt-2 text-[14px] font-medium text-ink">{value}</p>
    </div>
  )
}
