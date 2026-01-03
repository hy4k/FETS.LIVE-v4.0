import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Lock, LogOut, ShieldCheck, Mail, MapPin, Briefcase, GraduationCap,
  CheckSquare, Info, X, MessageSquare,
  ExternalLink, Brain, BookOpen, Key, History, Sparkles
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useBranch } from '../hooks/useBranch'
import { supabase } from '../lib/supabase'
import { toast } from 'react-hot-toast'
import { format } from 'date-fns'
import { ProfilePictureUpload } from './ProfilePictureUpload'
import { Fetchat } from './Fetchat'
import { ToDoMatrix } from './ToDoMatrix'
import { DigitalNotebook } from './DigitalNotebook'
import { FetsVault } from './FetsVault'
import { DailyLog } from './DailyLog'

// --- Glassmorphism Components ---

const GlassCard = ({ children, className = "", glow = false }: { children: React.ReactNode, className?: string, glow?: boolean }) => (
  <div className={`
    relative backdrop-blur-xl bg-white/10 
    border border-white/20 
    shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]
    rounded-3xl overflow-hidden
    ${glow ? 'before:absolute before:inset-0 before:bg-gradient-to-br before:from-[#ffbf00]/10 before:via-transparent before:to-purple-500/10 before:pointer-events-none' : ''}
    ${className}
  `}>
    {children}
  </div>
)

const GlassInset = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`
    backdrop-blur-md bg-black/20 
    border border-white/10 
    rounded-xl
    ${className}
  `}>
    {children}
  </div>
)

const PremiumButton = ({ children, onClick, active = false, className = "", variant = "default" }: { children: React.ReactNode, onClick?: () => void, active?: boolean, className?: string, variant?: "default" | "danger" }) => {
  const baseClasses = `
    relative group overflow-hidden
    px-6 py-3 rounded-2xl
    font-black text-[10px] uppercase tracking-[0.2em]
    transition-all duration-500 ease-out
    flex items-center gap-3 justify-center
    cursor-pointer
    backdrop-blur-md
  `

  const variants = {
    default: active
      ? 'bg-gradient-to-r from-[#ffbf00] to-[#ff9500] text-black shadow-[0_0_40px_rgba(255,191,0,0.4)] border border-[#ffbf00]/50 translate-y-[-2px]'
      : 'bg-white/5 text-white/40 border border-white/5 hover:bg-white/10 hover:text-white hover:border-white/20 hover:shadow-[0_0_20px_rgba(255,255,255,0.05)]',
    danger: 'bg-gradient-to-r from-rose-500/10 to-rose-600/10 text-rose-400 border border-rose-500/20 hover:from-rose-500/20 hover:to-rose-600/20 hover:shadow-[0_0_20px_rgba(239,68,68,0.2)]'
  }

  return (
    <button onClick={onClick} className={`${baseClasses} ${variants[variant]} ${className}`}>
      {active && <div className="absolute inset-0 bg-gradient-to-r from-white/40 to-transparent animate-shimmer opacity-50" />}
      <span className="relative z-10 flex items-center gap-2.5">{children}</span>
    </button>
  )
}

const DetailRow = ({ label, value }: { label: string, value: string }) => (
  <div className="flex justify-between items-center text-[11px] py-1">
    <span className="font-medium text-white/50 uppercase tracking-wider">{label}</span>
    <span className="font-bold text-white/90 uppercase text-right">{value || '---'}</span>
  </div>
)

const PasswordModal = ({ onClose }: { onClose: () => void }) => {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) return toast.error('Passwords do not match')
    if (password.length < 6) return toast.error('Minimum 6 characters required')

    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      toast.success('Security Credentials Updated')
      onClose()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xl">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="w-full max-w-md"
      >
        <GlassCard className="p-8" glow>
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-[#ffbf00] to-[#ff9500] rounded-xl">
                <Lock size={18} className="text-black" />
              </div>
              Reset Security
            </h3>
            <button onClick={onClose} className="text-white/50 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-xl">
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleUpdate} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/50 uppercase tracking-widest ml-2">New Password</label>
              <GlassInset>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-transparent p-4 outline-none text-white font-medium placeholder:text-white/30"
                  placeholder="••••••••"
                  required
                />
              </GlassInset>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/50 uppercase tracking-widest ml-2">Confirm Credentials</label>
              <GlassInset>
                <input
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  className="w-full bg-transparent p-4 outline-none text-white font-medium placeholder:text-white/30"
                  placeholder="••••••••"
                  required
                />
              </GlassInset>
            </div>
            <PremiumButton className="w-full py-4" active>
              {loading ? 'SECURING...' : 'VERIFY & UPDATE'}
            </PremiumButton>
          </form>
        </GlassCard>
      </motion.div>
    </div>
  )
}

