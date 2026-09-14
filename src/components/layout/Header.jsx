import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, CircleDot, Menu, Search } from 'lucide-react'
import { EVENT } from '../../data/mockData.js'

export default function Header({ alertCount, onMenuClick }) {
  const navigate = useNavigate()
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <header className="h-20 shrink-0 flex items-center justify-between px-4 lg:px-6 border-b border-[#E7E6E1] bg-[#FFFFFF] sticky top-0 z-30">
      <div className="flex items-center gap-3 min-w-0">
        <button onClick={onMenuClick} className="lg:hidden p-2 -ml-2 rounded-lg text-ink-dim hover:bg-gray-100">
          <Menu size={20} />
        </button>

        <div className="hidden md:flex items-center gap-2.5 rounded-xl border border-[#E7E6E1] bg-[#F7F7F5] px-3 py-2 min-w-[260px]">
          <Search size={15} className="text-ink-faint" />
          <input
            className="w-full bg-transparent text-sm text-ink placeholder:text-ink-faint outline-none"
            placeholder="Search zones, alerts..."
          />
        </div>
      </div>

      <div className="flex items-center gap-3 lg:gap-4">
        <div className="hidden sm:flex items-center gap-2 rounded-full bg-[#EAF7F3] px-3 py-1.5 text-[12px] font-medium text-[#1E6D5B]">
          <CircleDot size={10} className="fill-current" />
          System Online
        </div>

        <div className="hidden md:flex items-center gap-2 rounded-full bg-[#F3F6F4] px-3 py-1.5 text-[12px] text-ink-dim">
          <span className="font-data text-[11px]">{now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
        </div>

        <button className="relative p-2.5 rounded-xl hover:bg-gray-100 text-ink-dim transition-colors">
          <Bell size={18} />
          {alertCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] flex items-center justify-center rounded-full bg-[#E15945] px-1 text-[9px] font-semibold text-white">
              {alertCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => navigate('/profile')}
          className="flex items-center gap-2.5 rounded-full border border-[#E7E6E1] bg-[#F7F7F5] px-2 py-1.5 hover:bg-[#F1F5F2] transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-[#0E3D34] text-white text-[11px] font-semibold flex items-center justify-center">TC</div>
          <div className="hidden sm:block leading-tight text-left">
            <p className="text-[12px] font-medium text-ink">{EVENT.name}</p>
          </div>
        </button>
      </div>
    </header>
  )
}
