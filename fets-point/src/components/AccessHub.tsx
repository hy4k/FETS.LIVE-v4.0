import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Shield, Key, Lock, Eye, EyeOff, Copy, ExternalLink, Search,
    Plus, X, Minus, Globe, Server, Fingerprint, 
    ChevronRight, Layers, Database, Building2, Save
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { toast } from 'react-hot-toast'

interface VaultEntry {
    id: string
    user_id: string
    title: string
    category: string
    username?: string
    password?: string
    url?: string
    notes?: string
    tags: string[]
    site_id?: string
    prof_email?: string
    prof_email_password?: string
    other_urls?: string
    contact_numbers?: string
    custom_fields?: { key: string; value: string }[] | any
    created_at: string
}

interface AccessHubPopupProps {
    entry: VaultEntry
    onClose: () => void
    zIndex?: number
}

// Popup Component for Full Vault Details
const AccessHubPopup: React.FC<AccessHubPopupProps> = ({ entry, onClose, zIndex = 3000 }) => {
    const [isMinimized, setIsMinimized] = useState(false)
    const [revealMap, setRevealMap] = useState<Record<string, boolean>>({})

    const toggleReveal = (field: string) => {
        setRevealMap(prev => ({ ...prev, [field]: !prev[field] }))
    }

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text)
        toast.success(`${label} copied`, { icon: '✓', style: { background: '#1e293b', color: '#fff' } })
    }

    const categoryColors: Record<string, string> = {
        'Corporate': 'from-blue-600 to-blue-800',
        'Financial': 'from-emerald-600 to-emerald-800',
        'Personal': 'from-purple-600 to-purple-800',
        'Emergency': 'from-rose-600 to-rose-800',
        'General': 'from-slate-600 to-slate-800'
    }

    const gradientClass = categoryColors[entry.category] || categoryColors['General']

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ 
                opacity: 1, 
                scale: 1, 
                y: 0,
                height: isMinimized ? 56 : 'auto',
                maxHeight: isMinimized ? 56 : '80vh'
            }}
            exit={{ opacity: 0, scale: 0.95 }}
            drag
            dragMomentum={false}
            style={{ zIndex }}
            className="fixed bottom-8 right-8 w-[420px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-200"
        >
            {/* Header */}
            <div className={`bg-gradient-to-r ${gradientClass} px-5 py-4 flex items-center justify-between cursor-move`}>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <Shield size={20} className="text-white" />
                    </div>
                    <div>
                        <h3 className="text-white font-bold text-sm uppercase tracking-wide">{entry.title}</h3>
                        <span className="text-white/70 text-[10px] uppercase tracking-widest font-medium">{entry.category}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setIsMinimized(!isMinimized)} className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                        <Minus size={16} />
                    </button>
                    <button onClick={onClose} className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                        <X size={16} />
                    </button>
                </div>
            </div>

            {!isMinimized && (
                <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-50">
                    {/* Credentials Section */}
                    {(entry.username || entry.password) && (
                        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                            <div className="flex items-center gap-2 mb-4">
                                <Key size={14} className="text-slate-400" />
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Access Credentials</span>
                            </div>
                            <div className="space-y-3">
                                {entry.username && (
                                    <div className="flex items-center justify-between group">
                                        <div className="flex-1">
                                            <label className="text-[9px] text-slate-400 uppercase tracking-wider block mb-1">Username / ID</label>
                                            <span className="text-sm font-mono text-slate-800">{entry.username}</span>
                                        </div>
                                        <button onClick={() => copyToClipboard(entry.username!, 'Username')} className="p-2 text-slate-300 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-all">
                                            <Copy size={14} />
                                        </button>
                                    </div>
                                )}
                                {entry.password && (
                                    <div className="flex items-center justify-between group pt-3 border-t border-slate-100">
                                        <div className="flex-1">
                                            <label className="text-[9px] text-slate-400 uppercase tracking-wider block mb-1">Password</label>
                                            <span className="text-sm font-mono text-slate-800 tracking-wider">
                                                {revealMap['password'] ? entry.password : '••••••••••••'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => toggleReveal('password')} className="p-2 text-slate-300 hover:text-slate-600 transition-colors">
                                                {revealMap['password'] ? <EyeOff size={14} /> : <Eye size={14} />}
                                            </button>
                                            <button onClick={() => copyToClipboard(entry.password!, 'Password')} className="p-2 text-slate-300 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-all">
                                                <Copy size={14} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Professional Email */}
                    {(entry.prof_email || entry.prof_email_password) && (
                        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                            <div className="flex items-center gap-2 mb-4">
                                <Building2 size={14} className="text-slate-400" />
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Professional Email</span>
                            </div>
                            <div className="space-y-3">
                                {entry.prof_email && (
                                    <div className="flex items-center justify-between group">
                                        <div className="flex-1">
                                            <label className="text-[9px] text-slate-400 uppercase tracking-wider block mb-1">Email</label>
                                            <span className="text-sm text-slate-800">{entry.prof_email}</span>
                                        </div>
                                        <button onClick={() => copyToClipboard(entry.prof_email!, 'Email')} className="p-2 text-slate-300 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-all">
                                            <Copy size={14} />
                                        </button>
                                    </div>
                                )}
                                {entry.prof_email_password && (
                                    <div className="flex items-center justify-between group pt-3 border-t border-slate-100">
                                        <div className="flex-1">
                                            <label className="text-[9px] text-slate-400 uppercase tracking-wider block mb-1">Email Password</label>
                                            <span className="text-sm font-mono text-slate-800 tracking-wider">
                                                {revealMap['emailPass'] ? entry.prof_email_password : '••••••••••••'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => toggleReveal('emailPass')} className="p-2 text-slate-300 hover:text-slate-600 transition-colors">
                                                {revealMap['emailPass'] ? <EyeOff size={14} /> : <Eye size={14} />}
                                            </button>
                                            <button onClick={() => copyToClipboard(entry.prof_email_password!, 'Email Password')} className="p-2 text-slate-300 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-all">
                                                <Copy size={14} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* URLs */}
                    {(entry.url || entry.other_urls) && (
                        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                            <div className="flex items-center gap-2 mb-4">
                                <Globe size={14} className="text-slate-400" />
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Links</span>
                            </div>
                            {entry.url && (
                                <a 
                                    href={entry.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium group"
                                >
                                    <ExternalLink size={14} />
                                    Open Portal
                                    <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
                                </a>
                            )}
                            {entry.other_urls && (
                                <div className="mt-3 pt-3 border-t border-slate-100">
                                    <label className="text-[9px] text-slate-400 uppercase tracking-wider block mb-2">Additional URLs</label>
                                    <p className="text-xs text-slate-600 whitespace-pre-line break-all">{entry.other_urls}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Custom Fields */}
                    {entry.custom_fields && Array.isArray(entry.custom_fields) && entry.custom_fields.length > 0 && (
                        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                            <div className="flex items-center gap-2 mb-4">
                                <Database size={14} className="text-slate-400" />
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Additional Data</span>
                            </div>
                            <div className="space-y-3">
                                {entry.custom_fields.map((field: any, idx: number) => (
                                    <div key={idx} className="flex items-center justify-between group">
                                        <div className="flex-1">
                                            <label className="text-[9px] text-slate-400 uppercase tracking-wider block mb-1">{field.key}</label>
                                            <span className="text-sm text-slate-800">{field.value}</span>
                                        </div>
                                        <button onClick={() => copyToClipboard(field.value, field.key)} className="p-2 text-slate-300 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-all">
                                            <Copy size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Notes */}
                    {entry.notes && (
                        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                            <label className="text-[9px] text-slate-400 uppercase tracking-wider block mb-2">Notes</label>
                            <p className="text-sm text-slate-600 whitespace-pre-line">{entry.notes}</p>
                        </div>
                    )}
                </div>
            )}
        </motion.div>
    )
}

// Add Entry Modal
const AddEntryModal: React.FC<{ onClose: () => void; onSuccess: () => void; userId: string }> = ({ onClose, onSuccess, userId }) => {
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState({
        title: '',
        category: 'General',
        username: '',
        password: '',
        url: '',
        notes: ''
    })

    const categories = ['General', 'Corporate', 'Financial', 'Personal', 'Emergency']

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.title.trim()) {
            toast.error('Title is required')
            return
        }

        setSaving(true)
        try {
            const { error } = await supabase.from('fets_vault').insert({
                user_id: userId,
                title: formData.title.trim(),
                category: formData.category,
                username: formData.username.trim() || null,
                password: formData.password || null,
                url: formData.url.trim() || null,
                notes: formData.notes.trim() || null,
                tags: []
            })

            if (error) throw error
            toast.success('Credential saved!')
            onSuccess()
            onClose()
        } catch (err: any) {
            toast.error(err.message || 'Failed to save')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[4000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-slate-700 to-slate-900 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                            <Plus size={20} className="text-white" />
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-sm uppercase tracking-wide">New Credential</h3>
                            <span className="text-white/60 text-[10px] uppercase tracking-widest">Add to your vault</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Title *</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="e.g., Gmail, Netflix, Bank Account"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:border-slate-400 transition-colors"
                        />
                    </div>

                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Category</label>
                        <select
                            value={formData.category}
                            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:border-slate-400 transition-colors"
                        >
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Username / Email</label>
                            <input
                                type="text"
                                value={formData.username}
                                onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                                placeholder="user@email.com"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:border-slate-400 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Password</label>
                            <input
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                                placeholder="••••••••"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:border-slate-400 transition-colors"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">URL</label>
                        <input
                            type="url"
                            value={formData.url}
                            onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                            placeholder="https://..."
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:border-slate-400 transition-colors"
                        />
                    </div>

                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Notes</label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                            placeholder="Additional notes..."
                            rows={3}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:border-slate-400 transition-colors resize-none"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold py-3 rounded-xl uppercase tracking-widest text-sm hover:from-amber-600 hover:to-amber-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {saving ? (
                            <>Saving...</>
                        ) : (
                            <>
                                <Save size={16} />
                                Save Credential
                            </>
                        )}
                    </button>
                </form>
            </motion.div>
        </div>
    )
}

// Main Access Hub Widget Component
export function AccessHub() {
    const { user } = useAuth()
    const [entries, setEntries] = useState<VaultEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [activePopup, setActivePopup] = useState<VaultEntry | null>(null)
    const [hoveredId, setHoveredId] = useState<string | null>(null)
    const [showAddModal, setShowAddModal] = useState(false)

    useEffect(() => {
        if (user?.id) fetchEntries()
    }, [user?.id])

    const fetchEntries = async () => {
        if (!user?.id) return
        try {
            // Fetch only entries belonging to the current user
            const { data, error } = await supabase
                .from('fets_vault')
                .select('*')
                .eq('user_id', user.id)
                .order('title', { ascending: true })

            if (error) throw error
            setEntries(data || [])
        } catch (err: any) {
            console.error('Vault fetch error:', err.message)
        } finally {
            setLoading(false)
        }
    }

    const filteredEntries = entries.filter(entry =>
        entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.category.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const categoryIcons: Record<string, React.ReactNode> = {
        'Corporate': <Building2 size={16} />,
        'Financial': <Layers size={16} />,
        'Personal': <Fingerprint size={16} />,
        'Emergency': <Shield size={16} />,
        'General': <Server size={16} />
    }

    const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
        'Corporate': { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
        'Financial': { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
        'Personal': { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
        'Emergency': { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200' },
        'General': { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' }
    }

    const neuCard = "bg-[var(--dashboard-bg, #EEF2F9)] rounded-3xl shadow-[9px_9px_16px_var(--neu-dark-shadow,rgb(209,217,230)),-9px_-9px_16px_var(--neu-light-shadow,rgba(255,255,255,0.8))] border border-white/50"

    return (
        <>
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className={`${neuCard} p-8 relative overflow-hidden`}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center shadow-lg">
                            <Lock size={24} className="text-white" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Access Hub</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{entries.length} Secured Credentials</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        {/* Add Button */}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowAddModal(true)}
                            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
                        >
                            <Plus size={16} />
                            Add New
                        </motion.button>

                        {/* Search */}
                        <div className="relative w-64">
                            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search credentials..."
                                className="w-full bg-white/60 border border-slate-200 rounded-xl py-2.5 pl-11 pr-4 text-sm font-medium text-slate-700 placeholder:text-slate-400 outline-none focus:border-slate-400 focus:bg-white transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* Credential Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {loading ? (
                        [...Array(4)].map((_, i) => (
                            <div key={i} className="h-32 rounded-2xl bg-slate-100 animate-pulse" />
                        ))
                    ) : filteredEntries.length > 0 ? (
                        filteredEntries.slice(0, 8).map((entry) => {
                            const colors = categoryColors[entry.category] || categoryColors['General']
                            return (
                                <motion.div
                                    key={entry.id}
                                    whileHover={{ scale: 1.02, y: -4 }}
                                    whileTap={{ scale: 0.98 }}
                                    onHoverStart={() => setHoveredId(entry.id)}
                                    onHoverEnd={() => setHoveredId(null)}
                                    onClick={() => setActivePopup(entry)}
                                    className={`
                                        relative bg-white rounded-2xl p-5 cursor-pointer transition-all duration-300
                                        border ${colors.border} hover:shadow-xl hover:border-slate-300 group overflow-hidden
                                    `}
                                >
                                    {/* Background Gradient on Hover */}
                                    <div className={`absolute inset-0 ${colors.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                                    
                                    {/* Content */}
                                    <div className="relative z-10">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className={`w-10 h-10 rounded-xl ${colors.bg} ${colors.text} flex items-center justify-center transition-colors`}>
                                                {categoryIcons[entry.category] || categoryIcons['General']}
                                            </div>
                                            <span className={`text-[8px] font-black uppercase tracking-widest ${colors.text} px-2 py-1 rounded-full ${colors.bg}`}>
                                                {entry.category}
                                            </span>
                                        </div>
                                        
                                        <h4 className="text-sm font-bold text-slate-800 mb-1 truncate uppercase tracking-tight">
                                            {entry.title}
                                        </h4>
                                        
                                        {entry.username && (
                                            <p className="text-xs text-slate-500 truncate font-mono">
                                                {entry.username}
                                            </p>
                                        )}

                                        {/* Locked Indicator */}
                                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                                            <Lock size={10} className="text-slate-300" />
                                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                                                Click to unlock
                                            </span>
                                        </div>
                                    </div>

                                    {/* Hover Arrow */}
                                    <motion.div
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: hoveredId === entry.id ? 1 : 0, x: hoveredId === entry.id ? 0 : -10 }}
                                        className="absolute bottom-4 right-4"
                                    >
                                        <ChevronRight size={18} className={colors.text} />
                                    </motion.div>
                                </motion.div>
                            )
                        })
                    ) : (
                        <div className="col-span-full py-12 text-center">
                            <Lock size={40} className="mx-auto mb-3 text-slate-200" />
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">No credentials yet</p>
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="text-xs font-bold text-amber-600 uppercase tracking-widest hover:text-amber-800 transition-colors flex items-center gap-2 mx-auto"
                            >
                                <Plus size={14} />
                                Add your first credential
                            </button>
                        </div>
                    )}
                </div>

                {/* View More Link */}
                {filteredEntries.length > 8 && (
                    <div className="mt-6 text-center">
                        <button className="text-xs font-bold text-slate-500 uppercase tracking-widest hover:text-slate-800 transition-colors flex items-center gap-2 mx-auto">
                            View all {filteredEntries.length} credentials
                            <ChevronRight size={14} />
                        </button>
                    </div>
                )}

                {/* Decorative Grid */}
                <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 0.5px, transparent 0.5px)', backgroundSize: '20px 20px' }} />
            </motion.div>

            {/* Popup */}
            <AnimatePresence>
                {activePopup && (
                    <AccessHubPopup
                        entry={activePopup}
                        onClose={() => setActivePopup(null)}
                    />
                )}
            </AnimatePresence>

            {/* Add Modal */}
            <AnimatePresence>
                {showAddModal && user?.id && (
                    <AddEntryModal
                        onClose={() => setShowAddModal(false)}
                        onSuccess={fetchEntries}
                        userId={user.id}
                    />
                )}
            </AnimatePresence>
        </>
    )
}
