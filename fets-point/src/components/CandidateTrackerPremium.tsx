import { useState, useMemo, memo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Plus, Search, Edit, UserCheck, UserX, Phone, X, Calendar,
  Trash2, FileText, Download, ChevronLeft, ChevronRight,
  CheckCircle, Grid, List, FileSpreadsheet, MapPin, Activity, TrendingUp
} from 'lucide-react'
import { CandidateAnalysis } from './CandidateAnalysis'
import { useAuth } from '../hooks/useAuth'
import { useBranch } from '../hooks/useBranch'
import { useBranchFilter } from '../hooks/useBranchFilter'
import {
  useCandidates,
  useCreateCandidate,
  useUpdateCandidateStatus,
  useUpdateCandidate,
  useDeleteCandidate
} from '../hooks/useQueries'
import { toast } from 'react-hot-toast'
import * as XLSX from 'xlsx'
import { format, subMonths } from 'date-fns'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface Candidate {
  id: string
  fullName: string
  address: string
  phone?: string
  examDate?: Date
  examName?: string
  status: 'registered' | 'completed' | 'no_show'
  confirmationNumber: string
  notes?: string
  createdAt: Date
  clientName?: string
  branchLocation?: string
}

const CLIENT_LOGOS: Record<string, string> = {
  'PROMETRIC': '/client-logos/prometric.png',
  'PSI': '/client-logos/psi.png',
  'ITTS': '/client-logos/itts.png',
  'PEARSON VUE': '/client-logos/pearson_vue.png'
}

