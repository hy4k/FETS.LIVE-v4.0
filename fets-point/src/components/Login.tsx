import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { Mail, Lock, ChevronDown, ArrowRight, Sparkles } from 'lucide-react'
import { getAvailableBranches, formatBranchName } from '../utils/authUtils'
import { motion, AnimatePresence } from 'framer-motion'

type Stage = 'splash' | 'credentials' | 'branch' | 'launching'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [selectedBranch, setSelectedBranch] = useState<string>('calicut')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { signIn } = useAuth()

  const [stage, setStage] = useState<Stage>('credentials')
  const [resetEmail, setResetEmail] = useState('')
  const [showForgot, setShowForgot] = useState(false)
  const [resetMessage, setResetMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const availableBranches = getAvailableBranches(email, null)



  // After credentials entered, move to branch selection
  const handleCredentialsNext = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return
    setError('')
    setStage('branch')
  }

  // Final sign in
  const handleSignIn = async () => {
    setLoading(true)
    setError('')
    setStage('launching')

    try {
      const { error } = await signIn(email, password)
      if (error) {
        setError(error.message)
        setStage('credentials')
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
      setError(err.message || 'Login failed')
      setStage('credentials')
    } finally {
      setLoading(false)
    }
  }

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
      setResetMessage({ type: 'success', text: 'Recovery link sent! Check your inbox.' })
    } catch (err: any) {
      setResetMessage({ type: 'error', text: err.message || 'Something went wrong' })
    } finally {
      setLoading(false)
    }
  }

  // Shared page transition config
  const pageTransition = {
    initial: { opacity: 0, y: 40, filter: 'blur(8px)' },
    animate: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
    exit: { opacity: 0, y: -30, filter: 'blur(6px)', transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ══ ANIMATED BACKGROUND ══ */}
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
      >
        {/* Rich layered yellow gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#F7D046] via-[#F0C027] to-[#E2A80D]" />

        {/* Subtle warm overlay for depth */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.2)_0%,transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(180,120,0,0.15)_0%,transparent_50%)]" />

        {/* Floating ambient shapes */}
        <motion.div
          animate={{ y: [-30, 30, -30], x: [-15, 15, -15], rotate: [0, 10, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-[8%] right-[12%] w-[300px] h-[300px] rounded-full bg-white/[0.08] blur-2xl"
        />
        <motion.div
          animate={{ y: [20, -25, 20], x: [10, -20, 10] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute bottom-[15%] left-[8%] w-[250px] h-[250px] rounded-full bg-white/[0.06] blur-xl"
        />
        <motion.div
          animate={{ y: [-15, 20, -15] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
          className="absolute top-[50%] right-[50%] w-[180px] h-[180px] rounded-full bg-orange-400/[0.08] blur-3xl"
        />

        {/* Subtle grid texture */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.3) 1px, transparent 1px)',
          backgroundSize: '32px 32px'
        }} />
      </motion.div>

      {/* ══ MAIN CONTENT AREA ══ */}
      <div className="relative z-10 w-full max-w-[420px] px-8">
        <AnimatePresence mode="wait">


          {/* ────────── STAGE 2: CREDENTIALS ────────── */}
          {stage === 'credentials' && !showForgot && (
            <motion.div key="credentials" {...pageTransition} className="py-10">
              {/* Subtle branding at top */}
              <motion.div
                className="text-center mb-10"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h2
                  className="text-white font-black tracking-[-0.04em] leading-none mb-2"
                  style={{ fontSize: 'clamp(36px, 10vw, 48px)', textShadow: '0 2px 20px rgba(0,0,0,0.1)' }}
                >
                  fets<span className="opacity-40">.</span>live
                </h2>
                <p className="text-white/40 text-[11px] font-bold uppercase tracking-[0.3em]">Sign in to your workspace</p>
              </motion.div>

              <form onSubmit={handleCredentialsNext} className="space-y-4">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="px-4 py-3 bg-red-500/20 backdrop-blur-xl border border-red-400/30 rounded-xl text-white text-xs font-medium"
                  >
                    {error}
                  </motion.div>
                )}

                {/* Email */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <label className="block text-white/50 text-[10px] font-bold uppercase tracking-[0.2em] mb-2 ml-1">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-white/30" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-white/15 backdrop-blur-xl border border-white/20 rounded-2xl text-white text-sm font-medium placeholder-white/30 focus:outline-none focus:bg-white/20 focus:border-white/40 transition-all duration-300"
                      placeholder="name@fets.in"
                      required
                      autoFocus
                    />
                  </div>
                </motion.div>

                {/* Password */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.45 }}
                >
                  <div className="flex items-center justify-between mb-2 ml-1">
                    <label className="text-white/50 text-[10px] font-bold uppercase tracking-[0.2em]">Password</label>
                    <button
                      type="button"
                      onClick={() => setShowForgot(true)}
                      className="text-white/40 text-[10px] font-bold hover:text-white/70 transition-colors"
                    >
                      Forgot?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-white/30" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-white/15 backdrop-blur-xl border border-white/20 rounded-2xl text-white text-sm font-medium placeholder-white/30 focus:outline-none focus:bg-white/20 focus:border-white/40 transition-all duration-300"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </motion.div>

                {/* Continue button */}
                <motion.button
                  type="submit"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="w-full mt-6 py-4 bg-white text-[#B8860B] font-extrabold text-sm rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] hover:shadow-[0_15px_50px_rgba(0,0,0,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2"
                >
                  Continue
                  <ArrowRight size={16} className="opacity-70" />
                </motion.button>
              </form>
            </motion.div>
          )}

          {/* ────────── FORGOT PASSWORD ────────── */}
          {stage === 'credentials' && showForgot && (
            <motion.div key="forgot" {...pageTransition} className="py-10">
              <motion.div className="text-center mb-10">
                <div className="w-16 h-16 bg-white/15 backdrop-blur-xl border border-white/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <Mail className="text-white" size={28} />
                </div>
                <h2 className="text-white font-extrabold text-2xl mb-1">Reset Password</h2>
                <p className="text-white/40 text-xs font-medium">Enter your email to receive a recovery link</p>
              </motion.div>

              <form onSubmit={handleForgotPassword} className="space-y-4">
                {resetMessage && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`px-4 py-3 rounded-xl backdrop-blur-xl border text-xs font-medium ${resetMessage.type === 'success'
                      ? 'bg-green-500/20 border-green-400/30 text-white'
                      : 'bg-red-500/20 border-red-400/30 text-white'
                      }`}
                  >
                    {resetMessage.text}
                  </motion.div>
                )}

                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-white/30" />
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white/15 backdrop-blur-xl border border-white/20 rounded-2xl text-white text-sm font-medium placeholder-white/30 focus:outline-none focus:bg-white/20 focus:border-white/40 transition-all"
                    placeholder="name@fets.in"
                    required
                    autoFocus
                  />
                </div>

                <button type="submit" disabled={loading}
                  className="w-full py-4 bg-white text-[#B8860B] font-extrabold text-sm rounded-2xl shadow-lg hover:shadow-xl transition-all disabled:opacity-60 flex items-center justify-center">
                  {loading ? <div className="w-5 h-5 border-2 border-amber-300 border-t-amber-700 rounded-full animate-spin" /> : 'Send Recovery Link'}
                </button>

                <button type="button" onClick={() => setShowForgot(false)}
                  className="w-full py-3 text-white/50 text-xs font-bold hover:text-white/80 transition-colors">
                  ← Back to Sign In
                </button>
              </form>
            </motion.div>
          )}

          {/* ────────── STAGE 3: BRANCH SELECTION ────────── */}
          {stage === 'branch' && (
            <motion.div key="branch" {...pageTransition} className="py-10">
              {/* Branch dropdown */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mb-6"
              >
                <label className="block text-white/50 text-[10px] font-bold uppercase tracking-[0.2em] mb-2 ml-1">Select Centre</label>
                <div className="relative">
                  <select
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    className="w-full px-5 py-4 bg-white/15 backdrop-blur-xl border border-white/20 rounded-2xl text-white text-sm font-bold focus:outline-none focus:bg-white/20 focus:border-white/40 transition-all appearance-none cursor-pointer"
                  >
                    {availableBranches.map((branch) => (
                      <option key={branch} value={branch} className="text-slate-800 bg-white">
                        {formatBranchName(branch)}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 pointer-events-none" />
                </div>
              </motion.div>

              {/* Sign In button */}
              <motion.button
                onClick={handleSignIn}
                disabled={loading}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="w-full py-4 bg-white text-[#B8860B] font-extrabold text-sm rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] hover:shadow-[0_15px_50px_rgba(0,0,0,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-amber-300 border-t-amber-700 rounded-full animate-spin" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight size={16} className="opacity-70" />
                  </>
                )}
              </motion.button>
            </motion.div>
          )}

          {/* ────────── STAGE 4: LAUNCHING ────────── */}
          {stage === 'launching' && (
            <motion.div
              key="launching"
              className="flex flex-col items-center justify-center text-center py-32"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <motion.div
                className="mb-8"
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <div className="w-12 h-12 border-[3px] border-white/20 border-t-white rounded-full" />
              </motion.div>

              <motion.h2
                className="text-white font-extrabold text-xl mb-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Launching workspace...
              </motion.h2>
              <motion.p
                className="text-white/40 text-xs font-medium"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                Setting up your session
              </motion.p>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* ── BOTTOM COPYRIGHT ── */}
      <motion.div
        className="absolute bottom-5 left-0 right-0 text-center z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
      >
        <p className="text-white/25 text-[10px] font-medium">
          © {new Date().getFullYear()} FETS.LIVE · All rights reserved
        </p>
      </motion.div>

      {/* Font import */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
      `}</style>
    </div>
  )
}
