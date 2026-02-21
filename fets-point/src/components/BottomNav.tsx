import React, { useState } from 'react';
import { LayoutDashboard, CalendarDays, AlertCircle, Brain, Globe, X, MapPin, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBranch } from '../hooks/useBranch';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function BottomNav({ activeTab, setActiveTab }: BottomNavProps) {
  const { activeBranch, setActiveBranch } = useBranch();
  const [showBranchPicker, setShowBranchPicker] = useState(false);

  const branches = [
    { id: 'calicut', label: 'Calicut HQ' },
    { id: 'cochin', label: 'Cochin Center' },
    { id: 'kannur', label: 'Kannur Center' },
    { id: 'global', label: 'Global View' }
  ];

  const navItems = [
    { id: 'command-center', label: 'Home', icon: LayoutDashboard },
    { id: 'fets-calendar', label: 'Calendar', icon: CalendarDays },
    { id: 'incident-log', label: 'Cases', icon: AlertCircle },
    { id: 'mobile-ai-chat', label: 'FETS AI', icon: Brain },
  ];

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-[60] lg:hidden pb-safe">
        <div className="mx-4 mb-4 h-20 bg-white/90 backdrop-blur-xl rounded-[32px] shadow-2xl border border-white flex items-center justify-around px-2">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className="relative flex flex-col items-center justify-center w-14 h-14 transition-all duration-300"
              >
                <div className={`p-2.5 rounded-2xl transition-all duration-300 ${isActive
                    ? 'bg-[#3E2723] text-amber-500 shadow-lg shadow-amber-900/20'
                    : 'text-slate-400'
                  }`}>
                  <item.icon size={22} />
                </div>
                <span className={`text-[8px] font-black uppercase tracking-tighter mt-1 ${isActive ? 'text-slate-900' : 'text-slate-300'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}

          {/* BRANCH SELECTOR BUTTON */}
          <button
            onClick={() => setShowBranchPicker(true)}
            className="relative flex flex-col items-center justify-center w-14 h-14"
          >
            <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 shadow-sm">
              <Globe size={22} />
            </div>
            <span className="text-[8px] font-black uppercase tracking-tighter mt-1 text-amber-600">
              Node
            </span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showBranchPicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-end justify-center px-4 pb-8"
            onClick={() => setShowBranchPicker(false)}
          >
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="w-full max-w-md bg-white rounded-[45px] p-8 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter">Switch Node</h3>
                <button onClick={() => setShowBranchPicker(false)} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <X size={20} />
                </button>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {branches.map(b => (
                  <button
                    key={b.id}
                    onClick={() => { setActiveBranch(b.id as any); setShowBranchPicker(false); }}
                    className={`w-full p-6 rounded-[30px] flex items-center justify-between border-2 transition-all ${activeBranch === b.id
                        ? 'bg-amber-50 border-amber-500 shadow-lg shadow-amber-500/10'
                        : 'bg-slate-50 border-transparent hover:bg-slate-100'
                      }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activeBranch === b.id ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                        <MapPin size={20} />
                      </div>
                      <span className={`font-black text-sm uppercase tracking-widest ${activeBranch === b.id ? 'text-amber-900' : 'text-slate-600'}`}>{b.label}</span>
                    </div>
                    {activeBranch === b.id && <CheckCircle2 size={20} className="text-amber-500" />}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
