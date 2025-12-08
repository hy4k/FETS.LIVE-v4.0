import React, { useMemo } from 'react'
import { BarChart3, Clock, Users, Calendar, TrendingUp, AlertCircle } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useBranch } from '../hooks/useBranch'
import { LeaveRequest, Schedule, StaffProfile } from '../types/shared'

interface AnalysisViewProps {
  schedules: Schedule[]
  staffProfiles: StaffProfile[]
  requests: LeaveRequest[]
  currentDate: Date
}

export const EnhancedAnalysisView: React.FC<AnalysisViewProps> = ({
  schedules,
  staffProfiles,
  requests,
  currentDate
}) => {
  const { profile } = useAuth()
  const { activeBranch } = useBranch()

  // Calculate comprehensive analytics
  const analytics = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    // Filter schedules for current month
    const monthlySchedules = schedules.filter(s => {
      const scheduleDate = new Date(s.date)
      return scheduleDate.getMonth() === month && scheduleDate.getFullYear() === year
    })

    // Filter staff by active branch
    let filteredStaff = staffProfiles
    if (activeBranch !== 'global') {
      filteredStaff = staffProfiles.filter(s => s.branch_assigned === activeBranch)
    }

    // Filter schedules for branch staff
    const branchSchedules = monthlySchedules.filter(s =>
      filteredStaff.some(staff => staff.id === s.profile_id)
    )

    // Monthly requests for current month
    const monthlyRequests = requests.filter(r => {
      const requestDate = new Date(r.requested_date)
      return requestDate.getMonth() === month && requestDate.getFullYear() === year
    })

    // Calculate overtime statistics
    const overtimeStats = {
      totalOvertimeHours: branchSchedules.reduce((sum, s) => sum + (s.overtime_hours || 0), 0),
      overtimeShifts: branchSchedules.filter(s => s.overtime_hours && s.overtime_hours > 0).length,
      pureOvertimeShifts: branchSchedules.filter(s => s.shift_code === 'OT').length,
      averageOvertimePerShift: 0
    }

    const overtimeShiftsCount = branchSchedules.filter(s => s.overtime_hours && s.overtime_hours > 0).length
    overtimeStats.averageOvertimePerShift = overtimeShiftsCount > 0
      ? overtimeStats.totalOvertimeHours / overtimeShiftsCount
      : 0

    // Shift distribution
    const shiftDistribution = {
      dayShifts: branchSchedules.filter(s => s.shift_code === 'D').length,
      eveningShifts: branchSchedules.filter(s => s.shift_code === 'E').length,
      halfDays: branchSchedules.filter(s => s.shift_code === 'HD').length,
      restDays: branchSchedules.filter(s => s.shift_code === 'RD').length,
      leaveDays: branchSchedules.filter(s => s.shift_code === 'L').length,
      trainingDays: branchSchedules.filter(s => s.shift_code === 'T').length,
      overtimeDays: branchSchedules.filter(s => s.shift_code === 'OT').length
    }

    // Staff individual analytics
    const staffAnalytics = filteredStaff.map(staff => {
      const staffSchedules = branchSchedules.filter(s => s.profile_id === staff.id)
      const staffOvertimeHours = staffSchedules.reduce((sum, s) => sum + (s.overtime_hours || 0), 0)

      const dayShifts = staffSchedules.filter(s => s.shift_code === 'D').length
      const eveningShifts = staffSchedules.filter(s => s.shift_code === 'E').length
      const halfDays = staffSchedules.filter(s => s.shift_code === 'HD').length
      const trainingDays = staffSchedules.filter(s => s.shift_code === 'T').length
      const overtimeDays = staffSchedules.filter(s => s.shift_code === 'OT').length

      const effectiveWorkingDays = dayShifts + eveningShifts + trainingDays + overtimeDays + (halfDays * 0.5)

      return {
        ...staff,
        totalShifts: staffSchedules.length,
        effectiveWorkingDays,
        overtimeHours: staffOvertimeHours,
        dayShifts,
        eveningShifts,
        halfDays,
        restDays: staffSchedules.filter(s => s.shift_code === 'RD').length,
        leaveDays: staffSchedules.filter(s => s.shift_code === 'L').length
      }
    })

    // Request analytics
    const requestStats = {
      totalRequests: monthlyRequests.length,
      pendingRequests: monthlyRequests.filter(r => r.status === 'pending').length,
      approvedRequests: monthlyRequests.filter(r => r.status === 'approved').length,
      rejectedRequests: monthlyRequests.filter(r => r.status === 'rejected').length,
      leaveRequests: monthlyRequests.filter(r => r.request_type === 'leave').length,
      swapRequests: monthlyRequests.filter(r => r.request_type === 'shift_swap').length
    }

    // Efficiency metrics
    const totalPossibleShifts = filteredStaff.length * new Date(year, month + 1, 0).getDate()
    const totalEffectiveShifts = staffAnalytics.reduce((sum, s) => sum + s.effectiveWorkingDays, 0)
    const utilizationRate = totalPossibleShifts > 0 ? (totalEffectiveShifts / totalPossibleShifts) * 100 : 0

    return {
      overtimeStats,
      shiftDistribution,
      staffAnalytics,
      requestStats,
      totalStaff: filteredStaff.length,
      totalSchedules: branchSchedules.length,
      totalEffectiveShifts,
      utilizationRate,
      averageShiftsPerStaff: filteredStaff.length > 0 ? totalEffectiveShifts / filteredStaff.length : 0
    }
  }, [schedules, staffProfiles, requests, currentDate, activeBranch])

  // Get top performers (most overtime hours)
  const topPerformers = analytics.staffAnalytics
    .sort((a, b) => b.overtimeHours - a.overtimeHours)
    .slice(0, 5)

  // Get shift distribution percentage
  const totalWorkingShifts = analytics.shiftDistribution.dayShifts +
    analytics.shiftDistribution.eveningShifts +
    analytics.shiftDistribution.halfDays +
    analytics.shiftDistribution.trainingDays +
    analytics.shiftDistribution.overtimeDays

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-white/20 shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center mb-2">
          <BarChart3 className="h-6 w-6 mr-2 text-purple-500" />
          Workforce Analytics
        </h2>
        <p className="text-gray-600">
          {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} -
          {activeBranch === 'global' ? 'All Centers' :
            activeBranch === 'calicut' ? 'Calicut Center' : 'Cochin Center'}
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-white/20 shadow-lg p-6 text-center">
          <Users className="h-8 w-8 text-blue-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-blue-600">{analytics.totalStaff}</div>
          <div className="text-sm text-blue-700">Total Staff</div>
        </div>

        <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-white/20 shadow-lg p-6 text-center">
          <Calendar className="h-8 w-8 text-green-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-green-600">
            {Number.isInteger(analytics.totalEffectiveShifts)
              ? analytics.totalEffectiveShifts
              : analytics.totalEffectiveShifts.toFixed(1)}
          </div>
          <div className="text-sm text-green-700">Total Shifts (Effective)</div>
        </div>

        <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-white/20 shadow-lg p-6 text-center">
          <Clock className="h-8 w-8 text-purple-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-purple-600">{analytics.overtimeStats.totalOvertimeHours}</div>
          <div className="text-sm text-purple-700">OT Hours</div>
        </div>

        <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-white/20 shadow-lg p-6 text-center">
          <TrendingUp className="h-8 w-8 text-orange-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-orange-600">{analytics.utilizationRate.toFixed(1)}%</div>
          <div className="text-sm text-orange-700">Utilization</div>
        </div>
      </div>

      {/* Overtime Analytics */}
      <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-white/20 shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Clock className="h-5 w-5 mr-2 text-purple-500" />
          Overtime Analytics
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-4 bg-purple-50/50 rounded-lg">
            <div className="text-xl font-bold text-purple-600">{analytics.overtimeStats.totalOvertimeHours}</div>
            <div className="text-sm text-purple-700">Total OT Hours</div>
          </div>

          <div className="text-center p-4 bg-purple-50/50 rounded-lg">
            <div className="text-xl font-bold text-purple-600">{analytics.overtimeStats.overtimeShifts}</div>
            <div className="text-sm text-purple-700">Shifts with OT</div>
          </div>

          <div className="text-center p-4 bg-purple-50/50 rounded-lg">
            <div className="text-xl font-bold text-purple-600">{analytics.overtimeStats.pureOvertimeShifts}</div>
            <div className="text-sm text-purple-700">Pure OT Shifts</div>
          </div>

          <div className="text-center p-4 bg-purple-50/50 rounded-lg">
            <div className="text-xl font-bold text-purple-600">{analytics.overtimeStats.averageOvertimePerShift.toFixed(1)}</div>
            <div className="text-sm text-purple-700">Avg OT/Shift</div>
          </div>
        </div>

        {/* Top Overtime Performers */}
        {topPerformers.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Top Overtime Contributors</h4>
            <div className="space-y-2">
              {topPerformers.map((staff, index) => (
                <div key={staff.id} className="flex items-center justify-between p-3 bg-gray-50/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${index === 0 ? 'bg-yellow-400 text-yellow-900' :
                      index === 1 ? 'bg-gray-300 text-gray-700' :
                        index === 2 ? 'bg-orange-300 text-orange-900' :
                          'bg-blue-100 text-blue-700'
                      }`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{staff.full_name}</div>
                      <div className="text-sm text-gray-600">{staff.role}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-purple-600">{staff.overtimeHours}h</div>
                    <div className="text-sm text-gray-600">{staff.totalShifts} shifts</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Shift Distribution */}
      <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-white/20 shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <BarChart3 className="h-5 w-5 mr-2 text-blue-500" />
          Shift Distribution
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { key: 'dayShifts', label: 'Day', color: 'bg-blue-500', value: analytics.shiftDistribution.dayShifts },
            { key: 'eveningShifts', label: 'Evening', color: 'bg-green-500', value: analytics.shiftDistribution.eveningShifts },
            { key: 'halfDays', label: 'Half Day', color: 'bg-orange-500', value: analytics.shiftDistribution.halfDays },
            { key: 'restDays', label: 'Rest', color: 'bg-gray-400', value: analytics.shiftDistribution.restDays },
            { key: 'leaveDays', label: 'Leave', color: 'bg-red-500', value: analytics.shiftDistribution.leaveDays },
            { key: 'trainingDays', label: 'Training', color: 'bg-gray-500', value: analytics.shiftDistribution.trainingDays },
            { key: 'overtimeDays', label: 'Overtime', color: 'bg-purple-500', value: analytics.shiftDistribution.overtimeDays }
          ].map(({ key, label, color, value }) => {
            const percentage = totalWorkingShifts > 0 ? (value / analytics.totalSchedules) * 100 : 0
            return (
              <div key={key} className="text-center p-3 bg-gray-50/50 rounded-lg">
                <div className={`w-8 h-8 ${color} rounded-lg mx-auto mb-2 flex items-center justify-center`}>
                  <span className="text-white text-xs font-bold">{label.charAt(0)}</span>
                </div>
                <div className="text-lg font-bold text-gray-900">{value}</div>
                <div className="text-xs text-gray-600">{percentage.toFixed(1)}%</div>
                <div className="text-xs text-gray-500">{label}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Request Statistics */}
      <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-white/20 shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <AlertCircle className="h-5 w-5 mr-2 text-yellow-500" />
          Request Analytics
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="text-center p-3 bg-blue-50/50 rounded-lg">
            <div className="text-xl font-bold text-blue-600">{analytics.requestStats.totalRequests}</div>
            <div className="text-sm text-blue-700">Total Requests</div>
          </div>

          <div className="text-center p-3 bg-yellow-50/50 rounded-lg">
            <div className="text-xl font-bold text-yellow-600">{analytics.requestStats.pendingRequests}</div>
            <div className="text-sm text-yellow-700">Pending</div>
          </div>

          <div className="text-center p-3 bg-green-50/50 rounded-lg">
            <div className="text-xl font-bold text-green-600">{analytics.requestStats.approvedRequests}</div>
            <div className="text-sm text-green-700">Approved</div>
          </div>

          <div className="text-center p-3 bg-red-50/50 rounded-lg">
            <div className="text-xl font-bold text-red-600">{analytics.requestStats.rejectedRequests}</div>
            <div className="text-sm text-red-700">Rejected</div>
          </div>

          <div className="text-center p-3 bg-purple-50/50 rounded-lg">
            <div className="text-xl font-bold text-purple-600">{analytics.requestStats.leaveRequests}</div>
            <div className="text-sm text-purple-700">Leave Requests</div>
          </div>

          <div className="text-center p-3 bg-indigo-50/50 rounded-lg">
            <div className="text-xl font-bold text-indigo-600">{analytics.requestStats.swapRequests}</div>
            <div className="text-sm text-indigo-700">Swap Requests</div>
          </div>
        </div>
      </div>

      {/* Staff Performance Summary */}
      <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-white/20 shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Users className="h-5 w-5 mr-2 text-green-500" />
          Staff Performance Summary
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200/50">
                <th className="text-left py-2 px-3 font-semibold text-gray-700">Staff Member</th>
                <th className="text-center py-2 px-3 font-semibold text-gray-700">Total Shifts</th>
                <th className="text-center py-2 px-3 font-semibold text-gray-700">Day</th>
                <th className="text-center py-2 px-3 font-semibold text-gray-700">Evening</th>
                <th className="text-center py-2 px-3 font-semibold text-gray-700">Rest</th>
                <th className="text-center py-2 px-3 font-semibold text-gray-700">Leave</th>
                <th className="text-center py-2 px-3 font-semibold text-gray-700">OT Hours</th>
              </tr>
            </thead>
            <tbody>
              {analytics.staffAnalytics.map((staff) => (
                <tr key={staff.id} className="border-b border-gray-100/50 hover:bg-gray-50/30">
                  <td className="py-3 px-3">
                    <div className="font-medium text-gray-900">{staff.full_name}</div>
                    <div className="text-sm text-gray-600">{staff.role}</div>
                  </td>
                  <td className="text-center py-3 px-3 font-semibold text-blue-600">{staff.totalShifts}</td>
                  <td className="text-center py-3 px-3 text-blue-700">{staff.dayShifts}</td>
                  <td className="text-center py-3 px-3 text-green-700">{staff.eveningShifts}</td>
                  <td className="text-center py-3 px-3 text-gray-600">{staff.restDays}</td>
                  <td className="text-center py-3 px-3 text-red-600">{staff.leaveDays}</td>
                  <td className="text-center py-3 px-3 font-semibold text-purple-600">{staff.overtimeHours}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {analytics.staffAnalytics.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No staff data available for the selected period.
          </div>
        )}
      </div>
    </div>
  )
}