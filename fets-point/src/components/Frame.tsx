import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Calendar, Video, Users, Plus, Clock, Search,
    Phone, Globe, X, Check,
    ChevronRight, Activity, MapPin, Loader2,
    MessageCircle, Mic, Monitor, Settings, Sparkles
} from 'lucide-react'
import { format } from 'date-fns'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useGlobalCall } from '../contexts/CallContext'
import toast from 'react-hot-toast'

// --- PURE VISION OS / LIQUID GLASS COMPONENTS ---

const LiquidBackground = () => (
    <div className="absolute inset-0 z-0 overflow-hidden bg-black">
        <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-indigo-600/30 rounded-full blur-[120px] mix-blend-screen animate-pulse duration-[10s]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-blue-500/20 rounded-full blur-[100px] mix-blend-screen animate-pulse duration-[7s]" />
        <div className="absolute top-[30%] left-[30%] w-[40vw] h-[40vw] bg-purple-500/20 rounded-full blur-[80px] mix-blend-screen" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay" />
    </div>
)

const GlassPanel = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
    <div className={`
        relative backdrop-blur-3xl saturate-150
        bg-white/5 
        border border-white/10
        shadow-[0_8px_32px_0_rgba(0,0,0,0.36)]
        rounded-[32px]
        ${className}
    `}>
        {/* Specular Highlight Top Edge */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50" />
        {children}
    </div>
)

const NavButton = ({ active, icon: Icon, label, onClick }: any) => (
    <button
        onClick={onClick}
        className={`
            relative group flex flex-col items-center justify-center p-4 rounded-[24px] transition-all duration-300 w-24 h-24
            ${active
                ? 'bg-white/10 shadow-[inner_0_0_20px_rgba(255,255,255,0.1)] border border-white/20'
                : 'hover:bg-white/5 border border-transparent'}
        `}
    >
        <span className={`
            p-3 rounded-2xl mb-2 transition-all duration-300
            ${active ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.5)]' : 'bg-white/5 text-white/60 group-hover:text-white group-hover:bg-white/10'}
        `}>
            <Icon size={24} strokeWidth={active ? 2.5 : 1.5} />
        </span>
        <span className={`text-[11px] font-medium tracking-wide ${active ? 'text-white' : 'text-white/40 group-hover:text-white/80'}`}>
            {label}
        </span>
    </button>
)

