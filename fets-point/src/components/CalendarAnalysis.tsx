import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    TrendingUp,
    AlertTriangle,
    CheckCircle,
    Activity,
    MapPin,
    Calendar,
    Download,
    X,
    BarChart3,
    Zap,
    Globe,
    HelpCircle,
    Save
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';

interface CalendarAnalysisProps {
    onClose: () => void;
    activeBranch: string;
}

interface AnalysisEvent {
    id: string;
    branch_location: string;
    category: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    status: string;
    created_at: string;
    completed_at?: string;
    reporter_id?: string;
}

export const CalendarAnalysis: React.FC<CalendarAnalysisProps> = ({ onClose, activeBranch }) => {
    const { user } = useAuth(); // Import user for save functionality
    const [loading, setLoading] = useState(true);
    const [events, setEvents] = useState<AnalysisEvent[]>([]);
    const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter'>('month');

    // Neumorphic Styles (Shared Consistency)
    const neumorphicCard = "bg-[#e0e5ec] shadow-[9px_9px_16px_rgb(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)] rounded-2xl border border-white/20";
    const neumorphicBtn = "px-6 py-2.5 rounded-xl font-bold transition-all active:scale-95 active:shadow-[inset_4px_4px_8px_rgba(163,177,198,0.6),inset_-4px_-4px_8px_rgba(255,255,255,0.5)] shadow-[6px_6px_10px_rgba(163,177,198,0.6),-6px_-6px_10px_rgba(255,255,255,0.5)] bg-[#e0e5ec] text-gray-600 flex items-center gap-2 hover:text-blue-600";
    const neumorphicBtnActive = "px-6 py-2.5 rounded-xl font-bold transition-all shadow-[inset_4px_4px_8px_rgba(163,177,198,0.6),inset_-4px_-4px_8px_rgba(255,255,255,0.5)] bg-[#e0e5ec] text-amber-600 flex items-center gap-2 transform scale-105";
    const neumorphicInset = "shadow-[inset_5px_5px_10px_rgba(163,177,198,0.6),inset_-5px_-5px_10px_rgba(255,255,255,0.5)] bg-[#e0e5ec] rounded-xl";

    useEffect(() => {
        fetchAnalysisData();
    }, [dateRange]);

    const fetchAnalysisData = async () => {
        setLoading(true);
        try {
            // Calculate date filter
            const now = new Date();
            const startDate = new Date();
            if (dateRange === 'week') startDate.setDate(now.getDate() - 7);
            if (dateRange === 'month') startDate.setMonth(now.getMonth() - 1);
            if (dateRange === 'quarter') startDate.setMonth(now.getMonth() - 3);

            // Fetch ALL events globally for comprehensive analysis
            const { data, error } = await (supabase as any)
                .from('incidents')
                .select('id, branch_location, category, severity, status, created_at, completed_at')
                .gte('created_at', startDate.toISOString())
                .order('created_at', { ascending: false });

            if (error) throw error;
            setEvents((data as any) || []);
        } catch (error) {
            console.error('Error fetching analysis data:', error);
            toast.error('Failed to load operational data');
        } finally {
            setLoading(false);
        }
    };

    const metrics = useMemo(() => {
        const total = events.length;
        const open = events.filter(e => e.status !== 'closed').length;
        const critical = events.filter(e => e.severity === 'critical' && e.status !== 'closed').length;
        const major = events.filter(e => (e.severity === 'high' || e.severity === 'medium') && e.status !== 'closed').length;
        const closed = events.filter(e => e.status === 'closed').length;

        // Health Score Calculation (100 is perfect)
        // Deduct points for open issues: Critical = 15, Major = 5, Minor = 1
        const penalty = (critical * 15) + (major * 5) + ((open - critical - major) * 1);
        const healthScore = Math.max(0, 100 - penalty);

        // Branch Breakdown
        const branchStats: Record<string, { total: number, critical: number, open: number }> = {};
        events.forEach(e => {
            const branch = e.branch_location || 'Unknown';
            if (!branchStats[branch]) branchStats[branch] = { total: 0, critical: 0, open: 0 };
            branchStats[branch].total++;
            if (e.status !== 'closed') branchStats[branch].open++;
            if (e.severity === 'critical') branchStats[branch].critical++;
        });

        // Category Breakdown
        const categoryStats: Record<string, number> = {};
        events.forEach(e => {
            const cat = e.category || 'Other';
            categoryStats[cat] = (categoryStats[cat] || 0) + 1;
        });

        // Velocity (Avg resolution time for closed events in hours)
        let totalResolutionHours = 0;
        let closedCount = 0;
        events.forEach(e => {
            if (e.status === 'closed' && e.completed_at) {
                const created = new Date(e.created_at).getTime();
                const closed = new Date(e.completed_at).getTime();
                const hours = (closed - created) / (1000 * 60 * 60);
                if (hours > 0) {
                    totalResolutionHours += hours;
                    closedCount++;
                }
            }
        });
        const avgVelocity = closedCount > 0 ? (totalResolutionHours / closedCount).toFixed(1) : 'N/A';

        // Auto-generated Insights
        const insights = [];
        if (healthScore < 50) insights.push("CRITICAL: Global operational health is dangerously low.");
        if (critical > 0) insights.push(`URGENT: ${critical} Critical incidents require immediate intervention.`);

        const topBranch = Object.entries(branchStats)
            .sort(([, a], [, b]) => b.open - a.open)[0];
        if (topBranch) insights.push(`Focus Area: ${topBranch[0]} has the highest open incident load (${topBranch[1].open}).`);

        const topCategory = Object.entries(categoryStats).sort(([, a], [, b]) => b - a)[0];
        if (topCategory) insights.push(`Trend: '${topCategory[0]}' is the most recurring issue type.`);

        return {
            total,
            open,
            critical,
            healthScore,
            branchStats,
            categoryStats,
            avgVelocity,
            insights
        };
    }, [events]);

    const saveReportToDB = async () => {
        if (!user) {
            toast.error('You must be logged in to save reports');
            return;
        }

        const toastId = toast.loading('Saving operational snapshot...');

        try {
            const { error } = await (supabase as any)
                .from('operational_reports')
                .insert({
                    created_by: user.id,
                    period: dateRange,
                    health_score: metrics.healthScore,
                    resolution_velocity: parseFloat(metrics.avgVelocity),
                    critical_issues: metrics.critical,
                    metrics: metrics,
                    insights: metrics.insights,
                    report_text: generateReportString() // Refactored generation to separate function
                });

            if (error) throw error;
            toast.success('Snapshot saved to Vault', { id: toastId });
        } catch (error) {
            console.error('Error saving report:', error);
            toast.error('Failed to save snapshot', { id: toastId });
        }
    };

    const generateReportString = () => {
        return `
FETS OPERATIONAL INTELLIGENCE REPORT
Generated: ${new Date().toLocaleString()}
Period: ${dateRange.toUpperCase()}
----------------------------------------

EXECUTIVE SUMMARY
-----------------
Stability Index: ${metrics.healthScore}/100
Total Volume: ${metrics.total}
Critical Incidents: ${metrics.critical} (Active)
Resolution Velocity: ${metrics.avgVelocity} hours

STRATEGIC INSIGHTS
------------------
${metrics.insights.map((i, idx) => `${idx + 1}. ${i}`).join('\n')}

CENTRE HEATMAP (Top 5)
----------------------
${Object.entries(metrics.branchStats)
                .sort(([, a], [, b]) => b.total - a.total)
                .slice(0, 5)
                .map(([branch, stats]) => `${branch.toUpperCase().padEnd(20)} | Total: ${stats.total} | Open: ${stats.open} | Critical: ${stats.critical}`)
                .join('\n')}

CATEGORY DYNAMICS
-----------------
${Object.entries(metrics.categoryStats)
                .sort(([, a], [, b]) => b - a)
                .map(([cat, count]) => `${cat}: ${count} events`)
                .join('\n')}
`.trim();
    };

    const generateReport = () => {
        const report = generateReportString();
        navigator.clipboard.writeText(report);
        const blob = new Blob([report], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `FETS_Ops_Report_${new Date().toISOString().split('T')[0]}.txt`;
        a.click();
        toast.success('Report generated & copied to clipboard');
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-0 z-50 bg-[#e0e5ec] overflow-y-auto"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
        >
            <div className="max-w-[1600px] mx-auto px-6 py-12">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={onClose}
                            className="p-4 rounded-full bg-[#e0e5ec] shadow-[9px_9px_16px_rgb(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)] text-gray-500 hover:text-red-500 transition-colors active:scale-95"
                        >
                            <X size={24} />
                        </button>
                        <div>
                            <h1 className="text-4xl md:text-5xl font-black text-gray-700 mb-2 uppercase tracking-tight">
                                Operational <span className="text-blue-500">Intelligence</span>
                            </h1>
                            <p className="text-gray-500 font-medium text-lg">Global Event Analysis & Business Insights</p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className={`${neumorphicInset} px-4 py-2 flex items-center gap-4`}>
                            <button
                                onClick={() => setDateRange('week')}
                                className={`text-sm font-bold ${dateRange === 'week' ? 'text-blue-600' : 'text-gray-400'}`}
                            >
                                7D
                            </button>
                            <div className="w-px h-4 bg-gray-300"></div>
                            <button
                                onClick={() => setDateRange('month')}
                                className={`text-sm font-bold ${dateRange === 'month' ? 'text-blue-600' : 'text-gray-400'}`}
                            >
                                30D
                            </button>
                            <div className="w-px h-4 bg-gray-300"></div>
                            <button
                                onClick={() => setDateRange('quarter')}
                                className={`text-sm font-bold ${dateRange === 'quarter' ? 'text-blue-600' : 'text-gray-400'}`}
                            >
                                90D
                            </button>
                        </div>
                        <button
                            onClick={saveReportToDB}
                            className={`${neumorphicBtn} hover:text-green-600`}
                            title="Save Snapshot to Database"
                        >
                            <Save size={18} />
                            Save
                        </button>
                        <button
                            onClick={generateReport}
                            className={neumorphicBtnActive}
                        >
                            <Download size={18} />
                            Export
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mb-6"></div>
                        <p className="text-gray-500 font-bold animate-pulse">Analyzing Operational Data...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8">

                        {/* KPI Cards */}
                        <div className="md:col-span-12 grid grid-cols-1 md:grid-cols-4 gap-8 mb-4">
                            {/* Stability Index */}
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className={`${neumorphicCard} p-8 flex flex-col items-center justify-center relative overflow-hidden group`}
                            >
                                <div className="absolute top-2 right-2">
                                    <div className="group-hover:opacity-100 opacity-0 transition-opacity bg-black/80 text-white text-[10px] p-2 rounded w-48 absolute right-0 z-10 pointer-events-none">
                                        Overall operational health score out of 100. Lower score indicates high volume of critical/major open issues.
                                    </div>
                                    <HelpCircle size={14} className="text-gray-400" />
                                </div>
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <Activity size={100} />
                                </div>
                                <h3 className="text-gray-500 font-bold uppercase tracking-widest text-xs mb-2">Stability Index</h3>
                                <div className={`text-6xl font-black ${metrics.healthScore > 80 ? 'text-green-500' :
                                    metrics.healthScore > 50 ? 'text-amber-500' : 'text-red-500'
                                    }`}>
                                    {Math.round(metrics.healthScore)}
                                </div>
                                <p className="text-xs text-gray-400 mt-2 font-medium">Target: 85+</p>
                            </motion.div>

                            {/* Velocity */}
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.1 }}
                                className={`${neumorphicCard} p-8 flex flex-col items-center justify-center relative group`}
                            >
                                <div className="absolute top-2 right-2">
                                    <div className="group-hover:opacity-100 opacity-0 transition-opacity bg-black/80 text-white text-[10px] p-2 rounded w-48 absolute right-0 z-10 pointer-events-none">
                                        Average time taken to resolve an issue from creation to closure.
                                    </div>
                                    <HelpCircle size={14} className="text-gray-400" />
                                </div>
                                <h3 className="text-gray-500 font-bold uppercase tracking-widest text-xs mb-2">Resolution Velocity</h3>
                                <div className="text-5xl font-black text-gray-700">
                                    {metrics.avgVelocity}<span className="text-2xl text-gray-400 ml-1">hr</span>
                                </div>
                                <p className="text-xs text-green-500 mt-2 font-bold flex items-center gap-1">
                                    <Zap size={10} /> Avg Handling Time
                                </p>
                            </motion.div>

                            {/* Critical Incidents */}
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className={`${neumorphicCard} p-8 flex flex-col items-center justify-center relative group`}
                            >
                                <div className="absolute top-2 right-2">
                                    <div className="group-hover:opacity-100 opacity-0 transition-opacity bg-black/80 text-white text-[10px] p-2 rounded w-48 absolute right-0 z-10 pointer-events-none">
                                        Number of active 'Critical' or 'Major' priority events that are currently unresolved.
                                    </div>
                                    <HelpCircle size={14} className="text-gray-400" />
                                </div>
                                <h3 className="text-red-400 font-bold uppercase tracking-widest text-xs mb-2">Critical Incidents</h3>
                                <div className="text-5xl font-black text-red-500">
                                    {metrics.critical}
                                </div>
                                <p className="text-xs text-gray-400 mt-2 font-medium">Requires Immediate Action</p>
                            </motion.div>

                            {/* Total Volume */}
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className={`${neumorphicCard} p-8 flex flex-col items-center justify-center`}
                            >
                                <h3 className="text-gray-500 font-bold uppercase tracking-widest text-xs mb-2">Total Volume</h3>
                                <div className="text-5xl font-black text-blue-500">
                                    {metrics.total}
                                </div>
                                <p className="text-xs text-gray-400 mt-2 font-medium">Events in period</p>
                            </motion.div>
                        </div>

                        {/* Strategic Insights & Heatmap */}
                        <div className="md:col-span-8 space-y-8">
                            {/* Strategic AI Insights */}
                            <div className={`${neumorphicCard} p-8`}>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                                        <TrendingUp size={24} />
                                    </div>
                                    <h3 className="text-xl font-black text-gray-700">Strategic Intelligence</h3>
                                </div>
                                <div className="space-y-4">
                                    {metrics.insights.length > 0 ? metrics.insights.map((insight, idx) => (
                                        <div key={idx} className="flex items-start gap-4 p-4 rounded-xl bg-white/50 border border-white/50 hover:bg-white transition-colors">
                                            <div className="mt-1">
                                                {insight.includes('CRITICAL') || insight.includes('URGENT') ?
                                                    <AlertTriangle size={20} className="text-red-500" /> :
                                                    <CheckCircle size={20} className="text-blue-500" />
                                                }
                                            </div>
                                            <p className="text-gray-700 font-semibold text-sm leading-relaxed">{insight}</p>
                                        </div>
                                    )) : (
                                        <p className="text-gray-500 italic">No critical anomalies detected. Operations appearing stable.</p>
                                    )}
                                </div>
                            </div>

                            {/* Centre Heatmap */}
                            <div className={`${neumorphicCard} p-8`}>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                        <Globe size={24} />
                                    </div>
                                    <h3 className="text-xl font-black text-gray-700">Centre Heatmap (Where to Concentrate)</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {Object.entries(metrics.branchStats)
                                        .sort(([, a], [, b]) => b.open - a.open) // Sort by highest open issues
                                        .map(([branch, stats], idx) => (
                                            <div key={branch} className={`${neumorphicInset} p-5 relative overflow-hidden group`}>
                                                <div className={`absolute top-0 right-0 w-2 h-full ${stats.open > 5 ? 'bg-red-500' : stats.open > 2 ? 'bg-amber-500' : 'bg-green-500'
                                                    }`}></div>
                                                <h4 className="font-bold text-gray-700 uppercase mb-2">{branch}</h4>
                                                <div className="space-y-1">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-500">Active Issues:</span>
                                                        <span className="font-bold text-gray-800">{stats.open}</span>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-500">Critical:</span>
                                                        <span className="font-bold text-red-500">{stats.critical}</span>
                                                    </div>
                                                    <div className="w-full bg-gray-300 h-1.5 rounded-full mt-3 overflow-hidden">
                                                        <div
                                                            className={`h-full ${stats.open > 5 ? 'bg-red-500' : 'bg-blue-500'}`}
                                                            style={{ width: `${Math.min(100, (stats.open / metrics.open) * 100)}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    }
                                </div>
                            </div>
                        </div>

                        {/* Category Trends Sidebar */}
                        <div className="md:col-span-4">
                            <div className={`${neumorphicCard} p-8 h-full`}>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                                        <BarChart3 size={24} />
                                    </div>
                                    <h3 className="text-xl font-black text-gray-700">Issue Dynamics</h3>
                                </div>
                                <div className="space-y-6">
                                    {Object.entries(metrics.categoryStats)
                                        .sort(([, a], [, b]) => b - a)
                                        .map(([cat, count], idx) => (
                                            <div key={cat} className="relative">
                                                <div className="flex justify-between mb-1">
                                                    <span className="text-sm font-bold text-gray-600 capitalize">{cat.replace('_', ' ')}</span>
                                                    <span className="text-sm font-bold text-gray-400">{count}</span>
                                                </div>
                                                <div className="w-full bg-[#e0e5ec] shadow-[inset_2px_2px_5px_rgba(163,177,198,0.6),inset_-2px_-2px_5px_rgba(255,255,255,0.5)] rounded-full h-3">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${(count / metrics.total) * 100}%` }}
                                                        transition={{ duration: 1, delay: idx * 0.1 }}
                                                        className={`h-full rounded-full shadow-lg ${idx === 0 ? 'bg-red-500' : idx === 1 ? 'bg-orange-500' : 'bg-blue-500'
                                                            }`}
                                                    ></motion.div>
                                                </div>
                                            </div>
                                        ))
                                    }
                                </div>
                            </div>
                        </div>

                    </div>
                )}
            </div>
        </motion.div>
    );
};
