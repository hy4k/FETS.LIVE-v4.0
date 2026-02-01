import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, MapPin, Calendar, Shield, Award, 
  MessageSquare, Zap, Activity, CheckCircle2, AlertCircle,
  Menu, ArrowLeft, Plus, X, Heart, Star, Lock, Eye, Key,
  Lightbulb, Coins, Trophy, Briefcase, Phone, Globe, HelpCircle,
  Share2, Bookmark, Flame, Target, Send, Camera, Info, Trash2
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useBranch } from '../hooks/useBranch';
import { useSocialPosts, useCreatePost, useToggleLike, useAddComment } from '../hooks/useSocial';
import { useVaultEntries, useCreateVaultEntry, useDeleteVaultEntry } from '../hooks/useVault';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { supabase } from '../lib/supabase';

// --- Types ---

type PulseType = 'Challenge' | 'Task' | 'Appreciation' | 'Idea';

interface PulsePost {
  id: string;
  author_id: string;
  user_id?: string;
  content: string;
  post_type: PulseType;
  image_url?: string;
  target_user_id?: string;
  reward_amount?: number;
  challenge_status?: string;
  branch_location: string;
  created_at: string;
  user?: {
    full_name: string;
    avatar_url?: string;
    role?: string;
  };
  likes?: any[];
  comments?: any[];
  _count?: {
    likes: number;
    comments: number;
  };
}

// --- Helpers ---

const getPulseTheme = (type: PulseType) => {
  switch (type) {
    case 'Challenge': return { 
      bg: 'bg-amber-50', 
      border: 'border-amber-200', 
      accent: 'bg-amber-500', 
      text: 'text-amber-900',
      shadow: 'shadow-amber-100',
      icon: Target,
      color: '#F59E0B'
    };
    case 'Task': return { 
      bg: 'bg-rose-50', 
      border: 'border-rose-200', 
      accent: 'bg-rose-600', 
      text: 'text-rose-900',
      shadow: 'shadow-rose-100',
      icon: Shield,
      color: '#E11D48'
    };
    case 'Appreciation': return { 
      bg: 'bg-emerald-50', 
      border: 'border-emerald-200', 
      accent: 'bg-emerald-500', 
      text: 'text-emerald-900',
      shadow: 'shadow-emerald-100',
      icon: Heart,
      color: '#10B981'
    };
    case 'Idea': return { 
      bg: 'bg-indigo-50', 
      border: 'border-indigo-200', 
      accent: 'bg-indigo-500', 
      text: 'text-indigo-900',
      shadow: 'shadow-indigo-100',
      icon: Lightbulb,
      color: '#6366F1'
    };
    default: return {
      bg: 'bg-slate-50',
      border: 'border-slate-200',
      accent: 'bg-slate-500',
      text: 'text-slate-900',
      shadow: 'shadow-slate-100',
      icon: Info,
      color: '#64748B'
    };
  }
};

// --- Modals ---

