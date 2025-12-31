import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase, config } from '../lib/supabase'
import { Shield, MapPin, Mail, Lock, ArrowRight, ChevronLeft, Fingerprint, Globe } from 'lucide-react'
import { getAvailableBranches, formatBranchName } from '../utils/authUtils'
import { motion, AnimatePresence } from 'framer-motion'

export function Login() {
  const [email, setEmail] = useState('mithun@fets.in') // Pre-fill test credentials
  const [password, setPassword] = useState('123456')
  const [selectedBranch, setSelectedBranch] = useState<string>('calicut')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { signIn } = useAuth()

  const [mode, setMode] = useState<'login' | 'forgot_password'>('login')
  const [resetEmail, setResetEmail] = useState('')
  const [resetMessage, setResetMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Get available branches based on email (for UI preview)
  const availableBranches = getAvailableBranches(email, null)

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resetEmail) return

    setLoading(true)
    setResetMessage(null)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/update-password`,
      })

      if (error) throw error

      setResetMessage({
        type: 'success',
        text: 'Security verification link dispatched. Check your terminal/inbox.'
      })
    } catch (err: any) {
      setResetMessage({
        type: 'error',
        text: err.message || 'Transmission failure'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { error } = await signIn(email, password)
      if (error) {
        setError(`Access Denied: ${error.message}`)
      } else {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await supabase
            .from('staff_profiles')
            .update({ branch_assigned: selectedBranch })
            .eq('user_id', user.id)
        }
      }
    } catch (err: any) {
      setError(`System Fault: ${err.message || 'Login failed'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#e0e5ec] flex items-center justify-center p-6 relative overflow-hidden font-['Montserrat']">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-400/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-yellow-500/10 rounded-full blur-[120px] animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        {/* Branding Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-block relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-600 to-yellow-400 rounded-[2rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative flex items-center justify-center p-6 bg-[#e0e5ec] rounded-[2rem] shadow-[8px_8px_16px_#bec3c9,-8px_-8px_16px_#ffffff]">
              <img
                src="/fets-live-golden-logo.jpg"
                alt="FETS.LIVE"
                className="h-24 w-24 object-contain rounded-xl"
              />
            </div>
          </div>

          <h1 className="mt-8 text-5xl font-black text-slate-800 tracking-tighter uppercase">
            FETS<span className="text-amber-600 inline-block px-1">.</span>LIVE
          </h1>
          <div className="mt-2 flex items-center justify-center gap-2">
            <span className="h-1 w-8 bg-amber-500 rounded-full"></span>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Security Grid v4.0</span>
            <span className="h-1 w-8 bg-amber-500 rounded-full"></span>
          </div>
        </motion.div>

        {/* Auth Module */}
        <AnimatePresence mode="wait">
          {mode === 'login' ? (
            <motion.div
              key="login"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="bg-[#e0e5ec] p-10 rounded-[2.5rem] shadow-[20px_20px_60px_#bec3c9,-20px_-20px_60px_#ffffff] border border-white/20"
            >
              <form onSubmit={handleSubmit} className="space-y-8">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-600"
                  >
                    <Fingerprint className="h-5 w-5 shrink-0" />
                    <p className="text-xs font-bold uppercase tracking-wider">{error}</p>
                  </motion.div>
                )}

                {/* Secure Inputs Group */}
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Administrative Access</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-amber-600 transition-colors" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-12 pr-6 py-5 bg-[#e0e5ec] shadow-[inset_4px_4px_8px_#bec3c9,inset_-4px_-4px_8px_#ffffff] rounded-2xl focus:outline-none text-slate-700 font-bold placeholder-slate-400/50"
                        placeholder="EMAIL_HOST@FETS.IN"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center ml-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Master Password</label>
                      <button
                        type="button"
                        onClick={() => setMode('forgot_password')}
                        className="text-[10px] font-black text-amber-600 uppercase tracking-widest hover:text-amber-700 hover:underline"
                      >
                        Reset Sequence?
                      </button>
                    </div>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-amber-600 transition-colors" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-12 pr-6 py-5 bg-[#e0e5ec] shadow-[inset_4px_4px_8px_#bec3c9,inset_-4px_-4px_8px_#ffffff] rounded-2xl focus:outline-none text-slate-700 font-bold placeholder-slate-400/50"
                        placeholder="••••••••••••"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Branch Matrix */}
                <div className="space-y-4">
                  <label className="flex items-center text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    <Globe className="h-4 w-4 mr-2 text-amber-500" />
                    Operational Grid Selection
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    {availableBranches.map((branch) => (
                      <button
                        key={branch}
                        type="button"
                        onClick={() => setSelectedBranch(branch)}
                        className={`
                          p-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all duration-300
                          ${selectedBranch === branch
                            ? 'bg-[#e0e5ec] shadow-[inset_6px_6px_12px_#bec3c9,inset_-6px_-6px_12px_#ffffff] text-amber-600 border border-amber-500/30'
                            : 'bg-[#e0e5ec] shadow-[6px_6px_12px_#bec3c9,-6px_-6px_12px_#ffffff] text-slate-500 hover:scale-[1.02]'
                          }
                        `}
                      >
                        {formatBranchName(branch)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Launch Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full relative group overflow-hidden"
                >
                  <div className={`
                    absolute inset-0 bg-gradient-to-r from-amber-600 to-amber-500 rounded-2xl transition-transform duration-500 ease-out
                    ${loading ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'} origin-left
                  `}></div>
                  <div className={`
                    relative py-5 rounded-2xl font-black text-sm uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-colors duration-500
                    ${loading ? 'text-white' : 'bg-[#e0e5ec] shadow-[8px_8px_16px_#bec3c9,-8px_-8px_16px_#ffffff] text-slate-800 group-hover:text-white'}
                  `}>
                    {loading ? (
                      <>
                        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Initializing...</span>
                      </>
                    ) : (
                      <>
                        <Shield className="h-5 w-5" />
                        <span>Enter System</span>
                        <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500" />
                      </>
                    )}
                  </div>
                </button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="forgot_password"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="bg-[#e0e5ec] p-10 rounded-[2.5rem] shadow-[20px_20px_60px_#bec3c9,-20px_-20px_60px_#ffffff] border border-white/20"
            >
              <div className="flex flex-col items-center mb-8">
                <div className="p-5 bg-[#e0e5ec] shadow-[inset_6px_6px_12px_#bec3c9,inset_-6px_-6px_12px_#ffffff] rounded-3xl text-amber-600 mb-6">
                  <Fingerprint size={48} />
                </div>
                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Identity Recovery</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 text-center">Enter your credentials to initiate reset sequence</p>
              </div>

              <form onSubmit={handleForgotPassword} className="space-y-8">
                {resetMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 border rounded-2xl flex items-center gap-3 ${resetMessage.type === 'success'
                        ? 'bg-green-500/10 border-green-500/20 text-green-600'
                        : 'bg-red-500/10 border-red-500/20 text-red-600'
                      }`}
                  >
                    <div className={`h-2 w-2 rounded-full animate-pulse ${resetMessage.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`} />
                    <span className="text-xs font-bold uppercase tracking-wider">{resetMessage.text}</span>
                  </motion.div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Recovery Email</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-amber-600 transition-colors" />
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="w-full pl-12 pr-6 py-5 bg-[#e0e5ec] shadow-[inset_4px_4px_8px_#bec3c9,inset_-4px_-4px_8px_#ffffff] rounded-2xl focus:outline-none text-slate-700 font-bold placeholder-slate-400/50"
                      placeholder="SECURE_ID@FETS.IN"
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-5 bg-amber-600 hover:bg-amber-700 text-white font-black text-sm uppercase tracking-[0.3em] rounded-2xl shadow-lg shadow-amber-900/20 transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    {loading ? 'Dispatched...' : 'Trigger Recovery'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="w-full py-4 flex items-center justify-center gap-2 text-[11px] font-black text-slate-500 uppercase tracking-widest hover:text-slate-800 transition-colors"
                  >
                    <ChevronLeft size={16} />
                    Back to Terminal
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* System Diagnostics (Dev Only) */}
        {import.meta.env.DEV && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-12 p-6 bg-[#e0e5ec] shadow-[inset_4px_4px_8px_#bec3c9,inset_-4px_-4px_8px_#ffffff] rounded-3xl"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Diagnostic Bridge Active</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-[9px] font-black text-slate-500 uppercase tracking-tighter">
              <div className="space-y-1">
                <span className="block text-slate-400">Endpoint Cluster</span>
                <span className="block text-slate-700 truncate">{config.url}</span>
              </div>
              <div className="space-y-1">
                <span className="block text-slate-400">Security Creds</span>
                <span className="block text-slate-700">Mithun@fets.in / 123456</span>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <style>{`
        body {
          background-color: #e0e5ec;
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.1; transform: scale(1); }
          50% { opacity: 0.2; transform: scale(1.1); }
        }
      `}</style>
    </div>
  )
}