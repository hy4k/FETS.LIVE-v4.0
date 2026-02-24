import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Plus,
  Upload,
  Search,
  FileText,
  X,
  Cpu,
  LayoutDashboard,
  UserCheck,
  ShieldCheck,
  AlertCircle,
  Info,
  Download,
  Filter,
  Briefcase,
  MapPin,
  ArrowUpRight,
  Activity,
  Zap,
  Edit,
  Trash2,
  UserPlus,
  Save,
  Home,
  ExternalLink,
  ListChecks,
  ChevronDown,
  ClipboardCheck,
  BarChart3,
  Key,
  Link2,
  Globe,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useBranch } from "../hooks/useBranch";
import { useAuth } from "../hooks/useAuth";
import { toast } from "react-hot-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as XLSX from "xlsx";
import { useDashboardStats } from "../hooks/useCommandCentre";
import { AccessHub } from "./AccessHub";
import { ChecklistFormModal } from "./checklist/ChecklistFormModal";
import { StaffBranchSelector } from "./checklist/StaffBranchSelector";
import { ChecklistTemplate } from "../types/checklist";

// ─── PREMIUM UI CONSTANTS ───
const TODAY = () => new Date().toLocaleDateString("sv-SE");

const SHIFTS: Record<string, { l: string; c: string }> = {
  D: { l: "Day", c: "#F59E0B" },
  M: { l: "Morning", c: "#3B82F6" },
  E: { l: "Evening", c: "#8B5CF6" },
  N: { l: "Night", c: "#1E293B" },
  O: { l: "Off", c: "#94A3B8" },
  L: { l: "Leave", c: "#EF4444" },
};

const CLIENT_COLORS: Record<
  string,
  { bg: string; text: string; border: string; accent: string; glow: string }
> = {
  PROMETRIC: {
    bg: "#1E3A8A20",
    text: "#60A5FA",
    border: "#2563EB50",
    accent: "#3B82F6",
    glow: "shadow-[0_0_15px_rgba(59,130,246,0.3)]",
  },
  "PEARSON VUE": {
    bg: "#064E3B20",
    text: "#34D399",
    border: "#05966950",
    accent: "#10B981",
    glow: "shadow-[0_0_15px_rgba(16,185,129,0.3)]",
  },
  PSI: {
    bg: "#78350F20",
    text: "#FBBF24",
    border: "#D9770650",
    accent: "#F59E0B",
    glow: "shadow-[0_0_15px_rgba(245,158,11,0.3)]",
  },
  ETS: {
    bg: "#4C1D9520",
    text: "#A78BFA",
    border: "#7C3AED50",
    accent: "#8B5CF6",
    glow: "shadow-[0_0_15px_rgba(139,92,246,0.3)]",
  },
  ITTS: {
    bg: "#312E8120",
    text: "#818CF8",
    border: "#4F46E550",
    accent: "#6366F1",
    glow: "shadow-[0_0_15px_rgba(99,102,241,0.3)]",
  },
  IELTS: {
    bg: "#7F1D1D20",
    text: "#F87171",
    border: "#DC262650",
    accent: "#EF4444",
    glow: "shadow-[0_0_15px_rgba(239,68,68,0.3)]",
  },
  ACCA: {
    bg: "#134E4A20",
    text: "#2DD4BF",
    border: "#0D948850",
    accent: "#14B8A6",
    glow: "shadow-[0_0_15px_rgba(20,184,166,0.3)]",
  },
};
const getClientStyle = (name?: string) =>
  CLIENT_COLORS[name?.toUpperCase() || ""] || {
    bg: "#1E293B20",
    text: "#94A3B8",
    border: "#47556950",
    accent: "#64748B",
    glow: "shadow-[0_0_15px_rgba(100,116,139,0.3)]",
  };

