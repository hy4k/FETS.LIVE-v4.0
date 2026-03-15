import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Users, Activity, CheckCircle, Sparkles,
    Settings, ChevronRight, Bell, AlertTriangle, Shield,
    CheckCircle2, AlertCircle, Star, MessageSquare, Search,
    ExternalLink, Globe, TrendingUp, Calendar, MapPin,
    Building2, Clock, Zap, Lock, Unlock, Key, Copy,
    Eye, EyeOff, Plus, Trash2, Crown, Database, Briefcase,
    Server, ShieldCheck, ArrowUpRight, BookOpen, Phone,
    Layers, BarChart3, RefreshCw
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useBranch } from '../hooks/useBranch'
import { toast } from 'react-hot-toast'
import { useDashboardStats, useUpcomingSchedule } from '../hooks/useCommandCentre'
import { useNews } from '../hooks/useNewsManager'
import { AccessHub } from './AccessHub'
import { MobileHome } from './MobileHome'
import { supabase } from '../lib/supabase'
import { NotificationBanner } from './NotificationBanner'
import { FetsChatPopup } from './FetsChatPopup'

// Exam type color map
const EXAM_COLORS: Record<string, { bg: string; border: string; text: string; dot: string }> = {
    PROMETRIC: { bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.4)', text: '#60a5fa', dot: '#3b82f6' },
    PEARSON:   { bg: 'rgba(139,92,246,0.15)', border: 'rgba(139,92,246,0.4)', text: '#a78bfa', dot: '#8b5cf6' },
    PSI:       { bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.4)', text: '#34d399', dot: '#10b981' },
    IELTS:     { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.4)', text: '#fbbf24', dot: '#f59e0b' },
    CELPIP:    { bg: 'rgba(20,184,166,0.15)', border: 'rgba(20,184,166,0.4)', text: '#2dd4bf', dot: '#14b8a6' },
    CMA:       { bg: 'rgba(236,72,153,0.15)', border: 'rgba(236,72,153,0.4)', text: '#f472b6', dot: '#ec4899' },
    DEFAULT:   { bg: 'rgba(100,116,139,0.15)', border: 'rgba(100,116,139,0.3)', text: '#94a3b8', dot: '#64748b' },
}

function getExamColor(clientName: string) {
    const upper = (clientName || '').toUpperCase()
    if (upper.includes('PROMETRIC')) return EXAM_COLORS.PROMETRIC
    if (upper.includes('PEARSON'))   return EXAM_COLORS.PEARSON
    if (upper.includes('PSI'))       return EXAM_COLORS.PSI
    if (upper.includes('IELTS'))     return EXAM_COLORS.IELTS
    if (upper.includes('CELPIP'))    return EXAM_COLORS.CELPIP
    if (upper.includes('CMA'))       return EXAM_COLORS.CMA
    return EXAM_COLORS.DEFAULT
}

const BRANCH_LABELS: Record<string, string> = { calicut: 'Calicut', cochin: 'Cochin', kannur: 'Kannur', global: 'All Centres' }

