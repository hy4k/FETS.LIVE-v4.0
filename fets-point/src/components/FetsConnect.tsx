import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Rss,
  MessageSquare,
  CheckSquare,
  Users,
  Plus,
  MessageCircle,
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
  const { data: tasks = [], isLoading: isLoadingTasks, error: tasksError } = useTasks(profile?.id);
  const { data: allStaff = [] } = useAllStaff();
  const { data: onlineStaff = [], isLoading: isLoadingStaff } = useOnlineStaff();
  const { addPost } = usePostMutations();
  const { addTask, updateTask } = useTaskMutations(profile?.id);

  const [activeTab, setActiveTab] = useState<'feed' | 'tasks' | 'chat'>('feed');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

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


          <MyTasks tasks={tasks} isLoading={isLoadingTasks} error={tasksError} openTaskModal={openTaskModal} />
        </div>
      </aside>

      <main className="col-span-9 flex flex-col bg-slate-100 border-r border-slate-200">
        {activeTab === 'feed' && (
          <Feed posts={posts} isLoading={isLoadingPosts} error={postsError} profile={profile} />
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
      </AnimatePresence>
    </div>
  );
};



export default FetsConnect;
