import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShieldCheck, MapPin, Briefcase, GraduationCap, Sparkles,
  MessageSquare, LayoutGrid, BookOpen, UserCheck, Key, LogOut,
  Mail, History, Info, ExternalLink, Brain, ChevronDown, ChevronRight, Phone,
  CheckSquare, Flower2, Calendar, FileText, User, Users as UsersIcon, Minimize2, Video, Mic
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useBranch } from '../hooks/useBranch'
import { toast } from 'react-hot-toast'
import { format } from 'date-fns'
import { supabase } from '../lib/supabase'

// Imported Components
import { ProfilePictureUpload } from './ProfilePictureUpload'
import { Fetchat } from './Fetchat'
import { DigitalNotebook } from './DigitalNotebook'
import { FetsVault } from './FetsVault'
import { FetsProfile } from './FetsProfile'
import { getActiveRosterHandlerEmail } from '../utils/authUtils'
import { useChat } from '../contexts/ChatContext'
import { useGlobalCall } from '../contexts/CallContext'
import { Frame } from './Frame'

// --- VISUAL COMPONENT PRIMITIVES (Glass & Midnight Theme for Main UI) ---

const GlassCard = ({ children, className = "", noPadding = false }: { children: React.ReactNode, className?: string, noPadding?: boolean }) => (
  <div className={`
    relative backdrop-blur-xl bg-white/[0.08] 
    border border-white/[0.1] 
    shadow-[0_8px_32px_rgba(0,0,0,0.4)]
    rounded-3xl overflow-hidden
    ${noPadding ? '' : 'p-6'}
    ${className}
  `}>
    {children}
  </div>
)

const GlassInset = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`
    bg-black/30 
    border border-white/5 
    rounded-xl
    shadow-inner
    ${className}
  `}>
    {children}
  </div>
)

const NeonButton = ({ children, onClick, active = false, variant = 'primary', className = "" }: { children: React.ReactNode, onClick?: () => void, active?: boolean, variant?: 'primary' | 'danger', className?: string }) => {
  const base = "relative px-4 py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all duration-300"

  const variants = {
    primary: active
      ? "bg-amber-500 text-black shadow-[0_0_20px_rgba(245,158,11,0.4)] translate-y-[-1px]"
      : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/5",
    danger: "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20"
  }

  return (
    <button onClick={onClick} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </button>
  )
}

// --- SUB-COMPONENTS ---

const UserProfileCard = ({ profile }: { profile: any }) => {
  return (
    <GlassCard className="flex flex-col items-center text-center relative flex-shrink-0">
      <div className="p-1.5 rounded-full border border-amber-500/30 bg-black/40 backdrop-blur-sm relative z-10 mb-2">
        <ProfilePictureUpload
          staffId={profile?.id || ''}
          staffName={profile?.full_name || 'User'}
          currentAvatarUrl={profile?.avatar_url}
          onAvatarUpdate={() => window.location.reload()}
        />
      </div>
      <h2 className="text-xl font-black text-white uppercase tracking-tight leading-none mb-1">
        {profile?.full_name}
      </h2>
      <div className="flex flex-wrap justify-center gap-2 mt-2">
        <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-amber-500 text-black">
          {profile?.role === 'staff' ? 'FETSIAN' : profile?.role?.replace('_', ' ')}
        </span>
        <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest bg-white/10 text-gray-300 border border-white/5">
          {profile?.branch_assigned || 'Global'}
        </span>
      </div>
    </GlassCard>
  )
}

