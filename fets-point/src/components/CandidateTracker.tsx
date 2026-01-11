import { useState } from 'react'
import {
  Users, Plus, Search, Filter, Eye, Edit, UserCheck, UserX,
  Clock, Phone, Mail, X, Calendar, Upload, Trash2,
  MoreVertical, MapPin, Database, FileText, ChevronDown, Download,
  AlertCircle, CheckCircle, Smartphone, Grid, List, Layout, Kanban,
  ArrowRight
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useBranch } from '../hooks/useBranch'
import { useBranchFilter } from '../hooks/useBranchFilter'
import { useCandidates, useCreateCandidate, useUpdateCandidateStatus, useClients } from '../hooks/useQueries'
import { useIsMobile } from '../hooks/use-mobile'
import { toast } from 'react-hot-toast'

interface Candidate {
  id: string
  fullName: string
  address: string
  phone?: string
  examDate?: Date
  examName?: string
  status: 'registered' | 'checked_in' | 'in_progress' | 'completed' | 'no_show' | 'cancelled'
  confirmationNumber: string
  checkInTime?: Date
  notes?: string
  createdAt: Date
  clientName?: string
  branchLocation?: string
}

interface EditCandidateData {
  fullName: string
  address: string
  phone: string
  examDate: string
  examName: string
  notes: string
  clientName: string
  status: Candidate['status']
  confirmationNumber: string
}