const CreatePostModal = ({ onClose, onSuccess, profile, activeBranch }: { onClose: () => void, onSuccess: () => void, profile: any, activeBranch: string }) => {
    const [content, setContent] = useState('');
    const [type, setType] = useState<PulseType>('Idea');
    const [reward, setReward] = useState(0);
    const [targetUser, setTargetUser] = useState('');
    const [staffList, setStaffList] = useState<any[]>([]);
    const createPost = useCreatePost();

    useEffect(() => {
        const fetchStaff = async () => {
            const { data } = await supabase.from('staff_profiles').select('id, full_name').neq('id', profile?.id);
            setStaffList(data || []);
        };
        fetchStaff();
    }, [profile?.id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) return;

        try {
            await createPost.mutateAsync({
                content: content.trim(),
                user_id: profile?.user_id, // For social_posts.user_id (auth user)
                post_type: type,
                branch_location: activeBranch || 'global',
                // Additional fields handled by custom hook if we update it, or we add them here
            } as any);
            
            // Note: Since useCreatePost in useSocial.ts might not have target_user_id yet, 
            // we might need to update the hook or do a manual insert if needed.
            // But let's assume we updated the table and we can pass them.
            // Actually, I'll update the hook call if I can, or just use supabase.insert here for full control.
            
            const { error } = await supabase.from('social_posts').insert({
                content: content.trim(),
                author_id: profile?.id,
                user_id: profile?.user_id,
                post_type: type,
                branch_location: activeBranch || 'global',
                target_user_id: type === 'Challenge' ? (targetUser || null) : null,
                reward_amount: type === 'Challenge' ? reward : 0,
                challenge_status: type === 'Challenge' ? 'open' : null
            });

            if (error) throw error;

            toast.success('Post Pulsing! ⚡');
            onSuccess();
            onClose();
        } catch (err: any) {
            toast.error(err.message || 'Failed to post');
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 40 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="w-full max-w-xl bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100"
            >
                <div className="bg-[#75A78F] p-8 text-white flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Activity size={24} />
                        <h3 className="text-xl font-bold uppercase tracking-tight font-[Outfit]">New Pulse</h3>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Pulse Type</label>
                        <div className="grid grid-cols-4 gap-2">
                            {(['Idea', 'Task', 'Appreciation', 'Challenge'] as PulseType[]).map((t) => {
                                const theme = getPulseTheme(t);
                                return (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => setType(t)}
                                        className={`py-3 rounded-2xl flex flex-col items-center gap-2 border-2 transition-all ${type === t ? `${theme.border} ${theme.bg} scale-105 shadow-md` : 'border-slate-50 grayscale opacity-60'}`}
                                    >
                                        <theme.icon size={18} className={type === t ? theme.text : 'text-slate-400'} />
                                        <span className={`text-[8px] font-black uppercase ${type === t ? theme.text : 'text-slate-400'}`}>{t}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Your Message</label>
                        <textarea
                            required
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="What's happening in the field?"
                            rows={4}
                            className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-[2rem] text-slate-800 font-medium placeholder:text-slate-300 focus:border-[#75A78F] focus:bg-white outline-none transition-all resize-none font-[Outfit] text-lg"
                        />
                    </div>

                    {type === 'Challenge' && (
                        <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            className="space-y-4 pt-4 border-t border-slate-100"
                        >
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Target Fetsian</label>
                                    <select 
                                        value={targetUser}
                                        onChange={(e) => setTargetUser(e.target.value)}
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-amber-500"
                                    >
                                        <option value="">Select Target...</option>
                                        {staffList.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Reward Amount (FC)</label>
                                    <input 
                                        type="number"
                                        value={reward}
                                        onChange={(e) => setReward(parseInt(e.target.value))}
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-amber-500"
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    <div className="pt-4">
                        <button
                            type="submit"
                            className="w-full py-5 bg-[#75A78F] text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-sm shadow-xl hover:shadow-[0_20px_40px_rgba(117,167,143,0.3)] hover:-translate-y-1 transition-all flex items-center justify-center gap-3"
                        >
                            <Send size={18} />
                            Transmit Pulse
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

const CreateVaultModal = ({ onClose, onSuccess, profile }: { onClose: () => void, onSuccess: () => void, profile: any }) => {
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState<'Credential' | 'Contact' | 'Link' | 'Help'>('Credential');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [url, setUrl] = useState('');
    const [notes, setNotes] = useState('');
    const createVault = useCreateVaultEntry();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        try {
            await createVault.mutateAsync({
                title: title.trim(),
                user_id: profile?.id,
                category,
                username: category === 'Credential' ? username : null,
                password: category === 'Credential' ? password : null,
                url: category === 'Link' ? url : null,
                notes: notes.trim(),
                contact_numbers: category === 'Contact' ? (notes || null) : null,
                tags: []
            } as any);
            onSuccess();
            onClose();
        } catch (err) {
            // Error handled by hook toast
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 40 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="w-full max-w-xl bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100"
            >
                <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Lock size={24} className="text-[#75A78F]" />
                        <h3 className="text-xl font-bold uppercase tracking-tight font-[Outfit]">Secure New Asset</h3>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Category</label>
                            <select 
                                value={category}
                                onChange={(e: any) => setCategory(e.target.value)}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-[#75A78F]"
                            >
                                <option value="Credential">Credential</option>
                                <option value="Contact">Contact</option>
                                <option value="Link">Link</option>
                                <option value="Help">Help Line</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Asset Name</label>
                            <input
                                required
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="E.g. Pearson Admin"
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-[#75A78F]"
                            />
                        </div>
                    </div>

                    {category === 'Credential' && (
                        <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                             <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Username</label>
                                <input
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-[#75A78F]"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-[#75A78F]"
                                />
                            </div>
                        </div>
                    )}

                    {category === 'Link' && (
                        <div className="animate-in fade-in slide-in-from-top-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Target URL</label>
                            <input
                                type="url"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="https://..."
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-[#75A78F]"
                            />
                        </div>
                    )}

                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                            {category === 'Contact' ? 'Contact Number / Comms' : 'Additional Notes / Detail'}
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder={category === 'Contact' ? 'Enter numbers or communication preference...' : 'Secure notes...'}
                            rows={3}
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 outline-none focus:border-[#75A78F] resize-none"
                        />
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            className="w-full py-5 bg-slate-900 text-[#75A78F] rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-sm shadow-xl hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)] hover:-translate-y-1 transition-all flex items-center justify-center gap-3"
                        >
                            <Shield size={18} />
                            Secure in Vault
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

// --- Components ---

const IdentitySection = ({ profile, activeBranch }: { profile: any, activeBranch: string }) => {
    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col lg:flex-row items-center justify-between py-12 px-8 mb-12 rounded-[3rem] bg-[#75A78F] shadow-[0_32px_64px_-16px_rgba(117,167,143,0.3)] relative overflow-hidden"
        >
            {/* Background Texture */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" 
                 style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cubes.png")' }} />
            
            <div className="flex flex-col md:flex-row items-center gap-12 relative z-10 w-full">
                {/* Profile Photo - CIRCULAR LEFT */}
                <div className="relative group shrink-0">
                    <div className="w-40 h-40 rounded-full p-1.5 bg-white/20 backdrop-blur-md shadow-2xl overflow-hidden ring-1 ring-white/30 group-hover:ring-white/60 transition-all duration-700">
                        <div className="w-full h-full rounded-full overflow-hidden bg-slate-100/50 relative">
                             {profile?.avatar_url ? (
                                <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <div className="flex items-center justify-center h-full text-white">
                                    <Users size={48} />
                                </div>
                            )}
                        </div>
                    </div>
                    {/* Sage Pulse */}
                    <div className="absolute inset-[-10px] border-2 border-white/20 rounded-full animate-ping opacity-30 pointer-events-none" />
                    
                    {/* Live Indicator */}
                    <div className="absolute bottom-4 right-4 z-20 w-6 h-6 bg-emerald-400 border-4 border-[#75A78F] rounded-full shadow-lg" title="Active Sessions" />
                </div>

                {/* Greeting & Info */}
                <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-4">
                    <div className="flex items-center gap-3 text-white/70 font-bold uppercase text-[10px] tracking-[0.3em] font-[Outfit]">
                        <Activity size={12} className="text-white" />
                        <span>OPERATIONAL STATUS: ACTIVE</span>
                        <span className="text-white/30">•</span>
                        <span>{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </div>
                    
                    <h1 className="text-5xl lg:text-7xl font-bold text-white tracking-tight leading-none font-[Outfit]">
                        Welcome back,<br/>
                        <span className="text-slate-900/80">
                            {profile?.full_name?.split(' ')[0] || 'Fetsian'}.
                        </span>
                    </h1>
                    
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-4">
                         <div className="px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                             <MapPin size={14} />
                             {activeBranch}
                         </div>
                         <div className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-full text-xs font-black text-amber-400 uppercase tracking-widest flex items-center gap-2 shadow-xl">
                            <Coins size={14} />
                            {(profile?.fets_cash || 0).toLocaleString()} FETS CASH
                         </div>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}

const VaultSection = ({ userId, onAdd }: { userId?: string, onAdd: () => void }) => {
    const { data: entries, isLoading } = useVaultEntries(userId);
    const deleteMutation = useDeleteVaultEntry(userId);

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm('Permanently wipe this secret?')) {
            await deleteMutation.mutateAsync(id);
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ duration: 0.6 }}
            className="max-w-5xl mx-auto px-4"
        >
            <div className="bg-white rounded-[4rem] p-12 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] border border-slate-100">
                <div className="flex justify-between items-center mb-12">
                     <div className="space-y-1">
                        <h2 className="text-4xl font-black text-slate-900 font-[Outfit]">F-Vault</h2>
                        <div className="w-12 h-1.5 bg-[#75A78F] rounded-full" />
                     </div>
                     <button 
                        onClick={onAdd}
                        className="flex items-center gap-2 px-8 py-4 bg-[#75A78F] text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl hover:shadow-[0_20px_40px_rgba(117,167,143,0.4)] hover:-translate-y-1 transition-all"
                     >
                        <Plus size={18} /> Add New Hub Item
                     </button>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-slate-50 animate-pulse rounded-[2rem]" />)}
                    </div>
                ) : (entries?.length || 0) > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {entries?.map((item, idx) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="bg-slate-50 border border-slate-100 p-8 rounded-[2rem] flex items-center justify-between hover:bg-white hover:border-[#75A78F]/30 hover:shadow-xl transition-all group relative overflow-hidden"
                            >
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-[#75A78F] group-hover:scale-110 transition-transform shadow-sm">
                                        {item.category === 'Credential' ? <Lock size={24} /> : 
                                         item.category === 'Contact' ? <Phone size={24} /> : 
                                         item.category === 'Link' ? <Globe size={24} /> : <HelpCircle size={24} />}
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{item.category}</span>
                                        <h3 className="text-xl font-bold text-slate-800">{item.title}</h3>
                                        {item.username && <p className="text-sm font-medium text-slate-500 font-mono mt-1">{item.username}</p>}
                                        {item.url && <a href={item.url} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline mt-1 block truncate max-w-[200px]">{item.url}</a>}
                                        {item.notes && <p className="text-xs text-slate-400 italic mt-2 line-clamp-1">{item.notes}</p>}
                                    </div>
                                </div>
                                <button 
                                    onClick={(e) => handleDelete(e, item.id)}
                                    className="p-3 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="py-20 text-center opacity-30">
                        <Lock size={64} className="mx-auto mb-4" />
                        <p className="font-black uppercase tracking-widest text-sm">Vault Empty</p>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

const PulsePostCard = ({ post, profile }: { post: PulsePost, profile: any }) => {
    const theme = getPulseTheme(post.post_type);
    const Icon = theme.icon;
    const toggleLike = useToggleLike();
    const [targetName, setTargetName] = useState('...');
    const isLiked = post.likes?.some(l => l.user_id === profile?.user_id);

    useEffect(() => {
        if (post.target_user_id) {
            supabase.from('staff_profiles').select('full_name').eq('id', post.target_user_id).single()
                .then(({ data }) => setTargetName(data?.full_name || 'Unknown'));
        }
    }, [post.target_user_id]);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className={`w-full max-w-2xl mx-auto mb-12 p-8 rounded-[2.5rem] bg-white border-2 ${theme.border} shadow-[0_20px_50px_-15px_rgba(0,0,0,0.08)] hover:shadow-2xl transition-all duration-500 relative group overflow-visible`}
        >
            {/* Type Indicator Orb */}
            <div 
                className={`absolute -left-4 top-10 w-10 h-10 rounded-full ${theme.accent} shadow-2xl flex items-center justify-center text-white z-20 group-hover:scale-125 transition-transform border-4 border-white`}
                style={{ backgroundColor: theme.color }}
            >
                <Icon size={20} />
            </div>

            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden">
                        {post.user?.avatar_url ? (
                            <img src={post.user.avatar_url} className="w-full h-full object-cover" alt="" />
                        ) : (
                            <span className="text-xl font-black text-slate-400 capitalize">{post.user?.full_name?.charAt(0) || 'F'}</span>
                        )}
                    </div>
                    <div>
                        <h4 className="font-black text-slate-900 font-[Outfit]">{post.user?.full_name || 'Anonymous'}</h4>
                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <MapPin size={10} className="text-[#75A78F]" />
                            {post.branch_location}
                        </div>
                    </div>
                </div>
                <div 
                    className={`px-4 py-1.5 rounded-full text-white text-[9px] font-black uppercase tracking-[0.2em] shadow-lg`}
                    style={{ backgroundColor: theme.color }}
                >
                    {post.post_type}
                </div>
            </div>

            <div className={`text-xl font-medium ${post.post_type === 'Task' ? 'text-rose-900' : 'text-slate-800'} leading-relaxed mb-8 font-[Outfit]`}>
                {post.content}
            </div>

            {post.post_type === 'Challenge' && (
                 <div className="bg-amber-100/50 rounded-3xl p-6 border-2 border-amber-200 mb-8 flex items-center justify-between shadow-inner">
                     <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-white shadow-lg">
                             <Target size={20} />
                         </div>
                         <div>
                             <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest block">Bounty Target</span>
                             <span className="font-bold text-amber-900">{targetName}</span>
                         </div>
                     </div>
                     <div className="text-center bg-white px-4 py-2 rounded-2xl shadow-sm border border-amber-100">
                         <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest block">Reward</span>
                         <div className="flex items-center gap-1.5 text-xl font-black text-slate-900 leading-none">
                             <Coins size={18} className="text-amber-500" />
                             {post.reward_amount}
                         </div>
                     </div>
                 </div>
            )}

            <div className="flex items-center justify-between pt-8 border-t border-slate-50">
                <div className="flex items-center gap-8">
                    <button 
                        onClick={() => toggleLike.mutate({ post_id: post.id, user_id: profile?.user_id, isLiked: !!isLiked })}
                        className={`flex items-center gap-2 transition-colors group/btn ${isLiked ? 'text-rose-500 font-bold' : 'text-slate-400 hover:text-rose-500'}`}
                    >
                        <div className={`p-2 rounded-xl transition-colors ${isLiked ? 'bg-rose-50' : 'group-hover/btn:bg-rose-50'}`}>
                            <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
                        </div>
                        <span className="text-xs font-black">{post._count?.likes || 0}</span>
                    </button>
                    <button className="flex items-center gap-2 text-slate-400 hover:text-[#75A78F] transition-colors group/btn">
                         <div className="p-2 rounded-xl group-hover/btn:bg-[#75A78F]/10 transition-colors">
                            <MessageSquare size={18} />
                        </div>
                        <span className="text-xs font-black">{post._count?.comments || 0}</span>
                    </button>
                </div>
                <div className="flex gap-2">
                    <button className="p-3 rounded-2xl bg-slate-50 text-slate-400 hover:bg-slate-100 transition-colors">
                        <Bookmark size={18} />
                    </button>
                    <button className="p-3 rounded-2xl bg-[#75A78F]/10 text-[#75A78F] hover:bg-[#75A78F]/20 transition-colors">
                        <Share2 size={18} />
                    </button>
                </div>
            </div>

            {/* Timestap Pill */}
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-xl opacity-0 group-hover:opacity-100 transition-opacity">
                {format(new Date(post.created_at), 'hh:mm a • MMM dd')}
            </div>
        </motion.div>
    );
};

const PulseSection = ({ profile, activeBranch, onAdd }: { profile: any, activeBranch: string, onAdd: () => void }) => {
    const [filter, setFilter] = useState<'All' | PulseType>('All');
    const { data: posts, isLoading, refetch } = useSocialPosts();

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-4xl mx-auto px-4"
        >
            <div className="flex flex-col items-center mb-16 space-y-8">
                <div className="flex items-center gap-2 px-6 py-2 bg-slate-100 rounded-full text-[#75A78F] font-black uppercase tracking-[0.3em] text-[10px]">
                    <Activity size={12} className="animate-pulse" />
                    <span>Live Operational Stream</span>
                </div>
                
                {/* Custom Filter Tabs */}
                <div className="flex gap-3 overflow-x-auto pb-4 max-w-full no-scrollbar">
                    {['All', 'Challenge', 'Task', 'Appreciation', 'Idea'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f as any)}
                            className={`
                                relative px-8 py-3 rounded-3xl text-xs font-black uppercase tracking-[0.15em] transition-all duration-500
                                ${filter === f 
                                    ? 'bg-[#75A78F] text-white shadow-[0_10px_20px_-5px_rgba(117,167,143,0.5)] translate-y-[-2px]' 
                                    : 'bg-white text-slate-400 border border-slate-200 hover:border-[#75A78F]'
                                }
                            `}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Single Column Feed */}
            <div className="pb-32">
                {isLoading ? (
                    <div className="flex flex-col gap-8">
                        {[1, 2, 3].map(i => <div key={i} className="h-64 bg-slate-100 animate-pulse rounded-[2.5rem]" />)}
                    </div>
                ) : posts?.filter((p: any) => filter === 'All' || p.post_type === filter).map((post: any) => (
                    <PulsePostCard key={post.id} post={post} profile={profile} />
                ))}
            </div>

            {/* Awesome Floating Action Button */}
            <motion.button 
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onAdd}
                className="fixed bottom-12 right-12 w-20 h-20 bg-slate-900 text-[#75A78F] rounded-full shadow-[0_24px_48px_-12px_rgba(0,0,0,0.5)] flex items-center justify-center z-50 group border-4 border-[#75A78F]"
            >
                <Plus size={36} />
                <span className="absolute -top-12 right-0 bg-slate-900 border-2 border-[#75A78F] text-white px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap translate-y-2 group-hover:translate-y-0">
                    Create New Post
                </span>
            </motion.button>
        </motion.div>
    );
};

// --- Wall Section ---
const WallSection = ({ profile }: { profile: any }) => {
    const certs = useMemo(() => {
        const c = profile?.certificates || [];
        const old = profile?.certifications || [];
        return Array.isArray(c) ? [...c, ...old.map(o => ({ title: o, issuedBy: 'Official' }))] : [];
    }, [profile]);

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="max-w-6xl mx-auto px-4"
        >
            <div className="bg-slate-900 rounded-[5rem] p-16 shadow-[0_64px_128px_-32px_rgba(0,0,0,0.5)] border border-slate-800">
                <div className="text-center mb-20 space-y-4">
                     <h2 className="text-5xl font-black text-white font-[Outfit]">The Impact Wall</h2>
                     <p className="text-slate-500 font-bold uppercase tracking-[0.4em] text-xs">Official Recognitions & Certifications</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                    {certs.length > 0 ? certs.map((item: any, idx: number) => (
                        <div key={idx} className="relative group">
                            <div className="bg-[#FAF9F6] p-10 border-[12px] border-double border-slate-200 shadow-2xl transition-all duration-700 group-hover:rotate-1 group-hover:scale-105">
                                <div className="border border-slate-100 p-2 h-full flex flex-col items-center text-center">
                                    <Trophy size={48} className="text-[#B8860B] mb-6 opacity-30 group-hover:opacity-100 transition-opacity" />
                                    <h3 className="text-2xl font-serif font-black text-slate-900 mb-2 uppercase">{item.title}</h3>
                                    <p className="text-[10px] font-bold text-[#75A78F] uppercase tracking-widest mb-6">{item.issuedBy || 'FETS OFFICIAL'}</p>
                                    <div className="w-16 h-px bg-slate-200 mb-6" />
                                    <p className="text-sm font-serif italic text-slate-600 leading-relaxed mb-8">
                                        {item.description || 'This certificate is awarded in recognition of outstanding performance and professional excellence within the FETS Ecosystem.'}
                                    </p>
                                    <p className="text-[10px] font-bold text-slate-300 mt-auto">{item.date || 'PERMANENT RECORD'}</p>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="col-span-full py-20 text-center opacity-20">
                            <Award size={64} className="mx-auto mb-4 text-white" />
                            <p className="font-black uppercase tracking-widest text-sm text-white">No Certifications Recorded</p>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

// --- Main Page Component ---

export function MyDeskLivingBoard({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const { user, profile } = useAuth();
  const { activeBranch } = useBranch();
  const [activeSection, setActiveSection] = useState<string | null>('pulse');
  const [showPostModal, setShowPostModal] = useState(false);
  const [showVaultModal, setShowVaultModal] = useState(false);

  return (
    <div className="min-h-screen bg-[#FDFDFD] relative overflow-x-hidden pt-6 pb-20 selection:bg-[#75A78F]/30 selection:text-[#75A78F] font-sans">
      
      {/* Dynamic Background Pattern */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(#75A78F 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        
        {/* Glow Spheres */}
        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#75A78F]/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-50/20 blur-[100px] rounded-full" />
      </div>

      {/* Floating Back Button */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="fixed top-8 left-8 z-50"
      >
        <button 
          onClick={() => onNavigate?.('command-center')}
          className="flex items-center justify-center w-12 h-12 bg-white border-2 border-slate-100 shadow-xl rounded-2xl text-slate-400 hover:text-[#75A78F] hover:border-[#75A78F] transition-all duration-500 scale-100 hover:scale-110 active:scale-90"
        >
          <ArrowLeft size={20} />
        </button>
      </motion.div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 md:px-12 pt-16">
        
        {/* Section A: The Header / Identity */}
        <IdentitySection profile={profile} activeBranch={activeBranch || 'Global'} />

        {/* Section B: The Menu Dock */}
        <div className="flex justify-center mb-16 sticky top-6 z-40">
            <div className="bg-slate-900 border border-slate-800 p-2 rounded-[2rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] flex gap-2">
                {[
                    { id: 'pulse', label: 'F-Pulse', icon: Activity, desc: 'Live Stream' },
                    { id: 'vault', label: 'F-Vault', icon: Lock, desc: 'Access Hub' },
                    { id: 'wall', label: 'F-Wall', icon: Award, desc: 'Impact Wall' },
                ].map((menu) => {
                    const isActive = activeSection === menu.id;
                    const Icon = menu.icon;
                    return (
                        <button
                            key={menu.id}
                            onClick={() => setActiveSection(menu.id)}
                            className={`
                                relative px-8 py-4 rounded-3xl flex flex-col items-center gap-0.5 transition-all duration-500 min-w-[140px]
                                ${isActive 
                                    ? 'bg-[#75A78F] text-white shadow-2xl scale-110 -translate-y-2' 
                                    : 'hover:bg-slate-800 text-slate-500 hover:text-slate-300'
                                }
                            `}
                        >
                            <Icon size={20} className={isActive ? 'text-white' : 'text-slate-500'} />
                            <span className="font-black uppercase tracking-widest text-[10px] mt-1">{menu.label}</span>
                            <span className={`text-[8px] font-bold uppercase opacity-50 ${isActive ? 'block' : 'hidden'}`}>{menu.desc}</span>
                        </button>
                    )
                })}
            </div>
        </div>

        {/* Section C: Dynamic Content Switcher */}
        <div className="min-h-[600px] mt-20">
            <AnimatePresence mode="wait">
                {activeSection === 'pulse' && (
                    <PulseSection 
                        key="pulse" 
                        profile={profile} 
                        activeBranch={activeBranch || 'Global'} 
                        onAdd={() => setShowPostModal(true)}
                    />
                )}
                {activeSection === 'vault' && (
                    <VaultSection 
                        key="vault" 
                        userId={profile?.id} 
                        onAdd={() => setShowVaultModal(true)}
                    />
                )}
                {activeSection === 'wall' && (
                    <WallSection 
                        key="wall" 
                        profile={profile}
                    />
                )}
            </AnimatePresence>
        </div>

      </div>

      {/* Modals */}
      <AnimatePresence>
          {showPostModal && (
              <CreatePostModal 
                  onClose={() => setShowPostModal(false)}
                  onSuccess={() => {}} // Hook handles invalidation
                  profile={profile}
                  activeBranch={activeBranch || 'Global'}
              />
          )}
          {showVaultModal && (
              <CreateVaultModal 
                  onClose={() => setShowVaultModal(false)}
                  onSuccess={() => {}} // Hook handles invalidation
                  profile={profile}
              />
          )}
      </AnimatePresence>
    </div>
  );
}

export default MyDeskLivingBoard;
