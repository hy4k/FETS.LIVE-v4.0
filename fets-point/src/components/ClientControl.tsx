import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Building2, Plus, Trash2, Edit3,
    MapPin, GraduationCap, Save, X,
    Search, ChevronRight, Hash, Palette
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { toast } from 'react-hot-toast'

export interface Client {
    id: string
    name: string
    color: string
    logo_url?: string
}

export interface ClientExam {
    id: string
    client_id: string
    name: string
    locations: string[]
}

const BRANCHES = ['calicut', 'cochin', 'kannur']

const CLIENT_COLORS = [
    { name: 'Blue', value: 'blue' },
    { name: 'Green', value: 'green' },
    { name: 'Amber', value: 'amber' },
    { name: 'Rose', value: 'rose' },
    { name: 'Purple', value: 'purple' },
    { name: 'Indigo', value: 'indigo' },
    { name: 'Teal', value: 'teal' },
    { name: 'Orange', value: 'orange' },
]

// Premium Classic Theme - Matching Management Page
const THEME = {
    bgPrimary: '#0f1419',
    bgSecondary: '#1a2332',
    bgTertiary: '#243044',
    bgCard: '#1e2a3a',
    bgHover: '#2a3a4d',
    gold: '#d4a853',
    goldLight: '#e8c47a',
    goldDark: '#b8923f',
    goldMuted: 'rgba(212, 168, 83, 0.15)',
    textPrimary: '#f8fafc',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',
    border: 'rgba(255, 255, 255, 0.08)',
    shadow: '0 10px 40px rgba(0, 0, 0, 0.4)',
    shadowGold: '0 0 30px rgba(212, 168, 83, 0.2)',
}

