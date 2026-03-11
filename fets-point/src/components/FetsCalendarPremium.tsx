import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Calendar, Plus, ChevronLeft, ChevronRight, Edit, Trash2, X, Check, Clock, Users, Eye, MapPin, Building, Filter, TrendingUp, Target, Award, Shield, Activity } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { CalendarAnalysis } from './CalendarAnalysis'
import { useAuth } from '../hooks/useAuth'
import { useBranch } from '../hooks/useBranch'
import { useBranchFilter } from '../hooks/useBranchFilter'
import { formatDateForIST, getCurrentISTDateString, isToday as isTodayIST, formatDateForDisplay } from '../utils/dateUtils'
import { validateSessionCapacity, getCapacityStatusColor, formatCapacityDisplay, getBranchCapacity } from '../utils/sessionUtils'
import { useCalendarSessions, useSessionMutations } from '../hooks/useCalendarSessions'
import { useClients, useClientExams } from '../hooks/useClients'
import { toast } from 'react-hot-toast'

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
  branch_location?: string
}

// Refined pastel color system for clients - light, distinctive, easy on eyes
const CLIENT_COLORS: Record<string, { bg: string; text: string; border: string; dot: string; badge: string; badgeText: string }> = {
  'PEARSON': { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE', dot: '#3B82F6', badge: '#DBEAFE', badgeText: '#1E40AF' },
  'PSI': { bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0', dot: '#22C55E', badge: '#DCFCE7', badgeText: '#166534' },
  'ITTS': { bg: '#FFFBEB', text: '#B45309', border: '#FDE68A', dot: '#F59E0B', badge: '#FEF3C7', badgeText: '#92400E' },
  'PROMETRIC': { bg: '#FFF1F2', text: '#BE123C', border: '#FECDD3', dot: '#F43F5E', badge: '#FFE4E6', badgeText: '#9F1239' },
  'CELPIP': { bg: '#FDF4FF', text: '#9333EA', border: '#E9D5FF', dot: '#A855F7', badge: '#F3E8FF', badgeText: '#7E22CE' },
  'CMA': { bg: '#ECFDF5', text: '#047857', border: '#A7F3D0', dot: '#10B981', badge: '#D1FAE5', badgeText: '#065F46' },
  'OTHER': { bg: '#F8FAFC', text: '#475569', border: '#E2E8F0', dot: '#64748B', badge: '#F1F5F9', badgeText: '#334155' },
}

type ClientType = keyof typeof CLIENT_COLORS

export function FetsCalendarPremium() {
  const { user, hasPermission, profile } = useAuth()
  const canEdit = hasPermission('calendar_edit')
  const { activeBranch } = useBranch()
  const { applyFilter, isGlobalView } = useBranchFilter()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [locationFilter, setLocationFilter] = useState(activeBranch || 'all')

  useEffect(() => {
    setLocationFilter(activeBranch || 'all')
  }, [activeBranch])

  const sessionBranch = locationFilter === 'all' ? 'global' : locationFilter
  const { data: sessions = [], isLoading: loading, isError, error } = useCalendarSessions(currentDate, sessionBranch as any, applyFilter, isGlobalView)

  const { data: dbClients = [] } = useClients()
  const { data: dbExams = [] } = useClientExams()

  const { addSession, updateSession, deleteSession, isMutating } = useSessionMutations()
  const [showModal, setShowModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showAnalysis, setShowAnalysis] = useState(false)
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
    for (let i = 0; i < startingDayOfWeek; i++) days.push(null)
    for (let day = 1; day <= daysInMonth; day++) days.push(new Date(year, month, day))
    return days
  }, [currentDate])

  const getSessionsForDate = (date: Date) => {
    const dateStr = formatDateForIST(date)
    return sessions.filter(session => session.date === dateStr)
  }

  const normalizeClientName = (name: string): string => {
    const upper = name.toUpperCase()
    if (upper.includes('PEARSON') || upper.includes('VUE')) return 'PEARSON'
    if (upper.includes('CELPIP')) return 'CELPIP'
    if (upper.includes('CMA')) return 'CMA'
    if (upper.includes('PROMETRIC')) return 'PROMETRIC'
    if (upper.includes('PSI')) return 'PSI'
    if (upper.includes('ITTS')) return 'ITTS'
    return upper
  }

  const getClientAggregates = (date: Date) => {
    const daySessions = getSessionsForDate(date)
    const aggregates: { [key: string]: { candidates: number, sessions: number, displayName: string } } = {}
    daySessions.forEach(session => {
      const normalizedKey = normalizeClientName(session.client_name)
      if (!aggregates[normalizedKey]) {
        aggregates[normalizedKey] = { candidates: 0, sessions: 0, displayName: session.client_name }
      }
      aggregates[normalizedKey].candidates += session.candidate_count
      aggregates[normalizedKey].sessions += 1
    })
    return aggregates
  }

  const getClientType = (clientName: string): ClientType => {
    const normalized = normalizeClientName(clientName)
    if (normalized in CLIENT_COLORS) return normalized as ClientType
    return 'OTHER'
  }

  const getShortClient = (name: string) => {
    const n = name.toUpperCase()
    if (n.includes('PEARSON')) return 'PV'
    if (n.includes('PROMETRIC')) return 'PRO'
    if (n.includes('VUE')) return 'VUE'
    if (n.includes('PSI')) return 'PSI'
    if (n.includes('ITTS')) return 'ITTS'
    if (n.includes('CELPIP')) return 'CEL'
    if (n.includes('CMA')) return 'CMA'
    return n.slice(0, 3)
  }

  const formatTimeRange = (startTime: string, endTime: string) => {
    const formatTime = (time: string) => {
      const [hours, minutes] = time.split(':')
      const hour = parseInt(hours)
      const ampm = hour >= 12 ? 'pm' : 'am'
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
      return `${displayHour}:${minutes}${ampm}`
    }
    return `${formatTime(startTime)} – ${formatTime(endTime)}`
  }

  const getShortTime = (time: string) => {
    const [h] = time.split(':')
    const hour = parseInt(h)
    const suffix = hour >= 12 ? 'p' : 'a'
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
    return `${displayHour}${suffix}`
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
      setFormData({ client_name: '', exam_name: '', date: dateStr, candidate_count: 1, start_time: '09:00', end_time: '17:00' })
    }
    setShowModal(true)
  }

  const openDetailsModal = (date: Date) => {
    const daySessions = getSessionsForDate(date)
    if (daySessions.length > 0) {
      setSelectedDate(date)
      setShowDetailsModal(true)
    } else if (canEdit) {
      openModal(date)
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setShowDetailsModal(false)
    setEditingSession(null)
    setSelectedDate(null)
    setFormData({ client_name: '', exam_name: '', date: '', candidate_count: 1, start_time: '09:00', end_time: '17:00' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    const capacityValidation = validateSessionCapacity(formData.candidate_count, activeBranch)
    if (!capacityValidation.isValid) { toast.error(capacityValidation.error!); return }
    if (capacityValidation.warning) toast(capacityValidation.warning, { icon: '⚠️' })

    try {
      if (activeBranch === 'global') {
        toast.error('Please select a centre to add or edit sessions.')
        return
      }
      const sessionData: Omit<Session, 'id'> & { created_at?: string } = {
        ...formData, user_id: user.id, updated_at: new Date().toISOString(), branch_location: activeBranch
      }
      if (editingSession && editingSession.id) {
        await updateSession({ ...sessionData, id: editingSession.id })
      } else {
        await addSession({ ...sessionData, created_at: new Date().toISOString() })
      }
      closeModal()
    } catch (error) {
      console.error('Error saving session:', error)
    }
  }

  const handleDelete = async (sessionId: number) => {
    if (!confirm('Are you sure you want to delete this session?')) return
    await deleteSession(sessionId)
    if (selectedDate) {
      const remainingSessions = sessions.filter(s => s.date === formatDateForIST(selectedDate) && s.id !== sessionId)
      if (remainingSessions.length === 0) setShowDetailsModal(false)
    }
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    if (direction === 'prev') newDate.setMonth(newDate.getMonth() - 1)
    else newDate.setMonth(newDate.getMonth() + 1)
    setCurrentDate(newDate)
  }

  const monthYear = currentDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' })
  const days = useMemo(() => getDaysInMonth(), [getDaysInMonth])
  const isToday = (date: Date | null) => { if (!date) return false; return isTodayIST(date) }

  // Monthly stats
  const monthlyStats = useMemo(() => {
    const total = sessions.reduce((sum, s) => sum + s.candidate_count, 0)
    const totalSessions = sessions.length
    const uniqueClients = new Set(sessions.map(s => normalizeClientName(s.client_name))).size
    return { total, totalSessions, uniqueClients }
  }, [sessions])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FAFBFD]">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-slate-200"></div>
            <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-amber-500 border-t-transparent absolute inset-0"></div>
          </div>
          <p className="text-slate-500 text-sm font-medium">Loading calendar...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFBFD]" style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-6">

        {/* ── HEADER ── */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">
              Exam Calendar
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">
              {activeBranch && activeBranch !== 'global' ? `${activeBranch.charAt(0).toUpperCase() + activeBranch.slice(1)} Centre` : 'All Centres'} · {monthYear}
            </p>
          </div>

          {/* Monthly Summary Pills */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold">
              <Users size={13} /> {monthlyStats.total} candidates
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-xs font-bold">
              <Calendar size={13} /> {monthlyStats.totalSessions} sessions
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold">
              <Building size={13} /> {monthlyStats.uniqueClients} clients
            </div>
          </div>
        </div>

        {/* ── TOOLBAR ── */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5 bg-white rounded-xl border border-slate-100 shadow-sm px-4 py-3">
          <div className="flex items-center gap-3">
            {/* Month Navigation */}
            <div className="flex items-center bg-slate-50 rounded-lg border border-slate-100">
              <button onClick={() => navigateMonth('prev')} className="p-2 hover:bg-slate-100 rounded-l-lg transition-colors" title="Previous">
                <ChevronLeft size={18} className="text-slate-500" />
              </button>
              <span className="px-4 text-sm font-bold text-slate-700 min-w-[150px] text-center">{monthYear}</span>
              <button onClick={() => navigateMonth('next')} className="p-2 hover:bg-slate-100 rounded-r-lg transition-colors" title="Next">
                <ChevronRight size={18} className="text-slate-500" />
              </button>
            </div>
            <button onClick={() => setCurrentDate(new Date())} className="px-3 py-2 text-xs font-bold text-slate-500 bg-slate-50 border border-slate-100 rounded-lg hover:bg-slate-100 transition-colors">Today</button>

            {/* Location */}
            <div className="flex items-center px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg">
              <MapPin size={14} className="text-amber-500 mr-2" />
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="bg-transparent border-none outline-none text-xs font-bold text-slate-600 cursor-pointer"
              >
                <option value="all">All Locations</option>
                <option value="calicut">Calicut</option>
                <option value="cochin">Cochin</option>
                <option value="kannur">Kannur</option>
                <option value="global">Global</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setShowAnalysis(true)} className="px-3 py-2 text-xs font-bold text-slate-600 bg-slate-50 border border-slate-100 rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-1.5">
              <TrendingUp size={14} className="text-amber-500" /> Analysis
            </button>
            <button
              onClick={() => openModal()}
              disabled={!canEdit}
              className="px-4 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-lg shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-40"
            >
              <Plus size={14} /> Add Session
            </button>
          </div>
        </div>

        {/* ── CLIENT LEGEND ── */}
        <div className="flex items-center gap-2 mb-4 flex-wrap px-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Clients:</span>
          {Object.entries(CLIENT_COLORS).filter(([k]) => k !== 'OTHER').map(([key, c]) => (
            <div key={key} className="flex items-center gap-1.5 px-2 py-1 rounded-md" style={{ backgroundColor: c.badge }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.dot }} />
              <span className="text-[10px] font-bold" style={{ color: c.badgeText }}>{key}</span>
            </div>
          ))}
        </div>

        {/* ── CALENDAR GRID ── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
              <div key={day} className={`py-3 text-center text-[11px] font-bold uppercase tracking-wider ${i === 0 || i === 6 ? 'text-slate-300' : 'text-slate-400'}`}>
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7">
            {days.map((date, index) => {
              if (!date) {
                return <div key={index} className="min-h-[120px] bg-slate-50/30 border-b border-r border-slate-50" />
              }

              const daySessions = getSessionsForDate(date)
              const clientAggregates = getClientAggregates(date)
              const isCurrentDay = isToday(date)
              const isWeekend = date.getDay() === 0 || date.getDay() === 6
              const totalCandidates = daySessions.reduce((sum, s) => sum + s.candidate_count, 0)
              const entries = Object.entries(clientAggregates)

              return (
                <div
                  key={index}
                  onClick={() => openDetailsModal(date)}
                  className={`
                    min-h-[120px] p-2 border-b border-r border-slate-100 cursor-pointer transition-all duration-200 relative group
                    ${isCurrentDay ? 'bg-amber-50/60 ring-1 ring-inset ring-amber-200' : isWeekend ? 'bg-slate-50/40' : 'bg-white hover:bg-blue-50/30'}
                  `}
                >
                  {/* Date Number */}
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-sm font-bold leading-none ${isCurrentDay ? 'w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs' : isWeekend ? 'text-slate-300' : 'text-slate-500'}`}>
                      {date.getDate()}
                    </span>
                    {totalCandidates > 0 && (
                      <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${isCurrentDay ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                        {totalCandidates}
                      </span>
                    )}
                  </div>

                  {/* Session Pills */}
                  <div className="space-y-1">
                    {entries.slice(0, 3).map(([key, stat]) => {
                      const clientColor = CLIENT_COLORS[key] || CLIENT_COLORS['OTHER']
                      // Find earliest time for this client
                      const clientSessions = daySessions.filter(s => normalizeClientName(s.client_name) === key)
                      const earliestTime = clientSessions.sort((a, b) => a.start_time.localeCompare(b.start_time))[0]

                      return (
                        <div
                          key={key}
                          className="flex items-center gap-1 px-1.5 py-[3px] rounded-md border text-[10px] leading-tight transition-all"
                          style={{
                            backgroundColor: clientColor.bg,
                            borderColor: clientColor.border + '60',
                            color: clientColor.text,
                          }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: clientColor.dot }} />
                          <span className="font-bold truncate flex-1">{getShortClient(stat.displayName)}</span>
                          <span className="font-extrabold">{stat.candidates}</span>
                          <span className="text-[8px] opacity-60 hidden xl:inline">{getShortTime(earliestTime.start_time)}</span>
                        </div>
                      )
                    })}
                    {entries.length > 3 && (
                      <div className="text-[9px] text-slate-400 font-bold pl-1">+{entries.length - 3} more</div>
                    )}
                  </div>

                  {/* Hover indicator */}
                  <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Eye size={12} className="text-slate-300" />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ════════════════════ DAILY DETAILS MODAL ════════════════════ */}
      <AnimatePresence>
        {showDetailsModal && selectedDate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={closeModal} />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden max-h-[85vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-800">
                    {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs font-bold text-slate-400">{getSessionsForDate(selectedDate).length} sessions</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                    <span className="text-xs font-bold text-slate-400">{getSessionsForDate(selectedDate).reduce((s, x) => s + x.candidate_count, 0)} candidates</span>
                  </div>
                </div>
                <button onClick={closeModal} className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-200 transition-colors shadow-sm">
                  <X size={16} />
                </button>
              </div>

              {/* Sessions List */}
              <div className="flex-1 overflow-y-auto p-6 space-y-3">
                {getSessionsForDate(selectedDate).length > 0 ? (
                  getSessionsForDate(selectedDate)
                    .sort((a, b) => a.start_time.localeCompare(b.start_time))
                    .map((session, idx) => {
                      const clientType = getClientType(session.client_name)
                      const c = CLIENT_COLORS[clientType]
                      return (
                        <div key={session.id || idx} className="rounded-xl border overflow-hidden transition-all hover:shadow-md" style={{ borderColor: c.border }}>
                          <div className="flex items-stretch">
                            {/* Color bar */}
                            <div className="w-1.5 shrink-0" style={{ backgroundColor: c.dot }} />

                            <div className="flex-1 p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  {/* Client badge */}
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: c.badge, color: c.badgeText }}>
                                      {session.client_name}
                                    </span>
                                  </div>
                                  {/* Exam name */}
                                  <h4 className="text-sm font-bold text-slate-800 leading-snug">{session.exam_name}</h4>
                                </div>

                                {/* Candidate count */}
                                <div className="text-right shrink-0">
                                  <div className="text-2xl font-extrabold" style={{ color: c.text }}>{session.candidate_count}</div>
                                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">candidates</div>
                                </div>
                              </div>

                              {/* Time & Meta */}
                              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100">
                                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                  <Clock size={13} className="text-amber-500" />
                                  <span className="font-semibold">{formatTimeRange(session.start_time, session.end_time)}</span>
                                </div>
                                {session.branch_location && (
                                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                    <MapPin size={13} className="text-slate-400" />
                                    <span className="font-semibold capitalize">{session.branch_location}</span>
                                  </div>
                                )}

                                {canEdit && (
                                  <div className="ml-auto flex items-center gap-1">
                                    <button onClick={() => openModal(selectedDate, session)} className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors" title="Edit">
                                      <Edit size={14} />
                                    </button>
                                    <button onClick={() => session.id && handleDelete(session.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Delete">
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-300">
                    <Calendar size={40} className="mb-3" />
                    <p className="text-sm font-bold">No sessions scheduled</p>
                  </div>
                )}
              </div>

              {/* Bottom action */}
              {canEdit && (
                <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-center">
                  <button onClick={() => openModal(selectedDate!)} className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-2">
                    <Plus size={14} /> Add Session
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ════════════════════ ADD/EDIT SESSION MODAL ════════════════════ */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-slate-800">{editingSession ? 'Edit Session' : 'New Session'}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{editingSession ? 'Update session details' : 'Schedule a new exam session'}</p>
              </div>
              <button onClick={closeModal} className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Client</label>
                    <select
                      value={formData.client_name}
                      onChange={(e) => setFormData({ ...formData, client_name: e.target.value, exam_name: '' })}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:ring-2 focus:ring-amber-300 focus:border-transparent outline-none"
                      required
                    >
                      <option value="">Select Client</option>
                      {dbClients.length > 0 ? (
                        dbClients.map(client => <option key={client.id} value={client.name}>{client.name}</option>)
                      ) : (
                        Object.keys(CLIENT_COLORS).filter(k => k !== 'OTHER').map(client => <option key={client} value={client}>{client}</option>)
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Exam</label>
                    {(() => {
                      const selectedClient = dbClients.find(c => c.name === formData.client_name)
                      const clientExams = selectedClient ? dbExams.filter(e => e.client_id === selectedClient.id) : []
                      return clientExams.length > 0 ? (
                        <select value={formData.exam_name} onChange={(e) => setFormData({ ...formData, exam_name: e.target.value })}
                          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:ring-2 focus:ring-amber-300 focus:border-transparent outline-none" required>
                          <option value="">Select Exam</option>
                          {clientExams.map(exam => <option key={exam.id} value={exam.name}>{exam.name}</option>)}
                        </select>
                      ) : (
                        <input type="text" value={formData.exam_name} onChange={(e) => setFormData({ ...formData, exam_name: e.target.value })}
                          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:ring-2 focus:ring-amber-300 focus:border-transparent outline-none" placeholder="e.g., CMA US Exam" required />
                      )
                    })()}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Date</label>
                    <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:ring-2 focus:ring-amber-300 focus:border-transparent outline-none" required />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Candidates</label>
                    <input type="number" value={formData.candidate_count} onChange={(e) => setFormData({ ...formData, candidate_count: parseInt(e.target.value) })}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:ring-2 focus:ring-amber-300 focus:border-transparent outline-none" min="1" required />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Start Time</label>
                    <input type="time" value={formData.start_time} onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:ring-2 focus:ring-amber-300 focus:border-transparent outline-none" required />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">End Time</label>
                    <input type="time" value={formData.end_time} onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:ring-2 focus:ring-amber-300 focus:border-transparent outline-none" required />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-5 border-t border-slate-100">
                <button type="button" onClick={closeModal} className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold text-sm rounded-lg hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isMutating}
                  className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-sm rounded-lg shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {isMutating ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
                  ) : editingSession ? 'Update Session' : 'Create Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Analysis Modal */}
      <AnimatePresence>
        {showAnalysis && (
          <CalendarAnalysis onClose={() => setShowAnalysis(false)} activeBranch={activeBranch} />
        )}
      </AnimatePresence>
    </div>
  )
}

export default FetsCalendarPremium
