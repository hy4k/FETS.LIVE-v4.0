import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Search, User, Clock, AlertTriangle,
  Monitor, Wrench, Building, Users, UserX, Globe, Zap, MoreHorizontal, MessageSquare, Send,
  X, CheckCircle, Circle, Edit3, Trash2, Calendar, Filter, Eye, MapPin, Activity
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useBranch } from '../hooks/useBranch'
import { supabase } from '../lib/supabase'
import { toast } from 'react-hot-toast'

interface Incident {
  id: string
  title: string
  description: string
  category: string
  severity: 'critical' | 'major' | 'minor'
  status: 'open' | 'assigned' | 'in_progress' | 'escalated' | 'closed'
  reporter?: string
  assigned_to?: string
  user_id: string
  system_id?: string
  created_at: string
  updated_at: string
  closed_at?: string
  branch_location: string
}

interface IncidentStats {
  total_open: number
  total_closed: number
  critical_open: number
  major_open: number
  minor_open: number
  upcoming_this_week: number
  by_category: { [key: string]: number }
}

interface Comment {
  id: string;
  created_at: string;
  body: string;
  incident_id: string;
  author_id: string;
  author_full_name: string;
}

const INCIDENT_CATEGORIES = [
  { id: 'computer', name: 'Computer/System', icon: Monitor, color: 'text-blue-600' },
  { id: 'equipment', name: 'Equipment Failure', icon: Wrench, color: 'text-orange-600' },
  { id: 'property', name: 'Property Damage', icon: Building, color: 'text-red-600' },
  { id: 'staff', name: 'Staff Issue', icon: Users, color: 'text-purple-600' },
  { id: 'candidate', name: 'Candidate Issue', icon: UserX, color: 'text-pink-600' },
  { id: 'client', name: 'Client/Provider', icon: Globe, color: 'text-green-600' },
  { id: 'utility', name: 'Environment/Utility', icon: Zap, color: 'text-yellow-600' },
  { id: 'other', name: 'Other', icon: MoreHorizontal, color: 'text-gray-600' }
]

