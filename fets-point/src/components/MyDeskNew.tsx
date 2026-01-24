import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckSquare, User, Video, Calendar, Send,
  X, Camera, Lock, LogOut, Mail, MapPin, Briefcase,
  GraduationCap, Award, Clock
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useBranch } from '../hooks/useBranch'
import { format } from 'date-fns'
import { supabase } from '../lib/supabase'
import { toast } from 'react-hot-toast'

// Feature Components
import { ToDoMatrix } from './ToDoMatrix'
import Frame from './Frame'

// --- Enhanced Button Component (from Uiverse) ---
const EnhancedButton = ({ 
  icon: Icon, 
  label, 
  onClick, 
  isActive,
  notification = false 
}: { 
  icon: any
  label: string
  onClick: () => void
  isActive?: boolean
  notification?: boolean
}) => (
  <button
    onClick={onClick}
    className={`
      relative group text-slate-950 transition-all flex items-center justify-center whitespace-nowrap 
      rounded-lg hover:rotate-[3deg] will-change-transform duration-300 
      shadow-lg hover:shadow-xl h-14 text-lg pl-[5rem] pr-6 
      ${isActive 
        ? 'bg-amber-500 shadow-amber-500/40 hover:shadow-amber-500/50' 
        : 'bg-yellow-400 shadow-yellow-400/30 hover:shadow-yellow-400/40'
      }
    `}
  >
    <div
      className={`
        absolute left-0 top-0 mt-1 ml-1 bg-white text-slate-950 p-[0.35rem] bottom-1 
        group-hover:w-[calc(100%-0.5rem)] transition-all rounded-md duration-300 h-12 w-12
        flex items-center justify-center
      `}
    >
      <Icon size={24} strokeWidth={2} />
    </div>

    <div className="font-bold uppercase tracking-wide">{label}</div>

    {notification && (
      <>
        <div className="bg-orange-400 absolute flex rounded-full animate-ping opacity-75 h-5 w-5 -top-2 -right-2" />
        <div className="bg-orange-600 absolute flex rounded-full scale-[90%] h-5 w-5 -top-2 -right-2" />
      </>
    )}
  </button>
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
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar size={20} className="text-white" />
            <div>
              <h3 className="text-white font-bold text-lg">Request Leave</h3>
              <p className="text-white/70 text-xs">Submit your leave application</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Leave Type</label>
            <select
              value={formData.leave_type}
              onChange={(e) => setFormData(prev => ({ ...prev, leave_type: e.target.value }))}
              className="w-full px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
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
                className="w-full px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">End Date</label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                className="w-full px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20"
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
              className="w-full px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-4 rounded-xl uppercase tracking-wider text-sm hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? 'Submitting...' : <><Send size={18} /> Submit Request</>}
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

    const reader = new FileReader()
    reader.onloadend = () => setPreview(reader.result as string)
    reader.readAsDataURL(file)

    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `avatars/${profile?.id}.${ext}`
      
      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(path, file, { upsert: true })
      
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('profiles').getPublicUrl(path)

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
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Camera size={20} className="text-white" />
            <h3 className="text-white font-bold">Change Photo</h3>
          </div>
          <button onClick={onClose} className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 flex flex-col items-center">
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

// --- Password Modal ---
const PasswordModal = ({ onClose }: { onClose: () => void }) => {
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      toast.success('Password updated!')
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
          <button onClick={onClose} className="text-white/80 hover:text-white"><X size={20} /></button>
        </div>
        <form onSubmit={handleUpdate} className="p-6 space-y-4">
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            placeholder="Enter new password"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-3 rounded-xl hover:from-amber-600 hover:to-orange-600 disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </motion.div>
    </div>
  )
}

