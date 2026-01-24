import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckSquare, User, Video, Calendar, FileText, Send,
  X, Camera, Lock, LogOut, Mail, MapPin, Briefcase,
  Sparkles, Clock, ChevronRight, Plus, AlertCircle
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useBranch } from '../hooks/useBranch'
import { format } from 'date-fns'
import { supabase } from '../lib/supabase'
import { toast } from 'react-hot-toast'

// Feature Components
import { ToDoMatrix } from './ToDoMatrix'
import Frame from './Frame'

// --- Card Component ---
const Card = ({ children, className = "", gradient = false }: { 
  children: React.ReactNode, 
  className?: string,
  gradient?: boolean
}) => (
  <div className={`
    ${gradient 
      ? 'bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50' 
      : 'bg-white'
    }
    rounded-2xl shadow-lg shadow-amber-500/5 border border-amber-100/50
    ${className}
  `}>
    {children}
  </div>
)

// --- Leave Request Modal ---
const LeaveRequestModal = ({ onClose }: { onClose: () => void }) => {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    leave_type: 'casual',
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: format(new Date(), 'yyyy-MM-dd'),
    reason: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.reason.trim()) {
      toast.error('Please provide a reason')
      return
    }
    
    setLoading(true)
    try {
      const { error } = await supabase.from('leave_requests').insert({
        user_id: profile?.id,
        user_name: profile?.full_name,
        leave_type: formData.leave_type,
        start_date: formData.start_date,
        end_date: formData.end_date,
        reason: formData.reason,
        status: 'pending'
      })
      
      if (error) throw error
      toast.success('Leave request submitted!')
      onClose()
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit request')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Calendar size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">Request Leave</h3>
              <p className="text-white/70 text-xs">Submit your leave application</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Leave Type</label>
            <select
              value={formData.leave_type}
              onChange={(e) => setFormData(prev => ({ ...prev, leave_type: e.target.value }))}
              className="w-full px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            >
              <option value="casual">Casual Leave</option>
              <option value="sick">Sick Leave</option>
              <option value="emergency">Emergency Leave</option>
              <option value="vacation">Vacation</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Start Date</label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                className="w-full px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">End Date</label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                className="w-full px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Reason</label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              placeholder="Describe your reason for leave..."
              rows={4}
              className="w-full px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-4 rounded-xl uppercase tracking-wider text-sm hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? 'Submitting...' : (
              <>
                <Send size={18} />
                Submit Request
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  )
}