export function CandidateTracker() {
  const { user } = useAuth()
  const { activeBranch } = useBranch()
  const { applyFilter, isGlobalView } = useBranchFilter()

  // State
  const [viewMode, setViewMode] = useState<'table' | 'grid' | 'kanban'>('table')
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
  const [showNewCandidateModal, setShowNewCandidateModal] = useState(false)
  const [showEditCandidateModal, setShowEditCandidateModal] = useState(false)
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterClient, setFilterClient] = useState('all')

  // Upload State
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [uploadResults, setUploadResults] = useState<{ success: number; errors: string[] }>({ success: 0, errors: [] })

  // Form State
  const [newCandidate, setNewCandidate] = useState({
    fullName: '',
    address: '',
    phone: '',
    examDate: new Date().toISOString().slice(0, 10),
    examName: '',
    notes: '',
    clientName: '',
    confirmationNumber: ''
  })

  const [editCandidate, setEditCandidate] = useState<EditCandidateData>({
    fullName: '',
    address: '',
    phone: '',
    examDate: '',
    examName: '',
    notes: '',
    clientName: '',
    status: 'registered',
    confirmationNumber: ''
  })

  // Queries
  const filters = {
    status: filterStatus !== 'all' ? filterStatus : undefined,
    branch_location: !isGlobalView ? activeBranch : undefined
  }

  const { data: candidatesData, isLoading: loading, refetch } = useCandidates(filters)
  const createCandidateMutation = useCreateCandidate()
  const updateStatusMutation = useUpdateCandidateStatus()

  // Helpers
  const deriveClientFromExamName = (name?: string): string => {
    const n = (name || '').toUpperCase()
    if (n.includes('PSI')) return 'PSI'
    if (n.includes('ITTS')) return 'ITTS'
    if (n.includes('GRE') || n.includes('TOEFL')) return 'ETS'
    if (n.includes('VUE') || n.includes('PEARSON')) return 'PEARSON VUE'
    return 'PEARSON VUE'
  }

  const generateConfirmationNumber = () => {
    const prefix = 'EXAM'
    const timestamp = Date.now().toString().slice(-6)
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    return `${prefix}-${timestamp}-${random}`
  }

  const candidates: Candidate[] = candidatesData?.map(candidate => ({
    id: candidate.id,
    fullName: candidate.full_name,
    address: candidate.address,
    phone: candidate.phone,
    examDate: candidate.exam_date ? new Date(candidate.exam_date) : undefined,
    examName: candidate.exam_name || 'Exam Session',
    status: candidate.status as Candidate['status'],
    confirmationNumber: candidate.confirmation_number || generateConfirmationNumber(),
    checkInTime: candidate.check_in_time ? new Date(candidate.check_in_time) : undefined,
    notes: candidate.notes,
    createdAt: new Date(candidate.created_at),
    clientName: candidate.client_name || deriveClientFromExamName(candidate.exam_name),
    branchLocation: candidate.branch_location
  })) || []

  // Filtering Logic
  const filteredCandidates = candidates.filter(candidate => {
    const matchesSearch =
      candidate.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (candidate.phone && candidate.phone.includes(searchQuery)) ||
      candidate.confirmationNumber.toLowerCase().includes(searchQuery.toLowerCase())

    const clientComputed = (candidate.clientName || deriveClientFromExamName(candidate.examName)).toUpperCase()
    const matchesClient = filterClient === 'all' || clientComputed === filterClient.toUpperCase()

    // Strict Client-Side Branch Check
    const matchesBranch = isGlobalView || !candidate.branchLocation || candidate.branchLocation === activeBranch

    return matchesSearch && matchesClient && matchesBranch
  })

  // Status Handlers
  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await updateStatusMutation.mutateAsync({ id, status: newStatus })
      refetch()
    } catch (err) {
      toast.error("Status update failed")
    }
  }

  // --- Styles ---
  const getClientColor = (name: string) => {
    if (name.includes('PROMETRIC')) return 'text-red-700 bg-red-50 border-red-200'
    if (name.includes('PEARSON')) return 'text-blue-700 bg-blue-50 border-blue-200'
    if (name.includes('ETS')) return 'text-amber-700 bg-amber-50 border-amber-200'
    return 'text-slate-600 bg-slate-50 border-slate-200'
  }

  const statusColors = {
    registered: 'bg-blue-100 text-blue-800 border-blue-200',
    checked_in: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    in_progress: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    no_show: 'bg-rose-100 text-rose-800 border-rose-200',
    cancelled: 'bg-slate-100 text-slate-600 border-slate-200'
  }

  // Handlers for CRUD
  const handleCreateCandidate = async () => {
    const candidateData: any = {
      full_name: newCandidate.fullName,
      address: newCandidate.address || null,
      phone: newCandidate.phone || null,
      exam_date: newCandidate.examDate ? new Date(newCandidate.examDate).toISOString() : null,
      exam_name: newCandidate.examName || null,
      status: 'registered',
      confirmation_number: generateConfirmationNumber(),
      notes: newCandidate.notes || null,
      user_id: user?.id,
      client_name: newCandidate.clientName || null
    }

    if (!isGlobalView && activeBranch) {
      candidateData.branch_location = activeBranch
    }

    createCandidateMutation.mutate(candidateData, {
      onSuccess: () => {
        setNewCandidate({ fullName: '', address: '', phone: '', examDate: new Date().toISOString().slice(0, 10), examName: '', notes: '', clientName: '', confirmationNumber: '' })
        setShowNewCandidateModal(false)
      }
    })
  }

  const handleEditCandidate = async () => {
    if (!selectedCandidate) return
    try {
      const { error } = await supabase
        .from('candidates')
        .update({
          full_name: editCandidate.fullName,
          address: editCandidate.address,
          phone: editCandidate.phone || null,
          exam_date: editCandidate.examDate ? new Date(editCandidate.examDate).toISOString() : null,
          exam_name: editCandidate.examName || null,
          notes: editCandidate.notes || null,
          client_name: editCandidate.clientName || null,
          status: editCandidate.status
        })
        .eq('id', selectedCandidate.id)

      if (error) throw error
      refetch()
      setShowEditCandidateModal(false)
      setSelectedCandidate(null)
      toast.success('Candidate updated successfully!')
    } catch (error: any) {
      toast.error('Failed to update: ' + error.message)
    }
  }

  const handleDeleteCandidate = async (candidateId: string, candidateName: string) => {
    if (!window.confirm(`Delete candidate "${candidateName}"?`)) return
    try {
      const { error } = await supabase.from('candidates').delete().eq('id', candidateId)
      if (error) throw error
      refetch()
      toast.success('Candidate deleted')
    } catch (error: any) {
      toast.error('Failed to delete: ' + error.message)
    }
  }

  const openEditModal = (candidate: Candidate) => {
    setSelectedCandidate(candidate)
    setEditCandidate({
      fullName: candidate.fullName,
      address: candidate.address,
      phone: candidate.phone || '',
      examDate: candidate.examDate ? candidate.examDate.toISOString().slice(0, 16) : '',
      examName: candidate.examName || '',
      notes: candidate.notes || '',
      clientName: candidate.clientName || '',
      status: candidate.status,
      confirmationNumber: candidate.confirmationNumber
    })
    setShowEditCandidateModal(true)
  }

  // --- Render ---

  return (
    <div className="min-h-screen bg-slate-50 p-6 pt-24 font-sans">
      <div className="max-w-[1920px] mx-auto space-y-6">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 uppercase tracking-tight">FETS Register</h1>
            <p className="text-xs text-slate-500 font-medium mt-1 flex items-center gap-2">
              <MapPin size={12} /> {isGlobalView ? 'Global View' : activeBranch?.toUpperCase() || 'Local View'}
              <span className="text-slate-300">|</span>
              <span className="text-slate-600 font-bold">{filteredCandidates.length} Records Found</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white shadow text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
                title="List View"
              >
                <List size={20} />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
                title="Card Grid View"
              >
                <Grid size={20} />
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'kanban' ? 'bg-white shadow text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
                title="Board View"
              >
                <Kanban size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search box remains the same as before... */}
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
            <input
              type="text"
              placeholder="Search name, phone, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium text-slate-700"
            />
          </div>

          {/* Filters Buttons here... (Same as before) */}
          <div className="flex items-center gap-3 overflow-x-auto pb-2 lg:pb-0">
            <select
              value={filterClient}
              onChange={(e) => setFilterClient(e.target.value)}
              className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 focus:border-blue-500 outline-none cursor-pointer"
            >
              <option value="all">All Clients</option>
              <option value="PROMETRIC">Prometric</option>
              <option value="PSI">PSI</option>
              <option value="ITTS">ITTS</option>
              <option value="PEARSON VUE">Pearson VUE</option>
              <option value="OTHERS">Others</option>
            </select>
            <button onClick={() => setShowNewCandidateModal(true)} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold flex gap-2 shadow-lg shadow-blue-600/20 active:scale-95 transition-all"><Plus size={18} /> New</button>
          </div>
        </div>

        {/* --- VIEW: TABLE --- */}
        {viewMode === 'table' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-center w-16">#</th>
                    <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Candidate</th>
                    <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Exam</th>
                    <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Client</th>
                    <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Date</th>
                    <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCandidates.map((candidate, idx) => (
                    <tr key={candidate.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-4 text-xs font-bold text-slate-400 text-center">{idx + 1}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-800">{candidate.fullName}</span>
                          <span className="text-[10px] font-mono text-slate-400 mt-0.5">{candidate.confirmationNumber}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-700">{candidate.examName || '-'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wide border ${getClientColor((candidate.clientName || 'OTHERS').toUpperCase())}`}>
                          {(candidate.clientName || 'OTHERS')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-700">{candidate.examDate ? new Date(candidate.examDate).toLocaleDateString() : '-'}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold capitalize border ${statusColors[candidate.status]}`}>
                          {candidate.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEditModal(candidate)} className="p-2 text-slate-400 hover:text-blue-600 bg-transparent hover:bg-blue-50 rounded-lg"><Edit size={16} /></button>
                          <button onClick={() => handleDeleteCandidate(candidate.id, candidate.fullName)} className="p-2 text-slate-400 hover:text-red-600 bg-transparent hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- VIEW: GRID (Small Cards) --- */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredCandidates.map(candidate => (
              <motion.div
                key={candidate.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 hover:shadow-md transition-shadow relative group"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border mb-2 inline-block ${getClientColor((candidate.clientName || 'OTHERS').toUpperCase())}`}>
                      {(candidate.clientName || 'OTHERS')}
                    </span>
                    <h3 className="font-bold text-slate-800 text-sm leading-tight">{candidate.fullName}</h3>
                  </div>
                  <button onClick={() => openEditModal(candidate)} className="text-slate-300 hover:text-blue-600"><Edit size={14} /></button>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Calendar size={12} className="text-slate-400" />
                    <span>{candidate.examDate ? new Date(candidate.examDate).toLocaleDateString() : 'No Date'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Database size={12} className="text-slate-400" />
                    <span>{candidate.examName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Phone size={12} className="text-slate-400" />
                    <span>{candidate.phone || 'N/A'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-md border ${statusColors[candidate.status]}`}>{candidate.status.replace('_', ' ')}</span>
                  <span className="text-[9px] font-mono text-slate-400">{candidate.confirmationNumber.split('-')[1]}</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* --- VIEW: KANBAN (Enhanced) --- */}
        {viewMode === 'kanban' && (
          <div className="flex gap-6 overflow-x-auto pb-6">
            {['registered', 'checked_in', 'in_progress', 'completed'].map(status => (
              <div key={status} className="flex-1 min-w-[300px] bg-slate-100/50 rounded-2xl p-4 border border-slate-200/60 flex flex-col h-[70vh]">
                <div className={`p-4 rounded-xl mb-4 border ${statusColors[status as any]} border-opacity-50 flex items-center justify-between`}>
                  <h3 className="font-black uppercase tracking-tight text-sm text-slate-700">{status.replace('_', ' ')}</h3>
                  <span className="bg-white/50 px-2 py-1 rounded-md text-xs font-bold text-slate-600">
                    {filteredCandidates.filter(c => c.status === status).length}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                  {filteredCandidates.filter(c => c.status === status).map(candidate => (
                    <motion.div
                      layoutId={candidate.id}
                      key={candidate.id}
                      className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 group relative"
                    >
                      {/* Quick Status Move buttons (Hover only) */}
                      <div className="absolute right-2 top-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        {status !== 'completed' && (
                          <button
                            onClick={() => handleUpdateStatus(candidate.id, status === 'registered' ? 'checked_in' : status === 'checked_in' ? 'in_progress' : 'completed')}
                            className="p-1 bg-green-500 text-white rounded hover:bg-green-600 shadow-sm"
                            title="Advance"
                          ><ArrowRight size={12} /></button>
                        )}
                      </div>

                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{candidate.examName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{new Date(candidate.examDate!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm mb-1">{candidate.fullName}</h4>
                      <p className="text-[10px] text-slate-500 flex items-center gap-1 mb-3"><Phone size={10} /> {candidate.phone}</p>

                      <div className="flex items-center gap-2 pt-2 border-t border-slate-50">
                        <div className={`w-2 h-2 rounded-full ${candidate.clientName?.includes('PROMETRIC') ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">{candidate.clientName || 'UNKNOWN'}</span>
                      </div>
                    </motion.div>
                  ))}
                  {filteredCandidates.filter(c => c.status === status).length === 0 && (
                    <div className="text-center py-10 opacity-30">
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Empty Lane</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Modals remain the same (Hidden for brevity in this replace logic, but actual file needs them) */}
      {/* Re-including standard modals to ensure file is complete... */}

      {/* --- ADD MODAL --- */}
      <AnimatePresence>
        {showNewCandidateModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">New Registration</h2>
                <button onClick={() => setShowNewCandidateModal(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={20} className="text-slate-500" /></button>
              </div>

              <div className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Full Name *</label>
                    <input type="text" value={newCandidate.fullName} onChange={e => setNewCandidate({ ...newCandidate, fullName: e.target.value })} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none font-semibold text-slate-800" placeholder="Candidate Name" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Phone Number</label>
                    <input type="tel" value={newCandidate.phone} onChange={e => setNewCandidate({ ...newCandidate, phone: e.target.value })} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none font-semibold text-slate-800" placeholder="+91..." />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Address</label>
                  <input type="text" value={newCandidate.address} onChange={e => setNewCandidate({ ...newCandidate, address: e.target.value })} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none font-semibold text-slate-800" placeholder="Full Address" />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Exam Name</label>
                    <input type="text" value={newCandidate.examName} onChange={e => setNewCandidate({ ...newCandidate, examName: e.target.value })} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none font-semibold text-slate-800" placeholder="e.g. TOEFL" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Exam Date</label>
                    <input type="date" value={newCandidate.examDate} onChange={e => setNewCandidate({ ...newCandidate, examDate: e.target.value })} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none font-semibold text-slate-800" />
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <p className="text-xs text-blue-800 font-medium">
                    <MapPin size={12} className="inline mr-1" />
                    This entry will be registered to: <span className="font-bold">{activeBranch?.toUpperCase()}</span>
                  </p>
                </div>

                <button onClick={handleCreateCandidate} className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold uppercase tracking-wider text-sm shadow-lg shadow-blue-600/20 active:scale-[0.99] transition-all">
                  Register Candidate
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- EDIT MODAL --- */}
      <AnimatePresence>
        {showEditCandidateModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Edit details</h2>
                <button onClick={() => setShowEditCandidateModal(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={20} className="text-slate-500" /></button>
              </div>

              <div className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Full Name</label>
                    <input type="text" value={editCandidate.fullName} onChange={e => setEditCandidate({ ...editCandidate, fullName: e.target.value })} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none font-semibold text-slate-800" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Status</label>
                    <select value={editCandidate.status} onChange={e => setEditCandidate({ ...editCandidate, status: e.target.value as any })} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none font-semibold text-slate-800">
                      <option value="registered">Registered</option>
                      <option value="checked_in">Checked In</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="no_show">No Show</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Notes</label>
                  <textarea rows={3} value={editCandidate.notes} onChange={e => setEditCandidate({ ...editCandidate, notes: e.target.value })} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none font-semibold text-slate-800 resize-none" placeholder="Add optional notes..." />
                </div>

                <button onClick={handleEditCandidate} className="w-full py-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold uppercase tracking-wider text-sm shadow-lg active:scale-[0.99] transition-all">
                  Update Asset
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}
