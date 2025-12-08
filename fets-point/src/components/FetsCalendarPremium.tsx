import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Calendar, Plus, ChevronLeft, ChevronRight, Edit, Trash2, X, Check, Clock, Users, Eye, MapPin, Building, Filter } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import { useBranch } from '../hooks/useBranch'
import { useBranchFilter } from '../hooks/useBranchFilter'
import { formatDateForIST, getCurrentISTDateString, isToday as isTodayIST, formatDateForDisplay } from '../utils/dateUtils'
import { validateSessionCapacity, getCapacityStatusColor, formatCapacityDisplay, getBranchCapacity } from '../utils/sessionUtils'
import { useCalendarSessions, useSessionMutations } from '../hooks/useCalendarSessions'
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
  branch_location?: 'calicut' | 'cochin'
}

const CLIENT_COLORS = {
  'PEARSON': { bg: '#F8FAFC', text: '#111827', border: '#007AFF', tint: '#EFF6FF' },
  'VUE': { bg: '#F8FAFC', text: '#111827', border: '#34C759', tint: '#ECFDF5' },
  'ETS': { bg: '#F8FAFC', text: '#111827', border: '#FF9500', tint: '#FFF7ED' },
  'PSI': { bg: '#F8FAFC', text: '#111827', border: '#AF52DE', tint: '#F5F3FF' },
  'PROMETRIC': { bg: '#F8FAFC', text: '#111827', border: '#FF3B30', tint: '#FEF2F2' },
  'OTHER': { bg: '#F8FAFC', text: '#111827', border: '#8E8E93', tint: '#F3F4F6' }
}

const CENTRE_COLORS = {
  'calicut': { primary: '#FFFFFF', secondary: '#F1F5F9', light: '#FFFFFF', accent: '#E5E7EB', shadow: 'rgba(0,0,0,0.06)', glass: 'rgba(255,255,255,0.6)' },
  'cochin': { primary: '#FFFFFF', secondary: '#F1F5F9', light: '#FFFFFF', accent: '#E5E7EB', shadow: 'rgba(0,0,0,0.06)', glass: 'rgba(255,255,255,0.6)' },
  'global': { primary: '#FFFFFF', secondary: '#F1F5F9', light: '#FFFFFF', accent: '#E5E7EB', shadow: 'rgba(0,0,0,0.06)', glass: 'rgba(255,255,255,0.6)' }
}

type ClientType = keyof typeof CLIENT_COLORS

