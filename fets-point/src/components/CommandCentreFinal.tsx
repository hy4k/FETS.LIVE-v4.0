import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Users, Activity, CheckCircle, Play, Sparkles, ListChecks,
    Settings, ChevronRight, Bell, AlertTriangle, Shield, ClipboardCheck,
    CheckCircle2, AlertCircle, Quote, Star, MessageSquare, Search,
    Pause, RotateCcw, Coffee
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useBranch } from '../hooks/useBranch'
import { toast } from 'react-hot-toast'
import { useDashboardStats, useCandidateTrend, useUpcomingSchedule } from '../hooks/useCommandCentre'
import { useNews } from '../hooks/useNewsManager'
import { DailySpark } from './DailySpark'
import { AccessHub } from './AccessHub'
import { supabase } from '../lib/supabase'
import { ChecklistFormModal } from './checklist/ChecklistFormModal'
import { NotificationBanner } from './NotificationBanner'
import { ChecklistTemplate } from '../types/checklist'
import { StaffBranchSelector } from './checklist/StaffBranchSelector'
import { FetsChatPopup } from './FetsChatPopup'
import { StaffProfile } from '../types/shared'

export default function CommandCentre({ onNavigate, onAiQuery }: { onNavigate?: (tab: string) => void; onAiQuery?: (query: string) => void }) {
    const { profile, user } = useAuth()
    const { activeBranch } = useBranch()

    // --- React Query Hooks ---
    const { data: dashboardData, isLoading: isLoadingStats } = useDashboardStats()
    const { data: examSchedule = [], isLoading: isLoadingSchedule } = useUpcomingSchedule()

    // Fetch News for Notice Board
    const { data: newsItems = [] } = useNews()

    const [activeTemplate, setActiveTemplate] = useState<ChecklistTemplate | null>(null);
    const [showChecklistModal, setShowChecklistModal] = useState(false);

    // Select Flow
    const [showStaffSelector, setShowStaffSelector] = useState(false);
    const [preSelection, setPreSelection] = useState<{ staffId: string; branchId: string; staffName: string } | null>(null);

    // --- Integrated Analysis Data Fetching ---
    const [opsMetrics, setOpsMetrics] = useState({ healthScore: 100, critical: 0, open: 0, topIssue: 'None' })
    const [checklistMetrics, setChecklistMetrics] = useState({ total: 0, issues: 0, perfect: 0 })
    const [loadingAnalysis, setLoadingAnalysis] = useState(true)

    // Filter Active News for Notice Board
    const notices = useMemo(() => {
        return newsItems
            .filter((item: any) => {
                if (!item.is_active) return false;
                // Show if global OR if matches active branch
                return (item.branch_location === 'global' || !item.branch_location) || (item.branch_location === activeBranch);
            })
            .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) // Newest first
            .slice(0, 5) // Show top 5
    }, [newsItems, activeBranch])
    const [todayStatus, setTodayStatus] = useState({ pre: 'Not started', post: 'Not started' })

    const [staff, setStaff] = useState<StaffProfile[]>([])
    const [presence, setPresence] = useState<Record<string, { status: string, last_seen: string }>>({})
    const [openChats, setOpenChats] = useState<StaffProfile[]>([])

    const fetchAnalysis = async () => {
        try {
            const today = new Date().toISOString().split('T')[0]
            const startOfMonth = new Date(); startOfMonth.setDate(1);

            // Fetch Staff for User List
            const { data: staffData } = await supabase.from('staff_profiles').select('*').neq('user_id', user?.id)
            setStaff(staffData || [])

            // --- Checklist Status for Today ---
            const { data: checklists } = await supabase
                .from('checklist_submissions')
                .select('*')
                .gte('submitted_at', today)
                .eq('branch_id', activeBranch !== 'global' ? activeBranch : undefined)

            const preSubmission = checklists?.find((c: any) => c.template_id?.includes('pre') || c.answers?.type === 'pre_exam')
            const postSubmission = checklists?.find((c: any) => c.template_id?.includes('post') || c.answers?.type === 'post_exam')
            const preStatus = preSubmission ? 'Submitted' : 'Not started'
            const postStatus = postSubmission ? 'Submitted' : 'Not started'
            const issues = checklists?.filter((c: any) => c.status === 'flagged' || c.status === 'issue').length || 0

            // --- Operational Incidents ---
            const { data: events } = await (supabase as any)
                .from('incidents')
                .select('*')
                .gte('created_at', startOfMonth.toISOString())

            const openEvents = events?.filter((e: any) => e.status !== 'closed') || []
            const critical = openEvents.filter((e: any) => e.severity === 'critical').length
            const major = openEvents.filter((e: any) => e.severity === 'high' || e.severity === 'medium').length
            const eventPenalty = (critical * 15) + (major * 5) + (openEvents.length * 1)

            // --- Infrastructure Health ---
            const { data: systems } = await supabase
                .from('systems')
                .select('status')
                .eq('branch_location', activeBranch !== 'global' ? activeBranch : undefined);

            const systemsFault = systems?.filter(s => s.status === 'fault').length || 0;
            const systemsMaintenance = systems?.filter(s => s.status === 'maintenance').length || 0;
            const systemPenalty = (systemsFault * 20) + (systemsMaintenance * 5);

            const combinedPenalty = eventPenalty + systemPenalty;
            const health = Math.max(0, 100 - combinedPenalty);

            const categories: Record<string, number> = {}
            events?.forEach((e: any) => { categories[e.category || 'Other'] = (categories[e.category || 'Other'] || 0) + 1 })
            const topCat = Object.entries(categories).sort((a, b) => b[1] - a[1])[0]

            setOpsMetrics({
                healthScore: health,
                critical: critical + systemsFault,
                open: openEvents.length,
                topIssue: systemsFault > 0 ? 'Hardware Fault' : (topCat ? topCat[0] : 'Stable')
            })

            // --- Checklist Metrics & Today's Status ---
            setTodayStatus({ pre: preStatus, post: postStatus })

            setChecklistMetrics({
                total: checklists?.length || 0,
                issues,
                perfect: (checklists?.length || 0) - (issues > 0 ? 1 : 0)
            })

            // Separate Staff Fetch to avoid failures impacting metrics
            const { data: sData } = await supabase.from('staff_profiles').select('*').neq('user_id', user?.id)
            if (sData) setStaff(sData)

            setLoadingAnalysis(false)
        } catch (e) {
            console.error("Analysis load failed", e)
            setLoadingAnalysis(false)
        }
    }

    // Effect for Presence Management
    useEffect(() => {
        if (!user?.id) return
        
        const channel = supabase.channel('online-staff-centre', { config: { presence: { key: user.id } } })
        channel.on('presence', { event: 'sync' }, () => {
            const state = channel.presenceState()
            const map: any = {}
            for (const key in state) { if (state[key].length > 0) map[key] = state[key][0] }
            setPresence(map)
        }).subscribe(async (status) => {
            if (status === 'SUBSCRIBED') await channel.track({ user_id: user.id, status: 'online' })
        })

        return () => { channel.unsubscribe() }
    }, [user?.id])

    useEffect(() => {
        if (user?.id) {
            fetchAnalysis()
        }
    }, [user?.id, activeBranch])


    const handleOpenChecklist = async (type: 'pre_exam' | 'post_exam' | 'custom') => {
        try {
            // First fetch relevant templates
            const { data, error } = await supabase
                .from('checklist_templates' as any)
                .select('*')
                .eq('type', type)
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (error || !data || data.length === 0) {
                toast.error(`No active ${type.replace('_', ' ')} checklist found.`);
                return;
            }

            // Find best match: Specific branch > Global > First available
            let bestMatch = data.find((t: any) => t.branch_location === activeBranch);

            if (!bestMatch) {
                bestMatch = data.find((t: any) => t.branch_location === 'global' || !t.branch_location);
            }

            if (!bestMatch) {
                // If no specific and no global, just take the newest one (fallback)
                bestMatch = data[0];
            }

            setActiveTemplate(bestMatch as unknown as ChecklistTemplate);
            setShowStaffSelector(true); // Open selector first
        } catch (err) {
            console.error(err);
            toast.error('Failed to load checklist');
        }
    };


    // --- Playful Session Tracking (Countdown) ---
    const SHIFT_SECONDS = 9 * 3600 // 9 Hours
    const [timeLeft, setTimeLeft] = useState(SHIFT_SECONDS)
    const [isTimerActive, setIsTimerActive] = useState(true)

    useEffect(() => {
        let timer: any
        if (isTimerActive && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft(prev => prev - 1)
            }, 1000)
        }
        return () => clearInterval(timer)
    }, [isTimerActive, timeLeft])

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600).toString().padStart(2, '0')
        const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0')
        const s = (seconds % 60).toString().padStart(2, '0')
        return `${h}:${m}:${s}`
    }

    const resetTimer = () => setTimeLeft(SHIFT_SECONDS)


    if (isLoadingStats || isLoadingSchedule) {
        return <div className="flex items-center justify-center h-screen bg-[var(--dashboard-bg, #EEF2F9)]"><div className="animate-spin rounded-full h-16 w-16 border-b-4 border-amber-500"></div></div>
    }

    const bgBase = "bg-[var(--dashboard-bg, #EEF2F9)]"
    const neuCard = "bg-[var(--dashboard-bg, #EEF2F9)] rounded-3xl shadow-[9px_9px_16px_var(--neu-dark-shadow,rgb(209,217,230)),-9px_-9px_16px_var(--neu-light-shadow,rgba(255,255,255,0.8))] border border-white/50"
    const neuInset = "bg-[var(--dashboard-bg, #EEF2F9)] rounded-2xl shadow-[inset_6px_6px_12px_var(--neu-dark-shadow,rgb(209,217,230)),inset_-6px_-6px_12px_var(--neu-light-shadow,rgba(255,255,255,0.9))]"
    const neuBtn = "bg-[var(--dashboard-bg, #EEF2F9)] text-slate-600 font-bold rounded-2xl shadow-[6px_6px_10px_var(--neu-dark-shadow,rgb(209,217,230)),-6px_-6px_10px_var(--neu-light-shadow,rgba(255,255,255,0.8))] hover:shadow-[4px_4px_8px_var(--neu-dark-shadow,rgb(209,217,230)),-4px_-4px_8px_var(--neu-light-shadow,rgba(255,255,255,0.8))] active:shadow-[inset_4px_4px_8px_var(--neu-dark-shadow,rgb(209,217,230)),inset_-4px_-4px_8px_var(--neu-light-shadow,rgba(255,255,255,0.8))] transition-all border border-white/40"

    return (
        <div className={`min-h-screen ${bgBase} text-slate-700 font-sans pb-12 overflow-x-hidden`} style={{ fontFamily: "'Montserrat', sans-serif" }}>

            <NotificationBanner onNavigate={onNavigate} />

            <div className="max-w-[1800px] mx-auto px-6 pt-8">


                {/* --- PREMIUM COMMAND HEADER --- */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-12 gap-10"
                >
                    {/* Left: Command Branding */}
                    <div className="flex flex-col">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="h-1 w-12 bg-amber-500 rounded-full" />
                            <span className="text-slate-400 font-black text-[10px] uppercase tracking-[0.4em] font-['Rajdhani']">
                                Operational Intelligence {activeBranch !== 'global' && `// Node ${activeBranch.toUpperCase()}`}
                            </span>
                        </div>
                        <h1 className="text-6xl md:text-7xl font-black text-slate-800 tracking-tighter uppercase italic leading-none">
                            Command <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-amber-600 drop-shadow-sm">Centre</span>
                        </h1>
                    </div>


                    {/* Right: Duty Officer Profile (Dominant Display) */}
                    <div className="flex flex-wrap items-center gap-8 w-full lg:w-auto">

                        {/* THE EXECUTIVE OFFICER PLATE */}
                        <div className={`${neuCard} p-6 flex items-center gap-8 min-w-[450px] relative overflow-hidden group hover:scale-[1.01] transition-all cursor-default`}>
                            {/* Animated Background Pulse */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-amber-500/10 transition-all duration-700" />

                            {/* Avatar with Status Ring */}
                            <div className="relative shrink-0">
                                <div className={`${neuCard} w-24 h-24 p-2 rounded-full relative z-10 shadow-[10px_10px_20px_rgb(209,217,230),-10px_-10px_20px_rgba(255,255,255,0.8)]`}>
                                    <div className="w-full h-full rounded-full overflow-hidden border-2 border-white/80">
                                        <img
                                            src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || 'User')}&background=0F172A&color=EAB308&size=128`}
                                            className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-110"
                                            alt="Profile"
                                        />
                                    </div>
                                </div>
                                {/* Online Status Indicator */}
                                <div className="absolute bottom-1 right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-[#EEF2F9] z-20 shadow-lg" />
                                <div className="absolute bottom-1 right-1 w-6 h-6 bg-green-400 rounded-full z-15 animate-ping opacity-60" />
                            </div>

                            {/* Officer Details */}
                            <div className="flex flex-col flex-1 z-10">
                                <span className="text-[10px] font-black text-amber-600 uppercase tracking-[0.3em] font-['Rajdhani'] mb-1">Duty Officer</span>
                                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-3 leading-tight">
                                    {profile?.full_name || 'System Operator'}
                                </h2>

                                <div className="flex items-center gap-6">
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Shift Ends In</span>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setIsTimerActive(!isTimerActive); }}
                                                    className="p-1 hover:bg-slate-200 rounded-md transition-colors text-slate-500"
                                                >
                                                    {isTimerActive ? <Pause size={10} /> : <Play size={10} />}
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); resetTimer(); }}
                                                    className="p-1 hover:bg-slate-200 rounded-md transition-colors text-slate-500"
                                                >
                                                    <RotateCcw size={10} />
                                                </button>
                                            </div>
                                        </div>
                                        <span className={`text-lg font-black tabular-nums font-['Rajdhani'] ${timeLeft < 3600 ? 'text-rose-500 animate-pulse' : 'text-slate-700'}`}>
                                            {formatTime(timeLeft)}
                                        </span>
                                    </div>
                                    <div className="w-px h-8 bg-slate-200" />
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Caffeine Index</span>
                                        <span className="text-[10px] font-black text-amber-600 uppercase flex items-center gap-1.5">
                                            <Coffee size={12} className={isTimerActive ? "animate-bounce" : ""} />
                                            Optimal Level
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Decorative Button Action */}
                            <div className={`${neuBtn} p-3 ml-4 self-center group-hover:bg-white group-hover:text-amber-600 transition-all`}>
                                <Activity size={18} />
                            </div>
                        </div>

                        {/* Chronos Module (Time/Date) */}
                        <div className={`${neuCard} px-10 py-6 flex flex-col items-end gap-1 min-w-[200px] border-r-8 border-r-slate-800`}>
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] font-['Rajdhani']">Standard Time</div>
                            <div className="text-4xl font-black text-slate-800 tracking-tighter font-['Rajdhani']">
                                {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                            </div>
                            <div className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">
                                {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* AI Search Bar Removed as per request */}

                {/* Main Grid Layout */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">

                    {/* LEFT COLUMN: Checklists -> Metrics -> Calendar */}
                    <div className="xl:col-span-8 flex flex-col gap-8">

                        {/* 1. CHECKLIST (PROTOCOLS) - TITANIUM COMMAND PLATE */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
                            className={`${neuCard} p-8 relative overflow-hidden`}
                        >
                            {/* Decorative Screw Heads */}
                            <div className="absolute top-4 left-4 w-3 h-3 rounded-full bg-slate-300 shadow-[inset_1px_1px_2px_rgba(0,0,0,0.1),1px_1px_1px_rgba(255,255,255,0.8)] flex items-center justify-center"><div className="w-1.5 h-0.5 bg-slate-400 rotate-45"></div></div>
                            <div className="absolute top-4 right-4 w-3 h-3 rounded-full bg-slate-300 shadow-[inset_1px_1px_2px_rgba(0,0,0,0.1),1px_1px_1px_rgba(255,255,255,0.8)] flex items-center justify-center"><div className="w-1.5 h-0.5 bg-slate-400 rotate-45"></div></div>

                            <h3 className="text-xl font-black text-slate-700 mb-8 flex items-center gap-3 tracking-tight relative z-10">
                                <div className={`${neuInset} p-2 text-rose-400`}>
                                    <ListChecks size={20} />
                                </div>
                                <span className="bg-gradient-to-r from-slate-700 to-slate-500 bg-clip-text text-transparent uppercase text-sm font-black tracking-widest">Daily Reports</span>
                            </h3>

                            {/* Horizontal Layout for Actions */}
                            <div className="grid grid-cols-2 lg:grid-cols-2 gap-8 relative z-10">
                                <div className="flex flex-col gap-3">
                                    <button
                                        onClick={() => handleOpenChecklist('pre_exam')}
                                        className={`${neuBtn} p-6 flex flex-col items-center justify-center gap-4 h-48 group hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 w-full`}
                                    >
                                        <div className={`w-16 h-16 rounded-2xl ${todayStatus.pre === 'Submitted' ? 'bg-[#FFF5F5] text-[#E19898]' : 'bg-white text-[#E19898]'} shadow-md flex items-center justify-center font-bold group-hover:bg-[#FFF5F5] transition-colors duration-300`}>
                                            <ClipboardCheck size={32} />
                                        </div>
                                        <div className="text-center">
                                            <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-1">Step 01</div>
                                            <div className="text-lg font-black text-slate-700 group-hover:text-[#E19898] transition-colors uppercase tracking-tight">Morning Check</div>
                                        </div>
                                    </button>
                                    <div className="flex items-center justify-between px-3 py-2 bg-white/40 rounded-xl border border-white/60">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-1.5 h-1.5 rounded-full ${todayStatus.pre === 'Submitted' ? 'bg-emerald-400' : 'bg-slate-200'}`} />
                                            <span className={`text-[9px] font-black uppercase tracking-[0.1em] ${todayStatus.pre === 'Submitted' ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                {todayStatus.pre === 'Submitted' ? 'Done' : 'Pending'}
                                            </span>
                                        </div>
                                        {todayStatus.pre !== 'Submitted' ? (
                                            <button 
                                                onClick={() => handleOpenChecklist('pre_exam')}
                                                className="text-[9px] font-black text-[#E19898] uppercase tracking-widest hover:text-[#D48686] transition-colors flex items-center gap-1 group/fn"
                                            >
                                                Fill Now <ChevronRight size={10} className="group-hover/fn:translate-x-0.5 transition-transform" />
                                            </button>
                                        ) : (
                                            <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Verified</span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3">
                                    <button
                                        onClick={() => handleOpenChecklist('post_exam')}
                                        className={`${neuBtn} p-6 flex flex-col items-center justify-center gap-4 h-48 group hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 w-full ${todayStatus.post === 'Submitted' ? 'opacity-80' : ''}`}
                                    >
                                        <div className={`w-16 h-16 rounded-2xl ${todayStatus.post === 'Submitted' ? 'bg-[#F0F4F7] text-[#607D8B]' : 'bg-white text-[#607D8B]'} shadow-md flex items-center justify-center font-bold group-hover:bg-[#F0F4F7] transition-colors duration-300`}>
                                            <CheckCircle size={32} />
                                        </div>
                                        <div className="text-center">
                                            <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-1">Step 02</div>
                                            <div className="text-lg font-black text-slate-700 group-hover:text-[#607D8B] transition-colors uppercase tracking-tight">Evening Check</div>
                                        </div>
                                    </button>
                                    <div className="flex items-center justify-between px-3 py-2 bg-white/40 rounded-xl border border-white/60">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-1.5 h-1.5 rounded-full ${todayStatus.post === 'Submitted' ? 'bg-emerald-400' : 'bg-slate-200'}`} />
                                            <span className={`text-[9px] font-black uppercase tracking-[0.1em] ${todayStatus.post === 'Submitted' ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                {todayStatus.post === 'Submitted' ? 'Done' : 'Pending'}
                                            </span>
                                        </div>
                                        {todayStatus.post !== 'Submitted' ? (
                                            <button 
                                                onClick={() => handleOpenChecklist('post_exam')}
                                                className="text-[9px] font-black text-[#607D8B] uppercase tracking-widest hover:text-[#546E7A] transition-colors flex items-center gap-1 group/fn"
                                            >
                                                Fill Now <ChevronRight size={10} className="group-hover/fn:translate-x-0.5 transition-transform" />
                                            </button>
                                        ) : (
                                            <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Verified</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* 2. KEY METRICS ROW */}
                        {/* 2. QUICK ACCESS HUB - ELEVATED ACCESS */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 }}
                            className={`${neuCard} p-8 flex flex-col gap-6 relative overflow-hidden`}
                        >
                            <div className="flex items-center justify-between relative z-10">
                                <div className="flex items-center gap-3">
                                    <div className={`${neuInset} p-3 text-amber-500 rounded-xl`}>
                                        <Sparkles size={22} className="animate-pulse" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-amber-600 uppercase tracking-[0.3em]">Critical Links</span>
                                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Quick Access</h3>
                                    </div>
                                </div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden md:block">Verified Portals Only</div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-5 gap-6 relative z-10">
                                {[
                                    { name: 'CELPIP', logo: 'client-logos/celpip.jpg', url: 'https://testcentreportal.paragontesting.ca/TestCentrePortal/Login' },
                                    { name: 'PSI GPS', logo: 'client-logos/psi.png', url: 'https://gps.psiexams.com/login' },
                                    { name: 'CMA US', logo: 'client-logos/cma_us.png', url: 'https://proscheduler.prometric.com/home' },
                                    { name: 'Prometric', logo: 'client-logos/prometric.png', url: 'https://easyserve.prometric.com/my.policy' },
                                    { name: 'Pearson VUE', logo: 'client-logos/pearson_vue.png', url: 'https://connect.pearsonvue.com/Connect/#/authenticate' }
                                ].map((client) => (
                                    <a
                                        key={client.name}
                                        href={client.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`${neuBtn} p-6 flex items-center justify-center h-24 hover:scale-105 transition-all group overflow-hidden bg-white/40`}
                                        title={`Launch ${client.name}`}
                                    >
                                        <img
                                            src={client.logo}
                                            alt={client.name}
                                            className="max-w-full max-h-full object-contain transition-all duration-500 group-hover:scale-110"
                                        />
                                    </a>
                                ))}
                            </div>

                            {/* Decorative Grid Pattern Overlay */}
                            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 0.5px, transparent 0.5px)', backgroundSize: '16px 16px' }} />
                        </motion.div>

                        {/* 2.5 ACCESS HUB - CREDENTIAL MANAGEMENT */}
                        <AccessHub />

                        {/* 3. DAILY SPARK - MOTIVATION & GAMIFICATION */}
                        <DailySpark />

                    </div>


                    {/* RIGHT COLUMN: Real-time Agent Monitoring */}
                    <div className="xl:col-span-4 flex flex-col gap-10">

                        {/* --- SKEUOMORPHIC AGENT MONITORING PANEL --- */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.6 }}
                            className="xl:col-span-4 flex flex-col items-center relative py-12"
                        >
                            {/* The Monitoring Board */}
                            <div className="w-full bg-[var(--dashboard-bg)] rounded-3xl relative shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15),0_15px_30px_-10px_rgba(0,0,0,0.1)] border-[12px] border-[var(--neu-dark-shadow)] min-h-[650px] flex flex-col items-center pt-16 pb-12 px-6">

                                {/* Inner Shadow for Recessed Depth */}
                                <div className="absolute inset-0 rounded-[1.2rem] shadow-[inset_0_10px_20px_rgba(0,0,0,0.04)] pointer-events-none" />

                                {/* Section Header Strip */}
                                <div className="absolute top-4 -translate-y-1/2 bg-white px-10 py-3 shadow-[0_4px_10px_rgba(0,0,0,0.1)] -rotate-1 border border-slate-100 flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-md border-2 border-emerald-600 absolute -top-1 left-1/2 -translate-x-1/2 scale-110" />
                                    <h3 className="text-sm font-black text-slate-700 uppercase tracking-[0.3em] font-['Rajdhani']">
                                        Live Desk
                                    </h3>
                                </div>

                                {/* Agent List Area */}
                                <div className="w-full space-y-4 mt-4 overflow-y-auto custom-scrollbar flex-1 pr-1">
                                    {staff.length > 0 ? (
                                        staff.sort((a, b) => {
                                            const aOnline = presence[a.user_id]?.status === 'online' ? 1 : 0;
                                            const bOnline = presence[b.user_id]?.status === 'online' ? 1 : 0;
                                            return bOnline - aOnline;
                                        }).map((agent) => {
                                            const isOnline = presence[agent.user_id]?.status === 'online';
                                            
                                            return (
                                                <motion.div
                                                    key={agent.id}
                                                    whileHover={{ scale: 1.02, x: 5 }}
                                                    className={`bg-white p-3 rounded-2xl shadow-sm border-l-4 ${isOnline ? 'border-l-emerald-500' : 'border-l-slate-300'} flex items-center justify-between group transition-all`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="relative">
                                                            <div className="w-10 h-10 rounded-full border border-slate-200 overflow-hidden bg-slate-50">
                                                                {agent.avatar_url ? <img src={agent.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-400 font-black text-xs">{agent.full_name?.[0] || '?'}</div>}
                                                            </div>
                                                            {isOnline && <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />}
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{agent.full_name}</p>
                                                            <p className="text-[9px] font-bold text-slate-400 uppercase">{agent.branch_assigned || 'Active Agent'}</p>
                                                        </div>
                                                    </div>

                                                    <button
                                                        onClick={() => !openChats.find(c => c.id === agent.id) && setOpenChats(prev => [...prev, agent])}
                                                        className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                                                            isOnline 
                                                            ? 'bg-amber-100 text-amber-700 hover:bg-amber-500 hover:text-white' 
                                                            : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                                        }`}
                                                    >
                                                        Chat
                                                    </button>
                                                </motion.div>
                                            )
                                        })
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center opacity-20 py-20">
                                            <Users size={40} className="mb-2" />
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em]">No Agents Detected</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>

                </div>

            </div>

            {/* MULTI-WINDOW FETCHAT POPUPS */}
            <AnimatePresence>
                {openChats.map((targetUser, idx) => (
                    <FetsChatPopup
                        key={targetUser.id}
                        targetUser={targetUser}
                        onClose={() => setOpenChats(prev => prev.filter(c => c.id !== targetUser.id))}
                        zIndex={2000 + idx}
                    />
                ))}
            </AnimatePresence>

            {/* STAFF/BRANCH SELECTOR MODAL */}
            <AnimatePresence>
                {showStaffSelector && activeTemplate && (
                    <StaffBranchSelector
                        onClose={() => { setShowStaffSelector(false); setActiveTemplate(null); }}
                        onSelect={(data) => {
                            setPreSelection({ staffId: data.staffId, branchId: data.branchId, staffName: data.staffName });
                            setShowStaffSelector(false);
                            setShowChecklistModal(true);
                        }}
                    />
                )}
            </AnimatePresence>

            {/* CHECKLIST FORM MODAL */}
            <AnimatePresence>
                {showChecklistModal && activeTemplate && (
                    <ChecklistFormModal
                        template={activeTemplate}
                        onClose={() => { setShowChecklistModal(false); setActiveTemplate(null); setPreSelection(null); }}
                        onSuccess={() => {
                            fetchAnalysis();
                            toast.success('Checklist submitted successfully!');
                        }}
                        currentUser={profile}
                        overrideStaff={preSelection ? { id: preSelection.staffId, name: preSelection.staffName } : undefined}
                        overrideBranch={preSelection?.branchId}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}
