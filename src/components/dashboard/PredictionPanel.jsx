import { useMemo } from 'react'
import { ArrowUpRight, ShieldAlert } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

export default function PredictionPanel({ aiPrediction, onSelect }) {
  if (!aiPrediction) return (
    <div id="predictions" className="panel p-4 lg:p-5 h-full flex flex-col bg-white border border-slate-200 rounded-[6px]">
      <div className="flex items-center gap-2 mb-4">

        <h2 className="font-display font-semibold text-[15px]   text-slate-900">Crowd prediction</h2>
      </div>
      <div className="flex-1 flex items-center justify-center text-slate-400 text-[13px]">
        No critical trajectory identified.
      </div>
    </div>
  )

  return (
    <div id="predictions" className="panel p-4 lg:p-5 h-full flex flex-col bg-white border border-slate-200 rounded-[6px]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">

          <h2 className="font-display font-semibold text-[15px]   text-slate-900">Crowd prediction</h2>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0 bg-slate-50 border border-slate-200 rounded-[6px] p-4 relative overflow-hidden">

        {/* Top Section */}
        <div className="mb-4">
          <div className="flex justify-between items-start mb-1">
            <h3 className="font-display font-semibold text-lg tracking-tight text-slate-900">
              {aiPrediction.zoneName.split('·')[0].trim()}
            </h3>
            <span className="text-[10px] font-mono font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
              Likely to become OFF-LIMIT
            </span>
          </div>
          <button
            onClick={() => onSelect(aiPrediction.predictedZone)}
            className="text-[12px] text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1"
          >
            Inspect zone telemetry <ArrowUpRight size={13} />
          </button>
        </div>


        {/* Stats Grid + Gauge */}
        <div className="grid grid-cols-2 gap-3 mb-4 items-center">
          <div className="flex flex-col gap-3">
            <div className="bg-white border border-slate-200 p-2.5 rounded-[4px]">
              <div className="text-[10.5px] font-mono text-slate-400  mb-1">Occupancy</div>
              <div className="font-data text-[15px] font-semibold text-red-500">
                {Math.round(aiPrediction.occupancy * 100)}%
              </div>
            </div>
            <div className="bg-white border border-slate-200 p-2.5 rounded-[4px]">
              <div className="text-[10.5px] font-mono text-slate-400  mb-1">Trajectory</div>
              <div className="font-data text-[15px] font-semibold text-red-600">
                +{aiPrediction.netFlow}/m inflow
              </div>
            </div>
          </div>
          <div className="h-[120px] bg-white border border-slate-200 rounded-[4px] relative flex flex-col items-center justify-center">
             <span className="absolute top-2 left-2 text-[10px] font-mono text-slate-400 ">Pressure Dial</span>
             <ResponsiveContainer width="100%" height={80} className="mt-4">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Filled', value: Math.round(aiPrediction.occupancy * 100) },
                      { name: 'Remaining', value: 100 - Math.round(aiPrediction.occupancy * 100) }
                    ]}
                    cx="50%" cy="100%"
                    startAngle={180} endAngle={0}
                    innerRadius={30} outerRadius={40}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    <Cell fill="#EF4444" />
                    <Cell fill="#E2E8F0" />
                  </Pie>
                </PieChart>
             </ResponsiveContainer>
             <span className="absolute bottom-2 font-display font-semibold text-red-600 text-[13px]">CRITICAL</span>
          </div>
        </div>

        {/* Explainability */}
        <div className="flex flex-col gap-2 flex-1">
          <div className="text-[11.5px] font-mono  text-slate-400 mb-0.5">Estimated Horizon</div>
          <div className="text-[14px] text-slate-900 font-semibold flex items-center gap-2">
            <ShieldAlert size={14} className="text-red-600" />
            {aiPrediction.estimatedTimeToCritical
              ? `~${aiPrediction.estimatedTimeToCritical} minutes`
              : 'Imminent Risk'}
          </div>

          <div className="mt-3">
             <div className="text-[11.5px] font-mono  text-slate-400 mb-1.5">Contributing Factors</div>
             <ul className="space-y-1.5">
               {aiPrediction.contributingFactors.map((factor, idx) => (
                 <li key={idx} className="text-[12.5px] text-slate-500 flex gap-2 items-start">
                   <span className="text-red-500 mt-1 text-[14px] leading-none">•</span> {factor}
                 </li>
               ))}
             </ul>
          </div>
        </div>

      </div>
    </div>
  )
}
