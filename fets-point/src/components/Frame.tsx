import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Video, Users, Plus, Clock, MoreVertical, Search, MessageSquare, Phone, User, Globe, Shield, X, Check } from 'lucide-react'
import { format, isToday } from 'date-fns'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'

export const Frame = () => {
    const { user, profile } = useAuth()
    const [activeTab, setActiveTab] = useState<'meet' | 'schedule'>('meet')
    const [groups, setGroups] = useState<any[]>([])
    const [meetings, setMeetings] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [showCreateMajor, setShowCreateMajor] = useState(false)

    // Create Group States
    const [newGroupName, setNewGroupName] = useState('')
    const [newGroupDesc, setNewGroupDesc] = useState('')

    useEffect(() => {
        fetchData()
    }, [user?.id])

    const fetchData = async () => {
        if (!user?.id) return
        setIsLoading(true)
        try {
            // Fetch Groups I am a member of
            const { data: myGroups, error: groupErr } = await supabase
                .from('workspace_groups')
                .select(`
                    *,
                    workspace_group_members!inner(user_id)
                `)
                .eq('workspace_group_members.user_id', user.id)

            if (groupErr) throw groupErr
            setGroups(myGroups || [])

            // Fetch Meetings for today
            const { data: myMeetings, error: meetErr } = await supabase
                .from('scheduled_meetings')
                .select('*')
                .order('start_time', { ascending: true })

            if (meetErr) throw meetErr
            setMeetings(myMeetings || [])

        } catch (err: any) {
            console.error('Frame Fetch Error:', err)
            // toast.error('Failed to load workspace data')
        } finally {
            setIsLoading(false)
        }
    }

    const handleCreateGroup = async () => {
        if (!newGroupName) return toast.error('Group name required')
        try {
            const { data: grp, error: createErr } = await supabase
                .from('workspace_groups')
                .insert({
                    name: newGroupName,
                    description: newGroupDesc,
                    created_by: user?.id
                })
                .select()
                .single()

            if (createErr) throw createErr

            // Add self as Admin
            await supabase.from('workspace_group_members').insert({
                group_id: grp.id,
                user_id: user?.id,
                role: 'admin'
            })

            toast.success('Group Created')
            setNewGroupName('')
            setNewGroupDesc('')
            setShowCreateMajor(false)
            fetchData()
        } catch (err) {
            toast.error('Failed to create group')
        }
    }

    return (
        <div className="h-full flex flex-col bg-[#0f172a] rounded-[40px] overflow-hidden shadow-2xl border border-white/5 font-sans text-slate-200">

            {/* Header */}
            <div className="bg-slate-900/50 backdrop-blur-xl border-b border-white/5 p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#ffbf00] rounded-2xl flex items-center justify-center text-black border border-white/20 shadow-[0_0_30px_rgba(255,191,0,0.2)]">
                        <Video size={24} />
                    </div>
                    <div>
                        <h2 className="font-black text-2xl uppercase tracking-tighter text-white">Frame</h2>
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em]">Neural Collaboration Node</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowCreateMajor(true)}
                        className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5 text-white/60 hover:text-white"
                    >
                        <Plus size={20} />
                    </button>
                    <div className="h-8 w-[1px] bg-white/5 mx-2" />
                    <div className="flex -space-x-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center overflow-hidden">
                                <User size={14} className="text-white/20" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar */}
                <div className="w-72 bg-slate-950/30 border-r border-white/5 p-6 flex flex-col gap-3">
                    <button
                        onClick={() => setActiveTab('meet')}
                        className={`p-4 rounded-2xl flex items-center gap-4 transition-all group ${activeTab === 'meet' ? 'bg-[#ffbf00] text-black shadow-[0_0_40px_rgba(255,191,0,0.2)]' : 'bg-white/5 hover:bg-white/10 text-white/60'}`}
                    >
                        <Video size={18} className={activeTab === 'meet' ? '' : 'group-hover:scale-110 transition-transform'} />
                        <span className="font-black text-xs uppercase tracking-widest">Conference</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('schedule')}
                        className={`p-4 rounded-2xl flex items-center gap-4 transition-all group ${activeTab === 'schedule' ? 'bg-[#ffbf00] text-black shadow-[0_0_40px_rgba(255,191,0,0.2)]' : 'bg-white/5 hover:bg-white/10 text-white/60'}`}
                    >
                        <Calendar size={18} className={activeTab === 'schedule' ? '' : 'group-hover:scale-110 transition-transform'} />
                        <span className="font-black text-xs uppercase tracking-widest">Schedule</span>
                    </button>

                    <div className="mt-10">
                        <div className="flex items-center justify-between px-2 mb-4">
                            <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Active Groups</h3>
                            <button onClick={() => setShowCreateMajor(true)} className="text-white/20 hover:text-[#ffbf00] transition-colors"><Plus size={14} /></button>
                        </div>
                        <div className="space-y-2 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                            {isLoading ? (
                                <div className="p-4 text-center text-white/10 text-[10px] font-bold uppercase tracking-widest">Loading Neural Links...</div>
                            ) : groups.length === 0 ? (
                                <div className="p-8 text-center border-2 border-dashed border-white/5 rounded-2xl">
                                    <Globe size={24} className="mx-auto mb-3 opacity-10" />
                                    <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest leading-relaxed">No clusters found.<br />Initialize a group.</p>
                                </div>
                            ) : groups.map(group => (
                                <motion.div
                                    key={group.id}
                                    whileHover={{ x: 4 }}
                                    className="p-4 hover:bg-white/5 border border-transparent hover:border-white/5 rounded-2xl cursor-pointer flex items-center gap-3 transition-all group"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center border border-white/5 group-hover:bg-[#ffbf00]/10 group-hover:border-[#ffbf00]/30 transition-colors">
                                        <Users size={16} className="text-white/20 group-hover:text-[#ffbf00] transition-colors" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-black text-white group-hover:text-[#ffbf00] transition-colors">{group.name}</span>
                                        <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest">{group.description || 'System Cluster'}</span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 p-8 overflow-y-auto custom-scrollbar bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-500/5 via-transparent to-transparent">
                    {activeTab === 'meet' && (
                        <div className="max-w-5xl mx-auto space-y-10">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <motion.div
                                    whileHover={{ y: -5 }}
                                    className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[32px] p-8 text-white border border-white/10 shadow-[0_20px_50px_rgba(79,70,229,0.3)] flex flex-col justify-between h-64 cursor-pointer relative overflow-hidden group"
                                >
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32 group-hover:bg-white/20 transition-all duration-700" />
                                    <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/10">
                                        <Video size={32} />
                                    </div>
                                    <div>
                                        <h3 className="text-3xl font-black uppercase tracking-tighter mb-2">Instant Session</h3>
                                        <p className="text-white/70 text-sm font-bold leading-relaxed max-w-xs">Initialize an immediate neural link with your active cluster.</p>
                                    </div>
                                    <div className="absolute bottom-8 right-8 w-12 h-12 rounded-full bg-white text-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                                        <Plus size={24} />
                                    </div>
                                </motion.div>

                                <motion.div
                                    whileHover={{ y: -5 }}
                                    onClick={() => setShowCreateMajor(true)}
                                    className="bg-slate-900 rounded-[32px] p-8 text-white border border-white/5 shadow-2xl flex flex-col justify-between h-64 cursor-pointer group hover:bg-slate-800 transition-all duration-500"
                                >
                                    <div className="bg-white/5 group-hover:bg-[#ffbf00]/10 w-16 h-16 rounded-2xl flex items-center justify-center border border-white/5 group-hover:border-[#ffbf00]/20 transition-all">
                                        <Shield size={32} className="group-hover:text-[#ffbf00] transition-colors" />
                                    </div>
                                    <div>
                                        <h3 className="text-3xl font-black uppercase tracking-tighter mb-2 group-hover:text-[#ffbf00] transition-colors">Create Cluster</h3>
                                        <p className="text-white/30 text-sm font-bold leading-relaxed max-w-xs">Establish a permanent encrypted workspace for recurring intelligence sharing.</p>
                                    </div>
                                </motion.div>
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-center justify-between px-2">
                                    <div className="flex items-center gap-3">
                                        <Clock size={16} className="text-[#ffbf00]" />
                                        <h3 className="font-black text-xs uppercase tracking-[0.3em] text-white/40">Today's Tactical Schedule</h3>
                                    </div>
                                    <button className="text-[10px] font-black text-[#ffbf00] hover:underline tracking-widest uppercase">Grid Overview</button>
                                </div>

                                <div className="bg-slate-900/50 rounded-[32px] border border-white/5 overflow-hidden backdrop-blur-sm">
                                    <div className="divide-y divide-white/5">
                                        {meetings.filter(m => isToday(new Date(m.start_time))).length === 0 ? (
                                            <div className="p-16 text-center text-white/10">
                                                <Calendar size={48} className="mx-auto mb-4 opacity-10" />
                                                <p className="font-black text-xs uppercase tracking-[0.4em]">No sessions scheduled for current cycle</p>
                                            </div>
                                        ) : (
                                            meetings.filter(m => isToday(new Date(m.start_time))).map(meeting => (
                                                <div key={meeting.id} className="p-6 flex items-center justify-between hover:bg-white/5 transition-colors group">
                                                    <div className="flex items-center gap-6">
                                                        <div className="flex flex-col items-center">
                                                            <span className="text-xl font-black text-white">{format(new Date(meeting.start_time), 'HH:mm')}</span>
                                                            <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Uplink</span>
                                                        </div>
                                                        <div className="h-10 w-[1px] bg-white/5" />
                                                        <div>
                                                            <h4 className="text-lg font-black text-white group-hover:text-[#ffbf00] transition-colors">{meeting.title}</h4>
                                                            <p className="text-sm text-white/40 font-bold">{meeting.description || 'Routine Operational Sync'}</p>
                                                        </div>
                                                    </div>
                                                    <button className="px-6 py-3 bg-[#ffbf00] text-black rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[#ffbf00]/10">
                                                        Establish Link
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'schedule' && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="max-w-2xl mx-auto bg-slate-900 rounded-[40px] border border-white/10 p-10 shadow-2xl relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                <Calendar size={120} />
                            </div>
                            <h2 className="text-3xl font-black uppercase tracking-tighter text-white mb-8">Schedule Session</h2>
                            <div className="space-y-6 relative z-10">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 ml-2">Meeting Protocol Title</label>
                                    <input type="text" className="w-full bg-slate-800/50 border border-white/5 rounded-2xl p-4 font-bold text-white focus:border-[#ffbf00]/50 outline-none transition-all placeholder:text-white/10" placeholder="e.g., Tactical Alpha Analysis" />
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 ml-2">Cycle Date</label>
                                        <input type="date" className="w-full bg-slate-800/50 border border-white/5 rounded-2xl p-4 font-bold text-white focus:border-[#ffbf00]/50 outline-none transition-all" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 ml-2">Uplink Time</label>
                                        <input type="time" className="w-full bg-slate-800/50 border border-white/5 rounded-2xl p-4 font-bold text-white focus:border-[#ffbf00]/50 outline-none transition-all" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 ml-2">Neural Cluster Participants</label>
                                    <div className="w-full bg-slate-800/50 border border-white/5 rounded-2xl p-4 flex flex-wrap gap-2 min-h-[60px] cursor-pointer hover:border-white/10 transition-all">
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-xl text-[10px] font-bold text-white/40 uppercase tracking-widest border border-white/5">
                                            <Search size={12} />
                                            Select Operatives...
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => toast.success('Protocol Initiated - Invites Sent')}
                                    className="w-full py-5 bg-[#ffbf00] text-black rounded-3xl font-black uppercase tracking-[0.2em] text-xs hover:bg-[#ffe16b] transition-all shadow-xl shadow-[#ffbf00]/20 mt-6 active:scale-[0.98]"
                                >
                                    Broadcast Invites
                                </button>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Create Group Modal */}
            <AnimatePresence>
                {showCreateMajor && (
                    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-slate-900 border border-white/10 rounded-[40px] p-8 max-w-lg w-full shadow-[0_0_100px_rgba(0,0,0,0.5)]"
                        >
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-2xl font-black uppercase tracking-tighter text-white">Initialize Cluster</h2>
                                <button onClick={() => setShowCreateMajor(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors"><X size={24} /></button>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 ml-1">Cluster Designation</label>
                                    <input
                                        type="text"
                                        value={newGroupName}
                                        onChange={(e) => setNewGroupName(e.target.value)}
                                        className="w-full bg-slate-800/50 border border-white/5 rounded-2xl p-4 font-bold text-white focus:border-[#ffbf00]/50 outline-none"
                                        placeholder="e.g., Operation Skyline"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 ml-1">Mission Objective</label>
                                    <textarea
                                        rows={3}
                                        value={newGroupDesc}
                                        onChange={(e) => setNewGroupDesc(e.target.value)}
                                        className="w-full bg-slate-800/50 border border-white/5 rounded-2xl p-4 font-bold text-white focus:border-[#ffbf00]/50 outline-none resize-none"
                                        placeholder="Briefly describe the cluster mission..."
                                    />
                                </div>

                                <div className="flex items-center gap-4 pt-4">
                                    <button
                                        onClick={() => setShowCreateMajor(false)}
                                        className="flex-1 py-4 rounded-2xl bg-white/5 border border-white/5 text-white/30 font-black uppercase tracking-widest text-[10px] hover:text-white transition-all"
                                    >
                                        Abort
                                    </button>
                                    <button
                                        onClick={handleCreateGroup}
                                        disabled={!newGroupName}
                                        className="flex-1 py-4 rounded-2xl bg-[#ffbf00] text-black font-black uppercase tracking-widest text-[10px] shadow-lg shadow-[#ffbf00]/10 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                                    >
                                        Initialize
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}
