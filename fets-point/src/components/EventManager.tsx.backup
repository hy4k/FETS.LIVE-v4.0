import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Search, Filter, Calendar, User, Clock, AlertTriangle,
  Monitor, Wrench, Building, Users, UserX, Globe, Zap, MoreHorizontal,
  MessageSquare, Paperclip, X, ChevronDown, ChevronRight, Eye,
  CheckCircle, Circle, AlertCircle, ArrowUp, ArrowRight, ArrowDown,
  BarChart3, PieChart, TrendingUp, Camera, Upload, Send, Edit3
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useBranch } from '../hooks/useBranch'
import { supabase } from '../lib/supabase'
import { toast } from 'react-hot-toast'

interface Event {
  id: string
  title: string
  description: string
  category: string
  priority: 'critical' | 'major' | 'minor'
  status: 'open' | 'assigned' | 'in_progress' | 'escalated' | 'closed'
  reporter_id: string
  reporter_name: string
  assigned_to?: string
  assigned_to_name?: string
  created_at: string
  updated_at: string
  closed_at?: string
  closure_remarks?: string
  branch_location: string
  attachments?: string[]
  follow_ups?: FollowUp[]
}

interface FollowUp {
  id: string
  event_id: string
  user_id: string
  user_name: string
  content: string
  created_at: string
  attachments?: string[]
}

interface EventStats {
  total_open: number
  total_closed: number
  critical_open: number
  major_open: number
  minor_open: number
  avg_resolution_hours: number
  by_category: { [key: string]: number }
}

const EVENT_CATEGORIES = [
  { id: 'computer', name: 'Computer/System', icon: Monitor, color: 'bg-blue-500' },
  { id: 'equipment', name: 'Equipment Failure', icon: Wrench, color: 'bg-orange-500' },
  { id: 'property', name: 'Property Damage', icon: Building, color: 'bg-red-500' },
  { id: 'staff', name: 'Staff Issue', icon: Users, color: 'bg-purple-500' },
  { id: 'candidate', name: 'Candidate Issue', icon: UserX, color: 'bg-pink-500' },
  { id: 'client', name: 'Client/Provider', icon: Globe, color: 'bg-green-500' },
  { id: 'utility', name: 'Environment/Utility', icon: Zap, color: 'bg-yellow-500' },
  { id: 'other', name: 'Other', icon: MoreHorizontal, color: 'bg-gray-500' }
]

const PRIORITY_CONFIG = {
  critical: { color: 'bg-red-100 text-red-800 border-red-200', dot: 'bg-red-500', label: 'Critical' },
  major: { color: 'bg-orange-100 text-orange-800 border-orange-200', dot: 'bg-orange-500', label: 'Major' },
  minor: { color: 'bg-blue-100 text-blue-800 border-blue-200', dot: 'bg-blue-500', label: 'Minor' }
}

const STATUS_CONFIG = {
  open: { color: 'bg-blue-100 text-blue-800', label: 'Open' },
  assigned: { color: 'bg-teal-100 text-teal-800', label: 'Assigned' },
  in_progress: { color: 'bg-amber-100 text-amber-800', label: 'In Progress' },
  escalated: { color: 'bg-red-100 text-red-800', label: 'Escalated' },
  closed: { color: 'bg-green-100 text-green-800', label: 'Closed' }
}

