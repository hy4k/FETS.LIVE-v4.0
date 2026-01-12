import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Calendar, Plus, ChevronLeft, ChevronRight, Edit, Trash2, X, Check, Clock, Users, Eye, MapPin, Building, TrendingUp, Target, Award, Shield, Activity } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { useAuth } from '../hooks/useAuth'
import { useBranch } from '../hooks/useBranch'
import { useBranchFilter } from '../hooks/useBranchFilter'
import { formatDateForIST, getCurrentISTDateString, isToday as isTodayIST, formatDateForDisplay } from '../utils/dateUtils'
import { validateSessionCapacity, getCapacityStatusColor, formatCapacityDisplay, getBranchCapacity } from '../utils/sessionUtils'
import { useCalendarSessions, useSessionMutations } from '../hooks/useCalendarSessions'

interface Session {
  id?: number
  client_name: string
  exam_name: string
  date: string
  candidate_count: number
  start_time: string
  end_time: string
  user_id: string
  created_at?: string
  updated_at?: string
  branch_location?: 'calicut' | 'cochin' | 'kannur'
}

// Subtle client palette for elegant look (neutral background with accent border)
const CLIENT_COLORS = {
  'PEARSON': { bg: '#F8FAFC', text: '#1E40AF', border: '#3B82F6', tint: 'rgba(59, 130, 246, 0.1)', shadow: '0 4px 12px rgba(59, 130, 246, 0.2)' },
  'VUE': { bg: '#F8FAFC', text: '#065F46', border: '#10B981', tint: 'rgba(16, 185, 129, 0.1)', shadow: '0 4px 12px rgba(16, 185, 129, 0.2)' },
  'ETS': { bg: '#F8FAFC', text: '#92400E', border: '#F59E0B', tint: 'rgba(245, 158, 11, 0.1)', shadow: '0 4px 12px rgba(245, 158, 11, 0.2)' },
  'PSI': { bg: '#F8FAFC', text: '#5B21B6', border: '#8B5CF6', tint: 'rgba(139, 92, 246, 0.1)', shadow: '0 4px 12px rgba(139, 92, 246, 0.2)' },
  'PROMETRIC': { bg: '#F8FAFC', text: '#991B1B', border: '#EF4444', tint: 'rgba(239, 68, 68, 0.1)', shadow: '0 4px 12px rgba(239, 68, 68, 0.2)' },
  'OTHER': { bg: '#F8FAFC', text: '#374151', border: '#6B7280', tint: 'rgba(107, 114, 128, 0.1)', shadow: '0 4px 12px rgba(107, 114, 128, 0.2)' }
}

type ClientType = keyof typeof CLIENT_COLORS

