import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Activity,
  CheckSquare,
  MessageSquare,
  Users,
  TrendingUp,
  Zap,
  Maximize2,
  X,
  Plus,
  QrCode,
  Search,
  FilePlus,
  Clock,
  ChevronRight,
  AlertCircle,
  MoreHorizontal
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useDashboardStats } from '../hooks/useCommandCentre'
import { useBranch } from '../hooks/useBranch'
import { format } from 'date-fns'

// --- Interfaces ---

interface TileProps {
  id: string
  title: string
  icon: React.ElementType
  color?: string
  children: React.ReactNode
  onExpand: () => void
  colSpan?: 1 | 2
}

interface QuickActionProps {
  icon: React.ElementType
  label: string
  onClick: () => void
}

// --- Live Tile Component ---

const LiveTile = ({ id, title, icon: Icon, color = "amber", children, onExpand, colSpan = 1 }: TileProps) => {
  return (
    <motion.div
      layoutId={`tile-container-${id}`}
      className={`neomorphic-card relative group overflow-hidden flex flex-col justify-between cursor-pointer transition-shadow hover:shadow-[8px_8px_16px_#bec3c9,-8px_-8px_16px_#ffffff] ${colSpan === 2 ? 'md:col-span-2' : ''}`}
      onClick={onExpand}
      whileHover={{ y: -4 }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Background Decor */}
      <div className={`absolute -right-6 -bottom-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500 text-${color}-900 rotate-12`}>
        <Icon size={200} />
      </div>

      <div className="p-6 h-full flex flex-col relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl bg-${color}-50 text-${color}-600 shadow-sm border border-${color}-100 group-hover:scale-110 transition-transform duration-300`}>
              <Icon size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-700 tracking-tight">{title}</h3>
          </div>
          <button className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-gray-400 hover:text-gray-600">
            <Maximize2 size={16} />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col justify-center">
          {children}
        </div>
      </div>

      {/* Visual Indicator Bar */}
      <div className={`h-1 w-0 group-hover:w-full bg-gradient-to-r from-${color}-400 to-${color}-600 transition-all duration-500 rounded-b-2xl`} />
    </motion.div>
  )
}

// --- Expanded Panel Component ---

const ExpandedPanel = ({ id, title, children, onClose }: { id: string, title: string, children: React.ReactNode, onClose: () => void }) => {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/20 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        layoutId={`tile-container-${id}`}
        className="w-full max-w-4xl max-h-[90vh] bg-[#e0e5ec] rounded-3xl shadow-[20px_20px_60px_#bec3c9,-20px_-20px_60px_#ffffff] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 md:p-8 border-b border-gray-200 flex items-center justify-between bg-white/50 backdrop-blur-xl sticky top-0 z-20">
          <div>
            <h2 className="text-3xl font-bold text-gray-800 tracking-tight">{title}</h2>
            <p className="text-gray-500 mt-1">Detailed View & Management</p>
          </div>
          <button
            onClick={onClose}
            className="p-3 rounded-xl hover:bg-black/5 text-gray-500 transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        <div className="p-6 md:p-8 overflow-y-auto">
          {children}
        </div>
      </motion.div>
    </motion.div>
  )
}

// --- sub-components for Tile Content ---

const StatRow = ({ label, value, subtext }: { label: string, value: string | number, subtext?: string }) => (
  <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0 hover:bg-white/40 px-2 -mx-2 rounded-lg transition-colors">
    <span className="text-gray-500 font-medium text-sm">{label}</span>
    <div className="text-right">
      <span className="block text-lg font-bold text-gray-800 leading-none">{value}</span>
      {subtext && <span className="text-xs text-gray-400 font-medium">{subtext}</span>}
    </div>
  </div>
)

const TaskItem = ({ title, priority }: { title: string, priority: 'high' | 'medium' | 'low' }) => (
  <div className="flex items-center gap-3 py-2 px-2 hover:bg-white/50 rounded-lg cursor-pointer transition-colors group">
    <div className={`w-2 h-2 rounded-full ${priority === 'high' ? 'bg-red-500' : priority === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'} ring-4 ring-opacity-20 ring-${priority === 'high' ? 'red' : priority === 'medium' ? 'amber' : 'emerald'}-500`} />
    <span className="text-sm font-medium text-gray-700 flex-1 truncate">{title}</span>
    <ChevronRight size={14} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
  </div>
)

