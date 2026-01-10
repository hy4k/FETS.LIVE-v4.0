import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Users, Activity, CheckCircle, Play, Sparkles, ListChecks,
    Settings, ChevronRight, Bell, AlertTriangle, Shield, ClipboardCheck,
    CheckCircle2, AlertCircle, Quote, Star, MessageSquare,
    Pause, RotateCcw, Coffee
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useBranch } from '../hooks/useBranch'
import { toast } from 'react-hot-toast'
import { useDashboardStats, useCandidateTrend, useUpcomingSchedule } from '../hooks/useCommandCentre'
import { useNews } from '../hooks/useNewsManager'
import { ExamScheduleWidget } from './ExamScheduleWidget'
import { CommandCentreGraphs } from './CommandCentreGraphs'
import { supabase } from '../lib/supabase'
import { ChecklistFormModal } from './checklist/ChecklistFormModal'
import { NotificationBanner } from './NotificationBanner'
import { ChecklistTemplate } from '../types/checklist'

export default function CommandCentre({ onNavigate }: { onNavigate?: (tab: string) => void }) {
    const { profile } = useAuth()
    const { activeBranch } = useBranch()

    // --- React Query Hooks ---
    const { data: dashboardData, isLoading: isLoadingStats } = useDashboardStats()
    const { data: examSchedule = [], isLoading: isLoadingSchedule } = useUpcomingSchedule()

    // Fetch News for Notice Board
    const { data: newsItems = [] } = useNews()

    const [activeTemplate, setActiveTemplate] = useState<ChecklistTemplate | null>(null);
    const [showChecklistModal, setShowChecklistModal] = useState(false);

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
    const fetchAnalysis = async () => {
        try {
            const today = new Date().toISOString().split('T')[0]
            const startOfMonth = new Date(); startOfMonth.setDate(1);

            // --- Operational Events ---
            const { data: events } = await (supabase as any)
                .from('events')
                .select('*')
                .gte('created_at', startOfMonth.toISOString())

            const openEvents = events?.filter((e: any) => e.status !== 'closed') || []
            const critical = openEvents.filter((e: any) => e.priority === 'critical').length
            const major = openEvents.filter((e: any) => e.priority === 'major').length
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

            // --- Checklist Metrics ---
            const { data: checklists } = await (supabase as any)
                .from('checklist_submissions')
                .select('answers')
                .gte('created_at', `${today}T00:00:00`)

            let issues = 0
            checklists?.forEach((Sub: any) => {
                const ans = Sub.answers?.responses || Sub.answers || {}
                Object.values(ans).forEach((val: any) => {
                    if (val === false || val === 'No' || val === 'Incomplete') issues++
                })
            })

            setChecklistMetrics({
                total: checklists?.length || 0,
                issues,
                perfect: (checklists?.length || 0) - (issues > 0 ? 1 : 0)
            })

            setLoadingAnalysis(false)
        } catch (e) {
            console.error("Analysis load failed", e)
            setLoadingAnalysis(false)
        }
    }

    useEffect(() => {
        fetchAnalysis()
    }, [])


    const handleOpenChecklist = async (type: 'pre_exam' | 'post_exam' | 'custom') => {
        try {
            const { data, error } = await supabase
                .from('checklist_templates' as any)
                .select('*')
                .eq('type', type)
                .eq('is_active', true)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (error || !data) {
                toast.error(`No active ${type.replace('_', ' ')} checklist found.`);
                return;
            }

            setActiveTemplate(data as unknown as ChecklistTemplate);
            setShowChecklistModal(true);
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
        return <div className="flex items-center justify-center h-screen bg-[#EEF2F9]"><div className="animate-spin rounded-full h-16 w-16 border-b-4 border-amber-500"></div></div>
    }

    const bgBase = "bg-[#EEF2F9]"
    const neuCard = "bg-[#EEF2F9] rounded-3xl shadow-[9px_9px_16px_rgb(209,217,230),-9px_-9px_16px_rgba(255,255,255,0.8)] border border-white/50"
    const neuInset = "bg-[#EEF2F9] rounded-2xl shadow-[inset_6px_6px_12px_rgb(209,217,230),inset_-6px_-6px_12px_rgba(255,255,255,0.9)]"
    const neuBtn = "bg-[#EEF2F9] text-slate-600 font-bold rounded-2xl shadow-[6px_6px_10px_rgb(209,217,230),-6px_-6px_10px_rgba(255,255,255,0.8)] hover:shadow-[4px_4px_8px_rgb(209,217,230),-4px_-4px_8px_rgba(255,255,255,0.8)] active:shadow-[inset_4px_4px_8px_rgb(209,217,230),inset_-4px_-4px_8px_rgba(255,255,255,0.8)] transition-all border border-white/40"

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

                            <h3 className="text-xl font-black text-slate-700 mb-8 flex items-center gap-3 uppercase tracking-tighter relative z-10">
                                <div className={`${neuInset} p-2 text-amber-600`}>
                                    <ListChecks size={20} />
                                </div>
                                <span className="bg-gradient-to-r from-slate-700 to-slate-500 bg-clip-text text-transparent">Protocol Command</span>
                            </h3>

                            {/* Horizontal Layout for Actions */}
                            <div className="grid grid-cols-2 lg:grid-cols-2 gap-8 relative z-10">
                                <button
                                    onClick={() => handleOpenChecklist('pre_exam')}
                                    className={`${neuBtn} p-6 flex flex-col items-center justify-center gap-4 h-48 group hover:scale-[1.02] active:scale-[0.98] transition-all duration-300`}
                                >
                                    <div className="w-16 h-16 rounded-2xl bg-white shadow-md text-amber-500 flex items-center justify-center font-bold group-hover:bg-amber-100 transition-colors duration-300">
                                        <ClipboardCheck size={32} />
                                    </div>
                                    <div className="text-center">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Pre-deployment</div>
                                        <div className="text-xl font-black text-slate-700 group-hover:text-amber-600 transition-colors uppercase tracking-tighter">Pre-exam Checklist</div>
                                    </div>
                                </button>

                                <button
                                    onClick={() => handleOpenChecklist('post_exam')}
                                    className={`${neuBtn} p-6 flex flex-col items-center justify-center gap-4 h-48 group hover:scale-[1.02] active:scale-[0.98] transition-all duration-300`}
                                >
                                    <div className="w-16 h-16 rounded-2xl bg-white shadow-md text-emerald-500 flex items-center justify-center font-bold group-hover:bg-emerald-100 transition-colors duration-300">
                                        <CheckCircle size={32} />
                                    </div>
                                    <div className="text-center">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Post-deployment</div>
                                        <div className="text-xl font-black text-slate-700 group-hover:text-emerald-600 transition-colors uppercase tracking-tighter">Post-exam Checklist</div>
                                    </div>
                                </button>
                            </div>
                        </motion.div>

                        {/* 2. KEY METRICS ROW */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                            {/* Health Score - AMBER/GOLD JEWEL CASE */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                                onClick={() => onNavigate && onNavigate('system-manager')}
                                className={`${neuCard} p-6 relative group overflow-hidden border-t-4 border-t-amber-500 cursor-pointer hover:scale-[1.02] transition-transform`}
                            >
                                <div className="absolute -right-6 -bottom-6 text-amber-500/5 rotate-[-15deg]">
                                    <Shield size={120} />
                                </div>
                                <div className="flex justify-between items-start mb-4 relative z-10">
                                    <div className={`${neuInset} p-3 text-amber-600 rounded-xl bg-amber-50/50`}>
                                        <Activity size={20} />
                                    </div>
                                    {opsMetrics.critical > 0 && <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]"></span>}
                                </div>
                                <div className="relative z-10">
                                    <div className="text-4xl font-black text-slate-800 mb-1 tracking-tight">
                                        {Math.round(opsMetrics.healthScore)}
                                        <span className="text-lg text-slate-400 font-bold ml-1">/100</span>
                                    </div>
                                    <div className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">System Health</div>
                                </div>
                            </motion.div>

                            {/* Daily Operations Metrics - MERGED */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                                className={`${neuCard} p-6 col-span-2 relative group overflow-hidden border-t-4 border-t-slate-800`}
                            >
                                <div className="absolute -right-6 -bottom-6 text-slate-800/5 rotate-[-15deg]">
                                    <Users size={160} />
                                </div>
                                <div className="flex justify-between items-center mb-6 relative z-10">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-amber-600 uppercase tracking-[0.3em]">Day Report</span>
                                        <h4 className="text-xl font-black text-slate-700 uppercase tracking-tighter">Operational Volume</h4>
                                    </div>
                                    <div className={`${neuInset} p-3 text-slate-600 rounded-xl`}>
                                        <ClipboardCheck size={24} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-8 relative z-10">
                                    <div className="flex flex-col">
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-5xl font-black text-slate-800 tracking-tighter">{dashboardData?.todayCandidates || 0}</span>
                                            <span className="text-xs font-bold text-slate-400 uppercase">Pax</span>
                                        </div>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Attendees Verified Today</p>
                                    </div>
                                    <div className="flex flex-col border-l border-slate-200 pl-8">
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-5xl font-black text-slate-800 tracking-tighter">{checklistMetrics.total}</span>
                                            <span className="text-xs font-bold text-slate-400 uppercase">Logs</span>
                                        </div>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Deployment Logs Filed</p>
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        {/* 2.5 ANALYTICS GRID */}
                        <CommandCentreGraphs />

                        {/* 3. CALENDAR WIDGET - EXECUTIVE PLANNER */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }}
                            className={`${neuCard} p-1 min-h-[400px] relative overflow-hidden`}
                        >
                            {/* Gold Gradient Spine */}
                            <div className="h-2 w-full bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600"></div>
                            <div className="p-2 bg-slate-100/50 h-full rounded-b-3xl">
                                <div className="bg-[#EEF2F9] rounded-2xl shadow-sm border border-white/60 h-full p-2">
                                    <ExamScheduleWidget onNavigate={onNavigate} />
                                </div>
                            </div>
                        </motion.div>

                    </div>


                    {/* RIGHT COLUMN: Notice Board */}
                    <div className="xl:col-span-4 flex flex-col gap-10">

                        {/* --- SKEUOMORPHIC HANGING NOTICE BOARD --- */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.6 }}
                            className="xl:col-span-4 flex flex-col items-center relative py-12"
                        >
                            {/* The Nail & String Hook */}
                            <div className="absolute top-0 flex flex-col items-center z-10">
                                <div className="w-4 h-4 rounded-full bg-slate-400 shadow-[inset_-1px_-1px_2px_rgba(0,0,0,0.3),1px_1px_2px_rgba(255,255,255,0.8)] border border-slate-500 relative">
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                </div>
                                <div className="w-32 h-20 -mt-2">
                                    <svg viewBox="0 0 100 60" className="w-full h-full fill-none stroke-slate-400 stroke-[1.5] opacity-60">
                                        <path d="M 50 2 L 2 58 M 50 2 L 98 58" />
                                    </svg>
                                </div>
                            </div>

                            {/* The Board Itself */}
                            <div className="w-full bg-[#FFFBEB] rounded-3xl relative shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15),0_15px_30px_-10px_rgba(0,0,0,0.1)] border-[12px] border-[#D6CAB0] min-h-[550px] flex flex-col items-center pt-16 pb-12 px-6">

                                {/* Inner Shadow for Recessed Depth */}
                                <div className="absolute inset-0 rounded-[1.2rem] shadow-[inset_0_10px_20px_rgba(0,0,0,0.04)] pointer-events-none" />

                                {/* Section Header Strip */}
                                <div className="absolute top-4 -translate-y-1/2 bg-white px-10 py-3 shadow-[0_4px_10px_rgba(0,0,0,0.1)] -rotate-1 border border-slate-100 flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full bg-rose-500 shadow-md border-2 border-rose-600 absolute -top-1 left-1/2 -translate-x-1/2 scale-110" />
                                    <h3 className="text-sm font-black text-slate-700 uppercase tracking-[0.3em] font-['Rajdhani']">
                                        Notice Board
                                    </h3>
                                </div>

                                {/* Notices Pins Area */}
                                <div className="w-full space-y-8 mt-4">
                                    {notices.length > 0 ? (
                                        notices.map((notice: any, idx: number) => {
                                            const rotations = ['rotate-1', 'rotate-[-1]', 'rotate-2', 'rotate-[-2]', 'rotate-0'];
                                            const rotation = rotations[idx % rotations.length];

                                            return (
                                                <motion.div
                                                    key={notice.id || idx}
                                                    whileHover={{ scale: 1.03, rotate: 0, y: -4, zIndex: 20 }}
                                                    className={`
                                                        ${rotation} bg-white p-6 relative shadow-[0_10px_25px_-5px_rgba(0,0,0,0.08)] 
                                                        border-l-4 ${notice.priority === 'high' ? 'border-l-rose-500' : 'border-l-amber-500'}
                                                        group cursor-default transition-all duration-300
                                                    `}
                                                >
                                                    {/* Pinned Pushpin */}
                                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                                                        <div className="w-4 h-4 rounded-full bg-rose-500 shadow-lg border-2 border-rose-600 flex items-center justify-center">
                                                            <div className="w-1 h-1 rounded-full bg-white/40" />
                                                        </div>
                                                    </div>

                                                    <div className="flex justify-between items-start mb-3 opacity-60">
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                            {new Date(notice.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                                        </span>
                                                        <div className="flex gap-1">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                                                        </div>
                                                    </div>

                                                    <p className="text-sm font-bold text-slate-600 leading-relaxed font-['Rajdhani'] group-hover:text-slate-900 transition-colors">
                                                        {notice.content}
                                                    </p>

                                                    {/* Subtle Paper Texture Line */}
                                                    <div className="absolute bottom-2 right-4 opacity-5">
                                                        <Quote size={40} className="rotate-180" />
                                                    </div>
                                                </motion.div>
                                            )
                                        })
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-20 opacity-30">
                                            <div className="w-20 h-20 bg-slate-200/50 rounded-full flex items-center justify-center mb-4 shadow-inner">
                                                <Bell size={40} className="text-slate-400" />
                                            </div>
                                            <p className="text-sm font-black uppercase tracking-widest text-slate-500 font-['Rajdhani']">No Active Directives</p>
                                        </div>
                                    )}
                                </div>

                                {/* Footer Navigation */}
                                <div className="mt-auto w-full pt-8">
                                    <button
                                        onClick={() => onNavigate && onNavigate('intelligence')}
                                        className="w-full py-4 bg-white/50 hover:bg-white text-[10px] font-black text-amber-700 uppercase tracking-[0.4em] transition-all border-y border-amber-900/5 flex items-center justify-center gap-3 group"
                                    >
                                        Intel Access <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            </div>

                            {/* Decorative Loose Strings / Tapes (Optional Enhancement) */}
                            <div className="absolute -bottom-4 left-10 w-8 h-12 bg-white/20 -rotate-12 backdrop-blur-sm border border-white/30 hidden xl:block" />
                            <div className="absolute -bottom-2 right-12 w-6 h-10 bg-white/10 rotate-15 backdrop-blur-sm border border-white/20 hidden xl:block" />
                        </motion.div>

                        {/* --- CLIENT ACCESS HUB --- */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.7 }}
                            className={`${neuCard} p-8 flex flex-col gap-6`}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-white shadow-lg">
                                    <Sparkles size={18} />
                                </div>
                                <h4 className="text-sm font-black text-slate-800 uppercase tracking-[0.2em] font-['Rajdhani']">Scheduler Interface Hub</h4>
                            </div>

                            <div className="grid grid-cols-4 gap-6">
                                {[
                                    { name: 'Prometric', logo: 'client-logos/prometric.png', url: 'https://easyserve.prometric.com/my.policy' },
                                    { name: 'CMA US', logo: 'client-logos/cma_usa.png', url: 'https://proscheduler.prometric.com/home' },
                                    { name: 'CELPIP', logo: 'client-logos/celpip.jpg', url: 'https://testcentreportal.paragontesting.ca/TestCentrePortal/Login' },
                                    { name: 'Pearson VUE', logo: 'client-logos/pearson_vue.png', url: 'https://connect.pearsonvue.com/Connect/#/authenticate' }
                                ].map((client) => (
                                    <a
                                        key={client.name}
                                        href={client.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`${neuBtn} p-4 flex items-center justify-center h-28 hover:scale-105 transition-all group`}
                                        title={`Access ${client.name} Scheduler`}
                                    >
                                        <img
                                            src={client.logo}
                                            alt={client.name}
                                            className="max-w-full max-h-full object-contain filter grayscale group-hover:grayscale-0 transition-all duration-500"
                                        />
                                    </a>
                                ))}
                            </div>
                        </motion.div>
                    </div>

                </div>

            </div>

            <AnimatePresence>
                {showChecklistModal && activeTemplate && (
                    <ChecklistFormModal
                        template={activeTemplate}
                        onClose={() => setShowChecklistModal(false)}
                        onSuccess={fetchAnalysis}
                        currentUser={profile}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}
