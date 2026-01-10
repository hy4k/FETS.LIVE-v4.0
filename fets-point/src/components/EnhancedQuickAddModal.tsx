import React, { useState, useMemo } from 'react'
import { X, Calendar, User, ArrowRight, Check, AlertTriangle, Briefcase } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { StaffProfile, SHIFT_CODES } from '../types/shared'
import { useAuth } from '../hooks/useAuth'

interface QuickAddModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  staffProfiles: StaffProfile[]
  currentDate: Date
}

export const EnhancedQuickAddModal: React.FC<QuickAddModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  staffProfiles,
  currentDate
}) => {
  const { user } = useAuth()
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([])
  const [workShift, setWorkShift] = useState('D')
  const [patternStartDate, setPatternStartDate] = useState(
    new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().split('T')[0]
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  // Calculate stats for preview
  const previewStats = useMemo(() => {
    if (!selectedStaffIds.length) return null

    const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
    const daysInMonth = end.getDate()

    // Pattern logic: 6-1
    // We need to determine the cycle based on patternStartDate
    const anchor = new Date(patternStartDate)

    let workDays = 0
    let restDays = 0

    for (let i = 1; i <= daysInMonth; i++) {
      const current = new Date(currentDate.getFullYear(), currentDate.getMonth(), i)
      // Diff in days from anchor
      const diffTime = current.getTime() - anchor.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      // If diffDays is negative, we reverse modulo logic, but let's assume valid start
      // Cycle is 7 days. Day 0-5 = Work, Day 6 = Rest
      // We use modulo 7.
      const mod = ((diffDays % 7) + 7) % 7

      if (mod === 6) restDays++
      else workDays++
    }

    return {
      totalShifts: daysInMonth * selectedStaffIds.length,
      shiftsPerStaff: workDays,
      restPerStaff: restDays
    }
  }, [selectedStaffIds, currentDate, patternStartDate])

  const handleGenerate = async () => {
    if (!selectedStaffIds.length) return
    setIsSubmitting(true)

    try {
      const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
      const anchor = new Date(patternStartDate)
      const newSchedules = []

      for (const staffId of selectedStaffIds) {
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          // Determine pattern for current date 'd'
          const isoDate = d.toISOString().split('T')[0]
          const diffTime = d.getTime() - anchor.getTime()
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
          const mod = ((diffDays % 7) + 7) % 7

          const isRestDay = mod === 6
          const code = isRestDay ? 'RD' : workShift

          newSchedules.push({
            profile_id: staffId,
            date: isoDate,
            shift_code: code,
            created_by: user?.id,
            branch_id: staffProfiles.find(s => s.id === staffId)?.branch_assigned
          })
        }
      }

      // Batch upsert functionality
      const { error } = await supabase
        .from('roster_schedules')
        .upsert(newSchedules, { onConflict: 'profile_id,date' })

      if (error) throw error

      onSuccess()
      onClose()
    } catch (err) {
      console.error("Error generating roster:", err)
      alert("Failed to generate roster. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 backdrop-blur-sm bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex justify-between items-center shrink-0">
          <div>
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Auto-Schedule Generator
            </h3>
            <p className="text-blue-100 text-sm mt-1">Generate 6-1 roster pattern for {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* content */}
        <div className="p-6 overflow-y-auto space-y-6">

          {/* 1. Staff Selection */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
              <User className="w-4 h-4 text-blue-500" /> Select Staff
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border border-gray-100 rounded-xl bg-gray-50">
              {staffProfiles.map(staff => (
                <label key={staff.id} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all border ${selectedStaffIds.includes(staff.id) ? 'bg-blue-50 border-blue-200 shadow-sm' : 'hover:bg-gray-100 border-transparent'}`}>
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded text-blue-600 accent-blue-600"
                    checked={selectedStaffIds.includes(staff.id)}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedStaffIds([...selectedStaffIds, staff.id])
                      else setSelectedStaffIds(selectedStaffIds.filter(id => id !== staff.id))
                    }}
                  />
                  <span className="text-sm font-medium text-gray-700 truncate">{staff.full_name}</span>
                </label>
              ))}
            </div>
            {selectedStaffIds.length > 0 && (
              <div className="text-xs text-blue-600 font-medium px-1">
                {selectedStaffIds.length} staff members selected
              </div>
            )}
          </div>

          <div className="w-full h-px bg-gray-100"></div>

          {/* 2. Pattern Configuration */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 uppercase tracking-wide">Work Shift</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setWorkShift('D')}
                  className={`flex-1 py-2 rounded-xl font-bold transition-all border ${workShift === 'D' ? 'bg-yellow-100 border-yellow-300 text-yellow-800' : 'bg-white border-gray-200 text-gray-400'}`}
                >
                  Day (D)
                </button>
                <button
                  onClick={() => setWorkShift('E')}
                  className={`flex-1 py-2 rounded-xl font-bold transition-all border ${workShift === 'E' ? 'bg-orange-100 border-orange-300 text-orange-800' : 'bg-white border-gray-200 text-gray-400'}`}
                >
                  Eve (E)
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 uppercase tracking-wide">Pattern Start</label>
              <input
                type="date"
                value={patternStartDate}
                onChange={(e) => setPatternStartDate(e.target.value)}
                className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm font-medium"
              />
              <p className="text-[10px] text-gray-500 leading-tight">Cycle anchor for 6-1 pattern.</p>
            </div>
          </div>

          {/* Pattern Preview Card */}
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-4 border border-blue-100 flex items-start gap-3">
            <Briefcase className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-indigo-900">Pattern: 6 Work - 1 Rest</h4>
              <p className="text-xs text-indigo-700 mt-1">
                Staff will work <span className="font-bold">{workShift}</span> shifts for 6 days, followed by 1 <span className="font-bold">Rest Day</span>. Pattern repeats weekly starting from {new Date(patternStartDate).toLocaleDateString()}.
              </p>
            </div>
          </div>

          {/* Stats Preview */}
          {previewStats && (
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-gray-50 p-2 rounded-lg">
                <span className="block font-bold text-gray-900">{previewStats.shiftsPerStaff}</span>
                <span className="text-gray-500">Work Days/Staff</span>
              </div>
              <div className="bg-gray-50 p-2 rounded-lg">
                <span className="block font-bold text-gray-900">{previewStats.restPerStaff}</span>
                <span className="text-gray-500">Rest Days/Staff</span>
              </div>
              <div className="bg-gray-50 p-2 rounded-lg">
                <span className="block font-bold text-gray-900">{previewStats.totalShifts}</span>
                <span className="text-gray-500">Total Entries</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 bg-gray-50/50 flex gap-3 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={isSubmitting || !selectedStaffIds.length}
            className="flex-[2] py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              'Generating...'
            ) : (
              <>
                <Check className="w-5 h-5" /> Generate Roster
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  )
}