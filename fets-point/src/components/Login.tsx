import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabase";
import { Mail, Lock, ChevronDown, ArrowRight, Sparkles } from "lucide-react";
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

  // After credentials entered, move to branch selection
  const handleCredentialsNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setError("");
    setStage("branch");
  };

  // Final sign in
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

  // Shared page transition config
  const pageTransition = {
    initial: { opacity: 0, y: 40, filter: "blur(8px)" },
    animate: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
    },
    exit: {
      opacity: 0,
      y: -30,
      filter: "blur(6px)",
      transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
    },
  };

  return (
    <div
      className="min-h-screen relative overflow-hidden flex items-center justify-center bg-[#0D0E11]"
      style={{ fontFamily: "'Outfit', 'Inter', system-ui, sans-serif" }}
    >
      {/* ══ ANIMATED BACKGROUND ══ */}
      <motion.div
        className="absolute inset-0 z-0 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
      >
        {/* Deep dark portal background */}
        <div className="absolute inset-0 bg-[#0D0E11]" />

        {/* Huge lime green glow behind */}
        <motion.div
          animate={{ y: [-20, 20, -20], x: [-10, 10, -10], scale: [1, 1.1, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] rounded-full bg-[#AEEC27]/[0.05] blur-[120px]"
        />

        {/* Accent glow top right */}
        <motion.div
          animate={{ y: [-10, 10, -10], opacity: [0.03, 0.06, 0.03] }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
          className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[#C0F050]/[0.08] blur-[100px]"
        />

        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.2]"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(253,255,248,0.1) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </motion.div>

      {/* ══ MAIN CONTENT AREA ══ */}
      <div className="relative z-10 w-full max-w-[500px] px-8">
        <AnimatePresence mode="wait">
          {/* ────────── STAGE 2: CREDENTIALS ────────── */}
          {stage === "credentials" && !showForgot && (
            <motion.div key="credentials" {...pageTransition} className="py-10">
              {/* Massive Typography Branding */}
              <motion.div
                className="text-center mb-16"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="inline-flex items-center justify-center gap-2 px-4 py-1.5 rounded-full bg-[#1A1D24] border border-[#353A47] mb-8">
                  <div className="w-2 h-2 rounded-full bg-[#AEEC27] animate-pulse" />
                  <span className="text-[#A0A5B5] text-xs font-medium tracking-wide">
                    SECURE WORKSPACE
                  </span>
                </div>
                <h1
                  className="text-[#FDFFF8] font-black tracking-tighter leading-[0.9] mb-4"
                  style={{ fontSize: "clamp(56px, 15vw, 84px)" }}
                >
                  fets<span className="text-[#AEEC27]">.</span>live
                </h1>
                <p className="text-[#A0A5B5] text-lg font-normal tracking-wide">
                  Enter your portal credentials
                </p>
              </motion.div>

              <form onSubmit={handleCredentialsNext} className="space-y-6">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="px-5 py-4 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-2xl text-[#EF4444] text-sm font-medium text-center"
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
                  <div className="relative group">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-5 pr-5 py-5 bg-[#1A1D24]/80 backdrop-blur-md border border-[#353A47] rounded-3xl text-[#FDFFF8] text-xl font-medium placeholder-[#6B7280] focus:outline-none focus:border-[#AEEC27] focus:bg-[#1A1D24] transition-all duration-300 shadow-inner"
                      placeholder="Email Address"
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
                  <div className="relative group">
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-5 pr-5 py-5 bg-[#1A1D24]/80 backdrop-blur-md border border-[#353A47] rounded-3xl text-[#FDFFF8] text-xl font-medium placeholder-[#6B7280] focus:outline-none focus:border-[#AEEC27] focus:bg-[#1A1D24] transition-all duration-300 shadow-inner"
                      placeholder="Password"
                      required
                    />
                  </div>
                  <div className="flex justify-end mt-3 mr-2">
                    <button
                      type="button"
                      onClick={() => setShowForgot(true)}
                      className="text-[#6B7280] text-sm font-medium hover:text-[#FDFFF8] transition-colors"
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
                  transition={{ delay: 0.6 }}
                  className="w-full mt-4 py-5 bg-[#AEEC27] text-[#0D0E11] font-bold text-xl rounded-3xl shadow-[0_0_30px_rgba(174,236,39,0.3)] hover:shadow-[0_0_50px_rgba(174,236,39,0.5)] hover:bg-[#C0F050] hover:-translate-y-1 active:translate-y-0 transition-all duration-300 flex items-center justify-center gap-3"
                >
                  Continue
                  <ArrowRight size={24} strokeWidth={3} />
                </motion.button>
              </form>
            </motion.div>
          )}

          {/* ────────── FORGOT PASSWORD ────────── */}
          {stage === "credentials" && showForgot && (
            <motion.div key="forgot" {...pageTransition} className="py-10">
              <motion.div className="text-center mb-12">
                <div className="w-20 h-20 bg-[#1A1D24] border border-[#353A47] rounded-full flex items-center justify-center mx-auto mb-6">
                  <Mail className="text-[#AEEC27]" size={36} />
                </div>
                <h2 className="text-[#FDFFF8] font-black text-4xl tracking-tight mb-3">
                  Recovery
                </h2>
                <p className="text-[#A0A5B5] text-lg">
                  Enter your email for a magic link
                </p>
              </motion.div>

              <form onSubmit={handleForgotPassword} className="space-y-6">
                {resetMessage && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`px-5 py-4 rounded-2xl text-sm font-medium text-center ${
                      resetMessage.type === "success"
                        ? "bg-[#AEEC27]/10 border border-[#AEEC27]/30 text-[#AEEC27]"
                        : "bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444]"
                    }`}
                  >
                    {resetMessage.text}
                  </motion.div>
                )}

                <div className="relative">
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full pl-5 pr-5 py-5 bg-[#1A1D24]/80 backdrop-blur-md border border-[#353A47] rounded-3xl text-[#FDFFF8] text-xl font-medium placeholder-[#6B7280] focus:outline-none focus:border-[#AEEC27] focus:bg-[#1A1D24] transition-all"
                    placeholder="Email Address"
                    required
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-5 bg-[#AEEC27] text-[#0D0E11] font-bold text-lg rounded-3xl shadow-[0_0_30px_rgba(174,236,39,0.3)] hover:shadow-[0_0_40px_rgba(174,236,39,0.4)] transition-all disabled:opacity-50 flex items-center justify-center"
                >
                  {loading ? (
                    <div className="w-6 h-6 border-3 border-[#0D0E11]/30 border-t-[#0D0E11] rounded-full animate-spin" />
                  ) : (
                    "Send Magic Link"
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setShowForgot(false)}
                  className="w-full py-4 text-[#A0A5B5] text-base font-medium hover:text-[#FDFFF8] transition-colors"
                >
                  ← Back to Login
                </button>
              </form>
            </motion.div>
          )}

          {/* ────────── STAGE 3: BRANCH SELECTION ────────── */}
          {stage === "branch" && (
            <motion.div key="branch" {...pageTransition} className="py-10">
              <motion.div
                className="text-center mb-12"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h2 className="text-[#FDFFF8] font-black text-5xl tracking-tight mb-3">
                  Centre
                </h2>
                <p className="text-[#A0A5B5] text-lg">
                  Select your assigned location
                </p>
              </motion.div>

              {/* Branch dropdown */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mb-8"
              >
                <div className="relative">
                  <select
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    className="w-full px-5 py-6 bg-[#1A1D24]/80 backdrop-blur-md border border-[#353A47] rounded-3xl text-[#FDFFF8] text-2xl font-bold focus:outline-none focus:border-[#AEEC27] focus:bg-[#1A1D24] transition-all appearance-none cursor-pointer"
                  >
                    {availableBranches.map((branch) => (
                      <option
                        key={branch}
                        value={branch}
                        className="text-[#0D0E11] bg-[#FDFFF8] font-semibold"
                      >
                        {formatBranchName(branch)}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-8 h-8 text-[#A0A5B5] pointer-events-none" />
                </div>
              </motion.div>

              {/* Sign In button */}
              <motion.button
                onClick={handleSignIn}
                disabled={loading}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="w-full py-6 bg-[#AEEC27] text-[#0D0E11] font-black text-2xl tracking-wide rounded-3xl shadow-[0_0_40px_rgba(174,236,39,0.3)] hover:shadow-[0_0_60px_rgba(174,236,39,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-8 h-8 border-4 border-[#0D0E11]/30 border-t-[#0D0E11] rounded-full animate-spin" />
                ) : (
                  <>
                    Enter Portal
                    <ArrowRight size={28} strokeWidth={3} />
                  </>
                )}
              </motion.button>
            </motion.div>
          )}

          {/* ────────── STAGE 4: LAUNCHING ────────── */}
          {stage === "launching" && (
            <motion.div
              key="launching"
              className="flex flex-col items-center justify-center text-center py-32"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <motion.div
                className="mb-10 relative"
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <div className="w-20 h-20 border-[4px] border-[#353A47] border-t-[#AEEC27] rounded-full" />
                <div className="absolute inset-0 w-20 h-20 border-[4px] border-transparent border-r-[#C0F050] rounded-full blur-[2px]" />
              </motion.div>

              <motion.h2
                className="text-[#FDFFF8] font-black text-3xl mb-3 tracking-tight"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Authenticating
              </motion.h2>
              <motion.p
                className="text-[#AEEC27] text-lg font-medium tracking-wide"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                Establishing secure connection
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── BOTTOM COPYRIGHT ── */}
      <motion.div
        className="absolute bottom-8 left-0 right-0 text-center z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
      >
        <p className="text-[#6B7280] text-xs font-semibold tracking-widest uppercase">
          © {new Date().getFullYear()} FETS.LIVE NETWORK
        </p>
      </motion.div>
    </div>
  );
}