// --- Profile Picture Upload Modal ---
const ProfilePictureModal = ({ onClose, currentUrl }: { onClose: () => void, currentUrl?: string }) => {
  const { profile } = useAuth()
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentUrl || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Preview
    const reader = new FileReader()
    reader.onloadend = () => setPreview(reader.result as string)
    reader.readAsDataURL(file)

    // Upload
    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `avatars/${profile?.id}.${ext}`
      
      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(path, file, { upsert: true })
      
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(path)

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profile?.id)

      if (updateError) throw updateError
      
      toast.success('Profile picture updated!')
      onClose()
    } catch (err: any) {
      toast.error(err.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Camera size={20} className="text-white" />
            <h3 className="text-white font-bold">Change Photo</h3>
          </div>
          <button onClick={onClose} className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col items-center">
          {/* Preview */}
          <div className="relative mb-6">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center overflow-hidden border-4 border-white shadow-xl">
              {preview ? (
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <User size={48} className="text-white" />
              )}
            </div>
            {uploading && (
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-4 rounded-xl uppercase tracking-wider text-sm hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Camera size={18} />
            {uploading ? 'Uploading...' : 'Choose Photo'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// --- Password Update Modal ---
const PasswordModal = ({ onClose }: { onClose: () => void }) => {
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      toast.success('Password updated successfully!')
      onClose()
    } catch (error: any) {
      toast.error(error.message || 'Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4 flex items-center justify-between">
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
              className="w-full px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              placeholder="Enter new password"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-3 rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50"
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
  const [showPhotoModal, setShowPhotoModal] = useState(false)
  const [showLeaveModal, setShowLeaveModal] = useState(false)

  const roleLabels: Record<string, string> = {
    super_admin: 'Super Admin',
    roster_manager: 'Admin',
    staff: 'FETSIAN'
  }

  return (
    <>
      <Card className="h-full flex flex-col" gradient>
        {/* Profile Header */}
        <div className="p-6 text-center border-b border-amber-100">
          {/* Avatar with edit button */}
          <div className="relative inline-block mb-4">
            <div 
              className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center overflow-hidden shadow-xl shadow-amber-500/20 cursor-pointer group"
              onClick={() => setShowPhotoModal(true)}
            >
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-black text-white uppercase">
                  {profile?.full_name?.charAt(0) || '?'}
                </span>
              )}
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera size={24} className="text-white" />
              </div>
            </div>
            {/* Online indicator */}
            <div className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 rounded-full border-3 border-white shadow-lg" />
          </div>
          
          {/* Name & Role */}
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-1">
            {profile?.full_name || 'Unknown'}
          </h2>
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md">
            {roleLabels[profile?.role] || 'Staff'}
          </span>
        </div>

        {/* Profile Details */}
        <div className="flex-1 p-5 space-y-3 overflow-auto">
          {profile?.email && (
            <div className="flex items-center gap-3 p-3 bg-white/70 rounded-xl border border-amber-100">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                <Mail size={14} className="text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Email</p>
                <p className="text-xs font-semibold text-slate-700 truncate">{profile.email}</p>
              </div>
            </div>
          )}
          
          {profile?.branch_location && (
            <div className="flex items-center gap-3 p-3 bg-white/70 rounded-xl border border-amber-100">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                <MapPin size={14} className="text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Branch</p>
                <p className="text-xs font-semibold text-slate-700 capitalize">{profile.branch_location}</p>
              </div>
            </div>
          )}
          
          {profile?.department && (
            <div className="flex items-center gap-3 p-3 bg-white/70 rounded-xl border border-amber-100">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                <Briefcase size={14} className="text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Department</p>
                <p className="text-xs font-semibold text-slate-700">{profile.department}</p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-amber-100 space-y-2">
          <button
            onClick={() => setShowLeaveModal(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all shadow-md"
          >
            <Calendar size={14} />
            Request Leave
          </button>
          <button
            onClick={() => setShowPasswordModal(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-slate-600 font-semibold text-xs uppercase tracking-wider rounded-xl hover:bg-slate-50 border border-amber-200 transition-all"
          >
            <Lock size={14} />
            Change Password
          </button>
          <button
            onClick={onSignOut}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-50 text-rose-600 font-semibold text-xs uppercase tracking-wider rounded-xl hover:bg-rose-100 transition-all"
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </Card>

      <AnimatePresence>
        {showPasswordModal && <PasswordModal onClose={() => setShowPasswordModal(false)} />}
        {showPhotoModal && <ProfilePictureModal onClose={() => setShowPhotoModal(false)} currentUrl={profile?.avatar_url} />}
        {showLeaveModal && <LeaveRequestModal onClose={() => setShowLeaveModal(false)} />}
      </AnimatePresence>
    </>
  )
}

// --- Menu Button ---
const MenuButton = ({ 
  item, 
  isActive, 
  onClick 
}: { 
  item: { id: string; label: string; icon: any }
  isActive: boolean
  onClick: () => void 
}) => (
  <motion.button
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={`
      flex items-center gap-3 px-6 py-3.5 rounded-xl font-bold text-sm uppercase tracking-wide transition-all
      ${isActive 
        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25' 
        : 'bg-white text-slate-600 hover:bg-amber-50 hover:text-amber-700 border border-amber-100'
      }
    `}
  >
    <item.icon size={18} />
    <span>{item.label}</span>
  </motion.button>
)

// --- MAIN COMPONENT ---
export function MyDeskNew() {
  const { profile, signOut } = useAuth()
  const { activeBranch } = useBranch()
  const [activeTab, setActiveTab] = useState('todo')

  const menuItems = [
    { id: 'todo', label: 'To Do', icon: CheckSquare },
    { id: 'frame', label: 'Frame', icon: Video },
    { id: 'profile', label: 'Profile', icon: User }
  ]

  return (
    <div
      className="min-h-screen p-4 lg:p-6 relative overflow-hidden"
      style={{
        fontFamily: "'Montserrat', sans-serif",
        background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 50%, #fde68a 100%)'
      }}
    >
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-orange-300/20 to-amber-400/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-yellow-300/20 to-amber-300/20 rounded-full blur-3xl pointer-events-none" />

      {/* Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, #92400e 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }}
      />

      {/* Main Layout */}
      <div className="max-w-[1600px] mx-auto relative z-10">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/30">
                <Sparkles size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-800 uppercase">
                  MY <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-600">DESK</span>
                </h1>
                <p className="text-xs font-bold text-amber-700/60 uppercase tracking-widest">{format(new Date(), 'EEEE, MMMM dd, yyyy')}</p>
              </div>
            </div>

            {/* Location Badge */}
            <div className="flex items-center gap-3 px-5 py-2.5 bg-white/80 rounded-xl border border-amber-200 shadow-sm">
              <MapPin size={14} className="text-amber-600" />
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">{activeBranch || 'Global'}</span>
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-md shadow-emerald-500/50" />
            </div>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <Card className="p-3 inline-flex items-center gap-2 flex-wrap">
            {menuItems.map(item => (
              <MenuButton
                key={item.id}
                item={item}
                isActive={activeTab === item.id}
                onClick={() => setActiveTab(item.id)}
              />
            ))}
          </Card>
        </motion.div>

        {/* Content Area */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="min-h-[calc(100vh-220px)]"
        >
          <AnimatePresence mode="wait">
            {activeTab === 'todo' && (
              <motion.div
                key="todo"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <ToDoMatrix />
              </motion.div>
            )}

            {activeTab === 'frame' && (
              <motion.div
                key="frame"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Frame />
              </motion.div>
            )}

            {activeTab === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-md mx-auto"
              >
                <ProfilePanel profile={profile} onSignOut={signOut} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Version Badge */}
      <div className="fixed bottom-4 right-4 z-10">
        <div className="px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full border border-amber-200 shadow-sm">
          <span className="text-[9px] font-bold text-amber-600 uppercase tracking-widest">
            FETS My Desk v4.1
          </span>
        </div>
      </div>
    </div>
  )
}

export default MyDeskNew
