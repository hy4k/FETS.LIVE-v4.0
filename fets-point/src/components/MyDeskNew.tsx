import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Lock, LogOut, ShieldCheck, Mail, MapPin, Briefcase, GraduationCap,
  CheckSquare, X, BookOpen, Key,
  Sparkles, History, ExternalLink, Edit3, Save
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useBranch } from '../hooks/useBranch'
import { format } from 'date-fns'
import { supabase } from '../lib/supabase'
import { toast } from 'react-hot-toast'

// Feature Components
import { ToDoMatrix } from './ToDoMatrix'
import { DigitalNotebook } from './DigitalNotebook'
import { DailyLog } from './DailyLog'
import { getActiveRosterHandlerEmail } from '../utils/authUtils'
import { UserCheck, FileText, ClipboardCheck, Clock, Target, TrendingUp } from 'lucide-react'

// --- Premium Glass Card ---
const GlassCard = ({ children, className = "", accent = "default" }: { 
  children: React.ReactNode, 
  className?: string,
  accent?: "default" | "primary" | "success" | "warning"
}) => {
  const accentStyles = {
    default: "border-slate-200/50",
    primary: "border-blue-200/50 shadow-blue-500/5",
    success: "border-emerald-200/50 shadow-emerald-500/5",
    warning: "border-amber-200/50 shadow-amber-500/5"
  }
  
  return (
    <div className={`
      bg-white/90 backdrop-blur-xl rounded-2xl 
      shadow-[0_8px_32px_rgba(0,0,0,0.08)] 
      border ${accentStyles[accent]}
      ${className}
    `}>
      {children}
    </div>
  )
}

// --- Password Update Modal ---
const PasswordModal = ({ onClose }: { onClose: () => void }) => {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      toast.success('Password updated successfully')
      onClose()
    } catch (error: any) {
      toast.error(error.message || 'Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Lock size={20} className="text-white" />
            <h3 className="text-white font-bold">Update Password</h3>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleUpdate} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              placeholder="Enter new password"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </motion.div>
    </div>
  )
}

