import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, MapPin, Calendar, Shield, Award,
    MessageSquare, Zap, Activity, CheckCircle2, AlertCircle,
    Menu, ArrowLeft, Plus, X, Heart, Star, Lock, Eye, Key,
    Lightbulb, Coins, Trophy, Briefcase, Phone, Globe, HelpCircle,
    Share2, Bookmark, Flame, Target, Send, Camera, Info, Trash2, Edit3, MoreVertical,
    Image as ImageIcon, Grid, Video, Smile
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useBranch } from '../hooks/useBranch';
import { useSocialPosts, useCreatePost, useToggleLike, useAddComment, useUpdatePost, useDeletePost, useUploadImage } from '../hooks/useSocial';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { supabase } from '../lib/supabase';
import { StaffStories } from './StaffStories';

// --- Types ---

type PulseType = 'Appreciation' | 'Idea' | 'Fun' | 'General';

interface PulsePost {
    id: string;
    author_id: string;
    user_id?: string;
    content: string;
    post_type: PulseType;
    image_url?: string;
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
        case 'Fun': return {
            bg: 'bg-pink-50',
            border: 'border-pink-200',
            accent: 'bg-pink-500',
            text: 'text-pink-900',
            shadow: 'shadow-pink-100',
            icon: Smile,
            color: '#EC4899'
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
        case 'General':
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
    const [type, setType] = useState<PulseType>('General');
    const [image, setImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const createPost = useCreatePost();
    const uploadImage = useUploadImage();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImage(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() && !image) return;

        setUploading(true);
        try {
            let finalImageUrl = null;

            if (image) {
                finalImageUrl = await uploadImage.mutateAsync(image);
            }

            await createPost.mutateAsync({
                content: content.trim(),
                user_id: profile?.user_id,
                post_type: type,
                branch_location: activeBranch || 'global',
                image_url: finalImageUrl || undefined
            });

            onSuccess();
            onClose();
        } catch (err: any) {
            // Error handled by hook
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 40 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100"
            >
                <div className="bg-white p-4 border-b border-slate-100 flex justify-between items-center">
                    <span className="font-bold text-slate-800">Create new post</span>
                    <button onClick={onClose} className="text-blue-500 font-bold text-sm">Cancel</button>
                    {/* Just for layout balance */}
                </div>

                <form onSubmit={handleSubmit} className="p-0">
                    <div className="p-4 flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden shrink-0">
                            <img src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${profile?.full_name}`} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1">
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Write a caption..."
                                className="w-full h-24 resize-none outline-none text-slate-800 placeholder:text-slate-400 text-sm"
                            />
                            {previewUrl && (
                                <div className="relative mt-2 rounded-xl overflow-hidden">
                                    <img src={previewUrl} className="w-full max-h-60 object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => { setImage(null); setPreviewUrl(null); }}
                                        className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="px-4 pb-4">
                        <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
                            {(['General', 'Appreciation', 'Idea', 'Fun'] as PulseType[]).map((t) => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => setType(t)}
                                    className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${type === t ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'}`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="p-4 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                                <ImageIcon size={20} />
                            </button>
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                            <button type="button" className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                                <Video size={20} />
                            </button>
                        </div>
                        <button
                            type="submit"
                            disabled={uploading || (!content && !image)}
                            className="text-blue-500 font-bold text-sm disabled:opacity-50"
                        >
                            {uploading ? 'Sharing...' : 'Share'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

const PostDetailModal = ({ post, onClose, profile }: { post: PulsePost, onClose: () => void, profile: any }) => {
    const theme = getPulseTheme(post.post_type);
    const toggleLike = useToggleLike();
    const addComment = useAddComment();
    const [comment, setComment] = useState('');
    const isLiked = post.likes?.some(l => l.user_id === profile?.user_id);

    // Sort comments: oldest first
    const comments = [...(post.comments || [])].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    const handleComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!comment.trim()) return;
        try {
            await addComment.mutateAsync({ post_id: post.id, user_id: profile?.user_id, content: comment.trim() });
            setComment('');
        } catch (e) { }
    }

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-4xl bg-white rounded-r-3xl rounded-l-3xl overflow-hidden flex flex-col md:flex-row max-h-[80vh]"
            >
                {/* Left/Top: Content */}
                <div className={`flex-1 bg-black flex items-center justify-center relative ${post.image_url ? '' : theme.bg}`}>
                    {post.image_url ? (
                        <img src={post.image_url} className="w-full h-full object-contain max-h-[50vh] md:max-h-full" />
                    ) : (
                        <div className={`p-10 text-center ${theme.text}`}>
                            <h3 className="text-2xl font-bold font-[Outfit]">{post.content}</h3>
                        </div>
                    )}
                </div>

                {/* Right/Bottom: Sidebar */}
                <div className="w-full md:w-[400px] flex flex-col bg-white border-l border-slate-100">
                    {/* Header */}
                    <div className="p-4 border-b border-slate-100 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden">
                            <img src={post.user?.avatar_url || `https://ui-avatars.com/api/?name=${post.user?.full_name}`} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1">
                            <span className="text-sm font-bold text-slate-900">{post.user?.full_name || 'Anonymous'}</span>
                            <span className="text-xs text-slate-500 block">{post.branch_location}</span>
                        </div>
                        <button onClick={onClose}><X size={20} className="text-slate-400" /></button>
                    </div>

                    {/* Comments List */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {/* Caption */}
                        {post.image_url && post.content && (
                            <div className="flex gap-3 mb-6">
                                <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden shrink-0">
                                    <img src={post.user?.avatar_url || `https://ui-avatars.com/api/?name=${post.user?.full_name}`} className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <div className="text-sm">
                                        <span className="font-bold mr-2">{post.user?.full_name}</span>
                                        {post.content}
                                    </div>
                                    <span className="text-xs text-slate-400 mt-1 block">{format(new Date(post.created_at), 'd MMM, yyyy')}</span>
                                </div>
                            </div>
                        )}

                        {comments.map((c: any) => (
                            <div key={c.id} className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden shrink-0">
                                    <img src={c.user?.avatar_url || `https://ui-avatars.com/api/?name=${c.user?.full_name}`} className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <div className="text-sm">
                                        <span className="font-bold mr-2">{c.user?.full_name}</span>
                                        {c.content}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="p-4 border-t border-slate-100">
                        <div className="flex items-center gap-4 mb-3">
                            <button onClick={() => toggleLike.mutate({ post_id: post.id, user_id: profile?.user_id, isLiked: !!isLiked })}>
                                <Heart size={24} className={isLiked ? "text-red-500 fill-current" : "text-slate-800"} />
                            </button>
                            <button><MessageSquare size={24} className="text-slate-800" /></button>
                            <button><Send size={24} className="text-slate-800" /></button>
                            <div className="flex-1" />
                            <button><Bookmark size={24} className="text-slate-800" /></button>
                        </div>
                        <div className="font-bold text-sm mb-1">{post._count?.likes || 0} likes</div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-wide mb-3">{format(new Date(post.created_at), 'MMMM d, yyyy').toUpperCase()}</div>

                        {/* Comment Input */}
                        <form onSubmit={handleComment} className="flex gap-2">
                            <input
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Add a comment..."
                                className="flex-1 outline-none text-sm text-slate-800"
                            />
                            <button type="submit" disabled={!comment.trim()} className="text-blue-500 font-bold text-sm disabled:opacity-50">Post</button>
                        </form>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}

const PulseGridItem = ({ post, onClick, theme }: { post: PulsePost, onClick: () => void, theme: any }) => {
    return (
        <motion.div
            layout
            onClick={onClick}
            className={`aspect-square relative group cursor-pointer overflow-hidden bg-slate-100 ${post.image_url ? '' : theme.bg}`}
        >
            {post.image_url ? (
                <img src={post.image_url} className="w-full h-full object-cover" />
            ) : (
                <div className={`w-full h-full flex items-center justify-center p-4 text-center ${theme.text}`}>
                    <span className="font-[Outfit] font-bold text-sm line-clamp-4">{post.content}</span>
                </div>
            )}

            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center gap-6 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-2 text-white font-bold">
                    <Heart size={20} fill="white" />
                    <span>{post._count?.likes || 0}</span>
                </div>
                <div className="flex items-center gap-2 text-white font-bold">
                    <MessageSquare size={20} fill="white" />
                    <span>{post._count?.comments || 0}</span>
                </div>
            </div>

            {/* Type Indicator (Small) */}
            <div className="absolute top-2 right-2 text-white drop-shadow-md">
                {post.image_url && <ImageIcon size={16} />}
            </div>
        </motion.div>
    )
}

// --- Components ---

const IdentitySection = ({ profile, activeBranch }: { profile: any, activeBranch: string }) => {
    const uploadImage = useUploadImage();
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0]) return;
        const file = e.target.files[0];

        setUploading(true);
        try {
            // 1. Upload Image
            const publicUrl = await uploadImage.mutateAsync(file);

            // 2. Update Auth User
            const { error: authError } = await supabase.auth.updateUser({
                data: { avatar_url: publicUrl }
            });
            if (authError) throw authError;

            // 3. Update Public Profile (if separate table exists, otherwise Auth update might trigger trigger)
            // Assuming Auth metadata is source of truth or there's a sync. 
            // If using 'staff_profiles' table, we might need to update that too.
            // But let's stick to Auth update as it often drives the UI.

            // Optimistic update or reload window? 
            // For now, let's just toast and rely on real-time or refresh.
            // Actually, usually we need to update the 'staff_profiles' table too if that's where the avatar comes from.
            // The profile prop comes from useAuth which merges metadata.

            // Let's try updating the staff_profiles table too to be safe.
            const { error: dbError } = await supabase
                .from('staff_profiles')
                .update({ avatar_url: publicUrl })
                .eq('id', profile.id || profile.user_id);

            if (dbError) console.warn("DB Profile update failed", dbError);

            toast.success('Profile picture updated!');
            // Force reload to reflect changes if state doesn't auto-update
            window.location.reload();

        } catch (error: any) {
            toast.error('Failed to update photo: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-16 max-w-4xl mx-auto mb-12 px-4"
        >
            {/* Avatar */}
            <div className="relative shrink-0 group">
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full p-[3px] bg-gradient-to-tr from-rose-400 via-amber-400 to-purple-500">
                    <div className="w-full h-full rounded-full border-4 border-white overflow-hidden bg-slate-50 relative">
                        <img src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${profile?.full_name}`} className="w-full h-full object-cover" />

                        {/* Upload Overlay */}
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        >
                            <Camera className="text-white" size={24} />
                        </div>
                    </div>
                </div>
                {uploading && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-full h-full rounded-full border-4 border-slate-200 border-t-amber-500 animate-spin absolute" />
                    </div>
                )}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleAvatarUpload}
                    accept="image/*"
                    className="hidden"
                />
            </div>

            {/* Info & Stats */}
            <div className="flex flex-col items-center md:items-start flex-1 w-full">
                <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
                    <h2 className="text-2xl font-normal text-slate-800">{profile?.full_name || 'Fetsian'}</h2>
                    <div className="flex gap-2">
                        <button className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-bold text-slate-700 transition-colors">Edit Profile</button>
                        <button className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-bold text-slate-700 transition-colors">View Archive</button>
                        <button className="p-1.5 text-slate-700"><Lock size={20} /></button>
                    </div>
                </div>

                <div className="flex items-center justify-center md:justify-start gap-8 md:gap-12 mb-5 w-full text-slate-800">
                    <div className="text-center md:text-left"><span className="font-bold block md:inline">124</span> posts</div>
                    <div className="text-center md:text-left"><span className="font-bold block md:inline">452</span> followers</div>
                    <div className="text-center md:text-left"><span className="font-bold block md:inline">318</span> following</div>
                </div>

                <div className="text-sm text-slate-700 text-center md:text-left space-y-1">
                    <p className="font-bold">{profile?.role || 'Fetsian'} @ {activeBranch}</p>
                    <p>✨ Creating impact at FETS.LIVE</p>
                    <p>📍 {activeBranch}</p>
                </div>
            </div>
        </motion.div>
    )
}

// --- Wall Section ---
const WallSection = ({ profile }: { profile: any }) => {
    const certs = useMemo(() => {
        const c = profile?.certificates || [];
        const old = profile?.certifications || [];
        return Array.isArray(c) ? [...c, ...old.map((o: any) => ({ title: o, issuedBy: 'Official' }))] : [];
    }, [profile]);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-6xl mx-auto px-4"
        >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Certificates logic... reusing existing simplified */}
                {certs.length > 0 ? certs.map((item: any, idx: number) => (
                    <div key={idx} className="bg-white p-8 border border-slate-100 shadow-xl text-center">
                        <Award size={40} className="mx-auto mb-4 text-amber-500" />
                        <h3 className="font-serif font-bold text-xl mb-2">{item.title}</h3>
                        <p className="text-xs font-bold text-slate-400 uppercase">{item.issuedBy}</p>
                    </div>
                )) : (
                    <div className="col-span-full py-20 text-center text-slate-400">
                        <div className="w-16 h-16 rounded-full border-2 border-slate-200 flex items-center justify-center mx-auto mb-4">
                            <Award size={24} />
                        </div>
                        <h3 className="font-bold">No Achievements Yet</h3>
                    </div>
                )}
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

    // Pulse Data
    const { data: posts, isLoading } = useSocialPosts();
    const [selectedPost, setSelectedPost] = useState<PulsePost | null>(null);

    return (
        <div className="min-h-screen bg-white relative overflow-x-hidden pt-6 pb-20 font-sans text-slate-900">

            {/* Back Button */}
            <div className="max-w-[975px] mx-auto px-4 pt-4">
                <button
                    onClick={() => onNavigate?.('command-center')}
                    className="flex items-center gap-2 text-slate-600 font-bold text-sm mb-4 hover:text-slate-900 transition-colors"
                >
                    <ArrowLeft size={18} />
                    Back to Command
                </button>
            </div>

            {/* MAIN INSTAGRAM CONTAINER */}
            <div className="max-w-[935px] mx-auto w-full">

                {/* Staff Stories */}
                <div className="mb-10 px-4 md:px-0">
                    <StaffStories />
                </div>

                {/* Profile Header */}
                <IdentitySection profile={profile} activeBranch={activeBranch || 'Global'} />

                {/* Tabs */}
                <div className="border-t border-slate-200 mb-1">
                    <div className="flex justify-center gap-12">
                        <button
                            onClick={() => setActiveSection('pulse')}
                            className={`flex items-center gap-2 py-4 text-xs font-bold uppercase tracking-widest border-t border-transparent transition-all ${activeSection === 'pulse' ? 'border-slate-800 text-slate-900' : 'text-slate-400'}`}
                        >
                            <Grid size={12} />
                            F-Wall
                        </button>
                        <button
                            onClick={() => setActiveSection('wall')}
                            className={`flex items-center gap-2 py-4 text-xs font-bold uppercase tracking-widest border-t border-transparent transition-all ${activeSection === 'wall' ? 'border-slate-800 text-slate-900' : 'text-slate-400'}`}
                        >
                            <Award size={12} />
                            F-Cert
                        </button>
                    </div>
                </div>

                {/* Content Grid */}
                <div className="w-full">
                    <AnimatePresence mode="wait">
                        {activeSection === 'pulse' && (
                            <motion.div
                                key="pulse"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                <div className="grid grid-cols-3 gap-1 md:gap-7">
                                    {isLoading ? (
                                        [1, 2, 3, 4, 5, 6].map(i => <div key={i} className="aspect-square bg-slate-100 animate-pulse" />)
                                    ) : posts?.map((post: any) => (
                                        <PulseGridItem
                                            key={post.id}
                                            post={post}
                                            theme={getPulseTheme(post.post_type)}
                                            onClick={() => setSelectedPost(post)}
                                        />
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {activeSection === 'wall' && (
                            <WallSection key="wall" profile={profile} />
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Create Post FAB */}
            {
                activeSection === 'pulse' && (
                    <button
                        onClick={() => setShowPostModal(true)}
                        className="fixed bottom-8 right-8 w-14 h-14 bg-gradient-to-tr from-amber-400 to-rose-500 text-white rounded-full shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-40"
                    >
                        <Plus size={28} />
                    </button>
                )
            }

            {/* Modals */}
            <AnimatePresence>
                {showPostModal && (
                    <CreatePostModal
                        onClose={() => setShowPostModal(false)}
                        onSuccess={() => { }}
                        profile={profile}
                        activeBranch={activeBranch || 'Global'}
                    />
                )}
                {selectedPost && (
                    <PostDetailModal
                        post={selectedPost}
                        onClose={() => setSelectedPost(null)}
                        profile={profile}
                    />
                )}
            </AnimatePresence>
        </div >
    );
}

export default MyDeskLivingBoard;