// 2. NEW "TO DO" Module (Pastel Lined Paper Style)
const ToDoListModule = () => {
  interface UserTask { id: string, text: string, completed: boolean }
  interface TaskCategory {
    id: 'must' | 'should' | 'could' | 'if_time'
    label: string
    color: string
    placeholder: string
  }

  // Initialize state with empty tasks for 8 lines per category
  const [tasks, setTasks] = useState<Record<string, UserTask[]>>({
    must: [], should: [], could: [], if_time: []
  })

  useEffect(() => {
    const saved = localStorage.getItem('fets_pastel_todo_v1')
    if (saved) {
      try { setTasks(JSON.parse(saved)) } catch (e) { }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('fets_pastel_todo_v1', JSON.stringify(tasks))
  }, [tasks])

  const handleUpdate = (catId: string, index: number, text: string) => {
    const newTasks = { ...tasks }
    if (!newTasks[catId][index]) newTasks[catId][index] = { id: Date.now().toString() + Math.random(), text: '', completed: false }
    newTasks[catId][index].text = text
    // If text cleared, we keep userTask object generally, but maybe filter empty on save? 
    // For this UI, we just keep state as is to maintain line integrity
    setTasks(newTasks)
  }

  const handleToggle = (catId: string, index: number) => {
    const newTasks = { ...tasks }
    if (newTasks[catId][index]) {
      newTasks[catId][index].completed = !newTasks[catId][index].completed
      setTasks(newTasks)
    }
  }

  const handleDelete = (catId: string, index: number) => {
    // Clear the line
    const newTasks = { ...tasks }
    if (newTasks[catId][index]) {
      newTasks[catId].splice(index, 1) // Remove the item to shift lines up? Or just clear?
      // User requested "write and delete". Usually list behavior implies shifting.
      setTasks(newTasks)
    }
  }

  const categories: TaskCategory[] = [
    { id: 'must', label: 'MUST DO', color: 'bg-[#f0e4e4]', placeholder: 'Critical tasks...' },
    { id: 'should', label: 'SHOULD DO', color: 'bg-[#ebe5d5]', placeholder: 'Important stuff...' },
    { id: 'could', label: 'COULD DO', color: 'bg-[#d5deef]', placeholder: 'Nice to have...' },
    { id: 'if_time', label: 'IF I HAVE TIME', color: 'bg-[#e5d5ef]', placeholder: 'Backlog...' }
  ]

  // Font Injection
  const fontLink = (
    <style dangerouslySetInnerHTML={{
      __html: `
      @import url('https://fonts.googleapis.com/css2?family=Patrick+Hand&display=swap');
      .font-hand { font-family: 'Patrick Hand', cursive; }
      .paper-line { 
          background-image: linear-gradient(transparent 95%, #9ca3af 95%);
          background-size: 100% 2.5rem;
          line-height: 2.5rem;
      }
    `}} />
  )

  return (
    <div className="h-full bg-[#fdfbf7] rounded-3xl overflow-hidden shadow-2xl relative font-sans text-gray-800 p-6 md:p-10 select-none">
      {fontLink}

      {/* Decorative Doodles */}
      <Flower2 className="absolute top-0 right-0 w-64 h-64 text-gray-800/5 rotate-12 -translate-y-10 translate-x-10 pointer-events-none" strokeWidth={1} />
      <Flower2 className="absolute bottom-0 left-0 w-48 h-48 text-gray-800/5 -rotate-12 translate-y-10 -translate-x-10 pointer-events-none" strokeWidth={1} />

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 relative z-10 gap-4">
        <h2 className="text-5xl md:text-6xl font-hand text-[#3e3223]">To Do LiST</h2>
        <div className="bg-[#cbd5e1] px-4 py-2 rounded-full transform -rotate-2 shadow-sm">
          <span className="font-hand text-xl text-gray-700">DATE: {format(new Date(), 'MMM do, yyyy')}</span>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[calc(100%-6rem)] overflow-y-auto custom-scrollbar pb-10">
        {categories.map(cat => (
          <div key={cat.id} className={`${cat.color} rounded-3xl p-6 shadow-md border border-black/5 relative overflow-hidden group`}>
            <h3 className="font-hand text-2xl text-gray-700 mb-4 uppercase tracking-wider text-center">{cat.label}</h3>
            <div className="space-y-0">
              {/* Render fixed 7 lines */}
              {Array.from({ length: 7 }).map((_, i) => {
                const task = tasks[cat.id]?.[i]
                return (
                  <div key={i} className="flex items-center gap-3 border-b border-gray-400/30 h-10 group/line">
                    <button
                      onClick={() => task && task.text && handleToggle(cat.id, i)}
                      className={`w-5 h-5 rounded border-2 border-gray-400 flex items-center justify-center transition-colors ${task?.completed ? 'bg-gray-600 border-gray-600' : 'bg-white/50 hover:border-gray-600'}`}
                    >
                      {task?.completed && <CheckSquare size={14} className="text-white" />}
                    </button>
                    <input
                      type="text"
                      value={task?.text || ''}
                      onChange={e => handleUpdate(cat.id, i, e.target.value)}
                      className={`flex-1 bg-transparent border-none outline-none font-hand text-xl text-gray-800 placeholder-gray-400/50 ${task?.completed ? 'line-through opacity-50' : ''}`}
                      placeholder={i === 0 && !task?.text ? cat.placeholder : ''}
                    />
                    {task?.text && (
                      <button onClick={() => handleDelete(cat.id, i)} className="opacity-0 group-hover/line:opacity-100 text-gray-400 hover:text-red-400 transition-opacity">
                        <div className="font-hand text-lg">x</div>
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// 3. Consolidated Leave & Roster Hub
const LeaveSubmissionModule = () => {
  const { profile, user } = useAuth()
  const [activeTab, setActiveTab] = useState<'submit' | 'admin' | 'roster'>('submit')
  const [date, setDate] = useState('')
  const [branch, setBranch] = useState('Calicut')
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [myRequests, setMyRequests] = useState<any[]>([])
  const [adminQueue, setAdminQueue] = useState<any[]>([])
  const [rosterQueue, setRosterQueue] = useState<any[]>([])
  const rosterHandlerEmail = getActiveRosterHandlerEmail()

  // Roles
  const isSuperAdmin = profile?.role === 'super_admin' || profile?.email === 'mithun@fets.in' || user?.email === 'mithun@fets.in'
  const isAdmin = user?.email === rosterHandlerEmail || isSuperAdmin // Admin for the session (Roster Manager)

  useEffect(() => {
    console.log('Leave Hub Debug:', {
      email: user?.email,
      profileEmail: profile?.email,
      role: profile?.role,
      isSuperAdmin
    })
  }, [user, profile, isSuperAdmin])

  const fetchMyRequests = async () => {
    if (!user) return
    const { data } = await supabase.from('leave_requests').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5)
    setMyRequests(data || [])
  }

  const fetchAdminQueue = async () => {
    if (!isSuperAdmin) return
    try {
      const { data: requests, error: reqError } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('status', 'pending')

      if (reqError) throw reqError
      if (!requests || requests.length === 0) {
        setAdminQueue([])
        return
      }

      const userIds = requests.map(r => r.user_id)
      const { data: profiles } = await supabase
        .from('staff_profiles')
        .select('user_id, full_name, branch_assigned')
        .in('user_id', userIds)

      const enriched = requests.map(req => ({
        ...req,
        requestor: profiles?.find(p => p.user_id === req.user_id)
      }))

      setAdminQueue(enriched)
    } catch (err) {
      console.error('Admin Queue Fetch Error:', err)
    }
  }

  const fetchRosterQueue = async () => {
    if (!isAdmin) return
    try {
      const { data: requests, error: reqError } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('status', 'approved')

      if (reqError) throw reqError
      if (!requests || requests.length === 0) {
        setRosterQueue([])
        return
      }

      const userIds = requests.map(r => r.user_id)
      const { data: profiles } = await supabase
        .from('staff_profiles')
        .select('user_id, full_name, branch_assigned')
        .in('user_id', userIds)

      const enriched = requests.map(req => ({
        ...req,
        requestor: profiles?.find(p => p.user_id === req.user_id)
      }))

      setRosterQueue(enriched)
    } catch (err) {
      console.error('Roster Queue Fetch Error:', err)
    }
  }

  useEffect(() => {
    fetchMyRequests()
    if (isSuperAdmin) fetchAdminQueue()
    if (isAdmin) fetchRosterQueue()
  }, [user, isSuperAdmin, isAdmin])

  // 1. Submit Leave
  const handleSubmit = async () => {
    if (!date || !reason) { toast.error('Date and Reason required'); return }
    setIsSubmitting(true)
    try {
      const { error } = await supabase.from('leave_requests').insert({
        user_id: user?.id,
        requested_date: date,
        reason: `[${branch}] ${reason}`,
        status: 'pending',
        request_type: 'leave'
      })
      if (error) throw error
      toast.success('Submitted to Administration')
      setDate(''); setReason('')
      fetchMyRequests()
    } catch (err: any) {
      // Fallback if schema differs
      toast.error('Submission Error: ' + err.message)
    } finally { setIsSubmitting(false) }
  }

  // 2. Admin Action
  const handleAdminAction = async (id: string, action: 'approved' | 'rejected') => {
    try {
      await supabase.from('leave_requests').update({ status: action, admin_action_by: user?.id }).eq('id', id)
      toast.success(`Request ${action}`)
      fetchAdminQueue()
      // If approved, it automatically flows to Roster Queue via status check
    } catch (err) { toast.error('Action Failed') }
  }

  // 3. Admin (Roster) Action
  const handleRosterUpdate = async (req: any) => {
    try {
      // A. Update Roster Schedule
      const { error: rosterError } = await supabase.from('roster_schedules').upsert({
        profile_id: req.user_id,
        date: req.requested_date,
        shift_code: 'L', // Leave Code
        status: 'confirmed',
        updated_at: new Date().toISOString()
      }, { onConflict: 'profile_id,date' })

      if (rosterError) throw rosterError

      // B. Mark Request Complete 
      await supabase.from('leave_requests').update({ status: 'completed' }).eq('id', req.id)

      toast.success('Roster Updated Successfully')
      fetchRosterQueue()
    } catch (err: any) { toast.error('Roster System Error: ' + err.message) }
  }

  return (
    <div className="h-full p-4 md:p-8 flex flex-col gap-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tight">Leave Submission</h2>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Official Protocol</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setActiveTab('submit')} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider ${activeTab === 'submit' ? 'bg-amber-500 text-black' : 'bg-white/5 text-gray-500'}`}>FETSIAN Desk</button>
          {isSuperAdmin && <button onClick={() => setActiveTab('admin')} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider ${activeTab === 'admin' ? 'bg-red-500 text-white' : 'bg-white/5 text-gray-500'}`}>Super Admin Queue ({adminQueue.length})</button>}
          {isAdmin && <button onClick={() => setActiveTab('roster')} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider ${activeTab === 'roster' ? 'bg-emerald-500 text-black' : 'bg-white/5 text-gray-500'}`}>Admin Roster Hub ({rosterQueue.length})</button>}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {activeTab === 'submit' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form */}
            <GlassCard className="space-y-6">
              <h3 className="text-sm font-black text-amber-500 uppercase tracking-widest flex items-center gap-2"><Calendar size={16} /> New Application</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Date</label>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white text-sm outline-none focus:border-amber-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Location</label>
                  <select value={branch} onChange={e => setBranch(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white text-sm outline-none focus:border-amber-500">
                    <option value="Calicut">Calicut</option>
                    <option value="Cochin">Cochin</option>
                    <option value="Kannur">Kannur</option>
                    <option value="Trivandrum">Trivandrum</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Reason</label>
                <textarea value={reason} onChange={e => setReason(e.target.value)} rows={4} className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white text-sm outline-none focus:border-amber-500 placeholder-gray-600" placeholder="State your reason..." />
              </div>
              <NeonButton active onClick={handleSubmit} className="w-full">
                {isSubmitting ? 'Transmitting...' : 'Submit to Super Admin'}
              </NeonButton>
            </GlassCard>

            {/* History */}
            <div className="space-y-4">
              <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest flex items-center gap-2"><History size={16} /> Recent Applications</h3>
              {myRequests.map(req => (
                <div key={req.id} className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                  <div>
                    <p className="text-white font-bold text-sm">{new Date(req.requested_date).toDateString()}</p>
                    <p className="text-xs text-gray-500">{req.reason}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest border 
                            ${req.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                      req.status === 'approved' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                        req.status === 'rejected' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                          'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                    {req.status?.replace('_', ' ')}
                  </span>
                </div>
              ))}
              {myRequests.length === 0 && <p className="text-gray-600 text-xs italic">No records found.</p>}
            </div>
          </div>
        )}

        {activeTab === 'admin' && (
          <div className="space-y-4">
            <GlassCard className="bg-red-900/10 border-red-500/20" noPadding>
              <div className="p-4 border-b border-red-500/20 bg-red-900/20">
                <h3 className="text-red-400 font-black uppercase tracking-widest text-sm">Super Admin Approval Queue</h3>
              </div>
              <div className="p-4 space-y-3">
                {adminQueue.map(req => (
                  <div key={req.id} className="p-4 rounded-xl bg-black/40 border border-white/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-black font-bold">
                        {req.requestor?.full_name?.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-white font-bold">{req.requestor?.full_name}</h4>
                        <p className="text-xs text-gray-400">Req: <span className="text-white">{new Date(req.requested_date).toDateString()}</span> • {req.branch_location}</p>
                        <p className="text-xs text-gray-500 mt-1 italic">"{req.reason}"</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleAdminAction(req.id, 'rejected')} className="px-3 py-2 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 text-xs font-black uppercase tracking-wider">Reject</button>
                      <button onClick={() => handleAdminAction(req.id, 'approved')} className="px-3 py-2 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20 text-xs font-black uppercase tracking-wider">Approve</button>
                    </div>
                  </div>
                ))}
                {adminQueue.length === 0 && <p className="text-gray-500 text-center py-8">Queue Empty. All Clear.</p>}
              </div>
            </GlassCard>
          </div>
        )}

        {activeTab === 'roster' && (
          <div className="space-y-4">
            <GlassCard className="bg-emerald-900/10 border-emerald-500/20" noPadding>
              <div className="p-4 border-b border-emerald-500/20 bg-emerald-900/20">
                <h3 className="text-emerald-400 font-black uppercase tracking-widest text-sm">Admin Implementation Hub</h3>
              </div>
              <div className="p-4 space-y-3">
                {rosterQueue.map(req => (
                  <div key={req.id} className="p-4 rounded-xl bg-black/40 border border-white/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                      <h4 className="text-white font-bold flex items-center gap-2">
                        {req.requestor?.full_name}
                        <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[9px] uppercase tracking-wider">Super Admin Approved</span>
                      </h4>
                      <p className="text-xs text-gray-400 mt-1">Target Date: <span className="text-white font-bold">{new Date(req.requested_date).toDateString()}</span></p>
                      <p className="text-xs text-gray-500 mt-1">Action Required: Update Roster Slot to 'LEAVE'</p>
                    </div>
                    <NeonButton onClick={() => handleRosterUpdate(req)} className="bg-emerald-500 text-black hover:bg-emerald-400 border-0">
                      Confirm & Update Roster
                    </NeonButton>
                  </div>
                ))}
                {rosterQueue.length === 0 && <p className="text-gray-500 text-center py-8">No Pending Roster Actions.</p>}
              </div>
            </GlassCard>
          </div>
        )}
      </div>
    </div>
  )
}


// --- MAIN COMPONENT ---

export function MyDesk() {
  const { profile, signOut } = useAuth()
  const { activeBranch } = useBranch()
  const { isDetached, toggleDetach, activeUser, setActiveUser } = useChat()
  const [activeTab, setActiveTab] = useState('fetchat')

  // Global Call Support
  const { callState, startCall, isMinimized, setIsMinimized } = useGlobalCall()

  // Explicit handlers for Fetchat
  const handleStartVideoCall = (targetUserIds: string | string[], type: 'video' | 'audio' = 'video') => {
    startCall(targetUserIds, type)
  }

  const mainTabs = [
    { id: 'fetchat', label: 'Chat', icon: MessageSquare },
    { id: 'frame', label: 'Frame', icon: UsersIcon }, // New Frame Tab
    { id: 'todo', label: 'To Do', icon: CheckSquare },
    { id: 'notes', label: 'Notes', icon: BookOpen },
    { id: 'vault', label: 'Vault', icon: Key },
    { id: 'profile', label: 'Profile', icon: User },
  ]

  const secondaryTabs = [
    { id: 'leave-submission', label: 'Leave & Roster', icon: Calendar },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1e293b] via-[#312e81] to-[#0f172a] text-gray-100 font-sans -mt-24 pt-36 px-4 lg:px-8 pb-8 animate-in fade-in duration-500">
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-0 w-[600px] h-[600px] bg-blue-900/10 rounded-full blur-[128px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-amber-600/5 rounded-full blur-[128px]" />
      </div>

      <div className="relative z-10 max-w-[1920px] mx-auto h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-6">

        {/* LEFT: User Identity & Nav SideBar */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:w-[320px] flex flex-col gap-6 flex-shrink-0 lg:h-full h-auto"
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-2 flex-shrink-0">
            <div className="p-2 rounded-lg bg-white/5 border border-white/10 text-amber-500">
              <LayoutGrid size={20} />
            </div>
            <div>
              <h1 className="text-xl font-black text-white uppercase tracking-tight leading-none">MY <span className="text-gray-500">DESK</span></h1>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{format(new Date(), 'dd MMM yyyy • HH:mm')}</p>
            </div>
          </div>

          <GlassCard className="flex-1 flex flex-col gap-6" noPadding>
            <div className="p-6 pb-0">
              <UserProfileCard profile={profile} />
            </div>

            {/* MAIN MENU */}
            <div className="flex-1 px-6 overflow-y-auto custom-scrollbar flex flex-col gap-2">
              <div className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 px-2">Menu</div>
              {mainTabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                            text-left w-full p-4 rounded-2xl flex items-center gap-4 transition-all duration-200 group relative overflow-hidden
                            ${activeTab === tab.id
                      ? 'bg-amber-500 text-black shadow-[0_0_20px_rgba(245,158,11,0.3)]'
                      : 'hover:bg-white/5 text-gray-400 hover:text-white border border-transparent hover:border-white/5'}
                        `}
                >
                  {/* Glow effect for active */}
                  {activeTab === tab.id && <div className="absolute inset-0 bg-white/10 mix-blend-overlay" />}

                  <tab.icon size={24} className={`${activeTab === tab.id ? 'text-black' : 'text-gray-500 group-hover:text-amber-500'} transition-colors`} strokeWidth={2.5} />
                  <span className={`text-xl font-black uppercase tracking-tight ${activeTab === tab.id ? 'text-black' : 'text-gray-300 group-hover:text-white'}`}>
                    {tab.label}
                  </span>
                </button>
              ))}
            </div>

            {/* BOTTOM MENU (SECONDARY) */}
            <div className="p-6 pt-0 mt-auto flex flex-col gap-3">
              <div className="flex gap-2">
                {secondaryTabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                                flex-1 py-3 px-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all
                                ${activeTab === tab.id
                        ? 'bg-amber-500/10 border-amber-500/50 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.1)]'
                        : 'bg-black/20 border-white/5 text-gray-500 hover:bg-white/5 hover:text-gray-300 hover:border-white/10'}
                            `}
                  >
                    <tab.icon size={16} />
                    <span className="text-[9px] font-black uppercase tracking-wider text-center leading-tight">
                      {tab.label}
                    </span>
                  </button>
                ))}
              </div>

              {/* Sign Out */}
              <NeonButton variant="danger" className="w-full" onClick={signOut}>
                <LogOut size={14} /> End Session
              </NeonButton>
            </div>

          </GlassCard>
        </motion.div>

        {/* RIGHT: Tools & Features */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0 gap-6">

          {/* Nav Info Bar (Just Location/Status, NO MENU) */}
          <GlassCard className="p-3 flex items-center justify-between overflow-x-auto custom-scrollbar" noPadding>
            {activeTab === 'fetchat' ? (
              <div className="flex items-center gap-6 px-4 w-full justify-between min-w-max animate-in fade-in duration-300">
                {[
                  { label: 'FETS.IN', url: 'https://fets.in/' },
                  { label: 'FETS.CASH', url: 'https://fets.cash/' },
                  { label: 'FETS.CLOUD', url: 'https://fets.cloud/' },
                  { label: 'FETS.TEAM', url: 'https://fets.team/' },
                  { label: 'FETSCORE.IN', url: 'https://fetscore.in/' },
                  { label: 'FETS.SPACE', url: 'https://fets.space/' },
                ].map((domain) => {
                  const parts = domain.label.split('.');
                  return (
                    <a
                      key={domain.label}
                      href={domain.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group"
                    >
                      <span className="font-black text-xs md:text-sm tracking-widest hover:opacity-80 transition-opacity">
                        <span className="text-amber-500">{parts[0]}</span>
                        <span className="text-gray-400">.{parts[1]}</span>
                      </span>
                    </a>
                  );
                })}
              </div>
            ) : (
              // Revert to Standard Header for other tabs
              <div className="w-full flex items-center justify-between px-6 animate-in fade-in duration-300">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isDetached ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    System {isDetached ? 'Detached' : 'Online'}
                  </span>
                </div>

                <div className="flex items-center gap-3 px-6 border-l border-white/10">
                  <MapPin size={14} className="text-gray-500" />
                  <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">{activeBranch || 'Global'}</span>
                </div>
              </div>
            )}
          </GlassCard>

          {/* Content Area */}
          <div className="flex-1 min-h-0 relative">
            <AnimatePresence mode="wait">
              {/* 1. FETCHAT */}
              {activeTab === 'fetchat' && (
                <motion.div key="fetchat" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full">
                  {isDetached ? (
                    <GlassCard className="h-full flex flex-col items-center justify-center text-center">
                      <div className="p-6 rounded-full bg-amber-500/10 border border-amber-500/30 mb-6 animate-pulse">
                        <ExternalLink size={48} className="text-amber-500" />
                      </div>
                      <h3 className="text-2xl font-black text-white uppercase tracking-tight">Channel Detached</h3>
                      <p className="text-gray-500 max-w-sm mt-3 mb-8 text-sm font-medium">
                        The Secure Comms Channel is currently active in a floating window. It will persist as you navigate the grid.
                      </p>
                      <NeonButton active onClick={toggleDetach}>
                        <Minimize2 size={16} /> Restore to Console
                      </NeonButton>
                    </GlassCard>
                  ) : (
                    <div className="h-full rounded-2xl overflow-hidden shadow-2xl relative">
                      <Fetchat
                        activeUser={activeUser}
                        onSelectUser={setActiveUser}
                        isDetached={false}
                        onToggleDetach={toggleDetach}
                        onStartVideoCall={handleStartVideoCall}
                      />
                    </div>
                  )}
                </motion.div>
              )}

              {/* 1.5 FRAME (New Group Hub) */}
              {activeTab === 'frame' && (
                <motion.div key="frame" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full">
                  <div className="h-full rounded-2xl overflow-hidden shadow-2xl relative p-1 bg-white/5 backdrop-blur-sm border border-white/10">
                    <Frame />
                  </div>
                </motion.div>
              )}

              {/* 2. TO DO */}
              {activeTab === 'todo' && (
                <motion.div key="todo" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full">
                  <ToDoListModule />
                </motion.div>
              )}

              {/* 3. NOTES */}
              {activeTab === 'notes' && (
                <motion.div key="notes" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full">
                  <GlassCard className="h-full overflow-hidden" noPadding>
                    <DigitalNotebook />
                  </GlassCard>
                </motion.div>
              )}

              {/* 4. VAULT */}
              {activeTab === 'vault' && (
                <motion.div key="vault" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full">
                  <GlassCard className="h-full overflow-hidden" noPadding>
                    <FetsVault />
                  </GlassCard>
                </motion.div>
              )}

              {/* 5. PROFILE (NEW) */}
              {activeTab === 'profile' && (
                <motion.div key="profile" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full">
                  <GlassCard className="h-full overflow-hidden" noPadding>
                    <FetsProfile />
                  </GlassCard>
                </motion.div>
              )}

              {/* 6. LEAVE & ROSTER ACTIONS */}
              {activeTab === 'leave-submission' && (
                <motion.div key="leave-submission" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full">
                  <LeaveSubmissionModule />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>

      </div>
    </div>
  )
}
