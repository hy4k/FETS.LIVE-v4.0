import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Loader2, ShieldCheck, Fingerprint, Sparkles, Wand2, MapPin, Globe, Lock, Cpu, ScanFace, Database } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import { FETS_UNIVERSE_TRIVIA, FetsTriviaQuestion } from '../data/fetsUniverseTrivia';

interface NotebookPage {
    id?: string;
    page_number: number;
    content: string;
}

const LOCATIONS = ['Cochin', 'Calicut', 'Kannur'];

export const DigitalNotebook: React.FC = () => {
    const { user, profile } = useAuth();
    const [isOpened, setIsOpened] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [pages, setPages] = useState<Record<number, NotebookPage>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [location, setLocation] = useState('');
    const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'success'>('idle');

    const [currentTrivia, setCurrentTrivia] = useState<FetsTriviaQuestion | null>(null);
    const [triviaAnswered, setTriviaAnswered] = useState<number | null>(null);

    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // --- Helpers ---
    const getRandomTrivia = () => {
        const randomIndex = Math.floor(Math.random() * FETS_UNIVERSE_TRIVIA.length);
        setCurrentTrivia(FETS_UNIVERSE_TRIVIA[randomIndex]);
        setTriviaAnswered(null);
    };

    useEffect(() => {
        if (profile?.full_name) {
            const hash = profile.full_name.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
            setLocation(LOCATIONS[hash % LOCATIONS.length]);
        }
    }, [profile]);

    useEffect(() => {
        if (isOpened && currentPage > 2) {
            getRandomTrivia();
        }
    }, [currentPage, isOpened]);

    const handleBiometricData = () => {
        if (scanStatus === 'success' || scanStatus === 'scanning') return;

        setScanStatus('scanning');
        setTimeout(() => {
            setScanStatus('success');
            toast.success("Biometric Verified", { icon: '🧬', style: { background: '#10b981', color: '#fff' } });
            setTimeout(() => {
                setIsOpened(true);
                setScanStatus('idle');
            }, 1000);
        }, 1200);
    };

    const fetchPages = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('user_notebook_pages')
            .select('*')
            .eq('user_id', user.id)
            .order('page_number', { ascending: true });

        if (!data) {
            setPages({ 1: { page_number: 1, content: '' } });
            setLoading(false);
            return;
        }

        const pagesMap: Record<number, NotebookPage> = {};
        data?.forEach((page: any) => {
            pagesMap[page.page_number] = {
                id: page.id,
                page_number: page.page_number,
                content: page.content,
            };
        });
        setPages(pagesMap);

        if (!pagesMap[1]) {
            setPages(prev => ({ ...prev, 1: { page_number: 1, content: '' } }));
        }
        setLoading(false);
    }, [user]);

    useEffect(() => {
        fetchPages();
    }, [fetchPages]);

    const savePageContent = async (pageNumber: number, content: string) => {
        if (!user) return;
        setSaving(true);
        await supabase
            .from('user_notebook_pages')
            .upsert({
                user_id: user.id,
                page_number: pageNumber,
                content: content,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id,page_number' });
        setSaving(false);
    };

    const handleContentChange = (content: string) => {
        setPages(prev => ({
            ...prev,
            [currentPage]: { ...prev[currentPage], content }
        }));

        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => {
            savePageContent(currentPage, content);
        }, 1000);
    };

    const nextPage = () => {
        const next = currentPage + 1;
        if (!pages[next]) {
            setPages(prev => ({
                ...prev,
                [next]: { page_number: next, content: '' }
            }));
        }
        setCurrentPage(next);
    };

    const prevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-20 h-full">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            </div>
        );
    }

    return (
        <div className="relative w-full h-full mx-auto perspective-1500 flex items-center justify-center py-6">
            <AnimatePresence mode="wait">
                {!isOpened ? (
                    <motion.div
                        key="cover"
                        initial={{ rotateY: 0 }}
                        exit={{ rotateY: -75, x: -60, opacity: 0, transition: { duration: 0.8, ease: "easeInOut" } }}
                        className="relative w-[500px] h-[720px] cursor-default transform-style-3d group"
                    >
                        {/* --- SPINE (3D Side) --- */}
                        <div className="absolute left-0 top-1 bottom-1 w-[40px] bg-[#1a0f00] rounded-l-md transform origin-right translate-x-[-38px] translate-z-[-10px] rotate-y-[-25deg] shadow-2xl overflow-hidden border-l border-amber-900/50">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-900/10 to-transparent" />
                            {/* Gold Ribs */}
                            {[20, 40, 60, 80].map(top => (
                                <div key={top} className="absolute w-full h-[2px] bg-gradient-to-r from-amber-700 via-yellow-500 to-amber-700 shadow-sm" style={{ top: `${top}%` }} />
                            ))}
                        </div>

                        {/* --- FRONT COVER --- */}
                        <div className="absolute inset-0 bg-[#0c0a09] rounded-r-xl rounded-l-sm shadow-[30px_30px_70px_rgba(0,0,0,0.8)] overflow-hidden border-r-4 border-b-4 border-[#1f150a]">

                            {/* Texture: Premium Aged Leather */}
                            <div className="absolute inset-0 opacity-100" style={{
                                background: `
                                    linear-gradient(135deg, rgba(30,20,10,0.95), rgba(10,5,0,0.98)),
                                    url("https://www.transparenttextures.com/patterns/black-leather.png")
                                `,
                                filter: 'contrast(1.1) brightness(0.9)',
                                backgroundBlendMode: 'multiply'
                            }} />

                            {/* --- ORNATE CORNERS (Metallic Gold) --- */}
                            <div className="absolute top-0 left-0 w-32 h-32 pointer-events-none opacity-90 mixed-blend-overlay">
                                <svg viewBox="0 0 100 100" className="w-full h-full text-yellow-600/80 drop-shadow-lg">
                                    <path d="M0,0 L60,0 L70,5 L70,10 L10,10 L10,70 L5,70 L0,60 Z" fill="url(#goldGrad)" />
                                    <path d="M5,5 L20,5 L5,20 Z" fill="#fbbf24" />
                                </svg>
                            </div>
                            <div className="absolute bottom-0 right-0 w-32 h-32 pointer-events-none opacity-90 rotate-180">
                                <svg viewBox="0 0 100 100" className="w-full h-full text-yellow-600/80 drop-shadow-lg">
                                    <path d="M0,0 L60,0 L70,5 L70,10 L10,10 L10,70 L5,70 L0,60 Z" fill="url(#goldGrad)" />
                                    <path d="M5,5 L20,5 L5,20 Z" fill="#fbbf24" />
                                </svg>
                            </div>

                            <svg className="h-0 w-0 absolute">
                                <defs>
                                    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#b45309" />
                                        <stop offset="50%" stopColor="#fbbf24" />
                                        <stop offset="100%" stopColor="#b45309" />
                                    </linearGradient>
                                </defs>
                            </svg>

                            {/* --- NANO BANANA CIRCUITRY (Etched & Glowing) --- */}
                            <div className="absolute inset-0 opacity-40 mix-blend-screen pointer-events-none">
                                <svg width="100%" height="100%">
                                    <pattern id="techGrid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                                        <path d="M40 0L0 0L0 40" fill="none" stroke="#fbbf24" strokeWidth="0.5" strokeOpacity="0.3" />
                                    </pattern>
                                    <rect width="100%" height="100%" fill="url(#techGrid)" />

                                    {/* Glowing Traces */}
                                    <motion.path
                                        d="M50 50 L50 200 L150 200 L150 500"
                                        fill="none"
                                        stroke="#fbbf24"
                                        strokeWidth="2"
                                        strokeDasharray="10 10" // Initial dash
                                        animate={{ strokeDashoffset: [0, -20] }}
                                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                        filter="drop-shadow(0 0 2px #fbbf24)"
                                    />
                                    <motion.path
                                        d="M450 650 L450 500 L350 500"
                                        fill="none"
                                        stroke="#fbbf24"
                                        strokeWidth="2"
                                        strokeDasharray="10 10"
                                        animate={{ strokeDashoffset: [0, 20] }}
                                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                        filter="drop-shadow(0 0 2px #fbbf24)"
                                    />
                                </svg>
                            </div>

                            {/* --- CONTENT CONTAINER --- */}
                            <div className="absolute inset-0 flex flex-col items-center p-12 z-10">

                                {/* Top Badge: Biometric Status */}
                                <div className="w-full flex justify-between items-start border-b border-yellow-500/20 pb-6 mb-8">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2 text-yellow-500/80">
                                            <ScanFace size={16} />
                                            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Identity Core</span>
                                        </div>
                                        <h2 className="text-xl font-serif text-white/90 tracking-wide font-bold">{profile?.full_name}</h2>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <div className="flex items-center gap-2 text-yellow-500/80">
                                            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{location}</span>
                                            <MapPin size={16} />
                                        </div>
                                        <div className="px-2 py-0.5 rounded bg-yellow-500/10 border border-yellow-500/30">
                                            <span className="text-[8px] text-yellow-400 font-bold uppercase tracking-widest">Class A Clearance</span>
                                        </div>
                                    </div>
                                </div>

                                {/* --- CENTER: HOLOGRAPHIC UNIVERSE --- */}
                                <div className="flex-1 w-full flex flex-col items-center justify-center relative">

                                    {/* Hologram Projector Glow */}
                                    <div className="absolute inset-0 bg-gradient-to-b from-yellow-500/5 via-transparent to-yellow-500/5 blur-xl pointer-events-none" />

                                    {/* Main Title */}
                                    <h1 className="text-5xl font-serif font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 to-yellow-600 drop-shadow-[0_2px_10px_rgba(234,179,8,0.5)] tracking-[0.15em] mb-12 text-center" style={{ fontFamily: 'Cinzel, serif' }}>
                                        FETS.UNIVERSE
                                    </h1>

                                    {/* Futuristic Diagram (Enhanced Readability) */}
                                    <div className="relative w-72 h-72">
                                        {/* Background Orbit Rings */}
                                        <div className="absolute inset-0 rounded-full border border-yellow-500/20 animate-[spin_10s_linear_infinite]" />
                                        <div className="absolute inset-4 rounded-full border border-dashed border-yellow-500/10 animate-[spin_15s_linear_infinite_reverse]" />

                                        {/* Center Core */}
                                        <div className="absolute inset-0 m-auto w-24 h-24 bg-gradient-to-br from-[#2a1b0a] to-[#45200a] rounded-full border-2 border-yellow-500 flex items-center justify-center shadow-[0_0_40px_rgba(234,179,8,0.3)] z-20 group-hover:scale-105 transition-transform duration-500">
                                            <div className="text-center">
                                                <Database size={24} className="text-yellow-400 mx-auto mb-1" />
                                                <span className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest">Nexus</span>
                                            </div>
                                        </div>

                                        {/* Orbiting Satellite Nodes */}
                                        {[
                                            { label: 'FETS.LIVE', icon: Globe, left: '50%', top: '0%', x: '-50%', y: '-50%' },
                                            { label: 'FETS.SPACE', icon: Sparkles, left: '50%', top: '100%', x: '-50%', y: '-50%' },
                                            { label: 'FETS.CASH', icon: Lock, left: '0%', top: '50%', x: '-50%', y: '-50%' },
                                            { label: 'FETS.IN', icon: MapPin, left: '100%', top: '50%', x: '-50%', y: '-50%' },
                                        ].map((node, i) => (
                                            <div
                                                key={i}
                                                className="absolute flex flex-col items-center gap-2 z-30 group/node cursor-help transform hover:scale-110 transition-transform"
                                                style={{ left: node.left, top: node.top, transform: `translate(${node.x}, ${node.y})` }}
                                            >
                                                <div className="w-12 h-12 bg-black/80 backdrop-blur-md rounded-lg border border-yellow-500/50 flex items-center justify-center shadow-[0_0_15px_rgba(234,179,8,0.2)] group-hover/node:border-yellow-400 group-hover/node:shadow-[0_0_20px_rgba(234,179,8,0.6)] transition-all">
                                                    <node.icon className="w-5 h-5 text-yellow-500" />
                                                </div>
                                                <span className="px-3 py-1 bg-yellow-500 text-black text-[10px] font-black uppercase tracking-wider rounded shadow-lg">
                                                    {node.label}
                                                </span>
                                            </div>
                                        ))}

                                        {/* Laser Connectors */}
                                        <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                                            <line x1="50%" y1="50%" x2="50%" y2="0%" stroke="#eab308" strokeWidth="1" strokeOpacity="0.5" />
                                            <line x1="50%" y1="50%" x2="50%" y2="100%" stroke="#eab308" strokeWidth="1" strokeOpacity="0.5" />
                                            <line x1="50%" y1="50%" x2="0%" y2="50%" stroke="#eab308" strokeWidth="1" strokeOpacity="0.5" />
                                            <line x1="50%" y1="50%" x2="100%" y2="50%" stroke="#eab308" strokeWidth="1" strokeOpacity="0.5" />
                                        </svg>
                                    </div>

                                </div>

                                {/* --- BOTTOM: METALLIC BIOMETRIC INTERFACE --- */}
                                <div className="w-full flex flex-col items-center pt-8 border-t border-yellow-500/20">
                                    <div
                                        onClick={handleBiometricData}
                                        className="relative group cursor-pointer"
                                    >
                                        {/* Metal Plate Base */}
                                        <div className="w-24 h-24 rounded-full bg-gradient-to-b from-[#3d2b1f] to-[#1a0f00] border-4 border-[#5c4033] shadow-[inset_0_2px_4px_rgba(255,255,255,0.1),0_5px_15px_rgba(0,0,0,0.5)] flex items-center justify-center relative overflow-hidden">

                                            {/* Fingerprint Icon */}
                                            <Fingerprint
                                                size={48}
                                                strokeWidth={1}
                                                className={`transition-all duration-500 z-10 ${scanStatus === 'success' ? 'text-emerald-400 drop-shadow-[0_0_8px_#34d399]' :
                                                        scanStatus === 'scanning' ? 'text-yellow-200 opacity-80' :
                                                            'text-yellow-700/50 group-hover:text-yellow-600'
                                                    }`}
                                            />

                                            {/* Scanning Laser Effect */}
                                            <AnimatePresence>
                                                {scanStatus === 'scanning' && (
                                                    <motion.div
                                                        initial={{ top: '-10%' }}
                                                        animate={{ top: '110%' }}
                                                        transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                                                        className="absolute w-full h-[2px] bg-yellow-400 shadow-[0_0_15px_#facc15] z-20"
                                                    />
                                                )}
                                            </AnimatePresence>

                                            {/* Success Glow */}
                                            {scanStatus === 'success' && (
                                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-emerald-500/20 z-0" />
                                            )}
                                        </div>

                                        {/* LED Indicators */}
                                        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1">
                                            <div className={`w-1.5 h-1.5 rounded-full ${scanStatus === 'idle' ? 'bg-red-500 animate-pulse' : 'bg-red-900'} shadow-[0_0_5px_currentColor]`} />
                                            <div className={`w-1.5 h-1.5 rounded-full ${scanStatus === 'scanning' ? 'bg-yellow-500 animate-pulse' : 'bg-yellow-900'} shadow-[0_0_5px_currentColor]`} />
                                            <div className={`w-1.5 h-1.5 rounded-full ${scanStatus === 'success' ? 'bg-green-500 animate-pulse' : 'bg-green-900'} shadow-[0_0_5px_currentColor]`} />
                                        </div>

                                        <p className="mt-6 text-[9px] text-center font-bold text-yellow-600/60 uppercase tracking-widest">{scanStatus === 'success' ? 'Access Granted' : 'Touch to Verify'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    // --- OPENED BOOK VIEW ---
                    <motion.div
                        key="pages"
                        initial={{ rotateY: 90, opacity: 0 }}
                        animate={{ rotateY: 0, opacity: 1, transition: { duration: 0.8, delay: 0.2, ease: "circOut" } }}
                        className="relative w-full h-[85vh] flex shadow-[0_30px_70px_rgba(0,0,0,0.5)] rounded-2xl overflow-hidden bg-[#e8e6e1]"
                        style={{ transformStyle: 'preserve-3d' }}
                    >
                        {/* LEFT PAGE (Wisdom/Trivia) */}
                        <div className="flex-1 bg-[#f0f0e0] border-r border-[#d0d0c0] relative overflow-hidden hidden md:flex flex-col shadow-inner">
                            <div className="absolute inset-0 opacity-[0.6]" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cream-paper.png")' }} />
                            {/* Inner grunge */}
                            <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent pointer-events-none" />

                            <div className="relative z-10 p-12 h-full flex flex-col">
                                {currentPage === 1 ? (
                                    <div className="flex-1 flex flex-col items-center justify-center relative">
                                        {/* Authentic Stamped Seal */}
                                        <div className="w-64 h-64 rounded-full border-8 border-amber-900/30 flex items-center justify-center p-2 rotate-[-5deg] mix-blend-multiply opacity-80"
                                            style={{ maskImage: 'url("https://www.transparenttextures.com/patterns/grunge-wall.png")' }}>
                                            <div className="w-full h-full rounded-full border-2 border-amber-900/50 flex flex-col items-center justify-center text-center p-6">
                                                <ShieldCheck size={48} className="text-amber-900/60 mb-2" />
                                                <h2 className="text-2xl font-black text-amber-950 uppercase tracking-tighter leading-none mb-1">FORUN</h2>
                                                <p className="text-[10px] font-bold text-amber-900 uppercase tracking-[0.2em] leading-tight">Testing &<br />Educational Svcs.</p>
                                                <div className="mt-4 pt-4 border-t border-amber-900/30 w-full">
                                                    <p className="text-[9px] font-mono text-amber-900 uppercase">Est. 2026</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-12 text-center max-w-xs">
                                            <p className="font-serif italic text-amber-900/60 text-sm">"The future belongs to those who prepare for it today."</p>
                                        </div>
                                    </div>
                                ) : (
                                    // Trivia/Wisdom Display
                                    <div className="flex-1 flex flex-col justify-center relative">
                                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                                            <Sparkles size={140} className="text-amber-900" />
                                        </div>

                                        <div className="flex items-center gap-3 mb-8 border-b-2 border-amber-900/10 pb-4">
                                            <div className="p-2 bg-amber-100 rounded-lg">
                                                <Wand2 size={20} className="text-amber-700" />
                                            </div>
                                            <h3 className="text-lg font-black text-amber-950 uppercase tracking-widest">Archive Wisdom</h3>
                                        </div>

                                        {currentTrivia && (
                                            <div className="bg-[#fffdf5] p-8 rounded-xl shadow-[2px_4px_10px_rgba(0,0,0,0.05)] border border-amber-900/5 relative overflow-hidden">
                                                <div className="absolute top-0 left-0 w-1 h-full bg-amber-400" />
                                                <p className="font-['Reenie_Beanie'] text-3xl text-amber-950 mb-8 font-bold leading-relaxed">
                                                    {currentTrivia.question}
                                                </p>
                                                <div className="space-y-3">
                                                    {currentTrivia.options.map((opt, idx) => (
                                                        <button
                                                            key={idx}
                                                            onClick={() => setTriviaAnswered(idx)}
                                                            className={`
                                                                w-full text-left px-5 py-4 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border
                                                                ${triviaAnswered === null
                                                                    ? 'bg-white hover:bg-amber-50 border-amber-900/10 text-amber-900/60 hover:text-amber-900'
                                                                    : idx === currentTrivia.correctAnswer
                                                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                                                        : triviaAnswered === idx
                                                                            ? 'bg-red-50 border-red-200 text-red-800'
                                                                            : 'opacity-50 border-transparent'
                                                                }
                                                            `}
                                                        >
                                                            {opt}
                                                        </button>
                                                    ))}
                                                </div>

                                                {triviaAnswered !== null && (
                                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 pt-4 border-t border-dashed border-amber-900/10">
                                                        <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-2">Context:</p>
                                                        <p className="text-xs font-serif text-amber-900/80 leading-relaxed italic">{currentTrivia.context}</p>
                                                    </motion.div>
                                                )}
                                            </div>
                                        )}

                                        <div className="mt-8 text-center">
                                            <button onClick={getRandomTrivia} className="text-[10px] font-bold text-amber-900/40 hover:text-amber-700 uppercase tracking-[0.2em] transition-colors">
                                                Request New Data
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* RIGHT PAGE (Writing) */}
                        <div className="flex-1 bg-[#fdfbf7] relative shadow-inner overflow-hidden flex flex-col">
                            {/* Realistic Paper Texture */}
                            <div className="absolute inset-0 opacity-[0.4]" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cream-paper.png")' }} />
                            {/* Blue Lines */}
                            <div className="absolute inset-0 pointer-events-none" style={{
                                backgroundImage: 'linear-gradient(rgba(0,0,255,0.05) 1px, transparent 1px)',
                                backgroundSize: '100% 32px',
                                marginTop: '72px'
                            }} />
                            {/* Margin Line */}
                            <div className="absolute top-0 bottom-0 left-16 w-[1px] bg-red-500/10 z-0" />

                            {/* Header Area */}
                            <div className="relative z-10 px-16 pt-8 pb-4 flex justify-between items-end">
                                <div>
                                    <span className="block text-[10px] font-bold text-amber-900/30 uppercase tracking-widest mb-1">Entry Date</span>
                                    <span className="font-['Reenie_Beanie'] text-3xl font-bold text-amber-950">
                                        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <span className="block text-[10px] font-bold text-amber-900/30 uppercase tracking-widest mb-1">Record No.</span>
                                    <span className="font-sans text-lg font-black text-amber-900/20">{currentPage.toString().padStart(3, '0')}</span>
                                </div>
                            </div>

                            {/* Main Input Area */}
                            <textarea
                                value={pages[currentPage]?.content || ''}
                                onChange={(e) => handleContentChange(e.target.value)}
                                className="flex-1 relative z-20 bg-transparent resize-none px-16 py-2 outline-none font-['Reenie_Beanie'] text-2xl text-slate-800 leading-[32px] overflow-y-auto w-full custom-scrollbar"
                                placeholder="..."
                                spellCheck={false}
                            />

                            {/* Footer Navigation */}
                            <div className="relative z-20 px-8 py-4 flex justify-between items-center bg-[#fdfbf7]/80 backdrop-blur-sm border-t border-amber-900/5">
                                <button onClick={prevPage} disabled={currentPage === 1} className="p-2 text-amber-900/30 hover:text-amber-700 transition-colors disabled:opacity-20">
                                    <ChevronLeft size={20} />
                                </button>

                                <div className="flex items-center gap-6">
                                    <button onClick={() => setIsOpened(false)} className="text-[10px] font-bold text-amber-900/40 hover:text-amber-700 uppercase tracking-widest transition-colors flex items-center gap-2">
                                        <Lock size={12} /> Secure & Close
                                    </button>
                                    {saving && <Loader2 size={12} className="animate-spin text-amber-500" />}
                                </div>

                                <button onClick={nextPage} className="p-2 text-amber-900/30 hover:text-amber-700 transition-colors">
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style dangerouslySetInnerHTML={{
                __html: `
                    .perspective-1500 { perspective: 1500px; }
                    .transform-style-3d { transform-style: preserve-3d; }
                    @import url('https://fonts.googleapis.com/css2?family=Reenie+Beanie&family=Cinzel:wght@400;700;900&display=swap');
                    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(180, 83, 9, 0.2); border-radius: 4px; }
                `
            }} />
        </div>
    );
};
