import React, { useState, useEffect } from 'react';
import { 
  ClipboardCheck, CheckCircle, ExternalLink, ShieldCheck, 
  ChevronRight, Sparkles, MessageSquare, Zap, Globe, Lock,
  Users, Activity, LayoutGrid, Shield, ClipboardList
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useBranch } from '../hooks/useBranch';

interface MobileHomeProps {
  setActiveTab: (tab: string) => void;
  profile: any;
  onOpenChecklist: (type: 'pre_exam' | 'post_exam') => void;
}

export function MobileHome({ setActiveTab, profile, onOpenChecklist }: MobileHomeProps) {
  const { activeBranch } = useBranch();
  const [todayStatus, setTodayStatus] = useState({ pre: 'pending', post: 'pending' });

  useEffect(() => {
    async function checkStatus() {
      try {
        const today = new Date().toISOString().split('T')[0];
        const { data } = await supabase
          .from('checklist_submissions')
          .select('*')
          .gte('submitted_at', today)
          .eq('branch_id', activeBranch !== 'global' ? activeBranch : undefined);

        if (data) {
          const hasPre = data.some((c: any) => c.template_id?.includes('pre') || c.answers?.type === 'pre_exam');
          const hasPost = data.some((c: any) => c.template_id?.includes('post') || c.answers?.type === 'post_exam');
          setTodayStatus({ 
            pre: hasPre ? 'completed' : 'pending', 
            post: hasPost ? 'completed' : 'pending' 
          });
        }
      } catch (e) {
        console.error('Status check error:', e);
      }
    }
    checkStatus();
  }, [activeBranch]);

  const quickLinks = [
    { name: 'Pearson VUE', url: 'https://connect.pearsonvue.com/', icon: 'PV' },
    { name: 'Prometric', url: 'https://easyserve.prometric.com/', icon: 'PR' },
    { name: 'CMA US', url: 'https://proscheduler.prometric.com/', icon: 'CM' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#F0F2F5] pb-32 pt-safe">
      
      {/* PREMIUM APP HEADER */}
      <div className="bg-[#F6C845] px-6 pt-6 pb-12 rounded-b-[45px] shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
            <LayoutGrid size={150} />
        </div>
        
        <div className="relative z-10 flex justify-between items-center mb-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white shadow-xl flex items-center justify-center border-2 border-white">
               <img src="/fets-point-logo.png" className="w-10 h-10 object-contain" alt="Logo" />
            </div>
            <div>
              <h1 className="text-[#3E2723] font-black text-2xl tracking-tighter leading-none italic uppercase">FETS LIVE</h1>
              <p className="text-[#3E2723]/40 text-[10px] font-black uppercase tracking-[0.3em] mt-1">Command Suite</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-[#3E2723]/10 rounded-2xl border border-[#3E2723]/10">
             <Globe size={14} className="text-[#3E2723]/60" />
             <span className="text-[#3E2723] font-black text-[10px] uppercase tracking-widest">{activeBranch}</span>
          </div>
        </div>

        {/* PROFILE STRIP */}
        <div className="bg-white/95 backdrop-blur-xl p-5 rounded-[32px] shadow-2xl flex items-center justify-between border border-white">
           <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-amber-500/20 shadow-md">
                <img src={profile?.avatar_url || 'https://i.pravatar.cc/100'} className="w-full h-full object-cover" />
             </div>
             <div>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] leading-none mb-1.5">Welcome Back</p>
                <p className="text-slate-900 font-black text-lg leading-none">{profile?.full_name?.split(' ')[0]}</p>
             </div>
           </div>
           <button onClick={() => setActiveTab('profile')} className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
              <Shield size={20} />
           </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="px-6 -mt-4 relative z-20 space-y-10">
        
        {/* ACTION CARDS: CHECKLISTS */}
        <div className="space-y-5">
           <div className="flex justify-between items-center px-2">
              <h2 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em]">Protocol Reporting</h2>
              <div className="h-0.5 flex-1 mx-4 bg-slate-200/50 rounded-full" />
           </div>
           
           <div className="grid grid-cols-2 gap-5">
              <motion.button 
                whileTap={{ scale: 0.94 }}
                onClick={() => onOpenChecklist('pre_exam')}
                className={`p-6 rounded-[40px] border-2 transition-all flex flex-col items-center text-center gap-5 ${
                  todayStatus.pre === 'completed' 
                  ? 'bg-emerald-50 border-emerald-100 shadow-inner' 
                  : 'bg-white border-white shadow-[0_20px_40px_rgba(0,0,0,0.06)]'
                }`}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl ${
                  todayStatus.pre === 'completed' ? 'bg-emerald-500 text-white shadow-emerald-100' : 'bg-blue-600 text-white shadow-blue-100'
                }`}>
                   <ClipboardCheck size={28} />
                </div>
                <div>
                   <h3 className={`font-black text-sm leading-tight mb-2 ${todayStatus.pre === 'completed' ? 'text-emerald-700' : 'text-slate-900'}`}>
                    Pre-Exam<br/>Checklist
                   </h3>
                   <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                     todayStatus.pre === 'completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'
                   }`}>
                     {todayStatus.pre === 'completed' ? 'Submitted' : 'Pending'}
                   </div>
                </div>
              </motion.button>

              <motion.button 
                whileTap={{ scale: 0.94 }}
                onClick={() => onOpenChecklist('post_exam')}
                className={`p-6 rounded-[40px] border-2 transition-all flex flex-col items-center text-center gap-5 ${
                  todayStatus.post === 'completed' 
                  ? 'bg-emerald-50 border-emerald-100 shadow-inner' 
                  : 'bg-white border-white shadow-[0_20px_40px_rgba(0,0,0,0.06)]'
                }`}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl ${
                  todayStatus.post === 'completed' ? 'bg-emerald-500 text-white shadow-emerald-100' : 'bg-[#3E2723] text-white shadow-[#3E2723]/10'
                }`}>
                   <CheckCircle size={28} />
                </div>
                <div>
                   <h3 className={`font-black text-sm leading-tight mb-2 ${todayStatus.post === 'completed' ? 'text-emerald-700' : 'text-slate-900'}`}>
                    Post-Exam<br/>Checklist
                   </h3>
                   <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                     todayStatus.post === 'completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'
                   }`}>
                     {todayStatus.post === 'completed' ? 'Submitted' : 'Pending'}
                   </div>
                </div>
              </motion.button>
           </div>
        </div>

        {/* OPERATIONS HUB */}
        <div className="space-y-5">
           <div className="flex justify-between items-center px-2">
              <h2 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em]">Grid Operations</h2>
              <div className="h-0.5 flex-1 mx-4 bg-slate-200/50 rounded-full" />
           </div>
           
           <div className="grid grid-cols-1 gap-4 px-2">
              {/* REGISTER */}
              <motion.button 
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab('candidate-tracker')}
                className="w-full bg-white p-6 rounded-[40px] shadow-md border border-white flex items-center justify-between group"
              >
                <div className="flex items-center gap-5">
                   <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-inner">
                      <Users size={28} />
                   </div>
                   <div className="text-left">
                      <h3 className="text-slate-900 font-black text-xl tracking-tighter leading-none mb-1">Register</h3>
                      <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest leading-none">Candidate Management</p>
                   </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-200">
                   <ChevronRight size={22} />
                </div>
              </motion.button>

              {/* ACCESS HUB */}
              <motion.button 
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab('access-hub')}
                className="w-full bg-[#3E2723] p-7 rounded-[40px] shadow-2xl flex items-center justify-between relative overflow-hidden group"
              >
                <div className="flex items-center gap-6 relative z-10">
                   <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-amber-500 shadow-inner group-active:scale-110 transition-transform">
                      <ShieldCheck size={32} />
                   </div>
                   <div className="text-left">
                      <h3 className="text-white font-black text-xl tracking-tighter leading-none mb-1.5">Access Hub</h3>
                      <p className="text-amber-500/60 text-[10px] font-bold uppercase tracking-widest leading-none">Security & Credentials</p>
                   </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/20">
                   <ChevronRight size={22} />
                </div>
                <div className="absolute right-0 bottom-0 opacity-[0.05] -mr-8 -mb-8">
                    <Lock size={180} />
                </div>
              </motion.button>

              {/* QUICK LINKS GRID */}
              <div className="bg-white p-8 rounded-[45px] shadow-md border border-white">
                 <div className="flex justify-between items-center mb-8">
                    <div>
                       <h3 className="font-black text-slate-900 text-sm tracking-tight leading-none uppercase">Portal Launchpad</h3>
                       <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-1">Verified Gateways Only</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center">
                       <ExternalLink size={14} className="text-slate-300" />
                    </div>
                 </div>
                 <div className="grid grid-cols-3 gap-4">
                    {quickLinks.map((link) => (
                       <a 
                         key={link.name} 
                         href={link.url} 
                         target="_blank" 
                         className="flex flex-col items-center justify-center p-5 bg-slate-50 rounded-[28px] border border-slate-100 active:bg-amber-50 active:border-amber-200 active:scale-95 transition-all shadow-sm group"
                       >
                         <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[10px] font-black text-slate-300 mb-2 border border-slate-50 shadow-inner group-active:text-amber-600 transition-colors uppercase">
                            {link.icon}
                         </div>
                         <span className="text-[9px] font-black text-slate-500 group-active:text-amber-700">{link.name}</span>
                       </a>
                    ))}
                 </div>
              </div>
           </div>
        </div>

        {/* FEED PREVIEW (SOCIAL) */}
        <div className="space-y-5 pb-10">
           <div className="flex justify-between items-center px-2">
              <h2 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em]">Social Grid</h2>
              <button onClick={() => setActiveTab('my-desk')} className="text-amber-600 text-[10px] font-black uppercase tracking-widest">Enter Desk</button>
           </div>
           
           <motion.button 
             whileTap={{ scale: 0.98 }}
             onClick={() => setActiveTab('my-desk')}
             className="w-full bg-white p-6 rounded-[45px] shadow-md border border-white flex items-center gap-6"
           >
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-pink-500 via-amber-500 to-indigo-500 p-1 flex items-center justify-center shadow-lg">
                 <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-pink-500">
                    <MessageSquare size={32} />
                 </div>
              </div>
              <div className="text-left flex-1">
                 <h3 className="text-slate-900 font-black text-lg tracking-tighter leading-none mb-1.5">My Desk</h3>
                 <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest leading-none">Team Feed & Active Stories</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-200">
                 <ChevronRight size={18} />
              </div>
           </motion.button>
        </div>

      </div>
    </div>
  );
}