// --- Profile Panel ---
const ProfilePanel = ({ profile, onSignOut }: { profile: any, onSignOut: () => void }) => {
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  
  const roleLabels: Record<string, string> = {
    super_admin: 'Super Admin',
    roster_manager: 'Admin',
    staff: 'FETSIAN'
  }

  const getRoleColor = (role: string) => {
    switch(role) {
      case 'super_admin': return 'from-violet-500 to-purple-600'
      case 'roster_manager': return 'from-blue-500 to-blue-600'
      default: return 'from-emerald-500 to-teal-600'
    }
  }

  return (
    <>
      <GlassCard className="h-full flex flex-col" accent="primary">
        {/* Profile Header */}
        <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 border-b border-slate-100 text-center">
          {/* Avatar */}
          <div className="relative inline-block mb-4">
            <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${getRoleColor(profile?.role)} flex items-center justify-center shadow-lg`}>
              <span className="text-2xl font-black text-white uppercase">
                {profile?.full_name?.charAt(0) || '?'}
              </span>
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white shadow-sm flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full" />
            </div>
          </div>
          
          {/* Name & Role */}
          <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-1">
            {profile?.full_name || 'Unknown'}
          </h2>
          <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-gradient-to-r ${getRoleColor(profile?.role)} text-white`}>
            {roleLabels[profile?.role] || 'Staff'}
          </span>
        </div>

        {/* Profile Details */}
        <div className="flex-1 p-5 space-y-3 overflow-auto">
          {profile?.email && (
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <Mail size={14} className="text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Email</p>
                <p className="text-xs font-semibold text-slate-700 truncate">{profile.email}</p>
              </div>
            </div>
          )}
          
          {profile?.branch_location && (
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <MapPin size={14} className="text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Branch</p>
                <p className="text-xs font-semibold text-slate-700 capitalize">{profile.branch_location}</p>
              </div>
            </div>
          )}
          
          {profile?.department && (
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                <Briefcase size={14} className="text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Department</p>
                <p className="text-xs font-semibold text-slate-700">{profile.department}</p>
              </div>
            </div>
          )}

          {profile?.qualifications && (
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                <GraduationCap size={14} className="text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Qualifications</p>
                <p className="text-xs font-semibold text-slate-700 truncate">{profile.qualifications}</p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-slate-100 space-y-2">
          <button
            onClick={() => setShowPasswordModal(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs uppercase tracking-wider rounded-xl transition-all"
          >
            <Lock size={14} />
            Change Password
          </button>
          <button
            onClick={onSignOut}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold text-xs uppercase tracking-wider rounded-xl transition-all"
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </GlassCard>

      <AnimatePresence>
        {showPasswordModal && <PasswordModal onClose={() => setShowPasswordModal(false)} />}
      </AnimatePresence>
    </>
  )
}

// --- Roster Reporting Module ---
const RosterReportingModule = () => {
  const { profile } = useAuth()
  const [reportText, setReportText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reportText.trim()) return
    
    setSubmitting(true)
    try {
      const handlerEmail = getActiveRosterHandlerEmail()
      const { error } = await supabase.from('roster_reports').insert({
        reporter_id: profile?.id,
        reporter_name: profile?.full_name,
        report_content: reportText,
        handler_email: handlerEmail,
        status: 'pending'
      })
      
      if (error) throw error
      toast.success('Report submitted successfully!')
      setReportText('')
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit report')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <GlassCard className="h-full flex flex-col" accent="warning">
      <div className="p-5 border-b border-slate-100 bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
            <FileText size={20} className="text-white" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Roster Report</h3>
            <p className="text-[10px] text-slate-500">Submit shift issues or updates</p>
          </div>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col p-5">
        <textarea
          value={reportText}
          onChange={(e) => setReportText(e.target.value)}
          placeholder="Describe any roster-related issues, shift swaps, or updates..."
          className="flex-1 w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 min-h-[200px]"
        />
        <button
          type="submit"
          disabled={submitting || !reportText.trim()}
          className="mt-4 w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-3 rounded-xl uppercase tracking-wider text-sm hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50"
        >
          {submitting ? 'Submitting...' : 'Submit Report'}
        </button>
      </form>
    </GlassCard>
  )
}

// --- Quick Stats Widget ---
const QuickStats = () => {
  const stats = [
    { label: 'Tasks Today', value: '5', icon: Target, color: 'from-blue-500 to-blue-600' },
    { label: 'Completed', value: '3', icon: ClipboardCheck, color: 'from-emerald-500 to-teal-500' },
    { label: 'Hours Logged', value: '6.5', icon: Clock, color: 'from-violet-500 to-purple-500' },
    { label: 'Streak', value: '12', icon: TrendingUp, color: 'from-amber-500 to-orange-500' }
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((stat, idx) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05 }}
        >
          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                <stat.icon size={18} className="text-white" />
              </div>
              <div>
                <p className="text-xl font-black text-slate-800">{stat.value}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      ))}
    </div>
  )
}

// --- Menu Button ---
const MenuButton = ({ 
  item, 
  isActive, 
  onClick 
}: { 
  item: { id: string; label: string; icon: any; color: string }
  isActive: boolean
  onClick: () => void 
}) => (
  <motion.button
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={`
      flex items-center gap-3 px-5 py-3 rounded-xl font-bold text-sm uppercase tracking-wide transition-all
      ${isActive 
        ? `bg-gradient-to-r ${item.color} text-white shadow-lg` 
        : 'bg-white/80 text-slate-600 hover:bg-white hover:text-slate-800 border border-slate-200/50'
      }
    `}
  >
    <item.icon size={18} />
    <span>{item.label}</span>
    {isActive && (
      <motion.div
        layoutId="activeIndicator"
        className="ml-auto w-2 h-2 bg-white rounded-full"
      />
    )}
  </motion.button>
)

