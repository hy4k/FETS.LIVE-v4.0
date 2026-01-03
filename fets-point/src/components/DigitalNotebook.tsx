import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Save, Loader2, ShieldCheck, Fingerprint } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

interface NotebookPage {
    id?: string;
    page_number: number;
    content: string;
}

export const DigitalNotebook: React.FC = () => {
    const { user, profile } = useAuth();
    const [isOpened, setIsOpened] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [pages, setPages] = useState<Record<number, NotebookPage>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const fetchPages = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('user_notebook_pages')
            .select('*')
            .eq('user_id', user.id)
            .order('page_number', { ascending: true });

        if (error) {
            console.error('Error fetching pages:', error);
            toast.error('Failed to load notebook');
        } else {
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
                setPages({
                    1: { page_number: 1, content: '' }
                });
            }
        }
        setLoading(false);
    }, [user]);

    useEffect(() => {
        fetchPages();
    }, [fetchPages]);

    const savePageContent = async (pageNumber: number, content: string) => {
        if (!user) return;
        setSaving(true);

        const { error } = await supabase
            .from('user_notebook_pages')
            .upsert({
                user_id: user.id,
                page_number: pageNumber,
                content: content,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id,page_number' });

        if (error) {
            console.error('Error saving page:', error);
            toast.error('Auto-save failed');
        }
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
            <div className="flex items-center justify-center p-20 h-[600px]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-[#d4af37]" />
                    <p className="text-[#d4af37] font-serif tracking-widest text-sm">AUTHENTICATING ACCESS...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full max-w-[900px] mx-auto perspective-1000 h-[700px] flex items-center justify-center py-4">
            <AnimatePresence mode="wait">
                {!isOpened ? (
                    <motion.div
                        key="cover"
                        initial={{ rotateY: 0 }}
                        exit={{ rotateY: -90, opacity: 0, transition: { duration: 0.6, ease: "easeIn" } }}
                        onClick={() => setIsOpened(true)}
                        className="relative w-[500px] h-[650px] cursor-pointer group rounded-r-2xl overflow-hidden shadow-[20px_20px_60px_rgba(0,0,0,0.5)] transform-style-3d transition-transform duration-500 hover:rotate-y-[-5deg]"
                    >
                        {/* Leather Texture Background */}
                        <div className="absolute inset-0 bg-[#1a1c20]" style={{
                            backgroundImage: `url("https://www.transparenttextures.com/patterns/black-leather.png"), radial-gradient(circle at center, #2a2d35 0%, #111 100%)`,
                            backgroundBlendMode: 'overlay'
                        }} />

                        {/* Gold Border / Stitching */}
                        <div className="absolute inset-4 border border-[#d4af37]/30 rounded-r-xl" />
                        <div className="absolute inset-5 border border-dashed border-[#d4af37]/20 rounded-r-lg" />

                        {/* Spine */}
                        <div className="absolute top-0 bottom-0 left-0 w-12 bg-gradient-to-r from-[#111] to-[#252525] shadow-2xl z-20 flex flex-col items-center justify-center border-r border-[#333]">
                            <div className="w-[2px] h-full bg-[#d4af37]/20" />
                        </div>

                        {/* Content */}
                        <div className="absolute inset-0 flex flex-col items-center justify-between py-12 px-12 z-10 ml-8">

                            {/* Top Badge */}
                            <div className="flex flex-col items-center gap-2">
                                <div className="px-4 py-1 border border-[#d4af37]/40 rounded text-[#d4af37] text-[10px] tracking-[0.4em] font-serif uppercase bg-black/40 backdrop-blur-sm">
                                    Confidential
                                </div>
                            </div>

                            {/* Main Logo Image - Slightly Reduced */}
                            <div className="relative w-52 h-52 flex items-center justify-center p-4">
                                <div className="absolute inset-0 bg-[#d4af37] rounded-full blur-[60px] opacity-10" />
                                <img
                                    src="/fets-universe-enhanced.png"
                                    alt="FETS Universe"
                                    className="w-full h-full object-contain drop-shadow-2xl mix-blend-screen opacity-90"
                                />
                            </div>

                            {/* Title Text */}
                            <div className="text-center space-y-2">
                                <h1 className="text-2xl font-serif text-[#d4af37] tracking-[0.2em] font-bold text-shadow-gold">OFFICIAL PORTFOLIO</h1>
                                <p className="text-[#888] text-[9px] tracking-[0.3em] uppercase">Authorized Personnel Only</p>
                            </div>

                            {/* Auth Stamp */}
                            <div className="mt-4 border-2 border-[#d4af37]/30 p-2 rounded rotate-[-2deg] opacity-70">
                                <div className="border border-[#d4af37]/30 px-6 py-2 bg-[#d4af37]/5 backdrop-blur-sm">
                                    <div className="flex items-center gap-3 text-[#d4af37]">
                                        <ShieldCheck size={16} />
                                        <span className="text-xs font-bold tracking-widest uppercase">Secured • {new Date().getFullYear()}</span>
                                    </div>
                                </div>
                            </div>

                            {/* User details - Enhanced Visibility */}
                            <div className="w-full border-t border-[#d4af37]/20 pt-4 flex justify-between items-end">
                                <div className="flex flex-col">
                                    <span className="text-[8px] text-[#888] tracking-widest uppercase mb-1">Assigned Agent</span>
                                    <span className="text-[#d4af37] font-['Reenie_Beanie'] text-2xl tracking-widest shadow-black drop-shadow-md">
                                        {profile?.full_name || 'UNKNOWN AGENT'}
                                    </span>
                                </div>
                                <Fingerprint className="text-[#d4af37]/60 w-10 h-10" strokeWidth={1} />
                            </div>
                        </div>

                        {/* Reflective Sheen */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none" />
                    </motion.div>
                ) : (
                    <motion.div
                        key="pages"
                        initial={{ rotateY: 90, opacity: 0 }}
                        animate={{ rotateY: 0, opacity: 1, transition: { duration: 0.6, ease: "easeOut" } }}
                        className="relative w-full h-full flex shadow-[0_30px_70px_rgba(0,0,0,0.5)] rounded-r-xl overflow-hidden"
                        style={{ transformStyle: 'preserve-3d' }}
                    >
                        {/* Spine Overlay */}
                        <div className="absolute top-0 bottom-0 left-0 w-8 bg-black/90 z-30 shadow-2xl" />

                        {/* Left Page (Previous/Static) */}
                        <div className="flex-1 bg-[#f0f0e0] border-r border-[#d0d0c0] relative overflow-hidden hidden md:block">
                            <div className="absolute inset-0 opacity-[0.4]" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cream-paper.png")' }} />
                            <div className="absolute inset-0" style={{
                                backgroundImage: 'linear-gradient(#e5e5d0 1px, transparent 1px)',
                                backgroundSize: '100% 32px',
                                marginTop: '32px'
                            }} />
                            <div className="absolute top-0 bottom-0 right-12 w-[2px] bg-red-800/20" /> {/* Margin */}

                            <div className="relative z-10 p-12 pr-16 text-right font-['Reenie_Beanie'] text-2xl text-slate-500/50 rotate-[-1deg] overflow-hidden h-full">
                                {currentPage > 2 ? (
                                    <>
                                        <div className="mb-4 text-sm font-sans tracking-widest text-slate-400 uppercase">Page {currentPage - 2} - Archive</div>
                                        <div className="whitespace-pre-wrap">{pages[currentPage - 2]?.content}</div>
                                    </>
                                ) : (
                                    <div className="h-full flex items-center justify-center opacity-30">
                                        <div className="w-32 h-32 border-4 border-slate-400 rounded-full flex items-center justify-center rotate-[-15deg]">
                                            <span className="text-3xl font-black uppercase tracking-widest text-slate-400">VOID</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Shadow Gradient from Spine */}
                            <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-black/20 to-transparent pointer-events-none" />
                        </div>

                        {/* Right Page (Active) */}
                        <div className="flex-1 bg-[#fdfbf7] relative shadow-inner overflow-hidden flex flex-col">
                            {/* Paper Texture & Lines */}
                            <div className="absolute inset-0 opacity-[0.5]" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cream-paper.png")' }} />
                            <div className="absolute inset-0 pointer-events-none" style={{
                                backgroundImage: 'linear-gradient(#e1e8ed 1px, transparent 1px)',
                                backgroundSize: '100% 32px',
                                marginTop: '40px'
                            }} />
                            <div className="absolute top-0 bottom-0 left-12 w-[2px] bg-red-400/20" /> {/* Margin */}

                            {/* Header */}
                            <div className="relative z-10 px-16 pt-6 pb-2 flex justify-between items-end border-b border-transparent">
                                <span className="font-['Reenie_Beanie'] text-2xl text-slate-400">
                                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                                </span>
                                <span className="font-sans text-[10px] font-bold text-slate-300 tracking-[0.2em] uppercase">NO. {currentPage.toString().padStart(3, '0')}</span>
                            </div>

                            {/* Text Area */}
                            <textarea
                                value={pages[currentPage]?.content || ''}
                                onChange={(e) => handleContentChange(e.target.value)}
                                className="flex-1 relative z-20 bg-transparent resize-none px-16 py-2 outline-none font-['Reenie_Beanie'] text-3xl text-[#2c3e50] leading-[32px] overflow-y-auto w-full"
                                placeholder="Start writing your thoughts..."
                                spellCheck={false}
                                style={{
                                    textShadow: '0 1px 1px rgba(0,0,0,0.05)'
                                }}
                            />

                            {/* Footer Controls */}
                            <div className="relative z-20 px-8 py-4 flex justify-between items-center bg-[#fdfbf7]/80 backdrop-blur-sm border-t border-slate-100">
                                <button
                                    onClick={prevPage}
                                    disabled={currentPage === 1}
                                    className="p-2 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-20"
                                >
                                    <ChevronLeft size={20} />
                                </button>

                                <div className="flex items-center gap-4">
                                    <button onClick={() => setIsOpened(false)} className="text-xs font-bold text-slate-400 hover:text-[#d4af37] transition-colors uppercase tracking-widest px-4 py-1 border border-slate-200 rounded hover:border-[#d4af37]">
                                        Close Portfolio
                                    </button>
                                    {saving && <span className="text-[9px] font-bold text-slate-300 uppercase animate-pulse">Saving...</span>}
                                </div>

                                <button
                                    onClick={nextPage}
                                    className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </div>

                            {/* Page Curl Shadow / Depth */}
                            <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-black/10 to-transparent pointer-events-none" />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style dangerouslySetInnerHTML={{
                __html: `
        .perspective-1000 { perspective: 1500px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .text-shadow-gold { text-shadow: 0 2px 10px rgba(212, 175, 55, 0.3); }
        @import url('https://fonts.googleapis.com/css2?family=Reenie+Beanie&display=swap');
      `}} />
        </div>
    );
};
