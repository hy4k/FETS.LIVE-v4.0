import React, { useMemo } from 'react'
import { Schedule, StaffProfile } from '../types/shared'
import { User, Clock, Calendar } from 'lucide-react'

type Props = {
  staffProfiles: StaffProfile[]
  schedules: Schedule[]
  currentDate: Date
  onCellClick: (profileId: string, date: Date) => void
}

// Premium color palette for shifts
const getShiftStyle = (code: string) => {
  // Neumorphic base style: light background, soft shadows for depth
  const base = "transition-all duration-300 transform hover:scale-105 font-bold font-rajdhani flex items-center justify-center rounded-xl bg-slate-50 shadow-[-2px_-2px_5px_rgba(255,255,255,1),2px_2px_5px_rgba(0,0,0,0.1)] border border-slate-100"

  switch (code) {
    case 'D':
      return `${base} text-amber-500` // Unique Gold/Yellow variant
    case 'E':
      return `${base} text-orange-600`
    case 'HD':
      return `${base} text-purple-600`
    case 'RD':
      return `${base} text-slate-500`
    case 'L':
      return `${base} text-rose-600`
    case 'OT':
      return `${base} text-emerald-600`
    case 'T':
      return `${base} text-cyan-600`
    default:
      return `${base} text-gray-400 border-dashed`
  }
}

const getCodeLabel = (code: string) => {
  if (code === 'OT') return 'OT'
  return code
}