// --- MAIN COMPONENT ---
export function MyDeskNew() {
  const { profile, signOut } = useAuth()
  const { activeBranch } = useBranch()
  const [activeTab, setActiveTab] = useState('todo')

  const menuItems = [
    { id: 'todo', label: 'To Do', icon: CheckSquare, color: 'from-blue-500 to-blue-600' },
    { id: 'notes', label: 'Notes', icon: BookOpen, color: 'from-violet-500 to-purple-600' },
    { id: 'roster-report', label: 'Roster Report', icon: UserCheck, color: 'from-amber-500 to-orange-500' },
    { id: 'log', label: 'Daily Log', icon: History, color: 'from-emerald-500 to-teal-600' }
  ]

  return (
    <div
      className="min-h-screen p-4 lg:p-6 relative overflow-hidden"
      style={{
        fontFamily: "'Montserrat', sans-serif",
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f1f5f9 100%)'
      }}
    >
      {/* Subtle Background Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.4] pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 30%, rgba(59, 130, 246, 0.08) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(139, 92, 246, 0.08) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.05) 0%, transparent 50%)
          `
        }}
      />

      {/* Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, #334155 1px, transparent 0)',
          backgroundSize: '32px 32px'
        }}
      />

      {/* Main Layout */}
      <div className="flex flex-col lg:flex-row gap-5 lg:gap-6 h-[calc(100vh-2rem)] lg:h-[calc(100vh-3rem)] max-w-[1920px] mx-auto relative z-10">

        {/* LEFT COLUMN: Profile Panel */}
        <div className="lg:w-[280px] xl:w-[320px] flex-shrink-0 flex flex-col">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/20">
                <Sparkles size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-lg font-black tracking-tight text-slate-800 uppercase">
                  MY <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600">DESK</span>
                </h1>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{format(new Date(), 'EEEE, MMM dd')}</p>
              </div>
            </div>
          </motion.div>

          {/* Profile Panel */}
          <div className="flex-1 min-h-0">
            <ProfilePanel profile={profile} onSignOut={signOut} />
          </div>
        </div>

        {/* RIGHT COLUMN: Workspace */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0">
          
          {/* Quick Stats Row */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5"
          >
            <QuickStats />
          </motion.div>
          
          {/* Menu Bar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-5"
          >
            <GlassCard className="p-2 flex items-center gap-2 flex-wrap">
              {menuItems.map(item => (
                <MenuButton
                  key={item.id}
                  item={item}
                  isActive={activeTab === item.id}
                  onClick={() => setActiveTab(item.id)}
                />
              ))}
              
              {/* Location Badge */}
              <div className="ml-auto flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-lg border border-slate-200/50">
                <MapPin size={12} className="text-slate-400" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{activeBranch || 'Global'}</span>
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
            </GlassCard>
          </motion.div>

          {/* Content Area */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex-1 min-h-0"
          >
            <AnimatePresence mode="wait">
              {activeTab === 'todo' && (
                <motion.div
                  key="todo"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="h-full"
                >
                  <ToDoMatrix />
                </motion.div>
              )}

              {activeTab === 'notes' && (
                <motion.div
                  key="notes"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="h-full"
                >
                  <DigitalNotebook />
                </motion.div>
              )}

              {activeTab === 'roster-report' && (
                <motion.div
                  key="roster-report"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="h-full"
                >
                  <RosterReportingModule />
                </motion.div>
              )}

              {activeTab === 'log' && (
                <motion.div
                  key="log"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="h-full"
                >
                  <DailyLog />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      {/* Floating Version Badge */}
      <div className="fixed bottom-4 right-4 z-10">
        <div className="px-3 py-1.5 bg-white/80 backdrop-blur-sm rounded-full border border-slate-200/50 shadow-sm">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
            FETS My Desk v4.0
          </span>
        </div>
      </div>
    </div>
  )
}

export default MyDeskNew
