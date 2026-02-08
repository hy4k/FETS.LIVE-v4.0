import React, { useState, useEffect } from 'react';
import { 
  Heart, MessageCircle, Send, MoreHorizontal, 
  PlusCircle, Camera, Image as ImageIcon,
  Users, Bookmark, Share2, Search, Zap,
  Compass, User, Play, Grid, ChevronLeft, X, Edit2, Trash,
  Globe, Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { formatDistanceToNow, format } from 'date-fns';
import { toast } from 'react-hot-toast';

interface MobileMyDeskProps {
  setActiveTab: (tab: string) => void;
}

export function MobileMyDesk({ setActiveTab }: MobileMyDeskProps) {
  const { profile, user } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // New/Edit Post State
  const [showPostModal, setShowPostModal] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);
  const [postContent, setPostContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Staff Profile / Chat State
  const [selectedStaffProfile, setSelectedStaffProfile] = useState<any>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const fetchPosts = async () => {
    try {
      const { data: postData, error: postError } = await supabase
        .from('social_posts')
        .select(`
          *,
          author:staff_profiles!social_posts_author_id_fkey(id, full_name, avatar_url, role, bio, department, branch_assigned, created_at)
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (postError) throw postError;
      setPosts(postData || []);
    } catch (err) {
      console.error('Error fetching posts:', err);
    }
  };

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        await fetchPosts();

        // Fetch real staff for stories
        const { data: staffData, error: staffError } = await supabase
          .from('staff_profiles')
          .select('*')
          .neq('id', profile?.id)
          .limit(15);
        
        if (staffError) throw staffError;
        setStories(staffData || []);

      } catch (err) {
        console.error('Error fetching My Desk data:', err);
      } finally {
        setLoading(false);
      }
    }

    if (profile?.id) fetchData();
  }, [profile?.id]);

  const handleCreateOrUpdatePost = async () => {
    if (!postContent.trim() || !profile?.id) return;
    setIsSubmitting(true);
    try {
      if (editingPost) {
        const { error } = await supabase
          .from('social_posts')
          .update({ content: postContent })
          .eq('id', editingPost.id);
        if (error) throw error;
        toast.success('Sync Successful');
      } else {
        const { error } = await supabase
          .from('social_posts')
          .insert({
            content: postContent,
            author_id: profile.id,
            likes_count: 0,
            comments_count: 0
          });
        if (error) throw error;
        toast.success('Broadcast Live');
      }
      
      setPostContent('');
      setEditingPost(null);
      setShowPostModal(false);
      fetchPosts();
    } catch (err) {
      toast.error('Sync Failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (post: any) => {
    setEditingPost(post);
    setPostContent(post.content);
    setShowPostModal(true);
  };

  const handleLike = async (postId: string) => {
    try {
      const post = posts.find(p => p.id === postId);
      const { error } = await supabase
        .from('social_posts')
        .update({ likes_count: (post.likes_count || 0) + 1 })
        .eq('id', postId);
      
      if (error) throw error;
      fetchPosts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (postId: string) => {
    if (!window.confirm('Erase this data from the grid?')) return;
    try {
      const { error } = await supabase
        .from('social_posts')
        .delete()
        .eq('id', postId);
      
      if (error) throw error;
      toast.success('Purged');
      fetchPosts();
    } catch (err) {
      toast.error('Purge Failed');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC] pb-32">
      
      {/* SOCIAL HEADER (INSTAGRAM STYLE) */}
      <div className="px-6 pt-12 pb-6 bg-white border-b border-slate-100 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-4">
           <button 
             onClick={() => setActiveTab('command-center')}
             className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-900 active:scale-90 transition-transform"
           >
              <ChevronLeft size={24} />
           </button>
           <div className="flex flex-col">
              <span className="text-xl font-black italic tracking-tighter text-slate-900 uppercase leading-none">MY DESK</span>
              <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.4em] mt-1">Live Grid</span>
           </div>
        </div>
        <div className="flex items-center gap-4">
           <button 
             onClick={() => { setEditingPost(null); setPostContent(''); setShowPostModal(true); }}
             className="w-12 h-12 rounded-2xl bg-[#3E2723] text-amber-500 flex items-center justify-center shadow-lg active:scale-90 transition-transform"
           >
              <PlusCircle size={24} />
           </button>
        </div>
      </div>

      {/* STORIES BAR (Real Staff Data) */}
      <div className="bg-white px-6 py-8 border-b border-slate-50 flex gap-5 overflow-x-auto no-scrollbar">
         <div className="flex flex-col items-center gap-2 flex-none">
            <div className="w-16 h-16 rounded-[22px] p-0.5 bg-slate-100 flex items-center justify-center relative shadow-inner overflow-hidden border border-slate-100">
               <img src={profile?.avatar_url || 'https://i.pravatar.cc/100'} className="w-full h-full object-cover rounded-[18px]" alt="Me" />
               <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <PlusCircle size={20} className="text-white" />
               </div>
            </div>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">YOU</span>
         </div>
         {stories.map(staff => (
           <button 
             key={staff.id} 
             onClick={() => setSelectedStaffProfile(staff)}
             className="flex flex-col items-center gap-2 flex-none group"
           >
              <div className="w-16 h-16 rounded-[22px] p-1 bg-gradient-to-tr from-amber-400 to-pink-500 flex items-center justify-center shadow-lg group-active:scale-95 transition-transform">
                 <div className="w-full h-full rounded-[18px] border-[2px] border-white overflow-hidden bg-white">
                    <img src={staff.avatar_url || `https://ui-avatars.com/api/?name=${staff.full_name}&background=random`} className="w-full h-full object-cover" alt={staff.full_name} />
                 </div>
              </div>
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest max-w-[64px] truncate">
                {staff.full_name.split(' ')[0]}
              </span>
           </button>
         ))}
      </div>

      {/* FEED LIST (Real Database Data) */}
      <div className="flex flex-col p-4 space-y-4">
         {loading ? (
           [1, 2].map(i => <div key={i} className="h-96 bg-white rounded-[40px] animate-pulse shadow-sm" />)
         ) : posts.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-20 text-center px-10">
              <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center text-slate-300 mb-6">
                 <Grid size={40} />
              </div>
              <h3 className="font-black text-slate-900 uppercase tracking-tight mb-2">The Grid is Idle</h3>
              <p className="text-sm text-slate-400 font-bold leading-relaxed">Broadcast an operational update to the team.</p>
           </div>
         ) : posts.map((post, i) => (
           <motion.div 
             key={post.id || i}
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             className="bg-white rounded-[45px] shadow-[0_10px_30px_rgba(0,0,0,0.02)] border border-slate-100 overflow-hidden"
           >
              {/* Post Header */}
              <div className="flex items-center justify-between px-6 py-6">
                 <button 
                   onClick={() => setSelectedStaffProfile(post.author)}
                   className="flex items-center gap-3 active:scale-95 transition-transform"
                 >
                    <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-100">
                       <img src={post.author?.avatar_url || `https://ui-avatars.com/api/?name=${post.author?.full_name}&background=random`} className="w-full h-full object-cover" alt="Author" />
                    </div>
                    <div className="text-left">
                       <h3 className="text-xs font-black text-slate-900 tracking-widest uppercase leading-none">{post.author?.full_name}</h3>
                       <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                         {post.author?.role?.replace('_', ' ')} • {formatDistanceToNow(new Date(post.created_at))} ago
                       </p>
                    </div>
                 </button>
                 
                 {post.author_id === profile?.id && (
                   <div className="flex items-center gap-1">
                      <button onClick={() => handleEdit(post)} className="p-2 text-slate-300 hover:text-amber-500 transition-colors">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(post.id)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors">
                        <Trash size={16} />
                      </button>
                   </div>
                 )}
              </div>

              {/* Post Content Area */}
              <div className="px-4 pb-4">
                 <div className="bg-slate-50 rounded-[35px] overflow-hidden min-h-[300px] flex items-center justify-center p-10 text-center relative shadow-inner">
                    {post.image_url ? (
                       <img src={post.image_url} className="absolute inset-0 w-full h-full object-cover" alt="Post" />
                    ) : (
                      <>
                        <div className="absolute top-8 right-8 opacity-[0.05]">
                           <Zap size={120} className="text-slate-900" />
                        </div>
                        <p className="text-slate-800 text-lg font-black leading-relaxed max-w-[280px] z-10 italic uppercase tracking-tight">
                           "{post.content}"
                        </p>
                      </>
                    )}
                 </div>
              </div>

              {/* Interaction Bar */}
              <div className="px-8 py-5 flex items-center justify-between border-t border-slate-50">
                 <div className="flex items-center gap-10">
                    <button onClick={() => handleLike(post.id)} className="flex items-center gap-2 group active:scale-125 transition-transform">
                       <Heart size={26} className="text-slate-900 group-active:text-rose-500" />
                       <span className="text-[10px] font-black text-slate-900 uppercase tracking-tighter">{post.likes_count || 0}</span>
                    </button>
                    <button 
                      onClick={() => setSelectedStaffProfile(post.author)}
                      className="flex items-center gap-2 active:scale-110 transition-transform"
                    >
                       <MessageCircle size={26} className="text-slate-900" />
                       <span className="text-[10px] font-black text-slate-900 uppercase tracking-tighter">{post.comments_count || 0}</span>
                    </button>
                 </div>
                 <button className="active:scale-110 transition-transform">
                    <Bookmark size={26} className="text-slate-900" />
                 </button>
              </div>
           </motion.div>
         ))}
      </div>

      {/* FULL-SCREEN POST MODAL (App-like next page) */}
      <AnimatePresence>
        {showPostModal && (
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-[100] bg-white flex flex-col pt-safe"
          >
             <div className="px-6 pt-12 pb-8 flex items-center justify-between border-b border-slate-50">
                <button onClick={() => setShowPostModal(false)} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-900">
                   <ChevronLeft size={24} />
                </button>
                <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter">{editingPost ? 'Sync Update' : 'New Broadcast'}</h3>
                <div className="w-10" />
             </div>
             
             <div className="p-8 flex-1 flex flex-col gap-8">
                <div className="flex items-center gap-4">
                   <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-slate-50">
                      <img src={profile?.avatar_url || 'https://i.pravatar.cc/100'} className="w-full h-full object-cover" />
                   </div>
                   <div>
                      <p className="text-sm font-black text-slate-900 uppercase tracking-widest">{profile?.full_name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">{profile?.role?.replace('_', ' ')}</p>
                   </div>
                </div>

                <textarea 
                  value={postContent}
                  onChange={e => setPostContent(e.target.value)}
                  className="w-full flex-1 bg-slate-50 rounded-[40px] p-10 text-xl font-black text-slate-800 border-none outline-none resize-none shadow-inner placeholder:text-slate-200"
                  placeholder="WHAT'S THE STATUS?"
                  autoFocus
                />

                <button 
                  onClick={handleCreateOrUpdatePost}
                  disabled={isSubmitting || !postContent.trim()}
                  className={`w-full py-6 rounded-[30px] font-black uppercase tracking-[0.3em] shadow-2xl transition-all ${
                     isSubmitting || !postContent.trim() 
                     ? 'bg-slate-100 text-slate-300' 
                     : 'bg-[#F6C845] text-[#3E2723] active:scale-95'
                  }`}
                >
                   {isSubmitting ? 'ENCRYPTING...' : 'INITIALIZE BROADCAST'}
                </button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* STAFF PROFILE FULL-SCREEN */}
      <AnimatePresence>
        {selectedStaffProfile && (
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[110] bg-slate-900 flex flex-col pt-safe text-white overflow-y-auto no-scrollbar"
          >
             <div className="p-8 flex items-center justify-between sticky top-0 z-10 bg-slate-900/80 backdrop-blur-xl">
                <button onClick={() => setSelectedStaffProfile(null)} className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center active:bg-white/10 transition-colors">
                   <ChevronLeft size={24} />
                </button>
                <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white/40 italic">Personnel Dossier</span>
                <button onClick={() => setIsChatOpen(true)} className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-900 flex items-center justify-center active:scale-90 transition-transform shadow-lg shadow-amber-500/20">
                   <MessageCircle size={22} />
                </button>
             </div>

             <div className="px-8 pb-20 space-y-12">
                {/* ID Card */}
                <div className="flex flex-col items-center text-center gap-6">
                   <div className="relative w-40 h-40">
                      <div className="absolute inset-0 rounded-full border-2 border-dashed border-amber-500/30 animate-[spin_15s_linear_infinite]" />
                      <div className="w-full h-full rounded-full overflow-hidden border-8 border-white/5 shadow-2xl relative z-10">
                         <img src={selectedStaffProfile.avatar_url || `https://ui-avatars.com/api/?name=${selectedStaffProfile.full_name}&background=f59e0b&color=000`} className="w-full h-full object-cover" />
                      </div>
                      <div className="absolute bottom-2 right-2 w-8 h-8 bg-emerald-500 rounded-full border-4 border-slate-900 z-20" />
                   </div>
                   <div>
                      <h2 className="text-4xl font-black uppercase tracking-tighter italic">{selectedStaffProfile.full_name}</h2>
                      <div className="mt-3 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 inline-block">
                         <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">{selectedStaffProfile.role?.replace('_', ' ')}</span>
                      </div>
                   </div>
                </div>

                {/* Dossier Details */}
                <div className="grid grid-cols-1 gap-4">
                   {[
                      { label: 'Unit/Branch', value: selectedStaffProfile.branch_assigned || 'GlobalHQ', icon: Globe },
                      { label: 'Department', value: selectedStaffProfile.department || 'Operations', icon: Grid },
                      { label: 'Induction', value: selectedStaffProfile.created_at ? format(new Date(selectedStaffProfile.created_at), 'MMMM yyyy') : 'N/A', icon: Zap },
                   ].map(item => (
                      <div key={item.label} className="p-6 rounded-[35px] bg-white/5 border border-white/5 flex items-center gap-5">
                         <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-amber-500">
                            <item.icon size={20} />
                         </div>
                         <div className="text-left">
                            <p className="text-[9px] font-black text-white/30 uppercase tracking-widest leading-none mb-1.5">{item.label}</p>
                            <p className="text-lg font-bold text-white leading-none tracking-tight">{item.value}</p>
                         </div>
                      </div>
                   ))}
                </div>

                {/* Bio Area */}
                <div className="p-8 rounded-[45px] bg-gradient-to-br from-white/10 to-transparent border border-white/10 relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-8 opacity-5">
                      <User size={80} />
                   </div>
                   <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                      <Zap size={10} fill="currentColor" /> Field Bio
                   </h3>
                   <p className="text-lg font-medium text-white/80 leading-relaxed italic">
                      "{selectedStaffProfile.bio || 'Personnel has not established a custom bio yet. Grid records remain at default clearance.'}"
                   </p>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CHAT WINDOW (App-like next page) */}
      <AnimatePresence>
        {isChatOpen && selectedStaffProfile && (
           <motion.div 
             initial={{ y: '100%' }}
             animate={{ y: 0 }}
             exit={{ y: '100%' }}
             transition={{ type: 'spring', damping: 25, stiffness: 200 }}
             className="fixed inset-0 z-[120] bg-white flex flex-col pt-safe"
           >
              {/* Chat Header */}
              <div className="px-6 pt-12 pb-6 border-b border-slate-50 flex items-center justify-between sticky top-0 bg-white z-10">
                 <div className="flex items-center gap-4">
                    <button onClick={() => setIsChatOpen(false)} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center active:scale-90 transition-transform">
                       <ChevronLeft size={24} />
                    </button>
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm">
                          <img src={selectedStaffProfile.avatar_url || `https://ui-avatars.com/api/?name=${selectedStaffProfile.full_name}&background=random`} className="w-full h-full object-cover" />
                       </div>
                       <div className="text-left">
                          <h3 className="text-sm font-black text-slate-900 uppercase tracking-tighter leading-none mb-1">{selectedStaffProfile.full_name.split(' ')[0]}</h3>
                          <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">SECURE LINK ACTIVE</span>
                       </div>
                    </div>
                 </div>
                 <button className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                    <MoreHorizontal size={20} />
                 </button>
              </div>

              {/* Chat Body (Placeholder for real messages) */}
              <div className="flex-1 bg-slate-50 p-6 flex flex-col items-center justify-center text-center gap-6 overflow-y-auto no-scrollbar">
                 <div className="w-24 h-24 rounded-full bg-white shadow-xl flex items-center justify-center text-slate-100 border-4 border-slate-50">
                    <Lock size={40} />
                 </div>
                 <div>
                    <h4 className="font-black text-slate-900 uppercase tracking-tight text-xl mb-2 italic">End-to-End Encrypted</h4>
                    <p className="text-sm text-slate-400 font-medium leading-relaxed max-w-[240px]">This channel is secured with FETS RSA-2048 protocol.</p>
                 </div>
                 <div className="w-full mt-10">
                    <div className="flex justify-end mb-4">
                       <div className="bg-[#3E2723] text-amber-500 p-5 rounded-[28px] rounded-tr-none text-sm font-bold shadow-lg max-w-[80%]">
                          Hey {selectedStaffProfile.full_name.split(' ')[0]}, can you confirm the status for the morning shift?
                       </div>
                    </div>
                    <div className="flex justify-start">
                       <div className="bg-white text-slate-800 p-5 rounded-[28px] rounded-tl-none text-sm font-bold shadow-sm border border-slate-100 max-w-[80%]">
                          All clear here. Just verified the lab systems.
                       </div>
                    </div>
                 </div>
              </div>

              {/* Chat Input */}
              <div className="p-6 bg-white border-t border-slate-50 flex items-center gap-4 pb-12">
                 <button className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
                    <PlusCircle size={22} />
                 </button>
                 <div className="flex-1 relative">
                    <input 
                       placeholder="Enter message..."
                       className="w-full bg-slate-50 border-none rounded-[25px] py-4 px-6 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                 </div>
                 <button className="w-12 h-12 rounded-2xl bg-[#3E2723] text-amber-500 flex items-center justify-center active:scale-90 transition-transform">
                    <Send size={20} />
                 </button>
              </div>
           </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
