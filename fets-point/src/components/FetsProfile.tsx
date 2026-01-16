import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    User, Mail, Phone, MapPin, Briefcase, Calendar,
    Award, Shield, Hash, Globe, Star, Activity, Edit3, Save, Zap
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

export const FetsProfile = () => {
    const { user, profile } = useAuth();
    const [stats, setStats] = useState({
        loginCount: 0,
        daysActive: 0,
        tasksCompleted: 0
    });

    // Bio Editing State
    const [bio, setBio] = useState('');
    const [isEditingBio, setIsEditingBio] = useState(false);
    const [loadingBio, setLoadingBio] = useState(true);


    useEffect(() => {
        if (profile?.created_at) {
            const created = new Date(profile.created_at);
            const now = new Date();
            const diffTime = Math.abs(now.getTime() - created.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            setStats(prev => ({ ...prev, daysActive: diffDays }));
        }

        // Mock stats for visual richness (in real app, fetch from DB)
        setStats(prev => ({ ...prev, loginCount: 42, tasksCompleted: 128 }));
    }, [profile]);

    const handleSaveBio = async () => {
        if (!profile?.id) return;
        try {
            const { error } = await supabase.from('staff_profiles').update({ bio }).eq('id', profile.id);
            if (error) throw error;
            setIsEditingBio(false);
            toast.success('Dossier Updated');
        } catch (err) {
            toast.error('Update Failed');
        }
    }

    const InfoRow = ({ icon: Icon, label, value, isLink = false }: any) => (
        <div className="flex items-center gap-4 py-3 border-b border-white/5 last:border-0 group">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-amber-500/20 group-hover:text-amber-500 transition-colors">
                <Icon size={18} className="text-gray-400 group-hover:text-amber-500 transition-colors" />
            </div>
            <div className="flex-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-0.5">{label}</p>
                {isLink ? (
                    <a href={value} className="text-sm font-medium text-amber-400 hover:text-amber-300 transition-colors truncate block">{value}</a>
                ) : (
                    <p className="text-sm font-medium text-gray-200 truncate">{value || 'N/A'}</p>
                )}
            </div>
        </div>
    );

    return (
        <div className="h-full flex flex-col md:flex-row gap-6 p-6 overflow-y-auto custom-scrollbar">

            {/* LEFT COLUMN: ID CARD STYLE */}
            <div className="w-full md:w-1/3 flex flex-col gap-6">
                <div className="relative overflow-hidden rounded-3xl bg-white/[0.03] border border-white/10 shadow-2xl p-8 flex flex-col items-center text-center">
                    {/* Background Glint */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-[80px] rounded-full pointer-events-none" />

                    <div className="relative w-32 h-32 mb-6 group cursor-pointer">
                        <div className="absolute inset-0 rounded-full border-2 border-dashed border-amber-500/30 animate-[spin_10s_linear_infinite]" />
                        <div className="w-full h-full rounded-full overflow-hidden border-4 border-black/50 shadow-2xl relative z-10">
                            <img
                                src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${profile?.full_name}&background=f59e0b&color=000`}
                                alt="Profile"
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                        </div>
                        <div className="absolute bottom-1 right-1 w-6 h-6 bg-emerald-500 rounded-full border-4 border-[#09090b] z-20" />
                    </div>

                    <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-1">{profile?.full_name}</h2>
                    <p className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-6 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                        {profile?.role?.replace('_', ' ') || 'Staff Member'}
                    </p>


                </div>

                {/* BIO CARD */}
                <div className="flex-1 p-6 rounded-3xl bg-white/[0.03] border border-white/10 flex flex-col relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                            <Hash size={10} /> Personal Bio
                        </h3>
                        <button
                            onClick={() => {
                                if (isEditingBio) handleSaveBio();
                                else setIsEditingBio(true);
                            }}
                            className="p-2 hover:bg-white/10 rounded-lg text-amber-500 transition-colors"
                        >
                            {isEditingBio ? <Save size={16} /> : <Edit3 size={16} />}
                        </button>
                    </div>

                    {isEditingBio ? (
                        <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            className="w-full h-full bg-black/20 border border-white/10 rounded-xl p-3 text-sm text-white resize-none outline-none focus:border-amber-500/50"
                            placeholder="Enter your public bio..."
                            autoFocus
                        />
                    ) : (
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            <p className="text-sm text-gray-300 italic leading-relaxed">
                                {bio || "No bio established. Click edit to add identity details."}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT COLUMN: DETAILED DOSSIER */}
            <div className="flex-1 flex flex-col gap-6">
                <div className="flex-1 rounded-3xl bg-white/[0.03] border border-white/10 shadow-2xl p-8 relative overflow-hidden">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                            <Activity className="text-amber-500" size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-white uppercase tracking-tight">Construct Dossier</h3>
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Personnel Data File • Classified</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-12 gap-y-2">
                        <InfoRow icon={User} label="Full Name" value={profile?.full_name} />
                        <InfoRow icon={Hash} label="Staff ID" value={profile?.id?.substring(0, 8).toUpperCase()} />
                        <InfoRow icon={Mail} label="Contact Email" value={user?.email} isLink />
                        <InfoRow icon={Phone} label="Secure Line" value={profile?.phone || 'Not Registered'} />
                        <InfoRow icon={MapPin} label="Base of Operations" value={profile?.branch_assigned || 'Global HQ'} />
                        <InfoRow icon={Calendar} label="Induction Date" value={profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Unknown'} />
                    </div>

                    <div className="mt-8 pt-8 border-t border-white/5">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-6 flex items-center gap-2">
                            <Shield size={12} /> Security Clearance & Certificates
                        </h4>
                        <div className="flex flex-wrap gap-3">
                            {['Bio-Auth Verified', 'Encrypted Comms', 'Vault Access', 'Roster Mgmt', 'Fleet Command'].map((cert, i) => (
                                <div key={i} className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 hover:bg-emerald-500/20 cursor-default transition-colors">
                                    <CheckMark /> {cert}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const CheckMark = () => (
    <svg width="10" height="8" viewBox="0 0 12 10" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M1 5L4.5 8.5L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);
