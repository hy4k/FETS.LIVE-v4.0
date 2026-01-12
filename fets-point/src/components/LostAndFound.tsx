import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Search, Plus, Package, MapPin, Calendar, User, Phone, CheckCircle,
    X, Filter, PackageSearch, PackageOpen, MoreVertical, Edit, Trash2,
    Image as ImageIcon, Tag, History, Info, ChevronRight, UserCheck,
    AlertTriangle, Video, ClipboardList, ShieldCheck, FileText, Upload
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useBranch } from '../hooks/useBranch'
import { supabase } from '../lib/supabase'
import { toast } from 'react-hot-toast'

interface LostFoundItem {
    id: string
    reference_no: number
    description: string
    category: string
    item_type: string
    found_location: string
    found_date: string
    found_by_user_id: string
    found_by_staff_id?: string
    candidate_details?: string
    exam_details?: string
    cctv_dvr_no?: string
    contact_info?: string
    status: 'active' | 'returned' | 'claimed'
    image_url?: string
    returned_date?: string
    returned_to_name?: string
    returned_to_id_proof?: string
    returned_to_contact?: string
    branch_location: string
    created_at: string
}

interface StaffProfile {
    id: string
    full_name: string
}

export function LostAndFound() {
    const { profile, user } = useAuth()
    const { activeBranch } = useBranch()
    const [items, setItems] = useState<LostFoundItem[]>([])
    const [staff, setStaff] = useState<StaffProfile[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [activeTab, setActiveTab] = useState<'active' | 'returned'>('active')
    const [showAddModal, setShowAddModal] = useState(false)
    const [showClaimModal, setShowClaimModal] = useState(false)
    const [selectedItem, setSelectedItem] = useState<LostFoundItem | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Claim form state
    const [claimDetails, setClaimDetails] = useState({
        claimant_name: '',
        claimant_contact: '',
        id_proof_type: 'National ID',
        id_proof_details: '',
        claim_type: 'claimed' as 'returned' | 'claimed'
    })

    // Form states
    const [formItem, setFormItem] = useState<Partial<LostFoundItem>>({
        description: '',
        category: 'electronics',
        found_location: '',
        found_date: new Date().toISOString().split('T')[0],
        candidate_details: '',
        exam_details: '',
        cctv_dvr_no: '',
        found_by_staff_id: '',
        contact_info: '',
        item_type: 'found',
        status: 'active',
        branch_location: activeBranch === 'global' ? 'calicut' : activeBranch
    })

    const loadItems = async () => {
        setLoading(true)
        try {
            let query = supabase
                .from('lost_found_items')
                .select('*')
                .order('created_at', { ascending: false })

            if (activeBranch !== 'global') {
                query = query.eq('branch_location', activeBranch)
            }

            const { data, error } = await query
            if (error) throw error
            setItems(data || [])
        } catch (error: any) {
            console.error('Error loading lost & found items:', error)
            toast.error('Failed to load items')
        } finally {
            setLoading(false)
        }
    }

    const loadStaff = async () => {
        try {
            const { data, error } = await supabase
                .from('staff_profiles')
                .select('id, full_name')
                .order('full_name', { ascending: true })

            if (error) throw error
            setStaff(data || [])
        } catch (err) {
            console.error('Failed to load staff profiles', err)
        }
    }

    useEffect(() => {
        loadItems()
        loadStaff()
    }, [activeBranch])

    const filteredItems = useMemo(() => {
        return items.filter(item => {
            const matchesSearch =
                item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.reference_no?.toString().includes(searchQuery) ||
                item.candidate_details?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.exam_details?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.returned_to_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.returned_to_contact?.toLowerCase().includes(searchQuery.toLowerCase())

            const matchesTab = activeTab === 'active'
                ? (item.status === 'active')
                : (item.status === 'returned' || item.status === 'claimed')

            return matchesSearch && matchesTab
        })
    }, [items, searchQuery, activeTab])

    const handleSaveItem = async () => {
        if (!formItem.description) {
            toast.error('Please provide a description')
            return
        }

        setIsSubmitting(true)
        try {
            const itemToSave = {
                ...formItem,
                found_by_user_id: user?.id,
                branch_location: activeBranch === 'global' ? (formItem.branch_location || 'calicut') : activeBranch,
                status: formItem.status || 'active'
            }

            const { error } = await supabase
                .from('lost_found_items')
                .insert(itemToSave)

            if (error) throw error

            toast.success('Item recorded successfully')
            setShowAddModal(false)
            loadItems()
            setFormItem({
                description: '',
                category: 'electronics',
                found_location: '',
                found_date: new Date().toISOString().split('T')[0],
                candidate_details: '',
                exam_details: '',
                cctv_dvr_no: '',
                found_by_staff_id: '',
                contact_info: '',
                item_type: 'found',
                status: 'active',
                branch_location: activeBranch === 'global' ? 'calicut' : activeBranch
            })
        } catch (error: any) {
            console.error('Error saving item:', error)
            toast.error(error.message || 'Failed to save item')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleProcessClaim = async () => {
        if (!selectedItem || !claimDetails.claimant_name || !claimDetails.id_proof_details || !claimDetails.claimant_contact) {
            toast.error('Please provide claimant name, contact, and ID proof details')
            return
        }

        setIsSubmitting(true)
        try {
            const { error } = await supabase
                .from('lost_found_items')
                .update({
                    status: claimDetails.claim_type,
                    returned_date: new Date().toISOString(),
                    returned_to_name: claimDetails.claimant_name,
                    returned_to_contact: claimDetails.claimant_contact,
                    returned_to_id_proof: `${claimDetails.id_proof_type}: ${claimDetails.id_proof_details}`
                })
                .eq('id', selectedItem.id)

            if (error) throw error
            toast.success(`Item successfully marked as ${claimDetails.claim_type}`)
            setShowClaimModal(false)
            setSelectedItem(null)
            setClaimDetails({
                claimant_name: '',
                claimant_contact: '',
                id_proof_type: 'National ID',
                id_proof_details: '',
                claim_type: 'claimed'
            })
            loadItems()
        } catch (error: any) {
            console.error('Process error:', error)
            toast.error('Failed to update protocol')
        } finally {
            setIsSubmitting(false)
        }
    }

    const getAgeingInfo = (foundDate: string) => {
        const found = new Date(foundDate)
        const today = new Date()
        const diffTime = Math.abs(today.getTime() - found.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return {
            days: diffDays,
            isOverdue: diffDays > 45
        }
    }

    // Styles from CommandCentre
    const neuCard = "bg-[#EEF2F9] rounded-3xl shadow-[9px_9px_16px_rgb(209,217,230),-9px_-9px_16px_rgba(255,255,255,0.8)] border border-white/50"
    const neuInset = "bg-[#EEF2F9] rounded-2xl shadow-[inset_6px_6px_12px_rgb(209,217,230),inset_-6px_-6px_12px_rgba(255,255,255,0.9)]"
    const neuBtn = "bg-[#EEF2F9] text-slate-600 font-bold rounded-2xl shadow-[6px_6px_10px_rgb(209,217,230),-6px_-6px_10px_rgba(255,255,255,0.8)] hover:shadow-[4px_4px_8px_rgb(209,217,230),-4px_-4px_8px_rgba(255,255,255,0.8)] active:shadow-[inset_4px_4px_8px_rgb(209,217,230),inset_-4px_-4px_8px_rgba(255,255,255,0.8)] transition-all border border-white/40"

    return (
        <div className="min-h-screen bg-[#EEF2F9] p-4 md:p-8">
            {/* Header Section */}
            <div className="max-w-7xl mx-auto mb-10">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-1 w-10 bg-amber-500 rounded-full" />
                            <span className="text-slate-400 font-black text-[10px] uppercase tracking-[0.4em] font-['Rajdhani']">
                                Inventory Control Group {activeBranch !== 'global' && `// Node ${activeBranch.toUpperCase()}`}
                            </span>
                        </div>
                        <h1 className="text-5xl font-black text-slate-800 tracking-tighter uppercase italic">
                            Lost & <span className="text-amber-500">Found</span>
                        </h1>
                    </div>

                    <div className="flex items-center gap-4 w-full lg:w-auto">
                        <div className={`flex-1 lg:w-80 ${neuInset} flex items-center px-4 py-2`}>
                            <Search size={18} className="text-slate-400 mr-2" />
                            <input
                                type="text"
                                placeholder="Search description, ref, or recipient..."
                                className="bg-transparent border-none focus:ring-0 text-slate-700 w-full font-medium"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className={`${neuBtn} p-4 text-amber-600 flex items-center gap-2`}
                        >
                            <Plus size={20} />
                            <span className="hidden md:inline uppercase tracking-widest text-xs">Record Item</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Tabs Section */}
            <div className="max-w-7xl mx-auto mb-8">
                <div className="flex gap-4 p-2 bg-slate-200/30 rounded-3xl w-fit">
                    <button
                        onClick={() => setActiveTab('active')}
                        className={`px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'active'
                            ? 'bg-amber-500 text-white shadow-lg'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        In Custody ({items.filter(i => i.status === 'active').length})
                    </button>
                    <button
                        onClick={() => setActiveTab('returned')}
                        className={`px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'returned'
                            ? 'bg-slate-800 text-white shadow-lg'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Claim Portal (History)
                    </button>
                </div>
            </div>

            {/* Grid Section */}
            <div className="max-w-7xl mx-auto">
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div className={`${neuCard} p-20 flex flex-col items-center justify-center text-center opacity-60`}>
                        <PackageSearch size={64} className="text-slate-300 mb-6" />
                        <p className="text-xl font-black text-slate-400 uppercase tracking-tighter">No records found in this perimeter</p>
                        <p className="text-sm font-bold text-slate-400 mt-2">All assets accounted for.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredItems.map((item) => {
                            const ageing = getAgeingInfo(item.found_date)
                            const foundByStaff = staff.find(s => s.id === item.found_by_staff_id)?.full_name || 'System Recorded'

                            return (
                                <motion.div
                                    key={item.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className={`${neuCard} overflow-hidden group hover:scale-[1.02] transition-all relative flex flex-col`}
                                >
                                    {/* Ageing Warning Banner */}
                                    {item.status === 'active' && ageing.isOverdue && (
                                        <div className="bg-rose-500 text-white text-[10px] font-black uppercase tracking-[0.2em] py-1 text-center animate-pulse">
                                            Asset Ageing Over 45 Days ({ageing.days} Days)
                                        </div>
                                    )}

                                    {/* Item Ribbon */}
                                    <div className={`h-1.5 w-full ${item.status === 'active'
                                        ? (ageing.isOverdue ? 'bg-rose-500' : 'bg-amber-500')
                                        : (item.status === 'claimed' ? 'bg-indigo-500' : 'bg-emerald-500')}`}
                                    />

                                    <div className="p-6 flex-1 flex flex-col">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className={`${neuInset} px-3 py-1 text-[10px] font-black text-slate-500 uppercase tracking-widest`}>
                                                REF #{item.reference_no}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {item.status === 'active' && ageing.isOverdue && (
                                                    <AlertTriangle size={14} className="text-rose-500" />
                                                )}
                                                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${item.status === 'active'
                                                    ? (ageing.isOverdue ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700')
                                                    : (item.status === 'claimed' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700')
                                                    }`}>
                                                    {item.status}
                                                </span>
                                            </div>
                                        </div>

                                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter mb-2 line-clamp-1">
                                            {item.description}
                                        </h3>

                                        <div className="space-y-3 mb-6 flex-1">
                                            <div className="flex items-start gap-2 text-slate-500">
                                                <MapPin size={14} className="text-amber-500 mt-0.5 shrink-0" />
                                                <span className="text-xs font-bold uppercase tracking-wider">{item.found_location}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-slate-500">
                                                <Calendar size={14} className="text-amber-500 shrink-0" />
                                                <span className="text-xs font-bold uppercase tracking-wider">
                                                    {new Date(item.found_date).toLocaleDateString()}
                                                    <span className="ml-2 opacity-50">({ageing.days}d)</span>
                                                </span>
                                            </div>

                                            {/* Advanced Data (Collapsible style or direct) */}
                                            <div className="pt-2 border-t border-slate-200/50 space-y-2">
                                                <div className="flex items-center gap-2 text-slate-400">
                                                    <User size={12} />
                                                    <span className="text-[10px] font-bold uppercase">Found By: {foundByStaff}</span>
                                                </div>
                                                {item.exam_details && (
                                                    <div className="flex items-center gap-2 text-slate-400">
                                                        <ClipboardList size={12} />
                                                        <span className="text-[10px] font-bold uppercase">Exam: {item.exam_details}</span>
                                                    </div>
                                                )}
                                                {item.cctv_dvr_no && (
                                                    <div className="flex items-center gap-2 text-slate-400">
                                                        <Video size={12} />
                                                        <span className="text-[10px] font-bold uppercase">CCTV: {item.cctv_dvr_no}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {item.status === 'active' ? (
                                            <button
                                                onClick={() => {
                                                    setSelectedItem(item)
                                                    setShowClaimModal(true)
                                                }}
                                                className="w-full py-3 bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-700 transition-colors shadow-lg shadow-slate-900/10"
                                            >
                                                <ShieldCheck size={16} />
                                                Process Claim
                                            </button>
                                        ) : (
                                            <div className={`${neuInset} p-4 mt-auto bg-white/40`}>
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ownership History</span>
                                                    <CheckCircle size={14} className="text-emerald-500" />
                                                </div>
                                                <p className="text-[11px] font-black text-slate-700 uppercase leading-tight mb-1">
                                                    {item.returned_to_name || 'Anonymous Recipient'}
                                                </p>
                                                <p className="text-[9px] font-bold text-slate-600 uppercase flex items-center gap-1 mb-1">
                                                    <Phone size={10} className="text-emerald-500" />
                                                    {item.returned_to_contact || 'No Contact Logged'}
                                                </p>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1">
                                                    <FileText size={10} />
                                                    {item.returned_to_id_proof || 'No ID Logged'}
                                                </p>
                                                <div className="mt-2 pt-2 border-t border-slate-200 flex justify-between items-center">
                                                    <span className="text-[8px] font-black text-slate-400 uppercase">Released:</span>
                                                    <span className="text-[8px] font-black text-emerald-600 uppercase">
                                                        {new Date(item.returned_date!).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Record Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className={`w-full max-w-2xl ${neuCard} p-0 overflow-hidden relative z-10`}>
                            <div className="bg-slate-800 p-6 flex justify-between items-center text-white">
                                <div className="flex items-center gap-3">
                                    <PackageSearch size={24} className="text-amber-500" />
                                    <h2 className="text-xl font-black uppercase italic tracking-tighter">Secure Asset Entry</h2>
                                </div>
                                <button onClick={() => setShowAddModal(false)} className="hover:rotate-90 transition-transform"><X /></button>
                            </div>
                            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Display name / description</label>
                                        <input type="text" placeholder="e.g. Wallet, iPhone, etc." className={`w-full ${neuInset} border-none p-4 text-slate-700 font-bold`} value={formItem.description} onChange={e => setFormItem({ ...formItem, description: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Category</label>
                                        <select className={`w-full ${neuInset} border-none p-4 text-slate-700 font-bold`} value={formItem.category} onChange={e => setFormItem({ ...formItem, category: e.target.value })}>
                                            <option value="electronics">Electronics</option>
                                            <option value="stationery">Stationery</option>
                                            <option value="personal">Personal Documents</option>
                                            <option value="clothing">Clothing / Accessories</option>
                                            <option value="keys">Keys / Security</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Found Location</label>
                                        <input type="text" placeholder="Room/Hall Name" className={`w-full ${neuInset} border-none p-4 text-slate-700 font-bold`} value={formItem.found_location} onChange={e => setFormItem({ ...formItem, found_location: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Date Found</label>
                                        <input type="date" className={`w-full ${neuInset} border-none p-4 text-slate-700 font-bold`} value={formItem.found_date} onChange={e => setFormItem({ ...formItem, found_date: e.target.value })} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Found By Staff</label>
                                        <select className={`w-full ${neuInset} border-none p-4 text-slate-700 font-bold`} value={formItem.found_by_staff_id} onChange={e => setFormItem({ ...formItem, found_by_staff_id: e.target.value })}>
                                            <option value="">Select Staff Member</option>
                                            {staff.map(member => <option key={member.id} value={member.id}>{member.full_name}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">CCTV / DVR Ref</label>
                                        <input type="text" placeholder="DVR-01 / CAM-02" className={`w-full ${neuInset} border-none p-4 text-slate-700 font-bold`} value={formItem.cctv_dvr_no} onChange={e => setFormItem({ ...formItem, cctv_dvr_no: e.target.value })} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Candidate Info</label>
                                        <input type="text" placeholder="Name/Reg No" className={`w-full ${neuInset} border-none p-4 text-slate-700 font-bold`} value={formItem.candidate_details} onChange={e => setFormItem({ ...formItem, candidate_details: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Exam details</label>
                                        <input type="text" placeholder="IELTS / CELPIP / Session" className={`w-full ${neuInset} border-none p-4 text-slate-700 font-bold`} value={formItem.exam_details} onChange={e => setFormItem({ ...formItem, exam_details: e.target.value })} />
                                    </div>
                                </div>
                            </div>
                            <div className="p-8 bg-white/50 flex gap-4">
                                <button onClick={() => setShowAddModal(false)} className="flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Cancel</button>
                                <button onClick={handleSaveItem} disabled={isSubmitting} className="flex-[2] py-4 bg-amber-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-amber-500/20 active:scale-95 transition-all">
                                    {isSubmitting ? 'Syncing...' : 'Confirm Entry'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Claim Modal */}
            <AnimatePresence>
                {showClaimModal && selectedItem && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowClaimModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className={`w-full max-w-lg ${neuCard} p-0 overflow-hidden relative z-10`}>
                            <div className="bg-slate-800 p-6 flex justify-between items-center text-white">
                                <div className="flex items-center gap-3">
                                    <ShieldCheck size={24} className="text-emerald-500" />
                                    <h2 className="text-xl font-black uppercase italic tracking-tighter">Claim Verification</h2>
                                </div>
                                <button onClick={() => setShowClaimModal(false)}><X /></button>
                            </div>
                            <div className="p-8 space-y-6">
                                <div className={`${neuInset} p-4 bg-amber-50/30 border border-amber-200/50`}>
                                    <p className="text-[9px] font-black text-amber-600 uppercase mb-1">Processing Release For</p>
                                    <p className="text-lg font-black text-slate-800 uppercase tracking-tight">{selectedItem.description}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Found at {selectedItem.found_location} on {new Date(selectedItem.found_date).toLocaleDateString()}</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Claimant Full Name</label>
                                        <input
                                            type="text"
                                            className={`w-full ${neuInset} border-none p-4 text-slate-700 font-bold`}
                                            placeholder="Verify from ID proof"
                                            value={claimDetails.claimant_name}
                                            onChange={e => setClaimDetails({ ...claimDetails, claimant_name: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Claimant Contact Number</label>
                                        <input
                                            type="text"
                                            className={`w-full ${neuInset} border-none p-4 text-slate-700 font-bold`}
                                            placeholder="Phone or Email"
                                            value={claimDetails.claimant_contact}
                                            onChange={e => setClaimDetails({ ...claimDetails, claimant_contact: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">ID Proof Type</label>
                                            <select
                                                className={`w-full ${neuInset} border-none p-4 text-slate-700 font-bold`}
                                                value={claimDetails.id_proof_type}
                                                onChange={e => setClaimDetails({ ...claimDetails, id_proof_type: e.target.value })}
                                            >
                                                <option>National ID</option>
                                                <option>Passport</option>
                                                <option>Driving License</option>
                                                <option>Student ID</option>
                                                <option>Other</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">ID Number / Copy Ref</label>
                                            <input
                                                type="text"
                                                className={`w-full ${neuInset} border-none p-4 text-slate-700 font-bold`}
                                                placeholder="Last 4 digits or ref"
                                                value={claimDetails.id_proof_details}
                                                onChange={e => setClaimDetails({ ...claimDetails, id_proof_details: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2 pt-4">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 text-center block">Action Protocol</label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <button
                                                onClick={() => setClaimDetails({ ...claimDetails, claim_type: 'claimed' })}
                                                className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${claimDetails.claim_type === 'claimed' ? 'bg-indigo-500 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}
                                            >
                                                Candidate Claimed
                                            </button>
                                            <button
                                                onClick={() => setClaimDetails({ ...claimDetails, claim_type: 'returned' })}
                                                className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${claimDetails.claim_type === 'returned' ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}
                                            >
                                                General Return
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="p-8 bg-slate-50 flex gap-4">
                                <button onClick={() => setShowClaimModal(false)} className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600">Abort Scan</button>
                                <button
                                    onClick={handleProcessClaim}
                                    disabled={isSubmitting}
                                    className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Verifying...' : 'Authenticate & Release ASSET'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}
