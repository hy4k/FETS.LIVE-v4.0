import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Crown, Medal, TrendingUp, MapPin, Globe, Loader2, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';

const GRANDMASTER_IDS = ['0b732c8e-1dd7-4a3f-9b01-539da05db844', '2a4090d5-3069-4eeb-a682-9ba64908f0f6'];

export const Leaderboards: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'weekly' | 'monthly' | 'legend' | 'centre'>('weekly');
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchLeaderboard = async (tab: string) => {
        setLoading(true);
        try {
            if (tab === 'weekly' || tab === 'monthly') {
                const interval = tab === 'weekly' ? '7 days' : '30 days';
                const { data: logs, error } = await supabase
                    .from('user_connections_log')
                    .select('from_user_id, points_awarded, staff_profiles(full_name, avatar_url, location)')
                    .gte('connected_at', new Date(Date.now() - (tab === 'weekly' ? 7 : 30) * 24 * 60 * 60 * 1000).toISOString());

                if (error) throw error;

                // Aggregate by user
                const aggregated = logs.reduce((acc: any, log: any) => {
                    const userId = log.from_user_id;
                    if (!acc[userId]) {
                        acc[userId] = {
                            id: userId,
                            full_name: log.staff_profiles.full_name,
                            avatar_url: log.staff_profiles.avatar_url,
                            location: log.staff_profiles.location,
                            points: 0
                        };
                    }
                    acc[userId].points += log.points_awarded;
                    return acc;
                }, {});

                const sorted = Object.values(aggregated).sort((a: any, b: any) => b.points - a.points);
                setData(sorted);
            } else if (tab === 'legend') {
                const { data: stats, error } = await supabase
                    .from('user_game_stats')
                    .select('user_id, total_cash, current_level, staff_profiles(full_name, avatar_url, location)')
                    .order('total_cash', { ascending: false })
                    .limit(20);

                if (error) throw error;
                setData(stats.map((s: any) => ({
                    id: s.user_id,
                    full_name: s.staff_profiles.full_name,
                    avatar_url: s.staff_profiles.avatar_url,
                    location: s.staff_profiles.location,
                    points: s.total_cash,
                    level: s.current_level
                })));
            } else if (tab === 'centre') {
                const { data: pools, error } = await supabase
                    .from('centre_pool_stats')
                    .select('*')
                    .order('pool_balance', { ascending: false });

                if (error) throw error;
                setData(pools.map((p: any) => ({
                    id: p.location,
                    full_name: p.location,
                    points: p.pool_balance,
                    isCentre: true
                })));
            }
        } catch (err) {
            console.error('Leaderboard Fetch Error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaderboard(activeTab);
    }, [activeTab]);

    const tabs = [
        { id: 'weekly', label: 'Movers & Pullers', icon: TrendingUp },
        { id: 'monthly', label: 'Monthly Champion', icon: Crown },
        { id: 'legend', label: 'Legend of FETS', icon: Medal },
        { id: 'centre', label: 'Centre Rankings', icon: MapPin },
    ];

    return (
        <div className="h-full flex flex-col bg-[#f8fafc] overflow-hidden">
            <div className="p-8 pb-4">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Leaderboards</h2>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Hall of Recognition</p>
                    </div>
                    <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20 text-amber-600">
                        <Trophy size={24} strokeWidth={2.5} />
                    </div>
                </div>

                <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl border border-slate-200">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id
                                ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                                : 'text-slate-500 hover:text-slate-800'
                                }`}
                        >
                            <tab.icon size={14} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar px-8 pb-10">
                <AnimatePresence mode="wait">
                    {loading ? (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="h-full flex items-center justify-center py-20"
                        >
                            <Loader2 className="animate-spin text-slate-400" size={32} />
                        </motion.div>
                    ) : (
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-4"
                        >
                            {data.map((item, index) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className={`group flex items-center gap-6 p-5 rounded-[24px] border transition-all hover:shadow-xl hover:shadow-slate-200/50 ${GRANDMASTER_IDS.includes(item.id)
                                        ? 'bg-slate-900 border-amber-500/30 text-white shadow-[0_0_20px_rgba(245,158,11,0.15)] relative overflow-hidden'
                                        : index === 0
                                            ? 'bg-amber-50/50 border-amber-200 ring-2 ring-amber-100'
                                            : 'bg-white border-slate-200'
                                        }`}
                                >
                                    {GRANDMASTER_IDS.includes(item.id) && (
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                    )}
                                    <div className="w-10 h-10 flex items-center justify-center font-black text-xl italic text-slate-300 group-hover:text-slate-900 transition-colors">
                                        {index === 0 ? <Crown className="text-amber-500" /> : index + 1}
                                    </div>

                                    {!item.isCentre && (
                                        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center border border-slate-200 overflow-hidden shadow-inner">
                                            {item.avatar_url ? (
                                                <img src={item.avatar_url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-xl font-bold text-slate-400">{item.full_name[0]}</span>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className={`text-lg font-black truncate leading-none ${GRANDMASTER_IDS.includes(item.id) ? 'text-amber-500' : 'text-slate-800'}`}>{item.full_name}</h3>
                                            {GRANDMASTER_IDS.includes(item.id) ? (
                                                <span className="px-2 py-0.5 rounded-lg bg-amber-500 text-black text-[8px] font-black uppercase tracking-widest animate-pulse">GRANDMASTER</span>
                                            ) : item.level && (
                                                <span className="px-2 py-0.5 rounded-lg bg-slate-900 text-white text-[8px] font-black uppercase tracking-widest">LVL {item.level}</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-1.5 opacity-60">
                                                <MapPin size={10} className="text-slate-400" />
                                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">{item.location || 'Global'}</span>
                                            </div>
                                            {index === 0 && (
                                                <div className="flex items-center gap-1.5 animate-pulse">
                                                    <Star size={10} className="text-amber-500 fill-amber-500" />
                                                    <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest leading-none">Top Performer</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{activeTab === 'centre' ? 'Pool Balance' : 'FETS Cash'}</p>
                                        <p className={`text-2xl font-black leading-none ${index === 0 ? 'text-amber-600' : 'text-slate-900'}`}>{item.points.toLocaleString()}</p>
                                    </div>
                                </motion.div>
                            ))}

                            {data.length === 0 && (
                                <div className="text-center py-20 bg-white rounded-[32px] border border-dashed border-slate-300">
                                    <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">No recorded achievements yet</p>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