// Simple Clean Card Component
const CandidateCard = memo(({ candidate, onEdit, onDelete, onToggleNoShow }: any) => {
  const clientLogo = candidate.clientName ? CLIENT_LOGOS[candidate.clientName.toUpperCase()] : '/fets-point-logo.png'
  const isNoShow = candidate.status === 'no_show'

  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow ${isNoShow ? 'opacity-60' : ''}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-white rounded-lg border border-gray-200 flex items-center justify-center p-2">
            <img src={clientLogo} alt="" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wide">{candidate.clientName || 'General'}</div>
            <div className="text-xs font-mono text-blue-600">{candidate.confirmationNumber}</div>
          </div>
        </div>

        {/* No Show Checkbox */}
        <button
          onClick={() => onToggleNoShow(candidate.id, isNoShow)}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${isNoShow
            ? 'bg-red-50 text-red-600 border border-red-200'
            : 'bg-gray-50 text-gray-400 border border-gray-200 hover:border-red-200'
            }`}
        >
          {isNoShow ? <CheckCircle size={14} /> : <div className="w-3.5 h-3.5 rounded border-2 border-current" />}
          <span>Absent</span>
        </button>
      </div>

      {/* Name and Exam */}
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900 mb-1">{candidate.fullName}</h3>
        <p className="text-sm text-gray-500">{candidate.examName || 'General Exam'}</p>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
        <div>
          <div className="text-xs text-gray-400 mb-1">Exam Date</div>
          <div className="text-sm font-medium text-gray-700">
            {candidate.examDate ? format(candidate.examDate, 'dd/MM/yyyy') : 'Not set'}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-400 mb-1">Phone</div>
          <div className="text-sm font-medium text-gray-700">{candidate.phone || 'N/A'}</div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onEdit(candidate)}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={() => onDelete(candidate.id)}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
          >
            <Trash2 size={16} />
          </button>
        </div>

        <button
          onClick={() => onEdit(candidate)}
          className="px-4 py-2 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-blue-600 transition-all"
        >
          View Details
        </button>
      </div>
    </div>
  )
})



export function CandidateTrackerPremium() {
  const { user, profile } = useAuth()
  const { activeBranch } = useBranch()
  const { isGlobalView } = useBranchFilter()

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [activeTab, setActiveTab] = useState<'register' | 'analysis'>('register')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterClient, setFilterClient] = useState('all')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [locationFilter, setLocationFilter] = useState(activeBranch || 'all')

  useEffect(() => {
    setLocationFilter(activeBranch || 'all')
  }, [activeBranch])

  const [showModal, setShowModal] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null)

  const [formData, setFormData] = useState({
    fullName: '', phone: '', address: '',
    examDate: new Date().toISOString().slice(0, 10),
    examName: '', clientName: '', notes: ''
  })

  // Queries
  const filters = useMemo(() => ({
    branch_location: locationFilter !== 'all' ? locationFilter : undefined
  }), [locationFilter])

  const { data: rawCandidates, isLoading, refetch } = useCandidates(filters)

  // Mutations
  const createMutation = useCreateCandidate()
  const updateStatusMutation = useUpdateCandidateStatus()
  const updateMutation = useUpdateCandidate()
  const deleteMutation = useDeleteCandidate()

  // Process data
  const candidates: Candidate[] = useMemo(() => rawCandidates?.map(c => ({
    id: c.id, fullName: c.full_name, address: c.address, phone: c.phone || '',
    examDate: c.exam_date ? new Date(c.exam_date) : undefined,
    examName: c.exam_name || 'General Exam',
    status: (c.status as Candidate['status']) || 'registered',
    confirmationNumber: c.confirmation_number || 'N/A',
    createdAt: new Date(c.created_at), clientName: c.client_name,
    branchLocation: c.branch_location, notes: c.notes || ''
  })) || [], [rawCandidates])

  const filteredCandidates = useMemo(() => {
    const s = searchQuery.toLowerCase();
    return candidates.filter(c => {
      const matchSearch = c.fullName.toLowerCase().includes(s) || c.confirmationNumber.toLowerCase().includes(s);
      const matchClient = filterClient === 'all' || (c.clientName || '').toUpperCase() === filterClient.toUpperCase();
      return matchSearch && matchClient;
    })
  }, [candidates, searchQuery, filterClient])

  // Stats - Total registered MINUS no-shows
  const { totalRegistered, noShows, netCount } = useMemo(() => {
    const reg = candidates.filter(c => c.status === 'registered').length;
    const ns = candidates.filter(c => c.status === 'no_show').length;
    return { totalRegistered: reg, noShows: ns, netCount: reg - ns };
  }, [candidates]);

  // Handlers
  const handleOpenAdd = () => {
    setIsEdit(false)
    setFormData({
      fullName: '', phone: '', address: '',
      examDate: new Date().toISOString().slice(0, 10),
      examName: '', clientName: '', notes: ''
    })
    setShowModal(true)
  }

  const handleOpenEdit = (c: Candidate) => {
    setIsEdit(true)
    setSelectedCandidate(c)
    setFormData({
      fullName: c.fullName,
      phone: c.phone || '',
      address: c.address || '',
      examDate: c.examDate ? format(c.examDate, 'yyyy-MM-dd') : '',
      examName: c.examName || '',
      clientName: c.clientName || '',
      notes: c.notes || ''
    })
    setShowModal(true)
  }

  const handleToggleNoShow = (id: string, currentIsNoShow: boolean) => {
    const newStatus = currentIsNoShow ? 'registered' : 'no_show'
    updateStatusMutation.mutate({ id, status: newStatus }, {
      onSuccess: () => refetch()
    })
  }

  const handleDelete = (id: string) => {
    if (confirm("Delete this candidate entry?")) {
      deleteMutation.mutate(id, { onSuccess: () => refetch() })
    }
  }

  const handleSave = () => {
    if (!formData.fullName || !formData.clientName) {
      return toast.error("Please fill in Full Name and Client Name")
    }

    const payload: any = {
      full_name: formData.fullName,
      phone: formData.phone,
      address: formData.address,
      exam_date: formData.examDate,
      exam_name: formData.examName,
      client_name: formData.clientName,
      notes: formData.notes,
      branch_location: activeBranch,
      user_id: user?.id
    }

    if (isEdit) {
      updateMutation.mutate({ id: selectedCandidate.id, updates: payload }, {
        onSuccess: () => {
          setShowModal(false);
          refetch();
        }
      })
    } else {
      payload.status = 'registered';
      payload.confirmation_number = `FETS-${Math.floor(100000 + Math.random() * 900000)}`;
      createMutation.mutate(payload, {
        onSuccess: () => {
          setShowModal(false);
          refetch();
        }
      })
    }
  }

  const exportToExcel = () => {
    const data = filteredCandidates.map(c => ({
      'Date': c.examDate ? format(c.examDate, 'dd/MM/yyyy') : '',
      'Name': c.fullName,
      'Phone no': c.phone || 'N/A',
      'Place': c.address || 'N/A'
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Candidates")
    XLSX.writeFile(wb, `FETS_Register_${format(new Date(), 'ddMMyyyy')}.xlsx`)
    toast.success("Excel file downloaded")
  }

  const exportToPDF = () => {
    const doc = new jsPDF()
    const tableData = filteredCandidates.map(c => [
      c.examDate ? format(c.examDate, 'dd/MM/yyyy') : '',
      c.fullName,
      c.phone || 'N/A',
      c.address || 'N/A'
    ])
    autoTable(doc, {
      head: [['Date', 'Name', 'Phone no', 'Place']],
      body: tableData,
      styles: { fontSize: 8 }
    })
    doc.save(`FETS_Register_${format(new Date(), 'ddMMyyyy')}.pdf`)
    toast.success("PDF report downloaded")
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading candidates...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen -mt-32 pt-56 bg-[#e0e5ec]" style={{ fontFamily: "'Montserrat', sans-serif" }}>
      {/* Functional Notification Banner Spacer */}
      <div className="h-6 -mx-8 -mt-8 mb-8"></div>

      <div className="max-w-[1800px] mx-auto px-6">
        {/* Executive Header - Neumorphic */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4"
        >
          <div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gold-gradient mb-2 uppercase">
              FETS Register
            </h1>
            <p className="text-lg text-gray-600 font-medium">
              {activeBranch && activeBranch !== 'global' ? `${activeBranch.charAt(0).toUpperCase() + activeBranch.slice(1)} · ` : ''}Candidate Tracking & Management
            </p>
          </div>
          <div className="text-right">
            <p className="text-gray-500 font-semibold uppercase tracking-wider text-sm">
              {new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <div className="flex space-x-2 mb-8 p-1.5 bg-slate-200/50 rounded-2xl w-fit shadow-inner">
          <button
            onClick={() => setActiveTab('register')}
            className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all ${activeTab === 'register' ? 'bg-white shadow-md text-slate-800 transform scale-105' : 'text-slate-500 hover:bg-white/50'}`}
          >
            <List size={14} />
            Registry Journal
          </button>
          <button
            onClick={() => setActiveTab('analysis')}
            className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all ${activeTab === 'analysis' ? 'bg-white shadow-md text-slate-800 transform scale-105' : 'text-slate-500 hover:bg-white/50'}`}
          >
            <Activity size={14} />
            Intelligence Analysis
          </button>
        </div>

        {activeTab === 'register' ? (
          <>
            {/* Control Toolbar - Neumorphic */}
            <div className="neomorphic-card p-4 mb-8 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                {/* Location Filter */}
                <div className="flex items-center px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm min-w-[140px]">
                  <MapPin size={16} className="text-amber-500 mr-2" />
                  <select
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    className="bg-transparent border-none outline-none text-xs font-bold uppercase tracking-widest text-slate-600 cursor-pointer w-full"
                  >
                    <option value="all">All Locations</option>
                    <option value="calicut">Calicut</option>
                    <option value="cochin">Cochin</option>
                    <option value="kannur">Kannur</option>
                    <option value="global">Global</option>
                  </select>
                </div>

                {/* Month Navigation */}
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                    className="neomorphic-btn-icon"
                    title="Previous month"
                  >
                    <ChevronLeft className="h-5 w-5 text-gray-600" />
                  </button>
                  <div className="text-xl font-bold text-gray-700 min-w-[200px] text-center">
                    {format(currentDate, 'MMMM yyyy')}
                  </div>
                  <button
                    onClick={() => setCurrentDate(subMonths(currentDate, -1))}
                    className="neomorphic-btn-icon"
                    title="Next month"
                  >
                    <ChevronRight className="h-5 w-5 text-gray-600" />
                  </button>
                </div>

                <button
                  onClick={() => setCurrentDate(new Date())}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-semibold rounded-lg shadow-sm hover:bg-slate-50 transition-colors text-sm"
                >
                  Today
                </button>
              </div>

              <div className="flex items-center space-x-4 flex-wrap gap-2">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search candidates..."
                    className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none w-64 shadow-sm"
                  />
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-amber-600' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    <Grid size={18} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-amber-600' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    <List size={18} />
                  </button>
                </div>

                {/* Export Actions */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={exportToExcel}
                    className="p-2.5 bg-white border border-slate-200 text-green-600 rounded-xl shadow-sm hover:shadow-md hover:bg-green-50 transition-all"
                    title="Export to Excel"
                  >
                    <FileSpreadsheet size={18} />
                  </button>
                  <button
                    onClick={exportToPDF}
                    className="p-2.5 bg-white border border-slate-200 text-red-600 rounded-xl shadow-sm hover:shadow-md hover:bg-red-50 transition-all"
                    title="Export to PDF"
                  >
                    <FileText size={18} />
                  </button>
                </div>

                {/* Add Candidate Button */}
                <button
                  onClick={handleOpenAdd}
                  className="px-5 py-2.5 bg-gradient-to-r from-slate-800 to-slate-900 text-white flex items-center space-x-2 font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
                >
                  <Plus size={18} />
                  <span>Add Candidate</span>
                </button>
              </div>
            </div>

            {/* Stats Section - Premium Chips */}
            <div className="flex flex-wrap gap-4 mb-8">
              <div className="px-6 py-4 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Registered</span>
                <span className="text-2xl font-black text-slate-800">{totalRegistered}</span>
              </div>
              <div className="px-6 py-4 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">Total Absent</span>
                <span className="text-2xl font-black text-rose-600">{noShows}</span>
              </div>
              <div className="px-6 py-4 bg-amber-50 rounded-2xl shadow-sm border border-amber-100 flex flex-col">
                <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Net Candidates</span>
                <span className="text-2xl font-black text-amber-700">{netCount}</span>
              </div>
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-4 mb-6">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Show Client:</span>
              <div className="flex flex-wrap gap-2">
                {['all', 'PROMETRIC', 'PSI', 'ITTS', 'PEARSON VUE'].map((client) => (
                  <button
                    key={client}
                    onClick={() => setFilterClient(client)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${filterClient === client
                      ? 'bg-amber-500 text-white shadow-md'
                      : 'bg-white text-slate-500 border border-slate-200 hover:border-amber-300'
                      }`}
                  >
                    {client.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Candidates Grid/List Content */}
            <div className="bg-white/80 backdrop-blur-sm rounded-[2.5rem] p-8 shadow-[inset_1px_1px_2px_rgba(255,255,255,0.8),9px_9px_16px_#bec3c9] min-h-[600px] border border-white/60">
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredCandidates.map(candidate => (
                    <CandidateCard
                      key={candidate.id}
                      candidate={candidate}
                      onEdit={handleOpenEdit}
                      onDelete={handleDelete}
                      onToggleNoShow={handleToggleNoShow}
                    />
                  ))}
                  {filteredCandidates.length === 0 && (
                    <div className="col-span-full py-20 text-center opacity-60">
                      <Search size={48} className="mx-auto mb-4 text-slate-300" />
                      <p className="text-xl font-bold text-slate-400">No candidates found matching your criteria</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">ID</th>
                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Name</th>
                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Client</th>
                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Exam</th>
                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                        <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredCandidates.map(candidate => (
                        <tr key={candidate.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-blue-600 font-bold">
                            {candidate.confirmationNumber}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">
                            {candidate.fullName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-medium">
                            {candidate.clientName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-medium">
                            {candidate.examName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 inline-flex text-[10px] leading-5 font-black uppercase tracking-tight rounded-full ${candidate.status === 'no_show'
                              ? 'bg-red-100 text-red-600'
                              : candidate.status === 'completed'
                                ? 'bg-emerald-100 text-emerald-600'
                                : 'bg-blue-100 text-blue-600'
                              }`}>
                              {candidate.status?.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                            <button
                              onClick={() => handleOpenEdit(candidate)}
                              className="text-amber-600 hover:text-amber-700 font-bold"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(candidate.id)}
                              className="text-rose-600 hover:text-rose-700 font-bold"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                      {filteredCandidates.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-6 py-20 text-center opacity-60">
                            <p className="text-sm font-bold text-slate-400">No candidates found matching your criteria</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : (
          <CandidateAnalysis onClose={() => setActiveTab('register')} />
        )}
      </div>

      {/* Modal - Clean and Simple like the image */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-8 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {isEdit ? 'Update Candidate' : 'New Registration'}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Enter candidate details below
                    </p>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5 text-gray-400" />
                  </button>
                </div>
              </div>

              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                      Full Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. John Doe"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                      Phone
                    </label>
                    <input
                      type="text"
                      placeholder="+91..."
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                      Exam Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. TOEFL iBT"
                      value={formData.examName}
                      onChange={(e) => setFormData({ ...formData, examName: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                      Client Name
                    </label>
                    <select
                      value={formData.clientName}
                      onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    >
                      <option value="">Type or select client...</option>
                      <option value="PROMETRIC">PROMETRIC</option>
                      <option value="PSI">PSI</option>
                      <option value="ITTS">ITTS</option>
                      <option value="PEARSON VUE">PEARSON VUE</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                      Exam Date
                    </label>
                    <input
                      type="date"
                      value={formData.examDate}
                      onChange={(e) => setFormData({ ...formData, examDate: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                      Address
                    </label>
                    <input
                      type="text"
                      placeholder="City, State"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                      Notes
                    </label>
                    <textarea
                      placeholder="Additional requirements..."
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none"
                    />
                  </div>
                </div>
              </div>

              <div className="p-8 border-t border-gray-200 flex items-center justify-end space-x-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-8 py-3 bg-yellow-400 text-black rounded-lg hover:bg-yellow-500 font-semibold transition-colors"
                >
                  {isEdit ? 'Update' : 'Register Candidate'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div >
  )
}

export default CandidateTrackerPremium
