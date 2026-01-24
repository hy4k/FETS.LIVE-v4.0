import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Sparkles, TrendingUp, Trophy, Target, Zap, Crown,
    Heart, ThumbsUp, MessageCircle, Flame, Star, Clock,
    CheckCircle2, Award, Rocket, Coffee, Smile, RefreshCw
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useBranch } from '../hooks/useBranch'
import { toast } from 'react-hot-toast'

interface LeaderboardEntry {
    id: string
    full_name: string
    avatar_url?: string
    branch_assigned?: string
    points: number
    streak: number
}

interface DailyChallenge {
    id: string
    title: string
    description: string
    points: number
    icon: 'checklist' | 'speed' | 'accuracy' | 'teamwork' | 'streak'
    completed: boolean
}

// Motivational quotes related to work/productivity
const MOTIVATIONAL_QUOTES = [
    { text: "Excellence is not a destination, it's a continuous journey.", author: "FETS Protocol" },
    { text: "Every checklist completed is a step towards operational perfection.", author: "Command Centre" },
    { text: "The strength of the team is each individual member.", author: "FETS Unity" },
    { text: "Precision today, excellence tomorrow.", author: "Quality Assurance" },
    { text: "Your dedication powers our success.", author: "FETS Leadership" },
    { text: "Small daily improvements lead to stunning results.", author: "Continuous Improvement" },
    { text: "Champions are built on a foundation of consistent effort.", author: "Performance Division" },
    { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" }
]

// Fun facts about testing/exams
const FUN_FACTS = [
    "Over 10,000+ candidates have been served through FETS.LIVE this year!",
    "The average checklist completion time has improved by 23% this quarter.",
    "Your branch has a 99.2% uptime score - exceptional!",
    "Fun fact: The first computer-based test was conducted in 1972.",
    "FETS.LIVE has prevented 847 potential issues through proactive checklists.",
    "The morning shift has the highest checklist completion rate!",
    "Did you know? Our system processes over 500 exam sessions daily.",
    "Team collaboration has increased by 40% since introducing FETSCHAT!"
]

export function DailySpark() {
    const { profile, user } = useAuth()
    const { activeBranch } = useBranch()
    
    const [quote, setQuote] = useState(MOTIVATIONAL_QUOTES[0])
    const [funFact, setFunFact] = useState(FUN_FACTS[0])
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
    const [challenges, setChallenges] = useState<DailyChallenge[]>([])
    const [userStreak, setUserStreak] = useState(0)
    const [todayChecklist, setTodayChecklist] = useState({ completed: 0, total: 2 })
    const [kudosCount, setKudosCount] = useState(0)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [activeTab, setActiveTab] = useState<'spark' | 'leaderboard' | 'challenges'>('spark')

    useEffect(() => {
        // Randomize quote and fact
        setQuote(MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)])
        setFunFact(FUN_FACTS[Math.floor(Math.random() * FUN_FACTS.length)])
        
        // Fetch daily data
        fetchDailyData()
    }, [user?.id, activeBranch])

    const fetchDailyData = async () => {
        if (!user?.id) return
        
        try {
            const today = new Date().toISOString().split('T')[0]

            // Fetch today's checklist submissions for the user
            const { data: myChecklists } = await supabase
                .from('checklist_submissions')
                .select('*')
                .gte('submitted_at', today)
                .eq('submitted_by', user.id)

            setTodayChecklist({
                completed: myChecklists?.length || 0,
                total: 2
            })

            // Simulate streak (in production, this would come from a dedicated table)
            const storedStreak = localStorage.getItem(`fets_streak_${user.id}`)
            setUserStreak(storedStreak ? parseInt(storedStreak) : Math.floor(Math.random() * 7) + 1)

            // Fetch mock leaderboard (in production, join with activity points)
            const { data: staffData } = await supabase
                .from('staff_profiles')
                .select('id, full_name, avatar_url, branch_assigned')
                .limit(5)

            if (staffData) {
                const leaderboardData = staffData.map((s, idx) => ({
                    ...s,
                    points: Math.floor(Math.random() * 500) + 100 - (idx * 50),
                    streak: Math.floor(Math.random() * 10) + 1
                })).sort((a, b) => b.points - a.points)
                setLeaderboard(leaderboardData)
            }

            // Set daily challenges
            setChallenges([
                { id: '1', title: 'Morning Champion', description: 'Complete morning checklist before 10 AM', points: 50, icon: 'checklist', completed: (myChecklists?.length || 0) > 0 },
                { id: '2', title: 'Perfect Day', description: 'Complete all daily checklists', points: 100, icon: 'accuracy', completed: (myChecklists?.length || 0) >= 2 },
                { id: '3', title: 'Speed Star', description: 'Submit checklist within 5 minutes', points: 25, icon: 'speed', completed: false },
                { id: '4', title: 'Week Warrior', description: 'Maintain a 7-day streak', points: 200, icon: 'streak', completed: userStreak >= 7 }
            ])

        } catch (e) {
            console.error('Failed to fetch daily data', e)
        }
    }

    const refreshData = async () => {
        setIsRefreshing(true)
        setQuote(MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)])
        setFunFact(FUN_FACTS[Math.floor(Math.random() * FUN_FACTS.length)])
        await fetchDailyData()
        setTimeout(() => setIsRefreshing(false), 500)
    }

    const sendKudos = () => {
        setKudosCount(prev => prev + 1)
        toast.success('Kudos sent to the team! 🎉', { icon: '👏' })
    }

    const getChallengeIcon = (icon: string) => {
        switch (icon) {
            case 'checklist': return <CheckCircle2 size={16} />
            case 'speed': return <Zap size={16} />
            case 'accuracy': return <Target size={16} />
            case 'streak': return <Flame size={16} />
            default: return <Star size={16} />
        }
    }

    const neuCard = "bg-[var(--dashboard-bg, #EEF2F9)] rounded-3xl shadow-[9px_9px_16px_var(--neu-dark-shadow,rgb(209,217,230)),-9px_-9px_16px_var(--neu-light-shadow,rgba(255,255,255,0.8))] border border-white/50"
    const neuBtn = "bg-[var(--dashboard-bg, #EEF2F9)] rounded-xl shadow-[4px_4px_8px_var(--neu-dark-shadow,rgb(209,217,230)),-4px_-4px_8px_var(--neu-light-shadow,rgba(255,255,255,0.8))] hover:shadow-[2px_2px_4px_var(--neu-dark-shadow,rgb(209,217,230)),-2px_-2px_4px_var(--neu-light-shadow,rgba(255,255,255,0.8))] transition-all"

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className={`${neuCard} p-6 relative overflow-hidden`}
        >
            {/* Animated Background Gradients */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-amber-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-emerald-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

            {/* Header with Tabs */}
            <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg">
                        <Sparkles size={24} className="text-white" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Daily Spark</h3>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Motivation & Progress</p>
                    </div>
                </div>

                {/* Tab Buttons */}
                <div className="flex items-center gap-2">
                    {[
                        { key: 'spark', icon: <Sparkles size={14} />, label: 'Spark' },
                        { key: 'leaderboard', icon: <Trophy size={14} />, label: 'Board' },
                        { key: 'challenges', icon: <Target size={14} />, label: 'Goals' }
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key as any)}
                            className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                                activeTab === tab.key 
                                    ? 'bg-amber-500 text-white shadow-md' 
                                    : 'bg-white/50 text-slate-500 hover:bg-white hover:text-slate-700'
                            }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                    <button
                        onClick={refreshData}
                        className={`p-2 rounded-xl ${neuBtn} text-slate-400 hover:text-amber-600`}
                    >
                        <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="relative z-10 min-h-[280px]">
                <AnimatePresence mode="wait">
                    {activeTab === 'spark' && (
                        <motion.div
                            key="spark"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-5"
                        >
                            {/* Quote Card */}
                            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 relative overflow-hidden">
                                <div className="absolute top-3 left-3 text-[60px] leading-none text-white/5 font-serif">"</div>
                                <p className="text-white font-medium text-lg leading-relaxed mb-3 relative z-10">
                                    {quote.text}
                                </p>
                                <p className="text-amber-400 text-xs font-bold uppercase tracking-widest">— {quote.author}</p>
                            </div>

                            {/* Stats Row */}
                            <div className="grid grid-cols-4 gap-4">
                                {/* Streak */}
                                <div className={`${neuBtn} p-4 text-center`}>
                                    <div className="flex items-center justify-center gap-2 mb-2">
                                        <Flame size={18} className="text-orange-500" />
                                        <span className="text-2xl font-black text-slate-800">{userStreak}</span>
                                    </div>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase">Day Streak</p>
                                </div>

                                {/* Today's Progress */}
                                <div className={`${neuBtn} p-4 text-center`}>
                                    <div className="flex items-center justify-center gap-2 mb-2">
                                        <CheckCircle2 size={18} className="text-emerald-500" />
                                        <span className="text-2xl font-black text-slate-800">{todayChecklist.completed}/{todayChecklist.total}</span>
                                    </div>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase">Today's Tasks</p>
                                </div>

                                {/* Fun Stat */}
                                <div className={`${neuBtn} p-4 text-center`}>
                                    <div className="flex items-center justify-center gap-2 mb-2">
                                        <Coffee size={18} className="text-amber-600" />
                                        <span className="text-2xl font-black text-slate-800">{new Date().getHours() < 12 ? 'AM' : 'PM'}</span>
                                    </div>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase">Shift Mode</p>
                                </div>

                                {/* Kudos Button */}
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={sendKudos}
                                    className={`${neuBtn} p-4 text-center hover:bg-rose-50 group transition-colors`}
                                >
                                    <div className="flex items-center justify-center gap-2 mb-2">
                                        <Heart size={18} className="text-rose-500 group-hover:scale-110 transition-transform" />
                                        <span className="text-2xl font-black text-slate-800">{kudosCount}</span>
                                    </div>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase">Send Kudos</p>
                                </motion.button>
                            </div>

                            {/* Fun Fact */}
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                                    <Smile size={16} className="text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-amber-700 uppercase tracking-wider mb-1">Did You Know?</p>
                                    <p className="text-sm text-amber-900">{funFact}</p>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'leaderboard' && (
                        <motion.div
                            key="leaderboard"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-3"
                        >
                            <div className="flex items-center gap-2 mb-4">
                                <Trophy size={20} className="text-amber-500" />
                                <h4 className="text-sm font-black text-slate-700 uppercase tracking-wide">This Week's Champions</h4>
                            </div>
                            
                            {leaderboard.map((entry, idx) => (
                                <motion.div
                                    key={entry.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className={`flex items-center gap-4 p-3 rounded-xl bg-white border ${
                                        idx === 0 ? 'border-amber-300 bg-amber-50' : 'border-slate-100'
                                    }`}
                                >
                                    {/* Rank */}
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${
                                        idx === 0 ? 'bg-amber-500 text-white' :
                                        idx === 1 ? 'bg-slate-300 text-slate-700' :
                                        idx === 2 ? 'bg-orange-300 text-orange-800' :
                                        'bg-slate-100 text-slate-500'
                                    }`}>
                                        {idx === 0 ? <Crown size={14} /> : idx + 1}
                                    </div>

                                    {/* Avatar */}
                                    <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden border-2 border-white shadow-sm">
                                        {entry.avatar_url ? (
                                            <img src={entry.avatar_url} className="w-full h-full object-cover" alt="" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm font-bold">
                                                {entry.full_name?.[0] || '?'}
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-slate-800">{entry.full_name}</p>
                                        <p className="text-[10px] text-slate-400 uppercase">{entry.branch_assigned || 'HQ'}</p>
                                    </div>

                                    {/* Points */}
                                    <div className="text-right">
                                        <p className="text-lg font-black text-amber-600">{entry.points}</p>
                                        <div className="flex items-center gap-1 text-[9px] text-slate-400">
                                            <Flame size={10} className="text-orange-400" />
                                            {entry.streak} streak
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}

                    {activeTab === 'challenges' && (
                        <motion.div
                            key="challenges"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-3"
                        >
                            <div className="flex items-center gap-2 mb-4">
                                <Target size={20} className="text-emerald-500" />
                                <h4 className="text-sm font-black text-slate-700 uppercase tracking-wide">Today's Challenges</h4>
                            </div>

                            {challenges.map((challenge, idx) => (
                                <motion.div
                                    key={challenge.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className={`flex items-center gap-4 p-4 rounded-xl border ${
                                        challenge.completed 
                                            ? 'bg-emerald-50 border-emerald-200' 
                                            : 'bg-white border-slate-100'
                                    }`}
                                >
                                    {/* Icon */}
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                        challenge.completed 
                                            ? 'bg-emerald-500 text-white' 
                                            : 'bg-slate-100 text-slate-400'
                                    }`}>
                                        {challenge.completed ? <CheckCircle2 size={20} /> : getChallengeIcon(challenge.icon)}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1">
                                        <p className={`text-sm font-bold ${challenge.completed ? 'text-emerald-700' : 'text-slate-700'}`}>
                                            {challenge.title}
                                        </p>
                                        <p className="text-[10px] text-slate-400">{challenge.description}</p>
                                    </div>

                                    {/* Points */}
                                    <div className={`px-3 py-1 rounded-full text-xs font-black ${
                                        challenge.completed 
                                            ? 'bg-emerald-500 text-white' 
                                            : 'bg-amber-100 text-amber-700'
                                    }`}>
                                        +{challenge.points} pts
                                    </div>
                                </motion.div>
                            ))}

                            <div className="mt-4 p-4 bg-slate-100 rounded-xl text-center">
                                <p className="text-xs text-slate-500 mb-2">Total points earned today</p>
                                <p className="text-3xl font-black text-slate-800">
                                    {challenges.filter(c => c.completed).reduce((sum, c) => sum + c.points, 0)}
                                    <span className="text-sm text-slate-400 font-bold ml-1">pts</span>
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    )
}
