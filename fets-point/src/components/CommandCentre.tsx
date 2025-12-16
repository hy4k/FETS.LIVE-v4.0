import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Calendar, Activity, CheckCircle, UserCheck, Clock,
  AlertTriangle, Bell, TrendingUp, FileText, Shield, Building2,
  Plus, Play, Edit, X, Save, CheckCircle2, Trash2, ClipboardList, ClipboardCheck, Sparkles, ListChecks, User, AlertCircle
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useBranch } from '../hooks/useBranch'
import { toast } from 'react-hot-toast'
import { useDashboardStats, useCandidateTrend, useUpcomingSchedule } from '../hooks/useCommandCentre'
import { ExamScheduleWidget } from './ExamScheduleWidget'
import { supabase } from '../lib/supabase' // Keep for mutations
import { ChecklistFormModal } from './checklist/ChecklistFormModal'
import { ChecklistTemplate } from '../types/checklist'

import { NotificationBanner } from './NotificationBanner'

interface DashboardData {
  totalCandidates: number;
  todayCandidates: number;
  openEvents: number;
  pendingChecklists: number;
  todaysRoster: RosterDay | null;
  newPosts: number;
  newMessages: number;
  pendingIncidents: number;
  todaysExams: Array<{ client_name: string; candidate_count: number }>;
}

import { KPIData } from '../types/shared'

interface RosterDay {
  date: string
  day: string
  staff: string[]
}

interface ExamSchedule {
  exam_name: string
  client_name: string
  day: string
  date: string
  session: string
  candidates: number
  remaining_seats: number
}

interface Event {
  id: string
  title: string
  type: string
  priority: string
  created_at: string
  is_pending: boolean
  is_emergency: boolean
}


// Removed old interfaces


