import React, { useState, useEffect } from 'react';
import { 
  User, MapPin, Clock, Search, Filter, 
  ChevronRight, BadgeCheck, Activity, UserPlus,
  ArrowRight, CheckCircle2, ShieldCheck, Mail, Phone
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

export function MobileRegisterView() {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchCandidates() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('candidates')
          .select('*')
          .order('exam_date', { ascending: false })
          .limit(30);

        if (error) throw error;
        setCandidates(data || []);
      } catch (err) {
        console.error('Error fetching candidates:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchCandidates();
  }, []);

  const filtered = candidates.filter(c => 
    c.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.exam_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC] pb-32 pt-safe">
      
      {/* HEADER - APP STYLE */}
      <div className="bg-white px-6 pt-12 pb-8 border-b border-slate-100 shadow-sm sticky top-0 z-50 rounded-b-[40px]">
        <div className="flex items-center justify-between mb-8">
           <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tighter leading-none uppercase italic">Register</h1>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mt-1.5">Candidate Database</p>
           </div>
           <div className="flex gap-2">
              <button className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 shadow-sm">
                 <Filter size={18} />
              </button>
              <button className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-amber-500 shadow-xl shadow-slate-200">
                 <UserPlus size={24} />
              </button>
           </div>
        </div>

        <div className="relative">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
           <input 
              type="text" 
              placeholder="Search by name or exam..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-14 pl-12 pr-4 bg-slate-50 rounded-3xl border-none text-sm focus:ring-2 focus:ring-amber-200 outline-none transition-all shadow-inner"
           />
        </div>
      </div>

      {/* QUICK METRICS */}
      <div className="px-6 mt-8 flex gap-4 overflow-x-auto no-scrollbar">
         <div className="bg-[#4E342E] px-6 py-5 rounded-[32px] text-white flex flex-col gap-1 min-w-[150px] shadow-lg shadow-slate-200">
            <div className="flex items-center gap-2 mb-1">
               <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-amber-400">
                  <Activity size={12} />
               </div>
               <span className="text-[9px] font-black uppercase tracking-widest text-white/50">Active Batch</span>
            </div>
            <span className="text-2xl font-black">{filtered.length}</span>
         </div>
         <div className="bg-white border border-slate-50 px-6 py-5 rounded-[32px] text-slate-400 flex flex-col gap-1 min-w-[150px] shadow-md">
            <div className="flex items-center gap-2 mb-1">
               <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500">
                  <CheckCircle2 size={12} />
               </div>
               <span className="text-[9px] font-black uppercase tracking-widest">Completed</span>
            </div>
            <span className="text-2xl font-black text-slate-800">{candidates.filter(c => c.status === 'completed').length}</span>
         </div>
      </div>

      {/* LIST SECTION */}
      <div className="px-6 mt-10 space-y-6">
         <div className="flex justify-between items-center px-2">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Candidate Cards</h2>
            <span className="text-[9px] font-bold text-slate-300 uppercase">Showing Top 30</span>
         </div>
         
         <div className="grid grid-cols-1 gap-6">
            <AnimatePresence mode="popLayout">
               {loading ? (
                 [1, 2, 3, 4].map(i => (
                   <div key={i} className="w-full h-32 bg-white rounded-[40px] animate-pulse shadow-sm"></div>
                 ))
               ) : filtered.map((c, i) => (
                 <motion.div
                   key={c.id || i}
                   initial={{ opacity: 0, y: 15 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: i * 0.04 }}
                   className="bg-white p-6 rounded-[45px] shadow-[0_15px_30px_rgba(0,0,0,0.03)] border border-slate-50 flex flex-col gap-6 active:scale-[0.98] transition-transform"
                 >
                   <div className="flex justify-between items-start">
                      <div className="flex items-center gap-4">
                        <div className={`w-16 h-16 rounded-full border-4 border-slate-50 overflow-hidden shadow-lg`}>
                           <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(c.full_name)}&background=F6C845&color=4E342E&bold=true&size=128`} className="w-full h-full object-cover" alt="Avatar" />
                        </div>
                        <div>
                           <h3 className="font-black text-slate-900 text-base leading-tight mb-1 truncate max-w-[180px]">{c.full_name}</h3>
                           <div className="flex items-center gap-2">
                              <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                                c.status === 'completed' 
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                                : 'bg-amber-50 text-amber-600 border-amber-100'
                              }`}>
                                 {c.status}
                              </span>
                              <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">#{c.confirmation_number?.slice(-4)}</span>
                           </div>
                        </div>
                      </div>
                      <button className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                         <ArrowRight size={20} />
                      </button>
                   </div>

                   <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-50">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center shadow-inner">
                            <Clock size={14} />
                         </div>
                         <div className="flex flex-col">
                            <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Exam Date</span>
                            <span className="text-[10px] font-black text-slate-700 leading-none">{c.exam_date?.substring(0,10)}</span>
                         </div>
                      </div>
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-xl bg-pink-50 text-pink-500 flex items-center justify-center shadow-inner">
                            <MapPin size={14} />
                         </div>
                         <div className="flex flex-col">
                            <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Branch</span>
                            <span className="text-[10px] font-black text-slate-700 leading-none uppercase">{c.branch_location}</span>
                         </div>
                      </div>
                   </div>

                   <div className="flex gap-3 px-2">
                      <div className="flex-1 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
                         <Mail size={16} />
                      </div>
                      <div className="flex-1 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
                         <Phone size={16} />
                      </div>
                      <div className="flex-[2] h-10 rounded-2xl bg-slate-900 flex items-center justify-center text-white text-[9px] font-black uppercase tracking-[0.2em]">
                         View File
                      </div>
                   </div>
                 </motion.div>
               ))}
            </AnimatePresence>
         </div>
      </div>

    </div>
  );
}