export function ClientControl() {
    const [clients, setClients] = useState<Client[]>([])
    const [exams, setExams] = useState<ClientExam[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')

    const [showAddClient, setShowAddClient] = useState(false)
    const [newClientName, setNewClientName] = useState('')
    const [newClientColor, setNewClientColor] = useState('amber')

    const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
    const [showAddExam, setShowAddExam] = useState(false)
    const [newExam, setNewExam] = useState({ name: '', locations: [] as string[] })

    const [editingClient, setEditingClient] = useState<Client | null>(null)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            const { data: clientsData } = await supabase.from('clients').select('*').order('name')
            const { data: examsData } = await supabase.from('client_exams').select('*').order('name')
            setClients(clientsData || [])
            setExams(examsData || [])
            if (clientsData && clientsData.length > 0 && !selectedClientId) {
                setSelectedClientId(clientsData[0].id)
            }
        } catch (error) {
            toast.error('Failed to sync client data')
        } finally {
            setLoading(false)
        }
    }

    const handleAddClient = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newClientName.trim()) return
        try {
            const { error } = await supabase.from('clients').insert([{ name: newClientName.toUpperCase(), color: newClientColor }])
            if (error) throw error
            toast.success('Client added')
            setNewClientName('')
            setShowAddClient(false)
            fetchData()
        } catch (error) {
            toast.error('Failed to add client')
        }
    }

    const handleUpdateClient = async () => {
        if (!editingClient) return
        try {
            const { error } = await supabase.from('clients').update({ name: editingClient.name.toUpperCase(), color: editingClient.color }).eq('id', editingClient.id)
            if (error) throw error
            toast.success('Client updated')
            setEditingClient(null)
            fetchData()
        } catch (error) {
            toast.error('Failed to update')
        }
    }

    const handleDeleteClient = async (id: string) => {
        if (!confirm('Delete this client and all exams?')) return
        try {
            await supabase.from('client_exams').delete().eq('client_id', id)
            await supabase.from('clients').delete().eq('id', id)
            toast.success('Client removed')
            if (selectedClientId === id) setSelectedClientId(null)
            fetchData()
        } catch (error) {
            toast.error('Failed to remove')
        }
    }

    const handleAddExam = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedClientId || !newExam.name.trim()) return
        try {
            const { error } = await supabase.from('client_exams').insert([{ client_id: selectedClientId, name: newExam.name.toUpperCase(), locations: newExam.locations }])
            if (error) throw error
            toast.success('Exam added')
            setNewExam({ name: '', locations: [] })
            setShowAddExam(false)
            fetchData()
        } catch (error) {
            toast.error('Failed to add exam')
        }
    }

    const handleDeleteExam = async (examId: string) => {
        if (!confirm('Delete this exam?')) return
        try {
            await supabase.from('client_exams').delete().eq('id', examId)
            toast.success('Exam removed')
            fetchData()
        } catch (error) {
            toast.error('Failed to remove')
        }
    }

    const toggleLocation = (loc: string) => {
        setNewExam(prev => ({
            ...prev,
            locations: prev.locations.includes(loc) ? prev.locations.filter(l => l !== loc) : [...prev.locations, loc]
        }))
    }

    const getColorStyle = (color: string) => {
        const colors: Record<string, { bg: string, text: string }> = {
            blue: { bg: 'rgba(59, 130, 246, 0.2)', text: '#60a5fa' },
            green: { bg: 'rgba(34, 197, 94, 0.2)', text: '#4ade80' },
            amber: { bg: 'rgba(245, 158, 11, 0.2)', text: '#fbbf24' },
            rose: { bg: 'rgba(244, 63, 94, 0.2)', text: '#fb7185' },
            purple: { bg: 'rgba(168, 85, 247, 0.2)', text: '#c084fc' },
            indigo: { bg: 'rgba(99, 102, 241, 0.2)', text: '#818cf8' },
            teal: { bg: 'rgba(20, 184, 166, 0.2)', text: '#2dd4bf' },
            orange: { bg: 'rgba(249, 115, 22, 0.2)', text: '#fb923c' },
        }
        return colors[color] || colors.amber
    }

    const filteredClients = clients.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
    const activeClient = clients.find(c => c.id === selectedClientId)
    const activeClientExams = exams.filter(e => e.client_id === selectedClientId)

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-10 w-10 border-2" style={{ borderColor: THEME.bgTertiary, borderTopColor: THEME.gold }} />
            </div>
        )
    }

    return (
        <div className="flex gap-6 h-full" style={{ fontFamily: "'Inter', sans-serif" }}>
            {/* Left Sidebar - Client List */}
            <aside 
                className="w-80 flex flex-col rounded-2xl overflow-hidden shrink-0"
                style={{ background: THEME.bgSecondary, border: `1px solid ${THEME.border}` }}
            >
                {/* Header */}
                <div className="p-5 border-b" style={{ borderColor: THEME.border }}>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold" style={{ fontFamily: "'Playfair Display', serif", color: THEME.textPrimary }}>
                            Clients
                        </h2>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowAddClient(true)}
                            className="w-9 h-9 rounded-lg flex items-center justify-center"
                            style={{ background: THEME.gold, color: THEME.bgPrimary }}
                        >
                            <Plus size={18} />
                        </motion.button>
                    </div>
                    
                    {/* Search */}
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: THEME.textMuted }} />
                        <input
                            type="text"
                            placeholder="Search clients..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm font-medium focus:outline-none"
                            style={{ background: THEME.bgTertiary, color: THEME.textPrimary, border: `1px solid ${THEME.border}` }}
                        />
                    </div>
                </div>

                {/* Client List */}
                <div className="flex-1 overflow-y-auto p-3 premium-scrollbar">
                    <div className="space-y-2">
                        {filteredClients.map(client => {
                            const colorStyle = getColorStyle(client.color)
                            return (
                                <motion.button
                                    key={client.id}
                                    onClick={() => setSelectedClientId(client.id)}
                                    whileHover={{ x: 4 }}
                                    className="w-full p-4 rounded-xl text-left transition-all flex items-center gap-3 group"
                                    style={{
                                        background: selectedClientId === client.id ? THEME.bgTertiary : 'transparent',
                                        border: selectedClientId === client.id ? `1px solid ${THEME.gold}40` : '1px solid transparent'
                                    }}
                                >
                                    <div 
                                        className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm shrink-0"
                                        style={{ background: colorStyle.bg, color: colorStyle.text }}
                                    >
                                        <Hash size={16} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-sm truncate" style={{ color: THEME.textPrimary }}>
                                            {client.name}
                                        </p>
                                        <p className="text-xs" style={{ color: THEME.textMuted }}>
                                            {exams.filter(e => e.client_id === client.id).length} exams
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setEditingClient(client) }} 
                                            className="p-1.5 rounded"
                                            style={{ color: THEME.textSecondary }}
                                        >
                                            <Edit3 size={14} />
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleDeleteClient(client.id) }} 
                                            className="p-1.5 rounded text-red-400"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </motion.button>
                            )
                        })}
                        {filteredClients.length === 0 && (
                            <div className="py-12 text-center">
                                <Building2 size={32} className="mx-auto mb-2" style={{ color: THEME.textMuted }} />
                                <p className="text-sm" style={{ color: THEME.textMuted }}>No clients found</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t text-center" style={{ borderColor: THEME.border }}>
                    <p className="text-xs" style={{ color: THEME.textMuted }}>{clients.length} clients total</p>
                </div>
            </aside>

            {/* Main Content - Exams */}
            <div 
                className="flex-1 flex flex-col rounded-2xl overflow-hidden"
                style={{ background: THEME.bgSecondary, border: `1px solid ${THEME.border}` }}
            >
                {activeClient ? (
                    <>
                        {/* Client Header */}
                        <div 
                            className="p-6 flex items-center gap-6 border-b"
                            style={{ borderColor: THEME.border, background: THEME.bgCard }}
                        >
                            <div 
                                className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold shrink-0"
                                style={{ 
                                    background: `linear-gradient(135deg, ${THEME.gold}, ${THEME.goldDark})`,
                                    color: THEME.bgPrimary,
                                    boxShadow: THEME.shadowGold
                                }}
                            >
                                <Building2 size={28} />
                            </div>
                            <div className="flex-1">
                                <h2 className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: THEME.textPrimary }}>
                                    {activeClient.name}
                                </h2>
                                <p className="text-sm mt-1" style={{ color: THEME.textSecondary }}>
                                    {activeClientExams.length} exam{activeClientExams.length !== 1 ? 's' : ''} configured
                                </p>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setShowAddExam(true)}
                                className="px-5 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2"
                                style={{ background: THEME.gold, color: THEME.bgPrimary }}
                            >
                                <Plus size={16} /> Add Exam
                            </motion.button>
                        </div>

                        {/* Exams Grid */}
                        <div className="flex-1 overflow-y-auto p-6 premium-scrollbar">
                            {activeClientExams.length > 0 ? (
                                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                                    {activeClientExams.map(exam => (
                                        <motion.div 
                                            key={exam.id} 
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="p-5 rounded-xl group"
                                            style={{ background: THEME.bgTertiary, border: `1px solid ${THEME.border}` }}
                                        >
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div 
                                                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                                                        style={{ background: THEME.goldMuted, color: THEME.gold }}
                                                    >
                                                        <GraduationCap size={18} />
                                                    </div>
                                                    <h4 className="font-semibold" style={{ color: THEME.textPrimary }}>{exam.name}</h4>
                                                </div>
                                                <button 
                                                    onClick={() => handleDeleteExam(exam.id)}
                                                    className="p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all text-red-400"
                                                    style={{ background: 'rgba(239, 68, 68, 0.1)' }}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {exam.locations.length > 0 ? exam.locations.map(loc => (
                                                    <span 
                                                        key={loc} 
                                                        className="px-2.5 py-1 rounded text-xs font-semibold uppercase flex items-center gap-1.5"
                                                        style={{ background: THEME.bgCard, color: THEME.textSecondary }}
                                                    >
                                                        <MapPin size={10} style={{ color: THEME.gold }} />
                                                        {loc}
                                                    </span>
                                                )) : (
                                                    <span className="text-xs italic" style={{ color: THEME.textMuted }}>All locations</span>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div 
                                    className="h-full flex flex-col items-center justify-center rounded-xl border-2 border-dashed"
                                    style={{ borderColor: THEME.border }}
                                >
                                    <GraduationCap size={48} style={{ color: THEME.textMuted }} />
                                    <p className="mt-4 font-semibold" style={{ color: THEME.textPrimary }}>No exams configured</p>
                                    <p className="text-sm mt-1" style={{ color: THEME.textMuted }}>Add exams for this client</p>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center">
                        <Building2 size={64} style={{ color: THEME.bgTertiary }} />
                        <h3 className="text-xl font-bold mt-6" style={{ fontFamily: "'Playfair Display', serif", color: THEME.textPrimary }}>
                            Select a Client
                        </h3>
                        <p className="text-sm mt-2" style={{ color: THEME.textMuted }}>Choose from the list to manage exams</p>
                    </div>
                )}
            </div>

            {/* Modals */}
            <AnimatePresence>
                {showAddClient && (
                    <Modal title="Add Client" onClose={() => setShowAddClient(false)}>
                        <form onSubmit={handleAddClient} className="space-y-5">
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: THEME.textMuted }}>Client Name</label>
                                <input
                                    type="text"
                                    required
                                    value={newClientName}
                                    onChange={(e) => setNewClientName(e.target.value)}
                                    placeholder="e.g. PEARSON VUE"
                                    className="w-full p-4 rounded-xl text-sm font-medium focus:outline-none"
                                    style={{ background: THEME.bgTertiary, color: THEME.textPrimary, border: `1px solid ${THEME.border}` }}
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: THEME.textMuted }}>Color</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {CLIENT_COLORS.map(color => {
                                        const style = getColorStyle(color.value)
                                        return (
                                            <button
                                                key={color.value}
                                                type="button"
                                                onClick={() => setNewClientColor(color.value)}
                                                className="p-3 rounded-lg text-xs font-semibold transition-all"
                                                style={{
                                                    background: style.bg,
                                                    color: style.text,
                                                    border: newClientColor === color.value ? `2px solid ${THEME.gold}` : '2px solid transparent'
                                                }}
                                            >
                                                {color.name}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                            <button type="submit" className="w-full py-3.5 rounded-xl font-semibold" style={{ background: THEME.gold, color: THEME.bgPrimary }}>
                                Add Client
                            </button>
                        </form>
                    </Modal>
                )}

                {editingClient && (
                    <Modal title="Edit Client" onClose={() => setEditingClient(null)}>
                        <div className="space-y-5">
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: THEME.textMuted }}>Client Name</label>
                                <input
                                    type="text"
                                    value={editingClient.name}
                                    onChange={(e) => setEditingClient({ ...editingClient, name: e.target.value })}
                                    className="w-full p-4 rounded-xl text-sm font-medium focus:outline-none"
                                    style={{ background: THEME.bgTertiary, color: THEME.textPrimary, border: `1px solid ${THEME.border}` }}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: THEME.textMuted }}>Color</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {CLIENT_COLORS.map(color => {
                                        const style = getColorStyle(color.value)
                                        return (
                                            <button
                                                key={color.value}
                                                type="button"
                                                onClick={() => setEditingClient({ ...editingClient, color: color.value })}
                                                className="p-3 rounded-lg text-xs font-semibold transition-all"
                                                style={{
                                                    background: style.bg,
                                                    color: style.text,
                                                    border: editingClient.color === color.value ? `2px solid ${THEME.gold}` : '2px solid transparent'
                                                }}
                                            >
                                                {color.name}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                            <button onClick={handleUpdateClient} className="w-full py-3.5 rounded-xl font-semibold" style={{ background: THEME.gold, color: THEME.bgPrimary }}>
                                Save Changes
                            </button>
                        </div>
                    </Modal>
                )}

                {showAddExam && (
                    <Modal title={`Add Exam to ${activeClient?.name}`} onClose={() => setShowAddExam(false)}>
                        <form onSubmit={handleAddExam} className="space-y-5">
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: THEME.textMuted }}>Exam Name</label>
                                <input
                                    type="text"
                                    required
                                    value={newExam.name}
                                    onChange={(e) => setNewExam({ ...newExam, name: e.target.value })}
                                    placeholder="e.g. CMA, CPA, AWS"
                                    className="w-full p-4 rounded-xl text-sm font-medium focus:outline-none"
                                    style={{ background: THEME.bgTertiary, color: THEME.textPrimary, border: `1px solid ${THEME.border}` }}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: THEME.textMuted }}>Branches (optional)</label>
                                <p className="text-xs mb-3" style={{ color: THEME.textMuted }}>Leave empty for all locations</p>
                                <div className="grid grid-cols-3 gap-2">
                                    {BRANCHES.map(branch => (
                                        <button
                                            key={branch}
                                            type="button"
                                            onClick={() => toggleLocation(branch)}
                                            className="p-3 rounded-lg font-semibold text-sm transition-all flex items-center gap-2"
                                            style={{
                                                background: newExam.locations.includes(branch) ? THEME.goldMuted : THEME.bgTertiary,
                                                color: newExam.locations.includes(branch) ? THEME.gold : THEME.textSecondary,
                                                border: newExam.locations.includes(branch) ? `1px solid ${THEME.gold}40` : `1px solid ${THEME.border}`
                                            }}
                                        >
                                            <div 
                                                className="w-4 h-4 rounded-full border-2 flex items-center justify-center"
                                                style={{ borderColor: newExam.locations.includes(branch) ? THEME.gold : THEME.textMuted, background: newExam.locations.includes(branch) ? THEME.gold : 'transparent' }}
                                            >
                                                {newExam.locations.includes(branch) && <div className="w-1.5 h-1.5 rounded-full" style={{ background: THEME.bgPrimary }} />}
                                            </div>
                                            {branch.charAt(0).toUpperCase() + branch.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <button type="submit" className="w-full py-3.5 rounded-xl font-semibold" style={{ background: THEME.gold, color: THEME.bgPrimary }}>
                                Add Exam
                            </button>
                        </form>
                    </Modal>
                )}
            </AnimatePresence>
        </div>
    )
}

// Reusable Modal Component
function Modal({ title, onClose, children }: { title: string, onClose: () => void, children: React.ReactNode }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)' }}
        >
            <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className="w-full max-w-md rounded-2xl overflow-hidden"
                style={{ background: THEME.bgSecondary, border: `1px solid ${THEME.border}`, boxShadow: THEME.shadow }}
            >
                <div className="p-5 flex justify-between items-center border-b" style={{ borderColor: THEME.border, background: THEME.bgCard }}>
                    <h3 className="text-lg font-bold" style={{ fontFamily: "'Playfair Display', serif", color: THEME.textPrimary }}>{title}</h3>
                    <button onClick={onClose} style={{ color: THEME.textMuted }}><X size={20} /></button>
                </div>
                <div className="p-6">{children}</div>
            </motion.div>
        </motion.div>
    )
}

export async function getClientsAndExams(): Promise<{ clients: Client[], exams: ClientExam[] }> {
    const { data: clients } = await supabase.from('clients').select('*').order('name')
    const { data: exams } = await supabase.from('client_exams').select('*').order('name')
    return { clients: clients || [], exams: exams || [] }
}
