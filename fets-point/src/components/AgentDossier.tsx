import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Zap, X, Shield, Cpu,
    Database, FileText, Lock, Share2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { FETS_UNIVERSE_TRIVIA } from '../data/fetsUniverseTrivia';
import { notificationService } from '../services/notification.service';
import confetti from 'canvas-confetti';

interface AgentDossierProps {
    agent: any;
    onClose?: () => void;
    onStartChat: () => void;
    currentUserId: string;
    embedded?: boolean;
}

export const AgentDossier: React.FC<AgentDossierProps> = ({
    agent, onClose, onStartChat, currentUserId, embedded = false
}) => {
    const [activeTab, setActiveTab] = useState<'profile' | 'connect'>('profile');
    const [bio, setBio] = useState('');
    const [sparks, setSparks] = useState(0);
    const [loading, setLoading] = useState(true);

    // Connection State
    const [canConnect, setCanConnect] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [connectProgress, setConnectProgress] = useState(0);
    const [receivedData, setReceivedData] = useState<any | null>(null);
    const [cooldown, setCooldown] = useState<string | null>(null);

    const connectionInterval = useRef<any>(null);

    useEffect(() => {
        if (agent?.user_id) {
            fetchAgentDetails();
            checkConnectionStatus();
        }
    }, [agent, currentUserId]);

    const fetchAgentDetails = async () => {
        try {
            const { data } = await supabase
                .from('profiles')
                .select('bio, sparks')
                .eq('id', agent.user_id)
                .single();

            if (data) {
                setBio(data.bio || 'Data Classified. No public records found.');
                setSparks(data.sparks || 0);
            }
        } catch (error) {
            console.error('Error fetching details:', error);
        } finally {
            setLoading(false);
        }
    };

    const checkConnectionStatus = () => {
        const lastConnect = localStorage.getItem(`fets_connect_${currentUserId}_${agent.user_id}`);
        if (lastConnect) {
            const lastDate = new Date(parseInt(lastConnect));
            const now = new Date();
            const diff = now.getTime() - lastDate.getTime();
            const oneDay = 24 * 60 * 60 * 1000;

            if (diff < oneDay) {
                setCanConnect(false);
                const hoursLeft = Math.ceil((oneDay - diff) / (1000 * 60 * 60));
                setCooldown(`${hoursLeft}h`);
                return;
            }
        }
        setCanConnect(true);
        setCooldown(null);
    };

    const startConnecting = () => {
        if (!canConnect) return;
        setIsConnecting(true);
        setConnectProgress(0);

        connectionInterval.current = setInterval(() => {
            setConnectProgress(prev => {
                const next = prev + 2;
                if (next >= 100) {
                    clearInterval(connectionInterval.current);
                    completeConnection();
                    return 100;
                }
                return next;
            });
        }, 30);
    };

    const stopConnecting = () => {
        if (connectProgress < 100) {
            setIsConnecting(false);
            setConnectProgress(0);
            clearInterval(connectionInterval.current);
        }
    };

    const completeConnection = async () => {
        setIsConnecting(false);
        setCanConnect(false);

        // 1. Logic
        // Fallback if trivia is empty
        const triviaList = FETS_UNIVERSE_TRIVIA.length > 0 ? FETS_UNIVERSE_TRIVIA : [{
            id: '0', question: "Welcome to FETS Point.", options: [], correctAnswer: 0, context: "Connect daily for more insights."
        }];

        const randomTrivia = triviaList[Math.floor(Math.random() * triviaList.length)];
        setReceivedData(randomTrivia);

        localStorage.setItem(`fets_connect_${currentUserId}_${agent.user_id}`, Date.now().toString());
        setCooldown("24h");

        // 2. Rewards
        try {
            setSparks(prev => prev + 10);

            // Increment for Target
            await supabase.rpc('increment_sparks', { target_user_id: agent.user_id, amount: 10 });
            // Increment for Self
            await supabase.rpc('increment_sparks', { target_user_id: currentUserId, amount: 5 });

            // 3. Notify Target
            await notificationService.createNotification({
                recipient_id: agent.user_id,
                type: 'system_news',
                title: 'New Connection',
                message: `An agent connected with your profile. Data Shared: "${randomTrivia.question}"`,
                priority: 'low',
                metadata: { sender_id: currentUserId, trivia_id: randomTrivia.id }
            });

            triggerConfetti();
            toast.success("Connected! +10 Points");
        } catch (err) {
            console.error("Connection failed", err);
            // Even if RPC fails (e.g. missing function), UI should still show success for MVP
        }
    };

    const triggerConfetti = () => {
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#f59e0b', '#000000', '#ffffff']
        });
    };

    return (
        <div className={`
            flex flex-col bg-[#0a0a09] overflow-hidden relative font-sans
            ${embedded ? 'w-full h-full rounded-2xl border border-white/5' : 'fixed inset-0 z-50 rounded-none'}
        `}>
            {!embedded && (
                <button onClick={onClose} className="absolute top-6 right-6 z-50 p-2 bg-black/50 text-white rounded-full hover:bg-white/10">
                    <X size={20} />
                </button>
            )}

            {/* --- HEADER --- */}
            <div className="relative h-64 shrink-0">
                <div className="absolute inset-0 bg-gradient-to-b from-amber-900/40 via-[#0a0a09] to-[#0a0a09]">
                    <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay" />
                </div>

                <div className="absolute inset-x-0 bottom-0 p-6 flex flex-col items-center">
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="w-32 h-32 rounded-full p-1 bg-gradient-to-b from-amber-400 to-amber-900 shadow-[0_0_40px_rgba(245,158,11,0.3)] relative z-10"
                    >
                        <img
                            src={agent.avatar_url || `https://ui-avatars.com/api/?name=${agent.full_name}&background=f59e0b&color=000`}
                            className="w-full h-full rounded-full object-cover border-4 border-[#0a0a09]"
                        />
                        {agent.is_online && (
                            <div className="absolute bottom-2 right-2 w-6 h-6 bg-emerald-500 border-4 border-[#0a0a09] rounded-full shadow-[0_0_10px_#10b981]" />
                        )}
                    </motion.div>

                    <h1 className="mt-4 text-2xl font-black text-white uppercase tracking-tight text-center">{agent.full_name}</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 rounded-sm bg-amber-500/10 text-amber-500 text-[10px] font-bold uppercase tracking-widest border border-amber-500/20">
                            {agent.branch_assigned || 'Operative'}
                        </span>
                        <span className="w-1 h-1 bg-gray-600 rounded-full" />
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Lvl. 4</span>
                    </div>
                </div>
            </div>

            {/* --- TABS --- */}
            <div className="flex border-b border-white/10 shrink-0">
                <button
                    onClick={() => setActiveTab('profile')}
                    className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-colors relative ${activeTab === 'profile' ? 'text-amber-500' : 'text-gray-600 hover:text-gray-400'}`}
                >
                    Profile
                    {activeTab === 'profile' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500" />}
                </button>
                <button
                    onClick={() => setActiveTab('connect')}
                    className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-colors relative ${activeTab === 'connect' ? 'text-amber-500' : 'text-gray-600 hover:text-gray-400'}`}
                >
                    Connect
                    {activeTab === 'connect' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500" />}
                </button>
            </div>

            {/* --- CONTENT --- */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 relative">
                <AnimatePresence mode="wait">
                    {activeTab === 'profile' ? (
                        <motion.div
                            key="profile"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-6"
                        >
                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-center gap-1">
                                    <Zap className="text-amber-500 mb-1" size={20} />
                                    <span className="text-2xl font-black text-white">{sparks}</span>
                                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Points</span>
                                </div>
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-center gap-1">
                                    <Shield className="text-emerald-500 mb-1" size={20} />
                                    <span className="text-2xl font-black text-white">Active</span>
                                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Status</span>
                                </div>
                            </div>

                            {/* Bio */}
                            <div className="space-y-2">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                    <FileText size={12} /> Bio
                                </h3>
                                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 text-sm text-gray-300 leading-relaxed italic">
                                    "{bio}"
                                </div>
                            </div>

                            <button onClick={onStartChat} className="w-full py-4 rounded-xl bg-white text-black font-black uppercase tracking-widest text-xs hover:bg-gray-200 transition-colors shadow-lg">
                                Start Chat
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="connect"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="h-full flex flex-col items-center justify-center text-center space-y-6"
                        >
                            {!receivedData ? (
                                <>
                                    <div className="relative">
                                        <div className={`absolute inset-0 rounded-full border-2 border-amber-500/20 ${isConnecting ? 'animate-ping' : ''}`} />
                                        <div className={`absolute -inset-4 rounded-full border border-amber-500/10 ${isConnecting ? 'animate-pulse' : ''}`} />

                                        <button
                                            onMouseDown={startConnecting}
                                            onMouseUp={stopConnecting}
                                            onMouseLeave={stopConnecting}
                                            onTouchStart={startConnecting}
                                            onTouchEnd={stopConnecting}
                                            disabled={!canConnect}
                                            className={`
                                                w-40 h-40 rounded-full flex flex-col items-center justify-center gap-2 relative z-10 transition-all duration-200
                                                ${canConnect
                                                    ? 'bg-gradient-to-b from-[#1a1a19] to-black border-4 border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.2)] active:scale-95 cursor-pointer'
                                                    : 'bg-gray-900 border-4 border-gray-800 opacity-50 cursor-not-allowed grayscale'
                                                }
                                            `}
                                        >
                                            {canConnect ? (
                                                <>
                                                    <Cpu size={32} className={isConnecting ? 'text-white animate-pulse' : 'text-amber-500'} />
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-500 select-none">
                                                        {isConnecting ? 'Connecting...' : 'Hold to Connect'}
                                                    </span>
                                                </>
                                            ) : (
                                                <>
                                                    <Lock size={32} className="text-gray-500" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 select-none">
                                                        Cooled Down
                                                    </span>
                                                    <span className="text-xs text-gray-600">{cooldown}</span>
                                                </>
                                            )}

                                            {isConnecting && (
                                                <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
                                                    <circle
                                                        cx="80" cy="80" r="76"
                                                        stroke="currentColor" strokeWidth="4"
                                                        fill="none"
                                                        className="text-amber-500"
                                                        strokeDasharray="477"
                                                        strokeDashoffset={477 - (477 * connectProgress) / 100}
                                                        strokeLinecap="round"
                                                    />
                                                </svg>
                                            )}
                                        </button>
                                    </div>

                                    <div className="max-w-xs">
                                        <h3 className="text-white font-bold uppercase tracking-wide mb-2">Daily Connection</h3>
                                        <p className="text-xs text-gray-500 leading-relaxed">
                                            Connect once a day to earn <span className="text-amber-500">Points</span> and discover new facts about the FETS Universe.
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="w-full max-w-sm"
                                >
                                    <div className="bg-[#1a1a19] border border-amber-500/30 rounded-2xl p-6 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4 opacity-10"><Database size={64} className="text-amber-500" /></div>

                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="p-2 bg-amber-500/20 rounded-lg text-amber-500"><Share2 size={16} /></div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">Info Received</span>
                                        </div>

                                        <h4 className="text-white font-bold text-lg mb-2 leading-tight">"{receivedData.question}"</h4>
                                        <div className="w-8 h-1 bg-amber-500 mb-4" />
                                        <p className="text-sm text-gray-400 italic mb-4">{receivedData.context}</p>

                                        <div className="bg-black/40 p-3 rounded-lg border border-white/10 flex items-center justify-between">
                                            <span className="text-[10px] text-gray-500 uppercase tracking-widest">Added</span>
                                            <span className="text-amber-500 font-black text-sm flex items-center gap-1">+10 Points <Zap size={12} fill="currentColor" /></span>
                                        </div>
                                    </div>

                                    <button onClick={() => setReceivedData(null)} className="mt-6 text-gray-500 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors">
                                        Back
                                    </button>
                                </motion.div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
