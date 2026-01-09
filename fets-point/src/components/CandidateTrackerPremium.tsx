import { useState, useMemo, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Plus, Search, Edit, UserCheck, UserX, Phone, X, Calendar,
  Trash2, FileText, Download, ChevronLeft, ChevronRight,
  CheckCircle, Grid, List, FileSpreadsheet
} from 'lucide-react'
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
  'ETS': '/client-logos/ets.png',
  'PEARSON VUE': '/client-logos/pearson.png',
  'PSI': '/client-logos/psi.png'
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
  const { user } = useAuth()
  const { activeBranch } = useBranch()
  const { isGlobalView } = useBranchFilter()

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterClient, setFilterClient] = useState('all')
  const [currentDate, setCurrentDate] = useState(new Date())

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
    branch_location: !isGlobalView ? activeBranch : undefined
  }), [isGlobalView, activeBranch])

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
      'Confirmation': c.confirmationNumber,
      'Full Name': c.fullName,
      'Client': c.clientName,
      'Exam': c.examName,
      'Date': c.examDate ? format(c.examDate, 'dd/MM/yyyy') : '',
      'Phone': c.phone,
      'Status': c.status
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
      c.confirmationNumber,
      c.fullName,
      c.clientName || '',
      c.examName || '',
      c.examDate ? format(c.examDate, 'dd/MM/yyyy') : '',
      c.status
    ])
    autoTable(doc, {
      head: [['ID', 'Name', 'Client', 'Exam', 'Date', 'Status']],
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">

      {/* FETS Roster Style Header - Yellow Gradient */}
      <div className="sticky top-0 z-30 bg-gradient-to-r from-yellow-400 to-yellow-500 shadow-lg">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-3xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                FETS Register
              </h1>
            </div>

            <div className="flex items-center space-x-6">
              {/* Date Navigator */}
              <div className="flex items-center space-x-2 bg-white/20 p-1 rounded-lg">
                <button
                  onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                  className="p-2 rounded-lg hover:bg-white/20 text-white"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <h2 className="text-lg font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {format(currentDate, 'MMMM yyyy')}
                </h2>
                <button
                  onClick={() => setCurrentDate(subMonths(currentDate, -1))}
                  className="p-2 rounded-lg hover:bg-white/20 text-white"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center space-x-2 bg-white/20 p-1 rounded-lg">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium ${viewMode === 'grid' ? 'bg-white text-yellow-800 shadow' : 'text-white'
                    }`}
                >
                  Cards
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium ${viewMode === 'list' ? 'bg-white text-yellow-800 shadow' : 'text-white'
                    }`}
                >
                  List
                </button>
              </div>

              {/* Add Button */}
              <button
                onClick={handleOpenAdd}
                className="px-4 py-2 bg-yellow-400 text-black rounded-lg hover:bg-yellow-500 flex items-center space-x-2 font-semibold"
              >
                <Plus className="h-4 w-4" />
                <span>New Entry</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6">

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-500 uppercase tracking-wide">Net Registered</div>
              <Users className="h-5 w-5 text-blue-500" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{netCount}</div>
            <div className="text-xs text-gray-400 mt-1">Total minus absentees</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-500 uppercase tracking-wide">Total Registered</div>
              <FileText className="h-5 w-5 text-green-500" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{totalRegistered}</div>
            <div className="text-xs text-gray-400 mt-1">All registrations</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-500 uppercase tracking-wide">No Shows</div>
              <UserX className="h-5 w-5 text-red-500" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{noShows}</div>
            <div className="text-xs text-gray-400 mt-1">Marked as absent</div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setFilterClient('all')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${filterClient === 'all'
                    ? 'bg-yellow-400 text-black'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                All
              </button>
              {['PROMETRIC', 'ETS', 'PEARSON VUE', 'PSI'].map(client => (
                <button
                  key={client}
                  onClick={() => setFilterClient(client)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${filterClient === client
                      ? 'bg-yellow-400 text-black'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  {client.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={exportToExcel}
              className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
              title="Export to Excel"
            >
              <FileSpreadsheet className="h-5 w-5" />
            </button>
            <button
              onClick={exportToPDF}
              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
              title="Export to PDF"
            >
              <Download className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Candidates Grid/List */}
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
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exam</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCandidates.map(candidate => (
                  <tr key={candidate.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-blue-600">
                      {candidate.confirmationNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {candidate.fullName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {candidate.clientName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {candidate.examName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${candidate.status === 'no_show'
                          ? 'bg-red-100 text-red-800'
                          : candidate.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                        {candidate.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleOpenEdit(candidate)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(candidate.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
                      <option value="ETS">ETS</option>
                      <option value="PEARSON VUE">PEARSON VUE</option>
                      <option value="PSI">PSI</option>
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
    </div>
  )
}

export default CandidateTrackerPremium