export default function CommandCentre({ onNavigate, onAiQuery }: { onNavigate?: (tab: string) => void; onAiQuery?: (query: string) => void }) {
    const { profile, user } = useAuth()
    const { activeBranch } = useBranch()

    const { data: dashboardData, isLoading: isLoadingStats } = useDashboardStats()
    const { data: examSchedule = [], isLoading: isLoadingSchedule } = useUpcomingSchedule()
    const { data: newsItems = [] } = useNews()

    const [opsMetrics, setOpsMetrics] = useState({ healthScore: 100, critical: 0, open: 0, topIssue: 'Stable' })
    const [staffPresent, setStaffPresent] = useState<Array<{ name: string; branch: string; check_in?: string }>>([])
    const [loadingAnalysis, setLoadingAnalysis] = useState(true)
    const [activeCenter, setActiveCenter] = useState<string>('all')
    const [vaultEntries, setVaultEntries] = useState<any[]>([])
    const [vaultLoading, setVaultLoading] = useState(true)
    const [vaultSearch, setVaultSearch] = useState('')
    const [activeVaultId, setActiveVaultId] = useState<string | null>(null)
    const [revealMap, setRevealMap] = useState<Record<string, boolean>>({})
    const [isVaultLocked, setIsVaultLocked] = useState(false)

    const notices = useMemo(() => {
        return newsItems
            .filter((item: any) => {
                if (!item.is_active) return false
                return (item.branch_location === 'global' || !item.branch_location) || (item.branch_location === activeBranch)
            })
            .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 5)
    }, [newsItems, activeBranch])

    const fetchAnalysis = React.useCallback(async () => {
        try {
            const { data: events } = await (supabase as any).from('incidents').select('*').gte('created_at', new Date(new Date().setDate(1)).toISOString())
            const openEvents = events?.filter((e: any) => e.status !== 'closed') || []
            const critical = openEvents.filter((e: any) => e.severity === 'critical').length
            const major = openEvents.filter((e: any) => e.severity === 'high' || e.severity === 'medium').length
            const health = Math.max(0, 100 - (critical * 15) - (major * 5) - openEvents.length)
            const categories: Record<string, number> = {}
            events?.forEach((e: any) => { categories[e.category || 'Other'] = (categories[e.category || 'Other'] || 0) + 1 })
            const topCat = Object.entries(categories).sort((a, b) => b[1] - a[1])[0]
            setOpsMetrics({ healthScore: health, critical, open: openEvents.length, topIssue: topCat ? topCat[0] : 'Stable' })

            // Staff attendance today
            const today = new Date().toISOString().split('T')[0]
            const { data: attendance } = await (supabase as any)
                .from('staff_attendance')
                .select('staff_id, check_in, branch_location, staff_profiles(full_name)')
                .eq('date', today)
                .not('check_in', 'is', null)
            if (attendance) {
                setStaffPresent(attendance.map((a: any) => ({
                    name: a.staff_profiles?.full_name || 'Staff',
                    branch: a.branch_location || activeBranch,
                    check_in: a.check_in
                })))
            }
        } catch (e) {
            console.error('Analysis load failed', e)
        } finally {
            setLoadingAnalysis(false)
        }
    }, [activeBranch])

    const fetchVault = React.useCallback(async () => {
        try {
            const { data } = await supabase.from('fets_vault').select('*').order('title', { ascending: true })
            setVaultEntries(data || [])
        } catch (e) {
            console.error('Vault load failed', e)
        } finally {
            setVaultLoading(false)
        }
    }, [])

    useEffect(() => {
        if (user?.id) { fetchAnalysis(); fetchVault() }
    }, [user?.id, fetchAnalysis, fetchVault])

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text)
        toast.success(`${label} copied`, { icon: '✨', style: { background: '#1e1b4b', color: '#a78bfa', border: '1px solid #8b5cf6' } })
    }

    const deleteVaultEntry = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        if (!confirm('Delete this vault entry?')) return
        await supabase.from('fets_vault').delete().eq('id', id)
        toast.success('Entry deleted')
        fetchVault()
    }

    // Today's exams grouped by center
    const examsByCenter = useMemo(() => {
        const map: Record<string, any[]> = { calicut: [], cochin: [], kannur: [], global: [] }
        ;(dashboardData?.todaysExams || []).forEach((exam: any) => {
            const loc = exam.branch_location || exam.location || 'global'
            if (map[loc]) map[loc].push(exam)
            else map.global.push(exam)
        })
        return map
    }, [dashboardData])

    const filteredVault = vaultEntries.filter(e =>
        e.title?.toLowerCase().includes(vaultSearch.toLowerCase()) ||
        e.category?.toLowerCase().includes(vaultSearch.toLowerCase())
    )

    const totalCandidates = (dashboardData?.todaysExams || []).reduce((s: number, e: any) => s + (e.candidate_count || 0), 0)
    const totalSessions = dashboardData?.todaysExams?.length || 0
    const healthColor = opsMetrics.healthScore >= 80 ? '#10b981' : opsMetrics.healthScore >= 50 ? '#f59e0b' : '#ef4444'

    if (isLoadingStats || isLoadingSchedule) {
        return (
            <div className="flex items-center justify-center h-screen bg-gradient-to-br from-[#0d1224] via-[#0d1830] to-[#0a1628]">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative w-16 h-16">
                        <div className="absolute inset-0 rounded-full border-2 border-[#1e3358]" />
                        <div className="absolute inset-0 rounded-full border-2 border-t-[#FFD633] animate-spin" />
                    </div>
                    <span className="text-slate-400 text-sm font-bold uppercase tracking-widest">Loading Command Centre…</span>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0d1224] via-[#0d1830] to-[#0a1628] text-slate-200 pb-16 overflow-x-hidden" style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>

            <NotificationBanner onNavigate={onNavigate} />

            <div className="max-w-[1800px] mx-auto px-4 md:px-8 pt-8">

                {/* ═══════════════════════════════════════════════════════
                    COMMAND HEADER
                ═══════════════════════════════════════════════════════ */}
                <motion.div
                    initial={{ opacity: 0, y: -16 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 gap-6 mt-20"
                >
                    {/* Left branding */}
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-0.5 w-10 bg-gradient-to-r from-[#FFD633] to-transparent rounded-full" />
                            <span className="text-slate-500 font-black text-[10px] uppercase tracking-[0.4em]">
                                Operational Intelligence {activeBranch !== 'global' && `// ${activeBranch.toUpperCase()}`}
                            </span>
                        </div>
                        <h1 className="text-5xl md:text-6xl font-black text-white tracking-tighter uppercase italic leading-none">
                            Command <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFD633] to-amber-400">Centre</span>
                        </h1>
                    </div>

                    {/* Officer plate */}
                    <div className="flex items-center gap-5 bg-[#111d36]/80 border border-[#1e3358] rounded-2xl px-6 py-4 backdrop-blur-sm shadow-xl">
                        {/* Avatar */}
                        <div className="relative">
                            <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-[#FFD633]/30 shadow-lg">
                                <img
                                    src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || 'User')}&background=0F172A&color=FFD633&size=128`}
                                    className="w-full h-full object-cover"
                                    alt="Profile"
                                />
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-[#111d36] shadow" />
                        </div>
                        <div>
                            <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-0.5">On Duty</div>
                            <div className="text-xl font-black text-white uppercase tracking-tight">{profile?.full_name || 'Authorized User'}</div>
                            <div className="flex items-center gap-2 mt-1">
                                <MapPin size={11} className="text-[#FFD633]" />
                                <span className="text-xs text-slate-400 font-bold">{BRANCH_LABELS[activeBranch] || activeBranch}</span>
                                <span className="text-slate-600">·</span>
                                <span className="text-xs text-emerald-400 font-bold">{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* ═══════════════════════════════════════════════════════
                    TODAY'S OPS GLIMPSE — Stat Cards
                ═══════════════════════════════════════════════════════ */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'Sessions Today', value: totalSessions, icon: Calendar, color: '#FFD633', glow: 'rgba(255,214,51,0.15)', sub: `${activeBranch !== 'global' ? activeBranch : 'all centres'}` },
                        { label: 'Candidates', value: totalCandidates, icon: Users, color: '#60a5fa', glow: 'rgba(96,165,250,0.15)', sub: 'registered today' },
                        { label: 'Staff Present', value: staffPresent.length, icon: CheckCircle2, color: '#34d399', glow: 'rgba(52,211,153,0.15)', sub: 'checked in' },
                        { label: 'Ops Health', value: `${opsMetrics.healthScore}%`, icon: Activity, color: healthColor, glow: `${healthColor}22`, sub: opsMetrics.topIssue },
                    ].map((stat, i) => (
                        <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 + i * 0.05 }}
                            className="relative bg-[#111d36]/80 border border-[#1e3358] rounded-2xl p-5 overflow-hidden backdrop-blur-sm group hover:border-opacity-80 transition-all"
                            style={{ boxShadow: `0 0 30px ${stat.glow}` }}>
                            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                style={{ background: `radial-gradient(circle at 80% 20%, ${stat.glow}, transparent 60%)` }} />
                            <div className="relative z-10 flex items-start justify-between mb-3">
                                <div className="p-2.5 rounded-xl" style={{ background: stat.glow }}>
                                    <stat.icon size={20} style={{ color: stat.color }} />
                                </div>
                                <ArrowUpRight size={14} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
                            </div>
                            <div className="relative z-10">
                                <div className="text-3xl font-black" style={{ color: stat.color }}>{stat.value}</div>
                                <div className="text-sm font-bold text-white mt-0.5">{stat.label}</div>
                                <div className="text-[10px] text-slate-500 mt-0.5 capitalize">{stat.sub}</div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>

                {/* ═══════════════════════════════════════════════════════
                    TODAY'S EXAM SCHEDULE BY CENTRE
                ═══════════════════════════════════════════════════════ */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="bg-[#111d36]/80 border border-[#1e3358] rounded-2xl p-6 mb-6 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-[#FFD633]/10">
                                <Building2 size={20} className="text-[#FFD633]" />
                            </div>
                            <div>
                                <h3 className="text-base font-black text-white uppercase tracking-wider">Today's Exam Glimpse</h3>
                                <p className="text-[11px] text-slate-500 mt-0.5">Live session overview across all centres</p>
                            </div>
                        </div>
                        {/* Centre filter tabs */}
                        <div className="flex items-center bg-[#0a1628] rounded-xl border border-[#1e3358] p-1 gap-1">
                            {[
                                { id: 'all', label: 'All' },
                                { id: 'calicut', label: 'Calicut' },
                                { id: 'cochin', label: 'Cochin' },
                                { id: 'kannur', label: 'Kannur' },
                            ].map(c => (
                                <button key={c.id} onClick={() => setActiveCenter(c.id)}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeCenter === c.id
                                        ? 'bg-[#FFD633] text-black shadow-sm'
                                        : 'text-slate-400 hover:text-slate-200'}`}>
                                    {c.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Exam cards grid */}
                    {(() => {
                        const exams = activeCenter === 'all'
                            ? (dashboardData?.todaysExams || [])
                            : (examsByCenter[activeCenter] || [])
                        if (!exams.length) {
                            return (
                                <div className="flex flex-col items-center justify-center py-10 text-slate-500">
                                    <Calendar size={32} className="mb-3 opacity-30" />
                                    <p className="text-sm font-bold">No exams scheduled today</p>
                                    <p className="text-xs mt-1 opacity-60">for {activeCenter === 'all' ? 'any centre' : activeCenter}</p>
                                </div>
                            )
                        }
                        return (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                {exams.map((exam: any, i: number) => {
                                    const ec = getExamColor(exam.client_name || exam.exam_name || '')
                                    const time = exam.start_time || '09:00'
                                    const hour = parseInt(time.split(':')[0])
                                    const session = hour < 12 ? 'AM' : 'PM'
                                    let displayClient = (exam.client_name || 'Unknown').toUpperCase()
                                    if (displayClient.includes('PEARSON')) displayClient = 'Pearson VUE'
                                    if (displayClient.includes('PROMETRIC')) displayClient = 'Prometric'
                                    return (
                                        <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                                            className="rounded-xl p-4 border transition-all hover:scale-[1.02]"
                                            style={{ background: ec.bg, borderColor: ec.border }}>
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <div className="text-xs font-black uppercase tracking-wider" style={{ color: ec.text }}>{displayClient}</div>
                                                    <div className="text-[10px] text-slate-400 mt-0.5 capitalize">{exam.branch_location || activeBranch}</div>
                                                </div>
                                                <div className="flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-black uppercase"
                                                    style={{ background: `${ec.dot}22`, color: ec.text }}>
                                                    <Clock size={9} />{session}
                                                </div>
                                            </div>
                                            <div className="text-[10px] text-slate-300 truncate mb-2">{exam.exam_name || displayClient}</div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] text-slate-500">{time}</span>
                                                <span className="text-sm font-black" style={{ color: ec.text }}>
                                                    {exam.candidate_count || 0} <span className="text-[9px] text-slate-500 font-normal">pax</span>
                                                </span>
                                            </div>
                                        </motion.div>
                                    )
                                })}
                            </div>
                        )
                    })()}
                </motion.div>

                {/* ═══════════════════════════════════════════════════════
                    STAFF PRESENT + NOTICE BOARD (2-col)
                ═══════════════════════════════════════════════════════ */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

                    {/* Staff Present Today */}
                    <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}
                        className="bg-[#111d36]/80 border border-[#1e3358] rounded-2xl p-6 backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-emerald-500/10">
                                    <Users size={18} className="text-emerald-400" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-white uppercase tracking-wider">Staff Present</h3>
                                    <p className="text-[10px] text-slate-500 mt-0.5">Checked in today</p>
                                </div>
                            </div>
                            <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                <span className="text-sm font-black text-emerald-400">{staffPresent.length}</span>
                            </div>
                        </div>
                        {staffPresent.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-slate-500">
                                <Users size={28} className="mb-2 opacity-20" />
                                <p className="text-sm font-bold">No check-ins yet</p>
                                <p className="text-xs mt-1 opacity-60">Attendance will appear here</p>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                                {staffPresent.map((s, i) => (
                                    <div key={i} className="flex items-center justify-between px-4 py-2.5 bg-[#0a1628] border border-[#1e3358] rounded-xl hover:border-emerald-500/30 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-[10px] font-black">
                                                {s.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold text-slate-200">{s.name}</div>
                                                <div className="text-[9px] text-slate-500 capitalize">{s.branch}</div>
                                            </div>
                                        </div>
                                        {s.check_in && (
                                            <div className="flex items-center gap-1 text-[9px] text-emerald-400 font-bold">
                                                <Clock size={9} />
                                                {new Date(s.check_in).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>

                    {/* Notice Board */}
                    <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}
                        className="bg-[#111d36]/80 border border-[#1e3358] rounded-2xl p-6 backdrop-blur-sm">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="p-2.5 rounded-xl bg-violet-500/10">
                                <Bell size={18} className="text-violet-400" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-white uppercase tracking-wider">Notice Board</h3>
                                <p className="text-[10px] text-slate-500 mt-0.5">Latest updates & announcements</p>
                            </div>
                        </div>
                        {notices.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-slate-500">
                                <Bell size={28} className="mb-2 opacity-20" />
                                <p className="text-sm font-bold">No notices</p>
                            </div>
                        ) : (
                            <div className="space-y-2.5 max-h-[200px] overflow-y-auto pr-1">
                                {notices.map((notice: any, i: number) => (
                                    <div key={i} className="flex items-start gap-3 px-4 py-3 bg-[#0a1628] border border-[#1e3358] rounded-xl hover:border-violet-500/30 transition-colors">
                                        <div className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-1.5 shrink-0" />
                                        <div>
                                            <div className="text-xs font-bold text-slate-200 leading-snug">{notice.title}</div>
                                            {notice.content && <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{notice.content}</div>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                </div>

                {/* ═══════════════════════════════════════════════════════
                    F-VAULT — INLINE VIBRANT PREVIEW
                ═══════════════════════════════════════════════════════ */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    className="relative bg-gradient-to-br from-[#1a1040] via-[#120f30] to-[#0a0820] border border-violet-900/40 rounded-2xl overflow-hidden mb-6"
                    style={{ boxShadow: '0 0 60px rgba(139,92,246,0.08)' }}>

                    {/* Ambient glow */}
                    <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-violet-600/5 blur-3xl -mr-16 -mt-16 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-amber-500/5 blur-3xl -ml-12 -mb-12 pointer-events-none" />

                    {/* Vault Header */}
                    <div className="relative z-10 px-6 py-5 border-b border-violet-900/30 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-purple-900 flex items-center justify-center shadow-lg shadow-violet-900/40 border border-violet-500/30">
                                <Crown size={22} className="text-amber-300" />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                                    F — Vault
                                    <span className="px-2 py-0.5 rounded-md bg-violet-500/20 border border-violet-500/30 text-[9px] font-black text-violet-300 uppercase tracking-widest">
                                        {filteredVault.length} assets
                                    </span>
                                </h2>
                                <p className="text-[10px] text-violet-400/70 mt-0.5 font-bold uppercase tracking-widest">Classified Assets & Secure Credentials</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {/* Lock toggle */}
                            <button onClick={() => setIsVaultLocked(!isVaultLocked)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all ${isVaultLocked
                                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-400 shadow-amber-900/20'
                                    : 'bg-violet-500/10 border-violet-500/30 text-violet-400 hover:bg-violet-500/20'}`}>
                                {isVaultLocked ? <Lock size={13} /> : <Unlock size={13} />}
                                {isVaultLocked ? 'Locked' : 'Lock'}
                            </button>
                            {/* Open full vault */}
                            <button onClick={() => onNavigate?.('access-hub')}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-700 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-violet-900/30 hover:shadow-violet-900/50 hover:-translate-y-0.5 transition-all">
                                <ExternalLink size={12} /> Open Vault
                            </button>
                        </div>
                    </div>

                    {/* Locked overlay */}
                    {isVaultLocked ? (
                        <div className="relative z-10 flex flex-col items-center justify-center py-16 px-6 text-center">
                            <div className="w-48 h-48 rounded-full border border-violet-900/30 border-dashed animate-[spin_15s_linear_infinite] absolute opacity-30" />
                            <ShieldCheck size={52} className="text-violet-500 mb-4 animate-pulse" />
                            <div className="text-xl font-black text-white uppercase tracking-widest mb-1">Vault Secured</div>
                            <div className="text-xs text-violet-400/70 mb-6 uppercase tracking-widest">Access Protected</div>
                            <button onClick={() => setIsVaultLocked(false)}
                                className="px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-700 text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-violet-900/30 hover:shadow-violet-900/50 transition-all">
                                Unlock Vault
                            </button>
                        </div>
                    ) : (
                        <div className="relative z-10 p-6">
                            {/* Search */}
                            <div className="relative mb-5 max-w-sm">
                                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-violet-400/60" />
                                <input type="text" value={vaultSearch} onChange={e => setVaultSearch(e.target.value)}
                                    placeholder="Search vault entries…"
                                    className="w-full bg-[#1a1040]/60 border border-violet-900/40 rounded-xl py-2.5 pl-10 pr-4 text-sm text-violet-100 placeholder-violet-900/60 outline-none focus:border-violet-500/50 transition-all" />
                            </div>

                            {/* Entries grid */}
                            {vaultLoading ? (
                                <div className="flex items-center justify-center py-8 text-violet-500/50">
                                    <div className="w-8 h-8 border-2 border-violet-900/30 border-t-violet-500 rounded-full animate-spin" />
                                </div>
                            ) : filteredVault.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-8 text-violet-500/40">
                                    <Crown size={36} className="mb-2" />
                                    <p className="text-sm font-bold">Vault is empty</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {filteredVault.slice(0, 6).map((entry) => (
                                        <motion.div key={entry.id} layoutId={`vault-${entry.id}`}
                                            onClick={() => setActiveVaultId(activeVaultId === entry.id ? null : entry.id)}
                                            className={`group relative rounded-xl border overflow-hidden cursor-pointer transition-all duration-300 ${activeVaultId === entry.id
                                                ? 'border-violet-500/60 bg-gradient-to-br from-violet-900/30 to-purple-900/20 shadow-[0_0_30px_rgba(139,92,246,0.15)]'
                                                : 'border-violet-900/30 bg-[#1a1040]/40 hover:border-violet-500/40 hover:shadow-lg'}`}>
                                            <div className="p-4">
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${activeVaultId === entry.id ? 'bg-violet-500 text-white' : 'bg-violet-900/40 text-violet-400'}`}>
                                                            {activeVaultId === entry.id ? <Unlock size={16} /> : <Lock size={14} />}
                                                        </div>
                                                        <div>
                                                            <div className={`text-sm font-black uppercase tracking-wide ${activeVaultId === entry.id ? 'text-violet-100' : 'text-violet-300 group-hover:text-violet-100'}`}>
                                                                {entry.title}
                                                            </div>
                                                            <div className="text-[9px] text-violet-900/80 uppercase tracking-widest font-bold">{entry.category}</div>
                                                        </div>
                                                    </div>
                                                    <button onClick={(e) => deleteVaultEntry(entry.id, e)}
                                                        className="p-1.5 opacity-0 group-hover:opacity-100 text-violet-900/60 hover:text-red-400 transition-all rounded-lg hover:bg-red-900/20">
                                                        <Trash2 size={13} />
                                                    </button>
                                                </div>

                                                {/* Expanded details */}
                                                <AnimatePresence>
                                                    {activeVaultId === entry.id && (
                                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                                            className="overflow-hidden border-t border-violet-900/30 pt-3 mt-1 space-y-2">
                                                            {entry.username && (
                                                                <div className="flex items-center justify-between bg-black/30 rounded-lg px-3 py-2">
                                                                    <div>
                                                                        <div className="text-[9px] text-violet-900/70 uppercase tracking-widest">Username</div>
                                                                        <div className="text-xs font-mono text-violet-200">{entry.username}</div>
                                                                    </div>
                                                                    <button onClick={() => copyToClipboard(entry.username, 'Username')} className="text-violet-700 hover:text-violet-300"><Copy size={12} /></button>
                                                                </div>
                                                            )}
                                                            {entry.password && (
                                                                <div className="flex items-center justify-between bg-black/30 rounded-lg px-3 py-2">
                                                                    <div>
                                                                        <div className="text-[9px] text-violet-900/70 uppercase tracking-widest">Password</div>
                                                                        <div className="text-xs font-mono text-violet-200 tracking-wider">
                                                                            {revealMap[entry.id] ? entry.password : '••••••••••'}
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex gap-1.5">
                                                                        <button onClick={() => setRevealMap(p => ({ ...p, [entry.id]: !p[entry.id] }))} className="text-violet-700 hover:text-violet-300"><Eye size={12} /></button>
                                                                        <button onClick={() => copyToClipboard(entry.password, 'Password')} className="text-violet-700 hover:text-violet-300"><Copy size={12} /></button>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {entry.url && (
                                                                <a href={entry.url} target="_blank" rel="noopener noreferrer"
                                                                    className="flex items-center gap-2 text-[10px] font-bold text-violet-400 hover:text-violet-200 px-3 py-1.5 bg-black/20 rounded-lg transition-colors">
                                                                    <Globe size={11} /> Open Portal <ExternalLink size={9} />
                                                                </a>
                                                            )}
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </motion.div>
                                    ))}
                                    {filteredVault.length > 6 && (
                                        <button onClick={() => onNavigate?.('access-hub')}
                                            className="flex flex-col items-center justify-center rounded-xl border border-violet-900/30 border-dashed bg-[#1a1040]/20 p-4 text-violet-500/60 hover:text-violet-400 hover:border-violet-500/40 transition-all group">
                                            <Plus size={20} className="mb-1.5 group-hover:scale-110 transition-transform" />
                                            <span className="text-xs font-bold">+{filteredVault.length - 6} more</span>
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </motion.div>

                {/* ═══════════════════════════════════════════════════════
                    QUICK LINKS — Vibrant Card Grid
                ═══════════════════════════════════════════════════════ */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                    className="bg-[#111d36]/80 border border-[#1e3358] rounded-2xl p-6 mb-6 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2.5 rounded-xl bg-sky-500/10">
                            <Zap size={18} className="text-sky-400" />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-white uppercase tracking-wider">Quick Launch</h3>
                            <p className="text-[11px] text-slate-500 mt-0.5">Partner portals & exam platforms</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            {
                                name: 'Pearson VUE',
                                url: 'https://connect.pearsonvue.com/',
                                image: '/client-logos/pearson.png',
                                color: '#a78bfa',
                                glow: 'rgba(167,139,250,0.12)',
                                border: 'rgba(167,139,250,0.2)',
                                tag: 'VUE Connect'
                            },
                            {
                                name: 'Prometric',
                                url: 'https://easyserve.prometric.com/',
                                image: '/client-logos/prometric.png',
                                color: '#60a5fa',
                                glow: 'rgba(96,165,250,0.12)',
                                border: 'rgba(96,165,250,0.2)',
                                tag: 'EasyServe'
                            },
                            {
                                name: 'CMA US',
                                url: 'https://proscheduler.prometric.com/',
                                image: '/client-logos/cma_us.png',
                                color: '#34d399',
                                glow: 'rgba(52,211,153,0.12)',
                                border: 'rgba(52,211,153,0.2)',
                                tag: 'ProScheduler'
                            },
                            {
                                name: 'PSI Exams',
                                url: 'https://test-takers.psiexams.com/',
                                image: '/client-logos/psi.png',
                                color: '#fbbf24',
                                glow: 'rgba(251,191,36,0.12)',
                                border: 'rgba(251,191,36,0.2)',
                                tag: 'Test Takers'
                            },
                        ].map((link) => (
                            <a key={link.name} href={link.url} target="_blank" rel="noopener noreferrer"
                                className="group relative flex flex-col items-center justify-between gap-4 p-5 rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl overflow-hidden"
                                style={{ background: link.glow, borderColor: link.border }}>
                                {/* Glow on hover */}
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"
                                    style={{ background: `radial-gradient(circle at 50% 0%, ${link.glow}, transparent 70%)` }} />
                                <div className="relative z-10 w-full h-16 flex items-center justify-center p-2">
                                    <img src={link.image} alt={link.name}
                                        className="w-full h-full object-contain filter brightness-90 group-hover:brightness-110 transition-all duration-300 scale-110" />
                                </div>
                                <div className="relative z-10 w-full text-center">
                                    <div className="text-xs font-black uppercase tracking-wider" style={{ color: link.color }}>{link.name}</div>
                                    <div className="flex items-center justify-center gap-1 mt-1.5">
                                        <span className="text-[9px] text-slate-500 font-bold">{link.tag}</span>
                                        <ExternalLink size={8} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
                                    </div>
                                </div>
                            </a>
                        ))}
                    </div>
                </motion.div>

            </div>
        </div>
    )
}
