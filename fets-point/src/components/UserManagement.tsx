import React, { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Users, Search, Settings2, Shield, ShieldCheck, ShieldAlert,
    Save, X, Plus, Lock, Calendar, ClipboardList, Newspaper,
    MessageSquare, AlertTriangle, ChevronRight, UserPlus,
    MapPin, Phone, Briefcase, GraduationCap, Award, FileText,
    Trash2, User, Mail, Star, History, TrendingUp, Megaphone
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useStaff, useStaffMutations } from '../hooks/useStaffManagement'
import { toast } from 'react-hot-toast'
import { StaffProfile } from '../types/shared'
import { getAvailableBranches, formatBranchName } from '../utils/authUtils'

const PERMISSION_KEYS = [
    { key: 'can_edit_roster', label: 'Roster Management', icon: Users, description: 'Create and edit staff rosters' },
    { key: 'user_management_edit', label: 'User Management Authority', icon: Shield, description: 'Manage user profiles, roles and critical permissions' },
]

export function UserManagement() {
    const { profile: currentUser, hasPermission } = useAuth()
    const { data: staff = [], isLoading } = useStaff()
    const { updateStaff, deleteStaff, addStaff } = useStaffMutations()

    // Filters & Search
    const [searchTerm, setSearchTerm] = useState('')
    const [branchFilter, setBranchFilter] = useState<string>('all')

    // Selection & Editing State
    const [selectedUser, setSelectedUser] = useState<StaffProfile | null>(null)
    const [activeTab, setActiveTab] = useState<'profile' | 'employment' | 'growth' | 'permissions'>('profile')
    const [isSaving, setIsSaving] = useState(false)
    const [showAddUserModal, setShowAddUserModal] = useState(false)

    // Form Data State
    const [formData, setFormData] = useState<Partial<StaffProfile>>({})
    const [permissions, setPermissions] = useState<Record<string, boolean>>({})

    // Initialize form data when user is selected
    useEffect(() => {
        if (selectedUser) {
            setFormData({ ...selectedUser })
            setPermissions((selectedUser.permissions as Record<string, boolean>) || {})
            setActiveTab('profile')
        }
    }, [selectedUser])

    const filteredStaff = useMemo(() => {
        return staff.filter(s => {
            const matchesSearch = s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.email.toLowerCase().includes(searchTerm.toLowerCase())
            const matchesBranch = branchFilter === 'all' || s.branch_assigned === branchFilter
            return matchesSearch && matchesBranch
        })
    }, [staff, searchTerm, branchFilter])

    const handleSave = async () => {
        if (!selectedUser || !formData) return

        setIsSaving(true)
        try {
            await updateStaff({
                id: selectedUser.id,
                ...formData,
                permissions: permissions as any
            })
            toast.success(`Profile updated for ${formData.full_name}`)
            // Update local selected user to match saved data roughly
            setSelectedUser(prev => prev ? { ...prev, ...formData, permissions } : null)
        } catch (error: any) {
            toast.error(`Failed to update profile: ${error.message}`)
        } finally {
            setIsSaving(false)
        }
    }

    const handleDeleteUser = async () => {
        if (!selectedUser) return
        if (!window.confirm(`Are you sure you want to permanently delete ${selectedUser.full_name}? This action cannot be undone.`)) return

        try {
            await deleteStaff(selectedUser.id)
            setSelectedUser(null)
        } catch (error: any) {
            console.error(error)
        }
    }

    // Handlers for Growth Arrays (Certificates, etc.)
    const handleArrayItemAdd = (field: 'certificates' | 'trainings_attended' | 'future_trainings', value: string) => {
        if (!value.trim()) return
        const currentArray = (formData[field] as any[]) || []
        setFormData({ ...formData, [field]: [...currentArray, { id: Date.now(), title: value, date: new Date().toISOString() }] })
    }

    const handleArrayItemRemove = (field: 'certificates' | 'trainings_attended' | 'future_trainings', index: number) => {
        const currentArray = (formData[field] as any[]) || []
        const newArray = [...currentArray]
        newArray.splice(index, 1)
        setFormData({ ...formData, [field]: newArray })
    }

    const isSystemAdmin = currentUser?.email === 'mithun@fets.in' || currentUser?.role === 'super_admin' || hasPermission('user_management_edit');

    if (!isSystemAdmin) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center bg-[#e0e5ec]">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6 shadow-[inset_4px_4px_8px_#d1d9e6,inset_-4px_-4px_8px_#ffffff]">
                    <ShieldAlert className="text-red-600" size={40} />
                </div>
                <h2 className="text-3xl font-black text-gray-800 mb-4 tracking-tight">ACCESS DENIED</h2>
                <p className="text-gray-500 max-w-md font-medium">
                    This secure management console is restricted to Personnel Administrators only.
                </p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#e0e5ec] p-4 md:p-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="max-w-[1800px] mx-auto mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-gray-800 tracking-tighter uppercase">
                        User <span className="text-gold-gradient">Management</span>
                    </h1>
                    <p className="text-gray-500 font-medium mt-2">
                        Global Personnel Administration & Growth Tracking
                    </p>
                </div>
                <button
                    onClick={() => setShowAddUserModal(true)}
                    className="px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2"
                >
                    <UserPlus size={20} />
                    <span>Add New User</span>
                </button>
            </div>

            <div className="max-w-[1800px] mx-auto grid grid-cols-1 xl:grid-cols-12 gap-8 h-[calc(100vh-200px)]">

                {/* Left Sidebar: User List */}
                <div className="xl:col-span-4 flex flex-col gap-6 h-full">
                    {/* Filters */}
                    <div className="neomorphic-card p-4 space-y-4">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search personnel..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-[#e0e5ec] rounded-xl shadow-[inset_2px_2px_4px_#d1d9e6,inset_-2px_-2px_4px_#ffffff] focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-gray-700 font-medium"
                            />
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                            {['all', 'calicut', 'cochin', 'kannur', 'global'].map(branch => (
                                <button
                                    key={branch}
                                    onClick={() => setBranchFilter(branch)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase whitespace-nowrap transition-all ${branchFilter === branch
                                        ? 'bg-amber-500 text-white shadow-md'
                                        : 'text-gray-500 hover:text-amber-600 hover:bg-white'
                                        }`}
                                >
                                    {branch}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* List */}
                    <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                        {filteredStaff.map(user => (
                            <motion.button
                                key={user.id}
                                onClick={() => setSelectedUser(user)}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                className={`w-full p-4 rounded-2xl flex items-center gap-4 text-left transition-all ${selectedUser?.id === user.id
                                    ? 'bg-gradient-to-br from-amber-50 to-white border-l-4 border-amber-500 shadow-lg'
                                    : 'neomorphic-card hover:bg-white/50'
                                    }`}
                            >
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shadow-inner ${user.branch_assigned === 'kannur' ? 'bg-red-100 text-red-600' :
                                    user.branch_assigned === 'cochin' ? 'bg-green-100 text-green-600' :
                                        user.branch_assigned === 'global' ? 'bg-purple-100 text-purple-600' :
                                            'bg-blue-100 text-blue-600'
                                    }`}>
                                    {user.full_name.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-gray-800 truncate">{user.full_name}</h4>
                                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-200 text-gray-600 uppercase">
                                            {formatBranchName(user.branch_assigned || 'unknown')}
                                        </span>
                                        {user.role === 'super_admin' && (
                                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 uppercase">Super Admin</span>
                                        )}
                                    </div>
                                </div>
                                <ChevronRight className={`text-gray-300 transition-transform ${selectedUser?.id === user.id ? 'rotate-90 text-amber-500' : ''}`} size={18} />
                            </motion.button>
                        ))}
                        {filteredStaff.length === 0 && (
                            <div className="text-center py-10 text-gray-400">
                                <p>No users found matching your filters.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Panel: Details & Editing */}
                <div className="xl:col-span-8 h-full">
                    {selectedUser ? (
                        <motion.div
                            key={selectedUser.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-[#e0e5ec] neomorphic-card h-full flex flex-col overflow-hidden"
                        >
                            {/* User Header */}
                            <div className="p-8 pb-0 flex flex-col md:flex-row gap-6 md:items-end border-b border-gray-200/50 bg-white/30 backdrop-blur-sm">
                                <div className="w-24 h-24 rounded-3xl bg-white shadow-lg flex items-center justify-center text-4xl font-black text-gray-700">
                                    {selectedUser.full_name.charAt(0)}
                                </div>
                                <div className="flex-1 pb-4">
                                    <h2 className="text-3xl font-black text-gray-800 tracking-tight">{formData.full_name}</h2>
                                    <div className="flex items-center gap-4 mt-2 text-sm font-medium text-gray-500">
                                        <span className="flex items-center gap-1"><Mail size={14} /> {formData.email}</span>
                                        <span className="flex items-center gap-1"><Briefcase size={14} /> {formData.role?.toUpperCase()}</span>
                                        <span className="flex items-center gap-1"><MapPin size={14} /> {formatBranchName(formData.branch_assigned || 'global')}</span>
                                    </div>
                                </div>
                                <div className="pb-4 flex gap-2">
                                    <button
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="px-6 py-2 bg-gray-800 text-white rounded-lg font-bold hover:bg-black transition-colors disabled:opacity-50 flex items-center gap-2"
                                    >
                                        <Save size={16} /> Save Changes
                                    </button>
                                    <button
                                        onClick={handleDeleteUser}
                                        className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors"
                                        title="Delete User"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* Tabs */}
                            <div className="flex px-8 border-b border-gray-200/50 bg-white/30">
                                {[
                                    { id: 'profile', label: 'Profile' },
                                    { id: 'employment', label: 'Employment' },
                                    { id: 'growth', label: 'Growth & Training' },
                                    { id: 'permissions', label: 'Permissions' },
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={`px-6 py-4 font-bold text-sm border-b-2 transition-colors ${activeTab === tab.id
                                            ? 'border-amber-500 text-amber-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700'
                                            }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Tab Content */}
                            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                                {activeTab === 'profile' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
                                        <div className="space-y-4">
                                            <label className="block text-xs font-bold text-gray-500 uppercase">Full Name</label>
                                            <input
                                                type="text"
                                                value={formData.full_name || ''}
                                                onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                                className="w-full p-4 bg-white/50 rounded-xl border-none shadow-sm focus:ring-2 focus:ring-amber-500/20"
                                            />
                                        </div>
                                        <div className="space-y-4">
                                            <label className="block text-xs font-bold text-gray-500 uppercase">Contact Number</label>
                                            <input
                                                type="text"
                                                value={formData.contact_number || ''}
                                                onChange={e => setFormData({ ...formData, contact_number: e.target.value })}
                                                placeholder="+91..."
                                                className="w-full p-4 bg-white/50 rounded-xl border-none shadow-sm focus:ring-2 focus:ring-amber-500/20"
                                            />
                                        </div>
                                        <div className="space-y-4 md:col-span-2">
                                            <label className="block text-xs font-bold text-gray-500 uppercase">Address / Bio</label>
                                            <textarea
                                                rows={4}
                                                className="w-full p-4 bg-white/50 rounded-xl border-none shadow-sm focus:ring-2 focus:ring-amber-500/20"
                                                placeholder="Enter address or bio..."
                                            />
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'employment' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
                                        <div className="space-y-4">
                                            <label className="block text-xs font-bold text-gray-500 uppercase">Job Position</label>
                                            <input
                                                type="text"
                                                value={formData.position || ''}
                                                onChange={e => setFormData({ ...formData, position: e.target.value })}
                                                placeholder="e.g. Senior Invigilator"
                                                className="w-full p-4 bg-white/50 rounded-xl border-none shadow-sm focus:ring-2 focus:ring-amber-500/20"
                                            />
                                        </div>
                                        <div className="space-y-4">
                                            <label className="block text-xs font-bold text-gray-500 uppercase">Date of Joining</label>
                                            <input
                                                type="date"
                                                value={formData.joining_date || ''}
                                                onChange={e => setFormData({ ...formData, joining_date: e.target.value })}
                                                className="w-full p-4 bg-white/50 rounded-xl border-none shadow-sm focus:ring-2 focus:ring-amber-500/20"
                                            />
                                        </div>
                                        <div className="space-y-4">
                                            <label className="block text-xs font-bold text-gray-500 uppercase">Global Role</label>
                                            <select
                                                value={formData.role || 'fetsian'}
                                                onChange={e => setFormData({ ...formData, role: e.target.value })}
                                                className="w-full p-4 bg-white/50 rounded-xl border-none shadow-sm focus:ring-2 focus:ring-amber-500/20"
                                            >
                                                <option value="fetsian">FETSIAN</option>
                                                <option value="admin">ADMIN</option>
                                                <option value="super_admin">SUPER ADMIN</option>
                                            </select>
                                        </div>
                                        <div className="space-y-4">
                                            <label className="block text-xs font-bold text-gray-500 uppercase">Assigned Branch</label>
                                            <select
                                                value={formData.branch_assigned || 'calicut'}
                                                onChange={e => setFormData({ ...formData, branch_assigned: e.target.value })}
                                                className="w-full p-4 bg-white/50 rounded-xl border-none shadow-sm focus:ring-2 focus:ring-amber-500/20"
                                            >
                                                <option value="calicut">Calicut</option>
                                                <option value="cochin">Cochin</option>
                                                <option value="kannur">Kannur</option>
                                                <option value="global">Global</option>
                                            </select>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'growth' && (
                                    <div className="space-y-8 max-w-4xl">
                                        {/* Review Component for Array Items */}
                                        {[
                                            { field: 'certificates', label: 'Certificates & Qualifications', icon: Award },
                                            { field: 'trainings_attended', label: 'Trainings Attended', icon: History },
                                            { field: 'future_trainings', label: 'Future Training Plan', icon: TrendingUp },
                                        ].map(section => (
                                            <div key={section.field} className="bg-white/40 p-6 rounded-2xl border border-white/50">
                                                <div className="flex items-center gap-2 mb-4">
                                                    <section.icon className="text-amber-600" size={20} />
                                                    <h3 className="font-bold text-gray-700">{section.label}</h3>
                                                </div>
                                                <div className="space-y-2 mb-4">
                                                    {((formData as any)[section.field] || []).map((item: any, idx: number) => (
                                                        <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                                                            <span className="font-medium text-gray-700">{item.title}</span>
                                                            <button
                                                                onClick={() => handleArrayItemRemove(section.field as any, idx)}
                                                                className="text-red-400 hover:text-red-600"
                                                            >
                                                                <X size={16} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                    {((formData as any)[section.field] || []).length === 0 && (
                                                        <p className="text-sm text-gray-400 italic">No records added yet.</p>
                                                    )}
                                                </div>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        placeholder="Add new item..."
                                                        className="flex-1 px-4 py-2 rounded-lg bg-white/50 border-none focus:ring-2 focus:ring-amber-500/20"
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                handleArrayItemAdd(section.field as any, e.currentTarget.value)
                                                                e.currentTarget.value = ''
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        ))}

                                        <div className="bg-white/40 p-6 rounded-2xl border border-white/50">
                                            <div className="flex items-center gap-2 mb-4">
                                                <FileText className="text-amber-600" size={20} />
                                                <h3 className="font-bold text-gray-700">Remarks & Follow-up</h3>
                                            </div>
                                            <textarea
                                                rows={4}
                                                value={formData.remarks || ''}
                                                onChange={e => setFormData({ ...formData, remarks: e.target.value })}
                                                className="w-full p-4 bg-white/50 rounded-xl border-none shadow-sm focus:ring-2 focus:ring-amber-500/20"
                                                placeholder="Enter supervisor remarks, performance notes, or growth plans..."
                                            />
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'permissions' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {PERMISSION_KEYS.map((perm) => {
                                            const Icon = perm.icon
                                            const isEnabled = permissions[perm.key]
                                            return (
                                                <button
                                                    key={perm.key}
                                                    onClick={() => setPermissions(prev => ({ ...prev, [perm.key]: !prev[perm.key] }))}
                                                    className={`p-5 rounded-2xl text-left transition-all border flex items-start gap-4 ${isEnabled
                                                        ? 'bg-amber-50 border-amber-200'
                                                        : 'bg-white/50 border-transparent hover:bg-white'
                                                        }`}
                                                >
                                                    <div className={`p-3 rounded-xl ${isEnabled ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                                        <Icon size={20} />
                                                    </div>
                                                    <div>
                                                        <h4 className={`font-bold ${isEnabled ? 'text-amber-900' : 'text-gray-600'}`}>{perm.label}</h4>
                                                        <p className="text-xs text-gray-500 mt-1">{perm.description}</p>
                                                    </div>
                                                </button>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 bg-white/30 rounded-3xl border-2 border-dashed border-gray-300">
                            <Users size={64} className="mb-4 opacity-30" />
                            <h3 className="text-2xl font-bold">Select Personnel</h3>
                            <p className="max-w-xs mt-2">Click on a user from the list to view their full profile and manage their growth.</p>
                        </div>
                    )}
                </div>
            </div>

            <AnimatePresence>
                {showAddUserModal && (
                    <AddUserModal
                        onClose={() => setShowAddUserModal(false)}
                        onAdd={async (data) => {
                            try {
                                await addStaff(data)
                                setShowAddUserModal(false)
                            } catch (e) {
                                console.error(e)
                            }
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}

function AddUserModal({ onClose, onAdd }: { onClose: () => void, onAdd: (data: any) => Promise<void> }) {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        full_name: '',
        branch_assigned: 'calicut',
        role: 'fetsian'
    })
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        await onAdd(formData)
        setLoading(false)
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
            <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className="bg-[#e0e5ec] neomorphic-card w-full max-w-lg overflow-hidden"
            >
                <div className="p-6 border-b border-gray-200/50 bg-white/30 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-gray-800">New Personnel</h3>
                    <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-lg transition-colors"><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Full Name</label>
                            <input
                                required
                                type="text"
                                value={formData.full_name}
                                onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                className="w-full p-3 bg-white/50 rounded-xl focus:ring-2 focus:ring-amber-500/20"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Email Address</label>
                            <input
                                required
                                type="email"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                className="w-full p-3 bg-white/50 rounded-xl focus:ring-2 focus:ring-amber-500/20"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Default Password</label>
                            <input
                                required
                                type="text"
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                className="w-full p-3 bg-white/50 rounded-xl focus:ring-2 focus:ring-amber-500/20"
                                placeholder="Min. 6 characters"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Branch</label>
                                <select
                                    value={formData.branch_assigned}
                                    onChange={e => setFormData({ ...formData, branch_assigned: e.target.value })}
                                    className="w-full p-3 bg-white/50 rounded-xl focus:ring-2 focus:ring-amber-500/20"
                                >
                                    <option value="calicut">Calicut</option>
                                    <option value="cochin">Cochin</option>
                                    <option value="kannur">Kannur</option>
                                    <option value="global">Global</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Role</label>
                                <select
                                    value={formData.role}
                                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                                    className="w-full p-3 bg-white/50 rounded-xl focus:ring-2 focus:ring-amber-500/20"
                                >
                                    <option value="fetsian">FETSIAN</option>
                                    <option value="admin">ADMIN</option>
                                    <option value="super_admin">SUPER ADMIN</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 font-bold text-gray-500 hover:bg-gray-200 rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-3 bg-amber-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:bg-amber-600 transition-all disabled:opacity-50"
                        >
                            {loading ? 'Creating...' : 'Create Account'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    )
}
