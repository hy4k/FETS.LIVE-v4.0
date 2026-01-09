import { useState, useMemo } from 'react'
import {
  Users, Plus, Search, Filter, Eye, Edit, UserCheck, UserX, Clock, Phone, Mail, X, Calendar,
  Upload, Trash2, MoreVertical, FileText, Download, PieChart, BarChart2, TrendingUp, Layers
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useBranch } from '../hooks/useBranch'
import { useBranchFilter } from '../hooks/useBranchFilter'
import { useCandidates, useCreateCandidate, useUpdateCandidateStatus, useClients } from '../hooks/useQueries'
import { toast } from 'react-hot-toast'
import * as XLSX from 'xlsx'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart as RePieChart, Pie, Cell, AreaChart, Area
} from 'recharts'
import { format, isSameDay } from 'date-fns'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

/* --------------------------------------------------------------------------------
 * Types & Interfaces
 * -------------------------------------------------------------------------------- */

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

interface ModernStatsCardProps {
  title: string
  value: string | number
  subtitle: string
  icon: React.ElementType
  colorEncoded?: string // hex color
  trend?: string
  onClick?: () => void
  clickable?: boolean
}

interface EditCandidateData {
  fullName: string
  address: string
  phone: string
  examDate: string
  examName: string
  notes: string
  clientName: string
}

/* --------------------------------------------------------------------------------
 * Helper Functions & Constants
 * -------------------------------------------------------------------------------- */

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];
const STATUS_COLORS: Record<string, string> = {
  registered: '#3B82F6', // blue
  checked_in: '#F59E0B', // amber
  in_progress: '#8B5CF6', // purple
  completed: '#10B981', // green
  no_show: '#EF4444', // red
  cancelled: '#6B7280' // gray
};

const deriveClientFromExamName = (name?: string): string => {
  const n = (name || '').toUpperCase()
  if (n.includes('CMA US')) return 'PROMETRIC'
  if (n.includes('GRE') || n.includes('TOEFL')) return 'ETS'
  if (n.includes('VUE') || n.includes('PEARSON')) return 'PEARSON VUE'
  return 'PEARSON VUE'
}

