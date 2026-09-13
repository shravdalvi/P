import { Play, Pause, RotateCcw, Waves, Wifi, CircleDot } from 'lucide-react'

const SCENARIOS = [
  { key: 'normal', label: 'Normal', icon: CircleDot },
  { key: 'surge', label: 'Crowd surge', icon: Waves },
  { key: 'congestion', label: 'Network congestion', icon: Wifi }
]

export default function DemoControls({ running, scenario, setRunning, setDemoScenario, resetSimulation }) {
  return (
    <div className="panel px-4 py-3 flex flex-wrap items-center gap-2.5">
      <span className="text-[11px] text-ink-faint mr-1">Simulation</span>

      <button
        onClick={() => setRunning(!running)}
        className="flex items-center gap-1.5 text-[12px] px-2.5 py-1.5 rounded-md border border-base-hair text-ink-dim hover:text-ink hover:bg-base-panel transition-colors"
      >
        {running ? <Pause size={13} /> : <Play size={13} />}
        {running ? 'Pause' : 'Resume'}
      </button>

      <button
        onClick={resetSimulation}
        className="flex items-center gap-1.5 text-[12px] px-2.5 py-1.5 rounded-md border border-base-hair text-ink-dim hover:text-ink hover:bg-base-panel transition-colors"
      >
        <RotateCcw size={13} /> Reset
      </button>

      <div className="w-px h-5 bg-base-hair mx-1" />

      {SCENARIOS.map((s) => (
        <button
          key={s.key}
          onClick={() => setDemoScenario(s.key)}
          className={`flex items-center gap-1.5 text-[12px] px-2.5 py-1.5 rounded-md transition-colors ${
            scenario === s.key
              ? 'bg-brand-500/15 text-brand-300 border border-brand-500/30'
              : 'border border-base-hair text-ink-dim hover:text-ink hover:bg-base-panel'
          }`}
        >
          <s.icon size={13} />
          {s.label}
        </button>
      ))}
    </div>
  )
}