export function FetsCalendar() {
  const { user } = useAuth()
  const { activeBranch } = useBranch()
  const { applyFilter, isGlobalView } = useBranchFilter()
  const [currentDate, setCurrentDate] = useState(new Date())
  const { data: sessions = [], isLoading: loading, isError, error } = useCalendarSessions(currentDate, activeBranch, applyFilter, isGlobalView)
  const { addSession, updateSession, deleteSession, isMutating } = useSessionMutations()
  const [showModal, setShowModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [editingSession, setEditingSession] = useState<Session | null>(null)
  const [formData, setFormData] = useState({
    client_name: '',
    exam_name: '',
    date: '',
    candidate_count: 1,
    start_time: '09:00',
    end_time: '17:00'
  })

  useEffect(() => {
    if (isError) {
      toast.error(`Failed to load sessions: ${error.message}`)
    }
  }, [isError, error])

  const getDaysInMonth = useCallback(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }

    return days
  }, [currentDate])

  const getSessionsForDate = (date: Date) => {
    const dateStr = formatDateForIST(date)
    return sessions.filter(session => session.date === dateStr)
  }

  const getClientType = (clientName: string): ClientType => {
    const upperName = clientName.toUpperCase()
    if (upperName.includes('PEARSON')) return 'PEARSON'
    if (upperName.includes('VUE')) return 'VUE'
    if (upperName.includes('ETS')) return 'ETS'
    if (upperName.includes('PSI')) return 'PSI'
    if (upperName.includes('PROMETRIC')) return 'PROMETRIC'
    return 'OTHER'
  }

  // Get per-client candidate counts for a date
  const getClientCounts = (date: Date) => {
    const daySessions = getSessionsForDate(date)
    const clientCounts: { [key: string]: number } = {}

    daySessions.forEach(session => {
      clientCounts[session.client_name] = (clientCounts[session.client_name] || 0) + session.candidate_count
    })

    return clientCounts
  }

  // Calculate remaining seats for a session based on branch
  const getRemainingSeats = (candidateCount: number) => {
    const maxCapacity = getBranchCapacity(activeBranch)
    return Math.max(0, maxCapacity - candidateCount)
  }

  const getShortClient = (name: string) => {
    const n = name.toUpperCase();
    if (n.includes('PEARSON')) return 'PV';
    if (n.includes('PROMETRIC')) return 'PROM';
    if (n.includes('VUE')) return 'VUE';
    if (n.includes('ETS')) return 'ETS';
    if (n.includes('PSI')) return 'PSI';
    return n.slice(0, 4);
  }

  const getShortTime = (time: string) => {
    const [h, m] = time.split(':');
    const hour = parseInt(h);
    const suffix = hour >= 12 ? 'P' : 'A';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}${suffix}`;
  }

  const getShortExam = (name: string) => {
    return name
      .replace(/EXAM/gi, '')
      .replace(/SIMULATION/gi, 'SIM')
      .replace(/INTERNATIONAL/gi, 'INTL')
      .replace(/CERTIFIED/gi, 'CERT')
      .replace(/PROFESSIONAL/gi, 'PRO')
      .trim()
  }

  const formatTimeRange = (startTime: string, endTime: string) => {
    const formatTime = (time: string) => {
      const [hours, minutes] = time.split(':')
      const hour = parseInt(hours)
      const ampm = hour >= 12 ? 'pm' : 'am'
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
      return `${displayHour}:${minutes}${ampm}`
    }
    return `${formatTime(startTime)} - ${formatTime(endTime)}`
  }

  const openModal = (date?: Date, session?: Session) => {
    if (session) {
      setEditingSession(session)
      setFormData({
        client_name: session.client_name,
        exam_name: session.exam_name,
        date: session.date,
        candidate_count: session.candidate_count,
        start_time: session.start_time,
        end_time: session.end_time
      })
    } else {
      setEditingSession(null)
      const dateStr = date ? formatDateForIST(date) : getCurrentISTDateString()
      setFormData({
        client_name: '',
        exam_name: '',
        date: dateStr,
        candidate_count: 1,
        start_time: '09:00',
        end_time: '17:00'
      })
    }
    setShowModal(true)
  }

  const openDetailsModal = (date: Date) => {
    const daySessions = getSessionsForDate(date)
    if (daySessions.length > 0) {
      setSelectedDate(date)
      setShowDetailsModal(true)
    } else {
      openModal(date)
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setShowDetailsModal(false)
    setEditingSession(null)
    setSelectedDate(null)
    setFormData({
      client_name: '',
      exam_name: '',
      date: '',
      candidate_count: 1,
      start_time: '09:00',
      end_time: '17:00'
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    // Validate session capacity with branch-specific limits
    const capacityValidation = validateSessionCapacity(formData.candidate_count, activeBranch)

    if (!capacityValidation.isValid) {
      toast.error(capacityValidation.error!)
      return
    }

    if (capacityValidation.warning) {
      toast(capacityValidation.warning, { icon: '⚠️' })
    }

    try {
      // Prevent creating/updating sessions without a specific centre
      if (activeBranch === 'global') {
        toast.error('Please select a centre (Calicut, Cochin or Kannur) to add or edit sessions.')
        return
      }

      const sessionData: Omit<Session, 'id'> & { created_at?: string } = {
        ...formData,
        user_id: user.id,
        updated_at: new Date().toISOString(),
        branch_location: activeBranch
      }

      if (editingSession && editingSession.id) {
        // Update existing session
        await updateSession({ ...sessionData, id: editingSession.id })
      } else {
        // Create session
        await addSession({ ...sessionData, created_at: new Date().toISOString() })
      }

      closeModal()
    } catch (error) {
      console.error('Error saving session:', error)
      // Error is handled by the mutation hook
    }
  }

  const handleDelete = async (sessionId: number) => {
    if (!confirm('Are you sure you want to delete this session?')) return

    await deleteSession(sessionId)

    // Close details modal if no more sessions for this date
    if (selectedDate) {
      // Check against the main sessions list
      const remainingSessions = sessions.filter(s => s.date === formatDateForIST(selectedDate) && s.id !== sessionId)
      if (remainingSessions.length === 0) {
        setShowDetailsModal(false)
      }
    }
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setCurrentDate(newDate)
  }

  const monthYear = currentDate.toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Kolkata'
  })

  const days = useMemo(() => {
    // Memoize the days array so it doesn't recalculate on every render
    return getDaysInMonth()
  }, [getDaysInMonth])

  const isToday = (date: Date | null) => {
    if (!date) return false
    return isTodayIST(date)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#E6E8EC]">
        <div className="bg-[#E6E8EC] shadow-[8px_8px_16px_rgba(163,177,198,0.6),-8px_-8px_16px_rgba(255,255,255,0.8)] rounded-2xl p-10 flex flex-col items-center space-y-6 border border-white/40">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200"></div>
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-500 border-t-transparent absolute inset-0"></div>
          </div>
          <div className="text-center">
            <p className="text-slate-800 font-semibold text-lg mb-1">Loading Calendar</p>
            <p className="text-slate-500 text-sm">Fetching latest sessions…</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--dashboard-bg,#E6E8EC)] p-8 transition-colors duration-700">
      {/* Premium Neumorphic Header */}
      <div className="rounded-3xl bg-[var(--dashboard-bg,#E6E8EC)] shadow-[8px_8px_16px_var(--neu-dark-shadow,rgba(163,177,198,0.6)),-8px_-8px_16px_var(--neu-light-shadow,rgba(255,255,255,0.8))] border border-white/40 mb-8 p-8 relative overflow-hidden transition-all duration-700">

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
          <Calendar size={200} className="text-slate-500 rotate-12" />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">

          {/* Brand Section */}
          <div className="flex items-center gap-6">
            <div className="p-4 rounded-2xl bg-[#E6E8EC] text-slate-700 shadow-[6px_6px_12px_rgba(163,177,198,0.5),-6px_-6px_12px_rgba(255,255,255,0.8)]">
              <Calendar className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight uppercase">FETS Calendar</h1>
              <p className="text-slate-500 font-medium">Session Planning & Overview</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-6">
            {/* Branch Indicator */}
            <div className="px-6 py-3 rounded-xl bg-[var(--dashboard-bg,#E6E8EC)] shadow-[inset_4px_4px_8px_var(--neu-dark-shadow,rgba(163,177,198,0.5)),inset_-4px_-4px_8px_var(--neu-light-shadow,rgba(255,255,255,0.8))] flex items-center gap-3 transition-all duration-700">
              <div className={`w-3 h-3 rounded-full ${activeBranch === 'global' ? 'bg-blue-500' : 'bg-amber-500'} shadow-[0_0_10px_currentColor] transition-colors duration-700`}></div>
              <span className="font-bold text-slate-600 uppercase tracking-wider text-sm">
                {activeBranch === 'calicut' ? 'Calicut' : activeBranch === 'cochin' ? 'Cochin' : activeBranch === 'kannur' ? 'Kannur' : 'Global View'}
              </span>
            </div>

            {/* Month Nav */}
            <div className="flex items-center p-2 rounded-xl bg-[#E6E8EC] shadow-[6px_6px_12px_rgba(163,177,198,0.5),-6px_-6px_12px_rgba(255,255,255,0.8)]">
              <button onClick={() => navigateMonth('prev')} className="p-3 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 transition-colors">
                <ChevronLeft size={20} />
              </button>
              <div className="w-48 text-center font-bold text-lg text-slate-800">
                {monthYear}
              </div>
              <button onClick={() => navigateMonth('next')} className="p-3 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 transition-colors">
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Add Session */}
            <button
              onClick={() => openModal()}
              className="px-6 py-4 rounded-xl bg-[#E6E8EC] text-slate-800 font-bold uppercase tracking-wider text-sm
               shadow-[6px_6px_12px_rgba(163,177,198,0.5),-6px_-6px_12px_rgba(255,255,255,0.8)]
               hover:shadow-[4px_4px_8px_rgba(163,177,198,0.5),-4px_-4px_8px_rgba(255,255,255,0.8)] hover:text-blue-600 transition-all active:translate-y-0.5 active:shadow-inner"
            >
              <span className="flex items-center gap-2">
                <Plus size={18} /> Add Session
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Premium Neumorphic Calendar Grid */}
      <div className="max-w-[1920px] mx-auto">
        <div className="rounded-3xl p-2">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-6 mb-6">
            {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => (
              <div key={day} className="py-4 text-center bg-[#E6E8EC] rounded-2xl shadow-[inset_3px_3px_6px_rgba(163,177,198,0.3),inset_-3px_-3px_6px_rgba(255,255,255,0.8)]">
                <div className="font-black text-slate-400 text-xs uppercase tracking-[0.2em]">{day.substring(0, 3)}</div>
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-6">
            {days.map((date, index) => {
              if (!date) {
                return (
                  <div key={index} className="h-44 rounded-3xl opacity-0 pointer-events-none"></div>
                )
              }

              const daySessions = getSessionsForDate(date)
              const isCurrentDay = isToday(date)
              const isSelectedMonth = date.getMonth() === currentDate.getMonth()

              // Only dim dates from other months slightly to keep layout consistent
              const opacityClass = isSelectedMonth ? 'opacity-100' : 'opacity-30 grayscale'

              const totalCandidates = daySessions.reduce((sum, s) => sum + s.candidate_count, 0)

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  onClick={() => openDetailsModal(date)}
                  className={`
                    h-52 p-4 cursor-pointer transition-all duration-700 rounded-[2.5rem] group flex flex-col relative overflow-hidden
                    ${opacityClass}
                    ${isCurrentDay
                      ? 'bg-[var(--dashboard-bg,#EEF2F9)] shadow-[inset_9px_9px_16px_var(--neu-dark-shadow,#bec3c9),inset_-9px_-9px_16px_var(--neu-light-shadow,#ffffff)] border-2 border-amber-400/30'
                      : 'bg-[var(--dashboard-bg,#EEF2F9)] shadow-[9px_9px_16px_var(--neu-dark-shadow,#bec3c9),-9px_-9px_16px_var(--neu-light-shadow,#ffffff)] border border-white/60 hover:shadow-[14px_14px_28px_var(--neu-dark-shadow,#bec3c9),-14px_-14px_28px_var(--neu-light-shadow,#ffffff)]'
                    }
                  `}
                >
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none" />

                  <div className="h-full flex flex-col relative z-10">
                    {/* Date Header - MASTERPIECE STYLE */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex flex-col">
                        <span className={`text-4xl font-medium leading-none tracking-tighter ${isCurrentDay ? 'text-amber-600' : 'text-slate-500'}`}>
                          {date.getDate()}
                        </span>
                        {totalCandidates > 0 && (
                          <span className="text-[12px] font-black text-slate-900 uppercase tracking-tight mt-1">
                            {totalCandidates} CAND
                          </span>
                        )}
                      </div>

                      {daySessions.length > 0 ? (
                        <div className="flex -space-x-2">
                          {Array.from({ length: Math.min(daySessions.length, 3) }).map((_, i) => (
                            <div key={i} className={`w-3 h-3 rounded-full border-2 border-[#EEF2F9] ${isCurrentDay ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                          ))}
                        </div>
                      ) : (
                        <Plus className="w-5 h-5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>

                    {/* Sessions List - GLASSMORPHIC CARDS */}
                    <div className="flex-1 flex flex-col gap-2 overflow-y-auto no-scrollbar py-1">
                      {daySessions.slice(0, 3).map((session, sIdx) => {
                        const clientColor = CLIENT_COLORS[getClientType(session.client_name)] || CLIENT_COLORS['OTHER']
                        return (
                          <motion.div
                            key={session.id || sIdx}
                            initial={{ x: -10, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: sIdx * 0.1 }}
                            className="flex-shrink-0 relative overflow-hidden rounded-xl border border-white/40 shadow-sm transition-all hover:shadow-md"
                            style={{
                              background: `linear-gradient(135deg, ${clientColor.bg} 0%, ${clientColor.tint} 100%)`,
                              borderLeft: `3px solid ${clientColor.border}`
                            }}
                          >
                            <div className="px-2 py-2.5 backdrop-blur-sm">
                              <div className="flex justify-between items-center gap-1 mb-1">
                                <span className="text-[11px] font-black uppercase tracking-tight" style={{ color: clientColor.text }}>
                                  {getShortClient(session.client_name)}
                                </span>
                                <span className="text-[10px] font-black text-slate-700">{getShortTime(session.start_time)}</span>
                              </div>
                              <p className="text-[12px] font-black text-slate-900 leading-none line-clamp-1">{getShortExam(session.exam_name)}</p>
                            </div>
                          </motion.div>
                        )
                      })}
                      {daySessions.length > 3 && (
                        <div className="text-[9px] font-black text-slate-400 py-1 text-center bg-white/30 rounded-lg border border-white/20">
                          + {daySessions.length - 3} MORE EXAMS
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tactile Highlight for Today */}
                  {isCurrentDay && (
                    <div className="absolute bottom-2 right-4 flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
                      <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest">Active</span>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Premium Neumorphic Daily Details Modal */}
      <AnimatePresence>
        {showDetailsModal && selectedDate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 backdrop-blur-xl bg-slate-900/40"
              onClick={closeModal}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-5xl bg-[var(--dashboard-bg,#EEF2F9)] rounded-[3rem] shadow-[25px_25px_50px_var(--neu-dark-shadow,#bec3c9),-25px_-25px_50px_var(--neu-light-shadow,#ffffff)] border border-white/60 overflow-hidden max-h-[90vh] flex flex-col transition-all duration-700"
            >
              {/* Premium Modal Header */}
              <div className="px-12 py-10 border-b border-slate-200 bg-white/30 backdrop-blur-md relative overflow-hidden">
                <div className="absolute right-0 top-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl -mr-32 -mt-32" />

                <div className="flex items-center justify-between relative z-10">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-2xl bg-slate-800 flex items-center justify-center text-amber-500 shadow-xl">
                        <Calendar size={20} />
                      </div>
                      <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">Daily Operations Overview</span>
                    </div>
                    <h3 className="text-4xl font-black text-slate-800 tracking-tighter uppercase leading-none">
                      {selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </h3>
                  </div>
                  <button onClick={closeModal} className="w-12 h-12 rounded-2xl bg-white shadow-lg flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors border border-slate-100">
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {/* HIGH-END STATS TILES */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
                  <div className="bg-[#EEF2F9] rounded-3xl p-6 shadow-[8px_8px_16px_#bec3c9,-8px_-8px_16px_#ffffff] border border-white/50 flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-inner">
                      <Building size={24} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Sessions</p>
                      <p className="text-2xl font-black text-slate-800">{getSessionsForDate(selectedDate).length}</p>
                    </div>
                  </div>
                  <div className="bg-[#EEF2F9] rounded-3xl p-6 shadow-[8px_8px_16px_#bec3c9,-8px_-8px_16px_#ffffff] border border-white/50 flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
                      <Users size={24} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Candidates</p>
                      <p className="text-2xl font-black text-slate-800">{getSessionsForDate(selectedDate).reduce((sum, s) => sum + s.candidate_count, 0)}</p>
                    </div>
                  </div>
                  <div className="bg-[#EEF2F9] rounded-3xl p-6 shadow-[8px_8px_16px_#bec3c9,-8px_-8px_16px_#ffffff] border border-white/50 flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-inner">
                      <Shield size={24} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Load</p>
                      <p className="text-2xl font-black text-slate-800">
                        {Math.round((getSessionsForDate(selectedDate).reduce((sum, s) => sum + s.candidate_count, 0) / (getBranchCapacity(activeBranch) * 3)) * 100)}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* TICKET-STYLE SESSION LIST */}
              <div className="flex-1 overflow-y-auto p-12 custom-scrollbar space-y-8">
                {Object.entries(getClientCounts(selectedDate)).length > 0 ? (
                  Object.entries(getClientCounts(selectedDate)).map(([client, totalCount]) => {
                    const clientSessions = getSessionsForDate(selectedDate).filter(s => s.client_name === client)
                    const clientType = getClientType(client)
                    const clientColor = CLIENT_COLORS[clientType] || CLIENT_COLORS['OTHER']

                    return (
                      <div key={client} className="space-y-4">
                        <div className="flex items-center gap-4 px-4">
                          <div className="w-2 h-8 rounded-full" style={{ backgroundColor: clientColor.border }} />
                          <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight">{client} Intelligence</h4>
                          <div className="h-px flex-1 bg-slate-200" />
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                          {clientSessions.map((session, sIdx) => (
                            <motion.div
                              key={session.id || sIdx}
                              whileHover={{ y: -5 }}
                              className="bg-[var(--dashboard-bg,#EEF2F9)] rounded-[2rem] shadow-[12px_12px_24px_var(--neu-dark-shadow,#bec3c9),-12px_-12px_24px_var(--neu-light-shadow,#ffffff)] border border-white/60 overflow-hidden flex flex-col transition-all duration-700"
                            >
                              <div className="p-8 flex-1">
                                <div className="flex justify-between items-start mb-6">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ backgroundColor: clientColor.tint, color: clientColor.text }}>
                                      <Award size={20} />
                                    </div>
                                    <div>
                                      <h5 className="font-black text-slate-800 uppercase tracking-tight leading-none">{session.exam_name}</h5>
                                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Industrial Phase Verification</p>
                                    </div>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                  <div className="bg-[#EEF2F9] rounded-2xl p-4 shadow-[inset_4px_4px_8px_#bec3c9,inset_-4px_-4px_8px_#ffffff]">
                                    <div className="flex items-center gap-2 mb-1">
                                      <Clock size={12} className="text-slate-400" />
                                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Time Slot</span>
                                    </div>
                                    <p className="text-xs font-black text-slate-700">{formatTimeRange(session.start_time, session.end_time)}</p>
                                  </div>
                                  <div className="bg-[#EEF2F9] rounded-2xl p-4 shadow-[inset_4px_4px_8px_#bec3c9,inset_-4px_-4px_8px_#ffffff]">
                                    <div className="flex items-center gap-2 mb-1">
                                      <Users size={12} className="text-slate-400" />
                                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Capacity</span>
                                    </div>
                                    <p className="text-xs font-black text-slate-700">{session.candidate_count} CAND</p>
                                  </div>
                                </div>
                              </div>

                              {/* Premium Reveal Actions */}
                              <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end gap-3 px-8">
                                <button
                                  onClick={() => openModal(selectedDate, session)}
                                  className="p-3 rounded-xl bg-[#EEF2F9] shadow-[4px_4px_8px_#bec3c9,-4px_-4px_8px_#ffffff] text-slate-600 hover:text-amber-500 transition-all border border-white active:shadow-inner"
                                >
                                  <Edit size={16} />
                                </button>
                                <button
                                  onClick={() => session.id && handleDelete(session.id)}
                                  className="p-3 rounded-xl bg-[#EEF2F9] shadow-[4px_4px_8px_#bec3c9,-4px_-4px_8px_#ffffff] text-slate-600 hover:text-rose-500 transition-all border border-white active:shadow-inner"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center py-24 opacity-60">
                    <div className="w-24 h-24 rounded-[2rem] bg-[#EEF2F9] shadow-[12px_12px_24px_#bec3c9,-12px_-12px_24px_#ffffff] flex items-center justify-center text-slate-300 mb-6">
                      <Calendar size={40} />
                    </div>
                    <p className="text-xl font-black text-slate-400 uppercase tracking-widest">No Strategic Sessions</p>
                  </div>
                )}
              </div>

              {/* Bottom Action Deck */}
              <div className="p-10 border-t border-slate-200 bg-white/30 backdrop-blur-md flex justify-center">
                <button
                  onClick={() => openModal(selectedDate)}
                  className="px-12 py-5 rounded-2xl bg-slate-800 text-white font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-black hover:scale-105 transition-all text-xs flex items-center gap-4"
                >
                  <Plus size={18} /> Add Strategic Session
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Premium Apple-style Add/Edit Session Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div
            className="absolute inset-0 backdrop-blur-2xl bg-black/40"
            onClick={closeModal}
          />

          <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            {/* Premium Modal Header */}
            <div className="px-8 py-6 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {editingSession ? 'Edit Session' : 'Create session'}
                  </h3>
                  <p className="text-gray-600">
                    {editingSession ? 'Update session information' : 'Add a new session to the calendar'}
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="h-6 w-6 text-gray-700" />
                </button>
              </div>
            </div>

            {/* Premium Form */}
            <form onSubmit={handleSubmit} className="p-8">
              <div className="space-y-8">
                {/* Client and Exam Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-800 tracking-wide uppercase mb-3">
                      Client Name
                    </label>
                    <select
                      value={formData.client_name}
                      onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                      required
                      className="w-full px-6 py-4 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-200 focus:border-gray-400 outline-none font-medium transition-colors duration-200 shadow-none"
                    >
                      <option value="">Select Client</option>
                      <option value="PEARSON">PEARSON</option>
                      <option value="VUE">VUE</option>
                      <option value="ETS">ETS</option>
                      <option value="PSI">PSI</option>
                      <option value="PROMETRIC">PROMETRIC</option>
                      <option value="OTHER">OTHER</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-800 tracking-wide uppercase mb-3">
                      Exam Name
                    </label>
                    <input
                      type="text"
                      value={formData.exam_name}
                      onChange={(e) => setFormData({ ...formData, exam_name: e.target.value })}
                      required
                      className="w-full px-6 py-4 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-200 focus:border-gray-400 outline-none font-medium transition-colors duration-200 shadow-none"
                      placeholder="Enter exam name"
                    />
                  </div>
                </div>

                {/* Date and Count */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-800 tracking-wide uppercase mb-3">
                      Date
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                      className="w-full px-6 py-4 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-200 focus:border-gray-400 outline-none font-medium transition-colors duration-200 shadow-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-800 tracking-wide uppercase mb-3">
                      Candidate Count
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="80"
                      value={formData.candidate_count}
                      onChange={(e) => setFormData({ ...formData, candidate_count: parseInt(e.target.value) || 1 })}
                      required
                      className="w-full px-6 py-4 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-200 focus:border-gray-400 outline-none font-medium transition-colors duration-200 shadow-none"
                    />
                  </div>
                </div>

                {/* Time Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-800 tracking-wide uppercase mb-3">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                      required
                      className="w-full px-6 py-4 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-200 focus:border-gray-400 outline-none font-medium transition-colors duration-200 shadow-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-800 tracking-wide uppercase mb-3">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                      required
                      className="w-full px-6 py-4 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-200 focus:border-gray-400 outline-none font-medium transition-colors duration-200 shadow-none"
                    />
                  </div>
                </div>

                {/* Capacity Information Card */}
                <div className="bg-white p-8 rounded-2xl border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-gray-800 text-lg mb-2 flex items-center">
                        <Users className="h-6 w-6 mr-3" />
                        Capacity Information
                      </h4>
                      <p className="text-gray-600 font-medium">Maximum capacity: 80 candidates per session</p>
                      <p className="text-gray-600 text-sm mt-1">Current session: {formData.candidate_count} candidates</p>
                    </div>
                    <div className="text-center bg-white rounded-2xl px-6 py-4 border border-blue-200/50 shadow-lg">
                      <div className="text-gray-800 text-sm font-medium mb-1">Seats Remaining</div>
                      <div className={`text-4xl font-bold ${getRemainingSeats(formData.candidate_count) > 20 ? 'text-green-600' :
                        getRemainingSeats(formData.candidate_count) > 10 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                        {getRemainingSeats(formData.candidate_count)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-4 pt-6">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-xl transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-gray-900 hover:bg-black text-white font-semibold rounded-xl transition-colors duration-200 flex items-center justify-center"
                  >
                    {editingSession ? (
                      <>
                        <Edit className="h-5 w-5 mr-3" />
                        Update Session
                      </>
                    ) : (
                      <>
                        <Plus className="h-5 w-5 mr-3" />
                        Create Session
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