// --- Profile Panel (when clicked) ---
const ProfilePanel = ({ profile, onClose, onSignOut }: { profile: any, onClose: () => void, onSignOut: () => void }) => {
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
      <motion.div
        initial={{ opacity: 0, x: 300 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 300 }}
        className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-40 overflow-y-auto"
      >
        {/* Header */}
        <div className="bg-gradient-to-br from-amber-400 via-yellow-400 to-orange-400 p-8 text-center relative">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 text-white/80 hover:text-white bg-white/10 rounded-full">
            <X size={20} />
          </button>
          
          {/* Avatar */}
          <div 
            className="relative inline-block mb-4 cursor-pointer group"
            onClick={() => setShowPhotoModal(true)}
          >
            <div className="w-28 h-28 rounded-full bg-white flex items-center justify-center overflow-hidden shadow-xl border-4 border-white">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-black text-amber-500 uppercase">
                  {profile?.full_name?.charAt(0) || '?'}
                </span>
              )}
            </div>
            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera size={28} className="text-white" />
            </div>
            <div className="absolute bottom-1 right-1 w-6 h-6 bg-emerald-500 rounded-full border-2 border-white shadow flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full" />
            </div>
          </div>
          
          <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-1 drop-shadow-md">
            {profile?.full_name || 'Unknown'}
          </h2>
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest bg-white/20 text-white backdrop-blur-sm">
            {roleLabels[profile?.role] || 'Staff'}
          </span>
        </div>

        {/* Details */}
        <div className="p-6 space-y-4">
          {profile?.email && (
            <div className="flex items-center gap-4 p-4 bg-amber-50 rounded-xl border border-amber-100">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Mail size={18} className="text-amber-600" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-amber-600/60 uppercase tracking-wider">Email</p>
                <p className="text-sm font-semibold text-slate-700">{profile.email}</p>
              </div>
            </div>
          )}
          
          {profile?.branch_location && (
            <div className="flex items-center gap-4 p-4 bg-amber-50 rounded-xl border border-amber-100">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <MapPin size={18} className="text-amber-600" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-amber-600/60 uppercase tracking-wider">Location</p>
                <p className="text-sm font-semibold text-slate-700 capitalize">{profile.branch_location}</p>
              </div>
            </div>
          )}
          
          {profile?.department && (
            <div className="flex items-center gap-4 p-4 bg-amber-50 rounded-xl border border-amber-100">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Briefcase size={18} className="text-amber-600" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-amber-600/60 uppercase tracking-wider">Designation</p>
                <p className="text-sm font-semibold text-slate-700">{profile.department}</p>
              </div>
            </div>
          )}

          {profile?.qualifications && (
            <div className="flex items-center gap-4 p-4 bg-amber-50 rounded-xl border border-amber-100">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <GraduationCap size={18} className="text-amber-600" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-amber-600/60 uppercase tracking-wider">Certifications</p>
                <p className="text-sm font-semibold text-slate-700">{profile.qualifications}</p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 pt-0 space-y-3">
          <button
            onClick={() => setShowLeaveModal(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-sm uppercase tracking-wider rounded-xl hover:from-amber-600 hover:to-orange-600 shadow-lg"
          >
            <Calendar size={18} />
            Request Leave
          </button>
          <button
            onClick={() => setShowPasswordModal(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 text-slate-700 font-semibold text-sm uppercase tracking-wider rounded-xl hover:bg-slate-200"
          >
            <Lock size={16} />
            Change Password
          </button>
          <button
            onClick={onSignOut}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-rose-50 text-rose-600 font-semibold text-sm uppercase tracking-wider rounded-xl hover:bg-rose-100"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </motion.div>

      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/30 z-30"
      />

      <AnimatePresence>
        {showPasswordModal && <PasswordModal onClose={() => setShowPasswordModal(false)} />}
        {showPhotoModal && <ProfilePictureModal onClose={() => setShowPhotoModal(false)} currentUrl={profile?.avatar_url} />}
        {showLeaveModal && <LeaveRequestModal onClose={() => setShowLeaveModal(false)} />}
      </AnimatePresence>
    </>
  )
}

// --- MAIN COMPONENT ---
export function MyDeskNew() {
  const { profile, signOut } = useAuth()
  const { activeBranch } = useBranch()
  const [activeTab, setActiveTab] = useState('todo')
  const [showProfile, setShowProfile] = useState(false)

  const roleLabels: Record<string, string> = {
    super_admin: 'Super Admin',
    roster_manager: 'Admin',
    staff: 'FETSIAN'
  }

  return (
    <div
      className="min-h-screen p-4 lg:p-6 relative overflow-hidden"
      style={{
        fontFamily: "'Montserrat', sans-serif",
        background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 50%, #fde68a 100%)'
      }}
    >
      {/* Decorative Background */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-orange-300/20 to-amber-400/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-yellow-300/20 to-amber-300/20 rounded-full blur-3xl pointer-events-none" />

      {/* Notebook Lines Pattern */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            repeating-linear-gradient(
              transparent,
              transparent 31px,
              rgba(180, 140, 100, 0.08) 31px,
              rgba(180, 140, 100, 0.08) 32px
            )
          `,
          backgroundSize: '100% 32px'
        }}
      />

      {/* Red Margin Line */}
      <div 
        className="absolute left-16 md:left-24 top-0 bottom-0 w-[2px] pointer-events-none"
        style={{ background: 'rgba(220, 80, 80, 0.15)' }}
      />

      {/* Main Layout */}
      <div className="max-w-[1600px] mx-auto relative z-10">
        
        {/* Header with Profile */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* Left: Profile Info */}
            <div 
              className="flex items-center gap-4 cursor-pointer group"
              onClick={() => setShowProfile(true)}
            >
              {/* Profile Picture */}
              <div className="relative">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center overflow-hidden shadow-xl shadow-amber-500/30 group-hover:scale-105 transition-transform">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl md:text-3xl font-black text-white uppercase">
                      {profile?.full_name?.charAt(0) || '?'}
                    </span>
                  )}
                </div>
                {/* Online Indicator */}
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-3 border-white shadow-lg" />
              </div>

              {/* Name & Details */}
              <div>
                <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-800 uppercase group-hover:text-amber-700 transition-colors">
                  {profile?.full_name || 'Welcome'}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-wider rounded-full">
                    {roleLabels[profile?.role] || 'Staff'}
                  </span>
                  <span className="text-xs text-slate-500">•</span>
                  <span className="text-xs font-semibold text-slate-500 capitalize">{profile?.branch_location || 'FETS'}</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
                  Click to view profile
                </p>
              </div>
            </div>

            {/* Right: Date & Time */}
            <div className="text-right">
              <p className="text-lg font-black text-slate-800 uppercase tracking-tight">
                {format(new Date(), 'EEEE')}
              </p>
              <p className="text-xs font-bold text-amber-600/70 uppercase tracking-widest">
                {format(new Date(), 'MMMM dd, yyyy')}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Navigation Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 flex flex-wrap gap-4"
        >
          <EnhancedButton
            icon={CheckSquare}
            label="TO DO"
            onClick={() => setActiveTab('todo')}
            isActive={activeTab === 'todo'}
            notification={true}
          />
          <EnhancedButton
            icon={Video}
            label="FRAME"
            onClick={() => setActiveTab('frame')}
            isActive={activeTab === 'frame'}
          />
        </motion.div>

        {/* Content Area */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="min-h-[calc(100vh-280px)]"
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
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Profile Slide-out Panel */}
      <AnimatePresence>
        {showProfile && (
          <ProfilePanel 
            profile={profile} 
            onClose={() => setShowProfile(false)} 
            onSignOut={signOut}
          />
        )}
      </AnimatePresence>

      {/* Version Badge */}
      <div className="fixed bottom-4 right-4 z-10">
        <div className="px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full border border-amber-200 shadow-sm">
          <span className="text-[9px] font-bold text-amber-600 uppercase tracking-widest">
            FETS My Desk v4.2
          </span>
        </div>
      </div>
    </div>
  )
}

export default MyDeskNew
