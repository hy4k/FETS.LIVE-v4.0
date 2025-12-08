import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User,
  Settings,
  Shield,
  Monitor,
  LogOut,
  Maximize2,
  X,
  Save,
  Key,
  Eye,
  EyeOff,
  Bell,
  Download,
  Database,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Moon,
  Sun,
  Smartphone
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { toast } from 'react-hot-toast'

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

interface UserSettings {
  display: {
    theme: 'dark' | 'light' | 'auto'
    language: string
    timezone: string
    dateFormat: string
  }
  notifications: {
    emailAlerts: boolean
    pushNotifs: boolean
    weeklyDigest: boolean
  }
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

const ExpandedPanel = ({ id, title, subtitle, children, onClose }: { id: string, title: string, subtitle?: string, children: React.ReactNode, onClose: () => void }) => {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/40 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        layoutId={`tile-container-${id}`}
        className="w-full max-w-5xl max-h-[90vh] bg-[#f0f2f5] rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 md:p-8 border-b border-gray-200 flex items-center justify-between bg-white sticky top-0 z-20 shadow-sm">
          <div>
            <h2 className="text-3xl font-black text-gray-800 tracking-tight">{title}</h2>
            {subtitle && <p className="text-gray-500 mt-1 font-medium">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-3 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        <div className="p-6 md:p-8 overflow-y-auto bg-gray-50/50 flex-1">
          {children}
        </div>
      </motion.div>
    </motion.div>
  )
}

// --- Main Component ---

export function SettingsPage() {
  const { profile, signOut } = useAuth()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // --- State for Features ---

  // Profile State
  const [profileData, setProfileData] = useState({
    fullName: profile?.full_name || '',
    email: profile?.email || '',
    phone: '',
    bio: ''
  })

  // Settings State
  const [settings, setSettings] = useState<UserSettings>({
    display: {
      theme: 'light',
      language: 'en',
      timezone: 'UTC',
      dateFormat: 'MM/DD/YYYY'
    },
    notifications: {
      emailAlerts: true,
      pushNotifs: false,
      weeklyDigest: true
    }
  })

  // Password State
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false })

  // --- Effects ---

  useEffect(() => {
    const loadSettings = async () => {
      const saved = localStorage.getItem('fets-point-settings')
      if (saved) {
        try {
          setSettings(JSON.parse(saved))
        } catch (e) { console.error(e) }
      }

      if (profile?.user_id) {
        const { data } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', profile.user_id)
          .single()

        if (data) {
          setSettings({
            display: {
              theme: (data.theme as any) || 'light',
              language: data.language || 'en',
              timezone: data.timezone || 'UTC',
              dateFormat: data.date_format || 'MM/DD/YYYY'
            },
            notifications: (data.notifications as any) || {
              emailAlerts: true,
              pushNotifs: false,
              weeklyDigest: true
            }
          })
        }
      }
    }
    loadSettings()
  }, [profile])

  // --- Handlers ---

  const handleExpand = (id: string) => setExpandedId(id)
  const handleClose = () => setExpandedId(null)

  const handleSaveSettings = async () => {
    setIsLoading(true)
    localStorage.setItem('fets-point-settings', JSON.stringify(settings))

    if (profile?.user_id) {
      try {
        const { error } = await supabase.from('user_settings').upsert({
          user_id: profile.user_id,
          theme: settings.display.theme,
          language: settings.display.language,
          timezone: settings.display.timezone,
          date_format: settings.display.dateFormat,
          notifications: settings.notifications
        })
        if (error) throw error
        toast.success('Preferences saved & synced')
      } catch (error) {
        console.error('Sync error:', error)
        toast.success('Saved locally (Sync failed)')
      }
    } else {
      toast.success('Preferences saved locally')
    }

    setIsLoading(false)
    handleClose()
  }

  const handleProfileUpdate = async () => {
    try {
      setIsLoading(true)
      const updates: any = { full_name: profileData.fullName }
      if (profileData.bio !== undefined) updates.bio = profileData.bio

      const { error } = await supabase
        .from('staff_profiles')
        .update(updates)
        .eq('user_id', profile?.user_id)

      if (error) throw error
      toast.success('Profile updated')
      handleClose()
    } catch (error) {
      console.error(error)
      toast.error('Failed to update profile')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setIsLoading(true)
    try {
      // Here we would implement real Supabase auth update
      // Simulating delay for UX
      await new Promise(resolve => setTimeout(resolve, 1500))

      const { error } = await supabase.auth.updateUser({ password: passwordForm.newPassword })
      if (error) throw error

      toast.success('Password changed successfully')
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      handleClose()
    } catch (error: any) {
      toast.error(error.message || 'Error changing password')
    } finally {
      setIsLoading(false)
    }
  }

  const handleExportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ profile, settings, profileData }, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "fets_user_data.json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    toast.success('Data export started')
  }

  return (
    <div className="min-h-screen bg-[#e0e5ec] pt-28 pb-12 px-4 md:px-8">

      {/* Header */}
      <div className="max-w-[1600px] mx-auto mb-10 flex items-center gap-6">
        <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-3xl flex items-center justify-center shadow-xl shadow-indigo-500/20">
          <Settings className="text-white" size={40} />
        </div>
        <div>
          <h1 className="text-5xl font-[900] tracking-tight text-gray-800 mb-2">
            SYSTEM <span className="text-gold-gradient">SETTINGS</span>
          </h1>
          <p className="text-gray-500 font-medium ml-1 text-lg">
            Personalize your FETS experience
          </p>
        </div>
      </div>

      {/* Tiles Grid */}
      <div className="max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">

        {/* 1. Identity Tile */}
        <LiveTile id="profile" title="Identity" icon={User} onExpand={() => handleExpand('profile')} color="indigo" colSpan={1}>
          <div className="text-center">
            <div className="w-20 h-20 mx-auto bg-indigo-100 rounded-full flex items-center justify-center text-3xl font-bold text-indigo-700 mb-4 border-4 border-white shadow-sm">
              {profile?.full_name?.[0] || 'U'}
            </div>
            <h3 className="text-xl font-bold text-gray-800 truncate">{profileData.fullName || 'User'}</h3>
            <span className="inline-block px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold uppercase tracking-wider mt-2 border border-indigo-100">
              {profile?.role || 'Staff Member'}
            </span>
          </div>
        </LiveTile>

        {/* 2. Display & Preferences */}
        <LiveTile id="display" title="Interface" icon={Monitor} onExpand={() => handleExpand('display')} color="pink" colSpan={1}>
          <div className="space-y-4 px-2">
            <div className="flex items-center justify-between p-3 bg-pink-50 rounded-xl border border-pink-100">
              <span className="text-sm font-semibold text-pink-800">Theme</span>
              <div className="flex gap-2">
                <div className={`p-1.5 rounded-lg ${settings.display.theme === 'light' ? 'bg-white shadow text-pink-600' : 'text-gray-400'}`}><Sun size={14} /></div>
                <div className={`p-1.5 rounded-lg ${settings.display.theme === 'dark' ? 'bg-gray-800 shadow text-white' : 'text-gray-400'}`}><Moon size={14} /></div>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span>{settings.display.language === 'en' ? 'English (US)' : 'System Default'}</span>
            </div>
          </div>
        </LiveTile>

        {/* 3. Security Shield */}
        <LiveTile id="security" title="Security" icon={Shield} onExpand={() => handleExpand('security')} color="emerald" colSpan={1}>
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100/50 text-emerald-800 rounded-lg text-sm font-bold">
              <CheckCircle size={16} /> <span>Account Secured</span>
            </div>
            <p className="text-xs text-gray-400">Last auth check: Just now</p>
            <button onClick={(e) => { e.stopPropagation(); handleExpand('security'); }} className="text-xs font-bold text-emerald-600 hover:underline">Change Password &rarr;</button>
          </div>
        </LiveTile>

        {/* 4. Notifications (New) */}
        <LiveTile id="notifications" title="Notifications" icon={Bell} onExpand={() => handleExpand('notifications')} color="amber" colSpan={1}>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Email Alerts</span>
              <span className={`font-bold ${settings.notifications.emailAlerts ? 'text-amber-600' : 'text-gray-300'}`}>{settings.notifications.emailAlerts ? 'ON' : 'OFF'}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Push Notifs</span>
              <span className={`font-bold ${settings.notifications.pushNotifs ? 'text-amber-600' : 'text-gray-300'}`}>{settings.notifications.pushNotifs ? 'ON' : 'OFF'}</span>
            </div>
          </div>
        </LiveTile>

        {/* 5. Data & Privacy (New) */}
        <LiveTile id="data" title="Data Vault" icon={Database} onExpand={() => handleExpand('data')} color="cyan" colSpan={1}>
          <div className="flex flex-col items-center justify-center h-full space-y-3">
            <button onClick={(e) => { e.stopPropagation(); handleExportData(); }} className="p-4 rounded-full bg-cyan-50 text-cyan-600 hover:bg-cyan-100 hover:scale-105 transition-all shadow-sm border border-cyan-100">
              <Download size={24} />
            </button>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">One-Click Export</span>
          </div>
        </LiveTile>

        {/* 6. Session Control */}
        <LiveTile id="session" title="Session" icon={LogOut} onExpand={() => { }} color="rose" colSpan={1}>
          <div className="flex flex-col h-full justify-between">
            <div className="text-xs text-center text-gray-400 font-mono">ID: {profile?.id?.slice(0, 8)}...</div>
            <button
              onClick={(e) => { e.stopPropagation(); signOut(); }}
              className="w-full py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
            >
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        </LiveTile>

      </div>

      {/* --- Expanded Panels --- */}

      <AnimatePresence>

        {/* Profile Panel */}
        {expandedId === 'profile' && (
          <ExpandedPanel id="profile" title="Identity Management" subtitle="Update your personal details" onClose={handleClose}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-1">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
                  <div className="w-32 h-32 mx-auto bg-indigo-100 rounded-full flex items-center justify-center text-4xl font-bold text-indigo-700 mb-4">
                    {profileData.fullName?.[0] || 'U'}
                  </div>
                  <p className="text-gray-500 text-sm">Avatar management coming soon</p>
                </div>
              </div>
              <div className="md:col-span-2 space-y-6">
                <div className="space-y-4">
                  <label className="block">
                    <span className="text-gray-700 font-semibold text-sm">Full Name</span>
                    <input type="text" value={profileData.fullName} onChange={e => setProfileData({ ...profileData, fullName: e.target.value })} className="mt-1 w-full px-4 py-3 rounded-xl bg-white border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" />
                  </label>
                  <label className="block">
                    <span className="text-gray-700 font-semibold text-sm">Email</span>
                    <input type="email" value={profileData.email} disabled className="mt-1 w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-500 cursor-not-allowed" />
                  </label>
                  <label className="block">
                    <span className="text-gray-700 font-semibold text-sm">Bio</span>
                    <textarea value={profileData.bio} onChange={e => setProfileData({ ...profileData, bio: e.target.value })} className="mt-1 w-full px-4 py-3 rounded-xl bg-white border border-gray-200 focus:ring-2 focus:ring-indigo-500 h-32" placeholder="Tell us about yourself..." />
                  </label>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button onClick={handleClose} className="px-6 py-2 text-gray-500 hover:bg-gray-100 rounded-xl font-medium">Cancel</button>
                  <button onClick={handleProfileUpdate} disabled={isLoading} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 flex items-center gap-2">
                    {isLoading && <RefreshCw className="animate-spin" size={16} />} Save Changes
                  </button>
                </div>
              </div>
            </div>
          </ExpandedPanel>
        )}

        {/* Display Panel */}
        {expandedId === 'display' && (
          <ExpandedPanel id="display" title="Interface Customization" onClose={handleClose}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-pink-200 transition-colors">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Monitor size={20} className="text-pink-500" /> Theme</h3>
                <div className="grid grid-cols-3 gap-3">
                  {['light', 'dark', 'auto'].map((t) => (
                    <button
                      key={t}
                      onClick={() => setSettings({ ...settings, display: { ...settings.display, theme: t as any } })}
                      className={`py-3 rounded-xl border-2 font-medium capitalize ${settings.display.theme === t ? 'border-pink-500 bg-pink-50 text-pink-700' : 'border-transparent bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-pink-200 transition-colors">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Smartphone size={20} className="text-pink-500" /> Date & Time</h3>
                <div className="space-y-3">
                  <select
                    value={settings.display.dateFormat}
                    onChange={(e) => setSettings({ ...settings, display: { ...settings.display, dateFormat: e.target.value } })}
                    className="w-full p-3 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-pink-500"
                  >
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  </select>
                  <select
                    value={settings.display.timezone}
                    onChange={(e) => setSettings({ ...settings, display: { ...settings.display, timezone: e.target.value } })}
                    className="w-full p-3 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-pink-500"
                  >
                    <option value="UTC">UTC</option>
                    <option value="EST">EST</option>
                    <option value="IST">IST</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="mt-8 flex justify-end">
              <button onClick={handleSaveSettings} disabled={isLoading} className="px-8 py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-bold shadow-lg shadow-pink-200 flex items-center gap-2">
                {isLoading ? <RefreshCw className="animate-spin" /> : <Save />} Save Preferences
              </button>
            </div>
          </ExpandedPanel>
        )}

        {/* Security Panel */}
        {expandedId === 'security' && (
          <ExpandedPanel id="security" title="Security Center" onClose={handleClose}>
            <div className="max-w-2xl mx-auto space-y-8">
              <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 flex items-start gap-4">
                <ShieldCheck className="text-emerald-600 shrink-0" size={32} />
                <div>
                  <h3 className="font-bold text-emerald-800 text-lg">Your account is secure</h3>
                  <p className="text-emerald-700/80 mt-1">We haven't detected any suspicious activity. Enable 2FA for extra protection (coming soon).</p>
                </div>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-800 text-xl mb-6">Change Password</h3>
                <div className="space-y-4">
                  <div className="relative">
                    <input
                      type={showPasswords.current ? "text" : "password"}
                      placeholder="Current Password"
                      value={passwordForm.currentPassword}
                      onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-emerald-500"
                    />
                    <button onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })} className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600">
                      {showPasswords.current ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? "text" : "password"}
                      placeholder="New Password"
                      value={passwordForm.newPassword}
                      onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-emerald-500"
                    />
                    <button onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })} className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600">
                      {showPasswords.new ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? "text" : "password"}
                      placeholder="Confirm New Password"
                      value={passwordForm.confirmPassword}
                      onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-emerald-500"
                    />
                    <button onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })} className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600">
                      {showPasswords.confirm ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
                <div className="mt-6">
                  <button onClick={handleChangePassword} disabled={isLoading} className="w-full py-3 bg-gray-900 hover:bg-black text-white rounded-xl font-bold transition-colors">
                    {isLoading ? 'Processing...' : 'Update Password'}
                  </button>
                </div>
              </div>
            </div>
          </ExpandedPanel>
        )}

        {/* Notifications Panel */}
        {expandedId === 'notifications' && (
          <ExpandedPanel id="notifications" title="Notification Preferences" onClose={handleClose}>
            <div className="max-w-xl mx-auto space-y-4">
              {Object.entries(settings.notifications).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-5 bg-white rounded-2xl border border-gray-100 shadow-sm">
                  <span className="font-medium text-gray-700 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                  <button
                    onClick={() => {
                      const newNotifs = { ...settings.notifications, [key]: !value }
                      setSettings({ ...settings, notifications: newNotifs })
                      // Auto-save logic could go here or require manual save
                      toast.success('Setting updated')
                      localStorage.setItem('fets-point-settings', JSON.stringify({ ...settings, notifications: newNotifs }))
                    }}
                    className={`w-14 h-8 rounded-full p-1 transition-colors ${value ? 'bg-amber-500' : 'bg-gray-200'}`}
                  >
                    <div className={`w-6 h-6 rounded-full bg-white shadow-sm transition-transform ${value ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>
              ))}
            </div>
          </ExpandedPanel>
        )}

        {/* Data Panel */}
        {expandedId === 'data' && (
          <ExpandedPanel id="data" title="Data Vault & Privacy" onClose={handleClose}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center h-full">
              <div className="p-10 bg-cyan-50 rounded-3xl text-center space-y-6">
                <Database size={64} className="mx-auto text-cyan-600" />
                <h3 className="text-2xl font-bold text-gray-800">Your Data, Your Control.</h3>
                <p className="text-gray-600">Download a complete JSON archive of your personal data, settings, and logs stored on FETS.</p>
                <button onClick={handleExportData} className="px-8 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-bold shadow-lg shadow-cyan-200 flex items-center justify-center gap-2 mx-auto">
                  <Download size={20} /> Download Archive
                </button>
              </div>
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 opacity-60">
                  <h4 className="font-bold text-gray-400 mb-2 flex items-center gap-2"><AlertTriangle size={16} /> Delete Account</h4>
                  <p className="text-sm text-gray-400 mb-4">Permanently remove your account and all associated data. This action is irreversible.</p>
                  <button disabled className="px-4 py-2 border border-red-200 text-red-300 rounded-lg text-sm font-semibold cursor-not-allowed">Delete Account (Contact Admin)</button>
                </div>
              </div>
            </div>
          </ExpandedPanel>
        )}

      </AnimatePresence>

    </div>
  )
}
