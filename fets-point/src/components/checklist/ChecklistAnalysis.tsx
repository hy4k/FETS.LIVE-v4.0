import React, { useState, useEffect, useMemo } from 'react';
import {
    BarChart3,
    Calendar,
    Download,
    FileText,
    TrendingUp,
    AlertTriangle,
    CheckCircle2,
    Search,
    RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { ChecklistSubmission } from '../../types/checklist';

// Extended type for analysis
interface ExtendedSubmission extends ChecklistSubmission {
    checklist_templates: {
        title: string;
        type: string;
        questions: any[];
    };
    submitted_by_profile: {
        full_name: string;
        email?: string;
    };
    created_at: string;
}

interface ChecklistAnalysisProps {
    currentUser: any;
    onClose?: () => void;
}

export const ChecklistAnalysis: React.FC<ChecklistAnalysisProps> = ({ currentUser, onClose }) => {
    const [loading, setLoading] = useState(true);
    const [submissions, setSubmissions] = useState<ExtendedSubmission[]>([]);
    const [dateFilter, setDateFilter] = useState<string>(new Date().toISOString().split('T')[0]);
    const [searchTerm, setSearchTerm] = useState('');

    // Neumorphic Styles (Shared with Manager)
    const neumorphicCard = "bg-[#e0e5ec] shadow-[9px_9px_16px_rgb(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)] rounded-2xl border border-white/20";
    const neumorphicInset = "bg-[#e0e5ec] shadow-[inset_6px_6px_10px_0_rgba(163,177,198,0.7),inset_-6px_-6px_10px_0_rgba(255,255,255,0.8)] rounded-xl border-none";
    const neumorphicBtn = "px-6 py-2.5 rounded-xl font-bold transition-all active:scale-95 active:shadow-[inset_4px_4px_8px_rgba(163,177,198,0.6),inset_-4px_-4px_8px_rgba(255,255,255,0.5)] shadow-[6px_6px_10px_rgba(163,177,198,0.6),-6px_-6px_10px_rgba(255,255,255,0.5)] bg-[#e0e5ec] text-gray-600 flex items-center gap-2 hover:text-blue-600";

    useEffect(() => {
        fetchSubmissions();
    }, [dateFilter]);

    const fetchSubmissions = async () => {
        setLoading(true);
        try {
            // Calculate start and end of the selected day
            const startOfDay = new Date(dateFilter);
            startOfDay.setHours(0, 0, 0, 0);

            const endOfDay = new Date(dateFilter);
            endOfDay.setHours(23, 59, 59, 999);

            const { data, error } = await supabase
                .from('checklist_submissions')
                .select(`
                    *,
                    checklist_templates (
                        title,
                        type,
                        questions
                    )
                `)
                .gte('created_at', startOfDay.toISOString())
                .lte('created_at', endOfDay.toISOString())
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Enrich with user profiles
            const enrichedData = await Promise.all((data || []).map(async (sub: any) => {
                let profileName = 'Unknown User';
                let profileEmail = '';
                if (sub.submitted_by) {
                    const { data: profile } = await supabase
                        .from('staff_profiles')
                        .select('full_name, email')
                        .eq('user_id', sub.submitted_by)
                        .single();
                    if (profile) {
                        profileName = profile.full_name;
                        profileEmail = profile.email;
                    }
                }
                return {
                    ...sub,
                    submitted_by_profile: { full_name: profileName, email: profileEmail }
                };
            }));

            setSubmissions(enrichedData as ExtendedSubmission[]);
        } catch (error) {
            console.error('Error fetching analysis data:', error);
            toast.error('Failed to load analysis data');
        } finally {
            setLoading(false);
        }
    };

    const analysisMetrics = useMemo(() => {
        const total = submissions.length;
        const uniqueSubmitters = new Set(submissions.map(s => s.submitted_by)).size;

        let issuesFound = 0;
        let perfectSubmissions = 0;

        const typeBreakdown: Record<string, number> = {};
        const textObservations: { text: string; source: string; author: string }[] = [];

        submissions.forEach(sub => {
            // Type breakdown
            const type = sub.checklist_templates?.title || 'Unknown Checklist';
            typeBreakdown[type] = (typeBreakdown[type] || 0) + 1;

            // Issue & Observation detection
            let hasIssue = false;
            const answers = sub.answers?.responses || sub.answers || {};
            const questions = sub.checklist_templates?.questions || [];

            questions.forEach((q: any) => {
                const ans = answers[q.id];

                // Text observations (capture comments, notes, text inputs)
                if ((q.type === 'text' || q.type === 'textarea') && ans) {
                    textObservations.push({
                        text: String(ans),
                        source: sub.checklist_templates?.title,
                        author: sub.submitted_by_profile.full_name
                    });
                }

                // Potential negative indicators (No/False)
                if (ans === false || ans === 'No' || ans === 'Incomplete') {
                    hasIssue = true;
                    issuesFound++;
                }
            });

            if (!hasIssue) perfectSubmissions++;
        });

        return {
            total,
            uniqueSubmitters,
            issuesFound,
            perfectSubmissions,
            typeBreakdown,
            textObservations
        };
    }, [submissions]);

    const generateReport = () => {
        const date = new Date(dateFilter).toLocaleDateString();
        const report = `
FETS OPERATION ANALYSIS REPORT
Date: ${date}
Generated By: ${currentUser?.full_name}
----------------------------------------

OVERVIEW
Total Checklists Submitted: ${analysisMetrics.total}
Active Personnel: ${analysisMetrics.uniqueSubmitters}
Perfect Submissions: ${analysisMetrics.perfectSubmissions}
Potential Issues Flagged: ${analysisMetrics.issuesFound}

BREAKDOWN BY CHECKLIST
${Object.entries(analysisMetrics.typeBreakdown).map(([name, count]) => `- ${name}: ${count}`).join('\n')}

OPERATIONAL OBSERVATIONS & NOTES
${analysisMetrics.textObservations.length > 0
                ? analysisMetrics.textObservations.map(obs => `[${obs.source}] ${obs.author}: "${obs.text}"`).join('\n')
                : "No specific observations recorded."}

----------------------------------------
END OF REPORT
        `.trim();

        // Copy to clipboard or download functionality
        navigator.clipboard.writeText(report);
        toast.success('Report copied to clipboard!');

        // Also create a downloadable text file
        const blob = new Blob([report], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `FETS_Analysis_${dateFilter}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="min-h-screen -mt-32 pt-48 pb-12" style={{ fontFamily: "'Montserrat', sans-serif" }}>
            <div className="max-w-[1600px] mx-auto px-6">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10"
                >
                    <div className="flex items-center gap-6">
                        <div className="p-5 rounded-2xl bg-[#e0e5ec] shadow-[9px_9px_16px_rgb(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)] text-amber-600">
                            <TrendingUp size={42} strokeWidth={1.5} />
                        </div>
                        <div>
                            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-gray-700 mb-2 uppercase">
                                Operations <span className="text-gold-gradient">Analysis</span>
                            </h1>
                            <p className="text-lg text-gray-500 font-medium">
                                Intelligence & Performance Overview
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className={`flex items-center gap-2 ${neumorphicInset} px-4 py-2`}>
                            <Calendar size={18} className="text-gray-400" />
                            <input
                                type="date"
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                                className="bg-transparent border-none outline-none text-gray-600 font-bold uppercase tracking-wide"
                            />
                        </div>
                        <button
                            onClick={fetchSubmissions}
                            className={`${neumorphicBtn}`}
                            disabled={loading}
                        >
                            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                            Refresh
                        </button>
                    </div>
                </motion.div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {[
                        { label: 'Total Submissions', value: analysisMetrics.total, icon: FileText, color: 'text-blue-600' },
                        { label: 'Active Personnel', value: analysisMetrics.uniqueSubmitters, icon: TrendingUp, color: 'text-purple-600' },
                        { label: 'Perfect Checks', value: analysisMetrics.perfectSubmissions, icon: CheckCircle2, color: 'text-green-600' },
                        { label: 'Issues Flagged', value: analysisMetrics.issuesFound, icon: AlertTriangle, color: 'text-red-500' },
                    ].map((metric, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className={`${neumorphicCard} p-6 flex items-center justify-between overflow-hidden relative group`}
                        >
                            <div className="relative z-10">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{metric.label}</p>
                                <h3 className={`text-4xl font-black ${metric.color}`}>{metric.value}</h3>
                            </div>
                            <div className={`p-4 rounded-full ${neumorphicInset} ${metric.color} opacity-80`}>
                                <metric.icon size={24} />
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Career & Performance Insights (New Feature) */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`${neumorphicCard} p-8 mb-8 relative overflow-hidden`}
                >
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-amber-100 text-amber-600 rounded-xl">
                            <TrendingUp size={24} />
                        </div>
                        <h3 className="text-2xl font-black text-gray-700 uppercase tracking-tight">
                            Career & Performance <span className="text-amber-600">Insights</span>
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* The Guardian Score */}
                        <div className="bg-gray-50/50 p-6 rounded-2xl border border-white/50 relative overflow-hidden group hover:bg-white transition-colors">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <AlertTriangle size={64} className="text-red-500" />
                            </div>
                            <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-2">Guardian Score</h4>
                            <p className="text-3xl font-black text-gray-700 mb-2">
                                {analysisMetrics.issuesFound * 10} <span className="text-sm text-gray-400 font-bold">XP</span>
                            </p>
                            <p className="text-xs text-gray-500 font-medium leading-relaxed">
                                You earn 10 XP for every potential issue you identify. High scores demonstrate <strong className="text-red-500">vigilance</strong> and protect the company from risk.
                            </p>
                        </div>

                        {/* Reliability Indicator */}
                        <div className="bg-gray-50/50 p-6 rounded-2xl border border-white/50 relative overflow-hidden group hover:bg-white transition-colors">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <CheckCircle2 size={64} className="text-green-500" />
                            </div>
                            <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-2">Reliability Ratio</h4>
                            <p className="text-3xl font-black text-gray-700 mb-2">
                                {analysisMetrics.total > 0
                                    ? Math.round((analysisMetrics.perfectSubmissions / analysisMetrics.total) * 100)
                                    : 0}%
                            </p>
                            <p className="text-xs text-gray-500 font-medium leading-relaxed">
                                Percentage of "Perfect Checks". A balanced ratio shows you handle routine tasks efficiently while still catching necessary exceptions.
                            </p>
                        </div>

                        {/* Detail Oriented */}
                        <div className="bg-gray-50/50 p-6 rounded-2xl border border-white/50 relative overflow-hidden group hover:bg-white transition-colors">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <FileText size={64} className="text-blue-500" />
                            </div>
                            <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-2">Detail Level</h4>
                            <p className="text-3xl font-black text-gray-700 mb-2">
                                {analysisMetrics.textObservations.length} <span className="text-sm text-gray-400 font-bold">Notes</span>
                            </p>
                            <p className="text-xs text-gray-500 font-medium leading-relaxed">
                                Total written observations. Managers value staff who provide context. High numbers here indicate strong <strong className="text-blue-500">communication skills</strong>.
                            </p>
                        </div>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column: Breakdown & Report */}
                    <div className="space-y-8">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={`${neumorphicCard} p-6`}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-gray-700 uppercase tracking-tight flex items-center gap-2">
                                    <BarChart3 size={20} className="text-gray-400" />
                                    Submission Breakdown
                                </h3>
                            </div>

                            <div className="space-y-4">
                                {Object.entries(analysisMetrics.typeBreakdown).length > 0 ? (
                                    Object.entries(analysisMetrics.typeBreakdown).map(([type, count], i) => (
                                        <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-gray-50/50 border border-gray-100">
                                            <span className="font-bold text-gray-600">{type}</span>
                                            <span className="px-3 py-1 bg-amber-100 text-amber-700 font-bold rounded-lg text-sm">{count}</span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-center text-gray-400 py-4 italic">No data available for this date.</p>
                                )}
                            </div>

                            <button
                                onClick={generateReport}
                                disabled={submissions.length === 0}
                                className={`w-full mt-8 ${neumorphicBtn} justify-center bg-gray-800 text-white hover:text-amber-400 hover:bg-black group ${submissions.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <Download size={18} className="group-hover:animate-bounce" />
                                Generate & Download Report
                            </button>
                        </motion.div>
                    </div>

                    {/* Right Column: Observations Feed */}
                    <div className="lg:col-span-2">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={`${neumorphicCard} p-6 min-h-[500px] flex flex-col`}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-gray-700 uppercase tracking-tight flex items-center gap-2">
                                    <Search size={20} className="text-gray-400" />
                                    Operational Observations
                                </h3>
                                <div className={`${neumorphicInset} flex items-center px-4 py-2 w-64`}>
                                    <Search size={16} className="text-gray-400 mr-2" />
                                    <input
                                        type="text"
                                        placeholder="Search observations..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="bg-transparent border-none outline-none text-sm w-full"
                                    />
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar max-h-[600px]">
                                {analysisMetrics.textObservations.length > 0 ? (
                                    analysisMetrics.textObservations
                                        .filter(obs => obs.text.toLowerCase().includes(searchTerm.toLowerCase()) || obs.author.toLowerCase().includes(searchTerm.toLowerCase()))
                                        .map((obs, idx) => (
                                            <div key={idx} className="p-4 rounded-xl bg-[#e0e5ec] shadow-[inset_4px_4px_8px_rgba(163,177,198,0.5),inset_-4px_-4px_8px_rgba(255,255,255,0.8)] border border-transparent hover:border-white/40 transition-colors">
                                                <p className="text-gray-700 font-medium mb-3">"{obs.text}"</p>
                                                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wide text-gray-400">
                                                    <span>{obs.author}</span>
                                                    <span className="text-amber-500">{obs.source}</span>
                                                </div>
                                            </div>
                                        ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-60">
                                        <FileText size={48} className="mb-4" />
                                        <p>No observations recorded for this period.</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
};
