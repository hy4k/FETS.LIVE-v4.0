import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, Video, Phone, Mic, Calendar, X, Check } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useBranch } from '../hooks/useBranch'
import { FetsChatPopup } from './FetsChatPopup'
import { StaffProfile } from '../types/shared'

interface TeamPresenceProps {
  onFetsMeetClick?: () => void
}

export function TeamPresence({ onFetsMeetClick }: TeamPresenceProps) {
  const { user } = useAuth()
  const { activeBranch } = useBranch()
  
  const [staff, setStaff] = useState<StaffProfile[]>([])
  const [presence, setPresence] = useState<Record<string, { status: string, last_seen: string }>>({})
  const [openChats, setOpenChats] = useState<StaffProfile[]>([])

  // FETS MEET State
  const [showMeetModal, setShowMeetModal] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<string[]>([])
  const [meetMode, setMeetMode] = useState<'instant' | 'plan'>('instant')

  useEffect(() => {
    // ... existing fetch and subscription logic ...
    const fetchStaff = async () => {
        const { data: staffData } = await supabase
          .from('staff_profiles')
          .select('*')
          .neq('user_id', user?.id)
        setStaff(staffData || [])
      }
  
      fetchStaff()
      const presenceChannel = supabase.channel('online-users')
      presenceChannel
        .on('presence', { event: 'sync' }, () => {
          const state = presenceChannel.presenceState()
          const newPresence: Record<string, { status: string, last_seen: string }> = {}
          Object.keys(state).forEach(key => {
            const presences = state[key] as any[]
            if (presences.length > 0) {
              newPresence[key] = { 
                status: 'online', 
                last_seen: new Date().toISOString() 
              }
            }
          })
          setPresence(newPresence)
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED' && user?.id) {
            await presenceChannel.track({ user_id: user.id })
          }
        })
  
      return () => {
        presenceChannel.unsubscribe()
      }
  }, [user?.id])

  const onlineStaff = staff.filter(s => presence[s.user_id]?.status === 'online')
  const offlineStaff = staff.filter(s => !presence[s.user_id] || presence[s.user_id]?.status !== 'online')
  const allStaff = [...onlineStaff, ...offlineStaff]

  const handleStartMeet = () => {
    // Logic to start meeting with selectedStaff
    console.log("Starting meet with:", selectedStaff, "Mode:", meetMode)
    setShowMeetModal(false)
    if (meetMode === 'instant') {
        // Trigger generic meet logic or navigate
        onFetsMeetClick?.()
    } else {
        // Trigger planning logic
        console.log("Open planning UI")
    }
  }

  const toggleSelection = (id: string) => {
    setSelectedStaff(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  // Neumorphic styles
  const neuCard = "bg-[var(--dashboard-bg, #EEF2F9)] rounded-2xl shadow-[6px_6px_12px_var(--neu-dark-shadow,rgb(209,217,230)),-6px_-6px_12px_var(--neu-light-shadow,rgba(255,255,255,0.8))]"
  const neuBtn = "bg-[var(--dashboard-bg, #EEF2F9)] text-slate-600 font-bold rounded-xl shadow-[4px_4px_8px_var(--neu-dark-shadow,rgb(209,217,230)),-4px_-4px_8px_var(--neu-light-shadow,rgba(255,255,255,0.8))] hover:translate-y-[-1px] active:shadow-[inset_4px_4px_8px_var(--neu-dark-shadow,rgb(209,217,230)),inset_-4px_-4px_8px_var(--neu-light-shadow,rgba(255,255,255,0.8))] transition-all border border-white/40"


  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${neuCard} p-5 relative overflow-hidden flex flex-col gap-4`}
        style={{ minHeight: '380px' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-md">
              <Users size={16} className="text-white" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-700 uppercase tracking-tight">Team</h4>
              <p className="text-[8px] font-bold text-slate-400 uppercase">
                {onlineStaff.length} online
              </p>
            </div>
          </div>
        </div>

        {/* Team Members List - 2 Column Grid */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
            <div className="grid grid-cols-2 gap-3">
            {allStaff.map(agent => (
                <motion.div
                key={agent.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`flex items-center gap-3 p-2 rounded-xl border border-white/50 cursor-pointer transition-all ${openChats.find(c => c.id === agent.id) ? 'bg-white shadow-sm' : 'hover:bg-white/60'}`}
                onClick={() => !openChats.find(c => c.id === agent.id) && setOpenChats(prev => [...prev, agent])}
                >
                <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden border-2 border-white shadow-sm">
                    {agent.avatar_url ? (
                        <img src={agent.avatar_url} className="w-full h-full object-cover" alt="" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-bold bg-slate-200">
                        {agent.full_name?.[0] || '?'}
                        </div>
                    )}
                    </div>
                    {presence[agent.user_id]?.status === 'online' && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#EEF2F9] rounded-full" />
                    )}
                </div>
                <div className="min-w-0">
                    <p className="text-[11px] font-bold text-slate-700 truncate leading-tight">{agent.full_name?.split(' ')[0]}</p>
                    <p className={`text-[9px] font-bold uppercase truncate ${presence[agent.user_id]?.status === 'online' ? 'text-emerald-500' : 'text-slate-400'}`}>
                        {presence[agent.user_id]?.status === 'online' ? 'Online' : 'Away'}
                    </p>
                </div>
                </motion.div>
            ))}
            {allStaff.length === 0 && (
                 <div className="col-span-2 py-8 text-center text-slate-400 text-xs font-bold uppercase tracking-wider opacity-50">
                    No active team members
                 </div>
            )}
            </div>
        </div>

        {/* FETS MEET Section */}
        <div className="pt-3 border-t border-slate-200/60 flex flex-col gap-2">
             <div className="flex items-center gap-2 mb-1">
                <div className="h-[1px] bg-slate-200 flex-1" />
                <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest bg-[#EEF2F9] px-2">FETS MEET</span>
                <div className="h-[1px] bg-slate-200 flex-1" />
             </div>
             
             <div className="flex gap-3">
                 <button 
                    onClick={() => { setMeetMode('instant'); setShowMeetModal(true); }}
                    className={`${neuBtn} flex-1 py-3 px-2 flex flex-col items-center gap-1 group relative overflow-hidden`}
                 >
                     <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                     <Video size={18} className="text-amber-600 mb-0.5" />
                     <span className="text-[9px] font-black text-slate-600 uppercase tracking-wide">Instant Meet</span>
                 </button>
                 
                 <button 
                    onClick={() => { setMeetMode('plan'); setShowMeetModal(true); }}
                    className={`${neuBtn} flex-1 py-3 px-2 flex flex-col items-center gap-1 group relative overflow-hidden`}
                 >
                     <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                     <div className="flex gap-1 mb-0.5">
                         <Mic size={14} className="text-slate-500" />
                         <Calendar size={14} className="text-slate-500" />
                     </div>
                     <span className="text-[9px] font-black text-slate-600 uppercase tracking-wide">Plan Meet</span>
                 </button>
             </div>
        </div>
      </motion.div>


      {/* Meet Selection Modal */}
      {showMeetModal && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`${neuCard} w-full max-w-sm p-6 flex flex-col gap-4 bg-[#EEF2F9] border border-white/60`}
              >
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                      <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">
                          {meetMode === 'instant' ? 'Quick Meet' : 'Plan Session'}
                      </h3>
                      <button onClick={() => setShowMeetModal(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                          <X size={18} className="text-slate-500" />
                      </button>
                  </div>

                  <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto custom-scrollbar p-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Select Participants</span>
                      {allStaff.map(s => (
                          <div 
                            key={s.id} 
                            onClick={() => toggleSelection(s.id)}
                            className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${selectedStaff.includes(s.id) ? 'bg-amber-50 border-amber-200 shadow-sm' : 'bg-white/50 border-transparent hover:bg-white'}`}
                          >
                             <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden">
                                     <img src={s.avatar_url || `https://ui-avatars.com/api/?name=${s.full_name}`} className="w-full h-full object-cover" />
                                </div>
                                <span className={`text-sm font-bold ${selectedStaff.includes(s.id) ? 'text-slate-800' : 'text-slate-600'}`}>
                                    {s.full_name}
                                </span>
                             </div>
                             {selectedStaff.includes(s.id) && <div className="text-amber-500"><Check size={16} /></div>}
                          </div>
                      ))}
                  </div>

                  <div className="flex gap-3 pt-2">
                       {meetMode === 'plan' && (
                           <div className="flex-1 flex flex-col gap-1">
                               {/* Mock Date Picker UI for Plan Mode */}
                               <div className="h-10 bg-white rounded-lg border border-slate-200 flex items-center px-3 text-xs font-bold text-slate-500">
                                   Today, 4:00 PM
                               </div>
                           </div>
                       )}
                       
                       <button 
                         onClick={handleStartMeet}
                         className="flex-1 bg-amber-500 hover:bg-amber-600 text-white h-10 rounded-xl font-bold uppercase tracking-wider shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                       >
                           {meetMode === 'instant' ? (
                               <>Start Now <Video size={16} /></>
                           ) : (
                               <>Schedule <Calendar size={16} /></>
                           )}
                       </button>
                  </div>
              </motion.div>
          </div>
      )}


      {/* Chat Popups */}
      {openChats.map((targetUser, idx) => (
        <FetsChatPopup
          key={targetUser.id}
          targetUser={targetUser}
          onClose={() => setOpenChats(prev => prev.filter(c => c.id !== targetUser.id))}
          zIndex={2000 + idx}
        />
      ))}
    </>
  )
}

export default TeamPresence