export const Frame = () => {
    const { user, profile } = useAuth()
    const { startCall } = useGlobalCall()
    const [activeTab, setActiveTab] = useState<'calls' | 'schedule'>('calls')
    const [groups, setGroups] = useState<any[]>([])
    const [meetings, setMeetings] = useState<any[]>([])
    const [staff, setStaff] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [showNewGroup, setShowNewGroup] = useState(false)
    const [showNewMeeting, setShowNewMeeting] = useState(false)

    // Form States
    const [groupName, setGroupName] = useState('')
    const [groupDesc, setGroupDesc] = useState('')
    const [selectedMembers, setSelectedMembers] = useState<string[]>([])
    const [meetingTitle, setMeetingTitle] = useState('')
    const [meetingDate, setMeetingDate] = useState('')
    const [meetingTime, setMeetingTime] = useState('')

    useEffect(() => {
        if (profile?.id) {
            fetchData()
            fetchStaff()
        }
    }, [profile?.id])

    const fetchStaff = async () => {
        const { data } = await supabase.from('staff_profiles').select('id, full_name, avatar_url, role').order('full_name')
        if (data) setStaff(data)
    }

    const fetchData = async () => {
        if (!profile?.id) return

        setIsLoading(true)
        try {
            const { data: memberships } = await supabase
                .from('workspace_group_members')
                .select('group_id')
                .eq('user_id', profile.id)

            const groupIds = memberships?.map(m => m.group_id) || []

            if (groupIds.length > 0) {
                const { data: myGroups } = await supabase
                    .from('workspace_groups')
                    .select('*')
                    .in('id', groupIds)
                setGroups(myGroups || [])

                const { data: myMeetings } = await supabase
                    .from('scheduled_meetings')
                    .select('*')
                    .in('group_id', groupIds)
                    .gte('start_time', new Date().toISOString())
                    .order('start_time', { ascending: true })

                setMeetings(myMeetings || [])
            } else {
                setGroups([])
                setMeetings([])
            }
        } catch (err) {
            console.error(err)
        } finally {
            setIsLoading(false)
        }
    }

    const handleCreateGroup = async () => {
        if (!groupName) return toast.error('Check Name')
        try {
            const { data: grp } = await supabase
                .from('workspace_groups')
                .insert({ name: groupName, description: groupDesc, branch_id: 'Global', created_by: profile.id })
                .select().single()

            if (!grp) throw new Error()

            const members = [...new Set([profile.id, ...selectedMembers])].map(uid => ({
                group_id: grp.id, user_id: uid, role: uid === profile.id ? 'admin' : 'member'
            }))
            await supabase.from('workspace_group_members').insert(members)

            toast.success('Group Ready')
            setGroupName(''); setGroupDesc(''); setSelectedMembers([]); setShowNewGroup(false)
            fetchData()
        } catch { toast.error('Error Creating Group') }
    }

    const handleStartCall = (groupId: string) => {
        const group = groups.find(g => g.id === groupId)
        supabase.from('workspace_group_members').select('user_id').eq('group_id', groupId)
            .then(({ data }) => {
                const ids = data?.map(m => m.user_id).filter(id => id !== profile.id) || []
                if (ids.length) {
                    toast.success(`Calling ${group.name}`)
                    startCall(ids, 'video')
                } else {
                    toast.error('Group is empty')
                }
            })
    }

    const handleScheduleMeeting = async () => {
        if (!meetingTitle || !meetingDate || !meetingTime || !groups.length) return toast.error('Fill Details')
        try {
            await supabase.from('scheduled_meetings').insert({
                title: meetingTitle,
                start_time: new Date(`${meetingDate}T${meetingTime}`).toISOString(),
                created_by: profile.id,
                group_id: groups[0].id,
                room_url: `https://fets.live/meet/${Math.random().toString(36).substring(7)}`
            })
            toast.success('Scheduled')
            setShowNewMeeting(false); fetchData()
        } catch { toast.error('Error Scheduling') }
    }

    if (isLoading) return <div className="h-full bg-black flex items-center justify-center"><Loader2 className="animate-spin text-white/50" /></div>

    return (
        <div className="h-full relative flex overflow-hidden font-sans select-none bg-black text-white">
            <LiquidBackground />

            {/* --- MAIN GLASS CONTAINER --- */}
            <div className="relative z-10 w-full h-full p-8 flex gap-8">

                {/* --- SIDEBAR NAVIGATION (Floating Glass) --- */}
                <GlassPanel className="w-28 flex flex-col items-center py-8 gap-4 shrink-0">
                    <NavButton active={activeTab === 'calls'} icon={Video} label="Calls" onClick={() => setActiveTab('calls')} />
                    <NavButton active={activeTab === 'schedule'} icon={Calendar} label="Schedule" onClick={() => setActiveTab('schedule')} />

                    <div className="flex-1" />

                    <button onClick={() => setShowNewGroup(true)} className="group w-16 h-16 rounded-[24px] bg-white text-black flex items-center justify-center hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                        <Plus size={28} />
                    </button>
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/20 mt-4">
                        <img src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${profile?.full_name}&background=random`} alt="Profile" className="w-full h-full object-cover" />
                    </div>
                </GlassPanel>

                {/* --- CONTENT AREA --- */}
                <div className="flex-1 flex flex-col gap-6 overflow-hidden">

                    {/* Header */}
                    <div className="flex items-center justify-between shrink-0 px-4">
                        <div>
                            <h1 className="text-4xl font-light tracking-tight text-white drop-shadow-lg">
                                {activeTab === 'calls' ? 'Communication Hub' : 'Upcoming Protocols'}
                            </h1>
                            <div className="flex items-center gap-2 mt-2 opacity-60">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_10px_#4ade80]" />
                                <span className="text-xs font-medium tracking-widest uppercase">System Online</span>
                            </div>
                        </div>
                        {activeTab === 'schedule' && (
                            <button onClick={() => setShowNewMeeting(true)} className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full text-sm font-medium transition-all backdrop-blur-md">
                                + Schedule Event
                            </button>
                        )}
                    </div>

                    {/* Content Grid */}
                    <div className="flex-1 overflow-y-auto pr-4 pb-4 custom-scrollbar">
                        <AnimatePresence mode="wait">
                            {activeTab === 'calls' ? (
                                <motion.div
                                    key="calls"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                                >
                                    {groups.map(group => (
                                        <GlassPanel key={group.id} className="p-6 group cursor-pointer hover:bg-white/10 transition-colors duration-300">
                                            <div className="flex justify-between items-start mb-6">
                                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 shadow-inner border border-white/10 flex items-center justify-center">
                                                    <Users className="text-white/80" size={24} />
                                                </div>
                                                <div onClick={(e) => { e.stopPropagation(); handleStartCall(group.id); }} className="p-3 rounded-full bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-white transition-all border border-green-500/30">
                                                    <Video size={20} fill="currentColor" />
                                                </div>
                                            </div>
                                            <h3 className="text-xl font-medium text-white mb-1 group-hover:text-purple-300 transition-colors">{group.name}</h3>
                                            <p className="text-sm text-white/40 line-clamp-1 mb-4">{group.description || 'Secure Channel'}</p>

                                            <div className="flex items-center gap-2 mt-auto pt-4 border-t border-white/5">
                                                <div className="flex -space-x-2">
                                                    {[1, 2, 3].map(i => (
                                                        <div key={i} className="w-6 h-6 rounded-full bg-white/10 border border-black backdrop-blur-sm" />
                                                    ))}
                                                </div>
                                                <span className="text-xs text-white/30 ml-2">Active now</span>
                                            </div>
                                        </GlassPanel>
                                    ))}

                                    {/* Add New Placeholder */}
                                    <button onClick={() => setShowNewGroup(true)} className="group relative rounded-[32px] border border-dashed border-white/20 hover:border-white/40 hover:bg-white/5 transition-all flex flex-col items-center justify-center gap-4 min-h-[200px]">
                                        <div className="w-14 h-14 rounded-full bg-white/5 group-hover:bg-white/10 flex items-center justify-center transition-all">
                                            <Plus size={24} className="text-white/50 group-hover:text-white" />
                                        </div>
                                        <span className="text-sm font-medium text-white/40 group-hover:text-white/80">Initialize New Group</span>
                                    </button>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="schedule"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-4"
                                >
                                    {meetings.map((meeting, i) => (
                                        <div key={meeting.id} className="relative group">
                                            {/* Date Stick */}
                                            <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-white/20 to-transparent" />
                                            <div className="absolute left-[30px] top-8 w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_10px_#a855f7]" />

                                            <GlassPanel className="ml-16 p-6 flex items-center justify-between hover:bg-white/10 transition-colors">
                                                <div className="flex gap-6 items-center">
                                                    <div className="flex flex-col items-center justify-center w-16 h-16 rounded-2xl bg-white/5 border border-white/10">
                                                        <span className="text-xs uppercase text-white/40 font-bold">{format(new Date(meeting.start_time), 'MMM')}</span>
                                                        <span className="text-2xl font-light text-white">{format(new Date(meeting.start_time), 'dd')}</span>
                                                    </div>
                                                    <div>
                                                        <h3 className="text-xl font-medium text-white mb-1">{meeting.title}</h3>
                                                        <div className="flex items-center gap-4 text-sm text-white/40">
                                                            <span className="flex items-center gap-1"><Clock size={14} /> {format(new Date(meeting.start_time), 'h:mm a')}</span>
                                                            <span className="flex items-center gap-1"><Video size={14} /> Virtual Room</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <button className="px-6 py-2 rounded-full bg-white text-black text-sm font-medium hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                                                    Enter
                                                </button>
                                            </GlassPanel>
                                        </div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* --- MODALS (VisionOS Popups) --- */}
            <AnimatePresence>
                {(showNewGroup || showNewMeeting) && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative w-[500px] bg-[#1a1a1a]/80 backdrop-blur-2xl border border-white/10 rounded-[40px] p-8 shadow-2xl overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

                            <h2 className="text-2xl font-light text-white mb-6 text-center">
                                {showNewGroup ? 'New Communication Group' : 'Schedule Protocol'}
                            </h2>

                            <div className="space-y-4 relative z-10">
                                {showNewGroup ? (
                                    <>
                                        <input
                                            value={groupName} onChange={e => setGroupName(e.target.value)}
                                            placeholder="Group Identity Name"
                                            className="w-full bg-black/20 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors"
                                        />
                                        <textarea
                                            value={groupDesc} onChange={e => setGroupDesc(e.target.value)}
                                            placeholder="Operational Purpose"
                                            className="w-full bg-black/20 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-white/30 focus:outline-none focus:border-white/30 h-24 resize-none"
                                        />
                                        <div className="bg-black/20 border border-white/10 rounded-2xl p-4 max-h-40 overflow-y-auto custom-scrollbar">
                                            <p className="text-xs text-white/40 uppercase tracking-widest mb-3">Select Operatives</p>
                                            {staff.filter(s => s.id !== profile?.id).map(s => (
                                                <div key={s.id} onClick={() => {
                                                    setSelectedMembers(prev => prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id])
                                                }} className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all ${selectedMembers.includes(s.id) ? 'bg-white/10' : 'hover:bg-white/5'}`}>
                                                    <div className={`w-4 h-4 rounded-full border ${selectedMembers.includes(s.id) ? 'bg-green-500 border-green-500' : 'border-white/30'}`} />
                                                    <span className="text-sm text-white/80">{s.full_name}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <button onClick={handleCreateGroup} className="w-full py-4 mt-2 bg-white text-black rounded-2xl font-medium hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-all">
                                            Initialize Group
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <input
                                            value={meetingTitle} onChange={e => setMeetingTitle(e.target.value)}
                                            placeholder="Meeting Subject"
                                            className="w-full bg-black/20 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-white/30 focus:outline-none focus:border-white/30"
                                        />
                                        <div className="grid grid-cols-2 gap-4">
                                            <input type="date" value={meetingDate} onChange={e => setMeetingDate(e.target.value)} className="bg-black/20 border border-white/10 rounded-2xl px-4 py-4 text-white/80 focus:outline-none" />
                                            <input type="time" value={meetingTime} onChange={e => setMeetingTime(e.target.value)} className="bg-black/20 border border-white/10 rounded-2xl px-4 py-4 text-white/80 focus:outline-none" />
                                        </div>
                                        <button onClick={handleScheduleMeeting} className="w-full py-4 mt-4 bg-white text-black rounded-2xl font-medium hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-all">
                                            Confirm Schedule
                                        </button>
                                    </>
                                )}
                            </div>

                            <button onClick={() => { setShowNewGroup(false); setShowNewMeeting(false) }} className="absolute top-6 right-6 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                                <X size={18} className="text-white/60" />
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default Frame