export default function EventManager() {
  const { profile } = useAuth()
  const { activeBranch } = useBranch()
  
  const [events, setEvents] = useState<Event[]>([])
  const [stats, setStats] = useState<EventStats>({
    total_open: 0, total_closed: 0, critical_open: 0, major_open: 0, minor_open: 0,
    avg_resolution_hours: 0, by_category: {}
  })
  const [loading, setLoading] = useState(true)
  const [showNewEventModal, setShowNewEventModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [showEventDetail, setShowEventDetail] = useState(false)
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')

  // Load events
  useEffect(() => {
    loadEvents()
    loadStats()
  }, [activeBranch])

  const loadEvents = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('incidents')
        .select(`
          *,
          staff_profiles!incidents_user_id_fkey(full_name)
        `)
        .order('created_at', { ascending: false })

      if (activeBranch !== 'global') {
        query = query.eq('branch_location', activeBranch)
      }

      const { data, error } = await query
      if (error) throw error

      const formattedEvents: Event[] = data?.map(incident => ({
        id: incident.id,
        title: incident.title,
        description: incident.description,
        category: incident.category || 'other',
        priority: incident.severity as 'critical' | 'major' | 'minor',
        status: incident.status as 'open' | 'assigned' | 'in_progress' | 'escalated' | 'closed',
        reporter_id: incident.user_id,
        reporter_name: incident.staff_profiles?.full_name || incident.reporter || 'Unknown',
        assigned_to: incident.assigned_to,
        assigned_to_name: incident.assigned_to,
        created_at: incident.created_at,
        updated_at: incident.updated_at,
        closed_at: incident.completed_at,
        closure_remarks: incident.notes,
        branch_location: incident.branch_location || 'calicut',
        attachments: [],
        follow_ups: []
      })) || []

      setEvents(formattedEvents)
    } catch (error) {
      console.error('Error loading events:', error)
      toast.error('Failed to load events')
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      let query = supabase
        .from('incidents')
        .select('status, severity, category, created_at, completed_at')

      if (activeBranch !== 'global') {
        query = query.eq('branch_location', activeBranch)
      }

      const { data, error } = await query
      if (error) throw error

      const openEvents = data?.filter(e => e.status !== 'closed') || []
      const closedEvents = data?.filter(e => e.status === 'closed') || []
      
      const categoryStats: { [key: string]: number } = {}
      data?.forEach(event => {
        const cat = event.category || 'other'
        categoryStats[cat] = (categoryStats[cat] || 0) + 1
      })

      // Calculate average resolution time
      const resolvedWithTime = closedEvents.filter(e => e.completed_at && e.created_at)
      const avgResolution = resolvedWithTime.length > 0 
        ? resolvedWithTime.reduce((acc, event) => {
            const created = new Date(event.created_at).getTime()
            const completed = new Date(event.completed_at).getTime()
            return acc + (completed - created)
          }, 0) / resolvedWithTime.length / (1000 * 60 * 60) // Convert to hours
        : 0

      setStats({
        total_open: openEvents.length,
        total_closed: closedEvents.length,
        critical_open: openEvents.filter(e => e.severity === 'critical').length,
        major_open: openEvents.filter(e => e.severity === 'high').length,
        minor_open: openEvents.filter(e => e.severity === 'low').length,
        avg_resolution_hours: Math.round(avgResolution),
        by_category: categoryStats
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const filteredEvents = events.filter(event => {
    if (searchQuery && !event.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !event.description.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    if (categoryFilter !== 'all' && event.category !== categoryFilter) return false
    if (priorityFilter !== 'all' && event.priority !== priorityFilter) return false
    if (statusFilter !== 'all' && event.status !== statusFilter) return false
    return true
  })

  const getTimeSince = (dateString: string) => {
    const now = new Date().getTime()
    const created = new Date(dateString).getTime()
    const diffHours = Math.floor((now - created) / (1000 * 60 * 60))
    
    if (diffHours < 1) return 'Just now'
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
  }

  const getCategoryConfig = (categoryId: string) => {
    return EVENT_CATEGORIES.find(cat => cat.id === categoryId) || EVENT_CATEGORIES[EVENT_CATEGORIES.length - 1]
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Event Manager</h1>
              <p className="text-gray-600 mt-1">Track, manage, and resolve operational events</p>
            </div>
            
            <button
              onClick={() => setShowNewEventModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-yellow-400 hover:bg-yellow-500 text-black rounded-xl font-semibold transition-colors shadow-lg"
            >
              <Plus className="w-5 h-5" />
              File New Event
            </button>
          </div>
          
          {/* Filters */}
          <div className="flex items-center gap-4 mt-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              />
            </div>
            
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
            >
              <option value="all">All Categories</option>
              {EVENT_CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="major">Major</option>
              <option value="minor">Minor</option>
            </select>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="escalated">Escalated</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Event Timeline - Left Column */}
          <div className="xl:col-span-3">
            <div className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
                </div>
              ) : filteredEvents.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-200">
                  <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No events found</h3>
                  <p className="text-gray-600">Try adjusting your filters or create a new event.</p>
                </div>
              ) : (
                filteredEvents.map(event => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onClick={() => {
                      setSelectedEvent(event)
                      setShowEventDetail(true)
                    }}
                  />
                ))
              )}
            </div>
          </div>

          {/* Analytics - Right Column */}
          <div className="xl:col-span-1">
            <div className="space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-2 xl:grid-cols-1 gap-4">
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Circle className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Open Events</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.total_open}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Resolved</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.total_closed}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Critical</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.critical_open}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                      <Clock className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Avg Resolution</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.avg_resolution_hours}h</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Category Breakdown */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4">Events by Category</h3>
                <div className="space-y-3">
                  {EVENT_CATEGORIES.map(category => {
                    const count = stats.by_category[category.id] || 0
                    const Icon = category.icon
                    return (
                      <div key={category.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 ${category.color} rounded-lg flex items-center justify-center`}>
                            <Icon className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-sm font-medium text-gray-700">{category.name}</span>
                        </div>
                        <span className="text-sm font-bold text-gray-900">{count}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* New Event Modal */}
      <NewEventModal
        isOpen={showNewEventModal}
        onClose={() => setShowNewEventModal(false)}
        onEventCreated={() => {
          loadEvents()
          loadStats()
        }}
      />

      {/* Event Detail Modal */}
      <EventDetailModal
        event={selectedEvent}
        isOpen={showEventDetail}
        onClose={() => {
          setShowEventDetail(false)
          setSelectedEvent(null)
        }}
        onEventUpdated={() => {
          loadEvents()
          loadStats()
        }}
      />

      {/* Floating Action Button (Mobile) */}
      <button
        onClick={() => setShowNewEventModal(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-yellow-400 hover:bg-yellow-500 text-black rounded-full shadow-lg flex items-center justify-center xl:hidden"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  )
}

// Event Card Component
function EventCard({ event, onClick }: { event: Event; onClick: () => void }) {
  const categoryConfig = EVENT_CATEGORIES.find(cat => cat.id === event.category) || EVENT_CATEGORIES[EVENT_CATEGORIES.length - 1]
  const Icon = categoryConfig.icon
  const priorityConfig = PRIORITY_CONFIG[event.priority]
  const statusConfig = STATUS_CONFIG[event.status]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all cursor-pointer"
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 ${categoryConfig.color} rounded-xl flex items-center justify-center`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{event.title}</h3>
            <p className="text-sm text-gray-600">{categoryConfig.name}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${priorityConfig.dot}`}></div>
          <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${priorityConfig.color}`}>
            {priorityConfig.label}
          </span>
        </div>
      </div>

      {/* Description */}
      <p className="text-gray-700 mb-4 line-clamp-2">{event.description}</p>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span className="flex items-center gap-1">
            <User className="w-4 h-4" />
            {event.reporter_name}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {getTimeSince(event.created_at)}
          </span>
        </div>
        
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
          {statusConfig.label}
        </span>
      </div>
    </motion.div>
  )
}

// New Event Modal Component
function NewEventModal({ isOpen, onClose, onEventCreated }: {
  isOpen: boolean
  onClose: () => void
  onEventCreated: () => void
}) {
  const { profile } = useAuth()
  const { activeBranch } = useBranch()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'other',
    priority: 'minor' as 'critical' | 'major' | 'minor'
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    setSubmitting(true)
    try {
      const { error } = await supabase
        .from('incidents')
        .insert({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          severity: formData.priority,
          status: 'open',
          user_id: profile.id,
          reporter: profile.full_name || 'Unknown',
          branch_location: activeBranch === 'global' ? 'calicut' : activeBranch
        })

      if (error) throw error

      toast.success('Event filed successfully')
      onEventCreated()
      onClose()
      setFormData({ title: '', description: '', category: 'other', priority: 'minor' })
    } catch (error) {
      console.error('Error creating event:', error)
      toast.error('Failed to file event')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">File New Event</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Event Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              placeholder="Brief description of the event"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              >
                {EVENT_CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority *
              </label>
              <select
                required
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as 'critical' | 'major' | 'minor' })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              >
                <option value="minor">Minor</option>
                <option value="major">Major</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              required
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              placeholder="Detailed description of what happened, when, and any relevant context..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-3 bg-yellow-400 hover:bg-yellow-500 text-black rounded-xl font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  File Event
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

// Event Detail Modal Component
function EventDetailModal({ event, isOpen, onClose, onEventUpdated }: {
  event: Event | null
  isOpen: boolean
  onClose: () => void
  onEventUpdated: () => void
}) {
  const { profile } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'minor' as 'critical' | 'major' | 'minor',
    status: 'open' as 'open' | 'assigned' | 'in_progress' | 'escalated' | 'closed'
  })
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (event) {
      setEditForm({
        title: event.title,
        description: event.description,
        category: event.category,
        priority: event.priority,
        status: event.status
      })
    }
  }, [event])

  if (!isOpen || !event) return null

  const categoryConfig = EVENT_CATEGORIES.find(cat => cat.id === event.category) || EVENT_CATEGORIES[EVENT_CATEGORIES.length - 1]
  const Icon = categoryConfig.icon

  const handleUpdate = async () => {
    setUpdating(true)
    try {
      const { error } = await supabase
        .from('incidents')
        .update({
          title: editForm.title,
          description: editForm.description,
          category: editForm.category,
          severity: editForm.priority,
          status: editForm.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', event.id)

      if (error) throw error

      toast.success('Event updated successfully')
      setIsEditing(false)
      onEventUpdated()
    } catch (error) {
      console.error('Error updating event:', error)
      toast.error('Failed to update event')
    } finally {
      setUpdating(false)
    }
  }

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('incidents')
        .delete()
        .eq('id', event.id)

      if (error) throw error

      toast.success('Event deleted successfully')
      onEventUpdated()
      onClose()
    } catch (error) {
      console.error('Error deleting event:', error)
      toast.error('Failed to delete event')
    }
  }

  const handleStatusChange = async (newStatus: typeof editForm.status) => {
    try {
      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString()
      }

      if (newStatus === 'closed') {
        updateData.completed_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from('incidents')
        .update(updateData)
        .eq('id', event.id)

      if (error) throw error

      toast.success(`Event ${newStatus === 'closed' ? 'closed' : 'updated'} successfully`)
      onEventUpdated()
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update status')
    }
  }

  const canEdit = profile?.id === event.reporter_id || profile?.role === 'admin' || profile?.role === 'super_admin'

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 ${categoryConfig.color} rounded-xl flex items-center justify-center`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="text-xl font-bold text-gray-900 border-b-2 border-yellow-400 focus:outline-none"
                  />
                ) : (
                  <h2 className="text-xl font-bold text-gray-900">{event.title}</h2>
                )}
                <p className="text-gray-600">{categoryConfig.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {canEdit && !isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  title="Edit event"
                >
                  <Edit3 className="w-5 h-5 text-blue-600" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <div className="space-y-6">
            {/* Event Details */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Event Details</h3>
              <div className="bg-gray-50 rounded-xl p-4">
                {isEditing ? (
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent resize-none"
                    rows={4}
                  />
                ) : (
                  <p className="text-gray-700">{event.description}</p>
                )}
              </div>
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-6">
              {isEditing ? (
                <>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Category</h4>
                    <select
                      value={editForm.category}
                      onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-400"
                    >
                      {EVENT_CATEGORIES.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Priority</h4>
                    <select
                      value={editForm.priority}
                      onChange={(e) => setEditForm({ ...editForm, priority: e.target.value as any })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-400"
                    >
                      <option value="minor">Minor</option>
                      <option value="major">Major</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Status</h4>
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-400"
                    >
                      <option value="open">Open</option>
                      <option value="assigned">Assigned</option>
                      <option value="in_progress">In Progress</option>
                      <option value="escalated">Escalated</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Reporter</h4>
                    <p className="text-gray-600">{event.reporter_name}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Created</h4>
                    <p className="text-gray-600">{new Date(event.created_at).toLocaleString()}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Priority</h4>
                    <span className={`px-3 py-1 rounded-lg text-sm font-medium border ${PRIORITY_CONFIG[event.priority].color}`}>
                      {PRIORITY_CONFIG[event.priority].label}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Status</h4>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_CONFIG[event.status].color}`}>
                      {STATUS_CONFIG[event.status].label}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              {isEditing ? (
                <>
                  <button
                    onClick={handleUpdate}
                    disabled={updating}
                    className="px-6 py-2 bg-yellow-400 hover:bg-yellow-500 text-black rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {updating ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black" />
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Save Changes
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  {canEdit && (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="ml-auto px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors"
                    >
                      Delete Event
                    </button>
                  )}
                </>
              ) : (
                <>
                  {event.status !== 'closed' && (
                    <>
                      <button
                        onClick={() => handleStatusChange('in_progress')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Mark In Progress
                      </button>
                      <button
                        onClick={() => handleStatusChange('closed')}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Mark as Closed
                      </button>
                    </>
                  )}
                  {event.status === 'closed' && (
                    <button
                      onClick={() => handleStatusChange('open')}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                    >
                      Reopen Event
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
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Delete Event</h3>
                <p className="text-sm text-gray-600">Are you sure?</p>
              </div>
            </div>
            <p className="text-sm text-gray-700 mb-6">
              This action cannot be undone. The event will be permanently deleted from the system.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition-colors"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

function getTimeSince(dateString: string) {
  const now = new Date().getTime()
  const created = new Date(dateString).getTime()
  const diffHours = Math.floor((now - created) / (1000 * 60 * 60))
  
  if (diffHours < 1) return 'Just now'
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d ago`
}