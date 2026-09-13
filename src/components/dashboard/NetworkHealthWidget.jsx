import { Radio } from 'lucide-react'

export default function NetworkHealthWidget({ network }) {
  const gatewaysOnline = network.gatewaysTotal - network.gatewaysOffline.length

  return (
    <div id="network" className="panel p-4">
      <div className="flex items-center gap-2 mb-3.5">
        <Radio size={15} className="text-brand-400" />
        <h3 className="font-display font-semibold text-[13.5px]">System Health</h3>
      </div>
      <div className="space-y-2.5 text-[11.5px]">
        <Row label="Smart bands active" value={network.bandsActive.toLocaleString()} />
        <Row
          label="Gateways online"
          value={`${gatewaysOnline} / ${network.gatewaysTotal}`}
          tone={network.gatewaysOffline.length > 0 ? 'text-status-moderate' : 'text-status-safe'}
        />
        <Row
          label="Data latency"
          value={`${network.latency}s`}
          tone={Number(network.latency) > 2 ? 'text-status-high' : 'text-status-safe'}
        />
        <Row
          label="Network health"
          value={`${network.health}%`}
          tone={network.health < 85 ? 'text-status-moderate' : 'text-status-safe'}
        />
      </div>
      {network.gatewaysOffline.length > 0 && (
        <p className="mt-3 pt-3 border-t border-base-hair text-[10.5px] text-status-moderate">
          Offline: {network.gatewaysOffline.join(', ')}
        </p>
      )}
    </div>
  )
}

function Row({ label, value, tone = 'text-ink' }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-faint">{label}</span>
      <span className={`font-data ${tone}`}>{value}</span>
    </div>
  )
}
