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
    Activity,
    Briefcase,
    UserCircle,
    Globe,
    FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { format, startOfDay, endOfDay, subDays } from 'date-fns';
import { useBranch } from '../hooks/useBranch';
import { useAuth } from '../hooks/useAuth';

interface CandidateAnalysisProps {
    onClose?: () => void;
}

export const CandidateAnalysis: React.FC<CandidateAnalysisProps> = ({ onClose }) => {
    const { profile } = useAuth();
    const { activeBranch } = useBranch();
    const [loading, setLoading] = useState(true);
    const [candidates, setCandidates] = useState<any[]>([]);
    const [dateFilter, setDateFilter] = useState<string>('');
    const [viewMode, setViewMode] = useState<'overview' | 'staff' | 'client'>('overview');

    // Security: Only super_admins can view analysis
    if (profile?.role !== 'super_admin') {
        return (
            <div className="flex flex-col items-center justify-center p-20 text-center">
                <ShieldAlert size={64} className="text-rose-500 mb-6 opacity-20" />
                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-2">Access Restricted</h3>
                <p className="text-slate-500 font-medium max-w-md">Intelligence Analysis is restricted to Super Administrator accounts only.</p>
                <button
                    onClick={onClose}
                    className="mt-8 px-8 py-3 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px]"
                >
                    Return to Registry
                </button>
            </div>
        );
    }

    useEffect(() => {
        fetchCandidates();
    }, [dateFilter, activeBranch]);

    const fetchCandidates = async () => {
        setLoading(true);
        try {
            let query = supabase.from('candidates').select('*');

            if (dateFilter) {
                const start = startOfDay(new Date(dateFilter)).toISOString();
                query = query.gte('created_at', start);
            }

            if (activeBranch && activeBranch !== 'global') {
                query = query.eq('branch_location', activeBranch);
            }

            const { data, error } = await query.order('created_at', { ascending: false });

            if (error) throw error;

            // Fetch staff profiles for name mapping
            const { data: profiles } = await supabase
                .from('staff_profiles')
                .select('user_id, full_name');

            const profileMap = (profiles || []).reduce((acc: any, p) => {
                acc[p.user_id] = p.full_name;
                return acc;
            }, {});

            const enrichedData = (data || []).map((c: any) => ({
                ...c,
                staff_name: profileMap[c.user_id] || 'System/Legacy'
            }));

            setCandidates(enrichedData);
        } catch (error) {
            console.error('Error fetching analysis data:', error);
            toast.error('Failed to load candidate analysis');
        } finally {
            setLoading(false);
        }
    };

    const metrics = useMemo(() => {
        const clientStats: Record<string, number> = {};
        const staffStats: Record<string, number> = {};
        const addressStats: Record<string, number> = {};
        const statusStats: Record<string, number> = { registered: 0, completed: 0, no_show: 0 };

        candidates.forEach(c => {
            // Client Volume
            const client = c.client_name || 'Other';
            clientStats[client] = (clientStats[client] || 0) + 1;

            // Staff Contribution
            const staff = c.staff_name;
            staffStats[staff] = (staffStats[staff] || 0) + 1;

            // Address/Place Mapping
            const place = c.address ? (c.address.split(',').pop()?.trim() || 'Unknown') : 'Not Set';
            addressStats[place] = (addressStats[place] || 0) + 1;

            // Status Breakdown
            if (c.status && statusStats[c.status] !== undefined) {
                statusStats[c.status]++;
            } else {
                statusStats.registered++;
            }
        });

        const topClients = Object.entries(clientStats).sort((a, b) => b[1] - a[1]).slice(0, 5);
        const topStaff = Object.entries(staffStats).sort((a, b) => b[1] - a[1]);
        const topPlaces = Object.entries(addressStats).sort((a, b) => b[1] - a[1]).slice(0, 5);

        return { clientStats, staffStats, addressStats, statusStats, topClients, topStaff, topPlaces, total: candidates.length };
    }, [candidates]);

    const neumorphicCard = "bg-[#e0e5ec] shadow-[9px_9px_16px_#bebebe,-9px_-9px_16px_#ffffff] rounded-3xl p-8 border border-white/20";
    const neumorphicInset = "bg-[#e0e5ec] shadow-[inset_6px_6px_10px_#bebebe,inset_-6px_-6px_10px_#ffffff] rounded-2xl p-6";

    return (
        <div className="min-h-[80vh] font-sans">
            {/* Analysis Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-6 mb-12">
                <div className="flex gap-2 p-1.5 bg-gray-200/50 rounded-[2rem] shadow-inner">
                    {[
                        { id: 'overview', label: 'Market Overview', icon: Globe },
                        { id: 'staff', label: 'Staff Contribution', icon: Users },
                        { id: 'client', label: 'Partner Metrics', icon: Briefcase }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setViewMode(tab.id as any)}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === tab.id
                                ? 'bg-white text-amber-600 shadow-md transform scale-105'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <tab.icon size={14} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-4">
                    <div className="bg-[#e0e5ec] shadow-[inset_4px_4px_8px_#bebebe,inset_-4px_-4px_8px_#ffffff] px-6 py-2 rounded-2xl flex items-center gap-4">
                        <Calendar size={16} className="text-amber-500" />
                        <input
                            type="date"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="bg-transparent outline-none font-bold text-gray-600 uppercase text-[10px]"
                        />
                        <button onClick={() => setDateFilter('')} className="text-[9px] font-black text-amber-600 uppercase border-l border-gray-300 pl-4 ml-2">Clear</button>
                    </div>
                    <button onClick={fetchCandidates} className="p-3.5 rounded-2xl bg-[#e0e5ec] shadow-[5px_5px_10px_#bebebe,-5px_-5px_10px_#ffffff] text-gray-500 hover:text-amber-600 active:scale-95 transition-all">
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Main Analysis Content */}
            <AnimatePresence mode="wait">
                {viewMode === 'overview' && (
                    <motion.div
                        key="overview"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-12"
                    >
                        {/* KPI Row */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                            {[
                                { label: 'Total Volume', value: metrics.total, sub: 'All Providers', color: 'text-blue-600', icon: Activity },
                                { label: 'Conversion', value: metrics.total > 0 ? Math.round((metrics.statusStats.completed / (metrics.total || 1)) * 100) + '%' : '0%', sub: 'Attendance Rate', color: 'text-emerald-600', icon: CheckCircle2 },
                                { label: 'Loss Ratio', value: metrics.total > 0 ? Math.round((metrics.statusStats.no_show / (metrics.total || 1)) * 100) + '%' : '0%', sub: 'Absenteeism', color: 'text-rose-500', icon: ShieldAlert },
                                { label: 'Market Reach', value: Object.keys(metrics.addressStats).length, sub: 'Unique Locations', color: 'text-amber-600', icon: MapPin }
                            ].map((kpi, i) => (
                                <div key={i} className={neumorphicCard}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`p-3 rounded-xl bg-white/40 shadow-sm ${kpi.color}`}>
                                            <kpi.icon size={20} />
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">{kpi.label}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <h2 className={`text-4xl font-black ${kpi.color}`}>{kpi.value}</h2>
                                    </div>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight mt-1">{kpi.sub}</p>
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                            {/* Demand Distribution (Clients) */}
                            <div className={neumorphicCard}>
                                <h3 className="text-xl font-black text-gray-700 uppercase tracking-tight mb-8 flex items-center gap-3">
                                    <Briefcase className="text-amber-500" /> Top Partner Demand
                                </h3>
                                <div className="space-y-6">
                                    {metrics.topClients.map(([name, count], i) => (
                                        <div key={i} className="space-y-2">
                                            <div className="flex justify-between items-end">
                                                <span className="text-xs font-black text-gray-500 uppercase tracking-widest">{name}</span>
                                                <span className="text-sm font-black text-gray-700">{count} <span className="text-[10px] text-gray-400">PAX</span></span>
                                            </div>
                                            <div className="h-3 bg-gray-200/50 rounded-full overflow-hidden shadow-inner">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${(count / (metrics.total || 1)) * 100}%` }}
                                                    className={`h-full bg-gradient-to-r ${i === 0 ? 'from-amber-400 to-amber-600' : 'from-slate-600 to-slate-800'}`}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Geographical Analysis */}
                            <div className={neumorphicCard}>
                                <h3 className="text-xl font-black text-gray-700 uppercase tracking-tight mb-8 flex items-center gap-3">
                                    <MapPin className="text-amber-500" /> Place of Origin Stats
                                </h3>
                                <div className="space-y-4">
                                    {metrics.topPlaces.map(([place, count], i) => (
                                        <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/30 border border-white/50 group hover:shadow-md transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500 shadow-sm">{i + 1}</div>
                                                <span className="text-xs font-black text-gray-600 uppercase tracking-widest">{place}</span>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-lg font-black text-gray-700">{count}</span>
                                                <span className="text-[8px] font-black text-amber-600 uppercase">Candidates</span>
                                            </div>
                                        </div>
                                    ))}
                                    {metrics.topPlaces.length === 0 && (
                                        <div className="py-12 text-center text-gray-400 italic font-medium">No address data available for origin analysis.</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Summary Narrative */}
                        <div className={`${neumorphicCard} bg-slate-900 border-none relative overflow-hidden`}>
                            <div className="absolute top-0 right-0 p-8 opacity-10 text-white">
                                <BrainCircuit size={120} />
                            </div>
                            <div className="relative z-10">
                                <h3 className="text-xl font-black text-white uppercase tracking-tight mb-4 flex items-center gap-3">
                                    <Activity className="text-amber-500" /> Strategic Summary
                                </h3>
                                <p className="text-slate-300 font-medium leading-relaxed max-w-4xl">
                                    Operational data shows a total volume of <span className="text-amber-500 font-bold">{metrics.total} candidates</span> processed
                                    {dateFilter ? ` since ${format(new Date(dateFilter), 'PPP')}` : ' in this cycle'}.
                                    <span className="text-white font-bold ml-1">{metrics.topClients[0]?.[0] || 'Unknown'}</span> remains the primary volume driver
                                    contributing <span className="text-amber-400">{Math.round((metrics.topClients[0]?.[1] || 0) / (metrics.total || 1) * 100)}%</span> of total registrations.
                                    Origin analysis highlights <span className="text-white font-bold">{metrics.topPlaces[0]?.[0] || 'N/A'}</span> as the highest potential growth market.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {viewMode === 'staff' && (
                    <motion.div
                        key="staff"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="grid grid-cols-1 lg:grid-cols-3 gap-12"
                    >
                        <div className="lg:col-span-2 space-y-8">
                            <div className={neumorphicCard}>
                                <h3 className="text-xl font-black text-gray-700 uppercase tracking-tight mb-8">Data Entry Performance</h3>
                                <div className="space-y-3">
                                    {metrics.topStaff.map(([name, count], i) => (
                                        <div key={i} className="flex items-center gap-6 p-4 rounded-2xl hover:bg-white/40 shadow-[4px_4px_8px_#bec3c9,-4px_-4px_8px_#ffffff] transition-all group">
                                            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center relative">
                                                <UserCircle size={24} className="text-slate-400 group-hover:text-amber-500 transition-colors" />
                                                <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-amber-500 text-white text-[10px] font-black flex items-center justify-center border-2 border-[#e0e5ec]">{i + 1}</div>
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-black text-gray-700 uppercase text-xs tracking-wider">{name}</p>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">FETS Data Agent</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-2xl font-black text-gray-700">{count}</p>
                                                <p className="text-[8px] font-black text-amber-600 uppercase tracking-tighter">Entries Uploaded</p>
                                            </div>
                                        </div>
                                    ))}
                                    {metrics.topStaff.length === 0 && (
                                        <div className="py-12 text-center text-gray-400 italic font-medium">No staff entry logs detected in this period.</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-12">
                            <div className={`${neumorphicCard} bg-gradient-to-br from-amber-500 to-amber-600 border-none`}>
                                <h3 className="text-lg font-black text-white uppercase mb-6 flex items-center gap-2"><TrendingUp size={18} /> Top Contributor</h3>
                                {metrics.topStaff.length > 0 ? (
                                    <div className="text-center py-6">
                                        <div className="w-24 h-24 rounded-full bg-white/20 mx-auto mb-4 flex items-center justify-center border-4 border-white/30">
                                            <Users size={48} className="text-white" />
                                        </div>
                                        <h4 className="text-2xl font-black text-white uppercase truncate">{metrics.topStaff[0][0]}</h4>
                                        <p className="text-white/70 font-bold uppercase text-[10px] tracking-widest mt-2">{metrics.topStaff[0][1]} Total Entries</p>
                                    </div>
                                ) : (
                                    <p className="text-white/60 text-center py-10 font-bold uppercase text-xs">No Data</p>
                                )}
                            </div>

                            <div className={neumorphicCard}>
                                <h4 className="font-black text-gray-700 uppercase text-xs mb-4 flex items-center gap-2"><Activity size={14} className="text-amber-500" /> Recent Entries</h4>
                                <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                                    {candidates.slice(0, 8).map((c, i) => (
                                        <div key={i} className="pb-3 border-b border-gray-200 last:border-0">
                                            <div className="flex justify-between items-start mb-1">
                                                <p className="text-[10px] font-black text-gray-700 uppercase truncate max-w-[120px]">{c.full_name}</p>
                                                <span className="text-[8px] font-black text-amber-600 uppercase">{format(new Date(c.created_at), 'HH:mm')}</span>
                                            </div>
                                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">By: {c.staff_name}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {viewMode === 'client' && (
                    <motion.div
                        key="client"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-8"
                    >
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                            <div className={neumorphicCard}>
                                <h3 className="text-xl font-black text-gray-700 uppercase mb-8">Provider Volume Matrix</h3>
                                <div className="space-y-6">
                                    {Object.entries(metrics.clientStats).map(([client, count], i) => (
                                        <div key={i} className="flex items-center justify-between p-5 rounded-3xl bg-white/40 border border-white/60 shadow-sm">
                                            <div className="flex items-center gap-4">
                                                <div className={`p-3 rounded-2xl bg-slate-900 text-white shadow-lg`}>
                                                    <FileText size={20} />
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-gray-700 uppercase text-sm">{client}</h4>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-[8px] font-black text-amber-600 uppercase">Share: {Math.round((count / (metrics.total || 1)) * 100)}%</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-2xl font-black text-gray-800">{count}</span>
                                                <span className="block text-[8px] font-black text-gray-400 uppercase">Total PAX</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className={`${neumorphicCard} flex flex-col items-center justify-center text-center p-12`}>
                                <div className="p-8 rounded-full bg-[#e0e5ec] shadow-[inset_6px_6px_12px_#bebebe,inset_-6px_-6px_12px_#ffffff] mb-8">
                                    <Briefcase size={64} className="text-amber-500 opacity-80" />
                                </div>
                                <h3 className="text-2xl font-black text-gray-700 uppercase mb-4 tracking-tighter">Strategic Partnerships</h3>
                                <p className="text-gray-500 font-medium max-w-sm mb-8">Your operational bandwidth is currently distributed across <span className="text-amber-600 font-bold">{Object.keys(metrics.clientStats).length} unique partners</span>. Focus on high-conversion providers to optimize resource allocation.</p>
                                <div className="grid grid-cols-2 gap-4 w-full">
                                    <div className={neumorphicInset}>
                                        <span className="block text-[10px] font-black text-gray-400 uppercase mb-1">Top Tier</span>
                                        <span className="font-black text-gray-700 uppercase text-xs truncate">{metrics.topClients[0]?.[0] || 'N/A'}</span>
                                    </div>
                                    <div className={neumorphicInset}>
                                        <span className="block text-[10px] font-black text-gray-400 uppercase mb-1">Growth Opportunity</span>
                                        <span className="font-black text-gray-700 uppercase text-xs truncate">{metrics.topClients[metrics.topClients.length - 1]?.[0] || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="mt-16 flex justify-center">
                <button
                    onClick={onClose}
                    className="px-12 py-3.5 rounded-2xl bg-slate-900 text-white font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all hover:bg-slate-800"
                >
                    Return to Registry
                </button>
            </div>
        </div>
    );
};
