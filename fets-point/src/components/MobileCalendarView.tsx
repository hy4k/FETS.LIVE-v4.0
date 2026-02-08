import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  MapPin, Clock, Search, Filter, ArrowRight,
  Plus, Users, Award, LayoutGrid, List
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from 'date-fns';

interface MobileCalendarViewProps {
  setActiveTab?: (tab: string) => void;
}

export function MobileCalendarView({ setActiveTab }: MobileCalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch sessions for the entire visible month
  useEffect(() => {
    async function fetchMonthSessions() {
      setLoading(true);
      try {
        const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
        const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
        
        const { data, error } = await supabase
          .from('calendar_sessions')
          .select('*')
          .gte('date', start)
          .lte('date', end)
          .order('start_time', { ascending: true });

        if (error) throw error;
        setSessions(data || []);
      } catch (err) {
        console.error('Error fetching sessions:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchMonthSessions();
  }, [currentMonth]);

  const monthDays = useMemo(() => {
    return eachDayOfInterval({
      start: startOfMonth(currentMonth),
      end: endOfMonth(currentMonth)
    });
  }, [currentMonth]);

  const selectedDateSessions = useMemo(() => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    return sessions.filter(s => s.date === dateStr);
  }, [selectedDate, sessions]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    const next = new Date(currentMonth);
    next.setMonth(currentMonth.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentMonth(next);
    // Auto-select 1st of next month for better UX
    setSelectedDate(startOfMonth(next));
  };

  const hasSession = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return sessions.some(s => s.date === dateStr);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F0F2F5] pb-32 pt-safe">
      
      {/* HEADER SECTION */}
      <div className="bg-[#F6C845] px-6 pt-10 pb-12 rounded-b-[40px] shadow-lg relative overflow-hidden sticky top-0 z-50">
        <div className="absolute top-0 right-0 p-8 opacity-5">
            <CalendarIcon size={120} />
        </div>

        <div className="relative z-10 flex items-center justify-between mb-8">
          <div>
            <h1 className="text-[#3E2723] font-black text-2xl tracking-tighter leading-none uppercase italic">Exam Grid</h1>
            <p className="text-[#3E2723]/40 text-[10px] font-black uppercase tracking-[0.3em] mt-1.5">FETS Operational Calendar</p>
          </div>
          <div className="flex bg-[#3E2723]/10 p-1.5 rounded-2xl border border-white/20 shadow-inner">
             <div className="px-3 py-1.5 bg-white rounded-xl shadow-lg flex items-center gap-2">
                <CalendarIcon size={14} className="text-amber-600" />
                <span className="text-[#3E2723] font-black text-[10px] uppercase tracking-widest">{format(currentMonth, 'MMM yyyy')}</span>
             </div>
          </div>
        </div>

        {/* Month Selector Strip */}
        <div className="relative z-10 flex items-center justify-between mb-10 bg-white/30 backdrop-blur-xl p-2 rounded-[24px] border border-white/40 shadow-inner">
           <button onClick={() => navigateMonth('prev')} className="w-12 h-12 rounded-2xl bg-white shadow-xl flex items-center justify-center text-[#3E2723] active:scale-95 transition-all">
              <ChevronLeft size={24} />
           </button>
           <h2 className="text-sm font-black text-[#3E2723] uppercase tracking-[0.2em]">{format(currentMonth, 'MMMM yyyy')}</h2>
           <button onClick={() => navigateMonth('next')} className="w-12 h-12 rounded-2xl bg-white shadow-xl flex items-center justify-center text-[#3E2723] active:scale-95 transition-all">
              <ChevronRight size={24} />
           </button>
        </div>

        {/* Date Strips (Horizontal Scroll) */}
        <div className="relative z-10 flex gap-4 overflow-x-auto no-scrollbar pb-1">
           {monthDays.map((date, i) => {
              const isSelected = isSameDay(date, selectedDate);
              const isCurr = isToday(date);
              const exists = hasSession(date);
              return (
                <button
                  key={i}
                  onClick={() => setSelectedDate(date)}
                  className={`flex-none w-16 h-24 rounded-[32px] flex flex-col items-center justify-center transition-all relative ${
                    isSelected 
                      ? 'bg-[#3E2723] text-white shadow-2xl scale-110 z-10 border-2 border-amber-400' 
                      : 'bg-white border border-slate-100 text-slate-400'
                  }`}
                >
                  <span className={`text-[8px] font-black uppercase tracking-widest mb-1 ${isSelected ? 'text-amber-400' : 'text-[#3E2723]/40'}`}>
                    {format(date, 'EEE')}
                  </span>
                  <span className="text-2xl font-black leading-none">{format(date, 'd')}</span>
                  
                  {exists && (
                    <div className="mt-2 flex flex-col items-center gap-0.5">
                       <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-amber-400' : 'bg-amber-500'}`} />
                       <span className={`text-[7px] font-black ${isSelected ? 'text-white/40' : 'text-slate-300'}`}>
                          {sessions.filter(s => s.date === format(date, 'yyyy-MM-dd')).length}
                       </span>
                    </div>
                  )}
                  
                  {isCurr && !isSelected && (
                    <div className="absolute top-2 w-1.5 h-1.5 bg-blue-500 rounded-full" />
                  )}
                </button>
              );
           })}
        </div>
      </div>

      {/* SESSION LIST */}
      <div className="px-6 mt-10">
        <div className="flex justify-between items-end mb-8 px-2">
           <div>
              <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">Timeline Overview</h2>
              <p className="text-slate-900 font-black text-lg tracking-tight">{format(selectedDate, 'EEEE, do MMMM')}</p>
           </div>
           <div className="px-4 py-2 bg-[#3E2723] rounded-2xl text-white text-[9px] font-black uppercase tracking-[0.2em] shadow-lg shadow-[#3E2723]/20">
              {selectedDateSessions.length} Events
           </div>
        </div>

        <div className="space-y-6">
           <AnimatePresence mode="popLayout">
             {loading ? (
               [1, 2, 3].map(i => (
                 <div key={i} className="w-full h-32 bg-white rounded-[45px] border border-slate-50 animate-pulse shadow-sm"></div>
               ))
             ) : selectedDateSessions.length > 0 ? (
               selectedDateSessions.map((session, i) => (
                 <motion.div
                   key={session.id || i}
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: i * 0.05 }}
                   className="bg-white p-7 rounded-[45px] shadow-[0_15px_40px_rgba(0,0,0,0.04)] border border-white flex flex-col gap-6 active:scale-[0.98] transition-transform relative overflow-hidden"
                 >
                   <div className="flex justify-between items-center relative z-10">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-[22px] bg-amber-50 text-amber-600 flex items-center justify-center shadow-inner border border-amber-100/50">
                           <Award size={32} />
                        </div>
                        <div>
                           <h3 className="font-black text-slate-900 text-xl tracking-tight leading-none mb-1.5 truncate max-w-[180px] uppercase italic">{session.client_name}</h3>
                           <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest leading-none">{session.exam_name}</p>
                           </div>
                        </div>
                      </div>
                      <div className="px-5 py-2.5 bg-slate-50 rounded-2xl text-[#3E2723] text-xs font-black shadow-inner border border-slate-100 flex items-center gap-2">
                         <Clock size={14} className="text-amber-500" />
                         {session.start_time?.substring(0, 5)}
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-5 relative z-10">
                      <div className="bg-[#F8FAFC] rounded-[30px] p-5 flex flex-col gap-1 border border-slate-100">
                         <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Total Capacity</span>
                         <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                               <Users size={16} />
                            </div>
                            <span className="font-black text-slate-800 text-base">{session.candidate_count} <span className="text-[10px] text-slate-300">Pax</span></span>
                         </div>
                      </div>
                      <div className="bg-[#F8FAFC] rounded-[30px] p-5 flex flex-col gap-1 border border-slate-100">
                         <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Network Node</span>
                         <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-pink-100 text-pink-500 flex items-center justify-center">
                               <MapPin size={16} />
                            </div>
                            <span className="font-black text-slate-800 text-[11px] uppercase tracking-tighter">{session.branch_location}</span>
                         </div>
                      </div>
                   </div>
                 </motion.div>
               ))
             ) : (
               <div className="text-center py-20 bg-white/50 rounded-[60px] border-2 border-dashed border-slate-200">
                  <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center text-slate-200 mx-auto mb-6 shadow-xl shadow-slate-100">
                     <CalendarIcon size={48} />
                  </div>
                  <h3 className="text-slate-400 font-black uppercase tracking-[0.2em] text-xs">Zero Sessions Found</h3>
                  <p className="text-slate-300 text-[10px] font-bold uppercase mt-3 tracking-widest leading-relaxed">System is clear for<br/>{format(selectedDate, 'do MMMM')}</p>
               </div>
             )}
           </AnimatePresence>
        </div>
      </div>

    </div>
  );
}