// Generate consistent refined colors for avatars
const getAvatarColor = (name: string) => {
  const colors = [
    'text-rose-600',
    'text-blue-600',
    'text-amber-600',
    'text-emerald-600',
    'text-purple-600',
    'text-cyan-600',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export const MonthlyRosterTimeline: React.FC<Props> = ({ staffProfiles, schedules, currentDate, onCellClick }) => {
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const daysInMonth = useMemo(() => new Date(year, month + 1, 0).getDate(), [year, month])

  const scheduleMap = useMemo(() => {
    const map = new Map<string, Schedule>()
    for (const s of schedules) {
      map.set(`${s.profile_id}-${s.date}`, s)
    }
    return map
  }, [schedules])

  const days: Date[] = useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, i) => new Date(Date.UTC(year, month, i + 1)))
  }, [daysInMonth, month, year])

  const isToday = (d: Date) => new Date().toDateString() === d.toDateString()

  // Inline font style for Rajdhani
  const rajdhaniStyle = { fontFamily: '"Rajdhani", sans-serif' }

  return (
    <>
      <style>{`
      .premium-scrollbar::-webkit-scrollbar {
        height: 12px;
        background-color: #F3F4F6;
        border-bottom-left-radius: 1.5rem; /* rounded-3xl approx */
        border-bottom-right-radius: 1.5rem;
      }
      .premium-scrollbar::-webkit-scrollbar-track {
        background-color: #f9fafb;
        border-radius: 12px;
        margin: 0 20px;
      }
      .premium-scrollbar::-webkit-scrollbar-thumb {
        background: linear-gradient(90deg, #FCD34D 0%, #F59E0B 100%);
        border-radius: 12px;
        border: 3px solid #f9fafb; /* Creates padding effect */
        transition: background 0.3s;
      }
      .premium-scrollbar::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(90deg, #F59E0B 0%, #D97706 100%);
      }
    `}</style>

      <div className="bg-white/50 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 overflow-hidden flex flex-col h-full font-sans">
        <div className="overflow-x-auto flex-1 premium-scrollbar pb-2">
          <table className="min-w-full border-separate border-spacing-0">
            <thead>
              <tr>
                {/* Sticky Staff Column Header */}
                <th className="sticky left-0 z-20 bg-white/95 backdrop-blur-md border-b border-r border-gray-100 px-6 py-4 w-64 shadow-[4px_0_24px_rgb(0,0,0,0.02)]">
                  <div className="flex items-center gap-2 text-yellow-600">
                    <User className="w-4 h-4" />
                    <span className="text-sm font-bold tracking-wider uppercase" style={rajdhaniStyle}>Staff Member</span>
                  </div>
                </th>

                {/* Day Columns */}
                {days.map((d, idx) => {
                  const today = isToday(d);
                  return (
                    <th key={idx} className={`relative z-10 border-b border-gray-100 px-2 py-3 min-w-[54px] text-center transition-colors hover:bg-yellow-50/50 ${today ? 'bg-yellow-50/80' : 'bg-white/90'}`}>
                      <div className="flex flex-col items-center gap-1">
                        <span className={`text-[10px] uppercase font-bold tracking-widest ${today ? 'text-yellow-700' : 'text-gray-400'}`}>
                          {d.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0)}
                        </span>
                        <div className={`w-8 h-8 flex items-center justify-center rounded-xl text-sm font-bold shadow-sm transition-all ${today
                          ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white shadow-yellow-200'
                          : 'bg-white border border-gray-100 text-gray-700'
                          }`} style={rajdhaniStyle}>
                          {d.getDate()}
                        </div>
                      </div>
                      {/* Active Day Indicator Line */}
                      {today && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-yellow-400 mx-2 rounded-t-full"></div>}
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {staffProfiles.map((staff, rIdx) => (
                <tr key={staff.id} className="group hover:bg-white/60 transition-colors duration-150">

                  {/* Sticky Name Cell */}
                  <td className="sticky left-0 z-10 bg-white/95 group-hover:bg-yellow-50/20 backdrop-blur-sm border-b border-r border-gray-100 px-6 py-4 transition-colors">
                    <div className="flex items-center gap-3">
                      {/* Neumorphic Initials Avatar */}
                      <div className={`w-10 h-10 rounded-xl bg-slate-50 shadow-[-2px_-2px_5px_rgba(255,255,255,1),2px_2px_5px_rgba(0,0,0,0.1)] border border-slate-100 flex items-center justify-center font-bold shrink-0 text-base ${getAvatarColor(staff.full_name)}`} style={rajdhaniStyle}>
                        {staff.full_name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-gray-900 font-bold text-base truncate leading-tight" style={rajdhaniStyle}>
                          {staff.full_name}
                        </span>
                        {staff.department && (
                          <span className="text-[10px] text-gray-400 font-medium tracking-wide uppercase mt-0.5 truncate">
                            {staff.department}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Shift Cells */}
                  {days.map((d, cIdx) => {
                    const iso = d.toISOString().split('T')[0]
                    const key = `${staff.id}-${iso}`
                    const s = scheduleMap.get(key)
                    const code = s?.shift_code || ''
                    const today = isToday(d)

                    return (
                      <td
                        key={cIdx}
                        onClick={() => onCellClick(staff.id, d)}
                        className={`border-b border-gray-50 px-1 py-2 text-center align-middle cursor-pointer relative ${today ? 'bg-yellow-50/10' : ''
                          }`}
                      >
                        {/* Interactive Hover Area */}
                        <div className="w-full h-full flex items-center justify-center p-1">
                          {s ? (
                            <div className={`relative w-10 h-10 ${getShiftStyle(code)}`}>
                              <span className="leading-none text-base">{getCodeLabel(code)}</span>
                              {(s.overtime_hours || 0) > 0 && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-purple-600/90 text-[8px] text-white flex items-center justify-center rounded-full border border-white shadow-sm font-bold z-10" title={`Overtime: ${s.overtime_hours} hrs`}>
                                  OT
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-50/30 border border-transparent hover:border-gray-200 hover:bg-white transition-all duration-200 flex items-center justify-center group-hover/cell:scale-110">
                              <div className="w-1 h-1 rounded-full bg-gray-200"></div>
                            </div>
                          )}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

export default MonthlyRosterTimeline

