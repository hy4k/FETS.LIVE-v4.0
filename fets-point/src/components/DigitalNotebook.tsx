import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Loader2, X, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import { FETS_UNIVERSE_TRIVIA, FetsTriviaQuestion } from '../data/fetsUniverseTrivia';

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
    const [dailyTrivia, setDailyTrivia] = useState<FetsTriviaQuestion | null>(null);

    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Personalization
    const firstName = profile?.full_name?.split(' ')[0].toLowerCase() || 'midhun';
    const initials = profile?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '••';

    useEffect(() => {
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
            pagesMap[1] = { page_number: 1, content: '' };
        }
        setPages(pagesMap);
        setLoading(false);
    }, [user]);

    useEffect(() => { fetchPages(); }, [fetchPages]);

    const savePageContent = async (pageNumber: number, content: string) => {
        if (!user) return;
        setSaving(true);
        await supabase.from('user_notebook_pages').upsert({
            user_id: user.id, page_number: pageNumber, content, updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,page_number' });
        setSaving(false);
    };

    const handleContentChange = (content: string) => {
        setPages(prev => ({ ...prev, [currentPage]: { ...prev[currentPage], content } }));
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => savePageContent(currentPage, content), 1500);
    };

    const nextPage = () => {
        const next = currentPage + 1;
        if (!pages[next]) setPages(prev => ({ ...prev, [next]: { page_number: next, content: '' } }));
        setCurrentPage(next);
    };
    const prevPage = () => { if (currentPage > 1) setCurrentPage(currentPage - 1); };

    if (loading) return <div className="h-full flex items-center justify-center bg-[#1a120b]"><Loader2 className="animate-spin text-[#d4a373]" /></div>;

    return (
        <div className="relative w-full h-full flex items-center justify-center perspective-[2500px] overflow-hidden bg-[#1a1a1a]">

            {/* Library/Office Background Lighting */}
            <div className="absolute inset-0 bg-[#0f0f0f]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(60,40,30,0.4),rgba(0,0,0,0.9))]" />
            <div className="absolute top-[10%] left-[10%] w-[80%] h-[80%] bg-[#3d2b1f] blur-[150px] opacity-20" />

            <AnimatePresence mode="wait">
                {!isOpened ? (
                    // --- CLOSED BOOK (Matches Reference Image) ---
                    <motion.div
                        key="book-closed"
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{
                            rotateY: -110,
                            x: -200,
                            opacity: 0,
                            transition: { duration: 1.5, ease: [0.34, 1.56, 0.64, 1] }
                        }}
                        whileHover={{ y: -10, transition: { duration: 0.4 } }}
                        onClick={() => setIsOpened(true)}
                        className="relative w-[480px] h-[680px] cursor-pointer group transform-style-3d select-none"
                    >
                        {/* 3D Sides - Paper Edges */}
                        <div className="absolute right-[-15px] top-[5px] bottom-[5px] w-[30px] bg-[#fdfaf5] origin-left rotate-y-[90deg] border-l border-[#dcd9d4] shadow-md z-0 shadow-[inset_10px_0_20px_rgba(0,0,0,0.1)]"
                            style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,0.05) 2px, rgba(0,0,0,0.05) 3px)' }}
                        />

                        {/* Bottom Paper Edges */}
                        <div className="absolute left-[5px] right-[5px] bottom-[-15px] h-[30px] bg-[#fdfaf5] origin-top rotate-x-[-90deg] border-t border-[#dcd9d4] shadow-md z-0 shadow-[inset_0_10px_20px_rgba(0,0,0,0.1)]"
                            style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.05) 2px, rgba(0,0,0,0.05) 3px)' }}
                        />

                        {/* Spine */}
                        <div className="absolute left-[-5px] top-0 bottom-0 w-[40px] bg-[#3d2b1f] rounded-l-md origin-right translate-x-[-20px] rotate-y-[-90deg] border-r border-black/40 shadow-2xl z-10" />

                        {/* Front Cover */}
                        <div className="absolute inset-0 bg-[#4a3528] rounded-xl border border-[#3d2b1f] overflow-hidden shadow-[20px_40px_80px_rgba(0,0,0,0.8)] z-20">
                            {/* Leather Texture */}
                            <div className="absolute inset-0 opacity-[0.85] mix-blend-overlay"
                                style={{
                                    backgroundImage: `url('https://www.transparenttextures.com/patterns/leather.png')`,
                                    filter: 'contrast(1.2) brightness(0.8)'
                                }}
                            />

                            {/* Aged edges shadow */}
                            <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.6)]" />

                            {/* Stitching */}
                            <div className="absolute inset-[10px] border-2 border-black/20 rounded-lg border-dashed opacity-30" />

                            {/* Elastic Band */}
                            <div className="absolute right-[50px] top-0 bottom-0 w-[14px] bg-[#1a1a1a] shadow-[inset_2px_0_4px_rgba(255,255,255,0.05),2px_0_15px_rgba(0,0,0,0.6)] z-30" />

                            {/* Center Logo/Title */}
                            <div className="relative h-full flex flex-col items-center justify-center z-40 p-12">

                                <div className="relative group/title mb-2">
                                    {/* 3D FORUN Title */}
                                    <div className="relative flex flex-col items-center">
                                        {/* Back shadow for depth */}
                                        <h1 className="text-[120px] leading-[1] font-bold text-black opacity-30 translate-y-3 translate-x-2 select-none"
                                            style={{ fontFamily: 'Cinzel, serif', filter: 'blur(3px)' }}>
                                            FORUN
                                        </h1>

                                        {/* Main metallic text */}
                                        <h1 className="absolute inset-0 text-[120px] leading-[1] font-bold select-none"
                                            style={{
                                                fontFamily: 'Cinzel, serif',
                                                color: '#c2b280',
                                                backgroundImage: 'linear-gradient(to bottom, #f2ead3, #c2b280, #8b7d5b, #4a3528)',
                                                WebkitBackgroundClip: 'text',
                                                WebkitTextFillColor: 'transparent',
                                                filter: 'drop-shadow(0px 2px 2px rgba(255,255,255,0.2))'
                                            }}>
                                            FORUN
                                        </h1>

                                        {/* Subtle metallic bevel effect */}
                                        <h1 className="absolute inset-0 text-[120px] leading-[1] font-bold select-none pointer-events-none"
                                            style={{
                                                fontFamily: 'Cinzel, serif',
                                                WebkitTextStroke: '1px rgba(0,0,0,0.4)',
                                                WebkitTextFillColor: 'transparent'
                                            }}>
                                            FORUN
                                        </h1>
                                    </div>
                                </div>

                                {/* Handwritten Name */}
                                <div className="mt-[-20px] transition-transform group-hover:scale-110 duration-700">
                                    <p className="font-['Reenie_Beanie'] text-[54px] text-[#e3ded4] opacity-70 rotate-[-1deg] tracking-wide"
                                        style={{ textShadow: '0 2px 5px rgba(0,0,0,0.6)' }}>
                                        {firstName}
                                    </p>
                                </div>

                                {/* Base Detail */}
                                <div className="absolute bottom-12 flex flex-col items-center gap-1 opacity-20">
                                    <div className="h-[1px] w-32 bg-black" />
                                    <span className="text-[9px] uppercase tracking-[0.6em] text-black font-serif font-black">Archive Edition</span>
                                </div>
                            </div>
                        </div>

                        {/* Shadow on table surface */}
                        <div className="absolute bottom-[-50px] left-[5%] right-[5%] h-[30px] bg-black/50 blur-2xl rounded-full translate-z-[-50px] opacity-60" />
                    </motion.div>
                ) : (
                    // --- OPENED BOOK (Antique Internal View) ---
                    <motion.div
                        key="book-open"
                        initial={{ opacity: 0, scale: 0.9, rotateX: 10 }}
                        animate={{ opacity: 1, scale: 1, rotateX: 0, transition: { duration: 1, ease: [0.22, 1, 0.36, 1] } }}
                        className="flex w-[95%] max-w-7xl h-[88vh] shadow-[0_60px_150px_rgba(0,0,0,0.95)] rounded-[4px] overflow-hidden bg-[#e3e1da] relative border-y border-[#3d2b1f]/20"
                    >
                        {/* Centered binding shadow */}
                        <div className="absolute inset-y-0 left-1/2 w-[100px] -translate-x-1/2 bg-gradient-to-r from-black/25 via-black/45 to-black/25 pointer-events-none z-30" />

                        {/* --- LEFT PAGE: ARCHIVE Lore --- */}
                        <div className="w-1/2 bg-[#efede6] relative hidden lg:flex flex-col items-center justify-center p-20 border-r border-[#d4d4d0]/50 shadow-inner">
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] opacity-80 mix-blend-multiply" />

                            <div className="relative z-10 w-full max-w-md text-center">
                                <div className="mb-12 opacity-90 relative">
                                    <div className="absolute -top-16 left-1/2 -translate-x-1/2 opacity-5">
                                        <h1 className="text-[200px] font-serif text-black uppercase select-none font-black italic">F</h1>
                                    </div>
                                    <h3 className="text-4xl font-black text-[#3d2b1f] font-serif uppercase tracking-[0.4em] mb-4" style={{ fontFamily: 'Cinzel' }}>Records</h3>
                                    <div className="w-24 h-[2px] bg-[#d4a373] mx-auto opacity-40" />
                                </div>

                                <div className="prose prose-2xl font-serif text-[#4a3528] italic leading-[1.6] mb-12 opacity-90">
                                    "{dailyTrivia?.question}"
                                </div>

                                <div className="grid grid-cols-1 gap-6 text-left border-y border-black/[0.05] py-12 my-10">
                                    {dailyTrivia?.options.map((opt, i) => (
                                        <div key={i} className="flex items-center gap-8 group">
                                            <div className="w-10 h-10 rounded-full border border-[#d4a373]/50 flex items-center justify-center text-[11px] font-black text-[#d4a373] group-hover:bg-[#d4a373] group-hover:text-[#fbfaf6] transition-all cursor-default shadow-sm font-serif">
                                                {i + 1}
                                            </div>
                                            <span className="text-base font-serif text-[#5a4638] tracking-wide opacity-80">{opt}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="opacity-60 mt-20">
                                    <div className="w-24 h-24 border-2 border-[#3d2b1f]/10 rounded-full flex items-center justify-center mx-auto mb-6 p-2">
                                        <div className="w-full h-full rounded-full border border-[#3d2b1f]/10 flex items-center justify-center uppercase font-serif font-black text-[#3d2b1f] tracking-tighter text-2xl shadow-inner">
                                            {initials}
                                        </div>
                                    </div>
                                    <p className="text-[11px] uppercase tracking-[0.5em] text-[#3d2b1f] font-serif font-black">Authorized Personnel</p>
                                </div>
                            </div>
                        </div>

                        {/* --- RIGHT PAGE: Writing Surface --- */}
                        <div className="flex-1 bg-[#fbfaf6] relative flex flex-col shadow-2xl">
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] opacity-60 mix-blend-multiply" />
                            <div className="absolute inset-0 bg-gradient-to-r from-black/15 to-transparent pointer-events-none z-10" />

                            {/* Header */}
                            <header className="relative z-10 h-36 px-16 flex items-end justify-between pb-10 border-b border-black/[0.04] bg-gradient-to-b from-black/[0.01] to-transparent">
                                <div className="flex items-center gap-6">
                                    <div className="h-12 w-[3px] bg-[#d4a373]/40" />
                                    <div>
                                        <h2 className="text-[44px] font-['Reenie_Beanie'] text-[#3d2b1f] opacity-90 leading-none">
                                            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                                        </h2>
                                        <span className="text-[9px] uppercase tracking-[0.5em] text-black/40 font-black font-sans ml-1">Archive Synchronized</span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end opacity-50">
                                    <span className="text-[10px] uppercase tracking-[0.5em] text-black font-sans font-black mb-1">Sheet</span>
                                    <span className="font-serif text-4xl text-black font-thin">{currentPage.toString().padStart(2, '0')}</span>
                                </div>
                            </header>

                            {/* Editor area */}
                            <div className="flex-1 relative overflow-hidden group">
                                {/* Ruler Lines */}
                                <div className="absolute inset-0 pointer-events-none" style={{
                                    background: 'repeating-linear-gradient(transparent, transparent 39px, rgba(180,160,140,0.18) 39px, rgba(180,160,140,0.18) 40px)',
                                    marginTop: '40px'
                                }} />
                                <div className="absolute top-0 bottom-0 left-24 w-[1px] bg-red-900/10 pointer-events-none" />

                                <textarea
                                    className="relative z-20 w-full h-full bg-transparent resize-none px-28 py-12 outline-none font-['Reenie_Beanie'] text-[40px] leading-[40px] text-[#3d2b1f] placeholder-[#dcd9d4] custom-scrollbar"
                                    placeholder="Inscribe your thoughts..."
                                    value={pages[currentPage]?.content || ''}
                                    onChange={(e) => handleContentChange(e.target.value)}
                                    spellCheck={false}
                                />
                            </div>

                            {/* Modern-Clean Footer */}
                            <footer className="relative z-10 h-28 px-12 flex items-center justify-between border-t border-black/[0.04] bg-[#fdfcf8]/95 backdrop-blur-xl">
                                <motion.button
                                    whileHover={{ x: -8, backgroundColor: 'rgba(0,0,0,0.03)' }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={prevPage}
                                    disabled={currentPage === 1}
                                    className="p-6 text-[#a8a29e] hover:text-[#3d2b1f] transition-all disabled:opacity-0 rounded-full"
                                >
                                    <ChevronLeft size={32} />
                                </motion.button>

                                <div className="flex items-center gap-8">
                                    <motion.button
                                        whileHover={{ scale: 1.05, y: -2 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setIsOpened(false)}
                                        className="h-14 px-12 bg-[#2c1e14] hover:bg-black text-[#fbfaf6] text-[11px] font-serif font-black uppercase tracking-[0.4em] rounded-full transition-all flex items-center gap-5 shadow-2xl active:shadow-inner"
                                    >
                                        <X size={18} /> Seal Archive
                                    </motion.button>
                                    <AnimatePresence>
                                        {saving && (
                                            <motion.div
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: 10 }}
                                                className="flex items-center gap-4 text-[#d4a373]"
                                            >
                                                <Save size={18} className="animate-spin" />
                                                <span className="text-[10px] font-black tracking-[0.5em] uppercase">Syncing...</span>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                <motion.button
                                    whileHover={{ x: 8, backgroundColor: 'rgba(0,0,0,0.03)' }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={nextPage}
                                    className="p-6 text-[#a8a29e] hover:text-[#3d2b1f] transition-all rounded-full"
                                >
                                    <ChevronRight size={32} />
                                </motion.button>
                            </footer>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style dangerouslySetInnerHTML={{
                __html: `
                    .transform-style-3d { transform-style: preserve-3d; }
                    .rotate-y-\\[90deg\\] { transform: rotateY(90deg); }
                    .rotate-y-\\[-90deg\\] { transform: rotateY(-90deg); }
                    .rotate-x-\\[-90deg\\] { transform: rotateX(-90deg); }
                    @import url('https://fonts.googleapis.com/css2?family=Reenie+Beanie&family=Cinzel:wght@400;700;900&family=Outfit:wght@100;400;900&display=swap');
                    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(60,43,31,0.15); border-radius: 10px; }
                `
            }} />
        </div>
    );
};