const QuickActionButton = ({ icon: Icon, label, onClick }: QuickActionProps) => (
  <button
    onClick={(e) => { e.stopPropagation(); onClick(); }}
    className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#e0e5ec] shadow-[5px_5px_10px_#bec3c9,-5px_-5px_10px_#ffffff] hover:shadow-[inset_5px_5px_10px_#bec3c9,inset_-5px_-5px_10px_#ffffff] active:scale-95 transition-all duration-200 group w-full"
  >
    <Icon size={20} className="text-amber-600 mb-2 group-hover:scale-110 transition-transform" />
    <span className="text-xs font-bold text-gray-600">{label}</span>
  </button>
)

// --- Main Desk Component ---

export function MyDeskNew() {
  const { profile } = useAuth()
  const { activeBranch } = useBranch()
  const { data: stats } = useDashboardStats()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Tasks Setup (Mock + LocalStorage Logic reuse)
  const [tasks, setTasks] = useState<any[]>([])

  useEffect(() => {
    const saved = localStorage.getItem('fets-tasks')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        // Flatten tasks from columns for preview
        const allTasks = parsed.flatMap((col: any) => col.tasks)
        setTasks(allTasks.slice(0, 3))
      } catch (e) { console.error(e) }
    } else {
      // Mock initial
      setTasks([
        { id: '1', title: 'Review candidates', priority: 'high' },
        { id: '2', title: 'Approve rosters', priority: 'medium' },
        { id: '3', title: 'Briefing notes', priority: 'low' },
      ])
    }
  }, [])

  // Derived Data
  const sessionCount = stats?.todaysExams?.length || 0
  const candidateCount = stats?.todayCandidates || 0
  const incidentCount = stats?.pendingIncidents || 0

  // rosterStaff fallback is critical if data is missing
  const rosterStaff: string[] = stats?.todaysRoster?.staff || ['Mithun', 'Niyas', 'Adithyan']

  // Handlers
  const handleExpand = (id: string) => setExpandedId(id)
  const handleClose = () => setExpandedId(null)

  return (
    <div className="min-h-screen bg-[#e0e5ec] pt-28 pb-12 px-4 md:px-8">

      {/* Dynamic Header */}
      <div className="max-w-[1600px] mx-auto mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-[900] tracking-tight text-gray-800">
            <span className="text-gold-gradient">MY DESK</span>
          </h1>
          <p className="text-gray-500 font-medium mt-1 ml-1 flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${activeBranch === 'calicut' ? 'bg-amber-500' : 'bg-blue-500'}`}></span>
            {activeBranch.toUpperCase()} OPERATIONS CENTER
          </p>
        </div>

        {/* Real-time Clock Pill */}
        <div className="neomorphic-card px-6 py-3 rounded-full flex items-center gap-3 text-gray-600">
          <Clock size={16} className="text-amber-500" />
          <span className="font-mono font-bold tracking-widest text-sm">
            {format(new Date(), 'HH:mm:ss')}
          </span>
        </div>
      </div>

      {/* Tiles Grid */}
      <div className="max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">

        {/* 1. Today Ops Tile */}
        <LiveTile id="ops" title="Today Ops" icon={Activity} onExpand={() => handleExpand('ops')} color="amber">
          <div className="space-y-1">
            <StatRow
              label="Active Sessions"
              value={sessionCount}
              subtext={`${stats?.todaysExams?.reduce((acc: number, s: any) => acc + (s.candidate_count || 0), 0) || 0} Seats`}
            />
            <StatRow label="Pending Incidents" value={incidentCount} subtext="Requires Attention" />
            <div className="mt-4 pt-3 border-t border-gray-200/50 flex items-center justify-between">
              <span className="text-xs font-bold text-gray-400 uppercase">System Status</span>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">OPERATIONAL</span>
            </div>
          </div>
        </LiveTile>

        {/* 2. Task Queue Tile */}
        <LiveTile id="tasks" title="Task Queue" icon={CheckSquare} onExpand={() => handleExpand('tasks')} color="emerald">
          <div className="space-y-2 mb-2">
            {tasks.map(task => (
              <TaskItem key={task.id} title={task.title} priority={task.priority} />
            ))}
          </div>
          <button className="w-full mt-auto py-2 flex items-center justify-center gap-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors font-semibold text-sm">
            <Plus size={16} /> Add New Task
          </button>
        </LiveTile>

        {/* 3. Messages Tile */}
        <LiveTile id="messages" title="Messages" icon={MessageSquare} onExpand={() => handleExpand('messages')} color="blue">
          <div className="flex flex-col items-center justify-center py-4">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-400 blur-xl opacity-20 rounded-full animate-pulse"></div>
              <MessageSquare size={48} className="text-blue-500 relative z-10" />
              {stats?.newMessages > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-[#e0e5ec] flex items-center justify-center">
                  <span className="text-[10px] font-bold text-white">{stats.newMessages}</span>
                </div>
              )}
            </div>
            <h4 className="mt-4 text-2xl font-bold text-gray-800">{stats?.newMessages || 0} Unread</h4>
            <p className="text-sm text-gray-500 font-medium">Staff Notes & Alerts</p>
          </div>
        </LiveTile>

        {/* 4. Roster Snapshot Tile */}
        <LiveTile id="roster" title="Roster Snapshot" icon={Users} onExpand={() => handleExpand('roster')} color="purple">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              <span>On Duty Now</span>
              <span>{rosterStaff.length} Active</span>
            </div>
            <div className="flex -space-x-3 overflow-hidden py-2 px-1">
              {rosterStaff.slice(0, 5).map((staff: string, i: number) => (
                <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 border-2 border-white shadow-sm flex items-center justify-center text-xs font-bold text-purple-800" title={staff}>
                  {staff.charAt(0)}
                </div>
              ))}
              {rosterStaff.length > 5 && (
                <div className="w-10 h-10 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs font-bold text-gray-500">
                  +{rosterStaff.length - 5}
                </div>
              )}
            </div>
            {rosterStaff.length > 0 && (
              <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
                <p className="text-xs text-purple-800 font-medium"><span className="font-bold">{rosterStaff[0]}</span> is Shift Mgr.</p>
              </div>
            )}
          </div>
        </LiveTile>

        {/* 5. Candidate Flow Tile (Capacity) */}
        <LiveTile id="candidates" title="Candidate Flow" icon={TrendingUp} onExpand={() => handleExpand('candidates')} color="rose">
          <div className="flex items-center justify-between h-full">
            <div className="relative w-24 h-24">
              {/* Circular Progress Mock */}
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="48" cy="48" r="40" stroke="#fecdd3" strokeWidth="8" fill="transparent" />
                <circle cx="48" cy="48" r="40" stroke="#e11d48" strokeWidth="8" fill="transparent" strokeDasharray={`${(candidateCount / 100) * 251} 251`} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-rose-900">
                <span className="text-xl font-bold">{candidateCount}</span>
              </div>
            </div>
            <div className="text-right flex-1 pl-4">
              <p className="text-3xl font-bold text-gray-800">{Math.round((candidateCount / 50) * 100)}%</p>
              <p className="text-xs font-bold text-gray-400 uppercase">Capacity Usage</p>
              <p className="text-xs text-rose-600 font-medium mt-1">+12% vs last hour</p>
            </div>
          </div>
        </LiveTile>

        {/* 6. Quick Tools Tile */}
        <LiveTile id="tools" title="Quick Tools" icon={Zap} onExpand={() => { }} color="indigo" colSpan={1}>
          <div className="grid grid-cols-2 gap-3 h-full">
            <QuickActionButton icon={QrCode} label="Scan QR" onClick={() => console.log('Scan')} />
            <QuickActionButton icon={Search} label="ID Lookup" onClick={() => console.log('Lookup')} />
            <QuickActionButton icon={FilePlus} label="New Incident" onClick={() => console.log('Incident')} />
            <QuickActionButton icon={MoreHorizontal} label="More" onClick={() => console.log('More')} />
          </div>
        </LiveTile>

      </div>

      {/* Expanded Overlay Manager */}
      <AnimatePresence>
        {expandedId === 'ops' && (
          <ExpandedPanel id="ops" title="Operations Overview" onClose={handleClose}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-xl font-bold mb-4">Live Session Data</h3>
                {/* Placeholder for detailed Ops View */}
                <div className="h-64 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">Detailed Graphs & Session Lists would go here</div>
              </div>
              <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-xl font-bold mb-4">Incident Log</h3>
                <div className="h-64 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">Critical Incidents List</div>
              </div>
            </div>
          </ExpandedPanel>
        )}

        {expandedId === 'tasks' && (
          <ExpandedPanel id="tasks" title="Task Management" onClose={handleClose}>
            <div className="flex flex-col items-center justify-center py-20 text-gray-400 bg-white/50 rounded-3xl border-2 border-dashed border-gray-300">
              <CheckSquare size={64} className="mb-4 opacity-50" />
              <p className="text-xl font-semibold">Full Kanban Board Loading...</p>
              <p className="text-sm">This would load the full FetsTaskWidget here.</p>
            </div>
          </ExpandedPanel>
        )}

        {expandedId === 'messages' && (
          <ExpandedPanel id="messages" title="Communication Hub" onClose={handleClose}>
            {/* Could load FetsConnectNew here */}
            <div className="h-96 w-full bg-white rounded-xl shadow-sm flex items-center justify-center">
              Message Center Placeholder
            </div>
          </ExpandedPanel>
        )}

        {/* Add cases for other tiles... */}

      </AnimatePresence>

    </div>
  )
}

export default MyDeskNew
