import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Calendar, ChevronRight, Clock, Users } from 'lucide-react'
import { GlassCard } from './GlassCard'
import { supabase } from '../../lib/supabase'
import { useBranch } from '../../hooks/useBranch'
import { formatDateForIST } from '../../utils/dateUtils'
import { getBranchCapacity } from '../../utils/sessionUtils'

interface TimelineWidgetProps {
  onNavigate?: (tab: string) => void
}

interface SessionData {
  id?: number
  client_name: string
  exam_name: string
  date: string
  candidate_count: number
  start_time: string
  end_time: string
}

interface DayData {
  date: string
  dayName: string
  dayNumber: number
  candidateCount: number
  sessions: SessionData[]
}

export function TimelineWidget({ onNavigate }: TimelineWidgetProps) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [timelineData, setTimelineData] = useState<DayData[]>([])
  const [loading, setLoading] = useState(true)
  const { activeBranch } = useBranch()

  const loadNext7DaysData = useCallback(async () => {
    try {
      setLoading(true)
      const data: DayData[] = []
      const today = new Date()

      // Get next 7 days
      const startDate = formatDateForIST(today)
      const endDate = new Date(today)
      endDate.setDate(today.getDate() + 6)
      const endDateStr = formatDateForIST(endDate)

      // Fetch real session data from database
      let query = supabase
        .from('sessions')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDateStr)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true })

      // Apply branch filtering if not global view
      if (activeBranch !== 'global') {
        query = query.eq('branch_location', activeBranch)
      }

      const { data: sessions, error } = await query

      if (error) {
        console.error('Error loading timeline data:', error)
        return
      }

      // Process data for next 7 days
      for (let i = 0; i < 7; i++) {
        const date = new Date(today)
        date.setDate(today.getDate() + i)

        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        const dateStr = formatDateForIST(date)

        // Get sessions for this specific date
        const daySessions = sessions?.filter(session => session.date === dateStr) || []

        // Calculate total candidates for the day
        const totalCandidates = daySessions.reduce((sum, session) => sum + session.candidate_count, 0)

        data.push({
          date: `${months[date.getMonth()]} ${date.getDate()}`,
          dayName: dayNames[date.getDay()],
          dayNumber: date.getDate(),
          candidateCount: totalCandidates,
          sessions: daySessions
        })
      }

      setTimelineData(data)
    } catch (error) {
      console.error('Error loading timeline data:', error)
    } finally {
      setLoading(false)
    }
  }, [activeBranch])

  useEffect(() => {
    loadNext7DaysData()
  }, [activeBranch, loadNext7DaysData])

  const formatTimeRange = (startTime: string, endTime: string) => {
    const formatTime = (time: string) => {
      const [hours, minutes] = time.split(':')
      const hour = parseInt(hours)
      const ampm = hour >= 12 ? 'PM' : 'AM'
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
      return `${displayHour}:${minutes}${ampm}`
    }
    return `${formatTime(startTime)} - ${formatTime(endTime)}`
  }

  const maxCapacity = getBranchCapacity(activeBranch)

  return (
    <GlassCard className="timeline-widget no-scroll-widget">
      <div className="timeline-header">
        <div className="timeline-title">
          <div className="timeline-icon">
            <Calendar size={24} />
          </div>
          <div>
            <h2>Next 7 Days</h2>
            <p>Upcoming examination schedule - {activeBranch.charAt(0).toUpperCase() + activeBranch.slice(1)} Centre</p>
          </div>
        </div>
        <button
          className="timeline-action"
          onClick={() => onNavigate?.('fets-calendar')}
        >
          View All
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="timeline-scroll no-scroll-widget" style={{ maxHeight: '320px', overflowY: 'hidden' }}>
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading schedule...</p>
          </div>
        ) : (
          <div className="timeline-days">
            {timelineData.map((day, index) => (
              <motion.div
                key={index}
                className={`timeline-day ${selectedDay === index ? 'selected' : ''}`}
                onClick={() => setSelectedDay(selectedDay === index ? null : index)}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="day-header">
                  <div className="day-info">
                    <span className="day-name">{day.dayName}</span>
                    <span className="day-date">{day.date}</span>
                  </div>
                  <div className="day-stats">
                    <div className="candidate-badge">
                      <Users size={14} />
                      <span>{day.candidateCount}/{maxCapacity}</span>
                    </div>
                    {index === 0 && <div className="today-badge">Today</div>}
                  </div>
                </div>

                {selectedDay === index && (
                  <motion.div
                    className="day-details"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {day.sessions.length > 0 ? (
                      <div className="exam-list">
                        {day.sessions.map((session, sessionIndex) => (
                          <div key={sessionIndex} className="exam-item">
                            <div className="exam-time">
                              <Clock size={14} />
                              <span>{formatTimeRange(session.start_time, session.end_time)}</span>
                            </div>
                            <div className="exam-details">
                              <span className="exam-title">{session.client_name} - {session.exam_name}</span>
                              <span className="exam-location">{session.candidate_count} candidates</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="no-exams">
                        No exams scheduled
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </GlassCard>
  )
}