import { useOutletContext } from 'react-router-dom'
import {
  AreaChart, Area, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { HISTORICAL_DENSITY } from '../data/mockData.js'

const tooltipStyle = {
  background: '#0F1E1A',
  border: '1px solid #1C2E29',
  borderRadius: 10,
  fontSize: 12,
  color: '#EAF4F0'
}

export default function Analytics() {
  const engine = useOutletContext()

  const zoneOccupancy = engine.zones.map((z) => ({
    name: z.name.split('·')[0].trim(),
    occupancy: Math.round(z.ratio * 100)
  }))

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-[1400px] mx-auto">
      <div>
        <h1 className="font-display font-semibold text-[19px]">Analytics</h1>
        <p className="text-[12.5px] text-ink-faint mt-0.5">Historical trends across zones, transport and response</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="panel p-4 lg:p-5">
          <h2 className="font-display font-semibold text-[14px] mb-4">Crowd density over time</h2>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={HISTORICAL_DENSITY}>
              <defs>
                <linearGradient id="densityFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3FDBA6" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#3FDBA6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#132420" vertical={false} />
              <XAxis dataKey="t" stroke="#5D746D" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#5D746D" fontSize={11} tickLine={false} axisLine={false} width={30} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="density" stroke="#3FDBA6" strokeWidth={2} fill="url(#densityFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="panel p-4 lg:p-5">
          <h2 className="font-display font-semibold text-[14px] mb-4">Current occupancy by zone</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={zoneOccupancy}>
              <CartesianGrid stroke="#132420" vertical={false} />
              <XAxis dataKey="name" stroke="#5D746D" fontSize={10.5} tickLine={false} axisLine={false} interval={0} angle={-25} textAnchor="end" height={55} />
              <YAxis stroke="#5D746D" fontSize={11} tickLine={false} axisLine={false} width={30} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="occupancy" radius={[5, 5, 0, 0]}>
                {zoneOccupancy.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={
                      entry.occupancy >= 90
                        ? '#EF4A55'
                        : entry.occupancy >= 75
                        ? '#F0873F'
                        : entry.occupancy >= 60
                        ? '#E8B93F'
                        : '#49D17A'
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard label="Peak crowd period" value="19:00 – 19:30" hint="91% average density" />
        <SummaryCard label="Avg. response time" value="2m 40s" hint="Across all resolved incidents" />
        <SummaryCard label="Alerts issued today" value={engine.alerts.length} hint={`${engine.alerts.filter(a => a.status === 'resolved').length} resolved`} />
      </div>
    </div>
  )
}

function SummaryCard({ label, value, hint }) {
  return (
    <div className="panel p-4">
      <p className="text-[11px] text-ink-faint">{label}</p>
      <p className="font-data text-[20px] font-semibold text-ink mt-1">{value}</p>
      <p className="text-[11px] text-ink-faint mt-1">{hint}</p>
    </div>
  )
}
