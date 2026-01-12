import React, { useState, useEffect, useMemo } from 'react';
import {
    BarChart3,
    Calendar,
    Users,
    MapPin,
    Clock,
    TrendingUp,
    ShieldAlert,
    CheckCircle2,
    Search,
    RefreshCw,
    BrainCircuit,
    Activity
} from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { format, parseISO, startOfDay, endOfDay } from 'date-fns';

interface ExtendedSubmission {
    id: string;
    template_id: string;
    submitted_by: string;
    branch_id: string | null;
    submitted_at: string;
    answers: any;
    status: string;
    checklist_templates: {
        title: string;
        type: string;
        questions: any[];
    };
    submitted_by_profile: {
        full_name: string;
        base_centre?: string;
    };
}

export const ChecklistAnalysis: React.FC<{ currentUser: any; activeBranch?: string; onClose?: () => void }> = ({ currentUser, activeBranch, onClose }) => {
    const [loading, setLoading] = useState(true);
    const [submissions, setSubmissions] = useState<ExtendedSubmission[]>([]);
    const [dateFilter, setDateFilter] = useState<string>('');

    useEffect(() => {
        fetchSubmissions();
    }, [dateFilter, activeBranch]);

    const fetchSubmissions = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('checklist_submissions')
                .select(`
                    *,
                    checklist_templates (
                        title,
                        type,
                        questions
                    )
                `);

            if (dateFilter) {
                const start = startOfDay(new Date(dateFilter)).toISOString();
                const end = endOfDay(new Date(dateFilter)).toISOString();
                query = query.gte('submitted_at', start).lte('submitted_at', end);
            }

            if (activeBranch && activeBranch !== 'global') {
                query = query.eq('branch_id', activeBranch);
            }

            const { data, error } = await query.order('submitted_at', { ascending: false });

            if (error) throw error;

            // Fetch all profiles at once for efficiency
            const { data: profiles } = await supabase
                .from('staff_profiles')
                .select('user_id, full_name, base_centre');

            const profileMap = (profiles || []).reduce((acc: any, p) => {
                acc[p.user_id] = p;
                return acc;
            }, {});

            const enrichedData = (data || []).map((sub: any) => ({
                ...sub,
                submitted_by_profile: profileMap[sub.submitted_by] || { full_name: 'Unknown User' }
            }));

            setSubmissions(enrichedData as ExtendedSubmission[]);
        } catch (error) {
            console.error('Error:', error);
            toast.error('Failed to load analysis');
        } finally {
            setLoading(false);
        }
    };

    const metrics = useMemo(() => {
        const staffStats: Record<string, { count: number; frequent: string }> = {};
        const centreStats: Record<string, number> = {};
        const timeStats: Record<string, number> = { morning: 0, afternoon: 0, evening: 0 };
        const questionFailures: Record<string, number> = {};
        let totalIssues = 0;
        let positives = 0;

        submissions.forEach(sub => {
            // Staff Stats
            const name = sub.submitted_by_profile.full_name;
            if (!staffStats[name]) staffStats[name] = { count: 0, frequent: sub.checklist_templates?.title };
            staffStats[name].count++;

            // Centre Stats
            const centre = sub.branch_id || 'global';
            centreStats[centre] = (centreStats[centre] || 0) + 1;

            // Time Stats
            const hour = new Date(sub.submitted_at).getHours();
            if (hour < 12) timeStats.morning++;
            else if (hour < 17) timeStats.afternoon++;
            else timeStats.evening++;

            // Content Analysis (Functioning Evaluation)
            const answers = sub.answers || {};
            const questions = sub.checklist_templates?.questions || [];

            questions.forEach((q: any) => {
                const ans = answers[q.id];
                if (ans === false || ans === 'No' || ans === 'Incomplete') {
                    totalIssues++;
                    questionFailures[q.text] = (questionFailures[q.text] || 0) + 1;
                }
                if (ans === true || ans === 'Yes' || ans === 'Completed') positives++;
            });
        });

        const topFailingQuestions = Object.entries(questionFailures)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);

        return { staffStats, centreStats, timeStats, totalIssues, positives, total: submissions.length, topFailingQuestions };
    }, [submissions]);

    // Qualitative Evaluation
    const evaluation = useMemo(() => {
        if (submissions.length === 0) return "No data for evaluation.";
        const issueRate = (metrics.totalIssues / (metrics.total || 1)).toFixed(1);
        if (metrics.totalIssues > metrics.positives) return "CRITICAL: Multiple operational non-compliances detected. Centre functioning is sub-optimal.";
        if (metrics.totalIssues > 0) return "STABLE: Minor issues flagged. Operation is generally healthy but requires vigilance.";
        return "OPTIMAL: All checks passed. Professional excellence maintained across all protocols.";
    }, [metrics, submissions]);

    const neumorphicCard = "bg-[#e0e5ec] shadow-[9px_9px_16px_#bebebe,-9px_-9px_16px_#ffffff] rounded-3xl p-8 border border-white/20";
    const neumorphicInset = "bg-[#e0e5ec] shadow-[inset_6px_6px_10px_#bebebe,inset_-6px_-6px_10px_#ffffff] rounded-2xl p-6";

    return (
        <div className="min-h-screen -mt-32 pt-48 bg-[#e0e5ec] pb-12 font-sans">
            <div className="max-w-[1600px] mx-auto px-6">
                {/* Header */}
                <div className="flex justify-between items-center mb-12">
                    <div>
                        <h1 className="text-5xl font-black text-gray-700 uppercase tracking-tighter">Operational <span className="text-amber-600">Intelligence</span></h1>
                        <p className="text-gray-500 font-bold uppercase tracking-widest text-sm mt-2">Evaluation & Performance Metrics</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="bg-[#e0e5ec] shadow-[inset_4px_4px_8px_#bebebe,inset_-4px_-4px_8px_#ffffff] px-6 py-3 rounded-2xl flex items-center gap-4">
                            <div className="flex items-center gap-3 border-r border-gray-300 pr-4">
                                <Calendar size={18} className="text-amber-500" />
                                <input
                                    type="date"
                                    value={dateFilter}
                                    onChange={(e) => setDateFilter(e.target.value)}
                                    className="bg-transparent outline-none font-bold text-gray-600 uppercase text-xs"
                                />
                            </div>
                            <button
                                onClick={() => setDateFilter('')}
                                className={`text-[10px] font-black uppercase tracking-widest transition-colors ${!dateFilter ? 'text-amber-600' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                All Time
                            </button>
                        </div>
                        <button onClick={fetchSubmissions} className="p-4 rounded-2xl bg-[#e0e5ec] shadow-[6px_6px_12px_#bebebe,-6px_-6px_12px_#ffffff] text-gray-600 hover:text-amber-600 active:scale-95 transition-all">
                            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>

                {/* Top Metrics - ONLY SECTION KEPT AS REQUESTED */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
                    {[
                        { label: 'Total Submissions', value: metrics.total, icon: BrainCircuit, color: 'text-blue-600' },
                        { label: 'Active Personnel', value: Object.keys(metrics.staffStats).length, icon: Users, color: 'text-purple-600' },
                        { label: 'Issues Detected', value: metrics.totalIssues, icon: ShieldAlert, color: 'text-red-500' },
                        { label: 'Compliance Rate', value: metrics.total > 0 ? Math.round((metrics.positives / (metrics.positives + metrics.totalIssues)) * 100) + '%' : '0%', icon: CheckCircle2, color: 'text-green-600' }
                    ].map((m, i) => (
                        <div key={i} className={neumorphicCard}>
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">{m.label}</p>
                            <div className="flex items-center justify-between">
                                <h2 className={`text-4xl font-black ${m.color}`}>{m.value}</h2>
                                <m.icon size={32} className="opacity-20" />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Staff & Centre Frequency */}
                    <div className="lg:col-span-2 space-y-12">
                        <div className={neumorphicCard}>
                            <h3 className="text-xl font-black text-gray-700 uppercase tracking-tight mb-8 flex items-center gap-3">
                                <Users className="text-amber-500" /> Personnel Contribution & Frequency
                            </h3>
                            <div className="space-y-6">
                                {Object.entries(metrics.staffStats).map(([name, stats], i) => (
                                    <div key={i} className="flex items-center gap-6 p-4 rounded-2xl hover:bg-white/30 transition-colors">
                                        <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 font-bold shadow-sm">{name[0]}</div>
                                        <div className="flex-1">
                                            <p className="font-bold text-gray-700">{name}</p>
                                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Often: {stats.frequent}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-black text-gray-700">{stats.count}</p>
                                            <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">Checklists</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <div className={neumorphicCard}>
                                <h3 className="text-lg font-black text-gray-700 uppercase mb-6 flex items-center gap-2"><MapPin size={18} className="text-amber-500" /> Centre Performance</h3>
                                <div className="space-y-4">
                                    {Object.entries(metrics.centreStats).map(([c, count], i) => (
                                        <div key={i} className="flex justify-between items-center p-3 rounded-xl border border-white/50">
                                            <span className="font-bold text-gray-600 uppercase text-xs">{c}</span>
                                            <span className="font-black text-amber-600">{count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className={neumorphicCard}>
                                <h3 className="text-lg font-black text-gray-700 uppercase mb-6 flex items-center gap-2"><Clock size={18} className="text-amber-500" /> Time Analysis</h3>
                                <div className="space-y-4 text-xs font-bold text-gray-500">
                                    <div className="flex items-center justify-between"><span>Morning (AM)</span><span className="text-gray-700 font-black">{metrics.timeStats.morning}</span></div>
                                    <div className="flex items-center justify-between"><span>Afternoon (PM)</span><span className="text-gray-700 font-black">{metrics.timeStats.afternoon}</span></div>
                                    <div className="flex items-center justify-between"><span>Evening (LATE)</span><span className="text-gray-700 font-black">{metrics.timeStats.evening}</span></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Functional Evaluation (AI Style) */}
                    <div className="space-y-12">
                        <div className={`${neumorphicCard} bg-gray-900 border-none`}>
                            <h3 className="text-xl font-black text-white uppercase tracking-tight mb-8 flex items-center gap-3">
                                <TrendingUp className="text-amber-500" /> Functioning Evaluation
                            </h3>
                            <div className="p-6 bg-white/5 rounded-2xl border border-white/10 mb-8">
                                <p className="text-white font-medium text-sm leading-relaxed mb-4 italic opacity-90">"{evaluation}"</p>
                                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-amber-500 transition-all duration-1000"
                                        style={{ width: metrics.total > 0 ? `${(metrics.positives / (metrics.positives + metrics.totalIssues)) * 100}%` : '0%' }}
                                    />
                                </div>
                                <div className="flex justify-between mt-2 text-[8px] font-black text-white/40 uppercase tracking-widest">
                                    <span>Compromised</span>
                                    <span>Excellent</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-white/70 text-xs text-red-400">
                                    <ShieldAlert size={14} />
                                    <span>Critical Failure Points:</span>
                                </div>
                                {metrics.topFailingQuestions.length > 0 ? (
                                    metrics.topFailingQuestions.map(([q, count], i) => (
                                        <div key={i} className="flex justify-between items-center bg-red-500/10 p-3 rounded-xl border border-red-500/20">
                                            <span className="text-[10px] text-white font-medium truncate max-w-[150px]">{q}</span>
                                            <span className="text-white font-black text-xs">{count}x</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex items-center gap-2 text-green-400 text-[10px] font-bold">
                                        <CheckCircle2 size={12} />
                                        Zero Critical Failures Detected
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className={neumorphicCard}>
                            <Activity className="text-amber-500 mb-4" />
                            <h4 className="font-black text-gray-700 uppercase text-sm mb-2">Real-time Stream</h4>
                            <div className="max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                {submissions.slice(0, 5).map((s, i) => (
                                    <div key={i} className="mb-4 pb-4 border-b border-gray-100 last:border-0">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase">{format(new Date(s.submitted_at), 'HH:mm')}</p>
                                        <p className="text-xs font-black text-gray-700 uppercase leading-none mt-1">{s.submitted_by_profile.full_name}</p>
                                        <p className="text-[9px] text-amber-600 mt-1">{s.checklist_templates.title}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