export default function CommandCentre({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  const { profile } = useAuth()
  const { activeBranch } = useBranch()

  // --- React Query Hooks ---
  const { data: dashboardData, isLoading: isLoadingStats } = useDashboardStats()
  const { data: candidateTrend = [], isLoading: isLoadingTrend } = useCandidateTrend()
  const { data: examSchedule = [], isLoading: isLoadingSchedule } = useUpcomingSchedule()


  const [activeTemplate, setActiveTemplate] = useState<ChecklistTemplate | null>(null);
  const [showChecklistModal, setShowChecklistModal] = useState(false);

  const [kpis, setKpis] = useState<KPIData>({
    sessions_scheduled: 0,
    sessions_live: 0,
    sessions_done: 0,
    candidates_present: 0,
    candidates_expected: 0,
    incidents_open: 0
  })

  const [rosterDays, setRosterDays] = useState<RosterDay[]>([])
  const [events, setEvents] = useState<Event[]>([])



  // Load Candidate Overview KPIs
  useEffect(() => {
    const loadKPIs = async () => {
      try {
        const today = new Date().toISOString().split('T')[0]

        let candidatesQuery = supabase
          .from('candidates')
          .select('*')
          .gte('exam_date', `${today}T00:00:00`)
          .lt('exam_date', `${today}T23:59:59`)

        if (activeBranch !== 'global') {
          candidatesQuery = candidatesQuery.eq('branch_location', activeBranch)
        }

        const { data: candidatesData, error } = await candidatesQuery

        if (error) {
          console.error('Error loading candidates:', error)
          return
        }

        const todaysCandidates = candidatesData?.length || 0
        const checkedIn = candidatesData?.filter(c => c.status === 'checked_in' || c.status === 'present').length || 0
        const inProgress = candidatesData?.filter(c => c.status === 'in_progress' || c.status === 'active').length || 0
        const completed = candidatesData?.filter(c => c.status === 'completed' || c.status === 'finished').length || 0

        setKpis({
          sessions_scheduled: todaysCandidates,
          sessions_live: inProgress,
          sessions_done: completed,
          candidates_present: completed,
          candidates_expected: todaysCandidates,
          incidents_open: 0
        })
      } catch (error) {
        console.error('Error loading KPIs:', error)
      }
    }

    loadKPIs()
    const interval = setInterval(loadKPIs, 30000)
    return () => clearInterval(interval)
  }, [activeBranch])

  // Load FETS Roster - 5 Day Schedule
  useEffect(() => {
    const loadRoster = async () => {
      try {
        const today = new Date()
        const fiveDaysLater = new Date(today)
        fiveDaysLater.setDate(today.getDate() + 5)

        let rosterQuery = supabase
          .from('staff_schedules')
          .select('*')
          .gte('schedule_date', today.toISOString().split('T')[0])
          .lte('schedule_date', fiveDaysLater.toISOString().split('T')[0])
          .order('schedule_date')

        if (activeBranch !== 'global') {
          rosterQuery = rosterQuery.eq('branch_location', activeBranch)
        }

        const { data, error } = await rosterQuery

        if (error) {
          console.error('Error loading roster:', error)
          setRosterDays([])
          return
        }

        const rosterMap = new Map<string, RosterDay>()
        data?.forEach((schedule: any) => {
          const dateKey = schedule.schedule_date
          const staffName = 'Staff Member' // Since we don't have the join

          if (!rosterMap.has(dateKey)) {
            const date = new Date(dateKey)
            rosterMap.set(dateKey, {
              date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              day: date.toLocaleDateString('en-US', { weekday: 'short' }),
              staff: []
            })
          }
          rosterMap.get(dateKey)?.staff.push(staffName)
        })

        setRosterDays(Array.from(rosterMap.values()))
      } catch (error) {
        console.error('Error loading roster:', error)
        setRosterDays([])
      }
    }

    loadRoster()
  }, [activeBranch])

  // Load Event Manager Data
  useEffect(() => {
    const loadEvents = async () => {
      try {
        let eventsQuery = supabase
          .from('events')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10)

        if (activeBranch !== 'global') {
          eventsQuery = eventsQuery.eq('branch_location', activeBranch)
        }

        const { data, error } = await eventsQuery

        if (error) {
          console.error('Error loading events:', error)
          setEvents([])
          return
        }

        const eventsList = data?.map((event: any) => ({
          id: event.id,
          title: event.event_title || event.title || 'Untitled Event',
          type: event.event_type || 'incident',
          priority: event.priority || 'medium',
          created_at: event.created_at,
          is_pending: event.status === 'pending' || event.status === 'open',
          is_emergency: event.priority === 'critical' || event.priority === 'emergency'
        })) || []

        setEvents(eventsList)
      } catch (error) {
        console.error('Error loading events:', error)
        setEvents([])
      }
    }

    loadEvents()
  }, [activeBranch])


  const handleOpenChecklist = async (type: 'pre_exam' | 'post_exam' | 'custom') => {
    try {
      // Fetch the active template for this type
      // For custom, we might want to show a selector, but for now let's just fetch the most recent active custom one or handle it differently.
      // The user said "currently enabled checklist should come up".

      const { data, error } = await supabase
        .from('checklist_templates' as any)
        .select('*')
        .eq('type', type)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        toast.error(`No active ${type.replace('_', ' ')} checklist found.`);
        return;
      }

      setActiveTemplate(data as unknown as ChecklistTemplate);
      setShowChecklistModal(true);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load checklist');
    }
  };


  const formattedExamSchedule = useMemo(() => {
    return examSchedule.map((session: any) => {
      const date = new Date(session.date)
      return {
        exam_name: session.exam_name || 'Unknown Exam',
        client_name: session.client_name || 'Unknown Client',
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        session: session.session_type || 'Morning',
        candidates: session.candidate_count || 0,
        remaining_seats: session.available_seats || 0
      }
    })
  }, [examSchedule])

  if (isLoadingStats || isLoadingTrend || isLoadingSchedule) {
    return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900"></div></div>
  }

  return (
    <div className="min-h-screen bg-[#e0e5ec] relative overflow-hidden" style={{ fontFamily: "'Montserrat', sans-serif" }}>

      {/* Functional Notification Banner */}
      <NotificationBanner onNavigate={onNavigate} />

      {/* Main Content - Tighter Layout */}
      <div className="relative z-10 max-w-[1800px] mx-auto p-4">
        {/* Executive Summary Header - Neumorphic Style */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="neomorphic-card mb-4 flex items-center justify-between"
        >
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-700 mb-1 tracking-tight text-gold-gradient">COMMAND CENTRE</h1>
            <p className="text-gray-500 text-sm font-medium">Executive Operations Dashboard{activeBranch !== 'global' && <span className="hidden md:inline"> · {activeBranch.toUpperCase()}</span>}</p>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
            <div className="text-xl font-bold text-gray-700">
              {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </motion.div>

        {/* FETS Calendar Widget */}
        <ExamScheduleWidget onNavigate={onNavigate} />



        {/* Main Dashboard Grid - New Neumorphic Style */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          {/* Box 1: Total Candidates */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="neomorphic-card group cursor-pointer relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-2 opacity-10">
              <Users size={80} />
            </div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <div className="indicator-dot active"></div>
                <Users className="w-5 h-5 text-gray-500" />
              </div>
              <h3 className="text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Total Candidates</h3>
              <p className="text-3xl font-bold text-gray-700 mb-1">
                {dashboardData?.totalCandidates || 0}
              </p>
              <div className="flex items-center gap-1 text-[10px] text-gray-500 font-medium uppercase">
                <TrendingUp className="w-3 h-3 text-gold-gradient" />
                <span>All Time</span>
              </div>
            </div>
          </motion.div>

          {/* Box 2: Today's Total Candidates */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="neomorphic-card group cursor-pointer relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-2 opacity-10">
              <UserCheck size={80} />
            </div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <div className="indicator-dot active"></div>
                <UserCheck className="w-5 h-5 text-gray-500" />
              </div>
              <h3 className="text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Today's Candidates</h3>
              <p className="text-3xl font-bold text-gold-gradient mb-1">
                {dashboardData?.todayCandidates || 0}
              </p>
              <div className="flex items-center gap-1 text-[10px] text-gray-500 font-medium uppercase">
                <Clock className="w-3 h-3" />
                <span>New Registrations</span>
              </div>
            </div>
          </motion.div>

          {/* Box 3: Today's Exam */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="neomorphic-card group cursor-pointer relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-2 opacity-10">
              <Calendar size={80} />
            </div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <div className="indicator-dot active"></div>
                <Calendar className="w-5 h-5 text-gray-500" />
              </div>
              <h3 className="text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Today's Exams</h3>

              {dashboardData?.todaysExams && dashboardData.todaysExams.length > 0 ? (
                <div className="space-y-1">
                  {dashboardData.todaysExams.slice(0, 2).map((exam, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm">
                      <span className="font-bold text-gray-700 truncate">{exam.client_name}</span>
                      <span className="text-xs font-medium text-yellow-600 bg-yellow-100 px-1.5 py-0.5 rounded">{exam.candidate_count}</span>
                    </div>
                  ))}
                  {dashboardData.todaysExams.length > 2 && (
                    <p className="text-[10px] text-gray-400 font-medium">+{dashboardData.todaysExams.length - 2} more</p>
                  )}
                </div>
              ) : (
                <div className="text-gray-400 text-sm font-medium">No exams scheduled</div>
              )}
            </div>
          </motion.div>

          {/* Box 4: Pending Incidents */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="neomorphic-card group cursor-pointer relative overflow-hidden"
            onClick={() => onNavigate?.('incident-manager')}
          >
            <div className="absolute top-0 right-0 p-2 opacity-10">
              <AlertTriangle size={80} />
            </div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <div className={`indicator-dot ${dashboardData?.pendingIncidents && dashboardData.pendingIncidents > 0 ? 'active' : ''}`}></div>
                <AlertTriangle className="w-5 h-5 text-gray-500" />
              </div>
              <h3 className="text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Pending Incidents</h3>
              <p className="text-3xl font-bold text-gray-700 mb-1">
                {dashboardData?.pendingIncidents || 0}
              </p>
              <div className="flex items-center gap-1 text-[10px] text-gray-500 font-medium uppercase">
                <Bell className="w-3 h-3" />
                <span>Needs Attention</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Additional Content Below */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Run Checklist */}
            <div className="neomorphic-card">
              <h2 className="text-lg font-bold text-gray-700 flex items-center gap-2 mb-4 uppercase tracking-wide">
                <ListChecks className="w-5 h-5 text-yellow-600" />
                Run Checklist
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  onClick={() => handleOpenChecklist('pre_exam')}
                  className="neomorphic-btn hover:text-yellow-600 text-sm"
                >
                  <ClipboardList className="w-4 h-4" />
                  <span>Pre-Exam</span>
                </button>
                <button
                  onClick={() => handleOpenChecklist('post_exam')}
                  className="neomorphic-btn hover:text-yellow-600 text-sm"
                >
                  <ClipboardCheck className="w-4 h-4" />
                  <span>Post-Exam</span>
                </button>
                <button
                  onClick={() => handleOpenChecklist('custom')}
                  className="neomorphic-btn hover:text-yellow-600 text-sm"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Custom</span>
                </button>
                <button
                  className="neomorphic-btn hover:text-yellow-600 text-sm"
                >
                  <Users className="w-4 h-4" />
                  <span>Candidate</span>
                </button>
              </div>
            </div>

            {/* Activity Feed */}
            <div className="neomorphic-card">
              <h2 className="text-lg font-bold text-gray-700 flex items-center gap-2 mb-4 uppercase tracking-wide">
                <Activity className="w-5 h-5 text-yellow-600" />
                Activity Feed
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-2 rounded-lg bg-gray-50/50">
                  <span className="text-sm text-gray-600 font-medium">New Posts</span>
                  <span className="text-lg font-bold text-gray-800">{dashboardData?.newPosts}</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-lg bg-gray-50/50">
                  <span className="text-sm text-gray-600 font-medium">New Messages</span>
                  <span className="text-lg font-bold text-gray-800">{dashboardData?.newMessages}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Dashboard Grid - 3 Columns - Seamlessly Connected */}

      </div>

      {/* Checklist Filling Modal */}
      <AnimatePresence>
        {showChecklistModal && activeTemplate && (
          <ChecklistFormModal
            template={activeTemplate}
            onClose={() => setShowChecklistModal(false)}
            currentUser={profile}
          />
        )}
      </AnimatePresence>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700;800&family=Poppins:wght@400;600;700&display=swap');

        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 168, 168, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 168, 168, 0.7);
        }

        /* Glassmorphism Box Styles */
        .glassmorphism-box {
          position: relative;
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-radius: 24px;
          border: 1px solid rgba(255, 255, 255, 0.5);
          padding: 1.25rem;
          box-shadow:
            0 8px 32px 0 rgba(31, 38, 135, 0.15),
            0 0 0 1px rgba(255, 255, 255, 0.2) inset,
            0 20px 40px -10px rgba(0, 0, 0, 0.1);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          transform-style: preserve-3d;
          overflow: hidden;
        }

        @media (min-width: 768px) {
          .glassmorphism-box {
            padding: 2rem;
          }
        }

        .glassmorphism-box::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.4) 0%,
            rgba(255, 255, 255, 0.1) 50%,
            rgba(255, 255, 255, 0.05) 100%
          );
          border-radius: 24px;
          opacity: 0;
          transition: opacity 0.4s ease;
          pointer-events: none;
        }

        .glassmorphism-box:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow:
            0 20px 60px 0 rgba(31, 38, 135, 0.25),
            0 0 0 1px rgba(255, 255, 255, 0.3) inset,
            0 30px 60px -15px rgba(0, 0, 0, 0.2);
          border-color: rgba(255, 255, 255, 0.7);
        }

        .glassmorphism-box:hover::before {
          opacity: 1;
        }

        /* 3D Icon Styles */
        .icon-3d {
          width: 64px;
          height: 64px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow:
            0 10px 30px rgba(0, 0, 0, 0.2),
            0 1px 8px rgba(0, 0, 0, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.3);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          transform-style: preserve-3d;
        }

        .icon-3d::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 20px;
          background: linear-gradient(
            145deg,
            rgba(255, 255, 255, 0.3) 0%,
            rgba(255, 255, 255, 0) 100%
          );
          opacity: 1;
          transition: opacity 0.3s ease;
        }

        .glassmorphism-box:hover .icon-3d {
          transform: translateZ(20px) rotateY(5deg) rotateX(-5deg) scale(1.1);
          box-shadow:
            0 15px 40px rgba(0, 0, 0, 0.3),
            0 5px 15px rgba(0, 0, 0, 0.15),
            inset 0 1px 0 rgba(255, 255, 255, 0.4);
        }

        /* Mobile 3D Icon Styles */
        .icon-3d-mobile {
          width: 48px;
          height: 48px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow:
            0 8px 20px rgba(0, 0, 0, 0.18),
            0 1px 6px rgba(0, 0, 0, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.3);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          transform-style: preserve-3d;
        }

        .icon-3d-mobile::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 16px;
          background: linear-gradient(
            145deg,
            rgba(255, 255, 255, 0.3) 0%,
            rgba(255, 255, 255, 0) 100%
          );
          opacity: 1;
          transition: opacity 0.3s ease;
        }

        .glassmorphism-box:hover .icon-3d-mobile {
          transform: translateZ(15px) scale(1.05);
          box-shadow:
            0 12px 30px rgba(0, 0, 0, 0.25),
            0 4px 12px rgba(0, 0, 0, 0.12),
            inset 0 1px 0 rgba(255, 255, 255, 0.4);
        }

        /* Uiverse Button Styles */
        .uiverse-button {
          background:
            linear-gradient(140.14deg, #00A8A8 15.05%, #00A8A8 114.99%) padding-box,
            linear-gradient(142.51deg, #00A8A8 8.65%, #00A8A8 88.82%) border-box;
          border-radius: 9px;
          border: 6px solid transparent;
          text-shadow: 1px 1px 1px #00000040;
          box-shadow: 9px 9px 18px 0px #45090059;
          padding: 12px 45px;
          line-height: 20px;
          cursor: pointer;
          transition: all 0.3s;
          color: #fff;
          font-size: 20px;
          font-weight: 600;
          font-family: 'Poppins', sans-serif;
          background-clip: padding-box, border-box;
        }

        .uiverse-button:hover {
          box-shadow: none;
          opacity: 0.8;
        }

        .btn-command-centre {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 1rem;
          border-radius: 1rem;
          font-weight: bold;
          transition: transform 0.2s;
          color: white;
        }

        .btn-command-centre:hover {
          transform: scale(1.05);
        }

        .btn-pre-exam {
          background-color: #3b82f6;
        }

        .btn-post-exam {
          background-color: #22c55e;
        }

        .btn-custom-checklist {
          background-color: #a855f7;
        }

        .btn-new-candidate {
          background-color: #f97316;
        }
      `}</style>
    </div>
  )
}
