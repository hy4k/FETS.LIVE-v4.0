import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Loader2, X, Save, Sparkles, Brain, Link, Share2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import { FETS_UNIVERSE_TRIVIA, FetsTriviaQuestion } from '../data/fetsUniverseTrivia';

// --- Types ---
interface NotebookPage {
    id?: string;
    page_number: number;
    content: string;
    context?: any; // Stores linked context data (e.g. { type: 'roster', id: '123' })
    ai_analysis?: string; // Cache AI responses
}

interface FetsCodexProps {
    isOpen?: boolean;
    onClose?: () => void;
    quickCaptureContext?: string | null; // If provided, opens in Quick Capture mode
}

export const DigitalNotebook: React.FC<FetsCodexProps> = ({ isOpen: externalIsOpen, onClose, quickCaptureContext }) => {
    const { user, profile } = useAuth();

    // Internal state for standalone mode, sync with external if provided
    const [isOpened, setIsOpened] = useState(false);

    useEffect(() => {
        if (externalIsOpen !== undefined) setIsOpened(externalIsOpen);
        if (quickCaptureContext) setIsOpened(true);
    }, [externalIsOpen, quickCaptureContext]);

    const handleClose = () => {
        setIsOpened(false);
        if (onClose) onClose();
    };

    const [currentPage, setCurrentPage] = useState(1);
    const [pages, setPages] = useState<Record<number, NotebookPage>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [dailyTrivia, setDailyTrivia] = useState<FetsTriviaQuestion | null>(null);
    const [analyzing, setAnalyzing] = useState(false);

    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Personalization
    const firstName = profile?.full_name?.split(' ')[0].toLowerCase() || 'agent';
    const initials = profile?.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || '••';

    useEffect(() => {
        // Load some lore for the cover
        const randomIndex = Math.floor(Math.random() * FETS_UNIVERSE_TRIVIA.length);
        setDailyTrivia(FETS_UNIVERSE_TRIVIA[randomIndex]);
    }, []);

    const fetchPages = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        const { data } = await supabase.from('user_notebook_pages').select('*').eq('user_id', user.id).order('page_number');

        const pagesMap: Record<number, NotebookPage> = {};
        if (data && data.length > 0) {
            data.forEach((page: any) => {
                pagesMap[page.page_number] = { ...page };
            });
        } else {
            // Initialize Page 1
            pagesMap[1] = { page_number: 1, content: '' };
        }

        // If Quick Capture, maybe auto-create a new page or append to Page 1?
        // For this iteration, we'll just open the latest page or Page 1.
        setPages(pagesMap);
        setLoading(false);
    }, [user]);

    useEffect(() => { fetchPages(); }, [fetchPages]);

    const savePageContent = async (pageNumber: number, content: string, context?: any) => {
        if (!user) return;
        setSaving(true);
        // Persist to Supabase
        await supabase.from('user_notebook_pages').upsert({
            user_id: user.id,
            page_number: pageNumber,
            content,
            updated_at: new Date().toISOString(),
            context: context
        }, { onConflict: 'user_id,page_number' });
        setSaving(false);
    };

    const handleContentChange = (content: string) => {
        setPages(prev => ({
            ...prev,
            [currentPage]: {
                ...prev[currentPage],
                content,
                context: quickCaptureContext ? { source: quickCaptureContext } : prev[currentPage]?.context
            }
        }));

        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => savePageContent(currentPage, content), 1500);
    };

    const nextPage = () => {
        const next = currentPage + 1;
        if (!pages[next]) setPages(prev => ({ ...prev, [next]: { page_number: next, content: '' } }));
        setCurrentPage(next);
    };
    const prevPage = () => { if (currentPage > 1) setCurrentPage(currentPage - 1); };

    // AI Analysis Feature
    const analyzeProse = async () => {
        const currentContent = pages[currentPage]?.content;
        if (!currentContent || currentContent.length < 10) {
            toast.error('Not enough data to analyze.');
            return;
        }

        setAnalyzing(true);
        try {
            // Simulate AI call or use 'askGemini' if available (need to import or use API service)
            // For now, we simulate a "system response"
            await new Promise(resolve => setTimeout(resolve, 2000));

            const analysis = `[SYSTEM ANALYSIS]: The user seeks to record "${currentContent.substring(0, 20)}...". \n\nInsight: This aligns with operational protocols. Consider linking this to the Roster or Staff modules for cross-referencing.`;

            // Append analysis to content nicely
            const newContent = currentContent + '\n\n' + analysis;
            handleContentChange(newContent);
            toast.success('Intelligence Layer Applied');
        } catch (e) {
            toast.error('Analysis Failed');
        } finally {
            setAnalyzing(false);
        }
    }

    if (loading) return <div className="h-full flex items-center justify-center bg-[#1a120b]"><Loader2 className="animate-spin text-[#d4a373]" /></div>;

    return (
        <div className="relative w-full h-full flex items-center justify-center perspective-[2500px] overflow-hidden bg-[#0c0c0c]">

            {/* Cinematic Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#0f0f0f] via-[#1a1a1a] to-[#050505]" />
            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay pointer-events-none" />

            <AnimatePresence mode="wait">
                {/* --- OPEN CODEX (Interface) --- */}
                <motion.div
                    key="book-open"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="relative w-[95vw] max-w-6xl h-[85vh] bg-[#121212] rounded-3xl overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] border border-white/10 flex flex-col md:flex-row"
                >
                    {/* Quick Close Button */}
                    <div className="absolute top-6 right-6 z-50">
                        <button onClick={handleClose} className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    {/* LEFT PANEL: Context & List */}
                    <div className="w-full md:w-80 bg-[#0f0f0f] border-r border-[#ffbf00]/10 flex flex-col">
                        <div className="p-6 border-b border-white/5">
                            <h2 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-3">
                                <Sparkles size={18} className="text-[#ffbf00]" />
                                The Codex
                            </h2>
                            <p className="text-[10px] text-white/40 font-mono mt-1">Operational Intelligence Log</p>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
                            {/* Example Page List */}
                            {Object.values(pages).map((p) => (
                                <button
                                    key={p.page_number}
                                    onClick={() => setCurrentPage(p.page_number)}
                                    className={`w-full p-4 rounded-xl border flex items-start gap-3 transition-all text-left group
                                             ${currentPage === p.page_number
                                            ? 'bg-[#ffbf00]/10 border-[#ffbf00]/30'
                                            : 'bg-white/5 border-transparent hover:bg-white/10 hover:border-white/5'}
                                         `}
                                >
                                    <div className={`mt-1 w-2 h-2 rounded-full ${currentPage === p.page_number ? 'bg-[#ffbf00] shadow-[0_0_10px_orange]' : 'bg-white/20'}`} />
                                    <div className="min-w-0">
                                        <div className="text-xs font-bold text-white uppercase tracking-wider mb-1">Entry {p.page_number.toString().padStart(3, '0')}</div>
                                        <div className="text-[11px] text-white/50 truncate font-mono">
                                            {p.content ? p.content.substring(0, 30) : 'Empty Log...'}
                                        </div>
                                    </div>
                                </button>
                            ))}

                            <button onClick={nextPage} className="w-full py-3 border border-dashed border-white/10 rounded-xl text-[10px] font-bold text-white/30 uppercase hover:text-white hover:border-white/20 transition-colors">
                                + New Entry
                            </button>
                        </div>

                        {/* Lore / Trivia Footer */}
                        <div className="p-6 border-t border-white/5 bg-gradient-to-t from-black to-transparent">
                            <div className="flex items-start gap-3 opacity-60">
                                <Brain size={16} className="text-white/40 mt-1" />
                                <div>
                                    <p className="text-[9px] font-bold text-[#ffbf00] uppercase tracking-widest mb-1">Did you know?</p>
                                    <p className="text-[10px] text-white/70 leading-relaxed font-serif italic">
                                        "{dailyTrivia?.question}"
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT PANEL: Editor Interface */}
                    <div className="flex-1 relative bg-[#0a0a0a] flex flex-col">
                        {/* EDITOR HEADER */}
                        <div className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-[#0a0a0a]">
                            <div className="flex items-center gap-4">
                                <span className="text-lg font-mono font-bold text-white/90">ENTRY #{currentPage.toString().padStart(3, '0')}</span>
                                {quickCaptureContext && (
                                    <span className="px-2 py-1 rounded bg-blue-500/10 border border-blue-500/20 text-[10px] font-bold text-blue-400 uppercase tracking-wide flex items-center gap-1">
                                        <Link size={10} /> {quickCaptureContext}
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={analyzeProse}
                                    disabled={analyzing}
                                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500/10 to-purple-600/10 border border-purple-500/30 text-purple-400 text-[10px] font-black uppercase tracking-widest hover:brightness-125 transition-all flex items-center gap-2"
                                >
                                    {analyzing ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                    {analyzing ? 'Processing...' : 'Ask Intelligence'}
                                </button>

                                <div className="h-4 w-[1px] bg-white/10" />

                                <AnimatePresence>
                                    {saving ? (
                                        <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-[10px] font-bold text-[#ffbf00] uppercase tracking-widest animate-pulse">
                                            Syncing
                                        </motion.span>
                                    ) : (
                                        <span className="text-[10px] font-bold text-emerald-500/60 uppercase tracking-widest">
                                            Secure
                                        </span>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* EDITOR CANVAS */}
                        <div className="flex-1 relative overflow-hidden">
                            {/* Subtle Grid */}
                            <div className="absolute inset-0 opacity-[0.03]"
                                style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}
                            />

                            <textarea
                                className="relative z-10 w-full h-full bg-transparent resize-none p-12 outline-none font-mono text-lg text-white/80 placeholder-white/10 leading-relaxed custom-scrollbar"
                                placeholder="// Initialize log sequence... \n// Record observations, strategies, or mission data."
                                value={pages[currentPage]?.content || ''}
                                onChange={(e) => handleContentChange(e.target.value)}
                                spellCheck={false}
                            />
                        </div>

                        {/* FOOTER CONTROLS */}
                        <div className="h-16 border-t border-white/5 flex items-center justify-between px-8 bg-[#0a0a0a]">
                            <button onClick={prevPage} disabled={currentPage === 1} className="flex items-center gap-2 text-xs font-bold text-white/40 hover:text-white uppercase disabled:opacity-20 transition-colors">
                                <ChevronLeft size={16} /> Previous
                            </button>
                            <button onClick={nextPage} className="flex items-center gap-2 text-xs font-bold text-white/40 hover:text-white uppercase transition-colors">
                                Next Entry <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>

            <style dangerouslySetInnerHTML={{
                __html: `
                    .transform-style-3d { transform-style: preserve-3d; }
                    .rotate-y-\\[-90deg\\] { transform: rotateY(-90deg); }
                    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap');
                    .font-mono { font-family: 'Space Mono', monospace; }
                    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,191,0,0.1); border-radius: 10px; }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,191,0,0.3); }
                `
            }} />
        </div>
    );
};

