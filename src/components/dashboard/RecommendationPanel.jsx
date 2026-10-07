import { useState } from 'react'
import { ArrowRight, Check, X, Pencil } from 'lucide-react'

export default function RecommendationPanel({ recommendations, zones, contingencyTarget, onApprove, onDismiss, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTarget, setEditTarget] = useState('');
  const activeRec = recommendations[0];

  if (!activeRec) {
    return (
      <div id="recommendations" className="panel p-4 lg:p-5 flex flex-col h-full bg-white border border-slate-200 rounded-[6px]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">

            <h2 className="font-display font-semibold text-[15px]   text-slate-900">Recommended action</h2>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center text-center p-6 text-slate-400">
          <p className="text-[13px] text-slate-500">No active recommendations</p>
          <p className="text-[11.5px] mt-1">Recommendations will appear when a zone becomes OFF-LIMIT.</p>
        </div>
      </div>
    )
  }

  return (
    <div id="recommendations" className="panel p-4 lg:p-5 flex flex-col h-full bg-white border border-slate-200 rounded-[6px]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">

          <h2 className="font-display font-semibold text-[15px]   text-slate-900">Recommended action</h2>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0 bg-slate-50 border border-slate-200 rounded-[6px] p-4 relative overflow-hidden">
        <div className="mb-3 border-b border-slate-200 pb-3">
          <p className="text-[14px] font-semibold text-red-600 mb-1">
            {activeRec.sourceZone.split('·')[0].trim()} {activeRec.status === 'pending' ? 'NEEDS CROWD CONTROL' : 'IS UNDER CROWD CONTROL'}
          </p>
          <p className="text-[13px] text-slate-900 font-medium">
            Redirect incoming crowd to <span className="text-teal-600">{activeRec.targetZone.split('·')[0].trim()}</span>
          </p>
        </div>

        <div className="flex-1 flex flex-col justify-center gap-3">
           <div>
             <span className="text-[11px] font-mono  text-slate-400 mb-1.5 block">Target Condition</span>
             <div className="bg-white border border-slate-200 rounded-[4px] p-2.5">
               <ul className="space-y-1.5">
                 {activeRec.rationale.map((line, idx) => (
                   <li key={idx} className="text-[12px] text-slate-500 flex items-start gap-1.5">
                     <span className="text-teal-600 leading-none text-[14px] mt-[1px]">•</span> {line}
                   </li>
                 ))}
               </ul>
             </div>
           </div>

           <div className="mt-2">
             <span className="text-[11px] font-mono  text-slate-400 mb-1 block">
               {activeRec.status === 'pending' ? 'Suggested Action' : activeRec.status === 'resolved' ? 'Resolved Action' : 'Executing Action'}
             </span>
             {isEditing ? (
                <select
                  value={editTarget || activeRec.targetZoneId}
                  onChange={(e) => setEditTarget(e.target.value)}
                  className="w-full bg-white border border-teal-300 rounded-[4px] p-2 text-[12.5px] text-slate-900 focus:outline-none focus:border-teal-600 h-[40px]"
                >
                  {zones && zones.filter(z => z.id !== activeRec.sourceZoneId && z.status !== 'OFF-LIMIT').map(z => (
                    <option key={z.id} value={z.id}>
                      {z.name.split('·')[0].trim()} ({Math.round(z.ratio * 100)}%)
                    </option>
                  ))}
                </select>
             ) : (
                <div className="flex items-center gap-2 bg-white px-3 py-2 border border-teal-200 rounded-[4px]">
                  <span className="text-[12.5px] font-medium text-slate-900">Redirect flow to {activeRec.targetZone.split('·')[0].trim()}</span>
                </div>
             )}
           </div>
        </div>

                <div className="flex gap-2 mt-4 pt-3 border-t border-slate-200">
          {isEditing ? (
            <>
              <button onClick={() => { onUpdate && onUpdate(activeRec.id, { targetZoneId: editTarget }); setIsEditing(false) }} className="flex-1 text-[12px] font-semibold px-3 py-2 bg-teal-600 text-white rounded-[4px]">SAVE PLAN</button>
              <button onClick={() => setIsEditing(false)} className="text-[12px] px-3 py-2 border border-slate-200 rounded-[4px] text-slate-500">CANCEL</button>
            </>
          ) : (activeRec.status === 'approved' || activeRec.status === 'executing' || activeRec.status === 'monitoring') ? (
            <div className="flex-1 flex flex-col items-center justify-center py-1">
              <span className="text-[12px] font-semibold text-teal-600 mb-1 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-teal-600 "></span>
                {activeRec.status === 'executing' ? 'Executing Redirect' : 'Monitoring Execution'}
              </span>
              <span className="text-[11px] text-slate-500">Waiting for congestion to resolve...</span>
            </div>
          ) : activeRec.status === 'resolved' ? (
            <div className="flex-1 flex flex-col items-center justify-center py-1 gap-2">
              <span className="text-[12px] font-semibold text-teal-600 flex items-center gap-2">
                <Check size={14} /> Congestion Resolved
              </span>
              <button onClick={() => onDismiss(activeRec.id)} className="text-[11px] px-3 py-1.5 border border-slate-200 rounded-[4px] text-slate-500 hover:text-slate-900">Acknowledge</button>
            </div>
          ) : activeRec.status === 'loading' ? (
            <div className="flex-1 flex flex-col items-center justify-center py-1 gap-2">
              <span className="text-[12px] font-semibold text-slate-500 flex items-center gap-2">
                 Analyzing...
              </span>
            </div>
          ) : (
            <>
              <button onClick={() => onApprove(activeRec.id)} className="flex-1 flex items-center justify-center gap-1.5 text-[12px] font-semibold px-3 py-2 rounded-[4px] bg-teal-600 text-white hover:bg-teal-600/90 transition-colors">
                <Check size={14} /> APPROVE
              </button>
              <button onClick={() => { setIsEditing(true); setEditTarget(activeRec.targetZoneId); }} className="flex items-center justify-center gap-1.5 text-[12px] px-3 py-2 rounded-[4px] border border-slate-200 bg-white text-slate-500 hover:text-slate-900 hover:border-slate-200 transition-colors">
                <Pencil size={14} /> MODIFY
              </button>
              <button onClick={() => onDismiss(activeRec.id)} className="flex items-center justify-center gap-1.5 text-[12px] px-3 py-2 rounded-[4px] border border-slate-200 bg-white text-slate-500 hover:text-slate-900 hover:border-slate-200 transition-colors">
                <X size={14} /> DISMISS
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