const CLIENT_STYLE: Record<string, { border: string; tint: string; text: string; badge: string }> = {
  'PROMETRIC': { border: '#EF4444', tint: 'bg-red-50', text: 'text-red-700', badge: 'bg-red-100 text-red-800' },
  'ETS': { border: '#F97316', tint: 'bg-orange-50', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-800' },
  'PEARSON VUE': { border: '#3B82F6', tint: 'bg-blue-50', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-800' },
  'PSI': { border: '#8B5CF6', tint: 'bg-purple-50', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-800' },
  'OTHERS': { border: '#6B7280', tint: 'bg-gray-50', text: 'text-gray-700', badge: 'bg-gray-100 text-gray-800' }
}

/* --------------------------------------------------------------------------------
 * Components
 * -------------------------------------------------------------------------------- */

function ModernStatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  colorEncoded = '#06b6d4', // cyan-500 default
  trend,
  onClick,
  clickable = false
}: ModernStatsCardProps) {
  return (
    <div
      onClick={clickable ? onClick : undefined}
      className={`
        relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5 transition-all duration-300
        hover:shadow-md hover:-translate-y-1
        ${clickable ? 'cursor-pointer' : ''}
      `}
    >
      <div className="flex items-center gap-4">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-xl transition-transform group-hover:scale-110"
          style={{ backgroundColor: `${colorEncoded}20`, color: colorEncoded }} // 20 hex = ~12% opacity
        >
          <Icon size={24} />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
            {trend && <span className="text-xs font-medium text-green-600">{trend}</span>}
          </div>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2">
        <div className="h-1.5 w-full flex-1 rounded-full bg-gray-100 overflow-hidden">
          <div className="h-full rounded-full" style={{ width: '70%', backgroundColor: colorEncoded }}></div>
        </div>
        <p className="text-xs text-gray-400">{subtitle}</p>
      </div>
    </div>
  )
}

function AnalysisView({ candidates }: { candidates: Candidate[] }) {
  // Aggregate data for charts
  const statusData = useMemo(() => {
    const counts: Record<string, number> = {}
    candidates.forEach(c => {
      counts[c.status] = (counts[c.status] || 0) + 1
    })
    return Object.keys(counts).map(key => ({
      name: key.replace('_', ' ').toUpperCase(),
      value: counts[key],
      color: STATUS_COLORS[key] || '#999'
    }))
  }, [candidates])

  const clientData = useMemo(() => {
    const counts: Record<string, number> = {}
    candidates.forEach(c => {
      const client = (c.clientName || deriveClientFromExamName(c.examName)).toUpperCase()
      counts[client] = (counts[client] || 0) + 1
    })
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5) // Top 5
  }, [candidates])

  const activityData = useMemo(() => {
    // Last 7 days or current month view could be complex, simple aggregation by date
    const counts: Record<string, number> = {}
    candidates.forEach(c => {
      if (c.examDate) {
        const dateStr = format(c.examDate, 'MMM dd')
        counts[dateStr] = (counts[dateStr] || 0) + 1
      }
    })
    // Sort by date would need real date objects, simplified here for demo
    return Object.entries(counts).map(([date, count]) => ({ date, count })).slice(-10)
  }, [candidates])

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <PieChart className="h-5 w-5 text-cyan-500" />
            Candidate Status Distribution
          </h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend />
              </RePieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Client Distribution */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-purple-500" />
            Top Clients
          </h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={clientData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                <RechartsTooltip cursor={{ fill: 'transparent' }} />
                <Bar dataKey="value" fill="#8884d8" radius={[0, 4, 4, 0]}>
                  {clientData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Activity Trend */}
        <div className="lg:col-span-2 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            Exam Activity (Recent)
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" />
                <YAxis />
                <RechartsTooltip />
                <Area type="monotone" dataKey="count" stroke="#06b6d4" fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}

export function CandidateTrackerPremium() {
  const { user, profile } = useAuth()
  const { activeBranch } = useBranch()
  const { applyFilter, isGlobalView } = useBranchFilter()
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
  const [showNewCandidateModal, setShowNewCandidateModal] = useState(false)
  const [showEditCandidateModal, setShowEditCandidateModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterClient, setFilterClient] = useState('all')
  const [filterDate, setFilterDate] = useState('')
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'tracker' | 'analysis'>('tracker')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid')

  const { data: clients } = useClients()

  // Form State
  const [newCandidate, setNewCandidate] = useState({
    fullName: '',
    address: '',
    phone: '',
    examDate: new Date().toISOString().slice(0, 10),
    examName: '',
    notes: '',
    clientName: ''
  })

  const [editCandidate, setEditCandidate] = useState<EditCandidateData>({
    fullName: '',
    address: '',
    phone: '',
    examDate: '',
    examName: '',
    notes: '',
    clientName: ''
  })

  // Queries
  const filters = {
    date: filterDate || undefined,
    status: filterStatus !== 'all' ? filterStatus : undefined,
    branch_location: !isGlobalView ? activeBranch : undefined
  }

  const { data: candidatesData, isLoading: loading, refetch } = useCandidates(filters)
  const createCandidateMutation = useCreateCandidate()
  const updateStatusMutation = useUpdateCandidateStatus()

  // Derived Data
  const candidates: Candidate[] = useMemo(() => candidatesData?.map(candidate => ({
    id: candidate.id,
    fullName: candidate.full_name,
    address: candidate.address,
    phone: candidate.phone,
    examDate: candidate.exam_date ? new Date(candidate.exam_date) : undefined,
    examName: candidate.exam_name || 'Exam Session',
    status: candidate.status as Candidate['status'],
    confirmationNumber: candidate.confirmation_number || 'N/A',
    checkInTime: candidate.check_in_time ? new Date(candidate.check_in_time) : undefined,
    notes: candidate.notes,
    createdAt: new Date(candidate.created_at),
    clientName: candidate.client_name || deriveClientFromExamName(candidate.exam_name),
    branchLocation: candidate.branch_location
  })) || [], [candidatesData])

  const filteredCandidates = useMemo(() => candidates.filter(candidate => {
    const matchesSearch =
      candidate.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      candidate.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      candidate.confirmationNumber.toLowerCase().includes(searchQuery.toLowerCase())

    const clientComputed = (candidate.clientName || deriveClientFromExamName(candidate.examName)).toUpperCase()
    const matchesClient = filterClient === 'all' || clientComputed === filterClient.toUpperCase()

    return matchesSearch && matchesClient
  }), [candidates, searchQuery, filterClient])

  // Handlers
  const generateConfirmationNumber = () => {
    const prefix = 'EXAM'
    const timestamp = Date.now().toString().slice(-6)
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    return `${prefix}-${timestamp}-${random}`
  }

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

    if (!isGlobalView) {
      candidateData.branch_location = activeBranch
    }

    createCandidateMutation.mutate(candidateData, {
      onSuccess: () => {
        setNewCandidate({ fullName: '', address: '', phone: '', examDate: new Date().toISOString().slice(0, 10), examName: '', notes: '', clientName: '' })
        setShowNewCandidateModal(false)
        toast.success("Candidate registered successfully")
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
          client_name: editCandidate.clientName || null
        })
        .eq('id', selectedCandidate.id)

      if (error) throw error

      refetch()
      setShowEditCandidateModal(false)
      setSelectedCandidate(null)
      toast.success('Candidate updated successfully!')
    } catch (error: any) {
      console.error('Error updating candidate:', error)
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
      toast.error('Deletion failed: ' + error.message)
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
      clientName: candidate.clientName || ''
    })
    setShowEditCandidateModal(true)
  }

  // Export Functions
  const exportToExcel = () => {
    const data = filteredCandidates.map(c => ({
      Name: c.fullName,
      Phone: c.phone || 'N/A',
      Client: (c.clientName || deriveClientFromExamName(c.examName)),
      Exam: c.examName,
      Date: c.examDate ? format(c.examDate, 'yyyy-MM-dd') : 'N/A',
      Status: c.status
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Candidates")
    XLSX.writeFile(wb, `Candidates_${format(new Date(), 'yyyyMMdd')}.xlsx`)
    toast.success("Excel exported successfully")
  }

  const exportToPDF = () => {
    const doc = new jsPDF()
    const tableData = filteredCandidates.map(c => [
      c.fullName,
      c.phone || 'N/A',
      (c.clientName || deriveClientFromExamName(c.examName)),
      c.examName || 'N/A',
      c.examDate ? format(c.examDate, 'yyyy-MM-dd') : 'N/A',
      c.status.replace('_', ' ').toUpperCase()
    ])

    doc.setFontSize(20)
    doc.setTextColor(40)
    doc.text('FETS Register - Candidate Report', 14, 22)
    doc.setFontSize(11)
    doc.setTextColor(100)
    doc.text(`Generated on: ${format(new Date(), 'PPP p')}`, 14, 30)

    autoTable(doc, {
      startY: 40,
      head: [['Full Name', 'Phone', 'Client', 'Exam', 'Date', 'Status']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [6, 182, 212], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    })

    doc.save(`Candidates_${format(new Date(), 'yyyyMMdd')}.pdf`)
    toast.success("PDF exported successfully")
  }

  const isSuperAdmin = profile?.role === 'super_admin'

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50/50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent"></div>
          <p className="font-medium text-gray-500 font-outfit">Loading candidates...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50/80 p-6 font-outfit">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">FETS Register</h1>
          <p className="text-gray-500 mt-1">Manage and track candidate examinations efficiently</p>
        </div>
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-gray-200 shadow-sm">
          <button
            onClick={() => setActiveTab('tracker')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'tracker' ? 'bg-cyan-50 text-cyan-700 shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            Tracker
          </button>
          <button
            onClick={() => setActiveTab('analysis')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'analysis' ? 'bg-cyan-50 text-cyan-700 shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <PieChart size={16} />
            Analysis
          </button>
        </div>
      </div>

      {activeTab === 'tracker' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <ModernStatsCard
              title="Total Registered"
              value={candidates.filter(c => c.status === 'registered').length}
              subtitle="Pending check-in"
              icon={Users}
              colorEncoded="#3B82F6"
            />
            <ModernStatsCard
              title="In Progress"
              value={candidates.filter(c => c.status === 'in_progress').length}
              subtitle="Currently testing"
              icon={Clock}
              colorEncoded="#8B5CF6"
            />
            <ModernStatsCard
              title="Completed Today"
              value={candidates.filter(c => c.status === 'completed' && isSameDay(c.createdAt, new Date())).length}
              subtitle="Finished successfully"
              icon={UserCheck}
              colorEncoded="#10B981"
            />
            <ModernStatsCard
              title="Issues / No Shows"
              value={candidates.filter(c => ['no_show', 'cancelled'].includes(c.status)).length}
              subtitle="Requires attention"
              icon={UserX}
              colorEncoded="#EF4444"
            />
          </div>

          {/* Action & Filter Bar */}
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-900/5 flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
            <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
              <div className="relative group min-w-[300px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-cyan-500 transition-colors" size={18} />
                <input
                  type="text"
                  placeholder="Search name, confirmation, or address..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 outline-none transition-all placeholder:text-gray-400"
                />
              </div>
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                {['ALL', 'PROMETRIC', 'PEARSON VUE', 'ETS'].map(client => (
                  <button
                    key={client}
                    onClick={() => setFilterClient(client === 'ALL' ? 'all' : client)}
                    className={`
                          whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all border
                          ${(filterClient === 'all' && client === 'ALL') || filterClient === client
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'}
                        `}
                  >
                    {client}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 self-end xl:self-auto">
              <button
                onClick={() => setShowNewCandidateModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl shadow-lg shadow-cyan-500/20 transition-all active:scale-95 font-medium"
              >
                <Plus size={18} />
                <span className="hidden sm:inline">Add Candidate</span>
                <span className="sm:hidden">Add</span>
              </button>

              <div className="h-8 w-[1px] bg-gray-200 mx-2"></div>

              <div className="flex rounded-lg bg-gray-100 p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <Layers size={18} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <FileText size={18} />
                </button>
              </div>

              {isSuperAdmin && (
                <div className="relative group">
                  <button className="p-2.5 rounded-xl bg-white border border-gray-200 text-gray-600 hover:border-gray-300 transition-all">
                    <Download size={18} />
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 p-1 hidden group-hover:block z-20">
                    <button onClick={exportToExcel} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">
                      <span className="text-green-600 text-xs font-bold w-6">XLS</span> Export Excel
                    </button>
                    <button onClick={exportToPDF} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">
                      <span className="text-red-600 text-xs font-bold w-6">PDF</span> Export PDF
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Candidates Grid/List */}
          {filteredCandidates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
              <Search className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No candidates found</h3>
              <p className="text-gray-500">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6' : 'flex flex-col gap-3'}>
              {filteredCandidates.map(candidate => {
                const client = (candidate.clientName || deriveClientFromExamName(candidate.examName)).toUpperCase()
                const style = CLIENT_STYLE[client] || CLIENT_STYLE['OTHERS']

                if (viewMode === 'list') {
                  return (
                    <div key={candidate.id} className="group flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 hover:border-cyan-200 hover:shadow-md transition-all">
                      <div className="flex items-center gap-6">
                        <div className={`w-1 h-12 rounded-full ${style.tint.replace('bg-', 'bg-').replace('50', '500')}`}></div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{candidate.fullName}</h4>
                          <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                            <span>{candidate.confirmationNumber}</span>
                            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                            <span>{candidate.examName}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${style.badge}`}>
                          {client}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${style.tint} ${style.border.replace('border-', 'text-')}`}>
                          {candidate.status.replace('_', ' ')}
                        </span>
                        <button onClick={() => openEditModal(candidate)} className="p-2 text-gray-400 hover:text-cyan-600 transition-colors">
                          <Edit size={16} />
                        </button>
                      </div>
                    </div>
                  )
                }

                return (
                  <div key={candidate.id} className="group relative bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-xl hover:shadow-cyan-500/5 hover:border-cyan-200 transition-all duration-300">
                    <div className="flex justify-between items-start mb-4">
                      <div className={`px-3 py-1 rounded-lg text-xs font-bold tracking-wider ${style.badge}`}>
                        {client}
                      </div>
                      <div className="relative">
                        <button onClick={() => setOpenMenu(openMenu === candidate.id ? null : candidate.id)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-50 hover:text-gray-600">
                          <MoreVertical size={16} />
                        </button>
                        {openMenu === candidate.id && (
                          <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-10 animate-in fade-in zoom-in-95">
                            <button onClick={() => openEditModal(candidate)} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                              <Edit size={14} /> Edit
                            </button>
                            <button onClick={() => handleDeleteCandidate(candidate.id, candidate.fullName)} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                              <Trash2 size={14} /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mb-6">
                      <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-cyan-600 transition-colors">{candidate.fullName}</h3>
                      <p className="text-sm text-gray-500 font-mono">{candidate.confirmationNumber}</p>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-gray-50">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Exam</span>
                        <span className="font-medium text-gray-900 max-w-[60%] truncate" title={candidate.examName}>{candidate.examName || '-'}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Date</span>
                        <span className="font-medium text-gray-900">
                          {candidate.examDate ? format(candidate.examDate, 'MMM dd, yyyy') : '-'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Status</span>
                        <span className="font-medium capitalize" style={{ color: STATUS_COLORS[candidate.status] }}>
                          {candidate.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'analysis' && <AnalysisView candidates={candidates} />}

      {/* New Candidate Modal */}
      {showNewCandidateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">New Registration</h2>
                <p className="text-sm text-gray-500 mt-1">Enter candidate details below</p>
              </div>
              <button onClick={() => setShowNewCandidateModal(false)} className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Full Name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all placeholder:text-gray-300"
                    placeholder="e.g. John Doe"
                    value={newCandidate.fullName}
                    onChange={e => setNewCandidate({ ...newCandidate, fullName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Phone</label>
                  <input
                    type="tel"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all placeholder:text-gray-300"
                    placeholder="+91..."
                    value={newCandidate.phone}
                    onChange={e => setNewCandidate({ ...newCandidate, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Exam Name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all placeholder:text-gray-300"
                    placeholder="e.g. TOEFL iBT"
                    value={newCandidate.examName}
                    onChange={e => setNewCandidate({ ...newCandidate, examName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Client Name</label>
                  <div className="relative">
                    <input
                      list="clients-list"
                      type="text"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all placeholder:text-gray-300"
                      placeholder="Type or select client..."
                      value={newCandidate.clientName}
                      onChange={e => setNewCandidate({ ...newCandidate, clientName: e.target.value })}
                    />
                    <datalist id="clients-list">
                      {clients?.map(c => <option key={c.id} value={c.name} />)}
                    </datalist>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Exam Date</label>
                  <input
                    type="date"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all text-gray-600"
                    value={newCandidate.examDate}
                    onChange={e => setNewCandidate({ ...newCandidate, examDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Address</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all placeholder:text-gray-300"
                    placeholder="City, State"
                    value={newCandidate.address}
                    onChange={e => setNewCandidate({ ...newCandidate, address: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Notes</label>
                <textarea
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all placeholder:text-gray-300 min-h-[100px] resize-none"
                  placeholder="Additional requirements..."
                  value={newCandidate.notes}
                  onChange={e => setNewCandidate({ ...newCandidate, notes: e.target.value })}
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
              <button onClick={() => setShowNewCandidateModal(false)} className="px-6 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleCreateCandidate}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-cyan-500 hover:bg-cyan-600 shadow-lg shadow-cyan-500/30 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!newCandidate.fullName}
              >
                Register Candidate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Candidate Modal (Mirrors structure of New Modal but logic for Edit) */}
      {showEditCandidateModal && selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-2xl font-bold text-gray-900">Edit Candidate</h2>
              <button onClick={() => setShowEditCandidateModal(false)} className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Full Name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all placeholder:text-gray-300"
                    value={editCandidate.fullName}
                    onChange={e => setEditCandidate({ ...editCandidate, fullName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Phone</label>
                  <input
                    type="tel"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all placeholder:text-gray-300"
                    value={editCandidate.phone}
                    onChange={e => setEditCandidate({ ...editCandidate, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Exam Name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all placeholder:text-gray-300"
                    value={editCandidate.examName}
                    onChange={e => setEditCandidate({ ...editCandidate, examName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Client Name</label>
                  <input
                    list="clients-list-edit"
                    type="text"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all placeholder:text-gray-300"
                    value={editCandidate.clientName}
                    onChange={e => setEditCandidate({ ...editCandidate, clientName: e.target.value })}
                  />
                  <datalist id="clients-list-edit">
                    {clients?.map(c => <option key={c.id} value={c.name} />)}
                  </datalist>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Exam Date</label>
                  <input
                    type="datetime-local"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all text-gray-600"
                    value={editCandidate.examDate}
                    onChange={e => setEditCandidate({ ...editCandidate, examDate: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
              <button onClick={() => setShowEditCandidateModal(false)} className="px-6 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleEditCandidate}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-cyan-500 hover:bg-cyan-600 shadow-lg shadow-cyan-500/30 transition-all hover:scale-[1.02] active:scale-95"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default CandidateTrackerPremium
