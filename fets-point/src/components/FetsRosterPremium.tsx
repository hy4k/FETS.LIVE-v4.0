import { useState, useEffect, useCallback } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  User,
  Trash2,
  X,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Plus,
  Eye,
  Search,
  Users,
  Coffee,
  BarChart3,
  RefreshCw,
  Zap,
  Target,
  Filter
} from 'lucide-react'
import { motion } from 'framer-motion'
import { MonthlyRosterTimeline } from './MonthlyRosterTimeline'
import { ShiftCellPopup } from './ShiftCellPopup'
import { EnhancedQuickAddModal } from './EnhancedQuickAddModal'
import { EnhancedRequestsModal } from './EnhancedRequestsModal'
import { RosterListView } from './RosterListView'
import { EnhancedAnalysisView } from './EnhancedAnalysisView'
import { useAuth } from '../hooks/useAuth'
import { useBranch } from '../hooks/useBranch'
import { supabase } from '../lib/supabase'
import { formatDateForIST } from '../utils/dateUtils'
import { LeaveRequest, Schedule, StaffProfile, SHIFT_CODES, ShiftCode } from '../types/shared'

import '../styles/glassmorphism.css'

type ViewMode = 'month' | 'list'

export function FetsRosterPremium() {
  const { user, profile } = useAuth()
  const { activeBranch } = useBranch()

  // Core state
  const [currentDate, setCurrentDate] = useState(new Date())
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [staffProfiles, setStaffProfiles] = useState<StaffProfile[]>([])
  const [requests, setRequests] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('month')

  // UI state
  const [isRightDrawerOpen, setIsRightDrawerOpen] = useState(false)
  const [drawerMode, setDrawerMode] = useState<'edit' | 'requests' | 'analysis' | 'generate'>('edit')
  const [selectedCell, setSelectedCell] = useState<{ profileId: string; date: string } | null>(null)
  const [otHours, setOtHours] = useState(0)
  const [lastEditInfo, setLastEditInfo] = useState<{ by: string; date: string } | null>(null)
  const [selectedStaffFilter, setSelectedStaffFilter] = useState<string>('')
  const [showQuickAddModal, setShowQuickAddModal] = useState(false)
  const [showFilter, setShowFilter] = useState(false)

  // New modal states for enhanced functionality
  const [showShiftCellPopup, setShowShiftCellPopup] = useState(false)
  const [showRequestsModal, setShowRequestsModal] = useState(false)
  const [currentView, setCurrentView] = useState<'roster' | 'analysis'>('roster')
  const [selectedCellData, setSelectedCellData] = useState<{
    profileId: string
    date: string
    staffName: string
    currentShift?: string
    currentOvertimeHours?: number
  } | null>(null)

  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null)

  const { hasPermission } = useAuth()
  const canEdit = hasPermission('can_edit_roster')

  // Notification system
  const showNotification = useCallback((type: 'success' | 'error' | 'warning', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 5000)
  }, [])

  const getViewDateRange = useCallback(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    // Use UTC dates to avoid timezone issues
    // Create dates at noon UTC to ensure correct date regardless of timezone
    const startDate = new Date(Date.UTC(year, month, 1, 12, 0, 0))
    const endDate = new Date(Date.UTC(year, month + 1, 0, 12, 0, 0))
    return { startDate, endDate }
  }, [currentDate])

  // Data loading
  const loadData = useCallback(async () => {
    try {
      setLoading(true)

      let profileQuery = supabase
        .from('staff_profiles')
        .select('id, user_id, full_name, role, email, department, branch_assigned')
        .not('full_name', 'in', '("MITHUN","NIYAS","Mithun","Niyas")')

      if (activeBranch === 'calicut') {
        console.log('🔍 Filtering for Calicut branch')
        profileQuery = profileQuery.eq('branch_assigned', 'calicut')
      } else if (activeBranch === 'cochin') {
        console.log('🔍 Filtering for Cochin branch')
        profileQuery = profileQuery.eq('branch_assigned', 'cochin')
      } else {
        console.log('🔍 Loading all branches (Global mode)')
      }

      const { data: profiles, error: profilesError } = await profileQuery.order('full_name')

      console.log(`📊 Loaded ${profiles?.length || 0} staff profiles for ${activeBranch} branch`)

      if (profilesError) throw profilesError

      const mappedProfiles: StaffProfile[] = (profiles || []).map(profile => ({
        id: profile.id,
        user_id: profile.user_id,
        full_name: profile.full_name,
        role: profile.role,
        email: profile.email || '',
        department: profile.department,
        branch_assigned: profile.branch_assigned
      } as StaffProfile))

      setStaffProfiles(mappedProfiles)

      const { startDate, endDate } = getViewDateRange()

      const { data: scheduleData, error: scheduleError } = await supabase
        .from('roster_schedules')
        .select('id, profile_id, date, shift_code, overtime_hours, status, created_at, updated_at')
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
        .order('date')

      if (scheduleError) throw scheduleError
      setSchedules(scheduleData || [])

      const { data: requestData, error: requestError } = await supabase
        .from('leave_requests')
        .select('*')
        .order('created_at', { ascending: false })

      if (requestError) throw requestError
      setRequests(requestData || [])

    } catch (error) {
      console.error('Error loading data:', error)
      showNotification('error', `Failed to load data: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }, [activeBranch, getViewDateRange, showNotification])

  const getViewTitle = () => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]

    switch (viewMode) {
      case 'month':
      case 'list':
      default:
        return `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`
    }
  }

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)

    switch (viewMode) {
      case 'month':
      case 'list':
      default:
        newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1))
        break
    }

    setCurrentDate(newDate)
  }

  const getStaffName = (profileId: string): string => {
    const staff = staffProfiles.find(s => s.id === profileId)
    return staff?.full_name || 'Unknown Staff'
  }

  const updateVersionTracking = async (action: string) => {
    try {
      await supabase
        .from('roster_audit_log')
        .insert({
          action,
          performed_by: profile?.id || user?.id,
          performed_at: new Date().toISOString()
        })
    } catch (error) {
      console.error('Error in version tracking:', error)
    }
  }

  const handleCellClick = (profileId: string, date: Date) => {
    const dateStr = formatDateForIST(date)
    const staffMember = staffProfiles.find(s => s.id === profileId)
    const existingSchedule = schedules.find(s => s.profile_id === profileId && s.date === dateStr)

    setSelectedCellData({
      profileId,
      date: dateStr,
      staffName: staffMember?.full_name || 'Unknown',
      currentShift: existingSchedule?.shift_code || '',
      currentOvertimeHours: existingSchedule?.overtime_hours || 0
    })
    setShowShiftCellPopup(true)
  }

  const handleShiftCellSave = async (shiftData: { shift_code: string; overtime_hours: number }) => {
    if (!selectedCellData || !user || !canEdit) {
      showNotification('warning', 'Unable to save shift - permission or context issue')
      return
    }

    const scheduleData = {
      profile_id: selectedCellData.profileId,
      date: selectedCellData.date,
      shift_code: shiftData.shift_code,
      overtime_hours: shiftData.overtime_hours,
      status: 'confirmed',
      updated_at: new Date().toISOString()
    }

    const existingIndex = schedules.findIndex(s =>
      s.profile_id === selectedCellData.profileId && s.date === selectedCellData.date
    )

    const newSchedules = [...schedules]

    if (existingIndex > -1) {
      const existingSchedule = newSchedules[existingIndex]
      newSchedules[existingIndex] = { ...existingSchedule, ...scheduleData }
    } else {
      newSchedules.push({ ...scheduleData, id: 'temp-' + Date.now(), created_at: new Date().toISOString() })
    }

    setSchedules(newSchedules)

    try {
      if (existingIndex > -1) {
        const { error } = await supabase
          .from('roster_schedules')
          .update(scheduleData)
          .eq('id', schedules[existingIndex].id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('roster_schedules')
          .insert([{ ...scheduleData, created_at: new Date().toISOString() }])

        if (error) throw error
      }

      await updateVersionTracking(`Updated shift for ${selectedCellData.staffName}`)
      showNotification('success', 'Shift updated successfully!')
      loadData()
    } catch (error) {
      console.error('Error saving shift:', error)
      showNotification('error', `Failed to save shift: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setSchedules(schedules)
    }
  }

  const handleShiftCellDelete = async () => {
    if (!selectedCellData || !user || !canEdit) {
      showNotification('warning', 'Unable to delete shift - permission or context issue')
      return
    }

    try {
      const existing = schedules.find(s =>
        s.profile_id === selectedCellData.profileId && s.date === selectedCellData.date
      )

      if (existing) {
        const { error } = await supabase
          .from('roster_schedules')
          .delete()
          .eq('id', existing.id)

        if (error) throw error

        await updateVersionTracking(`Deleted shift for ${selectedCellData.staffName} on ${selectedCellData.date}`)
        await loadData()
        showNotification('success', 'Shift deleted successfully!')
      }
    } catch (error) {
      console.error('Error deleting shift:', error)
      showNotification('error', `Failed to delete shift: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Filter staff for current view
  const filteredStaff = staffProfiles.filter(staff => {
    if (selectedStaffFilter && staff.id !== selectedStaffFilter) {
      return false
    }
    return true
  })

  useEffect(() => {
    loadData()
  }, [activeBranch, currentDate, viewMode, loadData])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#e0e5ec]">
        <div className="neomorphic-card p-8 flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
          <p className="text-gray-600 font-medium">Loading roster data...</p>
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
              FETS Roster
            </h1>
            <p className="text-lg text-gray-600 font-medium">
              {activeBranch && activeBranch !== 'global' ? `${activeBranch.charAt(0).toUpperCase() + activeBranch.slice(1)} · ` : ''}Staff Scheduling & Management
            </p>
          </div>
          <div className="text-right">
            <p className="text-gray-500 font-semibold uppercase tracking-wider text-sm">
              {new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </motion.div>

        {/* Notification System */}
        {notification && (
          <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl neomorphic-card ${notification.type === 'success' ? 'border-l-4 border-l-green-500 text-green-700' :
            notification.type === 'error' ? 'border-l-4 border-l-red-500 text-red-700' :
              'border-l-4 border-l-yellow-500 text-yellow-700'
            }`}>
            <div className="flex items-center space-x-3">
              {notification.type === 'success' && <CheckCircle className="h-5 w-5" />}
              {notification.type === 'error' && <XCircle className="h-5 w-5" />}
              {notification.type === 'warning' && <AlertTriangle className="h-5 w-5" />}
              <span className="font-medium">{notification.message}</span>
            </div>
          </div>
        )}

        {/* Control Toolbar - Neumorphic */}
        <div className="neomorphic-card p-4 mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            {/* Date Navigation */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigateDate('prev')}
                className="neomorphic-btn-icon"
                title="Previous month"
              >
                <ChevronLeft className="h-5 w-5 text-gray-600" />
              </button>
              <h2 className="text-xl font-bold text-gray-700 min-w-[200px] text-center">{getViewTitle()}</h2>
              <button
                onClick={() => navigateDate('next')}
                className="neomorphic-btn-icon"
                title="Next month"
              >
                <ChevronRight className="h-5 w-5 text-gray-600" />
              </button>
            </div>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="neomorphic-btn px-4 py-2 text-sm font-semibold text-gray-600"
            >
              Today
            </button>
          </div>

          <div className="flex items-center space-x-4 flex-wrap gap-2">
            {/* View Mode Toggle */}
            <div className="neomorphic-inset p-1 rounded-xl flex items-center">
              <button
                onClick={() => setViewMode('month')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${viewMode === 'month' ? 'neomorphic-card text-amber-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Timeline
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${viewMode === 'list' ? 'neomorphic-card text-amber-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                List
              </button>
            </div>

            {/* Filter Button */}
            <div className="relative">
              <button
                onClick={() => setShowFilter(!showFilter)}
                className={`neomorphic-btn-icon ${showFilter ? 'text-amber-600' : 'text-gray-600'}`}
                title="Filter staff"
              >
                <Filter className="h-5 w-5" />
              </button>
              {showFilter && (
                <div className="absolute right-0 mt-2 w-64 neomorphic-card z-20 max-h-96 overflow-y-auto">
                  <div className="p-4">
                    <div className="text-xs font-bold text-gray-400 uppercase mb-3 tracking-wide">Filter by Staff</div>
                    <button
                      onClick={() => {
                        setSelectedStaffFilter('')
                        setShowFilter(false)
                      }}
                      className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 rounded-lg mb-2 font-medium transition-colors"
                    >
                      All Staff
                    </button>
                    {staffProfiles.map(staff => (
                      <button
                        key={staff.id}
                        onClick={() => {
                          setSelectedStaffFilter(staff.id)
                          setShowFilter(false)
                        }}
                        className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        {staff.full_name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Add & Analysis Buttons */}
            <button
              onClick={() => setShowQuickAddModal(true)}
              disabled={!canEdit}
              className="neomorphic-btn px-4 py-2 text-amber-700 flex items-center space-x-2 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Quick Add</span>
            </button>

            <button
              onClick={() => setCurrentView(currentView === 'analysis' ? 'roster' : 'analysis')}
              className={`neomorphic-btn px-4 py-2 flex items-center space-x-2 font-bold ${currentView === 'analysis' ? 'text-amber-700' : 'text-gray-600'}`}
            >
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Analysis</span>
            </button>
          </div>
        </div>

        {/* Main Content - Dynamic Views */}
        <div className="neomorphic-card p-6 min-h-[600px]">
          {currentView === 'roster' && viewMode === 'month' && (
            <MonthlyRosterTimeline
              staffProfiles={filteredStaff}
              schedules={schedules}
              currentDate={currentDate}
              onCellClick={handleCellClick}
            />
          )}
          {currentView === 'roster' && viewMode === 'list' && (
            <RosterListView
              schedules={schedules}
              staffProfiles={staffProfiles}
            />
          )}

          {currentView === 'analysis' && (
            <EnhancedAnalysisView
              schedules={schedules}
              staffProfiles={filteredStaff}
              requests={requests}
              currentDate={currentDate}
            />
          )}
        </div>
      </div>

      <EnhancedQuickAddModal
        isOpen={showQuickAddModal}
        onClose={() => setShowQuickAddModal(false)}
        onSuccess={() => loadData()}
        staffProfiles={staffProfiles}
        currentDate={currentDate}
      />

      {/* Enhanced Requests Modal */}
      <EnhancedRequestsModal
        isOpen={showRequestsModal}
        onClose={() => setShowRequestsModal(false)}
        onSuccess={() => loadData()}
        staffProfiles={filteredStaff}
      />

      {/* Shift Cell Popup */}
      <ShiftCellPopup
        isOpen={showShiftCellPopup}
        onClose={() => setShowShiftCellPopup(false)}
        onSave={handleShiftCellSave}
        onDelete={handleShiftCellDelete}
        currentShift={selectedCellData?.currentShift}
        currentOvertimeHours={selectedCellData?.currentOvertimeHours}
        staffName={selectedCellData?.staffName || ''}
        date={selectedCellData?.date || ''}
      />
    </div>
  )
}

export default FetsRosterPremium
