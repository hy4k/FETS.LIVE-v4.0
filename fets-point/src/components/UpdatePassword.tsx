import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Lock, ShieldCheck, ArrowRight } from "lucide-react";
import { supabase } from "../lib/supabase";
import { toast } from "react-hot-toast";

export function UpdatePassword({ onComplete }: { onComplete: () => void }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) return toast.error("Passwords do not match");
    if (password.length < 6)
      return toast.error("Minimum 6 characters required");

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Security credentials updated successfully");
      onComplete();
    } catch (err: any) {
      toast.error(err.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#e0e5ec] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[#e0e5ec] shadow-[20px_20px_60px_#bec3c9,-20px_-20px_60px_#ffffff] rounded-[2.5rem] p-10 border border-white/20"
      >
        <div className="text-center mb-10">
          <div className="inline-block p-5 rounded-2xl bg-[#e0e5ec] shadow-[inset_6px_6px_12px_#bec3c9,inset_-6px_-6px_12px_#ffffff] mb-6 text-blue-600">
            <ShieldCheck size={48} />
          </div>
          <h1 className="text-3xl font-black text-gray-800 uppercase tracking-tighter mb-2">
            Secure Reset
          </h1>
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
            Update Your Security Credentials
          </p>
        </div>

        <form onSubmit={handleUpdate} className="space-y-8">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">
              New Password
            </label>
            <div className="bg-[#e0e5ec] shadow-[inset_4px_4px_8px_#bec3c9,inset_-4px_-4px_8px_#ffffff] rounded-2xl p-4 flex items-center gap-3">
              <Lock size={18} className="text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent outline-none text-gray-700 font-bold"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">
              Confirm Password
            </label>
            <div className="bg-[#e0e5ec] shadow-[inset_4px_4px_8px_#bec3c9,inset_-4px_-4px_8px_#ffffff] rounded-2xl p-4 flex items-center gap-3">
              <Lock size={18} className="text-gray-400" />
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full bg-transparent outline-none text-gray-700 font-bold"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-blue-600 text-white font-black uppercase tracking-widest text-sm rounded-2xl shadow-lg hover:shadow-blue-500/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
          >
            {loading ? "Securing..." : "Verify & Launch"}
            <ArrowRight
              size={18}
              className="group-hover:translate-x-1 transition-transform"
            />
          </button>
        </form>
      </motion.div>
    </div>
  );
}
