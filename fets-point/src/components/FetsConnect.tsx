import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Rss,
  MessageSquare,
  CheckSquare,
  Users,
  Paperclip,
  Smile,
  ThumbsUp,
  Pin,
  Plus,
  X,
  Award,
  Star,
  Edit,
  Trash2,
  MessageCircle,
  Zap,
  Globe,
  Trophy,
  Diamond,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import {
  usePosts,
  usePostMutations,
  useTasks,
  useOnlineStaff,
  useTaskMutations,
  useAllStaff,
  useKudos,
  useKudosMutations,
} from '../hooks/useFetsConnect';
import { formatDistanceToNow, format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';
import TaskBoard from './TaskBoard';
import Chat from './Chat/Chat';
import MyTasks from './MyTasks';
import Feed from './Feed';
import TaskModal from './TaskModal';
import { Leaderboards } from './Leaderboards';

interface FetsConnectProps {
  onNavigate?: (tab: string) => void;
}

const FetsConnect = ({ onNavigate }: FetsConnectProps = {}) => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: posts = [], isLoading: isLoadingPosts, error: postsError } = usePosts();
  const { data: kudos = [], isLoading: isLoadingKudos, error: kudosError } = useKudos();
  const { data: tasks = [], isLoading: isLoadingTasks, error: tasksError } = useTasks(profile?.id);
  const { data: allStaff = [] } = useAllStaff();
  const { data: onlineStaff = [], isLoading: isLoadingStaff } = useOnlineStaff();
  const { addPost } = usePostMutations();
  const { addTask, updateTask } = useTaskMutations(profile?.id);
  const { addKudos } = useKudosMutations();

  const [activeTab, setActiveTab] = useState('feed');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isKudosModalOpen, setIsKudosModalOpen] = useState(false);

  const openTaskModal = (task = null) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  const closeTaskModal = () => {
    setSelectedTask(null);
    setIsTaskModalOpen(false);
  };

  return (
    <div className="h-full w-full grid grid-cols-12 bg-slate-50 font-sans">
      <aside className="col-span-3 bg-white border-r border-slate-200 p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
            <Users className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">FETS Connect</h1>
        </div>

        <nav className="space-y-2">
          <button
            onClick={() => setActiveTab('feed')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'feed'
              ? 'bg-blue-100 text-blue-700 shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
              }`}
          >
            <Rss className="w-5 h-5" /> Feed
          </button>
          <button
            onClick={() => setActiveTab('kudos')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'kudos'
              ? 'bg-blue-100 text-blue-700 shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
              }`}
          >
            <Award className="w-5 h-5" /> Kudos Board
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'tasks'
              ? 'bg-blue-100 text-blue-700 shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
              }`}
          >
            <CheckSquare className="w-5 h-5" /> Task Board
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'chat'
              ? 'bg-blue-100 text-blue-700 shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
              }`}
          >
            <MessageCircle className="w-5 h-5" /> Chat
          </button>
          <button
            onClick={() => setActiveTab('connect')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'connect'
              ? 'bg-amber-100 text-amber-700 shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
              }`}
          >
            <Zap className="w-5 h-5" /> Connect Game
          </button>
        </nav>

        <div className="mt-6 space-y-3">
          {profile?.role === 'super_admin' && (
            <button
              onClick={() => openTaskModal()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-green-600 text-white hover:bg-green-700 transition-all shadow-md"
            >
              <Plus className="w-5 h-5" /> Assign Task
            </button>
          )}
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'leaderboard'
              ? 'bg-amber-100 text-amber-700 shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
              }`}
          >
            <Trophy className="w-5 h-5" /> Global Rankings
          </button>
          <button
            onClick={() => setIsKudosModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-amber-500 text-white hover:bg-amber-600 transition-all shadow-md"
          >
            <Star className="w-5 h-5" /> Give Kudos
          </button>
        </div>

        <MyTasks tasks={tasks} isLoading={isLoadingTasks} error={tasksError} openTaskModal={openTaskModal} />
      </aside>

      <main className="col-span-9 flex flex-col bg-slate-100 border-r border-slate-200">
        {activeTab === 'feed' && (
          <Feed posts={posts} isLoading={isLoadingPosts} error={postsError} profile={profile} />
        )}
        {activeTab === 'kudos' && (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>Kudos Board - Coming Soon</p>
          </div>
        )}
        {activeTab === 'tasks' && <TaskBoard />}
        {activeTab === 'chat' && <Chat />}
        {activeTab === 'connect' && <ConnectGameTab allStaff={allStaff} />}
        {activeTab === 'leaderboard' && <Leaderboards />}
      </main>

      <AnimatePresence>
        {isTaskModalOpen && profile && (
          <TaskModal
            isOpen={isTaskModalOpen}
            onClose={closeTaskModal}
            task={selectedTask}
            currentUserProfile={profile}
            staffList={allStaff}
          />
        )}
        {isKudosModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setIsKudosModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-lg p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold mb-4">Give Kudos</h2>
              <p className="text-gray-600 mb-4">Kudos feature coming soon!</p>
              <button
                onClick={() => setIsKudosModalOpen(false)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ConnectGameTab = ({ allStaff }: { allStaff: any[] }) => {
  const { profile } = useAuth();
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [gameStats, setGameStats] = useState<any>(null);
  const [connecting, setConnecting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [reward, setReward] = useState<any>(null);
  const timerRef = useRef<number | null>(null);

  const GRANDMASTER_IDS = [
    '0b732c8e-1dd7-4a3f-9b01-539da05db844', // Mithun
    '2a4090d5-3069-4eeb-a682-9ba64908f0f6'  // Niyas
  ];

  const fetchUserGameStats = async (userId: string) => {
    const { data } = await supabase
      .from('user_game_stats')
      .select('*')
      .eq('user_id', userId)
      .single();
    setGameStats(data);
  };

  useEffect(() => {
    if (selectedStaff) {
      setGameStats(null); // Clear immediately to prevent flicker
      fetchUserGameStats(selectedStaff.id);
    } else {
      setGameStats(null);
    }
  }, [selectedStaff]);

  const startConnecting = () => {
    if (!selectedStaff || connecting) return;
    setConnecting(true);
    setProgress(0);
    const duration = 3000; // 3 seconds
    const interval = 50;
    const step = (interval / duration) * 100;

    timerRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timerRef.current as any);
          handleConnectComplete();
          return 100;
        }
        return prev + step;
      });
    }, interval) as any;
  };

  const stopConnecting = () => {
    clearInterval(timerRef.current as any);
    if (!reward) {
      setConnecting(false);
      setProgress(0);
    }
  };

  const handleConnectComplete = async () => {
    try {
      const { data, error } = await supabase.rpc('process_fets_connection', {
        p_from_id: profile?.id,
        p_to_id: selectedStaff.id
      });

      if (error) throw error;

      if (data.success) {
        setReward(data);
        toast.success(`Connected! +${data.points_earned} FETS Cash`);
        // Refresh local stats if it was current user, but here it's about the other user or global state
      } else {
        toast.error(data.message);
        setConnecting(false);
        setProgress(0);
      }
    } catch (err: any) {
      toast.error(err.message || 'Connection failed');
      setConnecting(false);
      setProgress(0);
    }
  };

  return (
    <div className="h-full flex flex-col p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Networking Hub</h2>
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Social Strategy Game</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200 flex items-center gap-2">
            <Globe size={16} className="text-blue-500" />
            <span className="text-xs font-bold text-slate-700">CROSS-LOCATION ACTIVE</span>
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto custom-scrollbar pb-10">
        {allStaff.filter(s => s.id !== profile?.id).map(staff => {
          const isGM = GRANDMASTER_IDS.includes(staff.id);
          return (
            <motion.div
              key={staff.id}
              whileHover={{ y: -4 }}
              onClick={() => setSelectedStaff(staff)}
              className={`p-4 rounded-2xl border transition-all flex items-center gap-4 cursor-pointer relative overflow-hidden group shadow-sm hover:shadow-md ${isGM
                ? 'bg-slate-900 border-amber-500/50 shadow-amber-500/10'
                : 'bg-white border-slate-200'
                }`}
            >
              {isGM && (
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-purple-500/5 pointer-events-none" />
              )}
              <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 overflow-hidden ${isGM ? 'border-amber-500 bg-slate-800' : 'border-slate-200 bg-slate-100'}`}>
                {staff.avatar_url ? (
                  <img src={staff.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className={`text-lg font-bold ${isGM ? 'text-amber-500' : 'text-slate-400'}`}>{staff.full_name[0]}</span>
                )}
              </div>
              <div className="flex-1 min-w-0 z-10">
                <div className="flex items-center gap-1.5">
                  <h3 className={`font-bold truncate leading-none ${isGM ? 'text-white' : 'text-slate-800'}`}>{staff.full_name}</h3>
                  {isGM && <Diamond size={10} className="text-amber-500 fill-amber-500/20" />}
                </div>
                <p className={`text-[10px] font-bold uppercase tracking-tight truncate ${isGM ? 'text-amber-500' : 'text-slate-500'}`}>
                  {isGM ? 'GRANDMASTER ARCHITECT' : 'Staff Member'}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`w-2 h-2 rounded-full ${isGM ? 'bg-amber-500 animate-pulse shadow-[0_0_5px_rgba(245,158,11,0.5)]' : 'bg-emerald-500'}`} />
                  <span className={`text-[9px] font-black uppercase tracking-widest ${isGM ? 'text-amber-500/60' : 'text-slate-400'}`}>
                    {isGM ? 'ARCHITECT' : (staff.location || 'Global')}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {selectedStaff && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={() => !connecting && setSelectedStaff(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className={`w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl relative ${GRANDMASTER_IDS.includes(selectedStaff.id) ? 'bg-slate-950 border border-amber-500/30' : 'bg-white'}`}
              onClick={e => e.stopPropagation()}
            >
              <div className="absolute top-4 right-4 z-10">
                <button onClick={() => setSelectedStaff(null)} className={`p-2 rounded-full transition-colors ${GRANDMASTER_IDS.includes(selectedStaff.id) ? 'hover:bg-white/10 text-white/40' : 'hover:bg-slate-100 text-slate-400'}`}>
                  <X size={20} />
                </button>
              </div>

              {/* Cover Gradient */}
              <div className={`h-32 relative ${GRANDMASTER_IDS.includes(selectedStaff.id) ? 'bg-gradient-to-br from-slate-900 via-amber-900 to-slate-900' : 'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500'}`}>
                <div className="absolute inset-0 bg-black/10" />
                {GRANDMASTER_IDS.includes(selectedStaff.id) && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Diamond size={60} className="text-amber-500/10" />
                  </div>
                )}
              </div>

              <div className="px-8 pb-8 flex flex-col items-center">
                {/* Avatar Overlay */}
                <div className={`w-24 h-24 rounded-3xl p-1 shadow-xl -mt-12 mb-4 relative z-10 ${GRANDMASTER_IDS.includes(selectedStaff.id) ? 'bg-slate-950 border border-amber-500/50' : 'bg-white'}`}>
                  <div className={`w-full h-full rounded-2xl overflow-hidden border ${GRANDMASTER_IDS.includes(selectedStaff.id) ? 'border-amber-500/20 bg-slate-900' : 'border-slate-100 bg-slate-100'}`}>
                    {selectedStaff.avatar_url ? (
                      <img src={selectedStaff.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center text-4xl font-black ${GRANDMASTER_IDS.includes(selectedStaff.id) ? 'text-amber-500/30' : 'text-slate-300'}`}>
                        {selectedStaff.full_name[0]}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <h3 className={`text-2xl font-black uppercase tracking-tight ${GRANDMASTER_IDS.includes(selectedStaff.id) ? 'text-white' : 'text-slate-800'}`}>{selectedStaff.full_name}</h3>
                  {GRANDMASTER_IDS.includes(selectedStaff.id) && <Diamond size={16} className="text-amber-500 shadow-amber-500" />}
                </div>
                <p className={`text-sm font-bold uppercase tracking-widest mb-6 ${GRANDMASTER_IDS.includes(selectedStaff.id) ? 'text-amber-500' : 'text-slate-500'}`}>
                  {GRANDMASTER_IDS.includes(selectedStaff.id) ? 'GRANDMASTER ARCHITECT' : (selectedStaff.location || 'Global Operations')}
                </p>

                {/* Stats Grid */}
                <div className="w-full grid grid-cols-2 gap-4 mb-8">
                  <div className={`p-4 rounded-2xl border text-center ${GRANDMASTER_IDS.includes(selectedStaff.id) ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-100'}`}>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Level</p>
                    <div className="flex items-center justify-center gap-1">
                      <Zap size={14} className="text-amber-500" />
                      <span className={`text-xl font-black ${GRANDMASTER_IDS.includes(selectedStaff.id) ? 'text-white' : 'text-slate-800'}`}>{gameStats?.current_level || 1}</span>
                    </div>
                  </div>
                  <div className={`p-4 rounded-2xl border text-center ${GRANDMASTER_IDS.includes(selectedStaff.id) ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-100'}`}>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">FETS Cash</p>
                    <span className={`text-xl font-black ${GRANDMASTER_IDS.includes(selectedStaff.id) ? 'text-white' : 'text-slate-800'}`}>${gameStats?.total_cash || 200}</span>
                  </div>
                </div>

                {/* Status Bar */}
                <div className={`w-full h-1 rounded-full mb-8 overflow-hidden ${GRANDMASTER_IDS.includes(selectedStaff.id) ? 'bg-white/5' : 'bg-slate-100'}`}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: reward ? '100%' : `${progress}%` }}
                    className={`h-full ${reward ? 'bg-emerald-500' : (GRANDMASTER_IDS.includes(selectedStaff.id) ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-amber-500')}`}
                  />
                </div>

                {/* Action Button */}
                <div className="w-full">
                  {!reward ? (
                    <button
                      onMouseDown={startConnecting}
                      onMouseUp={stopConnecting}
                      onMouseLeave={stopConnecting}
                      onTouchStart={startConnecting}
                      onTouchEnd={stopConnecting}
                      className={`w-full py-5 rounded-2xl font-black uppercase tracking-[0.3em] text-xs shadow-xl active:scale-95 transition-all relative overflow-hidden group ${GRANDMASTER_IDS.includes(selectedStaff.id) ? 'bg-amber-500 text-black shadow-amber-500/20' : 'bg-slate-900 text-white shadow-slate-200'}`}
                    >
                      <span className="relative z-10">{connecting ? 'Initiating Link...' : 'Hold to Connect'}</span>
                      {connecting && (
                        <div
                          className={`absolute inset-0 transition-all duration-75 ${GRANDMASTER_IDS.includes(selectedStaff.id) ? 'bg-white/40' : 'bg-blue-600'}`}
                          style={{ width: `${progress}%`, opacity: 0.3 }}
                        />
                      )}
                    </button>
                  ) : (
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className={`w-full p-4 rounded-2xl border flex flex-col items-center gap-2 ${GRANDMASTER_IDS.includes(selectedStaff.id) ? 'bg-amber-500/10 border-amber-500/20' : 'bg-emerald-50 border border-emerald-100'}`}
                    >
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg mb-2 ${GRANDMASTER_IDS.includes(selectedStaff.id) ? 'bg-amber-500 shadow-amber-500/40' : 'bg-emerald-500 shadow-emerald-200'}`}>
                        <Trophy size={24} />
                      </div>
                      <span className={`text-xs font-black uppercase tracking-widest ${GRANDMASTER_IDS.includes(selectedStaff.id) ? 'text-amber-500' : 'text-emerald-600'}`}>Connection Successful</span>
                      <span className={`text-2xl font-black ${GRANDMASTER_IDS.includes(selectedStaff.id) ? 'text-white' : 'text-slate-800'}`}>+{reward.points_earned} Cash</span>

                      {reward.is_grandmaster && (
                        <div className="mt-2 text-[10px] font-black text-amber-500 uppercase tracking-widest bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/20 animate-bounce">
                          ✨ Mentor's Blessing: 2x Boost Earned!
                        </div>
                      )}

                      <button
                        onClick={() => { setSelectedStaff(null); setReward(null); }}
                        className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600"
                      >
                        Dismiss
                      </button>
                    </motion.div>
                  )}
                </div>

                <p className={`mt-6 text-[9px] text-center font-bold uppercase tracking-widest px-4 ${GRANDMASTER_IDS.includes(selectedStaff.id) ? 'text-amber-500/40' : 'text-slate-400'}`}>
                  {GRANDMASTER_IDS.includes(selectedStaff.id)
                    ? 'GRANDMASTER NODE: BYPASSES LOCATION GATE. BONUS REWARDS ENABLED.'
                    : 'Connection cycles refresh every 24 hours. Cross-location nodes require 1-hour wait.'}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FetsConnect;
