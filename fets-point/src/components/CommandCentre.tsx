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
import { useDashboardStats, useCandidateTrend, useUpcomingSchedule, useChecklistTemplates } from '../hooks/useCommandCentre'
import { ExamScheduleWidget } from './ExamScheduleWidget'
import { supabase } from '../lib/supabase' // Keep for mutations

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

interface ChecklistItem {
  id: string
  name: string
  completed: boolean
  responsible_person: string
  completion_time: string | null
}

interface ChecklistTemplate {
  id: string
  name: string
  category: string
  is_active: boolean
  created_by: string
  created_at: string
  updated_at: string
  description?: string
}

interface ChecklistTemplateItem {
  id: string
  template_id: string
  title: string
  description?: string
  priority: 'low' | 'medium' | 'high'
  estimated_time_minutes: number
  responsible_role: string
  sort_order: number
  notes?: string
  question_type?: 'checkbox' | 'text' | 'number' | 'dropdown' | 'date' | 'time'
  dropdown_options?: string[]
}

const PRIORITY_CONFIG = {
  high: { color: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-500', label: 'High' },
  medium: { color: 'bg-orange-100 text-orange-700 border-orange-200', dot: 'bg-orange-500', label: 'Medium' },
  low: { color: 'bg-blue-100 text-blue-700 border-blue-200', dot: 'bg-blue-500', label: 'Low' }
}

export default function CommandCentre({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  const { profile } = useAuth()
  const { activeBranch } = useBranch()

  // --- React Query Hooks ---
  const { data: dashboardData, isLoading: isLoadingStats } = useDashboardStats()
  const { data: candidateTrend = [], isLoading: isLoadingTrend } = useCandidateTrend()
  const { data: examSchedule = [], isLoading: isLoadingSchedule } = useUpcomingSchedule()
  const { data: templates, isLoading: isLoadingTemplates } = useChecklistTemplates()
  const { preExamTemplate, postExamTemplate, customTemplates } = templates || {}
  const preExamItems = preExamTemplate?.items || []
  const postExamItems = postExamTemplate?.items || []

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
  const [checklists, setChecklists] = useState<ChecklistItem[]>([])

  // Modals
  const [showPreExamModal, setShowPreExamModal] = useState(false)
  const [showPostExamModal, setShowPostExamModal] = useState(false)
  const [showCustomChecklistModal, setShowCustomChecklistModal] = useState(false)
  const [fillData, setFillData] = useState<{ exam_date: string; items: { [key: string]: boolean } }>({
    exam_date: new Date().toISOString().split('T')[0],
    items: {}
  })
  const [customChecklistData, setCustomChecklistData] = useState({
    name: '',
    description: '',
    questions: [] as Array<{
      id: string;
      title: string;
      description: string;
      priority: 'low' | 'medium' | 'high';
      estimated_time_minutes: number;
      question_type: 'checkbox' | 'text' | 'number' | 'dropdown' | 'date' | 'time';
      dropdown_options: string[];
    }>
  })

  // Computed values for modals
  const selectedTemplate = showPreExamModal ? preExamTemplate : showPostExamModal ? postExamTemplate : null
  const selectedTemplateItems = showPreExamModal ? preExamItems : showPostExamModal ? postExamItems : []


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

  // Load Checklist Status
  useEffect(() => {
    const loadChecklists = async () => {
      try {
        let checklistsQuery = supabase
          .from('checklist_items')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5)

        if (activeBranch !== 'global') {
          checklistsQuery = checklistsQuery.eq('branch_location', activeBranch)
        }

        const { data, error } = await checklistsQuery

        if (error) {
          console.error('Error loading checklists:', error)
          setChecklists([])
          return
        }

        const checklistItems = data?.map((item: any) => ({
          id: item.id,
          name: item.title || 'Unknown Task',
          completed: !!item.completed_at,
          responsible_person: 'Staff',
          completion_time: item.completed_at
        })) || []

        setChecklists(checklistItems)
      } catch (error) {
        console.error('Error loading checklists:', error)
        setChecklists([])
      }
    }

    loadChecklists()
  }, [activeBranch])

  // Handle opening checklist modals
  const handleOpenPreExam = () => {
    if (!preExamTemplate || !preExamTemplate.items || preExamTemplate.items.length === 0) {
      toast.error('Pre-exam checklist template not found')
      return
    }
    setShowPreExamModal(true)
  }

  const handleOpenPostExam = () => {
    if (!postExamTemplate || !postExamTemplate.items || postExamTemplate.items.length === 0) {
      toast.error('Post-exam checklist template not found')
      return
    }
    setShowPostExamModal(true)
  }

  // Custom checklist helper functions
  const addCustomQuestion = () => {
    const newQuestion = {
      id: Date.now().toString(),
      title: '',
      description: '',
      priority: 'medium' as 'low' | 'medium' | 'high',
      estimated_time_minutes: 5,
      question_type: 'checkbox' as 'checkbox' | 'text' | 'number' | 'dropdown' | 'date' | 'time',
      dropdown_options: [] as string[]
    }
    setCustomChecklistData(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }))
  }

  const deleteCustomQuestion = (id: string) => {
    setCustomChecklistData(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== id)
    }))
  }

  const updateCustomQuestion = (id: string, updates: Partial<typeof customChecklistData.questions[0]>) => {
    setCustomChecklistData(prev => ({
      ...prev,
      questions: prev.questions.map(q => q.id === id ? { ...q, ...updates } : q)
    }))
  }

  const submitChecklist = async () => {
    if (!profile || !selectedTemplate) return
    const itemsForTemplate = showPreExamModal ? preExamItems : postExamItems;

    const allCompleted = itemsForTemplate.every(item => fillData.items[item.id.toString()])

    if (!allCompleted) {
      const proceed = confirm('Not all items are checked. Do you want to submit anyway?')
      if (!proceed) return
    }

    try {
      const { data: instance, error: instanceError } = await supabase
        .from('checklist_instances')
        .insert({
          template_id: selectedTemplate.id,
          name: `${selectedTemplate.name} - ${new Date(fillData.exam_date).toLocaleDateString()}`,
          category: selectedTemplate.category,
          exam_date: fillData.exam_date,
          created_by: profile.user_id,
          branch_location: activeBranch === 'global' ? 'calicut' : activeBranch,
          completed_at: allCompleted ? new Date().toISOString() : null
        })
        .select()
        .single()
      if (instanceError) throw instanceError

      const instanceItems = itemsForTemplate.map(item => ({
        instance_id: instance.id,
        template_item_id: item.id,
        title: item.title,
        description: item.description,
        priority: item.priority,
        is_completed: fillData.items[item.id.toString()] || false,
        completed_by: fillData.items[item.id.toString()] ? profile.id : null,
        completed_at: fillData.items[item.id.toString()] ? new Date().toISOString() : null,
        sort_order: item.sort_order
      }))

      const { error: itemsError } = await supabase
        .from('checklist_instance_items')
        .insert(instanceItems)

      if (itemsError) throw itemsError

      toast.success('Checklist submitted successfully')
      setShowPreExamModal(false)
      setShowPostExamModal(false)
      setFillData({ exam_date: new Date().toISOString().split('T')[0], items: {} })
    } catch (error) {
      console.error('Error submitting checklist:', error)
      toast.error('Failed to submit checklist')
    }
  }

  const createCustomChecklist = async () => {
    if (!profile || !customChecklistData.name.trim()) {
      toast.error('Checklist name is required')
      return
    }

    if (customChecklistData.questions.length === 0) {
      toast.error('At least one question is required')
      return
    }

    try {
      const { data: template, error: templateError } = await supabase
        .from('checklist_templates')
        .insert({
          name: customChecklistData.name,
          description: customChecklistData.description,
          category: 'custom',
          is_active: true,
          created_by: profile.user_id
        })
        .select()
        .single()

      if (templateError) throw templateError

      const items = customChecklistData.questions.map((q, index) => ({
        template_id: template.id,
        title: q.title,
        description: q.description,
        priority: q.priority,
        estimated_time_minutes: q.estimated_time_minutes,
        responsible_role: 'staff',
        sort_order: index + 1
      }))

      const { error: itemsError } = await supabase
        .from('checklist_template_items')
        .insert(items)

      if (itemsError) throw itemsError

      toast.success('Custom checklist created successfully')
      setShowCustomChecklistModal(false)
      setCustomChecklistData({ name: '', description: '', questions: [] })
    } catch (error) {
      console.error('Error creating custom checklist:', error)
      toast.error('Failed to create custom checklist')
    }
  }

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

  if (isLoadingStats || isLoadingTrend || isLoadingSchedule || isLoadingTemplates) {
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
                  onClick={handleOpenPreExam}
                  className="neomorphic-btn hover:text-yellow-600 text-sm"
                >
                  <ClipboardList className="w-4 h-4" />
                  <span>Pre-Exam</span>
                </button>
                <button
                  onClick={handleOpenPostExam}
                  className="neomorphic-btn hover:text-yellow-600 text-sm"
                >
                  <ClipboardCheck className="w-4 h-4" />
                  <span>Post-Exam</span>
                </button>
                <button
                  onClick={() => setShowCustomChecklistModal(true)}
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

      {/* Pre/Post Exam Checklist Modal */}
      <AnimatePresence>
        {(showPreExamModal || showPostExamModal) && selectedTemplate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
            >
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-blue-600">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <ClipboardCheck className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">{selectedTemplate.name}</h2>
                      <p className="text-blue-100 text-sm">Complete all tasks and submit</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setShowPreExamModal(false); setShowPostExamModal(false); }}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Exam Date *</label>
                  <input
                    type="date"
                    value={fillData.exam_date}
                    onChange={(e) => setFillData(prev => ({ ...prev, exam_date: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="space-y-3">
                  {selectedTemplateItems.map((item, index) => (
                    <div
                      key={item.id}
                      className={`p-4 rounded-xl border-2 transition-all ${fillData.items[item.id.toString()]
                        ? 'bg-green-50 border-green-300'
                        : 'bg-white border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      <label className="flex items-start gap-4 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={fillData.items[item.id.toString()] || false}
                          onChange={(e) => setFillData(prev => ({
                            ...prev,
                            items: { ...prev.items, [item.id.toString()]: e.target.checked }
                          }))}
                          className="mt-1 w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-3 mb-1">
                            <h4 className="font-semibold text-gray-900">
                              {index + 1}. {item.title}
                            </h4>
                            <span className={`px-2 py-1 rounded-lg text-xs font-bold ${PRIORITY_CONFIG[item.priority].color}`}>
                              {PRIORITY_CONFIG[item.priority].label}
                            </span>
                          </div>
                          {item.description && (
                            <p className="text-sm text-gray-600">{item.description}</p>
                          )}
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    <span className="font-semibold">
                      {Object.values(fillData.items).filter(Boolean).length} / {selectedTemplateItems.length}
                    </span> tasks completed
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => { setShowPreExamModal(false); setShowPostExamModal(false); }}
                      className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-semibold transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={submitChecklist}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      Submit Checklist
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Checklist Modal */}
      <AnimatePresence>
        {showCustomChecklistModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            >
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-yellow-400 to-yellow-500">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-black/10 rounded-xl flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-black" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-black">Create Custom Checklist</h2>
                      <p className="text-black/70 text-sm">Design your own checklist template</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowCustomChecklistModal(false)}
                    className="p-2 hover:bg-black/10 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-black" />
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Checklist Name *</label>
                      <input
                        type="text"
                        value={customChecklistData.name}
                        onChange={(e) => setCustomChecklistData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                        placeholder="e.g., Weekend Checklist"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                      <input
                        type="text"
                        value={customChecklistData.description}
                        onChange={(e) => setCustomChecklistData(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                        placeholder="Brief description of this checklist"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Questions</h3>
                    <button
                      onClick={addCustomQuestion}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors font-medium"
                    >
                      <Plus className="w-4 h-4" />
                      Add Question
                    </button>
                  </div>

                  <div className="space-y-4">
                    {customChecklistData.questions.map((question, index) => (
                      <div key={question.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="font-semibold text-gray-900">Question {index + 1}</h4>
                          <button
                            onClick={() => deleteCustomQuestion(question.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                            <input
                              type="text"
                              value={question.title}
                              onChange={(e) => updateCustomQuestion(question.id, { title: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                              placeholder="Enter question text"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea
                              value={question.description}
                              onChange={(e) => updateCustomQuestion(question.id, { description: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent resize-none"
                              rows={2}
                              placeholder="Additional details..."
                            />
                          </div>

                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                              <select
                                value={question.priority}
                                onChange={(e) => updateCustomQuestion(question.id, { priority: e.target.value as any })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
                              >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Est. Time (min)</label>
                              <input
                                type="number"
                                value={question.estimated_time_minutes}
                                onChange={(e) => updateCustomQuestion(question.id, { estimated_time_minutes: parseInt(e.target.value) || 5 })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
                                min="1"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {customChecklistData.questions.length === 0 && (
                      <div className="text-center py-12 bg-gray-50 rounded-xl">
                        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600">No questions added yet. Click "Add Question" to start building your checklist.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
                <button
                  onClick={() => setShowCustomChecklistModal(false)}
                  className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createCustomChecklist}
                  className="px-6 py-3 bg-yellow-400 hover:bg-yellow-500 text-black rounded-xl font-semibold transition-colors flex items-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  Create Checklist
                </button>
              </div>
            </motion.div>
          </motion.div>
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
