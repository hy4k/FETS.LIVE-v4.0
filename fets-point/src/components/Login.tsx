import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabase";
import {
  Mail,
  Lock,
  ChevronDown,
  ArrowRight,
  Shield,
  BarChart3,
  Users,
  CalendarDays,
  MapPin,
} from "lucide-react";
import { getAvailableBranches, formatBranchName } from "../utils/authUtils";
import { motion, AnimatePresence } from "framer-motion";

type Stage = "splash" | "credentials" | "branch" | "launching";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedBranch, setSelectedBranch] = useState<string>("calicut");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { signIn } = useAuth();

  const [stage, setStage] = useState<Stage>("credentials");
  const [resetEmail, setResetEmail] = useState("");
  const [showForgot, setShowForgot] = useState(false);
  const [resetMessage, setResetMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const availableBranches = getAvailableBranches(email, null);

  const handleCredentialsNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setError("");
    setStage("branch");
  };

  const handleSignIn = async () => {
    setLoading(true);
    setError("");
    setStage("launching");

    try {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error.message);
        setStage("credentials");
      } else {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from("staff_profiles")
            .update({ branch_assigned: selectedBranch })
            .eq("user_id", user.id);
        }
      }
    } catch (err: any) {
      setError(err.message || "Login failed");
      setStage("credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return;
    setLoading(true);
    setResetMessage(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/update-password`,
      });
      if (error) throw error;
      setResetMessage({
        type: "success",
        text: "Recovery link sent! Check your inbox.",
      });
    } catch (err: any) {
      setResetMessage({
        type: "error",
        text: err.message || "Something went wrong",
      });
    } finally {
      setLoading(false);
    }
  };

  const pageTransition = {
    initial: { opacity: 0, y: 30, filter: "blur(6px)" },
    animate: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
    },
    exit: {
      opacity: 0,
      y: -20,
      filter: "blur(4px)",
      transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
    },
  };

  const features = [
    {
      icon: BarChart3,
      title: "Command Centre",
      desc: "Real-time operational dashboard",
    },
    {
      icon: Users,
      title: "Staff Management",
      desc: "Roster, shifts & team coordination",
    },
    {
      icon: CalendarDays,
      title: "Smart Calendar",
      desc: "Scheduling & exam slot tracking",
    },
    {
      icon: Shield,
      title: "Secure Access",
      desc: "Role-based permissions & audit logs",
    },
  ];

  return (
    <div
      className="min-h-screen relative flex bg-[#0a0b0e]"
      style={{ fontFamily: "'Outfit', 'Inter', system-ui, sans-serif" }}
    >
      {/* ══════════════════════════════════════════════
          LEFT PANEL — Brand & Feature Showcase
          (Hidden on mobile, shown on lg+)
         ══════════════════════════════════════════════ */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden flex-col justify-between p-12 xl:p-16">
        {/* Background layers */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0d0f13] via-[#0f1117] to-[#0a0b0e]" />

        {/* Subtle animated gradient orbs */}
        <motion.div
          animate={{ y: [-15, 15, -15], scale: [1, 1.05, 1] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[15%] left-[10%] w-[500px] h-[500px] rounded-full bg-[#AEEC27]/[0.03] blur-[140px]"
        />
        <motion.div
          animate={{ y: [10, -10, 10], opacity: [0.02, 0.05, 0.02] }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 3,
          }}
          className="absolute bottom-[10%] right-[5%] w-[400px] h-[400px] rounded-full bg-[#C0F050]/[0.04] blur-[120px]"
        />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(174,236,39,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(174,236,39,0.3) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* Top — Logo */}
        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-[#AEEC27] flex items-center justify-center shadow-[0_0_20px_rgba(174,236,39,0.25)]">
              <span className="text-[#0a0b0e] font-black text-lg leading-none">
                F
              </span>
            </div>
            <span className="text-[#FDFFF8] font-bold text-xl tracking-tight">
              fets<span className="text-[#AEEC27]">.</span>live
            </span>
          </motion.div>
        </div>

        {/* Center — Hero content */}
        <div className="relative z-10 -mt-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#AEEC27]/[0.08] border border-[#AEEC27]/20 mb-8">
              <div className="w-1.5 h-1.5 rounded-full bg-[#AEEC27]" />
              <span className="text-[#AEEC27] text-xs font-semibold tracking-wider uppercase">
                Operations Platform
              </span>
            </div>

            <h1
              className="text-[#FDFFF8] font-black tracking-tight leading-[1.05] mb-6"
              style={{ fontSize: "clamp(36px, 4vw, 52px)" }}
            >
              Your exam centre,
              <br />
              <span className="text-[#AEEC27]">fully connected.</span>
            </h1>

            <p className="text-[#8b90a0] text-lg leading-relaxed max-w-md mb-12">
              Manage operations, coordinate teams, and track everything across
              branches — all from one unified workspace.
            </p>
          </motion.div>

          {/* Feature grid */}
          <div className="grid grid-cols-2 gap-4">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + i * 0.1, duration: 0.5 }}
                className="group p-4 rounded-2xl bg-[#ffffff]/[0.02] border border-[#ffffff]/[0.06] hover:bg-[#ffffff]/[0.04] hover:border-[#AEEC27]/20 transition-all duration-300"
              >
                <div className="w-9 h-9 rounded-lg bg-[#AEEC27]/[0.1] flex items-center justify-center mb-3 group-hover:bg-[#AEEC27]/[0.15] transition-colors">
                  <feature.icon
                    size={18}
                    className="text-[#AEEC27]"
                    strokeWidth={2}
                  />
                </div>
                <h3 className="text-[#FDFFF8] font-semibold text-sm mb-1">
                  {feature.title}
                </h3>
                <p className="text-[#6b7080] text-xs leading-relaxed">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom — Stats bar */}
        <motion.div
          className="relative z-10 flex items-center gap-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
        >
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="w-7 h-7 rounded-full border-2 border-[#0d0f13] flex items-center justify-center text-[9px] font-bold"
                  style={{
                    background: [
                      "linear-gradient(135deg, #AEEC27, #8eca13)",
                      "linear-gradient(135deg, #3b82f6, #2563eb)",
                      "linear-gradient(135deg, #f59e0b, #d97706)",
                      "linear-gradient(135deg, #8b5cf6, #7c3aed)",
                    ][i],
                    color: i === 0 ? "#0a0b0e" : "#fff",
                  }}
                >
                  {["F", "C", "K", "G"][i]}
                </div>
              ))}
            </div>
            <span className="text-[#6b7080] text-xs font-medium">
              4 Centres
            </span>
          </div>
          <div className="w-px h-4 bg-[#ffffff]/10" />
          <span className="text-[#6b7080] text-xs font-medium">
            Trusted by 50+ staff members
          </span>
        </motion.div>
      </div>

      {/* ══════════════════════════════════════════════
          DIVIDER — Gradient line
         ══════════════════════════════════════════════ */}
      <div className="hidden lg:block w-px relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#AEEC27]/20 to-transparent" />
      </div>

      {/* ══════════════════════════════════════════════
          RIGHT PANEL — Auth Forms
         ══════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden px-6 sm:px-10">
        {/* Background glow */}
        <motion.div
          animate={{ y: [-10, 10, -10], scale: [1, 1.08, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#AEEC27]/[0.03] blur-[150px] pointer-events-none"
        />

        {/* Dot pattern */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(253,255,248,0.4) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        {/* Mobile logo (shown only on small screens) */}
        <motion.div
          className="lg:hidden mb-10 text-center"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#AEEC27] flex items-center justify-center shadow-[0_0_20px_rgba(174,236,39,0.25)]">
              <span className="text-[#0a0b0e] font-black text-lg leading-none">
                F
              </span>
            </div>
            <span className="text-[#FDFFF8] font-bold text-2xl tracking-tight">
              fets<span className="text-[#AEEC27]">.</span>live
            </span>
          </div>
          <p className="text-[#6b7080] text-sm">
            Exam Centre Operations Platform
          </p>
        </motion.div>

        {/* Form container */}
        <div className="relative z-10 w-full max-w-[420px]">
          <AnimatePresence mode="wait">
            {/* ────── CREDENTIALS ────── */}
            {stage === "credentials" && !showForgot && (
              <motion.div key="credentials" {...pageTransition}>
                <div className="mb-10">
                  <h2 className="text-[#FDFFF8] font-bold text-3xl tracking-tight mb-2">
                    Welcome back
                  </h2>
                  <p className="text-[#6b7080] text-base">
                    Sign in to your workspace
                  </p>
                </div>

                <form onSubmit={handleCredentialsNext} className="space-y-5">
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="px-4 py-3 bg-[#EF4444]/[0.08] border border-[#EF4444]/25 rounded-xl text-[#f87171] text-sm font-medium"
                    >
                      {error}
                    </motion.div>
                  )}

                  {/* Email field */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                  >
                    <label className="block text-[#8b90a0] text-xs font-semibold tracking-wider uppercase mb-2 ml-1">
                      Email
                    </label>
                    <div className="relative">
                      <Mail
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4a4f60] pointer-events-none"
                        strokeWidth={2}
                      />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-11 pr-4 py-3.5 bg-[#13151a] border border-[#2a2d38] rounded-xl text-[#FDFFF8] text-[15px] font-medium placeholder-[#3d4152] focus:outline-none focus:border-[#AEEC27]/60 focus:ring-1 focus:ring-[#AEEC27]/20 transition-all duration-200"
                        placeholder="name@fets.in"
                        required
                        autoFocus
                      />
                    </div>
                  </motion.div>

                  {/* Password field */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                  >
                    <label className="block text-[#8b90a0] text-xs font-semibold tracking-wider uppercase mb-2 ml-1">
                      Password
                    </label>
                    <div className="relative">
                      <Lock
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4a4f60] pointer-events-none"
                        strokeWidth={2}
                      />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-11 pr-4 py-3.5 bg-[#13151a] border border-[#2a2d38] rounded-xl text-[#FDFFF8] text-[15px] font-medium placeholder-[#3d4152] focus:outline-none focus:border-[#AEEC27]/60 focus:ring-1 focus:ring-[#AEEC27]/20 transition-all duration-200"
                        placeholder="Enter your password"
                        required
                      />
                    </div>
                    <div className="flex justify-end mt-2.5">
                      <button
                        type="button"
                        onClick={() => setShowForgot(true)}
                        className="text-[#6b7080] text-sm font-medium hover:text-[#AEEC27] transition-colors duration-200"
                      >
                        Forgot password?
                      </button>
                    </div>
                  </motion.div>

                  {/* Continue button */}
                  <motion.button
                    type="submit"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="w-full mt-2 py-3.5 bg-[#AEEC27] text-[#0a0b0e] font-bold text-[15px] rounded-xl shadow-[0_0_24px_rgba(174,236,39,0.2)] hover:shadow-[0_0_40px_rgba(174,236,39,0.35)] hover:bg-[#bef240] transition-all duration-300 flex items-center justify-center gap-2.5"
                  >
                    Continue
                    <ArrowRight size={18} strokeWidth={2.5} />
                  </motion.button>
                </form>

                {/* Security note */}
                <motion.div
                  className="mt-8 flex items-center justify-center gap-2 text-[#3d4152]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  <Shield size={13} strokeWidth={2} />
                  <span className="text-xs font-medium">
                    Protected by end-to-end encryption
                  </span>
                </motion.div>
              </motion.div>
            )}

            {/* ────── FORGOT PASSWORD ────── */}
            {stage === "credentials" && showForgot && (
              <motion.div key="forgot" {...pageTransition}>
                <div className="mb-10">
                  <div className="w-14 h-14 bg-[#13151a] border border-[#2a2d38] rounded-2xl flex items-center justify-center mb-5">
                    <Mail className="text-[#AEEC27]" size={24} strokeWidth={2} />
                  </div>
                  <h2 className="text-[#FDFFF8] font-bold text-3xl tracking-tight mb-2">
                    Reset password
                  </h2>
                  <p className="text-[#6b7080] text-base">
                    We'll send a recovery link to your email
                  </p>
                </div>

                <form onSubmit={handleForgotPassword} className="space-y-5">
                  {resetMessage && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`px-4 py-3 rounded-xl text-sm font-medium ${
                        resetMessage.type === "success"
                          ? "bg-[#AEEC27]/[0.08] border border-[#AEEC27]/25 text-[#AEEC27]"
                          : "bg-[#EF4444]/[0.08] border border-[#EF4444]/25 text-[#f87171]"
                      }`}
                    >
                      {resetMessage.text}
                    </motion.div>
                  )}

                  <div>
                    <label className="block text-[#8b90a0] text-xs font-semibold tracking-wider uppercase mb-2 ml-1">
                      Email address
                    </label>
                    <div className="relative">
                      <Mail
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4a4f60] pointer-events-none"
                        strokeWidth={2}
                      />
                      <input
                        type="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        className="w-full pl-11 pr-4 py-3.5 bg-[#13151a] border border-[#2a2d38] rounded-xl text-[#FDFFF8] text-[15px] font-medium placeholder-[#3d4152] focus:outline-none focus:border-[#AEEC27]/60 focus:ring-1 focus:ring-[#AEEC27]/20 transition-all duration-200"
                        placeholder="name@fets.in"
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-[#AEEC27] text-[#0a0b0e] font-bold text-[15px] rounded-xl shadow-[0_0_24px_rgba(174,236,39,0.2)] hover:shadow-[0_0_40px_rgba(174,236,39,0.35)] hover:bg-[#bef240] transition-all duration-300 disabled:opacity-50 flex items-center justify-center"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-[#0a0b0e]/30 border-t-[#0a0b0e] rounded-full animate-spin" />
                    ) : (
                      "Send recovery link"
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowForgot(false)}
                    className="w-full py-3 text-[#6b7080] text-sm font-medium hover:text-[#FDFFF8] transition-colors duration-200"
                  >
                    Back to sign in
                  </button>
                </form>
              </motion.div>
            )}

            {/* ────── BRANCH SELECTION ────── */}
            {stage === "branch" && (
              <motion.div key="branch" {...pageTransition}>
                <div className="mb-10">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#AEEC27]/[0.08] border border-[#AEEC27]/20 mb-5">
                    <MapPin size={13} className="text-[#AEEC27]" />
                    <span className="text-[#AEEC27] text-xs font-semibold tracking-wider uppercase">
                      Select Centre
                    </span>
                  </div>
                  <h2 className="text-[#FDFFF8] font-bold text-3xl tracking-tight mb-2">
                    Choose your centre
                  </h2>
                  <p className="text-[#6b7080] text-base">
                    Select the branch you're working from today
                  </p>
                </div>

                {/* Branch cards */}
                <motion.div
                  className="space-y-3 mb-8"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  {availableBranches.map((branch, i) => {
                    const isSelected = selectedBranch === branch;
                    const colors: Record<string, string> = {
                      calicut: "#3b82f6",
                      cochin: "#10b981",
                      kannur: "#f59e0b",
                      global: "#8b5cf6",
                    };
                    const color = colors[branch] || "#6b7280";

                    return (
                      <motion.button
                        key={branch}
                        type="button"
                        onClick={() => setSelectedBranch(branch)}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.25 + i * 0.08 }}
                        className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl border transition-all duration-200 text-left ${
                          isSelected
                            ? "bg-[#AEEC27]/[0.06] border-[#AEEC27]/40"
                            : "bg-[#13151a] border-[#2a2d38] hover:border-[#3d4152]"
                        }`}
                      >
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{
                            background: `${color}18`,
                            border: `1px solid ${color}30`,
                          }}
                        >
                          <MapPin
                            size={16}
                            style={{ color }}
                            strokeWidth={2}
                          />
                        </div>
                        <div className="flex-1">
                          <div className="text-[#FDFFF8] font-semibold text-[15px]">
                            {formatBranchName(branch)}
                          </div>
                          <div className="text-[#4a4f60] text-xs font-medium mt-0.5">
                            {branch === "global"
                              ? "All centres overview"
                              : "Exam centre"}
                          </div>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                            isSelected
                              ? "border-[#AEEC27] bg-[#AEEC27]"
                              : "border-[#3d4152]"
                          }`}
                        >
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-2 h-2 rounded-full bg-[#0a0b0e]"
                            />
                          )}
                        </div>
                      </motion.button>
                    );
                  })}
                </motion.div>

                {/* Sign In button */}
                <motion.button
                  onClick={handleSignIn}
                  disabled={loading}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full py-4 bg-[#AEEC27] text-[#0a0b0e] font-bold text-base rounded-xl shadow-[0_0_24px_rgba(174,236,39,0.2)] hover:shadow-[0_0_40px_rgba(174,236,39,0.35)] hover:bg-[#bef240] transition-all duration-300 flex items-center justify-center gap-2.5 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-[#0a0b0e]/30 border-t-[#0a0b0e] rounded-full animate-spin" />
                  ) : (
                    <>
                      Sign in
                      <ArrowRight size={18} strokeWidth={2.5} />
                    </>
                  )}
                </motion.button>

                {/* Back link */}
                <button
                  type="button"
                  onClick={() => setStage("credentials")}
                  className="w-full mt-4 py-3 text-[#6b7080] text-sm font-medium hover:text-[#FDFFF8] transition-colors duration-200"
                >
                  Back to credentials
                </button>
              </motion.div>
            )}

            {/* ────── LAUNCHING ────── */}
            {stage === "launching" && (
              <motion.div
                key="launching"
                className="flex flex-col items-center justify-center text-center py-20"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <motion.div
                  className="mb-8 relative"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                >
                  <div className="w-14 h-14 border-[3px] border-[#2a2d38] border-t-[#AEEC27] rounded-full" />
                </motion.div>

                <motion.h2
                  className="text-[#FDFFF8] font-bold text-2xl mb-2 tracking-tight"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  Signing you in
                </motion.h2>
                <motion.p
                  className="text-[#6b7080] text-sm font-medium"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  Establishing secure connection...
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom copyright */}
        <motion.div
          className="absolute bottom-6 left-0 right-0 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          <p className="text-[#3d4152] text-[11px] font-medium tracking-wider">
            &copy; {new Date().getFullYear()} FETS.LIVE &middot; All rights
            reserved
          </p>
        </motion.div>
      </div>
    </div>
  );
}