const formatDisplayDate = (dateStr: string) => {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

// ─── DAILY OPS VIEW ───

function DailyOpsView({
  date,
  setDate,
  branch,
  onSelectCandidate,
  selCandidate,
}: {
  date: string;
  setDate: (d: string) => void;
  branch: string;
  onSelectCandidate: (c: any) => void;
  selCandidate: any;
}) {
  const [search, setSearch] = useState("");
  const [filterClient, setFilterClient] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<any>(null);
  const queryClient = useQueryClient();

  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: ["ops-candidates"] });
    queryClient.invalidateQueries({ queryKey: ["ops-sessions"] });
    queryClient.invalidateQueries({ queryKey: ["calendar-sessions-month"] });
    queryClient.invalidateQueries({ queryKey: ["clients-sessions"] });
  };

  const deleteCandidate = async (c: any) => {
    if (!confirm(`Delete candidate "${c.full_name}"?`)) return;
    try {
      await supabase.from("candidates").delete().eq("id", c.id);
      // Decrement session count
      if (c.client_name) {
        const { data: sess } = await supabase
          .from("calendar_sessions")
          .select("id, candidate_count")
          .eq("date", date)
          .eq("client_name", c.client_name)
          .eq("branch_location", branch)
          .maybeSingle();
        if (sess && sess.candidate_count > 1) {
          await supabase
            .from("calendar_sessions")
            .update({ candidate_count: sess.candidate_count - 1 })
            .eq("id", sess.id);
        } else if (sess) {
          await supabase.from("calendar_sessions").delete().eq("id", sess.id);
        }
      }
      if (selCandidate?.id === c.id) onSelectCandidate(null);
      toast.success("Candidate deleted");
      refreshAll();
    } catch (err: any) {
      toast.error("Delete failed: " + err.message);
    }
  };

  const { data: sessions = [] } = useQuery({
    queryKey: ["ops-sessions", branch, date],
    queryFn: async () => {
      const { data } = await supabase
        .from("calendar_sessions")
        .select("*")
        .eq("date", date)
        .eq("branch_location", branch)
        .order("start_time");
      return data || [];
    },
  });

  const { data: candidates = [] } = useQuery({
    queryKey: ["ops-candidates", branch, date],
    queryFn: async () => {
      const { data } = await supabase
        .from("candidates")
        .select("*")
        .gte("exam_date", `${date}T00:00:00`)
        .lt("exam_date", `${date}T23:59:59`)
        .eq("branch_location", branch)
        .order("full_name");
      return data || [];
    },
  });

  const { data: roster = [] } = useQuery({
    queryKey: ["ops-roster", branch, date],
    queryFn: async () => {
      const { data } = await supabase
        .from("roster_schedules")
        .select("*, staff_profiles(full_name, role)")
        .eq("date", date)
        .eq("branch_location", branch);
      return data || [];
    },
  });

  const checkInMutation = useMutation({
    mutationFn: async ({ id, checked }: { id: string; checked: boolean }) => {
      await supabase
        .from("candidates")
        .update({
          check_in_time: checked ? new Date().toISOString() : null,
          status: checked ? "checked_in" : "registered",
        })
        .eq("id", id);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["ops-candidates"] }),
  });

  const filtered = candidates.filter((c: any) => {
    const mSearch =
      !search ||
      c.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.confirmation_number?.toLowerCase().includes(search.toLowerCase());
    const mClient = !filterClient || c.client_name === filterClient;
    return mSearch && mClient;
  });

  const checkedIn = candidates.filter((c: any) => c.check_in_time).length;
  const onDuty = roster.filter((r: any) => !["O", "L"].includes(r.shift_code));

  const updateNotes = async (id: string, notes: string) => {
    await supabase.from("candidates").update({ notes: notes }).eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["ops-candidates"] });
  };

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        const uploads = data.map((row) => {
          const fullName =
            `${row["Candidate First Name"]} ${row["Candidate Last Name"]}`
              .replace(" NO LAST NAME", "")
              .trim();
          return {
            full_name: fullName,
            phone: String(row["PHONE NUMBER"] || ""),
            client_name: row["CLIENT NAME"],
            exam_name: row["EXAM NAME"],
            exam_date: `${date}T09:00:00`,
            address: row["PLACE"],
            branch_location: branch,
            status: "registered",
          };
        });

        if (uploads.length === 0)
          return toast.error("No valid data found in Excel");

        for (const up of uploads) {
          const { data: existingSess } = await supabase
            .from("calendar_sessions")
            .select("id, candidate_count")
            .eq("date", date)
            .eq("client_name", up.client_name)
            .eq("exam_name", up.exam_name)
            .eq("branch_location", branch)
            .single();

          if (existingSess) {
            await supabase
              .from("calendar_sessions")
              .update({
                candidate_count: (existingSess.candidate_count || 0) + 1,
              })
              .eq("id", existingSess.id);
          } else {
            await supabase.from("calendar_sessions").insert({
              date,
              client_name: up.client_name,
              exam_name: up.exam_name,
              candidate_count: 1,
              branch_location: branch,
              start_time: "09:00:00",
              end_time: "17:00:00",
            });
          }

          const { data: existingCand } = await supabase
            .from("candidates")
            .select("id")
            .eq("full_name", up.full_name)
            .eq("exam_date", up.exam_date)
            .eq("branch_location", branch)
            .single();

          if (existingCand) {
            await supabase
              .from("candidates")
              .update(up)
              .eq("id", existingCand.id);
          } else {
            await supabase.from("candidates").insert(up);
          }
        }

        toast.success(`Successfully processed ${uploads.length} candidates`);
        queryClient.invalidateQueries({ queryKey: ["ops-candidates"] });
        queryClient.invalidateQueries({ queryKey: ["ops-sessions"] });
      } catch (err: any) {
        console.error(err);
        toast.error("Excel processing failed: " + err.message);
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="flex flex-col h-full gap-8">
      {/* ── Top Bar: Date Navigation + Stats + Upload ── */}
      <div className="flex items-center justify-between gap-6">
        {/* Date Navigation */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              const d = new Date(date + "T00:00:00");
              d.setDate(d.getDate() - 1);
              setDate(d.toLocaleDateString("sv-SE"));
            }}
            className="w-12 h-12 rounded-2xl bg-[#1A1D24] shadow-[0_4px_15px_rgba(0,0,0,0.3)] flex items-center justify-center text-[#A0A5B5] hover:text-[#FDFFF8] active:scale-95 transition-all border border-[#353A47]"
          >
            <ChevronLeft size={24} />
          </button>
          <div className="text-center px-4">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-transparent text-2xl font-black text-[#FDFFF8] outline-none cursor-pointer tracking-tight heading-outfit [color-scheme:dark]"
            />
            <div className="text-[11px] font-bold text-[#F59E0B] uppercase tracking-[0.2em] mt-1">
              {date === TODAY()
                ? "● Today"
                : new Date(date + "T00:00:00").toLocaleDateString("en-IN", {
                    weekday: "long",
                  })}
            </div>
          </div>
          <button
            onClick={() => {
              const d = new Date(date + "T00:00:00");
              d.setDate(d.getDate() + 1);
              setDate(d.toLocaleDateString("sv-SE"));
            }}
            className="w-12 h-12 rounded-2xl bg-[#1A1D24] shadow-[0_4px_15px_rgba(0,0,0,0.3)] flex items-center justify-center text-[#A0A5B5] hover:text-[#FDFFF8] active:scale-95 transition-all border border-[#353A47]"
          >
            <ChevronRight size={24} />
          </button>
        </div>

        {/* Live Stats + Add Button */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              setEditingCandidate(null);
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 px-6 py-3.5 bg-[#F59E0B] text-[#0D0E11] rounded-2xl shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:shadow-[0_0_30px_rgba(245,158,11,0.4)] hover:-translate-y-0.5 active:translate-y-0 transition-all text-xs font-black uppercase tracking-wider"
          >
            <UserPlus size={18} strokeWidth={2.5} /> Add Candidate
          </button>
          {[
            {
              label: "Sessions",
              value: sessions.length,
              color: "text-[#3B82F6]",
              bg: "bg-[#3B82F6]/10",
              icon: Calendar,
            },
            {
              label: "Checked In",
              value: `${checkedIn}/${candidates.length}`,
              color: "text-[#F59E0B]",
              bg: "bg-[#F59E0B]/10",
              icon: CheckCircle,
            },
            {
              label: "On Duty",
              value: onDuty.length,
              color: "text-[#F59E0B]",
              bg: "bg-[#F59E0B]/10",
              icon: Users,
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-4 bg-[#1A1D24] rounded-2xl px-5 py-3 shadow-[0_4px_15px_rgba(0,0,0,0.3)] border border-[#353A47]"
            >
              <div
                className={`w-12 h-12 rounded-xl border border-white/5 ${stat.bg} flex items-center justify-center ${stat.color}`}
              >
                <stat.icon size={20} />
              </div>
              <div>
                <div className="text-[10px] font-bold text-[#A0A5B5] uppercase tracking-widest">
                  {stat.label}
                </div>
                <div className="text-xl font-black text-[#FDFFF8] leading-none mt-1 heading-outfit">
                  {stat.value}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Client Sessions Strip ── */}
      {sessions.length > 0 && (
        <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-2">
          <span className="text-[10px] font-bold text-[#A0A5B5] uppercase tracking-[0.2em] shrink-0 ml-1">
            Active Sessions
          </span>
          <div className="h-6 w-px bg-[#353A47] shrink-0" />
          {sessions.map((s: any) => {
            const style = getClientStyle(s.client_name);
            return (
              <motion.div
                key={s.id}
                whileHover={{ y: -2, scale: 1.02 }}
                className={`flex items-center gap-4 px-6 py-4 rounded-2xl border border-white/5 shrink-0 cursor-pointer ${style.glow} transition-all`}
                style={{ backgroundColor: style.bg, borderColor: style.border }}
              >
                <div
                  className="w-2.5 h-10 rounded-full"
                  style={{ backgroundColor: style.accent }}
                />
                <div>
                  <div
                    className="text-sm font-black uppercase tracking-tight"
                    style={{ color: style.text }}
                  >
                    {s.client_name || "Unknown"}
                  </div>
                  <div className="text-[10px] font-medium text-[#A0A5B5] mt-0.5">
                    {(s.exam_name || "").substring(0, 35)}
                  </div>
                </div>
                <div className="flex flex-col items-center ml-2">
                  <span className="text-[9px] font-bold text-[#A0A5B5] uppercase">
                    Time
                  </span>
                  <span className="text-sm font-black text-[#FDFFF8]">
                    {s.start_time?.slice(0, 5)}
                  </span>
                </div>
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black text-[#0D0E11] shadow-md ml-2"
                  style={{ backgroundColor: style.accent }}
                >
                  {s.candidate_count || 0}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── Staff Strip ── */}
      {onDuty.length > 0 && (
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
          <span className="text-[10px] font-bold text-[#A0A5B5] uppercase tracking-[0.2em] mr-1 ml-1 shrink-0">
            Personnel
          </span>
          <div className="h-4 w-px bg-[#353A47] shrink-0" />
          {onDuty.map((r: any) => (
            <div
              key={r.id}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1A1D24] border border-[#353A47] shrink-0"
            >
              <div
                className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_currentColor]"
                style={{
                  backgroundColor: SHIFTS[r.shift_code]?.c,
                  color: SHIFTS[r.shift_code]?.c,
                }}
              />
              <span className="text-xs font-bold text-[#FDFFF8]">
                {r.staff_profiles?.full_name || "Staff"}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── Main Split (Candidate List + Details) ── */}
      <div className="flex-1 flex gap-8 min-h-0">
        {/* Left Panel: Candidate List */}
        <div className="w-[42%] flex flex-col min-h-0 gap-5">
          <div className="flex gap-4">
            <div className="flex-1 flex items-center px-5 py-3.5 bg-[#1A1D24] rounded-2xl border border-[#353A47] shadow-inner focus-within:border-[#F59E0B] transition-colors">
              <Search size={18} className="text-[#6B7280] mr-3" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search candidates..."
                className="bg-transparent border-none outline-none text-sm font-bold text-[#FDFFF8] w-full placeholder:text-[#6B7280]"
              />
            </div>
            <select
              value={filterClient}
              onChange={(e) => setFilterClient(e.target.value)}
              className="px-5 py-2 bg-[#1A1D24] rounded-2xl text-xs font-bold uppercase text-[#A0A5B5] border border-[#353A47] outline-none cursor-pointer focus:border-[#F59E0B] transition-colors"
            >
              <option value="">All Clients</option>
              {Object.keys(CLIENT_COLORS).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pr-2 pb-6">
            {filtered.map((c: any) => {
              const cStyle = getClientStyle(c.client_name);
              return (
                <div
                  key={c.id}
                  onClick={() => onSelectCandidate(c)}
                  className={`p-4 rounded-2xl transition-all cursor-pointer border flex items-center gap-4 ${
                    selCandidate?.id === c.id
                      ? "border-[#F59E0B] bg-[#F59E0B]/5 shadow-[0_0_15px_rgba(245,158,11,0.15)]"
                      : "bg-[#15171C] border-[#353A47] hover:bg-[#1A1D24] hover:border-[#A0A5B5]/30"
                  }`}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      checkInMutation.mutate({
                        id: c.id,
                        checked: !c.check_in_time,
                      });
                    }}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                      c.check_in_time
                        ? "bg-[#F59E0B] text-[#0D0E11] shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                        : "bg-[#222630] text-[#6B7280] hover:bg-[#353A47] hover:text-[#A0A5B5]"
                    }`}
                  >
                    <CheckCircle
                      size={20}
                      strokeWidth={c.check_in_time ? 2.5 : 2}
                    />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-black text-[#FDFFF8] truncate">
                      {c.full_name}
                    </div>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span
                        className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border"
                        style={{
                          backgroundColor: cStyle.bg,
                          color: cStyle.accent,
                          borderColor: cStyle.border,
                        }}
                      >
                        {c.client_name || "N/A"}
                      </span>
                      <span className="text-[10px] font-medium text-[#A0A5B5]">
                        {c.address || "—"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {c.check_in_time && (
                      <span className="text-[10px] font-black text-[#0D0E11] bg-[#F59E0B] px-2 py-1 rounded border border-[#F59E0B] mr-2">
                        IN
                      </span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingCandidate(c);
                        setShowAddModal(true);
                      }}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-[#A0A5B5] hover:text-[#3B82F6] hover:bg-[#3B82F6]/10 transition-colors"
                      title="Edit"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteCandidate(c);
                      }}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-[#A0A5B5] hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="text-center py-24 text-[#6B7280] text-lg font-bold italic tracking-widest heading-outfit">
                NO RECORDS FOUND
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Details */}
        <div className="flex-1 min-h-0">
          <AnimatePresence mode="wait">
            {!selCandidate ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex flex-col items-center justify-center p-10 text-center border-2 border-dashed border-[#353A47] rounded-3xl bg-[#15171C]/50"
              >
                <div className="w-24 h-24 bg-[#1A1D24] border border-[#353A47] rounded-3xl shadow-inner flex items-center justify-center text-[#6B7280] mb-8">
                  <Users size={48} strokeWidth={1.5} />
                </div>
                <h3 className="text-3xl font-black text-[#A0A5B5] uppercase tracking-tight heading-outfit">
                  Select Candidate
                </h3>
                <p className="text-sm font-medium text-[#6B7280] mt-4 max-w-sm">
                  Choose a candidate from the left panel to view their complete
                  profile and perform check-in operations.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key={selCandidate.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="h-full overflow-y-auto no-scrollbar bg-[#1A1D24]/80 backdrop-blur-xl rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] border border-[#353A47] p-10 flex flex-col relative"
              >
                {/* Accent line at top */}
                <div className="absolute top-0 left-10 right-10 h-1 bg-gradient-to-r from-transparent via-[#F59E0B] to-transparent opacity-50" />

                {/* Candidate Header */}
                <div className="flex items-center gap-6 mb-12 pb-8 border-b border-[#353A47]">
                  <div className="w-24 h-24 rounded-3xl bg-[#F59E0B] flex items-center justify-center text-[#0D0E11] text-4xl font-black shadow-[0_0_30px_rgba(245,158,11,0.3)] heading-outfit">
                    {(selCandidate.full_name || "?").charAt(0)}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-4xl font-black text-[#FDFFF8] tracking-tighter uppercase leading-none heading-outfit">
                      {selCandidate.full_name}
                    </h2>
                    <div className="flex items-center gap-4 mt-4">
                      {(() => {
                        const s = getClientStyle(selCandidate.client_name);
                        return (
                          <div
                            className="px-4 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider border shadow-sm"
                            style={{
                              backgroundColor: s.bg,
                              color: s.accent,
                              borderColor: s.border,
                            }}
                          >
                            {selCandidate.client_name || "N/A"}
                          </div>
                        );
                      })()}
                      <div className="px-4 py-1.5 bg-[#2A2E39] rounded-lg text-[11px] font-black text-[#A0A5B5] uppercase tracking-wider border border-[#353A47]">
                        ID:{" "}
                        <span className="text-[#FDFFF8]">
                          {selCandidate.confirmation_number || "UNKNOWN"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      if (
                        !selCandidate.check_in_time &&
                        selCandidate.notes &&
                        selCandidate.full_name !== selCandidate.notes
                      ) {
                        const cprText = `Candidate name appeared in the roster as "${selCandidate.full_name}" but in the primary ID it shown as "${selCandidate.notes}"`;
                        await supabase.from("incidents").insert({
                          title: `Identity Disparity: ${selCandidate.full_name}`,
                          description: cprText,
                          category: "cpr",
                          status: "open",
                          user_id: (
                            await supabase.auth.getUser()
                          ).data.user?.id,
                          branch_location: branch,
                        });
                        toast.success(
                          "CPR auto-generated due to name disparity"
                        );
                      }
                      checkInMutation.mutate({
                        id: selCandidate.id,
                        checked: !selCandidate.check_in_time,
                      });
                    }}
                    className={`px-8 py-5 rounded-2xl text-xs font-black uppercase tracking-[0.15em] transition-all active:scale-95 shrink-0 border ${
                      selCandidate.check_in_time
                        ? "bg-[#F59E0B] text-[#0D0E11] shadow-[0_0_20px_rgba(245,158,11,0.4)] border-[#F59E0B]"
                        : "bg-[#15171C] text-[#FDFFF8] hover:bg-[#2A2E39] border-[#353A47] hover:border-[#A0A5B5]/50 hover:shadow-lg"
                    }`}
                  >
                    {selCandidate.check_in_time
                      ? "✓ Checked In"
                      : "Verify & Process"}
                  </button>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-10 flex-1">
                  <div className="space-y-10">
                    <section>
                      <label className="flex items-center gap-3 text-[11px] font-black text-[#F59E0B] uppercase tracking-[0.3em] mb-5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
                        Exam Details
                      </label>
                      <div className="space-y-6 bg-[#15171C] rounded-2xl p-6 border border-[#353A47] shadow-inner">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-[#6B7280] font-bold uppercase tracking-wider mb-1.5">
                            Session Module
                          </span>
                          <span className="text-base font-black text-[#FDFFF8]">
                            {selCandidate.exam_name || "—"}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-[#6B7280] font-bold uppercase tracking-wider mb-1.5">
                            Timeline
                          </span>
                          <span className="text-base font-black text-[#FDFFF8]">
                            {formatDisplayDate(date)}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-5">
                          <div className="flex flex-col">
                            <span className="text-[10px] text-[#6B7280] font-bold uppercase tracking-wider mb-1.5">
                              Place
                            </span>
                            <span className="text-base font-bold text-[#A0A5B5]">
                              {selCandidate.address || "—"}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] text-[#6B7280] font-bold uppercase tracking-wider mb-1.5">
                              Phone
                            </span>
                            <span className="text-base font-bold text-[#A0A5B5]">
                              {selCandidate.phone || "—"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </section>
                    <section>
                      <label className="flex items-center gap-3 text-[11px] font-black text-[#F59E0B] uppercase tracking-[0.3em] mb-5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
                        Name as per ID
                      </label>
                      <textarea
                        defaultValue={selCandidate.notes || ""}
                        onBlur={(e) =>
                          updateNotes(selCandidate.id, e.target.value)
                        }
                        placeholder="Enter name exactly as it appears on the ID..."
                        className="w-full p-5 h-24 text-sm font-medium text-[#FDFFF8] bg-[#15171C] rounded-2xl outline-none resize-none shadow-inner border border-[#353A47] placeholder:text-[#6B7280] focus:border-[#F59E0B]/50 transition-colors"
                      />
                    </section>
                  </div>
                  <div className="space-y-10">
                    <section>
                      <label className="flex items-center gap-3 text-[11px] font-black text-[#F59E0B] uppercase tracking-[0.3em] mb-5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
                        Identity Check
                      </label>
                      <p className="text-xs font-medium text-[#A0A5B5] leading-relaxed mb-6">
                        Validate physical ID against digital record. Ensure 1:1
                        name parity before processing.
                      </p>
                      <div className="p-6 bg-[#15171C] rounded-2xl border border-[#353A47] shadow-inner">
                        <div className="text-[10px] font-black text-[#6B7280] uppercase tracking-wider mb-2">
                          Registered Name
                        </div>
                        <div className="text-2xl font-black text-[#FDFFF8] heading-outfit">
                          {selCandidate.full_name}
                        </div>
                      </div>
                    </section>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Add/Edit Candidate Modal */}
      <CandidateFormModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingCandidate(null);
        }}
        branch={branch}
        date={date}
        editCandidate={editingCandidate}
        onSaved={refreshAll}
      />
    </div>
  );
}

// ─── ROSTER VIEW ───

function RosterView({
  date,
  setDate,
  branch,
}: {
  date: string;
  setDate: (d: string) => void;
  branch: string;
}) {
  const { data: staffProfiles = [] } = useQuery({
    queryKey: ["staff-profiles"],
    queryFn: async () => {
      const { data } = await supabase
        .from("staff_profiles")
        .select("*")
        .eq("status", "active")
        .order("full_name");
      return data || [];
    },
  });
  const { data: schedules = [], refetch } = useQuery({
    queryKey: ["roster-data", branch, date],
    queryFn: async () => {
      const d = new Date(date + "T00:00:00");
      const start = new Date(d);
      start.setDate(d.getDate() - d.getDay() + 1);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      const { data } = await supabase
        .from("roster_schedules")
        .select("*")
        .gte("date", start.toLocaleDateString("sv-SE"))
        .lte("date", end.toLocaleDateString("sv-SE"))
        .eq("branch_location", branch);
      return data || [];
    },
  });

  const scheduleMap = schedules.reduce((acc: any, curr: any) => {
    acc[`${curr.profile_id}_${curr.date}`] = curr;
    return acc;
  }, {} as any);
  const weekDates = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(date + "T00:00:00");
    const start = new Date(d);
    start.setDate(d.getDate() - d.getDay() + 1);
    const current = new Date(start);
    current.setDate(start.getDate() + i);
    return current.toLocaleDateString("sv-SE");
  });

  const cycleShift = async (sId: string, dStr: string, current: any) => {
    const codes = Object.keys(SHIFTS);
    const nextCode =
      codes[(codes.indexOf(current?.shift_code || "") + 1) % codes.length];
    if (current) {
      await supabase
        .from("roster_schedules")
        .update({ shift_code: nextCode })
        .eq("id", current.id);
    } else {
      await supabase
        .from("roster_schedules")
        .insert({
          profile_id: sId,
          date: dStr,
          shift_code: nextCode,
          branch_location: branch,
          status: "confirmed",
        });
    }
    refetch();
  };

  const changeWeek = (off: number) => {
    const d = new Date(date + "T00:00:00");
    d.setDate(d.getDate() + off * 7);
    setDate(d.toLocaleDateString("sv-SE"));
  };

  return (
    <div className="space-y-8 h-full overflow-y-auto no-scrollbar">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => changeWeek(-1)}
            className="w-12 h-12 rounded-2xl bg-[#1A1D24] shadow-[0_4px_15px_rgba(0,0,0,0.3)] flex items-center justify-center text-[#A0A5B5] hover:text-[#FDFFF8] active:scale-95 transition-all border border-[#353A47]"
          >
            <ChevronLeft size={24} />
          </button>
          <h2 className="text-3xl font-black text-[#FDFFF8] tracking-tighter uppercase heading-outfit">
            Personnel Roster
          </h2>
          <button
            onClick={() => changeWeek(1)}
            className="w-12 h-12 rounded-2xl bg-[#1A1D24] shadow-[0_4px_15px_rgba(0,0,0,0.3)] flex items-center justify-center text-[#A0A5B5] hover:text-[#FDFFF8] active:scale-95 transition-all border border-[#353A47]"
          >
            <ChevronRight size={24} />
          </button>
        </div>
        <div className="flex gap-4">
          {Object.entries(SHIFTS).map(([code, s]) => (
            <div
              key={code}
              className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[#A0A5B5]"
            >
              <div
                className="w-3 h-3 rounded shadow-[0_0_8px_currentColor]"
                style={{ backgroundColor: s.c, color: s.c }}
              />
              <span>
                {code}={s.l}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#1A1D24]/80 backdrop-blur-xl rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] border border-[#353A47] overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#353A47] bg-[#15171C]/50">
              <th className="p-6 text-[11px] font-black text-[#6B7280] uppercase tracking-[0.3em]">
                Staff Member
              </th>
              {weekDates.map((d) => (
                <th key={d} className="p-4 text-center">
                  <div className="text-[10px] font-bold text-[#A0A5B5] uppercase mb-1">
                    {new Date(d + "T00:00:00").toLocaleDateString("en-IN", {
                      weekday: "short",
                    })}
                  </div>
                  <div
                    className={`text-2xl font-black heading-outfit ${
                      d === TODAY() ? "text-[#F59E0B]" : "text-[#FDFFF8]"
                    }`}
                  >
                    {d.split("-")[2]}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {staffProfiles.map((s: any) => (
              <tr
                key={s.id}
                className="border-b border-[#353A47]/50 hover:bg-[#2A2E39]/30 transition-colors"
              >
                <td className="p-6">
                  <div className="text-sm font-black text-[#FDFFF8] uppercase tracking-tight">
                    {s.full_name}
                  </div>
                  <div className="text-[9px] font-bold text-[#F59E0B] uppercase tracking-widest mt-1.5">
                    {s.role?.replace("_", " ")}
                  </div>
                </td>
                {weekDates.map((d) => {
                  const sched = scheduleMap[`${s.id}_${d}`];
                  return (
                    <td key={d} className="p-2 text-center">
                      <button
                        onClick={() => cycleShift(s.id, d, sched)}
                        className="w-12 h-12 rounded-xl border border-white/10 flex items-center justify-center text-[#FDFFF8] text-xs font-black shadow-[0_4px_10px_rgba(0,0,0,0.4)] transition-transform hover:scale-110 active:scale-95 mx-auto"
                        style={{
                          backgroundColor:
                            SHIFTS[sched?.shift_code]?.c || "#2A2E39",
                        }}
                      >
                        {sched?.shift_code || "—"}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── CPR VIEW ───

function CPRView({ branch }: { branch: string }) {
  const { data: cprs = [], refetch } = useQuery({
    queryKey: ["cpr-data", branch],
    queryFn: async () => {
      const { data } = await supabase
        .from("incidents")
        .select("*")
        .eq("category", "cpr")
        .eq("branch_location", branch)
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const [showManual, setShowManual] = useState(false);
  const [newCpr, setNewCpr] = useState({ title: "", description: "" });

  const createCpr = async () => {
    if (!newCpr.title || !newCpr.description)
      return toast.error("Both fields are required");
    await supabase.from("incidents").insert({
      ...newCpr,
      category: "cpr",
      status: "open",
      branch_location: branch,
      user_id: (await supabase.auth.getSingleSession()).data.session?.user?.id,
    });
    toast.success("CPR entry created");
    setShowManual(false);
    setNewCpr({ title: "", description: "" });
    refetch();
  };

  return (
    <div className="flex flex-col h-full gap-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black text-[#FDFFF8] tracking-tighter uppercase heading-outfit">
          Candidate Profile Reports
        </h2>
        <button
          onClick={() => setShowManual(true)}
          className="flex items-center gap-2 px-6 py-4 bg-[#15171C] rounded-2xl text-xs font-black uppercase tracking-wider text-[#A0A5B5] shadow-[0_4px_15px_rgba(0,0,0,0.3)] hover:text-[#F59E0B] hover:border-[#F59E0B] active:scale-95 transition-all border border-[#353A47]"
        >
          <Plus size={18} strokeWidth={2.5} /> Create CPR
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pr-2">
        {cprs.map((c: any) => (
          <div
            key={c.id}
            className="bg-[#1A1D24]/80 backdrop-blur-xl rounded-2xl p-6 flex flex-col gap-4 relative overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)] border border-[#353A47] hover:border-[#A0A5B5]/30 transition-colors"
          >
            <div className="bg-[#F59E0B] shadow-[0_0_15px_rgba(245,158,11,0.5)] absolute top-0 left-0 w-1.5 h-full rounded-r" />
            <div className="flex items-center justify-between ml-4">
              <span className="text-[10px] font-black text-[#6B7280] uppercase tracking-widest">
                {new Date(c.created_at).toLocaleDateString()}
              </span>
              <span className="px-3 py-1 bg-[#F59E0B]/10 text-[#F59E0B] text-[9px] font-black rounded border border-[#F59E0B]/30 uppercase tracking-widest">
                Active
              </span>
            </div>
            <h3 className="text-xl font-black text-[#FDFFF8] uppercase tracking-tight ml-4 heading-outfit">
              {c.title}
            </h3>
            <p className="text-sm font-medium text-[#A0A5B5] leading-relaxed ml-4">
              "{c.description}"
            </p>
          </div>
        ))}
        {cprs.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center opacity-40 py-24 text-[#6B7280] font-black uppercase tracking-[0.3em] text-sm heading-outfit">
            No CPR entries recorded on this branch.
          </div>
        )}
      </div>

      <AnimatePresence>
        {showManual && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0D0E11]/80 backdrop-blur-md p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-lg p-10 bg-[#15171C] rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-[#353A47] relative"
            >
              <button
                onClick={() => setShowManual(false)}
                className="absolute top-6 right-6 p-2 text-[#6B7280] hover:text-[#EF4444] rounded-xl hover:bg-[#EF4444]/10 transition-colors"
              >
                <X size={24} />
              </button>
              <h2 className="text-2xl font-black text-[#FDFFF8] tracking-tight uppercase mb-8 heading-outfit">
                Manual CPR Entry
              </h2>
              <div className="space-y-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-black text-[#F59E0B] uppercase tracking-[0.2em]">
                    Subject Title
                  </label>
                  <input
                    value={newCpr.title}
                    onChange={(e) =>
                      setNewCpr({ ...newCpr, title: e.target.value })
                    }
                    className="p-4 text-sm font-bold bg-[#1A1D24] text-[#FDFFF8] outline-none rounded-2xl shadow-inner border border-[#353A47] placeholder:text-[#6B7280] focus:border-[#F59E0B] transition-colors"
                    placeholder="e.g. Identity Disparity - John Doe"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-black text-[#F59E0B] uppercase tracking-[0.2em]">
                    Report Narrative
                  </label>
                  <textarea
                    value={newCpr.description}
                    onChange={(e) =>
                      setNewCpr({ ...newCpr, description: e.target.value })
                    }
                    className="p-4 text-sm font-medium bg-[#1A1D24] text-[#FDFFF8] outline-none h-40 resize-none rounded-2xl shadow-inner border border-[#353A47] placeholder:text-[#6B7280] focus:border-[#F59E0B] transition-colors"
                    placeholder="Provide detailed context..."
                  />
                </div>
                <button
                  onClick={createCpr}
                  className="w-full py-5 bg-[#F59E0B] text-[#0D0E11] font-black uppercase tracking-[0.2em] rounded-2xl shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:shadow-[0_0_30px_rgba(245,158,11,0.4)] active:scale-95 transition-all text-sm mt-4"
                >
                  Record CPR Entry
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── UPLOAD ROSTER VIEW ───

function UploadRosterView({
  date,
  setDate,
  branch,
}: {
  date: string;
  setDate: (d: string) => void;
  branch: string;
}) {
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [lastUpload, setLastUpload] = useState<{
    count: number;
    time: string;
  } | null>(null);

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        const uploads = data.map((row) => {
          const fullName =
            `${row["Candidate First Name"]} ${row["Candidate Last Name"]}`
              .replace(" NO LAST NAME", "")
              .trim();
          return {
            full_name: fullName,
            phone: String(row["PHONE NUMBER"] || ""),
            client_name: row["CLIENT NAME"],
            exam_name: row["EXAM NAME"],
            exam_date: `${date}T09:00:00`,
            address: row["PLACE"],
            branch_location: branch,
            status: "registered",
          };
        });

        if (uploads.length === 0) {
          setIsUploading(false);
          return toast.error("No valid data found in Excel");
        }

        for (const up of uploads) {
          const { data: existingSess } = await supabase
            .from("calendar_sessions")
            .select("id, candidate_count")
            .eq("date", date)
            .eq("client_name", up.client_name)
            .eq("exam_name", up.exam_name)
            .eq("branch_location", branch)
            .single();

          if (existingSess) {
            await supabase
              .from("calendar_sessions")
              .update({
                candidate_count: (existingSess.candidate_count || 0) + 1,
              })
              .eq("id", existingSess.id);
          } else {
            await supabase
              .from("calendar_sessions")
              .insert({
                date,
                client_name: up.client_name,
                exam_name: up.exam_name,
                candidate_count: 1,
                branch_location: branch,
                start_time: "09:00:00",
                end_time: "17:00:00",
              });
          }

          const { data: existingCand } = await supabase
            .from("candidates")
            .select("id")
            .eq("full_name", up.full_name)
            .eq("exam_date", up.exam_date)
            .eq("branch_location", branch)
            .single();

          if (existingCand) {
            await supabase
              .from("candidates")
              .update(up)
              .eq("id", existingCand.id);
          } else {
            await supabase.from("candidates").insert(up);
          }
        }

        toast.success(`Successfully processed ${uploads.length} candidates`);
        setLastUpload({
          count: uploads.length,
          time: new Date().toLocaleTimeString(),
        });
        queryClient.invalidateQueries({ queryKey: ["ops-candidates"] });
        queryClient.invalidateQueries({ queryKey: ["ops-sessions"] });
        queryClient.invalidateQueries({
          queryKey: ["calendar-sessions-month"],
        });
        queryClient.invalidateQueries({ queryKey: ["clients-sessions"] });
      } catch (err: any) {
        console.error(err);
        toast.error("Excel processing failed: " + err.message);
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="h-full flex flex-col items-center justify-center gap-10 max-w-2xl mx-auto">
      {/* Hero Upload Area */}
      <div className="text-center mb-6">
        <div className="w-24 h-24 mx-auto rounded-3xl bg-[#1A1D24] shadow-[0_0_30px_rgba(245,158,11,0.2)] border border-[#353A47] flex items-center justify-center text-[#F59E0B] mb-8 relative">
          <div className="absolute inset-0 bg-[#F59E0B] blur-2xl opacity-10 rounded-3xl"></div>
          <Upload size={40} strokeWidth={1.5} className="relative z-10" />
        </div>
        <h2 className="text-4xl font-black text-[#FDFFF8] tracking-tighter uppercase heading-outfit">
          Upload Daily Roster
        </h2>
        <p className="text-base font-medium text-[#A0A5B5] mt-4 max-w-md mx-auto leading-relaxed">
          Import your daily candidate roster from an Excel spreadsheet. This
          will create sessions, register candidates, and prepare the operations
          dashboard.
        </p>
      </div>

      {/* Date Selection */}
      <div className="flex items-center gap-4 bg-[#15171C] rounded-2xl px-8 py-5 shadow-inner border border-[#353A47] w-full max-w-md">
        <Calendar size={24} className="text-[#F59E0B]" />
        <span className="text-xs font-black text-[#A0A5B5] uppercase tracking-[0.2em] flex-1">
          Target Date:
        </span>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="bg-transparent text-xl font-black text-[#FDFFF8] outline-none cursor-pointer [color-scheme:dark] heading-outfit"
        />
      </div>

      {/* Upload Zone */}
      <label className="w-full cursor-pointer group">
        <input
          type="file"
          className="hidden"
          accept=".xlsx,.xls"
          onChange={handleExcelUpload}
        />
        <motion.div
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className={`w-full py-20 rounded-3xl border-2 border-dashed transition-all flex flex-col items-center gap-6 ${
            isUploading
              ? "border-[#F59E0B] bg-[#F59E0B]/5"
              : "border-[#353A47] bg-[#1A1D24]/50 hover:border-[#F59E0B]/80 hover:bg-[#15171C] hover:shadow-[0_0_30px_rgba(245,158,11,0.1)]"
          }`}
        >
          {isUploading ? (
            <>
              <div className="w-16 h-16 rounded-full border-4 border-[#353A47] border-t-[#F59E0B] animate-spin" />
              <span className="text-sm font-black text-[#F59E0B] uppercase tracking-[0.2em]">
                Processing Data...
              </span>
            </>
          ) : (
            <>
              <div className="w-20 h-20 rounded-2xl bg-[#2A2E39] border border-[#353A47] flex items-center justify-center text-[#A0A5B5] group-hover:text-[#F59E0B] group-hover:scale-110 group-hover:-translate-y-2 transition-all duration-300">
                <ArrowUpRight size={40} />
              </div>
              <div className="text-center">
                <span className="block text-lg font-black text-[#FDFFF8] uppercase tracking-wider heading-outfit">
                  Click to Select Excel File
                </span>
                <span className="block text-sm font-medium text-[#6B7280] mt-2">
                  Supports .xlsx and .xls formats
                </span>
              </div>
            </>
          )}
        </motion.div>
      </label>

      {/* Last Upload Info */}
      {lastUpload && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 bg-[#F59E0B]/10 text-[#F59E0B] px-8 py-5 rounded-2xl border border-[#F59E0B]/30 shadow-[0_0_20px_rgba(245,158,11,0.1)] w-full"
        >
          <CheckCircle size={24} strokeWidth={2.5} />
          <span className="text-sm font-bold">
            Last upload:{" "}
            <strong className="font-black tracking-wider">
              {lastUpload.count} candidates
            </strong>{" "}
            processed at {lastUpload.time}
          </span>
        </motion.div>
      )}

      {/* Accepted Format Info */}
      <div className="text-center text-[10px] font-black text-[#6B7280] uppercase tracking-[0.3em]">
        Expected columns: Candidate First Name · Candidate Last Name · CLIENT
        NAME · EXAM NAME · PHONE NUMBER · PLACE
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ─── CALENDAR VIEW (Monthly Grid with Session Counts) ───
// ═══════════════════════════════════════════════════════════════

function CalendarView({
  branch,
  onDateSelect,
}: {
  branch: string;
  onDateSelect: (d: string) => void;
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const startStr = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const endDay = new Date(year, month + 1, 0).getDate();
  const endStr = `${year}-${String(month + 1).padStart(2, "0")}-${endDay}`;

  const { data: sessions = [] } = useQuery({
    queryKey: ["calendar-sessions-month", branch, startStr, endStr],
    queryFn: async () => {
      let q = supabase
        .from("calendar_sessions")
        .select("*")
        .gte("date", startStr)
        .lte("date", endStr)
        .order("date");
      if (branch !== "global") q = q.eq("branch_location", branch);
      const { data } = await q;
      return data || [];
    },
  });

  // Group sessions by date
  const sessionsByDate = useMemo(() => {
    const map: Record<string, any[]> = {};
    sessions.forEach((s: any) => {
      if (!map[s.date]) map[s.date] = [];
      map[s.date].push(s);
    });
    return map;
  }, [sessions]);

  // Build calendar grid
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0=Sun
  const startOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // Mon=0
  const totalCells = startOffset + endDay;
  const rows = Math.ceil(totalCells / 7);
  const today = TODAY();

  const changeMonth = (dir: number) => {
    const d = new Date(currentMonth);
    d.setMonth(d.getMonth() + dir);
    setCurrentMonth(d);
  };

  const monthTotal = sessions.reduce(
    (sum: number, s: any) => sum + (s.candidate_count || 0),
    0
  );

  return (
    <div className="h-full flex flex-col gap-6 overflow-y-auto no-scrollbar">
      {/* Month Nav + Stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => changeMonth(-1)}
            className="w-12 h-12 rounded-2xl bg-[#1A1D24] shadow-[0_4px_15px_rgba(0,0,0,0.3)] flex items-center justify-center text-[#A0A5B5] hover:text-[#FDFFF8] active:scale-95 transition-all border border-[#353A47]"
          >
            <ChevronLeft size={24} />
          </button>
          <h2 className="text-3xl font-black text-[#FDFFF8] tracking-tighter uppercase min-w-[240px] text-center heading-outfit">
            {currentMonth.toLocaleDateString("en-IN", {
              month: "long",
              year: "numeric",
            })}
          </h2>
          <button
            onClick={() => changeMonth(1)}
            className="w-12 h-12 rounded-2xl bg-[#1A1D24] shadow-[0_4px_15px_rgba(0,0,0,0.3)] flex items-center justify-center text-[#A0A5B5] hover:text-[#FDFFF8] active:scale-95 transition-all border border-[#353A47]"
          >
            <ChevronRight size={24} />
          </button>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4 bg-[#1A1D24] rounded-2xl px-6 py-3 shadow-[0_4px_15px_rgba(0,0,0,0.3)] border border-[#353A47]">
            <Calendar size={20} className="text-[#3B82F6]" />
            <div>
              <div className="text-[10px] font-bold text-[#A0A5B5] uppercase tracking-widest">
                Total Sessions
              </div>
              <div className="text-xl font-black text-[#FDFFF8] leading-none heading-outfit">
                {sessions.length}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-[#1A1D24] rounded-2xl px-6 py-3 shadow-[0_4px_15px_rgba(0,0,0,0.3)] border border-[#353A47]">
            <Users size={20} className="text-[#F59E0B]" />
            <div>
              <div className="text-[10px] font-bold text-[#A0A5B5] uppercase tracking-widest">
                Total Candidates
              </div>
              <div className="text-xl font-black text-[#FDFFF8] leading-none heading-outfit">
                {monthTotal}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 flex flex-col gap-4">
        {/* Week Header */}
        <div className="grid grid-cols-7 gap-4">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div
              key={d}
              className="py-2 text-center text-[11px] font-black text-[#6B7280] uppercase tracking-[0.3em]"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Day Cells */}
        <div className="grid grid-cols-7 gap-4 flex-1">
          {Array.from({ length: rows * 7 }).map((_, idx) => {
            const dayNum = idx - startOffset + 1;
            const isValid = dayNum >= 1 && dayNum <= endDay;
            const dateStr = isValid
              ? `${year}-${String(month + 1).padStart(2, "0")}-${String(
                  dayNum
                ).padStart(2, "0")}`
              : "";
            const daySessions = isValid ? sessionsByDate[dateStr] || [] : [];
            const dayTotal = daySessions.reduce(
              (sum: number, s: any) => sum + (s.candidate_count || 0),
              0
            );
            const isToday = dateStr === today;
            const isSunday = idx % 7 === 6;

            // Group by client
            const clientGroups: Record<string, number> = {};
            daySessions.forEach((s: any) => {
              const client = (s.client_name || "OTHER").toUpperCase();
              clientGroups[client] =
                (clientGroups[client] || 0) + (s.candidate_count || 0);
            });
            const topClient = Object.entries(clientGroups).sort(
              (a, b) => b[1] - a[1]
            )[0];
            const topClientStyle = topClient
              ? getClientStyle(topClient[0])
              : null;

            return (
              <motion.div
                key={idx}
                whileHover={isValid ? { y: -4, scale: 1.02 } : {}}
                onClick={() => isValid && onDateSelect(dateStr)}
                className={`min-h-[120px] rounded-3xl p-4 shadow-[0_8px_32px_rgba(0,0,0,0.4)] border relative overflow-hidden transition-all flex flex-col ${
                  !isValid
                    ? "bg-[#1A1D24]/40 border-[#353A47]/30 opacity-40 cursor-default"
                    : isToday
                    ? "bg-[#1A1D24] border-[#F59E0B] cursor-pointer shadow-[0_0_20px_rgba(245,158,11,0.15)] group"
                    : isSunday
                    ? "bg-[#1A1D24]/80 border-[#EF4444]/30 cursor-pointer hover:border-[#EF4444]/60 group"
                    : "bg-[#1A1D24]/80 border-[#353A47] cursor-pointer hover:border-[#6B7280] group"
                }`}
              >
                {isValid && (
                  <>
                    {topClientStyle ? (
                      <div
                        className="absolute top-0 left-0 w-full h-1.5 transition-opacity group-hover:opacity-80"
                        style={{
                          backgroundColor: topClientStyle.accent,
                          boxShadow: `0 0 15px ${topClientStyle.accent}`,
                        }}
                      />
                    ) : isToday ? (
                      <div className="absolute top-0 left-0 w-full h-1.5 transition-opacity group-hover:opacity-80 bg-[#F59E0B] shadow-[0_0_15px_#F59E0B]" />
                    ) : null}

                    <div className="flex items-center justify-between mb-3 relative z-10">
                      <span
                        className={`text-lg font-black heading-outfit ${
                          isToday
                            ? "text-[#F59E0B]"
                            : isSunday
                            ? "text-[#EF4444]"
                            : "text-[#FDFFF8]"
                        }`}
                      >
                        {dayNum}
                      </span>
                      {dayTotal > 0 && (
                        <span className="text-[10px] font-black text-[#0D0E11] bg-[#F59E0B] px-2 py-0.5 rounded shadow-[0_0_10px_rgba(245,158,11,0.3)]">
                          {dayTotal}
                        </span>
                      )}
                    </div>

                    {/* Client-wise mini bars */}
                    <div className="space-y-2 flex-1 relative z-10">
                      {Object.entries(clientGroups)
                        .slice(0, 3)
                        .map(([client, count]) => {
                          const cs = getClientStyle(client);
                          return (
                            <div
                              key={client}
                              className="flex items-center gap-2"
                            >
                              <div
                                className="w-2 h-2 rounded-full shrink-0 shadow-[0_0_8px_currentColor]"
                                style={{
                                  backgroundColor: cs.accent,
                                  color: cs.accent,
                                }}
                              />
                              <span
                                className="text-[10px] font-bold truncate flex-1 uppercase tracking-wider"
                                style={{ color: cs.text }}
                              >
                                {client}
                              </span>
                              <span
                                className="text-[10px] font-black"
                                style={{ color: cs.accent }}
                              >
                                {count}
                              </span>
                            </div>
                          );
                        })}
                      {daySessions.length > 0 && (
                        <div className="text-[9px] font-bold text-[#6B7280] mt-2 pt-2 border-t border-[#353A47] uppercase tracking-widest text-center">
                          {daySessions.length} session
                          {daySessions.length > 1 ? "s" : ""}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ─── CLIENTS VIEW ───
// ═══════════════════════════════════════════════════════════════

function ClientsView({ branch }: { branch: string }) {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const year = selectedMonth.getFullYear();
  const month = selectedMonth.getMonth();
  const startStr = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const endDay = new Date(year, month + 1, 0).getDate();
  const endStr = `${year}-${String(month + 1).padStart(2, "0")}-${endDay}`;

  const { data: sessions = [] } = useQuery({
    queryKey: ["clients-sessions", branch, startStr, endStr],
    queryFn: async () => {
      let q = supabase
        .from("calendar_sessions")
        .select("*")
        .gte("date", startStr)
        .lte("date", endStr);
      if (branch !== "global") q = q.eq("branch_location", branch);
      const { data } = await q;
      return data || [];
    },
  });

  // Group by client
  const clientStats = useMemo(() => {
    const map: Record<
      string,
      {
        sessions: number;
        candidates: number;
        exams: Set<string>;
        days: Set<string>;
      }
    > = {};
    sessions.forEach((s: any) => {
      const client = (s.client_name || "OTHER").toUpperCase();
      if (!map[client])
        map[client] = {
          sessions: 0,
          candidates: 0,
          exams: new Set(),
          days: new Set(),
        };
      map[client].sessions += 1;
      map[client].candidates += s.candidate_count || 0;
      if (s.exam_name) map[client].exams.add(s.exam_name);
      if (s.date) map[client].days.add(s.date);
    });
    return Object.entries(map).sort(
      (a, b) => b[1].candidates - a[1].candidates
    );
  }, [sessions]);

  const totalCandidates = clientStats.reduce(
    (sum, [, s]) => sum + s.candidates,
    0
  );

  return (
    <div className="h-full flex flex-col gap-6 overflow-y-auto no-scrollbar">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black text-[#FDFFF8] tracking-tighter uppercase heading-outfit">
          Client Overview
        </h2>
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              const d = new Date(selectedMonth);
              d.setMonth(d.getMonth() - 1);
              setSelectedMonth(d);
            }}
            className="w-12 h-12 rounded-2xl bg-[#1A1D24] shadow-[0_4px_15px_rgba(0,0,0,0.3)] flex items-center justify-center text-[#A0A5B5] hover:text-[#FDFFF8] active:scale-95 transition-all border border-[#353A47]"
          >
            <ChevronLeft size={24} />
          </button>
          <span className="text-base font-black text-[#FDFFF8] min-w-[160px] text-center heading-outfit tracking-wider">
            {selectedMonth.toLocaleDateString("en-IN", {
              month: "long",
              year: "numeric",
            })}
          </span>
          <button
            onClick={() => {
              const d = new Date(selectedMonth);
              d.setMonth(d.getMonth() + 1);
              setSelectedMonth(d);
            }}
            className="w-12 h-12 rounded-2xl bg-[#1A1D24] shadow-[0_4px_15px_rgba(0,0,0,0.3)] flex items-center justify-center text-[#A0A5B5] hover:text-[#FDFFF8] active:scale-95 transition-all border border-[#353A47]"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </div>

      {/* Client Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {clientStats.map(([client, stats]) => {
          const cs = getClientStyle(client);
          const pct =
            totalCandidates > 0
              ? Math.round((stats.candidates / totalCandidates) * 100)
              : 0;
          return (
            <motion.div
              key={client}
              whileHover={{ y: -4 }}
              className="bg-[#1A1D24]/80 backdrop-blur-xl rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.4)] border border-[#353A47] relative overflow-hidden group"
            >
              <div
                className="absolute top-0 left-0 w-full h-1.5 rounded-t-3xl transition-opacity group-hover:opacity-80"
                style={{
                  backgroundColor: cs.accent,
                  boxShadow: `0 0 20px ${cs.accent}`,
                }}
              />
              <div className="flex items-center gap-5 mb-6 mt-3">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-[#0D0E11] font-black text-xl shadow-[0_0_15px_rgba(0,0,0,0.3)]"
                  style={{ backgroundColor: cs.accent }}
                >
                  {client.substring(0, 2)}
                </div>
                <div>
                  <h3
                    className="text-xl font-black uppercase tracking-tight heading-outfit"
                    style={{ color: cs.text }}
                  >
                    {client}
                  </h3>
                  <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mt-1">
                    {stats.exams.size} exam types · {stats.days.size} active
                    days
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-5">
                <div className="text-center p-3 rounded-2xl bg-[#15171C] border border-[#353A47] shadow-inner">
                  <div
                    className="text-2xl font-black heading-outfit"
                    style={{ color: cs.text }}
                  >
                    {stats.candidates}
                  </div>
                  <div className="text-[9px] font-black text-[#A0A5B5] uppercase tracking-widest mt-1">
                    Candidates
                  </div>
                </div>
                <div className="text-center p-3 rounded-2xl bg-[#15171C] border border-[#353A47] shadow-inner">
                  <div
                    className="text-2xl font-black heading-outfit"
                    style={{ color: cs.text }}
                  >
                    {stats.sessions}
                  </div>
                  <div className="text-[9px] font-black text-[#A0A5B5] uppercase tracking-widest mt-1">
                    Sessions
                  </div>
                </div>
                <div className="text-center p-3 rounded-2xl bg-[#15171C] border border-[#353A47] shadow-inner">
                  <div
                    className="text-2xl font-black heading-outfit"
                    style={{ color: cs.text }}
                  >
                    {pct}%
                  </div>
                  <div className="text-[9px] font-black text-[#A0A5B5] uppercase tracking-widest mt-1">
                    Share
                  </div>
                </div>
              </div>
              {/* Progress Bar */}
              <div className="h-2 w-full bg-[#15171C] rounded-full overflow-hidden shadow-inner">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8 }}
                  className="h-full rounded-full"
                  style={{
                    backgroundColor: cs.accent,
                    boxShadow: `0 0 10px ${cs.accent}`,
                  }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      {clientStats.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center opacity-40 text-[#6B7280] font-black uppercase tracking-[0.3em] text-sm py-24 heading-outfit">
          No session data for this month.
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ─── ADD / EDIT CANDIDATE MODAL ───
// ═══════════════════════════════════════════════════════════════

function CandidateFormModal({
  isOpen,
  onClose,
  branch,
  date,
  editCandidate,
  onSaved,
}: {
  isOpen: boolean;
  onClose: () => void;
  branch: string;
  date: string;
  editCandidate?: any;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    client_name: "",
    exam_name: "",
    address: "",
    confirmation_number: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editCandidate) {
      setForm({
        full_name: editCandidate.full_name || "",
        phone: editCandidate.phone || "",
        client_name: editCandidate.client_name || "",
        exam_name: editCandidate.exam_name || "",
        address: editCandidate.address || "",
        confirmation_number: editCandidate.confirmation_number || "",
      });
    } else {
      setForm({
        full_name: "",
        phone: "",
        client_name: "",
        exam_name: "",
        address: "",
        confirmation_number: "",
      });
    }
  }, [editCandidate, isOpen]);

  const handleSave = async () => {
    if (!form.full_name || !form.client_name)
      return toast.error("Name and Client are required");
    setSaving(true);
    try {
      const payload = {
        ...form,
        exam_date: `${date}T09:00:00`,
        branch_location: branch,
        status: "registered",
      };

      if (editCandidate) {
        await supabase
          .from("candidates")
          .update(payload)
          .eq("id", editCandidate.id);
        toast.success("Candidate updated");
      } else {
        await supabase.from("candidates").insert(payload);
        // Also ensure a calendar session exists
        const { data: existingSess } = await supabase
          .from("calendar_sessions")
          .select("id, candidate_count")
          .eq("date", date)
          .eq("client_name", form.client_name)
          .eq("branch_location", branch)
          .maybeSingle();
        if (existingSess) {
          await supabase
            .from("calendar_sessions")
            .update({
              candidate_count: (existingSess.candidate_count || 0) + 1,
            })
            .eq("id", existingSess.id);
        } else {
          await supabase.from("calendar_sessions").insert({
            date,
            client_name: form.client_name,
            exam_name: form.exam_name || "General",
            candidate_count: 1,
            branch_location: branch,
            start_time: "09:00:00",
            end_time: "17:00:00",
          });
        }
        toast.success("Candidate added");
      }
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const inputCls =
    "w-full p-4 text-sm font-bold bg-[#1A1D24] text-[#FDFFF8] outline-none rounded-2xl shadow-inner border border-[#353A47] placeholder:text-[#6B7280] focus:border-[#F59E0B] transition-colors";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0D0E11]/80 backdrop-blur-md p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-xl p-8 bg-[#15171C] rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] relative border border-[#353A47]"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-[#6B7280] hover:text-[#EF4444] rounded-xl hover:bg-[#EF4444]/10 transition-colors"
        >
          <X size={24} />
        </button>
        <h2 className="text-3xl font-black text-[#FDFFF8] tracking-tighter uppercase mb-2 heading-outfit">
          {editCandidate ? "Edit Candidate" : "Add Candidate"}
        </h2>
        <p className="text-xs text-[#F59E0B] font-black tracking-widest uppercase mb-6">
          Date: {formatDisplayDate(date)} · Branch:{" "}
          {(branch || "").toUpperCase()}
        </p>

        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="text-[10px] font-black text-[#6B7280] uppercase tracking-[0.2em] mb-2 block">
                Full Name *
              </label>
              <input
                value={form.full_name}
                onChange={(e) =>
                  setForm({ ...form, full_name: e.target.value })
                }
                className={inputCls}
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-[#6B7280] uppercase tracking-[0.2em] mb-2 block">
                Phone
              </label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className={inputCls}
                placeholder="+91 ..."
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="text-[10px] font-black text-[#6B7280] uppercase tracking-[0.2em] mb-2 block">
                Client Name *
              </label>
              <input
                value={form.client_name}
                onChange={(e) =>
                  setForm({ ...form, client_name: e.target.value })
                }
                className={inputCls}
                placeholder="PROMETRIC"
                list="client-list"
              />
              <datalist id="client-list">
                {Object.keys(CLIENT_COLORS).map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="text-[10px] font-black text-[#6B7280] uppercase tracking-[0.2em] mb-2 block">
                Exam Name
              </label>
              <input
                value={form.exam_name}
                onChange={(e) =>
                  setForm({ ...form, exam_name: e.target.value })
                }
                className={inputCls}
                placeholder="CMA Part 1"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="text-[10px] font-black text-[#6B7280] uppercase tracking-[0.2em] mb-2 block">
                Place / Address
              </label>
              <input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className={inputCls}
                placeholder="Calicut, Kerala"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-[#6B7280] uppercase tracking-[0.2em] mb-2 block">
                Confirmation #
              </label>
              <input
                value={form.confirmation_number}
                onChange={(e) =>
                  setForm({ ...form, confirmation_number: e.target.value })
                }
                className={inputCls}
                placeholder="ABC123"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-4 mt-10">
          <button
            onClick={onClose}
            className="flex-1 py-4 rounded-2xl text-sm font-black tracking-wider text-[#A0A5B5] bg-[#1A1D24] border border-[#353A47] hover:bg-[#2A2E39] hover:text-[#FDFFF8] transition-colors uppercase"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-4 rounded-2xl text-sm font-black tracking-wider text-[#0D0E11] bg-[#F59E0B] shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:shadow-[0_0_30px_rgba(245,158,11,0.4)] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 uppercase"
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-[#0D0E11] border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save size={18} strokeWidth={2.5} />
            )}
            {editCandidate ? "Update" : "Add Candidate"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ─── HOME VIEW (Unified Command Dashboard) ───
// ═══════════════════════════════════════════════════════════════

const QUICK_LINKS = [
  {
    name: "Pearson VUE",
    url: "https://connect.pearsonvue.com/",
    image: "/client-logos/pearson.png",
  },
  {
    name: "Prometric",
    url: "https://easyserve.prometric.com/",
    image: "/client-logos/prometric.png",
  },
  {
    name: "CMA US",
    url: "https://proscheduler.prometric.com/",
    image: "/client-logos/cma_us.png",
  },
  {
    name: "PSI Exams",
    url: "https://test-takers.psiexams.com/",
    image: "/client-logos/psi.png",
  },
];

function HomeView({
  branch,
  onNavigateToExamDay,
  onOpenChecklist,
}: {
  branch: string;
  onNavigateToExamDay: (date: string) => void;
  onOpenChecklist: (type: "pre_exam" | "post_exam") => void;
}) {
  const { profile } = useAuth();
  const { activeBranch } = useBranch();
  const { data: dashboardData } = useDashboardStats();

  // Collapsible sections
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const toggleSection = (id: string) =>
    setExpandedSection((prev) => (prev === id ? null : id));

  // Checklist status
  const [todayStatus, setTodayStatus] = useState({
    pre: "Pending",
    post: "Pending",
  });

  useEffect(() => {
    const fetchStatus = async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data: checklists } = await supabase
        .from("checklist_submissions")
        .select("*")
        .gte("submitted_at", today);
      const hasPre = checklists?.find(
        (c: any) =>
          c.template_id?.includes("pre") || c.answers?.type === "pre_exam"
      );
      const hasPost = checklists?.find(
        (c: any) =>
          c.template_id?.includes("post") || c.answers?.type === "post_exam"
      );
      setTodayStatus({
        pre: hasPre ? "Done" : "Pending",
        post: hasPost ? "Done" : "Pending",
      });
    };
    fetchStatus();
  }, []);

  const todaysExams = dashboardData?.todaysExams || [];
  const totalCandidates = todaysExams.reduce(
    (sum: number, e: any) => sum + (e.candidate_count || 0),
    0
  );
  const now = new Date();

  // Neumorphic / Glassmorphism helpers for Dark Theme
  const neuCard =
    "bg-[#1A1D24]/80 backdrop-blur-xl border border-[#353A47] rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]";
  const neuBtn =
    "bg-[#1A1D24]/80 backdrop-blur-xl border border-[#353A47] rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_30px_rgba(245,158,11,0.15)] hover:border-[#F59E0B]/50 active:scale-[0.98] transition-all";

  return (
    <div className="h-full overflow-y-auto no-scrollbar space-y-7 pr-2">
      {/* ═══ SECTION 1: Officer Briefing ═══ */}
      <div className="flex items-start gap-6">
        {/* Profile Card */}
        <div className={`${neuCard} p-6 flex items-center gap-6 flex-1`}>
          <div className="relative shrink-0">
            <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-[#353A47] shadow-lg">
              <img
                src={
                  profile?.avatar_url ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    profile?.full_name || "U"
                  )}&background=1A1D24&color=AEEC27&size=128`
                }
                className="w-full h-full object-cover"
                alt=""
              />
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#F59E0B] rounded-full border-4 border-[#1A1D24] shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[9px] font-black text-[#F59E0B] uppercase tracking-[0.25em] mb-1">
              Active Duty
            </div>
            <h2 className="text-2xl font-black text-[#FDFFF8] uppercase tracking-tight truncate heading-outfit">
              {profile?.full_name || "Operator"}
            </h2>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-[11px] font-bold text-[#A0A5B5]">
                {now.toLocaleDateString("en-GB", {
                  weekday: "long",
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </span>
              <span className="text-[11px] font-bold text-[#F59E0B] bg-[#F59E0B]/10 px-2 py-0.5 rounded-full">
                {(activeBranch || "").toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex gap-4 shrink-0">
          {[
            {
              label: "Today Sessions",
              value: todaysExams.length,
              icon: Zap,
              color: "text-[#F59E0B]",
              bg: "bg-[#F59E0B]/10 border border-[#F59E0B]/20",
              valColor: "text-[#FDFFF8]",
            },
            {
              label: "Candidates",
              value: totalCandidates,
              icon: Users,
              color: "text-[#F59E0B]",
              bg: "bg-[#F59E0B]/10 border border-[#F59E0B]/20",
              valColor: "text-[#FDFFF8]",
            },
          ].map((s) => (
            <div
              key={s.label}
              className={`${neuCard} px-6 py-4 flex items-center gap-4`}
            >
              <div
                className={`w-12 h-12 rounded-2xl ${s.bg} flex items-center justify-center ${s.color}`}
              >
                <s.icon size={20} />
              </div>
              <div>
                <div className="text-[10px] font-bold text-[#A0A5B5] uppercase tracking-widest leading-tight">
                  {s.label}
                </div>
                <div
                  className={`text-3xl font-black ${s.valColor} leading-none mt-1 heading-outfit`}
                >
                  {s.value}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ SECTION 2: Today's Sessions Preview ═══ */}
      {todaysExams.length > 0 && (
        <div className={`${neuCard} p-6`}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/30 flex items-center justify-center text-[#F59E0B]">
                <Zap size={20} />
              </div>
              <span className="text-sm font-black text-[#FDFFF8] uppercase tracking-widest">
                Today's Lineup
              </span>
            </div>
            <button
              onClick={() => onNavigateToExamDay(TODAY())}
              className="text-[10px] font-black text-[#F59E0B] uppercase tracking-widest hover:text-[#F59E0B] flex items-center gap-1"
            >
              View All <ChevronRight size={14} />
            </button>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {todaysExams.slice(0, 8).map((exam: any, i: number) => {
              const cs = getClientStyle(exam.client_name);
              const hour = parseInt((exam.start_time || "09:00").split(":")[0]);
              return (
                <button
                  key={i}
                  onClick={() => onNavigateToExamDay(TODAY())}
                  className="text-left p-5 rounded-2xl bg-[#15171C] border border-[#353A47] hover:border-[#F59E0B]/50 hover:bg-[#222630] transition-all group shadow-inner"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_currentColor]"
                      style={{ backgroundColor: cs.accent, color: cs.accent }}
                    />
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#A0A5B5]">
                      {(exam.client_name || "OTHER").toUpperCase()}
                    </span>
                  </div>
                  <div className="text-sm font-bold text-[#FDFFF8] truncate mb-2">
                    {exam.exam_name || "Exam"}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#6B7280] bg-[#0D0E11] px-2 py-1 rounded-md">
                      {hour < 12 ? "AM" : "PM"} Session
                    </span>
                    <span
                      className="text-lg font-black"
                      style={{ color: cs.accent }}
                    >
                      {exam.candidate_count || 0}{" "}
                      <span className="text-[9px] text-[#A0A5B5] font-bold">
                        pax
                      </span>
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ SECTION 3: Daily Checklist (Collapsible) ═══ */}
      <button
        onClick={() => toggleSection("checklist")}
        className={`${neuCard} p-6 w-full text-left flex items-center justify-between group hover:border-[#F59E0B]/40 transition-colors`}
      >
        <div className="flex items-center gap-5">
          <div className="w-12 h-12 rounded-2xl bg-[#F59E0B]/10 border border-[#F59E0B]/30 flex items-center justify-center text-[#F59E0B]">
            <ListChecks size={24} />
          </div>
          <div>
            <div className="text-lg font-black text-[#FDFFF8] uppercase tracking-tight heading-outfit">
              Daily Reports
            </div>
            <div className="flex items-center gap-3 mt-1.5">
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${
                  todayStatus.pre === "Done"
                    ? "bg-[#F59E0B]/20 border-[#F59E0B]/50 text-[#F59E0B]"
                    : "bg-[#15171C] border-[#353A47] text-[#6B7280]"
                }`}
              >
                Morning: {todayStatus.pre}
              </span>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${
                  todayStatus.post === "Done"
                    ? "bg-[#F59E0B]/20 border-[#F59E0B]/50 text-[#F59E0B]"
                    : "bg-[#15171C] border-[#353A47] text-[#6B7280]"
                }`}
              >
                Evening: {todayStatus.post}
              </span>
            </div>
          </div>
        </div>
        <ChevronDown
          size={24}
          className={`text-[#A0A5B5] transition-transform ${
            expandedSection === "checklist" ? "rotate-180" : ""
          }`}
        />
      </button>
      <AnimatePresence>
        {expandedSection === "checklist" && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden -mt-4"
          >
            <div className="grid grid-cols-2 gap-6 pt-3">
              <button
                onClick={() => onOpenChecklist("pre_exam")}
                className={`${neuBtn} p-8 flex flex-col items-center gap-5 group hover:scale-[1.01] active:scale-[0.99] bg-[#1A1D24]`}
              >
                <div
                  className={`w-16 h-16 rounded-3xl ${
                    todayStatus.pre === "Done"
                      ? "bg-[#F59E0B]/20 text-[#F59E0B] shadow-[0_0_15px_rgba(245,158,11,0.3)] border border-[#F59E0B]/30"
                      : "bg-[#15171C] border border-[#353A47] text-[#6B7280]"
                  } flex items-center justify-center transition-all`}
                >
                  <ClipboardCheck size={32} />
                </div>
                <div className="text-center">
                  <div className="text-[11px] font-bold text-[#A0A5B5] uppercase tracking-[0.2em] mb-1">
                    Step 01
                  </div>
                  <div className="text-xl font-black text-[#FDFFF8] uppercase tracking-tight heading-outfit">
                    Morning Check
                  </div>
                </div>
                <span
                  className={`text-[10px] font-black uppercase tracking-[0.1em] px-4 py-1.5 rounded-xl border ${
                    todayStatus.pre === "Done"
                      ? "bg-[#F59E0B] border-[#F59E0B] text-[#0D0E11]"
                      : "border-[#353A47] text-[#FDFFF8] group-hover:bg-[#353A47]"
                  }`}
                >
                  {todayStatus.pre === "Done" ? "✓ Submitted" : "Fill Now →"}
                </span>
              </button>
              <button
                onClick={() => onOpenChecklist("post_exam")}
                className={`${neuBtn} p-8 flex flex-col items-center gap-5 group hover:scale-[1.01] active:scale-[0.99] bg-[#1A1D24]`}
              >
                <div
                  className={`w-16 h-16 rounded-3xl ${
                    todayStatus.post === "Done"
                      ? "bg-[#F59E0B]/20 text-[#F59E0B] shadow-[0_0_15px_rgba(245,158,11,0.3)] border border-[#F59E0B]/30"
                      : "bg-[#15171C] border border-[#353A47] text-[#6B7280]"
                  } flex items-center justify-center transition-all`}
                >
                  <CheckCircle size={32} />
                </div>
                <div className="text-center">
                  <div className="text-[11px] font-bold text-[#A0A5B5] uppercase tracking-[0.2em] mb-1">
                    Step 02
                  </div>
                  <div className="text-xl font-black text-[#FDFFF8] uppercase tracking-tight heading-outfit">
                    Evening Check
                  </div>
                </div>
                <span
                  className={`text-[10px] font-black uppercase tracking-[0.1em] px-4 py-1.5 rounded-xl border ${
                    todayStatus.post === "Done"
                      ? "bg-[#F59E0B] border-[#F59E0B] text-[#0D0E11]"
                      : "border-[#353A47] text-[#FDFFF8] group-hover:bg-[#353A47]"
                  }`}
                >
                  {todayStatus.post === "Done" ? "✓ Submitted" : "Fill Now →"}
                </span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ SECTION 4: F-Vault (Collapsible) ═══ */}
      <button
        onClick={() => toggleSection("vault")}
        className={`${neuCard} p-6 w-full text-left flex items-center justify-between group hover:border-[#F59E0B]/40 transition-colors`}
      >
        <div className="flex items-center gap-5">
          <div className="w-12 h-12 rounded-2xl bg-[#F59E0B]/10 border border-[#F59E0B]/30 flex items-center justify-center text-[#F59E0B]">
            <Key size={24} />
          </div>
          <div>
            <div className="text-lg font-black text-[#FDFFF8] uppercase tracking-tight heading-outfit">
              F-Vault
            </div>
            <div className="text-[11px] font-medium text-[#A0A5B5] mt-0.5">
              Secure credential access
            </div>
          </div>
        </div>
        <ChevronDown
          size={24}
          className={`text-[#A0A5B5] transition-transform ${
            expandedSection === "vault" ? "rotate-180" : ""
          }`}
        />
      </button>
      <AnimatePresence>
        {expandedSection === "vault" && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden -mt-4"
          >
            <div className="pt-3">
              <AccessHub variant="emerald" readOnly />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ SECTION 5: Quick Links (Collapsible) ═══ */}
      <button
        onClick={() => toggleSection("links")}
        className={`${neuCard} p-6 w-full text-left flex items-center justify-between group hover:border-[#F59E0B]/40 transition-colors`}
      >
        <div className="flex items-center gap-5">
          <div className="w-12 h-12 rounded-2xl bg-[#F59E0B]/10 border border-[#F59E0B]/30 flex items-center justify-center text-[#F59E0B]">
            <Globe size={24} />
          </div>
          <div>
            <div className="text-lg font-black text-[#FDFFF8] uppercase tracking-tight heading-outfit">
              Quick Links
            </div>
            <div className="text-[11px] font-medium text-[#A0A5B5] mt-0.5">
              Client portals & external tools
            </div>
          </div>
        </div>
        <ChevronDown
          size={24}
          className={`text-[#A0A5B5] transition-transform ${
            expandedSection === "links" ? "rotate-180" : ""
          }`}
        />
      </button>
      <AnimatePresence>
        {expandedSection === "links" && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden -mt-4"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
              {QUICK_LINKS.map((link) => (
                <a
                  key={link.name}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${neuBtn} p-5 flex flex-col items-center justify-center gap-3 group hover:scale-[1.03] transition-transform h-32`}
                >
                  <div className="w-full h-16 flex items-center justify-center p-2">
                    <img
                      src={link.image}
                      alt={link.name}
                      className="w-full h-full object-contain grayscale group-hover:grayscale-0 transition-all duration-300 scale-110"
                    />
                  </div>
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="h-4" />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ─── MAIN: FETS POINT (Unified Landing) ───
// ═══════════════════════════════════════════════════════════════

export function ExamOpsCenter() {
  const [view, setView] = useState("home");
  const [date, setDate] = useState(TODAY());
  const { activeBranch } = useBranch();
  const { profile } = useAuth();
  const branch = activeBranch === "global" ? "calicut" : activeBranch;
  const [selCand, setSelCand] = useState<any>(null);

  // Checklist state
  const [activeTemplate, setActiveTemplate] =
    useState<ChecklistTemplate | null>(null);
  const [showStaffSelector, setShowStaffSelector] = useState(false);
  const [preSelection, setPreSelection] = useState<{
    staffId: string;
    branchId: string;
    staffName: string;
  } | null>(null);
  const [showChecklistModal, setShowChecklistModal] = useState(false);

  const handleOpenChecklist = async (
    type: "pre_exam" | "post_exam" | "custom"
  ) => {
    try {
      const { data, error } = await supabase
        .from("checklist_templates" as any)
        .select("*")
        .eq("type", type)
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error || !data || data.length === 0) {
        toast.error(`No active ${type.replace("_", " ")} checklist found.`);
        return;
      }
      let bestMatch = data.find((t: any) => t.branch_location === activeBranch);
      if (!bestMatch)
        bestMatch = data.find(
          (t: any) => t.branch_location === "global" || !t.branch_location
        );
      if (!bestMatch) bestMatch = data[0];
      setActiveTemplate(bestMatch as unknown as ChecklistTemplate);
      setShowStaffSelector(true);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load checklist");
    }
  };

  const NAV = [
    { id: "home", label: "Portal", icon: Home, activeColor: "#F59E0B" },
    { id: "ops", label: "Exam Day", icon: Zap, activeColor: "#F59E0B" },
    {
      id: "calendar",
      label: "Calendar",
      icon: Calendar,
      activeColor: "#F59E0B",
    },
    {
      id: "clients",
      label: "Clients",
      icon: Briefcase,
      activeColor: "#8ECA13",
    },
    { id: "upload", label: "Upload", icon: Upload, activeColor: "#F59E0B" },
    { id: "roster", label: "Roster", icon: UserCheck, activeColor: "#F59E0B" },
    { id: "cpr", label: "CPR", icon: ShieldCheck, activeColor: "#F59E0B" },
  ];

  return (
    <div
      className="flex w-full h-[calc(100vh-160px)] bg-[#0D0E11] text-[#FDFFF8] overflow-hidden p-6 lg:p-10"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* ═══ Sidebar Navigation (Glassy Dark) ═══ */}
      <div className="w-28 lg:w-32 flex flex-col items-center py-6 gap-3 mr-8 lg:mr-10 bg-[#1A1D24]/60 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] border border-[#353A47] backdrop-blur-xl overflow-y-auto no-scrollbar">
        {/* Logo */}
        <div className="w-14 h-14 rounded-2xl bg-[#F59E0B] flex items-center justify-center text-[#0D0E11] font-black text-xs mb-6 shadow-[0_0_20px_rgba(245,158,11,0.3)]">
          <span className="text-xl font-black heading-outfit">
            fets<span className="opacity-50">.</span>
          </span>
        </div>

        {/* Nav Items */}
        {NAV.map((n) => {
          const isActive = view === n.id;
          return (
            <motion.button
              key={n.id}
              onClick={() => setView(n.id)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`w-20 lg:w-24 h-[76px] rounded-2xl flex flex-col items-center justify-center gap-2 transition-all border ${
                isActive
                  ? `bg-[#2A2E39] border border-[${n.activeColor}]/50 shadow-[0_0_15px_rgba(245,158,11,0.15)]`
                  : "bg-transparent border-transparent hover:bg-[#2A2E39]/50"
              }`}
              title={n.label}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  isActive
                    ? `bg-[${n.activeColor}] text-[#0D0E11] shadow-[0_0_10px_rgba(245,158,11,0.4)]`
                    : "bg-[#15171C] border border-[#353A47] text-[#A0A5B5]"
                }`}
              >
                <n.icon size={18} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span
                className={`text-[9px] font-bold uppercase tracking-widest leading-none text-center ${
                  isActive ? `text-[${n.activeColor}]` : "text-[#6B7280]"
                }`}
              >
                {n.label}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* ═══ Content Area ═══ */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Title Block */}
        <div className="flex items-center gap-6 mb-8 shrink-0">
          <div className="h-2 w-16 bg-[#F59E0B] rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
          <h1 className="text-4xl lg:text-5xl font-black text-[#FDFFF8] tracking-tighter uppercase leading-none heading-outfit">
            Portal <span className="text-[#F59E0B]">DApp</span>
          </h1>
          <div className="ml-auto flex items-center gap-3 bg-[#1A1D24] px-6 py-3 rounded-2xl border border-[#353A47] shadow-sm">
            <MapPin size={16} className="text-[#F59E0B]" />
            <span className="text-xs font-black text-[#FDFFF8] uppercase tracking-[0.25em]">
              {(branch || "").toUpperCase()} CENTRE
            </span>
          </div>
        </div>

        {/* Dynamic View */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="h-full"
            >
              {view === "home" ? (
                <HomeView
                  branch={branch}
                  onNavigateToExamDay={(d) => {
                    setDate(d);
                    setView("ops");
                  }}
                  onOpenChecklist={(type) => handleOpenChecklist(type)}
                />
              ) : view === "ops" ? (
                <DailyOpsView
                  date={date}
                  setDate={setDate}
                  branch={branch}
                  onSelectCandidate={setSelCand}
                  selCandidate={selCand}
                />
              ) : view === "calendar" ? (
                <CalendarView
                  branch={branch}
                  onDateSelect={(d) => {
                    setDate(d);
                    setView("ops");
                  }}
                />
              ) : view === "clients" ? (
                <ClientsView branch={branch} />
              ) : view === "upload" ? (
                <UploadRosterView
                  date={date}
                  setDate={setDate}
                  branch={branch}
                />
              ) : view === "roster" ? (
                <RosterView date={date} setDate={setDate} branch={branch} />
              ) : view === "cpr" ? (
                <CPRView branch={branch} />
              ) : null}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ═══ Checklist Modals ═══ */}
      <AnimatePresence>
        {showStaffSelector && activeTemplate && (
          <StaffBranchSelector
            onClose={() => {
              setShowStaffSelector(false);
              setActiveTemplate(null);
            }}
            onSelect={(data) => {
              setPreSelection({
                staffId: data.staffId,
                branchId: data.branchId,
                staffName: data.staffName,
              });
              setShowStaffSelector(false);
              setShowChecklistModal(true);
            }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showChecklistModal && activeTemplate && (
          <ChecklistFormModal
            template={activeTemplate}
            onClose={() => {
              setShowChecklistModal(false);
              setActiveTemplate(null);
              setPreSelection(null);
            }}
            onSuccess={() => {
              toast.success("Checklist submitted successfully!");
            }}
            currentUser={profile}
            overrideStaff={
              preSelection
                ? { id: preSelection.staffId, name: preSelection.staffName }
                : undefined
            }
            overrideBranch={preSelection?.branchId}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default ExamOpsCenter;
