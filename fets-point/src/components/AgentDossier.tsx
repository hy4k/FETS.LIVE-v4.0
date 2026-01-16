import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';


interface AgentDossierProps {
    agent: any;
    onClose?: () => void;
    onStartChat: () => void;
    currentUserId: string;
    embedded?: boolean;
    userBranch?: string;
}

export const AgentDossier: React.FC<AgentDossierProps> = ({
    agent, onClose, onStartChat, currentUserId, embedded = false, userBranch
}) => {
    const [bio, setBio] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (agent?.user_id) {
            fetchAgentDetails();
        }
    }, [agent, currentUserId]);

    const fetchAgentDetails = async () => {
        try {
            // Fetch Bio
            const { data: profileData } = await supabase
                .from('staff_profiles')
                .select('bio')
                .eq('user_id', agent.user_id)
                .single();

            if (profileData) {
                setBio(profileData.bio || 'Data Classified. No public records found.');
            }

        } catch (error) {
            console.error('Error fetching details:', error);
        } finally {
            setLoading(false);
        }
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
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                            {agent.branch_assigned || 'Global'}
                        </span>
                    </div>
                </div>
            </div>



            {/* --- CONTENT --- */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 relative">
                <motion.div
                    key="profile"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-6"
                >
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
            </div>
        </div>
    );
};
