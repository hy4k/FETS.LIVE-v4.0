import React, { useState, useEffect, useCallback } from 'react'
import { X, Users, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useBranch } from '../hooks/useBranch'
import toast from 'react-hot-toast'
import { Database } from '../types/database.types'

type StaffProfile = Database['public']['Tables']['staff_profiles']['Row']
// LeaveRequest type not used explicitly as type but implied. No export needed if using inference or explicit typing in map.

interface ShiftSwapModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface SwapRequest {
  id: string
  requestor_id: string
  requestor_name: string
  target_id: string
  target_name: string
  request_date: string
  status: 'pending' | 'approved' | 'rejected'
  reason?: string
  created_at: string
}

export const ShiftSwapModal: React.FC<ShiftSwapModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { profile } = useAuth()
  const { activeBranch } = useBranch()
  const [activeTab, setActiveTab] = useState<'create' | 'pending'>('create')
  const [staffProfiles, setStaffProfiles] = useState<StaffProfile[]>([])
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTargetStaff, setSelectedTargetStaff] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [swapRequests, setSwapRequests] = useState<SwapRequest[]>([])

  const loadStaffProfiles = useCallback(async () => {
    try {
      let query = supabase
        .from('staff_profiles')
        .select('id, full_name, role, branch_assigned')
        .not('full_name', 'in', '("MITHUN","NIYAS","Mithun","Niyas")')
        .neq('id', profile?.id) // Exclude current user

      // Apply branch filtering
      if (activeBranch !== 'global') {
        query = query.eq('branch_assigned', activeBranch)
      }

      const { data, error } = await query.order('full_name')
      if (error) throw error

      setStaffProfiles((data as any) || [])
    } catch (error) {
      console.error('Error loading staff:', error)
      toast.error('Failed to load staff profiles')
    }
  }, [activeBranch, profile])

  const loadSwapRequests = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('leave_requests')
        .select(`
          id,
          user_id,
          requested_date,
          swap_with_user_id,
          reason,
          status,
          created_at,
          profiles:staff_profiles!leave_requests_user_id_fkey(full_name),
          target_profiles:staff_profiles!leave_requests_swap_with_user_id_fkey(full_name)
        `)
        .eq('request_type', 'shift_swap')
        .order('created_at', { ascending: false })

      if (error) throw error

      const mappedRequests: SwapRequest[] = (data || []).map((req: any) => {
        return {
          id: req.id,
          requestor_id: req.user_id,
          requestor_name: req.profiles?.full_name || 'Unknown',
          target_id: req.swap_with_user_id || '',
          target_name: req.target_profiles?.full_name || 'Unknown',
          request_date: req.requested_date,
          status: req.status as 'pending' | 'approved' | 'rejected',
          reason: req.reason,
          created_at: req.created_at
        }
      })

      setSwapRequests(mappedRequests)
    } catch (error) {
      console.error('Error loading swap requests:', error)
      toast.error('Failed to load swap requests')
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      loadStaffProfiles()
      loadSwapRequests()
    }
  }, [isOpen, activeBranch, loadStaffProfiles, loadSwapRequests])

  const createSwapRequest = async () => {
    if (!selectedDate || !selectedTargetStaff) {
      toast.error('Please select date and target staff')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('leave_requests')
        .insert({
          user_id: profile?.id,
          request_type: 'shift_swap',
          requested_date: selectedDate,
          swap_with_user_id: selectedTargetStaff,
          reason: reason,
          status: 'pending'
        })

      if (error) throw error

      toast.success('Shift swap request created successfully')
      setSelectedDate('')
      setSelectedTargetStaff('')
      setReason('')
      loadSwapRequests()
      setActiveTab('pending')
    } catch (error) {
      console.error('Error creating swap request:', error)
      toast.error('Failed to create swap request')
    } finally {
      setLoading(false)
    }
  }

  const handleSwapApproval = async (requestId: string, approved: boolean) => {
    setLoading(true)
    try {
      const request = swapRequests.find(r => r.id === requestId)
      if (!request) return

      // Update request status
      const { error: updateError } = await supabase
        .from('leave_requests')
        .update({
          status: approved ? 'approved' : 'rejected',
          approved_by: profile?.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', requestId)

      if (updateError) throw updateError

      if (approved) {
        // Auto-swap the rosters for the requested date
        await performAutoSwap(request.requestor_id, request.target_id, request.request_date)

        // Log the swap in audit trail
        await supabase
          .from('roster_audit_log')
          .insert({
            action: 'shift_swap',
            details: `Automatic swap between ${request.requestor_name} and ${request.target_name} for ${request.request_date}`,
            performed_by: profile?.id,
            affected_date: request.request_date
          })
      }

      toast.success(approved ? 'Shift swap approved and executed' : 'Shift swap rejected')
      loadSwapRequests()
      onSuccess()
    } catch (error) {
      console.error('Error handling swap approval:', error)
      toast.error('Failed to process swap request')
    } finally {
      setLoading(false)
    }
  }

  const performAutoSwap = async (user1Id: string, user2Id: string, date: string) => {
    // Get current shifts for both users on the specified date
    const { data: shifts, error: fetchError } = await supabase
      .from('roster_schedules')
      .select('*')
      .in('profile_id', [user1Id, user2Id])
      .eq('date', date)

    if (fetchError) throw fetchError

    const user1Shift = shifts?.find(s => s.profile_id === user1Id)
    const user2Shift = shifts?.find(s => s.profile_id === user2Id)

    // Delete existing shifts
    if (shifts && shifts.length > 0) {
      const { error: deleteError } = await supabase
        .from('roster_schedules')
        .delete()
        .in('id', shifts.map(s => s.id))

      if (deleteError) throw deleteError
    }

    // Create swapped shifts
    const newShifts = []

    if (user1Shift) {
      newShifts.push({
        profile_id: user2Id,
        date: date,
        shift_code: user1Shift.shift_code,
        overtime_hours: user1Shift.overtime_hours || 0,
        status: 'confirmed'
      })
    }

    if (user2Shift) {
      newShifts.push({
        profile_id: user1Id,
        date: date,
        shift_code: user2Shift.shift_code,
        overtime_hours: user2Shift.overtime_hours || 0,
        status: 'confirmed'
      })
    }

    if (newShifts.length > 0) {
      const { error: insertError } = await supabase
        .from('roster_schedules')
        .insert(newShifts)

      if (insertError) throw insertError
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 backdrop-blur-sm bg-black/20"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200/50">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Shift Swap Management
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100/50 rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex mt-4 space-x-1 bg-gray-100/50 rounded-xl p-1">
            <button
              onClick={() => setActiveTab('create')}
              className={`flex-1 py-2 px-4 rounded-lg transition-colors ${activeTab === 'create'
                ? 'bg-white shadow-sm text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Create Request
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`flex-1 py-2 px-4 rounded-lg transition-colors ${activeTab === 'pending'
                ? 'bg-white shadow-sm text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Pending Requests
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4 max-h-96 overflow-y-auto">
          {activeTab === 'create' ? (
            <div className="space-y-4">
              {/* Date Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none"
                />
              </div>

              {/* Target Staff Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Target Staff Member</label>
                <select
                  value={selectedTargetStaff}
                  onChange={(e) => setSelectedTargetStaff(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none"
                >
                  <option value="">Select staff member to swap with</option>
                  {staffProfiles.map(staff => (
                    <option key={staff.id} value={staff.id}>
                      {staff.full_name} - {staff.role}
                    </option>
                  ))}
                </select>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reason (Optional)</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Please provide a reason for the shift swap..."
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none resize-none"
                />
              </div>

              {/* Submit Button */}
              <button
                onClick={createSwapRequest}
                disabled={loading || !selectedDate || !selectedTargetStaff}
                className="w-full py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-xl transition-colors flex items-center justify-center space-x-2"
              >
                <Users className="h-4 w-4" />
                <span>{loading ? 'Creating...' : 'Create Swap Request'}</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {swapRequests.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No pending swap requests</p>
                </div>
              ) : (
                swapRequests.map(request => (
                  <div key={request.id} className="p-4 bg-gray-50/50 rounded-xl border border-gray-200/50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Users className="h-4 w-4 text-blue-500" />
                          <span className="font-medium text-gray-900">
                            {request.requestor_name} ↔ {request.target_name}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            request.status === 'approved' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                            {request.status}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>{request.request_date}</span>
                          </div>
                          <span>•</span>
                          <span>{new Date(request.created_at).toLocaleDateString()}</span>
                        </div>
                        {request.reason && (
                          <p className="text-sm text-gray-600 mt-2 italic">{request.reason}</p>
                        )}
                      </div>

                      {request.status === 'pending' && (
                        <div className="flex space-x-2 ml-4">
                          <button
                            onClick={() => handleSwapApproval(request.id, true)}
                            disabled={loading}
                            className="p-2 bg-green-100 hover:bg-green-200 text-green-600 rounded-lg transition-colors"
                            title="Approve"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleSwapApproval(request.id, false)}
                            disabled={loading}
                            className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors"
                            title="Reject"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}