const ProfilePanel = ({ profile, onSignOut }: { profile: any, onSignOut: () => void }) => {
  const [showPasswordModal, setShowPasswordModal] = useState(false)

  // Helper for metrics
  const trainingCount = (profile?.trainings_attended?.length || 0)
  const certificateCount = (profile?.certificates?.length || 0)
  const futureTrainingCount = (profile?.future_trainings?.length || 0)
  const skillCount = (profile?.skills?.length || 0)

  return (
    <div className="h-full flex flex-col gap-4">
      {/* IDENTITY CARD */}
      <GlassCard className="p-6 relative overflow-hidden group" glow>
        <div className="absolute top-0 right-0 p-3 opacity-30">
          <ShieldCheck className="text-[#ffbf00] w-24 h-24 absolute -top-4 -right-4 blur-sm" />
        </div>

        <div className="relative z-10 flex flex-col items-center">
          <div className="relative mb-5 group-hover:scale-105 transition-transform duration-500">
            <div className="absolute inset-0 bg-[#ffbf00] rounded-full blur-md opacity-20 animate-pulse" />
            <div className="relative p-1 rounded-full border border-[#ffbf00]/30 bg-black/20 backdrop-blur-sm">
              <ProfilePictureUpload
                staffId={profile?.id || ''}
                staffName={profile?.full_name || 'User'}
                currentAvatarUrl={profile?.avatar_url}
                onAvatarUpdate={() => window.location.reload()}
              />
            </div>
            <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-black rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" title="Online" />
          </div>

          <h2 className="text-xl font-black text-white uppercase tracking-tight text-center leading-none mb-2">
            {profile?.full_name}
          </h2>

          <div className="flex flex-wrap justify-center gap-2 mb-4">
            <span className="px-3 py-1 rounded-lg bg-gradient-to-r from-[#ffbf00] to-[#ff9500] text-black text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[#ffbf00]/20">
              {profile?.role?.replace('_', ' ')}
            </span>
            <span className="px-3 py-1 rounded-lg bg-white/10 border border-white/10 text-white/70 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
              <MapPin size={10} /> {profile?.branch_assigned || 'Global'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 w-full mt-2">
            <GlassInset className="p-2.5 flex flex-col items-center justify-center bg-black/40">
              <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest mb-1">ID</span>
              <span className="text-[10px] font-mono text-white/90 truncate max-w-full">#{profile?.id?.slice(0, 8)}</span>
            </GlassInset>
            <GlassInset className="p-2.5 flex flex-col items-center justify-center bg-black/40">
              <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest mb-1">Joined</span>
              <span className="text-[10px] font-mono text-white/90">
                {profile?.joining_date ? format(new Date(profile.joining_date), 'MMM yyyy') : '--'}
              </span>
            </GlassInset>
          </div>
        </div>
      </GlassCard>

      {/* METRICS & DETAILS SCROLL AREA */}
      <GlassCard className="flex-1 p-0 overflow-hidden flex flex-col" glow>
        <div className="p-4 border-b border-white/5 bg-white/5 backdrop-blur-md">
          <h3 className="text-xs font-black text-white/60 uppercase tracking-[0.2em] flex items-center gap-2">
            <Info size={14} className="text-[#ffbf00]" />
            Professional Vitals
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">

          {/* Contact & Position */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group/item">
              <div className="p-2 rounded-lg bg-[#ffbf00]/10 text-[#ffbf00] flex-shrink-0">
                <Briefcase size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Designation</p>
                <p className="text-xs font-bold text-white truncate">{profile?.position || 'Not Assigned'}</p>
                <p className="text-[10px] text-white/50 truncate uppercase">{profile?.department || 'General'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group/item">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 flex-shrink-0">
                <Mail size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Communication</p>
                <p className="text-xs font-bold text-white truncate">{profile?.email}</p>
                {profile?.contact_number && (
                  <p className="text-[10px] text-white/50 mt-0.5 font-mono">{profile.contact_number}</p>
                )}
              </div>
            </div>
          </div>

          {/* Growth Metrics */}
          <div>
            <h4 className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-3 ml-1">Growth Index</h4>
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col items-center gap-1 text-emerald-400">
                <GraduationCap size={16} />
                <span className="text-xl font-black leading-none">{trainingCount}</span>
                <span className="text-[7px] font-bold uppercase tracking-wider text-emerald-500/60">Training</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#ffbf00]/10 border border-[#ffbf00]/20 flex flex-col items-center gap-1 text-[#ffbf00]">
                <Sparkles size={16} />
                <span className="text-xl font-black leading-none">{certificateCount}</span>
                <span className="text-[7px] font-bold uppercase tracking-wider text-[#ffbf00]/60">Awards</span>
              </div>
              <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 flex flex-col items-center gap-1 text-purple-400">
                <Brain size={16} />
                <span className="text-xl font-black leading-none">{skillCount}</span>
                <span className="text-[7px] font-bold uppercase tracking-wider text-purple-500/60">Skills</span>
              </div>
            </div>
          </div>

          {/* Skills Tags */}
          {profile?.skills?.length > 0 && (
            <div>
              <h4 className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-3 ml-1">Expertise Matrix</h4>
              <div className="flex flex-wrap gap-1.5">
                {profile.skills.map((s: string, idx: number) => (
                  <span key={idx} className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[9px] font-bold text-white/70 uppercase">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Training Highlight */}
          {profile?.future_trainings?.length > 0 && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
              <div className="flex items-center gap-2 mb-2 text-rose-400">
                <History size={14} className="animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-widest">Next Up</span>
              </div>
              <p className="text-xs font-bold text-white truncate">
                {typeof profile.future_trainings[0] === 'string' ? profile.future_trainings[0] : 'Upcoming Session'}
              </p>
              {futureTrainingCount > 1 && (
                <p className="text-[9px] text-white/40 mt-1">+{futureTrainingCount - 1} more scheduled</p>
              )}
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="p-4 bg-black/20 border-t border-white/5 space-y-3">
          <PremiumButton onClick={() => setShowPasswordModal(true)} className="w-full">
            <Lock size={12} /> Manage Security
          </PremiumButton>
          <PremiumButton onClick={onSignOut} variant="danger" className="w-full">
            <LogOut size={12} /> End Session
          </PremiumButton>
        </div>
      </GlassCard>

      <AnimatePresence>
        {showPasswordModal && (
          <PasswordModal onClose={() => setShowPasswordModal(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}

const PageStyles = () => (
  <style dangerouslySetInnerHTML={{
    __html: `
      @keyframes shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }
      
      .animate-shimmer {
        animation: shimmer 2s infinite;
      }

      .custom-scrollbar::-webkit-scrollbar {
        width: 4px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 10px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: rgba(255, 191, 0, 0.3);
        border-radius: 10px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 191, 0, 0.5);
      }
    `
  }} />
)

export function MyDeskNew() {
  const { profile, signOut } = useAuth()
  const { activeBranch } = useBranch()
  const [activeRightTab, setActiveRightTab] = useState('todo')
  const [isFetchatDetached, setIsFetchatDetached] = useState(false)
  const [fetchatActiveUser, setFetchatActiveUser] = useState<any>(null) // State for persisted chat session

  const menuItems = [
    { id: 'todo', label: 'TO DO', icon: CheckSquare },
    { id: 'fetchat', label: 'FETCHAT', icon: MessageSquare },
    { id: 'notes', label: 'NOTES', icon: BookOpen },
    { id: 'vault', label: 'VAULT', icon: Key }
  ]

  return (
    <>
      <PageStyles />
      <div
        className="min-h-screen p-4 lg:p-6 relative overflow-hidden"
        style={{
          fontFamily: "'Montserrat', sans-serif",
          background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #16213e 100%)'
        }}
      >
        {/* Animated Background Gradients */}
        <div className="absolute top-0 left-0 w-[50%] h-[50%] bg-gradient-to-br from-[#ffbf00]/8 via-transparent to-transparent blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[50%] h-[50%] bg-gradient-to-tl from-purple-500/8 via-transparent to-transparent blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30%] h-[30%] bg-blue-500/5 blur-[80px] rounded-full pointer-events-none" />

        {/* Grid Pattern Overlay */}
        <div
          className="absolute inset-0 opacity-[0.02] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }}
        />

        {/* Main Layout */}
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 h-[calc(100vh-2rem)] lg:h-[calc(100vh-3rem)] max-w-[1920px] mx-auto relative z-10">

          {/* LEFT COLUMN: Profile Panel - Compact */}
          <div className="lg:w-[280px] xl:w-[320px] flex-shrink-0 flex flex-col">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 flex items-center gap-3"
            >
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#ffbf00] to-[#ff9500] shadow-[0_0_30px_rgba(255,191,0,0.3)]">
                <Sparkles size={20} className="text-black" />
              </div>
              <div>
                <h1 className="text-lg font-black tracking-tight text-white uppercase">
                  MY <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ffbf00] to-[#ff9500]">DESK</span>
                </h1>
                <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">{format(new Date(), 'EEEE, MMM dd')}</p>
              </div>
            </motion.div>

            {/* Profile Panel */}
            <div className="flex-1 min-h-0">
              <ProfilePanel profile={profile} onSignOut={signOut} />
            </div>
          </div>

          {/* RIGHT COLUMN: Feature Hub - Takes Remaining Space */}
          <div className="flex-1 flex flex-col min-h-0 min-w-0">
            {/* Menu Bar */}
            <div className="flex items-center justify-between mb-6 gap-4">
              {/* Glass Container for Menu */}
              <GlassCard className="flex-1 p-2 flex items-center gap-2 flex-wrap" glow>
                {menuItems.map(item => (
                  <PremiumButton
                    key={item.id}
                    onClick={() => setActiveRightTab(item.id)}
                    active={activeRightTab === item.id}
                    className="flex-1 min-w-[100px]"
                  >
                    <item.icon size={16} strokeWidth={2.5} />
                    <span className="hidden xl:inline">{item.label}</span>
                    <span className="xl:hidden">{item.label.split(' ')[0]}</span>
                    {item.id === 'fetchat' && (
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse absolute top-2 right-2" />
                    )}
                  </PremiumButton>
                ))}
              </GlassCard>

              {/* Status Indicators */}
              <div className="flex flex-col gap-2">
                <GlassInset className="px-5 py-2 flex items-center gap-2.5 bg-white/5 border-white/10">
                  <div className="md:flex hidden items-center justify-center w-5 h-5 rounded-full bg-[#ffbf00]/10 text-[#ffbf00]">
                    <MapPin size={10} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[7px] font-black text-white/30 uppercase tracking-widest">Location</span>
                    <span className="text-[10px] font-black text-white uppercase tracking-wider">{activeBranch}</span>
                  </div>
                  <div className="ml-2 w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse" />
                </GlassInset>

                <GlassInset className="px-5 py-2 flex items-center gap-2.5 bg-white/5 border-white/10">
                  <div className="md:flex hidden items-center justify-center w-5 h-5 rounded-full bg-purple-500/10 text-purple-400">
                    <History size={10} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[7px] font-black text-white/30 uppercase tracking-widest">Time</span>
                    <span className="text-[10px] font-mono font-bold text-white uppercase tracking-wider">{format(new Date(), 'HH:mm')}</span>
                  </div>
                </GlassInset>
              </div>
            </div>

            {/* Feature Content Area - Full Height */}
            <div className="flex-1 min-h-0 overflow-hidden rounded-3xl">
              <AnimatePresence mode="wait">
                {activeRightTab === 'fetchat' && !isFetchatDetached && (
                  <motion.div
                    key="fetchat"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="h-full"
                  >
                    <Fetchat
                      onToggleDetach={() => setIsFetchatDetached(true)}
                      activeUser={fetchatActiveUser}
                      onSelectUser={setFetchatActiveUser}
                    />
                  </motion.div>
                )}

                {activeRightTab === 'todo' && (
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

                {activeRightTab === 'notes' && (
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

                {activeRightTab === 'vault' && (
                  <motion.div
                    key="vault"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="h-full"
                  >
                    <FetsVault />
                  </motion.div>
                )}

                {activeRightTab === 'log' && (
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

                {isFetchatDetached && activeRightTab === 'fetchat' && (
                  <motion.div
                    key="detached-placeholder"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-full"
                  >
                    <GlassCard className="h-full flex flex-col items-center justify-center" glow>
                      <div className="bg-gradient-to-br from-[#ffbf00] to-[#ff9500] p-6 rounded-full mb-6 shadow-[0_0_40px_rgba(255,191,0,0.4)] animate-pulse">
                        <ExternalLink size={40} className="text-black" />
                      </div>
                      <h4 className="font-black text-lg uppercase tracking-widest text-white mb-2">FETCHAT DETACHED</h4>
                      <p className="text-sm text-white/50 text-center max-w-md mb-8">
                        Communications Hub is active in a floating overlay for cross-module accessibility.
                      </p>
                      <PremiumButton onClick={() => setIsFetchatDetached(false)} active>
                        RESTORE TO GRID
                      </PremiumButton>
                    </GlassCard>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* DETACHED FETCHAT PORTAL */}
        {isFetchatDetached && (
          <Fetchat
            isDetached
            onToggleDetach={() => setIsFetchatDetached(false)}
            onClose={() => setIsFetchatDetached(false)}
            activeUser={fetchatActiveUser}
            onSelectUser={setFetchatActiveUser}
          />
        )}

        {/* Footer Branding */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 opacity-20 pointer-events-none">
          <Brain size={16} className="text-[#ffbf00]" />
          <span className="font-black text-xs uppercase tracking-[0.3em] text-white">FETS PLATFORM</span>
        </div>
      </div>
    </>
  )
}

export default MyDeskNew
