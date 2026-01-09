import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Calendar, Video, Users, Plus, Clock, MoreVertical, Search,
    MessageSquare, Phone, User, Globe, Shield, X, Check,
    ChevronRight, Zap, Layers, Cpu, Sparkles, RefreshCw,
    UserPlus, Activity, Database, MapPin
} from 'lucide-react'
import { format, isToday } from 'date-fns'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useGlobalCall } from '../contexts/CallContext'
import toast from 'react-hot-toast'

// --- PREMIUM UI PRIMITIVES ---

const GlassCard = ({ children, className = "", onClick }: { children: React.ReactNode, className?: string, onClick?: () => void }) => (
    <motion.div
        whileHover={onClick ? { scale: 1.01, y: -4 } : {}}
        whileTap={onClick ? { scale: 0.99 } : {}}
        onClick={onClick}
        className={`
            backdrop-blur-2xl bg-[#0a0f1d]/60 
            border border-white/10 
            shadow-[0_20px_50px_rgba(0,0,0,0.5)]
            rounded-[2.5rem] overflow-hidden
            ${className}
        `}
    >
        {children}
    </motion.div>
)

export const Frame = () => {
    const { user, profile } = useAuth()
    const { startCall } = useGlobalCall()
    const [activeTab, setActiveTab] = useState<'meet' | 'schedule'>('meet')
    const [groups, setGroups] = useState<any[]>([])
    const [meetings, setMeetings] = useState<any[]>([])
    const [staff, setStaff] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [fetchingStatus, setFetchingStatus] = useState('Loading Groups...')

    // Form States
    const [newGroupName, setNewGroupName] = useState('')
    const [newGroupDesc, setNewGroupDesc] = useState('')
    const [newGroupBranch, setNewGroupBranch] = useState('Global')
    const [selectedMembers, setSelectedMembers] = useState<string[]>([])
    const [schedTitle, setSchedTitle] = useState('')
    const [schedDate, setSchedDate] = useState('')
    const [schedTime, setSchedTime] = useState('')
    const [isScheduling, setIsScheduling] = useState(false)

    useEffect(() => {
        if (profile?.id) {
            fetchData()
            fetchStaff()
        } else if (user?.id) {
            setFetchingStatus('Checking profile...')
        } else {
            setFetchingStatus('Waiting for login...')
        }
    }, [user?.id, profile?.id])

    const fetchStaff = async () => {
        const { data } = await supabase.from('staff_profiles').select('id, full_name, avatar_url, role').order('full_name')
        if (data) setStaff(data)
    }

    const fetchData = async () => {
        if (!profile?.id) return

        setIsLoading(true)
        setFetchingStatus('Updating data...')

        try {
            // Step 1: Memberships
            const { data: memberships, error: memberErr } = await supabase
                .from('workspace_group_members')
                .select('group_id')
                .eq('user_id', profile.id)

            if (memberErr) throw memberErr
            const groupIds = memberships?.map(m => m.group_id) || []

            // Step 2: Groups
            if (groupIds.length > 0) {
                const { data: myGroups, error: groupErr } = await supabase
                    .from('workspace_groups')
                    .select('*')
                    .in('id', groupIds)
                if (groupErr) throw groupErr
                setGroups(myGroups || [])
            } else {
                setGroups([])
            }

            // Step 3: Meetings
            if (groupIds.length > 0) {
                const { data: myMeetings, error: meetErr } = await supabase
                    .from('scheduled_meetings')
                    .select('*')
                    .in('group_id', groupIds)
                    .gte('start_time', new Date().toISOString())
                    .order('start_time', { ascending: true })

                if (meetErr) throw meetErr
                setMeetings(myMeetings || [])
            } else {
                setMeetings([])
            }

        } catch (err: any) {
            console.error('Frame Fetch Error:', err)
        } finally {
            setIsLoading(false)
            setFetchingStatus('')
        }
    }

    const handleCreateGroup = async () => {
        if (!newGroupName) return toast.error('Please enter a group name')
        try {
            const { data: grp, error: createErr } = await supabase
                .from('workspace_groups')
                .insert({
                    name: newGroupName,
                    description: newGroupDesc,
                    branch_id: newGroupBranch,
                    created_by: profile.id
                })
                .select()
                .single()

            if (createErr) throw createErr

            const membersToAdd = Array.from(new Set([profile.id, ...selectedMembers]))
            const memberInserts = membersToAdd.map(uid => ({
                group_id: grp.id,
                user_id: uid,
                role: uid === profile.id ? 'admin' : 'member'
            }))

            await supabase.from('workspace_group_members').insert(memberInserts)

            toast.success('Group created successfully')
            setNewGroupName(''); setNewGroupDesc(''); setSelectedMembers([]); setShowCreateModal(false)
            fetchData()
        } catch (err) {
            toast.error('Could not create group')
        }
    }

    const handleStartCall = (groupId: string) => {
        const group = groups.find(g => g.id === groupId)
        if (!group) return

        toast.loading('Starting call...', { id: 'call-toast' })
        supabase.from('workspace_group_members')
            .select('user_id')
            .eq('group_id', groupId)
            .then(({ data }) => {
                if (data) {
                    const ids = data.map(m => m.user_id).filter(id => id !== profile.id)
                    if (ids.length > 0) {
                        toast.success(`Calling ${group.name}`, { id: 'call-toast' })
                        startCall(ids, 'video')
                    } else {
                        toast.error('No other members in this group', { id: 'call-toast' })
                    }
                }
            })
    }

    const handleScheduleMeeting = async () => {
        if (!schedTitle || !schedDate || !schedTime || groups.length === 0)
            return toast.error('Please fill in all meeting details')

        setIsScheduling(true)
        try {
            const startTime = new Date(`${schedDate}T${schedTime}`).toISOString()
            const { error } = await supabase.from('scheduled_meetings').insert({
                title: schedTitle,
                start_time: startTime,
                created_by: profile.id,
                group_id: groups[0].id, // For simplicity, uses first group
                room_url: `https://fets.live/meet/${Math.random().toString(36).substring(7)}`
            })

            if (error) throw error
            toast.success('Meeting scheduled successfully')
            setSchedTitle(''); setSchedDate(''); setSchedTime(''); setActiveTab('meet')
            fetchData()
        } catch (err) {
            toast.error('Failed to schedule meeting')
        } finally {
            setIsScheduling(false)
        }
    }

    if (isLoading && fetchingStatus !== '') {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-[#020617] text-white">
                <div className="relative mb-10">
                    <div className="w-28 h-28 rounded-full border-[1px] border-white/10 border-t-[#ffbf00] animate-spin" />
                    <Activity className="absolute inset-0 m-auto text-[#ffbf00] animate-pulse" size={36} />
                </div>
                <h2 className="font-black text-2xl uppercase tracking-[0.6em] text-white/90">Loading...</h2>
                <p className="mt-4 text-[#ffbf00] text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">{fetchingStatus}</p>
            </div>
        )
    }

    return (
        <div className="h-full flex flex-col bg-[#020617] rounded-[3.5rem] overflow-hidden border border-white/5 font-sans text-white">

            {/* --- TOP HEADER --- */}
            <header className="bg-slate-900/40 backdrop-blur-3xl border-b border-white/5 px-12 py-8 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-10">
                    <div className="relative group cursor-pointer" onClick={fetchData}>
                        <div className="absolute inset-0 bg-[#ffbf00] rounded-2xl blur-3xl opacity-10 group-hover:opacity-30 transition-opacity" />
                        <div className="w-16 h-16 bg-black rounded-[1.5rem] flex items-center justify-center text-[#ffbf00] border border-white/10 shadow-2xl relative z-10">
                            <Users size={32} strokeWidth={2.5} />
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center gap-5">
                            <h2 className="font-black text-4xl uppercase tracking-tighter">Team Hub</h2>
                            <div className="px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                                <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Active Workspace</span>
                            </div>
                        </div>
                        <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.7em] mt-2">Connect and Collaborate</p>
                    </div>
                </div>

                <div className="flex items-center gap-8">
                    <div className="hidden 2xl:flex flex-col items-end">
                        <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.4em] mb-1">Signed in as</span>
                        <span className="text-sm font-black text-[#ffbf00]">{profile?.full_name?.toUpperCase()}</span>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-3 px-8 py-5 bg-[#ffbf00] text-black rounded-3xl font-black text-xs uppercase tracking-widest group shadow-[0_15px_40px_rgba(255,191,0,0.2)] hover:scale-105 active:scale-95 transition-all"
                        >
                            <Plus size={22} strokeWidth={3} className="group-hover:rotate-90 transition-transform duration-500" />
                            Create Group
                        </button>
                    </div>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* --- NAVIGATION SIDEBAR --- */}
                <aside className="w-80 bg-slate-950/20 border-r border-white/5 p-10 flex flex-col gap-12 shrink-0">
                    <nav className="space-y-6">
                        <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.6em] px-3">Menu</h3>
                        <div className="space-y-3">
                            <button
                                onClick={() => setActiveTab('meet')}
                                className={`w-full p-5 rounded-[2.2rem] flex items-center gap-4 transition-all group relative overflow-hidden ${activeTab === 'meet' ? 'bg-[#ffbf00] text-black shadow-[0_15px_30px_rgba(255,191,0,0.2)]' : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white'}`}
                            >
                                <Video size={18} strokeWidth={2.5} />
                                <span className="font-black text-xs uppercase tracking-widest">Team Video</span>
                                {activeTab === 'meet' && <div className="absolute right-6 w-2 h-2 rounded-full bg-black/40" />}
                            </button>
                            <button
                                onClick={() => setActiveTab('schedule')}
                                className={`w-full p-5 rounded-[2.2rem] flex items-center gap-4 transition-all group relative overflow-hidden ${activeTab === 'schedule' ? 'bg-[#ffbf00] text-black shadow-[0_15px_30px_rgba(255,191,0,0.2)]' : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white'}`}
                            >
                                <Calendar size={18} strokeWidth={2.5} />
                                <span className="font-black text-xs uppercase tracking-widest">Meetings</span>
                                {activeTab === 'schedule' && <div className="absolute right-6 w-2 h-2 rounded-full bg-black/40" />}
                            </button>
                        </div>
                    </nav>

                    <div className="flex-1 flex flex-col min-h-0">
                        <div className="flex items-center justify-between px-3 mb-6">
                            <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.6em]">My Groups</h3>
                            <span className="text-[10px] font-black text-[#ffbf00] px-3 py-1 bg-[#ffbf00]/10 rounded-full">{groups.length}</span>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-3 custom-scrollbar space-y-4">
                            {groups.length === 0 ? (
                                <div className="p-12 text-center border border-white/5 rounded-[3rem] bg-white/[0.02]">
                                    <Globe size={32} className="mx-auto mb-6 text-white/5" />
                                    <p className="text-[9px] font-black text-white/10 uppercase tracking-[0.5em] leading-relaxed">No groups found.</p>
                                </div>
                            ) : groups.map(group => (
                                <motion.div
                                    key={group.id}
                                    whileHover={{ x: 8 }}
                                    onClick={() => handleStartCall(group.id)}
                                    className="p-6 bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 rounded-[2.5rem] cursor-pointer flex items-center gap-5 transition-all group"
                                >
                                    <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center relative group-hover:border-[#ffbf00]/40 border border-white/10 transition-colors">
                                        <Users size={20} className="text-white/20 group-hover:text-[#ffbf00] transition-colors" />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-xs font-black text-white group-hover:text-[#ffbf00] transition-colors truncate tracking-tight uppercase tracking-wider">{group.name}</span>
                                        <span className="text-[9px] font-black text-white/15 uppercase tracking-[0.3em] mt-1">{group.branch_id || 'Global'}</span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </aside>

                {/* --- CONTENT AREA --- */}
                <main className="flex-1 p-16 overflow-y-auto custom-scrollbar relative">
                    <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-500/5 rounded-full blur-[150px] pointer-events-none" />

                    <AnimatePresence mode="wait">
                        {activeTab === 'meet' && (
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -30 }}
                                className="max-w-6xl mx-auto space-y-16"
                            >
                                <div className="flex items-end justify-between">
                                    <div>
                                        <h3 className="text-6xl font-black uppercase tracking-tighter mb-4">Team Hub</h3>
                                        <p className="text-white/20 text-base font-bold uppercase tracking-[0.6em]">Quick Calls and Team Planning</p>
                                    </div>
                                    <div className="flex items-center gap-4 px-8 py-4 bg-emerald-500/5 rounded-[2rem] border border-emerald-500/10">
                                        <Activity size={18} className="text-emerald-400" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-400">System is Online</span>
                                    </div>
                                </div>

                                {/* Quick Actions */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                    <GlassCard
                                        onClick={() => groups.length > 0 ? handleStartCall(groups[0].id) : setShowCreateModal(true)}
                                        className="relative h-80 p-12 group cursor-pointer border-[#ffbf00]/10 bg-gradient-to-br from-[#ffbf00]/5 to-transparent shadow-[0_40px_80px_rgba(255,191,0,0.1)]"
                                    >
                                        <div className="absolute -top-10 -right-10 text-[#ffbf00]/5 group-hover:text-[#ffbf00]/10 transition-all">
                                            <Video size={300} strokeWidth={1} />
                                        </div>
                                        <div className="relative z-10 h-full flex flex-col justify-between">
                                            <div className="w-20 h-20 rounded-[2rem] bg-[#ffbf00] text-black flex items-center justify-center shadow-2xl">
                                                <Zap size={40} strokeWidth={2.5} />
                                            </div>
                                            <div>
                                                <h3 className="text-5xl font-black uppercase tracking-tighter mb-4">Start Call</h3>
                                                <p className="text-white/40 text-lg font-bold leading-relaxed max-w-sm">Start an instant video call with your group members.</p>
                                            </div>
                                        </div>
                                    </GlassCard>

                                    <GlassCard
                                        onClick={() => setShowCreateModal(true)}
                                        className="relative h-80 p-12 group cursor-pointer bg-gradient-to-br from-indigo-500/10 to-transparent border-indigo-500/10"
                                    >
                                        <div className="absolute -top-10 -right-10 text-indigo-500/5 group-hover:text-indigo-500/10 transition-all">
                                            <Sparkles size={300} strokeWidth={1} />
                                        </div>
                                        <div className="relative z-10 h-full flex flex-col justify-between">
                                            <div className="w-20 h-20 rounded-[2rem] bg-indigo-600 text-white flex items-center justify-center shadow-2xl">
                                                <UserPlus size={40} strokeWidth={2.5} />
                                            </div>
                                            <div>
                                                <h3 className="text-5xl font-black uppercase tracking-tighter mb-4">New Group</h3>
                                                <p className="text-white/40 text-lg font-bold leading-relaxed max-w-sm">Create a new team group to collaborate and meet.</p>
                                            </div>
                                        </div>
                                    </GlassCard>
                                </div>

                                {/* Scheduled Meetings List */}
                                <div className="space-y-8">
                                    <div className="flex items-center gap-5 px-3">
                                        <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                            <Calendar size={22} />
                                        </div>
                                        <h3 className="font-black text-xs uppercase tracking-[0.7em] text-white/30">Scheduled Meetings</h3>
                                    </div>

                                    <div className="space-y-6">
                                        {meetings.length === 0 ? (
                                            <div className="py-36 text-center bg-white/[0.01] border-2 border-dashed border-white/5 rounded-[4rem]">
                                                <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-10">
                                                    <Calendar size={40} className="text-white/10" />
                                                </div>
                                                <p className="font-black text-xl uppercase tracking-[0.5em] text-white/10">No upcoming meetings</p>
                                                <button onClick={() => setActiveTab('schedule')} className="mt-8 text-xs font-black uppercase tracking-[0.4em] text-[#ffbf00] border-b border-[#ffbf00]/50 hover:text-white hover:border-white transition-all pb-1">Schedule Now</button>
                                            </div>
                                        ) : (
                                            meetings.map((meeting) => (
                                                <GlassCard
                                                    key={meeting.id}
                                                    className="p-12 hover:bg-white/[0.06] transition-all border-[#ffbf00]/10"
                                                >
                                                    <div className="flex items-center justify-between gap-12">
                                                        <div className="flex items-center gap-16 grow min-w-0">
                                                            <div className="flex flex-col items-center shrink-0 w-28">
                                                                <span className="text-5xl font-black text-[#ffbf00] tracking-tighter tabular-nums">{format(new Date(meeting.start_time), 'HH:mm')}</span>
                                                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 mt-2">{format(new Date(meeting.start_time), 'dd MMM')}</span>
                                                            </div>
                                                            <div className="h-20 w-[1px] bg-white/10 shrink-0" />
                                                            <div className="min-w-0">
                                                                <div className="flex items-center gap-5 mb-3">
                                                                    <h4 className="text-4xl font-black text-white tracking-tight truncate uppercase tracking-wider">{meeting.title}</h4>
                                                                    <div className="px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[9px] font-black uppercase tracking-[0.3em] text-indigo-400 shrink-0">
                                                                        Secure Meeting
                                                                    </div>
                                                                </div>
                                                                <p className="text-lg text-white/40 font-bold truncate max-w-2xl">{meeting.description || 'Team meeting is ready.'}</p>
                                                            </div>
                                                        </div>
                                                        <a
                                                            href={meeting.room_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="shrink-0 px-14 py-7 bg-white text-black rounded-[2.5rem] font-black text-sm uppercase tracking-[0.3em] shadow-2xl hover:scale-105 active:scale-95 transition-all hover:bg-[#ffbf00]"
                                                        >
                                                            Join Meeting
                                                        </a>
                                                    </div>
                                                </GlassCard>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'schedule' && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.96 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.96 }}
                                className="max-w-4xl mx-auto"
                            >
                                <GlassCard className="p-20 relative overflow-hidden group border-[#ffbf00]/20 min-h-[700px] flex flex-col justify-center">
                                    <div className="absolute -top-40 -right-40 p-20 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity rotate-12">
                                        <Calendar size={600} />
                                    </div>

                                    <div className="relative z-10 space-y-16">
                                        <div>
                                            <div className="w-20 h-20 rounded-[2rem] bg-[#ffbf00]/10 border border-[#ffbf00]/20 text-[#ffbf00] flex items-center justify-center mb-10">
                                                <Clock size={40} />
                                            </div>
                                            <h2 className="text-6xl font-black uppercase tracking-tighter mb-4 leading-none">Schedule Meeting</h2>
                                            <p className="text-white/20 text-base font-bold uppercase tracking-[0.8em]">Plan your next team meeting</p>
                                        </div>

                                        <div className="space-y-12">
                                            <div className="space-y-5">
                                                <label className="text-xs font-black uppercase tracking-[0.8em] text-white/10 ml-6">Meeting Title</label>
                                                <input
                                                    type="text"
                                                    value={schedTitle}
                                                    onChange={e => setSchedTitle(e.target.value)}
                                                    className="w-full bg-black border-2 border-white/5 rounded-[3rem] p-10 font-black text-3xl text-white focus:border-[#ffbf00]/40 outline-none transition-all placeholder:text-white/5"
                                                    placeholder="Enter Title..."
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-12">
                                                <div className="space-y-5">
                                                    <label className="text-xs font-black uppercase tracking-[0.8em] text-white/10 ml-6">Date</label>
                                                    <input
                                                        type="date"
                                                        value={schedDate}
                                                        onChange={e => setSchedDate(e.target.value)}
                                                        className="w-full bg-black border-2 border-white/5 rounded-[2.5rem] p-10 font-black text-xl text-white focus:border-[#ffbf00]/40 outline-none transition-all"
                                                    />
                                                </div>
                                                <div className="space-y-5">
                                                    <label className="text-xs font-black uppercase tracking-[0.8em] text-white/10 ml-6">Time</label>
                                                    <input
                                                        type="time"
                                                        value={schedTime}
                                                        onChange={e => setSchedTime(e.target.value)}
                                                        className="w-full bg-black border-2 border-white/5 rounded-[2.5rem] p-10 font-black text-xl text-white focus:border-[#ffbf00]/40 outline-none transition-all"
                                                    />
                                                </div>
                                            </div>

                                            <button
                                                onClick={handleScheduleMeeting}
                                                disabled={isScheduling}
                                                className="w-full py-10 bg-[#ffbf00] text-black rounded-[3.5rem] font-black uppercase tracking-[0.5em] text-base hover:scale-[1.03] shadow-[0_30px_80px_rgba(255,191,0,0.3)] transition-all active:scale-[0.98] disabled:opacity-50"
                                            >
                                                {isScheduling ? 'Saving...' : 'Confirm Meeting'}
                                            </button>
                                        </div>
                                    </div>
                                </GlassCard>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </main>
            </div>

            {/* --- CREATE MODAL --- */}
            <AnimatePresence>
                {showCreateModal && (
                    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-12 bg-black/95 backdrop-blur-3xl">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 100 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 100 }}
                            className="bg-slate-900 border border-white/10 rounded-[5rem] p-20 max-w-3xl w-full shadow-[0_60px_200px_rgba(0,0,0,1)] relative overflow-hidden"
                        >
                            <div className="absolute -top-20 -right-20 text-[#ffbf00]/5 pointer-events-none rotate-45">
                                <Zap size={400} />
                            </div>

                            <div className="flex justify-between items-center mb-16 relative z-10">
                                <div>
                                    <h2 className="text-5xl font-black uppercase tracking-tighter text-white">New Group</h2>
                                    <p className="text-xs font-black text-[#ffbf00] uppercase tracking-[0.8em] mt-3">Create a new team group</p>
                                </div>
                                <button onClick={() => setShowCreateModal(false)} className="p-5 hover:bg-white/5 rounded-full transition-colors text-white/20 hover:text-white"><X size={40} /></button>
                            </div>

                            <div className="space-y-12 relative z-10">
                                <div className="space-y-5">
                                    <label className="text-xs font-black uppercase tracking-[1em] text-white/10 ml-8">Group Name</label>
                                    <input
                                        type="text"
                                        value={newGroupName}
                                        onChange={(e) => setNewGroupName(e.target.value)}
                                        className="w-full bg-black border-2 border-white/5 rounded-[3rem] p-10 font-black text-3xl text-white focus:border-[#ffbf00]/40 outline-none transition-all placeholder:text-white/5"
                                        placeholder="Team Name..."
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-10">
                                    <div className="space-y-5">
                                        <label className="text-xs font-black uppercase tracking-[1em] text-white/10 ml-8">Location</label>
                                        <select
                                            value={newGroupBranch}
                                            onChange={e => setNewGroupBranch(e.target.value)}
                                            className="w-full bg-black border-2 border-white/5 rounded-[2.5rem] p-10 font-black text-xl text-white focus:border-[#ffbf00]/40 outline-none transition-all appearance-none text-center"
                                        >
                                            <option value="Global">GLOBAL</option>
                                            <option value="Calicut">CALICUT</option>
                                            <option value="Cochin">COCHIN</option>
                                            <option value="Kannur">KANNUR</option>
                                            <option value="Trivandrum">TRIVANDRUM</option>
                                        </select>
                                    </div>

                                    <div className="space-y-5">
                                        <label className="text-xs font-black uppercase tracking-[1em] text-white/10 ml-8">Add Members</label>
                                        <div className="bg-black border-2 border-white/5 rounded-[2.5rem] p-6 max-h-48 overflow-y-auto custom-scrollbar flex flex-col gap-2">
                                            {staff.filter(s => s.id !== profile?.id).map(s => (
                                                <button
                                                    key={s.id}
                                                    onClick={() => {
                                                        setSelectedMembers(prev =>
                                                            prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id]
                                                        )
                                                    }}
                                                    className={`p-4 rounded-2xl flex items-center justify-between transition-all ${selectedMembers.includes(s.id) ? 'bg-[#ffbf00] text-black shadow-lg' : 'hover:bg-white/5 text-white/30'}`}
                                                >
                                                    <span className="text-[10px] font-black uppercase tracking-widest truncate">{s.full_name}</span>
                                                    {selectedMembers.includes(s.id) ? <Check size={14} strokeWidth={4} /> : <div className="w-4 h-4 rounded-full border border-white/10" />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-8 pt-10">
                                    <button
                                        onClick={() => setShowCreateModal(false)}
                                        className="flex-1 py-8 rounded-[3.5rem] bg-white/5 border border-white/10 text-white/20 font-black uppercase tracking-[1em] text-xs hover:text-white transition-all underline underline-offset-8"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleCreateGroup}
                                        disabled={!newGroupName}
                                        className="flex-1 py-8 rounded-[3.5rem] bg-[#ffbf00] text-black font-black uppercase tracking-[0.6em] text-xs shadow-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                                    >
                                        Create Group
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
