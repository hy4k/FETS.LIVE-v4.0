import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Users, MapPin, ChevronRight } from "lucide-react";
import { supabase } from "../../lib/supabase";

interface StaffBranchSelectorProps {
  onSelect: (data: {
    staffId: string;
    branchId: string;
    staffName: string;
  }) => void;
  onClose: () => void;
}

export const StaffBranchSelector: React.FC<StaffBranchSelectorProps> = ({
  onSelect,
  onClose,
}) => {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");

  const branches = ["cochin", "calicut", "kannur", "trivandrum"];

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("staff_profiles")
      .select("user_id, full_name, branch_assigned")
      .order("full_name");

    if (!error && data) {
      setStaff(data);
    }
    setLoading(false);
  };

  const handleConfirm = () => {
    const selectedStaff = staff.find((s) => s.user_id === selectedStaffId);
    if (selectedStaffId && selectedBranch) {
      onSelect({
        staffId: selectedStaffId,
        branchId: selectedBranch,
        staffName: selectedStaff?.full_name || "Unknown",
      });
    }
  };

  const modalBg =
    "bg-[#1A1D24] shadow-[0_0_40px_rgba(0,0,0,0.5)] rounded-[2rem] border border-[#353A47]";
  const inputCls =
    "bg-[#15171C] shadow-inner rounded-xl border border-[#353A47] focus:border-[#AEEC27] p-4 w-full outline-none text-[#FDFFF8] font-bold placeholder:text-[#6B7280] transition-colors appearance-none";
  const btnCls =
    "px-8 py-4 rounded-2xl font-black uppercase tracking-widest transition-all active:scale-95 bg-[#AEEC27] text-[#0D0E11] hover:scale-[1.02] shadow-[0_0_20px_rgba(174,236,39,0.2)] hover:shadow-[0_0_30px_rgba(174,236,39,0.4)] disabled:opacity-50 disabled:hover:scale-100 disabled:shadow-none flex items-center justify-center gap-2 w-full mt-8";

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-[#0D0E11]/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className={`${modalBg} w-full max-w-md p-10 relative`}
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-xl bg-[#15171C] border border-[#353A47] text-[#6B7280] hover:text-[#FDFFF8] hover:border-[#AEEC27]/50 transition-all"
        >
          <X size={20} />
        </button>

        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-[#AEEC27]/10 border border-[#AEEC27]/30 rounded-2xl shadow-[0_0_20px_rgba(174,236,39,0.2)] flex items-center justify-center text-[#AEEC27] mx-auto mb-4">
            <Users size={32} />
          </div>
          <h2 className="text-2xl font-black text-[#FDFFF8] uppercase tracking-tight heading-outfit">
            Identity <span className="text-[#AEEC27]">Verification</span>
          </h2>
          <p className="text-[#A0A5B5] text-xs font-bold uppercase tracking-widest mt-2">
            Select Operator and Deployment Centre
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-[10px] font-black text-[#6B7280] uppercase tracking-[0.2em] mb-3 ml-1 flex items-center gap-2">
              <MapPin size={12} className="text-[#AEEC27]" /> Selective Centre
            </label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className={inputCls}
            >
              <option value="">Select Centre...</option>
              {branches.map((b) => (
                <option
                  key={b}
                  value={b}
                  className="bg-[#1A1D24] text-[#FDFFF8]"
                >
                  {b.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black text-[#6B7280] uppercase tracking-[0.2em] mb-3 ml-1 flex items-center gap-2">
              <Users size={12} className="text-[#AEEC27]" /> Active Staff
            </label>
            <select
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className={inputCls}
              disabled={loading}
            >
              <option value="">
                {loading ? "Syncing Staff..." : "Select Staff Member..."}
              </option>
              {staff.map((s) => (
                <option
                  key={s.user_id}
                  value={s.user_id}
                  className="bg-[#1A1D24] text-[#FDFFF8]"
                >
                  {s.full_name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleConfirm}
            disabled={!selectedStaffId || !selectedBranch}
            className={btnCls}
          >
            <span>Initialize Protocol</span>
            <ChevronRight size={20} />
          </button>
        </div>
      </motion.div>
    </div>
  );
};