export function FetsCalendarPremium() {
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

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }

    return days
  }, [currentDate])

  const getSessionsForDate = (date: Date) => {
    const dateStr = formatDateForIST(date)
    return sessions.filter(session => session.date === dateStr)
  }

  const normalizeClientName = (name: string): string => {
    const upper = name.toUpperCase()
    if (upper.includes('PEARSON') || upper.includes('VUE')) return 'PEARSON'
    if (upper.includes('ETS') || upper.includes('TOEFL') || upper.includes('GRE')) return 'ETS'
    if (upper.includes('PROMETRIC')) return 'PROMETRIC'
    if (upper.includes('PSI')) return 'PSI'
    return upper
  }

  const getClientAggregates = (date: Date) => {
    const daySessions = getSessionsForDate(date)
    const aggregates: { [key: string]: { candidates: number, sessions: number, displayName: string } } = {}

    daySessions.forEach(session => {
      const normalizedKey = normalizeClientName(session.client_name)
      if (!aggregates[normalizedKey]) {
        aggregates[normalizedKey] = {
          candidates: 0,
          sessions: 0,
          displayName: session.client_name
        }
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

  const getClientLogo = (clientName: string) => {
    const upperName = clientName.toUpperCase()
    if (upperName.includes('PROMETRIC')) return '/client-logos/prometric.png'
    if (upperName.includes('ETS') || upperName.includes('TOEFL') || upperName.includes('GRE')) return '/client-logos/ets.png'
    if (upperName.includes('PEARSON') || upperName.includes('VUE')) return '/client-logos/pearson.png'
    if (upperName.includes('PSI')) return '/client-logos/psi.png'
    return null
  }

  const getRemainingSeats = (candidateCount: number) => {
    const maxCapacity = getBranchCapacity(activeBranch)
    return Math.max(0, maxCapacity - candidateCount)
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

    const capacityValidation = validateSessionCapacity(formData.candidate_count, activeBranch)

    if (!capacityValidation.isValid) {
      toast.error(capacityValidation.error!)
      return
    }

    if (capacityValidation.warning) {
      toast(capacityValidation.warning, { icon: '⚠️' })
    }

    try {
      if (activeBranch === 'global') {
        toast.error('Please select a centre (Calicut or Cochin) to add or edit sessions.')
        return
      }

      const sessionData: Omit<Session, 'id'> & { created_at?: string } = {
        ...formData,
        user_id: user.id,
        updated_at: new Date().toISOString(),
        branch_location: activeBranch
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
    return getDaysInMonth()
  }, [getDaysInMonth])

  const isToday = (date: Date | null) => {
    if (!date) return false
    return isTodayIST(date)
  }

  const currentTheme = CENTRE_COLORS[activeBranch] || CENTRE_COLORS['global']

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F0F4F8]">
        <div className="bg-white/80 backdrop-blur-xl p-8 rounded-2xl shadow-xl border border-white/50 flex flex-col items-center space-y-6">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200"></div>
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-500 border-t-transparent absolute inset-0"></div>
          </div>
          <div className="text-center">
            <p className="text-slate-800 font-bold text-lg mb-1 font-rajdhani">Loading Calendar</p>
            <p className="text-slate-500 text-sm">Fetching latest sessions...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen -mt-32 pt-48 bg-[#e0e5ec]" style={{ fontFamily: "'Montserrat', sans-serif" }}>

      {/* Functional Notification Banner */}
      <div className="h-6 -mx-8 -mt-12 mb-8"></div>

      <div className="max-w-[1800px] mx-auto px-6">
        {/* Executive Header - Neumorphic */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4"
        >
          <div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gold-gradient mb-2 uppercase">
              FETS Calendar
            </h1>
            <p className="text-lg text-gray-600 font-medium">
              {activeBranch?.name ? `${activeBranch.name} · ` : ''}Session Planning & Overview
            </p>
          </div>
          <div className="text-right">
            <p className="text-gray-500 font-semibold uppercase tracking-wider text-sm">
              {new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </motion.div>

        {/* Control Toolbar - Neumorphic */}
        <div className="neomorphic-card p-4 mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            {/* Month Navigation */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigateMonth('prev')}
                className="neomorphic-btn-icon"
                title="Previous month"
              >
                <ChevronLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div className="text-xl font-bold text-gray-700 min-w-[200px] text-center">
                {monthYear}
              </div>
              <button
                onClick={() => navigateMonth('next')}
                className="neomorphic-btn-icon"
                title="Next month"
              >
                <ChevronRight className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-semibold rounded-lg shadow-sm hover:bg-slate-50 transition-colors text-sm"
            >
              Today
            </button>
          </div>

          <div className="flex items-center space-x-4">
            {/* Add Session Button */}
            <button
              onClick={() => openModal()}
              className="px-5 py-2.5 bg-gradient-to-r from-slate-800 to-slate-900 text-white flex items-center space-x-2 font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
            >
              <Plus className="h-4 w-4" />
              <span>Add Session</span>
            </button>
          </div>
        </div>

        {/* Main Grid Conatiner - Clean & Premium */}
        <div className="bg-[#F0F4F8] rounded-3xl p-6 min-h-[600px]">
          {/* Day Headers */}
          <div className="grid grid-cols-7 mb-4">
            {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, index) => (
              <div key={day} className="text-center">
                <div className="font-bold text-slate-500 text-xs uppercase tracking-widest mb-1">{day.substring(0, 3)}</div>
              </div>
            ))}
          </div>

          {/* Calendar Days Grid */}
          <div className="grid grid-cols-7 gap-3">
            {days.map((date, index) => {
              if (!date) {
                return (
                  <div key={index} className="h-40 rounded-2xl bg-slate-100/50 border border-transparent"></div>
                )
              }

              const daySessions = getSessionsForDate(date)
              const clientAggregates = getClientAggregates(date)
              const isCurrentDay = isToday(date)
              const hasEvents = Object.keys(clientAggregates).length > 0

              // Neumorphic / Premium Card Style
              return (
                <div
                  key={index}
                  onClick={() => openDetailsModal(date)}
                  className={`h-48 p-3 flex flex-col justify-between cursor-pointer transition-all duration-300 rounded-2xl border ${isCurrentDay
                    ? 'bg-white border-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.2)] ring-1 ring-amber-400'
                    : hasEvents
                      ? 'bg-white border-white shadow-[-5px_-5px_10px_rgba(255,255,255,0.8),5px_5px_10px_rgba(209,213,219,0.5)] hover:transform hover:scale-[1.02]'
                      : 'bg-[#F0F4F8] border-transparent hover:bg-white hover:border-slate-100 hover:shadow-sm'
                    }`}
                >
                  <div className="w-full">
                    {/* Date Number */}
                    <div className="flex items-center justify-between mb-2">
                      <div className={`text-lg font-bold font-rajdhani transition-colors ${isCurrentDay
                        ? 'text-amber-600'
                        : date.getMonth() === currentDate.getMonth()
                          ? 'text-slate-700'
                          : 'text-slate-400'
                        }`}>
                        {date.getDate()}
                      </div>
                      {isCurrentDay && <div className="w-2 h-2 bg-amber-500 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.6)]"></div>}
                      {hasEvents && !isCurrentDay && (<div className="w-2 h-2 bg-slate-400 rounded-full"></div>)}
                    </div>

                    {/* Session Indicators - Logos */}
                    <div className="mt-1 space-y-1 overflow-hidden flex flex-col items-center flex-1 w-full justify-start">
                      {Object.entries(clientAggregates).slice(0, 2).map(([key, stat]) => {
                        const logoSrc = getClientLogo(key)
                        // Use key (normalized) to look up colors to be safe
                        const clientColor = CLIENT_COLORS[key as ClientType] || CLIENT_COLORS['OTHER']

                        if (logoSrc) {
                          return (
                            <div key={key} className="w-full relative flex items-center justify-between p-2 rounded-xl bg-white/60 border border-slate-200/60 shadow-sm transition-all hover:bg-white hover:shadow-md group" title={`${stat.displayName}: ${stat.candidates} candidates in ${stat.sessions} sessions`}>
                              {/* Logo Area */}
                              <div className="flex-1 flex justify-center items-center h-8 px-1">
                                <img src={logoSrc} alt={stat.displayName} className="h-full w-auto object-contain mix-blend-multiply opacity-90 group-hover:opacity-100 transition-opacity" />
                              </div>

                              {/* Stats Badge */}
                              <div className="flex flex-col items-end space-y-0.5 min-w-[36px]">
                                <div className="text-[11px] font-bold text-slate-700 leading-none">
                                  {stat.candidates}
                                </div>
                                {stat.sessions > 1 && (
                                  <div className="text-[8px] font-semibold text-amber-600 bg-amber-50 px-1 py-0.5 rounded border border-amber-100 leading-none whitespace-nowrap">
                                    {stat.sessions} Sessions
                                  </div>
                                )}
                                {stat.sessions === 1 && (
                                  <div className="text-[8px] font-medium text-slate-400 leading-none">
                                    Cands.
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        }

                        // Fallback for non-logo clients
                        return (
                          <div
                            key={key}
                            className="w-full text-[10px] rounded-lg px-2 py-1.5 font-semibold truncate flex items-center justify-between shadow-sm border border-slate-100 group transition-all hover:shadow-md"
                            style={{ background: clientColor.bg, color: clientColor.text }}
                            title={`${stat.displayName}: ${stat.candidates} candidates`}
                          >
                            <span className="truncate opacity-90 font-bold">{stat.displayName.toUpperCase()}</span>
                            <div className="flex items-center space-x-1">
                              {stat.sessions > 1 && <span className="text-[9px] font-bold bg-black/5 px-1 rounded text-current opacity-80">{stat.sessions}</span>}
                              <span className={`ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${stat.sessions > 1 ? 'bg-white shadow-sm' : ''}`}>{stat.candidates}</span>
                            </div>
                          </div>
                        )
                      })}

                      {Object.keys(clientAggregates).length > 2 && (
                        <div className="text-[9px] text-slate-400 font-bold px-1 pt-1 flex items-center justify-center bg-slate-50/50 rounded-full py-0.5">
                          +{Object.keys(clientAggregates).length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Session Details Modal */}
      {showDetailsModal && selectedDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={closeModal} />

          <div className="relative w-full max-w-6xl bg-white rounded-3xl shadow-2xl max-h-[85vh] overflow-y-auto border border-white/50">
            <div className="px-8 py-6 border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur-sm z-10 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold font-rajdhani text-slate-800 flex items-center mb-1">
                  <Calendar className="h-6 w-6 mr-3 text-amber-500" />
                  {selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </h3>
                <div className="flex items-center space-x-6 text-slate-500 text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <Building className="h-4 w-4" />
                    <span>{getSessionsForDate(selectedDate).length} Sessions</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4" />
                    <span>{getSessionsForDate(selectedDate).reduce((sum, s) => sum + s.candidate_count, 0)} Total Candidates</span>
                  </div>
                </div>
              </div>
              <button onClick={closeModal} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X className="h-6 w-6 text-slate-400 hover:text-slate-600" />
              </button>
            </div>

            {/* Client Sessions Display */}
            <div className="p-8 bg-slate-50/50 min-h-[400px]">
              {Object.keys(getClientAggregates(selectedDate)).length > 0 ? (
                <div className="space-y-8">
                  {Object.entries(getClientAggregates(selectedDate)).map(([key, stat]) => {
                    // key is normalized
                    const clientSessions = getSessionsForDate(selectedDate).filter(s => normalizeClientName(s.client_name) === key)
                    const clientType = getClientType(stat.displayName)
                    const clientColor = CLIENT_COLORS[clientType] || CLIENT_COLORS['OTHER']
                    const totalCount = stat.candidates
                    const remainingSeats = getRemainingSeats(totalCount)

                    return (
                      <div key={key} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        {/* Client Header */}
                        <div
                          className="p-5 relative border-b border-slate-50"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className={`h-10 w-1 rounded-full`} style={{ background: clientColor.border }}></div>
                              <div>
                                <h4 className="text-xl font-bold text-slate-800">{stat.displayName}</h4>
                                <p className="text-sm text-slate-500">{clientSessions.length} Sessions · {totalCount} Candidates</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Seats Available</div>
                              <div className={`text-xl font-bold ${remainingSeats > 20 ? 'text-emerald-500' : remainingSeats > 10 ? 'text-amber-500' : 'text-rose-500'}`}>
                                {remainingSeats}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Client Sessions */}
                        <div className="p-6 bg-slate-50/30">
                          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {clientSessions.map(session => (
                              <div key={session.id} className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-5 hover:shadow-md transition-all duration-300 group">
                                <div className="flex items-start justify-between mb-4">
                                  <div className="flex-1">
                                    <h5 className="font-bold text-slate-800 font-rajdhani text-lg mb-2 line-clamp-2">{session.exam_name}</h5>
                                    <div className="space-y-2 text-sm text-slate-600">
                                      <div className="flex items-center">
                                        <Clock className="h-3.5 w-3.5 mr-2 text-slate-400" />
                                        <span>{formatTimeRange(session.start_time, session.end_time)}</span>
                                      </div>
                                      <div className="flex items-center">
                                        <Users className="h-3.5 w-3.5 mr-2 text-slate-400" />
                                        <span>{session.candidate_count} Candidates</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex space-x-2 pt-4 mt-2 border-t border-slate-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      openModal(selectedDate, session)
                                    }}
                                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      if (session.id) {
                                        handleDelete(session.id)
                                      }
                                    }}
                                    className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-semibold transition-colors"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-24 flex flex-col items-center justify-center opacity-60">
                  <Calendar className="h-16 w-16 text-slate-300 mb-4" />
                  <p className="text-slate-500 font-medium">No sessions scheduled for this day</p>
                </div>
              )}
            </div>

            {/* Bottom Action Bar */}
            {getSessionsForDate(selectedDate).length > 0 && (
              <div className="px-8 py-5 bg-white border-t border-gray-100 rounded-b-3xl">
                <div className="flex items-center justify-center">
                  <button
                    onClick={() => openModal(selectedDate)}
                    className="px-6 py-2.5 bg-slate-800 hover:bg-black text-white font-semibold rounded-xl shadow-lg transition-all transform hover:scale-105 flex items-center text-sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Another Session
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add/Edit Session Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-gray-100 bg-white flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold font-rajdhani text-slate-800">
                  {editingSession ? 'Edit Session' : 'Create Session'}
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  {editingSession ? 'Update session details.' : 'Add a new session to the current calendar.'}
                </p>
              </div>
              <button onClick={closeModal} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-8">
              <div className="space-y-6">
                {/* Client and Exam */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Client Name</label>
                    <select
                      value={formData.client_name}
                      onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none transition-all font-medium text-slate-700"
                      required
                    >
                      <option value="">Select Client</option>
                      {Object.keys(CLIENT_COLORS).map(client => (
                        <option key={client} value={client}>{client}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Exam Name</label>
                    <input
                      type="text"
                      value={formData.exam_name}
                      onChange={(e) => setFormData({ ...formData, exam_name: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none transition-all font-medium text-slate-700"
                      placeholder="e.g., CMA US Exam"
                      required
                    />
                  </div>
                </div>

                {/* Date and Candidate Count */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Date</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none transition-all font-medium text-slate-700"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Candidate Count</label>
                    <input
                      type="number"
                      value={formData.candidate_count}
                      onChange={(e) => setFormData({ ...formData, candidate_count: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none transition-all font-medium text-slate-700"
                      min="1"
                      required
                    />
                  </div>
                </div>

                {/* Time Range */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Start Time</label>
                    <input
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none transition-all font-medium text-slate-700"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">End Time</label>
                    <input
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none transition-all font-medium text-slate-700"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4 mt-8 pt-6 border-t border-slate-50">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isMutating}
                  className="flex-1 px-6 py-3 bg-slate-900 hover:bg-black text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isMutating ? (
                    <span className="flex items-center"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div> Saving...</span>
                  ) : editingSession ? 'Update Session' : 'Create Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default FetsCalendarPremium
