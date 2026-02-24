import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Activity,
  CheckCircle,
  Play,
  Sparkles,
  ListChecks,
  Settings,
  ChevronRight,
  Bell,
  AlertTriangle,
  Shield,
  ClipboardCheck,
  CheckCircle2,
  AlertCircle,
  Quote,
  Star,
  MessageSquare,
  Search,
  Pause,
  RotateCcw,
  Coffee,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useBranch } from "../hooks/useBranch";
import { toast } from "react-hot-toast";
import {
  useDashboardStats,
  useCandidateTrend,
  useUpcomingSchedule,
} from "../hooks/useCommandCentre";
import { useNews } from "../hooks/useNewsManager";
import { AccessHub } from "./AccessHub";
import { ExternalLink } from "lucide-react";
import { MobileHome } from "./MobileHome";
import { supabase } from "../lib/supabase";
import { ChecklistFormModal } from "./checklist/ChecklistFormModal";
import { NotificationBanner } from "./NotificationBanner";
import { ChecklistTemplate } from "../types/checklist";
import { StaffBranchSelector } from "./checklist/StaffBranchSelector";
import { FetsChatPopup } from "./FetsChatPopup";
import { StaffProfile } from "../types/shared";

export default function CommandCentre({
  onNavigate,
  onAiQuery,
}: {
  onNavigate?: (tab: string) => void;
  onAiQuery?: (query: string) => void;
}) {
  const { profile, user } = useAuth();
  const { activeBranch } = useBranch();

  // --- React Query Hooks ---
  const { data: dashboardData, isLoading: isLoadingStats } =
    useDashboardStats();
  const { data: examSchedule = [], isLoading: isLoadingSchedule } =
    useUpcomingSchedule();

  // Fetch News for Notice Board
  const { data: newsItems = [] } = useNews();

  const [activeTemplate, setActiveTemplate] =
    useState<ChecklistTemplate | null>(null);
  const [showChecklistModal, setShowChecklistModal] = useState(false);

  // Select Flow
  const [showStaffSelector, setShowStaffSelector] = useState(false);
  const [preSelection, setPreSelection] = useState<{
    staffId: string;
    branchId: string;
    staffName: string;
  } | null>(null);

  // --- Integrated Analysis Data Fetching ---
  const [opsMetrics, setOpsMetrics] = useState({
    healthScore: 100,
    critical: 0,
    open: 0,
    topIssue: "None",
  });
  const [checklistMetrics, setChecklistMetrics] = useState({
    total: 0,
    issues: 0,
    perfect: 0,
  });
  const [loadingAnalysis, setLoadingAnalysis] = useState(true);

  // Filter Active News for Notice Board
  const notices = useMemo(() => {
    return newsItems
      .filter((item: any) => {
        if (!item.is_active) return false;
        // Show if global OR if matches active branch
        return (
          item.branch_location === "global" ||
          !item.branch_location ||
          item.branch_location === activeBranch
        );
      })
      .sort(
        (a: any, b: any) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ) // Newest first
      .slice(0, 5); // Show top 5
  }, [newsItems, activeBranch]);
  const [todayStatus, setTodayStatus] = useState({
    pre: "Not started",
    post: "Not started",
  });

  const fetchAnalysis = React.useCallback(async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const startOfMonth = new Date();
      startOfMonth.setDate(1);

      // --- Checklist Status for Today ---
      const { data: checklists } = await supabase
        .from("checklist_submissions")
        .select("*")
        .gte("submitted_at", today)
        .eq("branch_id", activeBranch !== "global" ? activeBranch : undefined);

      const preSubmission = checklists?.find(
        (c: any) =>
          c.template_id?.includes("pre") || c.answers?.type === "pre_exam"
      );
      const postSubmission = checklists?.find(
        (c: any) =>
          c.template_id?.includes("post") || c.answers?.type === "post_exam"
      );
      const preStatus = preSubmission ? "Submitted" : "Not started";
      const postStatus = postSubmission ? "Submitted" : "Not started";
      const issues =
        checklists?.filter(
          (c: any) => c.status === "flagged" || c.status === "issue"
        ).length || 0;

      // --- Operational Incidents ---
      const { data: events } = await (supabase as any)
        .from("incidents")
        .select("*")
        .gte("created_at", startOfMonth.toISOString());

      const openEvents =
        events?.filter((e: any) => e.status !== "closed") || [];
      const critical = openEvents.filter(
        (e: any) => e.severity === "critical"
      ).length;
      const major = openEvents.filter(
        (e: any) => e.severity === "high" || e.severity === "medium"
      ).length;
      const eventPenalty = critical * 15 + major * 5 + openEvents.length * 1;

      // --- Infrastructure Health ---
      const { data: systems } = await supabase
        .from("systems")
        .select("status")
        .eq(
          "branch_location",
          activeBranch !== "global" ? activeBranch : undefined
        );

      const systemsFault =
        systems?.filter((s) => s.status === "fault").length || 0;
      const systemsMaintenance =
        systems?.filter((s) => s.status === "maintenance").length || 0;
      const systemPenalty = systemsFault * 20 + systemsMaintenance * 5;

      const combinedPenalty = eventPenalty + systemPenalty;
      const health = Math.max(0, 100 - combinedPenalty);

      const categories: Record<string, number> = {};
      events?.forEach((e: any) => {
        categories[e.category || "Other"] =
          (categories[e.category || "Other"] || 0) + 1;
      });
      const topCat = Object.entries(categories).sort((a, b) => b[1] - a[1])[0];

      setOpsMetrics({
        healthScore: health,
        critical: critical + systemsFault,
        open: openEvents.length,
        topIssue:
          systemsFault > 0 ? "Hardware Fault" : topCat ? topCat[0] : "Stable",
      });

      // --- Checklist Metrics & Today's Status ---
      setTodayStatus({ pre: preStatus, post: postStatus });

      setChecklistMetrics({
        total: checklists?.length || 0,
        issues,
        perfect: (checklists?.length || 0) - (issues > 0 ? 1 : 0),
      });

      setLoadingAnalysis(false);
    } catch (e) {
      console.error("Analysis load failed", e);
      setLoadingAnalysis(false);
    }
  }, [activeBranch]);

  useEffect(() => {
    if (user?.id) {
      fetchAnalysis();
    }
  }, [user?.id, fetchAnalysis]);

  const handleOpenChecklist = async (
    type: "pre_exam" | "post_exam" | "custom"
  ) => {
    try {
      // First fetch relevant templates
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

      // Find best match: Specific branch > Global > First available
      let bestMatch = data.find((t: any) => t.branch_location === activeBranch);

      if (!bestMatch) {
        bestMatch = data.find(
          (t: any) => t.branch_location === "global" || !t.branch_location
        );
      }

      if (!bestMatch) {
        // If no specific and no global, just take the newest one (fallback)
        bestMatch = data[0];
      }

      setActiveTemplate(bestMatch as unknown as ChecklistTemplate);
      setShowStaffSelector(true); // Open selector first
    } catch (err) {
      console.error(err);
      toast.error("Failed to load checklist");
    }
  };

  // --- Playful Session Tracking (Countdown) ---
  const SHIFT_SECONDS = 9 * 3600; // 9 Hours
  const [timeLeft, setTimeLeft] = useState(SHIFT_SECONDS);
  const [isTimerActive, setIsTimerActive] = useState(true);

  useEffect(() => {
    let timer: any;
    if (isTimerActive) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 0) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isTimerActive]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
      .toString()
      .padStart(2, "0");
    const m = Math.floor((seconds % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  const resetTimer = () => setTimeLeft(SHIFT_SECONDS);

  if (isLoadingStats || isLoadingSchedule) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0D0E11]">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-amber-500"></div>
      </div>
    );
  }

  const bgBase = "bg-[#0D0E11]";
  const neuCard =
    "bg-[#1A1D24]/90 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.5)] border border-[#353A47] hover:border-[#F59E0B]/50 transition-all duration-500 relative group overflow-hidden";
  const neuInset =
    "bg-[#15171C] rounded-2xl shadow-inner border border-[#353A47]";
  const neuBtn =
    "bg-[#15171C] text-[#A0A5B5] font-bold rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.3)] border border-[#353A47] hover:border-[#F59E0B] hover:text-[#FDFFF8] hover:shadow-[0_0_20px_rgba(245,158,11,0.2)] active:scale-95 transition-all duration-300";

  return (
    <div
      className={`min-h-screen ${bgBase} text-[#E2E8F0] font-sans pb-12 overflow-x-hidden`}
      style={{ fontFamily: "'Montserrat', sans-serif" }}
    >
      <NotificationBanner onNavigate={onNavigate} />

      <div className="max-w-[1800px] mx-auto px-6 pt-8">
        {/* --- PREMIUM COMMAND HEADER --- */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-12 gap-10 mt-20"
        >
          {/* Left: Command Branding */}
          <div className="flex flex-col">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-1 w-12 bg-amber-500 rounded-full" />
              <span className="text-[#6B7280] font-black text-[10px] uppercase tracking-[0.4em] font-['Rajdhani']">
                Operational Intelligence{" "}
                {activeBranch !== "global" &&
                  `// Node ${activeBranch.toUpperCase()}`}
              </span>
            </div>
            <h1 className="text-6xl md:text-7xl font-black text-[#FDFFF8] tracking-tighter uppercase italic leading-none">
              Command{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-amber-600 drop-shadow-sm">
                Centre
              </span>
            </h1>
          </div>

          {/* Right: Duty Officer Profile (Dominant Display) */}
          <div className="flex flex-wrap items-center gap-8 w-full lg:w-auto">
            {/* THE EXECUTIVE OFFICER PLATE */}
            <div
              className={`${neuCard} p-6 flex flex-col md:flex-row items-start md:items-center gap-8 min-w-[500px] relative overflow-hidden group transition-all cursor-default`}
            >
              {/* Animated Background Pulse */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-amber-500/10 transition-all duration-700" />

              {/* Avatar with Status Ring */}
              <div className="relative shrink-0">
                <div
                  className={`${neuCard} w-24 h-24 p-2 rounded-full relative z-10 shadow-[10px_10px_20px_rgb(209,217,230),-10px_-10px_20px_rgba(255,255,255,0.8)]`}
                >
                  <div className="w-full h-full rounded-full overflow-hidden border-2 border-[#353A47]">
                    <img
                      src={
                        profile?.avatar_url ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          profile?.full_name || "User"
                        )}&background=0F172A&color=EAB308&size=128`
                      }
                      className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-110"
                      alt="Profile"
                    />
                  </div>
                </div>
                {/* Online Status Indicator */}
                <div className="absolute bottom-1 right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-[#EEF2F9] z-20 shadow-lg" />
                <div className="absolute bottom-1 right-1 w-6 h-6 bg-green-400 rounded-full z-15 animate-ping opacity-60" />
              </div>

              {/* Officer Details & Exam Schedule */}
              <div className="flex flex-col flex-1 z-10 w-full">
                {/* Stylized User Name */}
                <div className="mb-6">
                  <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-[0.2em] mb-1 block h-4"></span>
                  <h2 className="text-4xl font-black text-[#FDFFF8] uppercase tracking-tighter italic leading-none font-['Rajdhani']">
                    {profile?.full_name || "Authorized User"}
                  </h2>
                </div>

                {/* Today's Exam Schedule */}
                <div className="flex flex-col gap-3 w-full">
                  <div className="flex items-center justify-between border-b border-[#353A47] pb-2">
                    <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">
                      {new Date()
                        .toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                        .toUpperCase()}
                    </span>
                    <span className="text-[10px] font-bold text-[#6B7280] uppercase">
                      {activeBranch}
                    </span>
                  </div>

                  <div
                    className={`flex flex-col gap-2 relative min-h-[60px] ${
                      activeBranch === "global"
                        ? "max-h-[300px] overflow-y-auto pr-2 custom-scrollbar"
                        : ""
                    }`}
                  >
                    {!dashboardData?.todaysExams ||
                    dashboardData.todaysExams.length === 0 ? (
                      <div className="text-xs text-[#6B7280] italic flex items-center gap-2 mt-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                        No exams scheduled for today
                      </div>
                    ) : (
                      (activeBranch === "global"
                        ? dashboardData.todaysExams
                        : dashboardData.todaysExams.slice(0, 3)
                      ).map((exam: any, idx: number) => {
                        // 1. Session Logic
                        const time = exam.start_time || "09:00";
                        const hour = parseInt(time.split(":")[0]);
                        const session = hour < 12 ? "AM" : "PM";

                        // 2. Client Name Logic
                        let displayClient = exam.client_name || "Unknown";
                        if (displayClient.toUpperCase().includes("PEARSON"))
                          displayClient = "PEARSON";
                        if (displayClient.toUpperCase().includes("PROMETRIC"))
                          displayClient = "PROMETRIC";

                        // 3. Exam Name Logic
                        let displayExam = exam.exam_name || displayClient; // Fallback to client if no exam name
                        const upperExam = displayExam.toUpperCase();

                        // Specific overrides
                        if (upperExam.includes("CMA US")) displayExam = "CMA";
                        else if (upperExam.includes("CELPIP"))
                          displayExam = "CELPIP";
                        else if (displayClient === "PEARSON") {
                          // General Pearson rule: < 8 chars keep, else truncate/select
                          if (displayExam.length > 8) {
                            if (displayExam.includes(" ")) {
                              // Multiple words: Take first word
                              displayExam = displayExam.split(" ")[0];
                            } else {
                              // Single word > 8 chars: Take first 4 letters
                              displayExam = displayExam.substring(0, 4);
                            }
                          }
                        } else {
                          // Fallback for others: Shorten if too long
                          if (displayExam.length > 12)
                            displayExam = displayExam.substring(0, 8) + "..";
                        }

                        return (
                          <div
                            key={idx}
                            className="grid grid-cols-12 gap-2 items-center text-xs group/exam hover:bg-[#15171C]/50 p-1.5 rounded-lg transition-colors cursor-default"
                          >
                            {/* Session Indicator */}
                            <div className="col-span-2 flex items-center gap-1.5">
                              <div
                                className={`w-1.5 h-1.5 rounded-full ${
                                  session === "AM"
                                    ? "bg-amber-400"
                                    : "bg-indigo-400"
                                }`}
                              />
                              <span className="font-bold text-[#A0A5B5]">
                                {session}
                              </span>
                            </div>
                            {/* Client Name */}
                            <div
                              className="col-span-5 font-bold text-[#E2E8F0] truncate uppercase"
                              title={exam.client_name}
                            >
                              {displayClient}
                            </div>
                            {/* Exam Name (Short) */}
                            <div
                              className="col-span-3 font-mono text-[#6B7280] tracking-tight text-[10px] uppercase truncate"
                              title={exam.exam_name}
                            >
                              {displayExam}
                            </div>
                            {/* Candidates */}
                            <div className="col-span-2 text-right font-black text-amber-600">
                              {exam.candidate_count || 0}{" "}
                              <span className="text-[9px] text-[#6B7280] font-normal">
                                pax
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                    {/* View More Hint if > 3 and NOT Global */}
                    {activeBranch !== "global" &&
                      dashboardData?.todaysExams &&
                      dashboardData.todaysExams.length > 3 && (
                        <div className="text-[9px] text-center text-[#6B7280] mt-1 italic">
                          + {dashboardData.todaysExams.length - 3} more sessions
                        </div>
                      )}
                  </div>
                </div>
              </div>
            </div>

            {/* Chronos Module (Time/Date) */}
          </div>
        </motion.div>

        {/* AI Search Bar Removed as per request */}

        {/* Main Grid Layout - Transformed into Beautiful Boxes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-20 items-stretch">
          {/* Box 1: Daily Reports */}
          <div className="col-span-1 flex flex-col h-full">
            {/* 1. CHECKLIST (PROTOCOLS) - TITANIUM COMMAND PLATE */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className={`${neuCard} p-8 relative overflow-hidden`}
            >
              {/* Decorative Screw Heads */}
              <div className="absolute top-4 left-4 w-3 h-3 rounded-full bg-slate-300 shadow-[inset_1px_1px_2px_rgba(0,0,0,0.1),1px_1px_1px_rgba(255,255,255,0.8)] flex items-center justify-center">
                <div className="w-1.5 h-0.5 bg-slate-400 rotate-45"></div>
              </div>
              <div className="absolute top-4 right-4 w-3 h-3 rounded-full bg-slate-300 shadow-[inset_1px_1px_2px_rgba(0,0,0,0.1),1px_1px_1px_rgba(255,255,255,0.8)] flex items-center justify-center">
                <div className="w-1.5 h-0.5 bg-slate-400 rotate-45"></div>
              </div>

              <h3 className="text-xl font-black text-[#E2E8F0] mb-8 flex items-center gap-3 tracking-tight relative z-10">
                <div className={`${neuInset} p-2 text-rose-400`}>
                  <ListChecks size={20} />
                </div>
                <span className="bg-gradient-to-r from-[#F59E0B] to-amber-600 bg-clip-text text-transparent uppercase text-sm font-black tracking-widest">
                  Daily Reports
                </span>
              </h3>

              {/* Horizontal Layout for Actions */}
              <div className="grid grid-cols-2 lg:grid-cols-2 gap-4 relative z-10 h-full">
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => handleOpenChecklist("pre_exam")}
                    className="h-full min-h-[140px] rounded-3xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.4)] border relative overflow-hidden transition-all flex flex-col justify-center items-center bg-[#1A1D24] border-[#06B6D4] cursor-pointer hover:shadow-[0_0_20px_rgba(6,182,212,0.15)] group"
                  >
                    <div className="absolute top-0 left-0 w-full h-1.5 transition-opacity group-hover:opacity-80 bg-[#06B6D4] shadow-[0_0_15px_#06B6D4]" />
                    <div
                      className={`w-14 h-14 rounded-2xl ${
                        todayStatus.pre === "Submitted"
                          ? "bg-[#06B6D4]/20 text-[#06B6D4]"
                          : "bg-[#15171C] text-[#06B6D4]"
                      } shadow-md flex items-center justify-center font-bold mb-4 group-hover:bg-[#06B6D4]/30 transition-colors duration-300`}
                    >
                      <ClipboardCheck size={28} />
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] font-bold text-[#A0A5B5] uppercase tracking-widest mb-1">
                        Step 01
                      </div>
                      <div className="text-lg font-black text-[#FDFFF8] group-hover:text-[#06B6D4] transition-colors uppercase tracking-tight">
                        Morning Check
                      </div>
                    </div>
                  </button>
                  <div className="flex items-center justify-between px-3 py-2 bg-[#1A1D24] rounded-xl border border-[#353A47]">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${
                          todayStatus.pre === "Submitted"
                            ? "bg-emerald-400"
                            : "bg-slate-200"
                        }`}
                      />
                      <span
                        className={`text-[9px] font-black uppercase tracking-[0.1em] ${
                          todayStatus.pre === "Submitted"
                            ? "text-emerald-500"
                            : "text-[#6B7280]"
                        }`}
                      >
                        {todayStatus.pre === "Submitted" ? "Done" : "Pending"}
                      </span>
                    </div>
                    {todayStatus.pre !== "Submitted" ? (
                      <button
                        onClick={() => handleOpenChecklist("pre_exam")}
                        className="text-[9px] font-black text-[#06B6D4] uppercase tracking-widest hover:text-[#22d3ee] transition-colors flex items-center gap-1 group/fn"
                      >
                        Fill Now{" "}
                        <ChevronRight
                          size={10}
                          className="group-hover/fn:translate-x-0.5 transition-transform"
                        />
                      </button>
                    ) : (
                      <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">
                        Verified
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => handleOpenChecklist("post_exam")}
                    className={`h-full min-h-[140px] rounded-3xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.4)] border relative overflow-hidden transition-all flex flex-col justify-center items-center bg-[#1A1D24] ${
                      todayStatus.post === "Submitted" ? "opacity-80 border-[#353A47]" : "border-[#8B5CF6] hover:shadow-[0_0_20px_rgba(139,92,246,0.15)]"
                    } cursor-pointer group`}
                  >
                    <div className={`absolute top-0 left-0 w-full h-1.5 transition-opacity group-hover:opacity-80 ${todayStatus.post === "Submitted" ? "bg-[#353A47]" : "bg-[#8B5CF6] shadow-[0_0_15px_#8B5CF6]"}`} />
                    <div
                      className={`w-14 h-14 rounded-2xl ${
                        todayStatus.post === "Submitted"
                          ? "bg-[#8B5CF6]/20 text-[#8B5CF6]"
                          : "bg-[#15171C] text-[#8B5CF6]"
                      } shadow-md flex items-center justify-center font-bold mb-4 group-hover:bg-[#8B5CF6]/30 transition-colors duration-300`}
                    >
                      <CheckCircle size={28} />
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] font-bold text-[#A0A5B5] uppercase tracking-widest mb-1">
                        Step 02
                      </div>
                      <div className="text-lg font-black text-[#FDFFF8] group-hover:text-[#8B5CF6] transition-colors uppercase tracking-tight">
                        Evening Check
                      </div>
                    </div>
                  </button>
                  <div className="flex items-center justify-between px-3 py-2 bg-[#1A1D24] rounded-xl border border-[#353A47]">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${
                          todayStatus.post === "Submitted"
                            ? "bg-emerald-400"
                            : "bg-slate-200"
                        }`}
                      />
                      <span
                        className={`text-[9px] font-black uppercase tracking-[0.1em] ${
                          todayStatus.post === "Submitted"
                            ? "text-emerald-500"
                            : "text-[#6B7280]"
                        }`}
                      >
                        {todayStatus.post === "Submitted" ? "Done" : "Pending"}
                      </span>
                    </div>
                    {todayStatus.post !== "Submitted" ? (
                      <button
                        onClick={() => handleOpenChecklist("post_exam")}
                        className="text-[9px] font-black text-[#8B5CF6] uppercase tracking-widest hover:text-[#a78bfa] transition-colors flex items-center gap-1 group/fn"
                      >
                        Fill Now{" "}
                        <ChevronRight
                          size={10}
                          className="group-hover/fn:translate-x-0.5 transition-transform"
                        />
                      </button>
                    ) : (
                      <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">
                        Verified
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* FVault removed and moved to Header left menu */}

          {/* Box 2: QUICK ACCESS LINKS */}
          <div className="col-span-1 flex flex-col h-full">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className={`${neuCard} p-8 flex-1`}
            >
              <h3 className="text-xl font-black text-[#E2E8F0] mb-6 flex items-center gap-3 tracking-tight">
                <div className={`${neuInset} p-2 text-[#F59E0B]`}>
                  <ExternalLink size={20} />
                </div>
                <span className="bg-gradient-to-r from-[#F59E0B] to-amber-600 bg-clip-text text-transparent uppercase text-sm font-black tracking-widest">
                  Quick Links
                </span>
              </h3>

              <div className="grid grid-cols-2 gap-4">
                {[
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
                ].map((link) => (
                  <a
                    key={link.name}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-full min-h-[120px] rounded-3xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.4)] border relative overflow-hidden flex flex-col items-center justify-center gap-3 bg-[#1A1D24] border-[#F59E0B] cursor-pointer hover:shadow-[0_0_20px_rgba(245,158,11,0.15)] group transition-transform hover:scale-[1.02]"
                  >
                    <div className="absolute top-0 left-0 w-full h-1.5 transition-opacity group-hover:opacity-80 bg-[#F59E0B] shadow-[0_0_15px_#F59E0B]" />
                    <div className="w-full h-16 flex items-center justify-center p-2 relative">
                      <img
                        src={link.image}
                        alt={link.name}
                        className="w-full h-full object-contain scale-125"
                      />
                    </div>
                  </a>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* STAFF/BRANCH SELECTOR MODAL */}
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

      {/* CHECKLIST FORM MODAL */}
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
              fetchAnalysis();
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