const PRIORITY_CONFIG = {
  critical: { color: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-500', label: 'Critical' },
  major: { color: 'bg-orange-100 text-orange-700 border-orange-200', dot: 'bg-orange-500', label: 'Major' },
  minor: { color: 'bg-blue-100 text-blue-700 border-blue-200', dot: 'bg-blue-500', label: 'Minor' }
}

const STATUS_CONFIG = {
  open: { color: 'bg-blue-100 text-blue-800', label: 'Open', icon: Circle },
  assigned: { color: 'bg-teal-100 text-teal-800', label: 'Assigned', icon: User },
  in_progress: { color: 'bg-amber-100 text-amber-800', label: 'In Progress', icon: Clock },
  escalated: { color: 'bg-red-100 text-red-800', label: 'Escalated', icon: AlertTriangle },
  closed: { color: 'bg-green-100 text-green-800', label: 'Closed', icon: CheckCircle }
}

interface IncidentManagerProps {
  embedded?: boolean
}

export default function IncidentManager({ embedded = false }: IncidentManagerProps) {
  const { profile } = useAuth()
  const { activeBranch } = useBranch()

  const [incidents, setIncidents] = useState<Incident[]>([])
  const [stats, setStats] = useState<IncidentStats>({
    total_open: 0, total_closed: 0, critical_open: 0, major_open: 0, minor_open: 0,
    upcoming_this_week: 0, by_category: {}
  })
  const [loading, setLoading] = useState(true)
  const [showNewIncidentModal, setShowNewIncidentModal] = useState(false)
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)
  const [showIncidentDetail, setShowIncidentDetail] = useState(false)

  const [newCommentAlerts, setNewCommentAlerts] = useState<string[]>([])
  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const loadIncidents = useCallback(async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('incidents')
        .select('*')
        .order('created_at', { ascending: false })

      if (activeBranch && activeBranch !== 'global') {
        query = query.eq('branch_location', activeBranch)
      }

      const { data, error } = await query
      if (error) {
        // Handle missing table gracefully
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          console.warn('Incidents table does not exist yet. Please run the migration script.')
          setIncidents([])
          setLoading(false)
          return
        }
        console.error('Error loading incidents:', error)
        setLoading(false)
        return
      }

      setIncidents((data || []) as Incident[])
    } catch (error: any) {
      console.error('Error loading incidents:', error)
    } finally {
      setLoading(false)
    }
  }, [activeBranch])

  const loadStats = useCallback(async () => {
    try {
      let query = supabase
        .from('incidents')
        .select('status, severity, category, created_at, closed_at')

      if (activeBranch && activeBranch !== 'global') {
        query = query.eq('branch_location', activeBranch)
      }

      const { data, error } = await query
      if (error) {
        // Handle missing table gracefully
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          console.warn('Incidents table does not exist yet.')
          return
        }
        console.error('Error loading stats:', error)
        return
      }

      const openIncidents = data?.filter(e => e.status !== 'closed') || []
      const closedIncidents = data?.filter(e => e.status === 'closed') || []

      const categoryStats: { [key: string]: number } = {}
      data?.forEach(incident => {
        const cat = incident.category || 'other'
        categoryStats[cat] = (categoryStats[cat] || 0) + 1
      })

      const now = new Date()
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      const upcomingThisWeek = data?.filter(e => {
        const incidentDate = new Date(e.created_at)
        return incidentDate >= now && incidentDate <= weekFromNow && e.status !== 'closed'
      }).length || 0

      setStats({
        total_open: openIncidents.length,
        total_closed: closedIncidents.length,
        critical_open: openIncidents.filter(e => e.severity === 'critical').length,
        major_open: openIncidents.filter(e => e.severity === 'major').length,
        minor_open: openIncidents.filter(e => e.severity === 'minor').length,
        upcoming_this_week: upcomingThisWeek,
        by_category: categoryStats
      })
    } catch (error: any) {
      console.error('Error loading stats:', error)
    }
  }, [activeBranch])

  // Load incidents
  useEffect(() => {
    loadIncidents()
    loadStats()
  }, [activeBranch, loadIncidents, loadStats])

  // Subscribe to new comments to show alerts on cards
  useEffect(() => {
    const channel = supabase
      .channel('public:incident_comments')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'incident_comments' },
        (payload) => {
          const newComment = payload.new as { incident_id: string; author_id: string }
          // Don't show notification for user's own comments
          if (profile && newComment.author_id === profile.user_id) {
            return
          }
          // Add incident ID to alerts if not already present
          setNewCommentAlerts(prev => prev.includes(newComment.incident_id) ? prev : [...prev, newComment.incident_id])
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [profile])

  const filteredIncidents = incidents.filter(incident => {
    if (searchQuery && !incident.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !incident.description.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    if (categoryFilter !== 'all' && incident.category !== categoryFilter) return false
    if (priorityFilter !== 'all' && incident.severity !== priorityFilter) return false
    if (statusFilter !== 'all' && incident.status !== statusFilter) return false
    return true
  })

  const getTimeSince = (dateString: string) => {
    const now = new Date().getTime()
    const created = new Date(dateString).getTime()
    const diffHours = Math.floor((now - created) / (1000 * 60 * 60))

    if (diffHours < 1) return 'Just now'
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays === 1) return '1 day ago'
    return `${diffDays} days ago`
  }

  return (
    <div className={`min-h-screen ${embedded ? 'p-0' : '-mt-32 pt-48 bg-[#e0e5ec]'}`} style={{ fontFamily: "'Montserrat', sans-serif" }}>
      {/* Functional Notification Banner */}
      {!embedded && <div className="h-6 -mx-8 -mt-12 mb-8"></div>}

      <div className={`${embedded ? 'w-full' : 'max-w-[1800px] mx-auto px-6'}`}>
        {/* Executive Header - Neumorphic */}
        {!embedded && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4"
          >
            <div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gold-gradient mb-2 uppercase">
                Incident Manager
              </h1>
              <p className="text-lg text-gray-600 font-medium">
                {activeBranch && activeBranch !== 'global' ? `${activeBranch.charAt(0).toUpperCase() + activeBranch.slice(1)} · ` : ''}Track, manage, and resolve operational incidents
              </p>
            </div>
            <div className="text-right">
              <p className="text-gray-500 font-semibold uppercase tracking-wider text-sm">
                {new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </motion.div>
        )}

        {/* Stats Dashboard - Neumorphic */}
        {!embedded && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="neomorphic-card p-5 group hover:text-blue-600"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-[#e0e5ec] shadow-[inset_2px_2px_4px_#bec3c9,inset_-2px_-2px_4px_#ffffff] flex items-center justify-center">
                  <Circle className="w-4 h-4 text-blue-600" />
                </div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Open</p>
              </div>
              <p className="text-3xl font-bold text-gray-700 group-hover:text-blue-600 transition-colors">{stats.total_open}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="neomorphic-card p-5 group hover:text-green-600"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-[#e0e5ec] shadow-[inset_2px_2px_4px_#bec3c9,inset_-2px_-2px_4px_#ffffff] flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Closed</p>
              </div>
              <p className="text-3xl font-bold text-gray-700 group-hover:text-green-600 transition-colors">{stats.total_closed}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="neomorphic-card p-5 group hover:text-red-600"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-[#e0e5ec] shadow-[inset_2px_2px_4px_#bec3c9,inset_-2px_-2px_4px_#ffffff] flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                </div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Critical</p>
              </div>
              <p className="text-3xl font-bold text-gray-700 group-hover:text-red-600 transition-colors">{stats.critical_open}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              className="neomorphic-card p-5 group hover:text-orange-600"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-[#e0e5ec] shadow-[inset_2px_2px_4px_#bec3c9,inset_-2px_-2px_4px_#ffffff] flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                </div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Major</p>
              </div>
              <p className="text-3xl font-bold text-gray-700 group-hover:text-orange-600 transition-colors">{stats.major_open}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="neomorphic-card p-5 group hover:text-blue-500"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-[#e0e5ec] shadow-[inset_2px_2px_4px_#bec3c9,inset_-2px_-2px_4px_#ffffff] flex items-center justify-center">
                  <Circle className="w-4 h-4 text-blue-500" />
                </div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Minor</p>
              </div>
              <p className="text-3xl font-bold text-gray-700 group-hover:text-blue-500 transition-colors">{stats.minor_open}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
              className="neomorphic-card p-5 group hover:text-purple-600"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-[#e0e5ec] shadow-[inset_2px_2px_4px_#bec3c9,inset_-2px_-2px_4px_#ffffff] flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-purple-600" />
                </div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">This Week</p>
              </div>
              <p className="text-3xl font-bold text-gray-700 group-hover:text-purple-600 transition-colors">{stats.upcoming_this_week}</p>
            </motion.div>
          </div>
        )}

        {/* Controls & Filters - Neumorphic */}
        <div className="mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex-1 w-full relative">
            <div className="neomorphic-card px-4 py-2 flex items-center gap-3">
              <Search className="w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search incidents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none focus:ring-0 text-gray-700 w-full placeholder-gray-400"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
            <div className="neomorphic-card px-4 py-2 flex items-center gap-2 min-w-[150px]">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-transparent border-none focus:ring-0 text-gray-700 text-sm w-full cursor-pointer"
              >
                <option value="all">All Categories</option>
                {INCIDENT_CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="neomorphic-card px-4 py-2 flex items-center gap-2 min-w-[150px]">
              <AlertTriangle className="w-4 h-4 text-gray-400" />
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="bg-transparent border-none focus:ring-0 text-gray-700 text-sm w-full cursor-pointer"
              >
                <option value="all">All Priorities</option>
                <option value="critical">Critical</option>
                <option value="major">Major</option>
                <option value="minor">Minor</option>
              </select>
            </div>

            <div className="neomorphic-card px-4 py-2 flex items-center gap-2 min-w-[150px]">
              <Circle className="w-4 h-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent border-none focus:ring-0 text-gray-700 text-sm w-full cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="assigned">Assigned</option>
                <option value="in_progress">In Progress</option>
                <option value="escalated">Escalated</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowNewIncidentModal(true)}
              className="neomorphic-btn group"
            >
              <Plus className="w-5 h-5 text-gray-600 group-hover:text-yellow-600 transition-colors" />
              <span className="group-hover:text-yellow-600 transition-colors">Report Incident</span>
            </motion.button>
          </div>
        </div>

        {/* Incident Cards Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-yellow-500 mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Loading incidents...</p>
            </div>
          </div>
        ) : filteredIncidents.length === 0 ? (
          <div className="neomorphic-card p-16 text-center">
            <div className="w-20 h-20 bg-[#e0e5ec] rounded-full shadow-[inset_4px_4px_8px_#bec3c9,inset_-4px_-4px_8px_#ffffff] flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-700 mb-3">No incidents found</h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              {searchQuery || categoryFilter !== 'all' || priorityFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your filters to see more results.'
                : 'Great news! There are no incidents reported. Click below to report a new incident if needed.'}
            </p>
            <motion.button
              onClick={() => setShowNewIncidentModal(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="neomorphic-btn mx-auto group"
            >
              <Plus className="w-5 h-5 text-gray-600 group-hover:text-yellow-600" />
              <span className="group-hover:text-yellow-600">Report Incident</span>
            </motion.button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence mode="popLayout">
              {filteredIncidents.map((incident) => {
                const categoryConfig = INCIDENT_CATEGORIES.find(cat => cat.id === incident.category) || INCIDENT_CATEGORIES[INCIDENT_CATEGORIES.length - 1]
                const Icon = categoryConfig.icon
                const priorityConfig = PRIORITY_CONFIG[incident.severity] || PRIORITY_CONFIG.minor
                const statusConfig = STATUS_CONFIG[incident.status] || STATUS_CONFIG.open
                const StatusIcon = statusConfig.icon
                const hasNewComment = newCommentAlerts.includes(incident.id)

                return (
                  <motion.div
                    key={incident.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    whileHover={{ translateY: -5 }}
                    transition={{ duration: 0.3 }}
                    className="neomorphic-card p-6 group h-full flex flex-col justify-between"
                  >
                    <div>
                      {/* Header Section */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-xl bg-[#e0e5ec] shadow-[inset_2px_2px_4px_#bec3c9,inset_-2px_-2px_4px_#ffffff] flex items-center justify-center`}>
                            <Icon className={`w-6 h-6 ${categoryConfig.color}`} />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">{categoryConfig.name}</span>
                            <h3 className="font-bold text-gray-800 text-lg line-clamp-1 group-hover:text-yellow-600 transition-colors">
                              {incident.title}
                            </h3>
                          </div>
                        </div>
                        {hasNewComment && (
                          <div className="indicator-dot active" title="New Comments"></div>
                        )}
                      </div>

                      {/* Description */}
                      <p className="text-sm text-gray-600 mb-6 line-clamp-3 leading-relaxed">{incident.description}</p>
                    </div>

                    <div>
                      {/* Tags */}
                      <div className="flex items-center gap-3 mb-6 flex-wrap">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border ${priorityConfig.color} bg-opacity-50`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${priorityConfig.dot} animate-pulse`}></div>
                          {priorityConfig.label}
                        </span>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold ${statusConfig.color} bg-opacity-50`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusConfig.label}
                        </span>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200/50">
                        <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{getTimeSince(incident.created_at)}</span>
                        </div>

                        <motion.button
                          onClick={() => {
                            setSelectedIncident(incident)
                            setShowIncidentDetail(true)
                            setNewCommentAlerts(prev => prev.filter(id => id !== incident.id))
                          }}
                          whileTap={{ scale: 0.95 }}
                          className="px-4 py-2 bg-[#e0e5ec] shadow-[3px_3px_6px_#bec3c9,-3px_-3px_6px_#ffffff] rounded-lg text-xs font-bold text-gray-600 hover:text-yellow-600 flex items-center gap-2"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          VIEW
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* New Incident Modal - Premium Style */}
      {showNewIncidentModal && (
        <NewIncidentModal
          onClose={() => setShowNewIncidentModal(false)}
          onIncidentCreated={() => {
            loadIncidents()
            loadStats()
            setShowNewIncidentModal(false)
          }}
        />
      )}

      {/* Incident Detail Modal - Premium Style */}
      {showIncidentDetail && selectedIncident && (
        <IncidentDetailModal
          incident={selectedIncident}
          onClose={() => {
            setShowIncidentDetail(false)
            setSelectedIncident(null)
          }}
          onIncidentUpdated={() => {
            loadIncidents()
            loadStats()
          }}
        />
      )}
    </div>
  )
}

// New Incident Modal Component
function NewIncidentModal({ onClose, onIncidentCreated }: {
  onClose: () => void
  onIncidentCreated: () => void
}) {
  const { profile } = useAuth()
  const { activeBranch } = useBranch()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'other',
    severity: 'minor' as 'critical' | 'major' | 'minor'
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!profile) {
      toast.error('You must be logged in to report an incident')
      return
    }

    setSubmitting(true)
    try {
      const { error } = await supabase
        .from('incidents')
        .insert({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          severity: formData.severity,
          status: 'open',
          reporter: profile.full_name || profile.email || 'Unknown',
          user_id: profile.user_id,
          branch_location: activeBranch === 'global' ? 'calicut' : activeBranch
        })

      if (error) throw error

      toast.success('Incident reported successfully')
      onIncidentCreated()
    } catch (error) {
      console.error('Error creating incident:', error)
      toast.error('Failed to report incident')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="premium-modal max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        <div className="p-6 border-b border-gray-100 bg-white/50 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center shadow-lg">
                <Plus className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">New Incident Logic</h2>
                <p className="text-xs text-gray-500 font-medium">Create a new operational record</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto bg-[#e0e5ec]">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">
              Incident Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 neomorphic-card bg-[#e0e5ec] focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all font-medium text-gray-700"
              placeholder="Brief description of the incident"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">
                Category <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 neomorphic-card bg-[#e0e5ec] appearance-none focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all font-medium text-gray-700"
                >
                  {INCIDENT_CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Filter className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">
                Priority <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  required
                  value={formData.severity}
                  onChange={(e) => setFormData({ ...formData, severity: e.target.value as 'critical' | 'major' | 'minor' })}
                  className="w-full px-4 py-3 neomorphic-card bg-[#e0e5ec] appearance-none focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all font-medium text-gray-700"
                >
                  <option value="minor">Minor</option>
                  <option value="major">Major</option>
                  <option value="critical">Critical</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <AlertTriangle className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">
                Report Date
              </label>
              <div className="w-full px-4 py-3 neomorphic-card bg-[#e0e5ec] font-medium text-gray-500">
                {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={5}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 neomorphic-card bg-[#e0e5ec] focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all font-medium text-gray-700 resize-none"
              placeholder="Provide detailed information about the incident..."
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 neomorphic-btn justify-center text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:from-yellow-600 hover:to-yellow-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 fill-current" />
                  Report Incident Logic
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

// Incident Detail Modal Component
function IncidentDetailModal({ incident, onClose, onIncidentUpdated }: {
  incident: Incident
  onClose: () => void
  onIncidentUpdated: () => void
}) {
  const { profile } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    title: incident.title,
    description: incident.description,
    category: incident.category,
    severity: incident.severity,
    status: incident.status
  })
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loadingComments, setLoadingComments] = useState(true)
  const [submittingComment, setSubmittingComment] = useState(false)

  const categoryConfig = INCIDENT_CATEGORIES.find(cat => cat.id === incident.category) || INCIDENT_CATEGORIES[INCIDENT_CATEGORIES.length - 1]
  const Icon = categoryConfig.icon
  const { hasPermission } = useAuth()
  const canEdit = hasPermission('incident_edit')

  const handleUpdate = async () => {
    if (!canEdit) {
      toast.error('You do not have permission to edit incidents')
      return
    }

    setUpdating(true)
    try {
      const { error } = await supabase
        .from('incidents')
        .update({
          title: editForm.title,
          description: editForm.description,
          category: editForm.category,
          severity: editForm.severity,
          status: editForm.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', incident.id)

      if (error) throw error

      toast.success('Incident updated successfully')
      setIsEditing(false)
      onIncidentUpdated()
      onClose()
    } catch (error) {
      console.error('Error updating incident:', error)
      toast.error('Failed to update incident')
    } finally {
      setUpdating(false)
    }
  }

  const handleDelete = async () => {
    if (!canEdit) {
      toast.error('You do not have permission to delete incidents')
      return
    }

    try {
      const { error } = await supabase.from('incidents').delete().eq('id', incident.id)
      if (error) throw error

      toast.success('Incident deleted successfully')
      onIncidentUpdated()
      onClose()
    } catch (error) {
      console.error('Error deleting incident:', error)
      toast.error('Failed to delete incident')
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    try {
      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString()
      }

      if (newStatus === 'closed') {
        updateData.closed_at = new Date().toISOString()
      }

      const { error } = await supabase.from('incidents').update(updateData).eq('id', incident.id)
      if (error) throw error

      // Integration: If this was a system fault, clear it on resolution
      if (newStatus === 'closed' && incident.system_id) {
        await supabase.from('systems').update({ status: 'operational' }).eq('id', incident.system_id)
        toast.success('System auto-restored to operational status')
      }

      toast.success(`Incident ${newStatus === 'closed' ? 'closed' : 'updated'} successfully`)
      onIncidentUpdated()
      onClose()
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update status')
    }
  }

  // Fetch comments when the modal opens
  useEffect(() => {
    const fetchComments = async () => {
      setLoadingComments(true)
      try {
        const { data, error } = await supabase
          .from('incident_comments')
          .select('*')
          .eq('incident_id', incident.id)
          .order('created_at', { ascending: true })

        if (error) throw error
        setComments((data || []) as unknown as Comment[])
      } catch (error) {
        console.error('Error fetching comments:', error)
        toast.error('Failed to load comments')
      } finally {
        setLoadingComments(false)
      }
    }
    fetchComments()
  }, [incident.id])

  // Real-time comments subscription
  useEffect(() => {
    // Ensure we have a profile before subscribing
    if (!profile) return

    const channel = supabase
      .channel(`incident-comments-${incident.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'incident_comments',
          filter: `incident_id=eq.${incident.id}`,
        },
        (payload) => {
          const newComment = payload.new as Comment
          // Add the new comment to the state in real-time
          // We check if the comment already exists to prevent duplicates from optimistic updates
          setComments((prev) => prev.some(c => c.id === newComment.id) ? prev : [...prev, newComment])
        }
      )
      .subscribe()

    // Cleanup function to remove the channel subscription when the modal closes
    return () => { supabase.removeChannel(channel) }
  }, [incident.id, profile])

  const handleCommentSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!newComment.trim() || !profile) return

    setSubmittingComment(true)
    try {
      const { data, error } = await supabase
        .from('incident_comments')
        .insert({
          body: newComment,
          incident_id: incident.id,
          author_id: profile.user_id,
          author_full_name: profile?.full_name || 'Unknown User'
        })
        .select()
        .single()

      if (error) throw error

      setComments(prev => prev.some(c => c.id === (data as any).id) ? prev : [...prev, data as unknown as Comment])
      setNewComment('')
    } catch (error: any) {
      console.error('Error posting comment:', error)
      toast.error(error.message || 'Failed to post comment. The incident may be closed.')
    } finally {
      setSubmittingComment(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="premium-modal max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        <div className="p-6 border-b border-gray-100 bg-white/60 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3">
                <Icon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">{incident.title}</h2>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-yellow-600 uppercase tracking-widest">{categoryConfig.name}</span>
                  <span className="text-gray-400">•</span>
                  <span className="text-sm text-gray-500">{new Date(incident.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {canEdit && !isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="neomorphic-btn p-2.5 justify-center hover:text-yellow-600"
                  title="Edit incident"
                >
                  <Edit3 className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={onClose}
                className="neomorphic-btn p-2.5 justify-center hover:text-red-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-8 max-h-[calc(90vh-100px)] overflow-y-auto bg-[#e0e5ec]">
          <div className="space-y-8">
            {isEditing ? (
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">Title</label>
                  <textarea
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full px-4 py-3 neomorphic-card bg-[#e0e5ec] focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all font-medium text-gray-700 resize-none"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">Description</label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full px-4 py-3 neomorphic-card bg-[#e0e5ec] focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all font-medium text-gray-700 resize-none"
                    rows={6}
                  />
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">Category</label>
                    <select
                      value={editForm.category}
                      onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                      className="w-full px-4 py-3 neomorphic-card bg-[#e0e5ec] appearance-none focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all font-medium text-gray-700"
                    >
                      {INCIDENT_CATEGORIES.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">Priority</label>
                    <select
                      value={editForm.severity}
                      onChange={(e) => setEditForm({ ...editForm, severity: e.target.value as any })}
                      className="w-full px-4 py-3 neomorphic-card bg-[#e0e5ec] appearance-none focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all font-medium text-gray-700"
                    >
                      <option value="minor">Minor</option>
                      <option value="major">Major</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">Status</label>
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                      className="w-full px-4 py-3 neomorphic-card bg-[#e0e5ec] appearance-none focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all font-medium text-gray-700"
                    >
                      <option value="open">Open</option>
                      <option value="assigned">Assigned</option>
                      <option value="in_progress">In Progress</option>
                      <option value="escalated">Escalated</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">Created Date</label>
                    <div className="w-full px-4 py-3 neomorphic-card bg-[#e0e5ec] font-medium text-gray-500">
                      {new Date(incident.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="neomorphic-card p-6">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Incident Description</h3>
                  <p className="text-gray-700 leading-loose">{incident.description}</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="neomorphic-card p-4">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Reported Date</h4>
                    <p className="text-gray-800 font-bold">{new Date(incident.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="neomorphic-card p-4">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Created At</h4>
                    <p className="text-gray-800 font-bold">{new Date(incident.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="neomorphic-card p-4">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Priority Level</h4>
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${PRIORITY_CONFIG[incident.severity].dot} animate-pulse`}></span>
                      <span className={`font-bold capitalize ${PRIORITY_CONFIG[incident.severity].color.split(' ')[1]}`}>{incident.severity}</span>
                    </div>
                  </div>
                  <div className="neomorphic-card p-4">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Current Status</h4>
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-blue-600" />
                      <span className="font-bold capitalize text-gray-800">{incident.status.replace('_', ' ')}</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Comments Section */}
            {!isEditing && (
              <div className="pt-8 border-t border-gray-300/50">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-[#e0e5ec] shadow-[inset_2px_2px_4px_#bec3c9,inset_-2px_-2px_4px_#ffffff] flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-gray-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800">Operational Log & Comments</h3>
                </div>

                <div className="space-y-4 max-h-80 overflow-y-auto pr-2 custom-scrollbar mb-6">
                  {loadingComments ? (
                    <p className="text-gray-500 text-sm">Loading logs...</p>
                  ) : comments.length === 0 ? (
                    <div className="text-center py-8 opacity-50">
                      <MessageSquare className="w-10 h-10 mx-auto text-gray-400 mb-2" />
                      <p className="text-gray-500 italic">No comments recorded yet.</p>
                    </div>
                  ) : (
                    comments.map(comment => (
                      <div key={comment.id} className="flex items-start gap-4 group">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center font-bold text-gray-600 text-sm shadow-md flex-shrink-0">
                          {comment.author_full_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 neomorphic-card p-4 !rounded-tl-none">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-bold text-sm text-gray-800">{comment.author_full_name}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{new Date(comment.created_at).toLocaleString()}</p>
                          </div>
                          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{comment.body}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {incident.status !== 'closed' ? (
                  <form onSubmit={handleCommentSubmit} className="flex items-start gap-4 relative">
                    <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center font-bold text-white text-sm shadow-md flex-shrink-0">
                      {profile?.full_name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 relative">
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add an operational update..."
                        className="w-full px-6 py-4 neomorphic-card bg-[#e0e5ec] focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all font-medium text-gray-700 resize-none pr-14"
                        rows={3}
                        disabled={submittingComment}
                      />
                      <button
                        type="submit"
                        disabled={submittingComment || !newComment.trim()}
                        className="absolute right-3 bottom-3 p-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-lg hover:rotate-12"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="neomorphic-card p-4 text-center text-sm font-medium text-gray-500 flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Incident resolved. Comments are locked.
                  </div>
                )}
              </div>
            )}


            <div className="flex gap-4 pt-4 border-t border-gray-300/50">
              {isEditing ? (
                <>
                  <button
                    onClick={handleUpdate}
                    disabled={updating}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {updating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Save Changes
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex-1 px-6 py-3 neomorphic-btn justify-center text-gray-600"
                  >
                    Cancel
                  </button>
                  {canEdit && (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </>
              ) : (
                <>
                  {incident.status !== 'closed' && (
                    <>
                      <button
                        onClick={() => handleStatusChange('in_progress')}
                        className="flex-1 px-5 py-3 neomorphic-btn justify-center text-blue-600 hover:text-blue-700"
                      >
                        <Activity className="w-4 h-4 mr-2" />
                        Mark In Progress
                      </button>
                      <button
                        onClick={() => handleStatusChange('closed')}
                        className="flex-1 px-5 py-3 neomorphic-btn justify-center text-green-600 hover:text-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Close Incident
                      </button>
                    </>
                  )}
                  {incident.status === 'closed' && (
                    <button
                      onClick={() => handleStatusChange('open')}
                      className="flex-1 px-5 py-3 neomorphic-btn justify-center text-orange-600 hover:text-orange-700"
                    >
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Reopen Incident
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="neomorphic-card bg-[#e0e5ec] max-w-md w-full p-8"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center shadow-inner">
                <AlertTriangle className="w-7 h-7 text-red-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">Delete Incident?</h3>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Irreversible Action</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-8 leading-relaxed">
              Are you sure you want to permanently delete this incident record? All associated data including operational logs will be removed immediately.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-5 py-3 neomorphic-btn justify-center text-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-5 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
              >
                Confirm Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
