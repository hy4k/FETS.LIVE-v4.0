import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useBranch } from '../hooks/useBranch'
import { Calendar, ChevronRight, Clock, Users, AlertCircle } from 'lucide-react'
import { formatDateForIST } from '../utils/dateUtils'

interface ExamScheduleWidgetProps {
  onNavigate?: (tab: string) => void
}

interface Session {
  id: number
  client_name: string
  exam_name: string
  date: string
  candidate_count?: number | null
  start_time: string
  end_time: string
}

interface DaySchedule {
  date: string
  dayName: string
  sessions: Session[]
}

const CLIENT_COLORS: { [key: string]: string } = {
  PEARSON: 'border-blue-500',
  VUE: 'border-red-500',
  ETS: 'border-green-500',
  PSI: 'border-purple-500',
  PROMETRIC: 'border-orange-500',
  OTHER: 'border-gray-500',
}

const getClientType = (clientName: string): string => {
  const upperName = clientName.toUpperCase()
  if (upperName.includes('PEARSON')) return 'PEARSON'
  if (upperName.includes('VUE')) return 'VUE'
  if (upperName.includes('ETS')) return 'ETS'
  if (upperName.includes('PSI')) return 'PSI'
  if (upperName.includes('PROMETRIC')) return 'PROMETRIC'
  return 'OTHER'
}

export function ExamScheduleWidget({ onNavigate }: ExamScheduleWidgetProps) {
  const { activeBranch } = useBranch()

  const { data: schedule, isLoading, error } = useQuery<DaySchedule[]>({
    queryKey: ['examSchedule', '2days', activeBranch],
    queryFn: async () => {
      const today = new Date()
      const startDate = formatDateForIST(today)
      const endDate = new Date(today)
      endDate.setDate(today.getDate() + 1) // Fetch for 2 days (today + tomorrow)
      const endDateStr = formatDateForIST(endDate)

      let query = supabase
        .from('calendar_sessions')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDateStr)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true })

      if (activeBranch !== 'global') {
        query = query.eq('branch_location', activeBranch)
      }

      const { data: sessions, error } = await query
      if (error) throw error

      const days: DaySchedule[] = []
      for (let i = 0; i < 2; i++) { // Loop for 2 days
        const date = new Date(today)
        date.setDate(today.getDate() + i)
        const dateStr = formatDateForIST(date)
        const daySessions = sessions?.filter(s => s.date === dateStr) || []

        days.push({
          date: dateStr,
          dayName: i === 0 ? 'Today' : 'Tomorrow',
          sessions: daySessions,
        })
      }
      return days
    },
    staleTime: 60000,
  })

  // Grouping logic for global view
  const renderSessions = (sessions: Session[]) => {
    if (activeBranch !== 'global') {
      return sessions.map(session => {
        const clientType = getClientType(session.client_name);
        return (
          <div key={session.id} className={`p-3 rounded-xl border-l-4 ${CLIENT_COLORS[clientType]} bg-white shadow-sm hover:shadow-md transition-all`}>
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold text-gray-800 text-sm line-clamp-1">{session.client_name}</p>
                <p className="text-[10px] text-gray-500 font-medium mb-1 uppercase bg-gray-100 w-fit px-1.5 rounded">{session.exam_name}</p>
                <div className="flex items-center text-xs text-gray-500">
                  <Clock size={12} className="mr-1.5 text-amber-500" />
                  {session.start_time} - {session.end_time}
                </div>
              </div>
              <div className="flex flex-col items-end">
                <div className="flex items-center text-xs text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded-lg">
                  <Users size={12} className="mr-1" />
                  {session.candidate_count}
                </div>
              </div>
            </div>
          </div>
        );
      });
    }

    // Group by branch for Global view
    const branches: { [key: string]: Session[] } = {};
    sessions.forEach(s => {
      const loc = (s as any).branch_location || 'Other';
      if (!branches[loc]) branches[loc] = [];
      branches[loc].push(s);
    });

    return Object.entries(branches).map(([branch, bSessions]) => (
      <div key={branch} className="mb-6 last:mb-0">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-1 w-4 bg-amber-500 rounded-full"></div>
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{branch} Centre</h4>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {bSessions.map(session => {
            const clientType = getClientType(session.client_name);
            return (
              <div key={session.id} className={`p-3 rounded-xl border-l-4 ${CLIENT_COLORS[clientType]} bg-white shadow-sm border border-slate-100`}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-gray-800 text-sm">{session.client_name}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">{session.exam_name}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                      <Clock size={10} /> {session.start_time}
                    </div>
                    <div className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                      {session.candidate_count} PAX
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    ));
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6 px-4">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-amber-600 uppercase tracking-[0.3em]">Operational Timeline</span>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">
            Exam Schedule
          </h2>
        </div>
        <button
          onClick={() => onNavigate?.('fets-calendar')}
          className="p-2 bg-white shadow-[4px_4px_8px_#bec3c9,-4px_-4px_8px_#ffffff] rounded-xl text-amber-600 hover:scale-105 active:shadow-inner transition-all"
        >
          <Calendar size={20} />
        </button>
      </div>

      {isLoading && (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
          <div className="animate-spin h-8 w-8 border-2 border-amber-500 border-t-transparent rounded-full mb-4"></div>
          <p className="text-sm font-bold uppercase tracking-widest">Hydrating Schedule...</p>
        </div>
      )}

      {!isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 overflow-hidden">
          {schedule?.map(day => (
            <div key={day.date} className="flex flex-col h-full">
              <div className="flex justify-between items-center mb-4 px-2">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${day.dayName === 'Today' ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}></div>
                  <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest">{day.dayName}</h3>
                </div>
                <span className="text-[10px] font-bold text-slate-400">
                  {new Date(day.date + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                </span>
              </div>

              <div className="flex-1 bg-slate-100/50 rounded-[2rem] p-4 shadow-inner border border-white/50 overflow-y-auto no-scrollbar">
                {day.sessions.length > 0 ? (
                  <div className="space-y-4">
                    {renderSessions(day.sessions)}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center opacity-30 italic text-slate-500 py-10">
                    <p className="text-xs font-bold uppercase tracking-widest">No Deployments Ordered</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
