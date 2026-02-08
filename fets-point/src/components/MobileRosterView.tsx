import React, { useState } from 'react';
import { 
  User, Clock, Calendar as CalendarIcon, 
  ChevronLeft, ChevronRight, Filter,
  MoreVertical, Zap, CheckCircle2, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { Schedule, StaffProfile, SHIFT_CODES } from '../types/shared';

interface MobileRosterViewProps {
  staffProfiles: StaffProfile[];
  schedules: Schedule[];
  currentDate: Date;
  onNavigate: (dir: 'prev' | 'next') => void;
  onCellClick: (profileId: string, date: Date) => void;
}

export function MobileRosterView({ staffProfiles, schedules, currentDate, onNavigate, onCellClick }: MobileRosterViewProps) {
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getShift = (staffId: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return schedules.find(s => s.profile_id === staffId && s.date === dateStr);
  };

  return (
    <div className="flex flex-col gap-8">
      {/* STAFF SELECTOR (Premium Horizontal Chips) */}
      <div className="flex gap-3 overflow-x-auto no-scrollbar py-2 -mx-4 px-4 sticky top-0 bg-[#e0e5ec] z-30 border-b border-white/20 pb-4">
        <button 
          onClick={() => setSelectedStaff(null)}
          className={`px-8 py-4 rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] whitespace-nowrap transition-all shadow-lg ${
            selectedStaff === null 
            ? 'bg-[#3E2723] text-amber-500 shadow-amber-900/20' 
            : 'bg-white text-slate-400'
          }`}
        >
          All Units
        </button>
        {staffProfiles.map(staff => (
          <button 
            key={staff.id}
            onClick={() => setSelectedStaff(staff.id)}
            className={`px-8 py-4 rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] whitespace-nowrap transition-all shadow-lg ${
              selectedStaff === staff.id 
              ? 'bg-[#3E2723] text-amber-500 shadow-amber-900/20' 
              : 'bg-white text-slate-400'
            }`}
          >
            {staff.full_name.split(' ')[0]}
          </button>
        ))}
      </div>

      {/* ROSTER LIST (Clean Vertical Timeline) */}
      <div className="space-y-12">
        {days.map(day => {
          const isToday = isSameDay(day, new Date());
          const staffWithShifts = staffProfiles.filter(s => {
             const shift = getShift(s.id, day);
             return selectedStaff ? s.id === selectedStaff : !!shift;
          });

          if (staffWithShifts.length === 0 && !selectedStaff) return null;

          return (
            <div key={day.toISOString()} className="relative pl-12 border-l-2 border-white/40 ml-4 py-2">
              {/* Date Marker */}
              <div className={`absolute -left-[11px] top-0 w-5 h-5 rounded-full border-4 border-[#e0e5ec] shadow-md ${isToday ? 'bg-amber-500 scale-125' : 'bg-white'}`} />
              
              <div className="mb-6">
                <span className={`text-[11px] font-black uppercase tracking-[0.3em] ${isToday ? 'text-amber-600 italic' : 'text-slate-400'}`}>
                  {format(day, 'EEEE, MMM do')}
                </span>
                {isToday && <span className="ml-3 text-[9px] font-black bg-amber-500 text-white px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">LIVE NOW</span>}
              </div>

              <div className="grid grid-cols-1 gap-4">
                {staffWithShifts.map(staff => {
                  const shift = getShift(staff.id, day);
                  const shiftInfo = shift ? SHIFT_CODES[shift.shift_code as keyof typeof SHIFT_CODES] : null;

                  return (
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      key={staff.id}
                      onClick={() => onCellClick(staff.id, day)}
                      className="bg-white p-6 rounded-[35px] shadow-[0_15px_40px_rgba(0,0,0,0.04)] border border-white flex items-center justify-between group active:shadow-inner transition-all overflow-hidden relative"
                    >
                      <div className="flex items-center gap-5 relative z-10">
                         <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl ${
                            !shift || shift.shift_code === 'RD' || shift.shift_code === 'L' 
                            ? 'bg-slate-50 text-slate-300' 
                            : 'bg-gradient-to-br from-amber-400 to-amber-600 text-white'
                         }`}>
                            {(!shift || shift.shift_code === 'RD' || shift.shift_code === 'L') ? <Clock size={28} /> : <Zap size={28} />}
                         </div>
                         <div className="text-left">
                            <h4 className="text-sm font-black text-slate-900 uppercase tracking-tighter leading-none mb-2">
                               {staff.full_name}
                            </h4>
                            <div className="flex items-center gap-2">
                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                  {shiftInfo?.name || (shift?.shift_code === 'OFF' ? 'Rest Day' : shift?.shift_code || 'Unassigned')}
                               </p>
                               {shift?.overtime_hours > 0 && (
                                 <span className="px-2 py-0.5 bg-amber-100 rounded-lg text-[8px] font-black text-amber-600 uppercase tracking-widest border border-amber-200">
                                    +{shift.overtime_hours}h OT
                                 </span>
                               )}
                            </div>
                         </div>
                      </div>
                      <ChevronRight size={20} className="text-slate-200 relative z-10" />
                      
                      {/* Sub-gradient background element */}
                      <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-slate-50/50 to-transparent pointer-events-none" />
                    </motion.button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const Plus = ({ size, className }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);
