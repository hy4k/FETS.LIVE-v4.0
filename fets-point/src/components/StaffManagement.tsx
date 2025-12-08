import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  Search,
  Filter,
  Plus,
  Edit3,
  Save,
  X,
  MapPin,
  Shield,
  Building,
  UserCheck,
  Trash2,
  AlertTriangle
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useBranch } from '../hooks/useBranch'
import { toast } from 'react-hot-toast'
import { useStaff, useStaffMutations } from '../hooks/useStaffManagement'
import { ProfilePictureUpload } from './ProfilePictureUpload'
import { StaffProfile } from '../types/database.types'

interface BaseCentreBadgeProps {
  centre: 'calicut' | 'cochin' | null
  size?: 'sm' | 'md'
}

function BaseCentreBadge({ centre, size = 'sm' }: BaseCentreBadgeProps) {
  if (!centre) {
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
        <Shield className="w-3 h-3 mr-1" />
        Global Access
      </span>
    )
  }

  const configMap: Record<string, { bg: string; text: string; border: string; name: string }> = {
    calicut: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
      border: 'border-yellow-200',
      name: 'Calicut'
    },
    cochin: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      border: 'border-green-200',
      name: 'Cochin'
    },
    irinjalakuda: {
      bg: 'bg-blue-100',
      text: 'text-blue-800',
      border: 'border-blue-200',
      name: 'Irinjalakuda'
    },
    kodungallur: {
      bg: 'bg-purple-100',
      text: 'text-purple-800',
      border: 'border-purple-200',
      name: 'Kodungallur'
    }
  }

  const config = configMap[centre] || {
    bg: 'bg-gray-100',
    text: 'text-gray-800',
    border: 'border-gray-200',
    name: centre || 'Unknown'
  }

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text} ${config.border} border`}>
      <MapPin className="w-3 h-3 mr-1" />
      {config.name}
    </span>
  )
}

interface EditStaffModalProps {
  staff: StaffProfile | null
  isOpen: boolean
  onClose: () => void
  onSave: (updatedStaff: Partial<StaffProfile>) => void
  onDelete: (staffId: string) => void
  isSuperAdmin: boolean
}

interface DeleteConfirmationModalProps {
  staff: StaffProfile
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

function DeleteConfirmationModal({ staff, isOpen, onClose, onConfirm }: DeleteConfirmationModalProps) {
  const [nameInput, setNameInput] = useState('')
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)

  const handleConfirm = async () => {
    if (nameInput.trim() !== staff.full_name) {
      setError('Entered name does not match. Please try again.')
      return
    }

    setDeleting(true)
    try {
      await onConfirm()
      onClose()
    } catch (error) {
      setError('Failed to delete staff member')
    } finally {
      setDeleting(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      setNameInput('')
      setError('')
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]" onClick={onClose} />
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full border-2 border-red-200"
        >
          <div className="p-6 border-b border-red-100 bg-red-50">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-red-900">Delete Staff Member</h3>
                <p className="text-sm text-red-700">This action cannot be undone</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-sm text-amber-800 font-medium mb-2">
                Are you sure you want to permanently delete this staff member?
              </p>
              <p className="text-xs text-amber-700">
                This will remove them from all active staff lists, user login/permissions, and future assignments. Historical data will remain intact.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                To confirm, type the staff member's exact name:
              </label>
              <div className="text-sm font-medium text-gray-900 mb-2 p-2 bg-gray-100 rounded">
                {staff.full_name}
              </div>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => {
                  setNameInput(e.target.value)
                  setError('')
                }}
                placeholder="Enter staff name to confirm"
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 ${error ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
              />
              {error && (
                <p className="text-sm text-red-600 mt-2 flex items-center space-x-1">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{error}</span>
                </p>
              )}
            </div>
          </div>

          <div className="p-6 border-t border-gray-200 flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={deleting || nameInput.trim() !== staff.full_name}
              className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {deleting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Permanently</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </>
  )
}

function EditStaffModal({ staff, isOpen, onClose, onSave, onDelete, isSuperAdmin }: EditStaffModalProps) {
  const [formData, setFormData] = useState<Partial<StaffProfile>>({})
  const [saving, setSaving] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  useEffect(() => {
    if (staff) {
      setFormData({
        full_name: staff.full_name,
        role: staff.role,
        department: staff.department,
        branch_assigned: staff.branch_assigned
      })
    }
  }, [staff])

  const handleSave = async () => {
    if (!staff) return

    setSaving(true)
    try {
      await onSave(formData)
      onClose()
      toast.success('Staff member updated successfully')
    } catch (error) {
      toast.error('Failed to update staff member')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!staff) return

    try {
      await onDelete(staff.id)
      toast.success(`Staff member ${staff.full_name} has been successfully deleted`)
      onClose()
    } catch (error) {
      toast.error('Failed to delete staff member')
    }
  }

  if (!isOpen || !staff) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden"
        >
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Edit Staff Member</h3>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={formData.full_name || ''}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <input
                type="text"
                value={formData.role || ''}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department
              </label>
              <input
                type="text"
                value={formData.department || ''}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Base Centre
              </label>
              <select
                value={formData.branch_assigned || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  branch_assigned: e.target.value as 'calicut' | 'cochin' | null
                })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Base Centre</option>
                <option value="calicut">Calicut Centre</option>
                <option value="cochin">Cochin Centre</option>
              </select>
            </div>
          </div>

          <div className="p-6 border-t border-gray-200">
            <div className="flex space-x-3 mb-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
            {isSuperAdmin && (
              <button
                onClick={() => setShowDeleteModal(true)}
                className="w-full px-4 py-3 text-red-700 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 font-medium transition-colors flex items-center justify-center space-x-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Staff Member</span>
              </button>
            )}
          </div>

          <AnimatePresence>
            {showDeleteModal && (
              <DeleteConfirmationModal
                staff={staff}
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDelete}
              />
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </>
  )
}

interface AddStaffModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (newStaff: Omit<StaffProfile, 'id' | 'created_at'>) => void
}

function AddStaffModal({ isOpen, onClose, onSuccess }: AddStaffModalProps) {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'staff',
    department: 'Operations',
    branch_assigned: 'calicut' as 'calicut' | 'cochin' | null,
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!formData.full_name || !formData.email || !formData.password) {
      toast.error('Full Name, Email, and Password are required.')
      return
    }

    setSaving(true)
    try {
      await onSuccess(formData)
      onClose()
    } catch (error: any) {
      // Error toast is already handled by the mutation hook
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
        >
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-900">Add New Staff Member</h3>
          </div>
          <div className="p-6 space-y-4">
            {/* Form fields for new staff */}
            <input type="text" placeholder="Full Name" value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-xl" />
            <input type="email" placeholder="Email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-xl" />
            <input type="password" placeholder="Set Initial Password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-xl" />
            <input type="text" placeholder="Role (e.g., staff, admin)" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-xl" />
            <input type="text" placeholder="Department" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-xl" />
            <select value={formData.branch_assigned || ''} onChange={(e) => setFormData({ ...formData, branch_assigned: e.target.value as 'calicut' | 'cochin' | null })} className="w-full px-4 py-3 border border-gray-300 rounded-xl">
              <option value="calicut">Calicut Centre</option>
              <option value="cochin">Cochin Centre</option>
              <option value="">Global Access</option>
            </select>
          </div>
          <div className="p-6 border-t border-gray-200 flex space-x-3">
            <button onClick={onClose} className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 font-medium">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium disabled:opacity-50">
              {saving ? 'Saving...' : 'Add Staff'}
            </button>
          </div>
        </motion.div>
      </div>
    </>
  )
}

export function StaffManagement() {
  const { activeBranch, userAccessLevel } = useBranch()
  const { data: staff = [], isLoading, isError, error } = useStaff()
  const { addStaff, updateStaff, deleteStaff, isAdding, isUpdating, isDeleting } = useStaffMutations()

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCentre, setSelectedCentre] = useState<string>('all')
  const [editingStaff, setEditingStaff] = useState<StaffProfile | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    if (isError) {
      toast.error(`Failed to load staff: ${error.message}`)
    }
  }, [isError, error])

  const filteredStaff = useMemo(() => {
    return staff
      .filter(s => {
        if (!searchTerm) return true
        const lowerSearch = searchTerm.toLowerCase()
        return (
          s.full_name.toLowerCase().includes(lowerSearch) ||
          s.role.toLowerCase().includes(lowerSearch) ||
          s.department.toLowerCase().includes(lowerSearch)
        )
      })
      .filter(s => {
        if (selectedCentre === 'all') return true
        if (selectedCentre === 'global') return !s.branch_assigned
        return s.branch_assigned === selectedCentre
      })
      .filter(s => {
        if (userAccessLevel === 'admin' && activeBranch !== 'global') {
          return s.branch_assigned === activeBranch || s.role === 'super_admin'
        }
        return true
      })
  }, [staff, searchTerm, selectedCentre, activeBranch, userAccessLevel])

  const handleEditStaff = (staffMember: StaffProfile) => {
    setEditingStaff(staffMember)
    setShowEditModal(true)
  }

  const handleSaveStaff = async (updatedData: Partial<Omit<StaffProfile, 'id'>>) => {
    if (!editingStaff) return
    await updateStaff({ id: editingStaff.id, ...updatedData })
    setShowEditModal(false)
    setEditingStaff(null)
  }

  const handleDeleteStaff = async (staffId: string) => {
    await deleteStaff(staffId)
    setShowEditModal(false)
    setEditingStaff(null)
  }

  const handleAddStaff = async (newStaffData: Omit<StaffProfile, 'id' | 'created_at'> & { password?: string }) => {
    await addStaff(newStaffData)
    setShowAddModal(false)
  }

  const getStaffStats = () => {
    const total = filteredStaff.length
    const calicut = filteredStaff.filter(s => s.branch_assigned === 'calicut').length
    const cochin = filteredStaff.filter(s => s.branch_assigned === 'cochin').length
    const global = filteredStaff.filter(s => !s.branch_assigned).length

    return { total, calicut, cochin, global }
  }

  const stats = getStaffStats()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2 uppercase text-gold-gradient">Staff Directory</h1>
          <p className="text-gray-600 mt-1">Manage staff assignments and base centre allocations</p>
        </div>
        {userAccessLevel === 'super_admin' && (
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center space-x-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Staff</span>
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center space-x-3">
            <Users className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Total Staff</p>
              <p className="text-xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center space-x-3">
            <Building className="w-8 h-8 text-yellow-600" />
            <div>
              <p className="text-sm text-gray-600">Calicut Centre</p>
              <p className="text-xl font-bold text-gray-900">{stats.calicut}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center space-x-3">
            <Building className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Cochin Centre</p>
              <p className="text-xl font-bold text-gray-900">{stats.cochin}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center space-x-3">
            <Shield className="w-8 h-8 text-purple-600" />
            <div>
              <p className="text-sm text-gray-600">Global Access</p>
              <p className="text-xl font-bold text-gray-900">{stats.global}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search staff by name, role, or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="md:w-64">
            <select
              value={selectedCentre}
              onChange={(e) => setSelectedCentre(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Centres</option>
              <option value="calicut">Calicut Centre</option>
              <option value="cochin">Cochin Centre</option>
              <option value="global">Global Access</option>
            </select>
          </div>
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Staff Member</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Role</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Department</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Base Centre</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredStaff.map((staffMember) => (
                <motion.tr
                  key={staffMember.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <ProfilePictureUpload
                        currentAvatarUrl={staffMember.avatar_url}
                        staffId={staffMember.id}
                        staffName={staffMember.full_name}
                        onAvatarUpdate={(avatar_url) => updateStaff({ id: staffMember.id, avatar_url })}
                        size="sm"
                      />
                      <div>
                        <p className="font-medium text-gray-900">{staffMember.full_name}</p>
                        <p className="text-sm text-gray-500">
                          {staffMember.email || 'No email'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900">{staffMember.role}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900">{staffMember.department}</span>
                  </td>
                  <td className="px-6 py-4">
                    <BaseCentreBadge centre={staffMember.branch_assigned} />
                  </td>
                  <td className="px-6 py-4">
                    {userAccessLevel === 'super_admin' || (
                      userAccessLevel === 'admin' &&
                      (staffMember.branch_assigned === activeBranch || activeBranch === 'global')
                    ) ? (
                      <button
                        onClick={() => handleEditStaff(staffMember)}
                        className="inline-flex items-center space-x-2 px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                        <span>Edit</span>
                      </button>
                    ) : (
                      <span className="text-sm text-gray-400">No Access</span>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>

          {filteredStaff.length === 0 && (
            <div className="p-12 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No staff found</h3>
              <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {showEditModal && (
          <EditStaffModal
            isSuperAdmin={userAccessLevel === 'super_admin'}
            staff={editingStaff}
            isOpen={showEditModal}
            onClose={() => {
              setShowEditModal(false)
              setEditingStaff(null)
            }}
            onSave={handleSaveStaff}
            onDelete={handleDeleteStaff}
          />
        )}
        {showAddModal && (
          <AddStaffModal
            isOpen={showAddModal}
            onClose={() => setShowAddModal(false)}
            onSuccess={handleAddStaff}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
