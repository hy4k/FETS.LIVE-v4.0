import React, { useState, useMemo, useEffect } from 'react';
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
  MoreHorizontal,
  MessageCircle,
} from 'lucide-react';
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
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'feed'
                ? 'bg-blue-100 text-blue-700 shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Rss className="w-5 h-5" /> Feed
          </button>
          <button
            onClick={() => setActiveTab('kudos')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'kudos'
                ? 'bg-blue-100 text-blue-700 shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Award className="w-5 h-5" /> Kudos Board
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'tasks'
                ? 'bg-blue-100 text-blue-700 shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <CheckSquare className="w-5 h-5" /> Task Board
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'chat'
                ? 'bg-blue-100 text-blue-700 shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <MessageCircle className="w-5 h-5" /> Chat
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

export default FetsConnect;
