import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, Key, Lock, Unlock, Eye, EyeOff, Copy,
  ExternalLink, Search, Plus, Trash2, Edit3,
  Tag, Globe, User, Info, Check, ShieldCheck, AlertCircle,
  Database, Server, Fingerprint, Zap, Phone, Mail, Link as LinkIcon, Briefcase
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { toast } from 'react-hot-toast'

interface VaultEntry {
  id: string
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
  custom_fields?: Record<string, string> | any
  created_at: string
}

export function FetsVault() {
  const { user } = useAuth()
  const [entries, setEntries] = useState<VaultEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [revealMap, setRevealMap] = useState<Record<string, boolean>>({})
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null)

  // Form State
  const [newEntry, setNewEntry] = useState<Partial<VaultEntry>>({
    title: '',
    category: 'General',
    username: '',
    password: '',
    url: '',
    notes: '',
    tags: [],
    site_id: '',
    prof_email: '',
    prof_email_password: '',
    other_urls: '',
    contact_numbers: '',
    custom_fields: []
  })

  // Custom fields state for form
  const [customFieldsInput, setCustomFieldsInput] = useState<{ key: string, value: string }[]>([])

  useEffect(() => {
    if (user?.id) {
      fetchEntries()
    }
  }, [user?.id])

  const fetchEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('fets_vault')
        .select('*')
        .order('title', { ascending: true })

      if (error) throw error
      setEntries(data || [])
    } catch (err: any) {
      toast.error('Failed to load vault: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEntry.title) return

    // Convert custom fields array to object/json if needed or store as array in jsonb
    // For simplicity, storing as array of objects in jsonb
    const customData = customFieldsInput.filter(f => f.key && f.value)

    try {
      const { error } = await supabase
        .from('fets_vault')
        .insert([{
          user_id: user?.id,
          title: newEntry.title,
          category: newEntry.category,
          username: newEntry.username,
          password: newEntry.password,
          url: newEntry.url,
          notes: newEntry.notes,
          tags: Array.isArray(newEntry.tags) ? newEntry.tags : (newEntry.tags as string || '').split(',').map((t: string) => t.trim()).filter(Boolean),
          site_id: newEntry.site_id,
          prof_email: newEntry.prof_email,
          prof_email_password: newEntry.prof_email_password,
          other_urls: newEntry.other_urls,
          contact_numbers: newEntry.contact_numbers,
          custom_fields: customData
        }])

      if (error) throw error

      toast.success('Record Saved Successfully', {
        style: { background: '#1a1c1e', color: '#4ade80', border: '1px solid #4ade80' },
        icon: '✅'
      })
      setShowAddModal(false)
      setNewEntry({
        title: '',
        category: 'General',
        username: '',
        password: '',
        url: '',
        notes: '',
        tags: [],
        site_id: '',
        prof_email: '',
        prof_email_password: '',
        other_urls: '',
        contact_numbers: '',
        custom_fields: []
      })
      setCustomFieldsInput([])
      fetchEntries()
    } catch (err: any) {
      toast.error('Failed to save data: ' + err.message)
    }
  }

  const deleteEntry = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Permanently delete this record?')) return

    try {
      const { error } = await supabase
        .from('fets_vault')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast.success('Record Deleted')
      fetchEntries()
    } catch (err: any) {
      toast.error('Operation Failed')
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} Copied`, {
      icon: '📋',
      style: { background: '#1a1c1e', color: '#60a5fa', border: '1px solid #60a5fa' }
    })
  }

  const toggleReveal = (id: string, field: string) => {
    setRevealMap(prev => ({
      ...prev,
      [`${id}-${field}`]: !prev[`${id}-${field}`]
    }))
  }

  const addCustomField = () => {
    setCustomFieldsInput([...customFieldsInput, { key: '', value: '' }])
  }

  const updateCustomField = (index: number, field: 'key' | 'value', val: string) => {
    const updated = [...customFieldsInput]
    updated[index][field] = val
    setCustomFieldsInput(updated)
  }

  const removeCustomField = (index: number) => {
    const updated = [...customFieldsInput]
    updated.splice(index, 1)
    setCustomFieldsInput(updated)
  }

  const filteredEntries = entries.filter(entry =>
    entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.tags?.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="flex flex-col h-full bg-[#050508] text-slate-300 rounded-3xl overflow-hidden border border-white/5 shadow-2xl relative font-sans">

      {/* Background Visuals */}
      <div className="absolute inset-0 bg-[url('/fets-vault-core.png')] bg-cover bg-center opacity-10 pointer-events-none mix-blend-screen" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#050508]/90 via-[#050508]/95 to-[#050508] pointer-events-none" />

      {/* Header Area */}
      <div className="relative z-10 p-6 border-b border-white/5 flex flex-col gap-6 backdrop-blur-sm">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 rounded-2xl bg-black/50 border border-cyan-500/30 flex items-center justify-center overflow-hidden shadow-[0_0_30px_rgba(6,182,212,0.2)]">
              <div className="absolute inset-0 bg-cyan-500/10 animate-pulse" />
              <ShieldCheck size={32} className="text-cyan-400 relative z-10" />
              <div className="absolute top-0 left-0 w-full h-[2px] bg-cyan-400 shadow-[0_0_10px_#22d3ee] animate-[scan_3s_ease-in-out_infinite]" />
            </div>
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-white uppercase flex items-center gap-2">
                FETS <span className="text-cyan-400">VAULT</span>
              </h2>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-widest mt-1">
                SECURE CREDENTIAL MANAGEMENT
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="group relative px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl transition-all shadow-lg shadow-cyan-500/20"
          >
            <span className="relative z-10 flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
              <Plus size={14} /> Add New Client
            </span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative group max-w-2xl">
          <Search size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search clients..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium outline-none focus:border-cyan-500/50 transition-all placeholder:text-slate-600 text-white"
          />
        </div>
      </div>

      {/* Vault Content Grid */}
      <div className="relative z-10 flex-1 overflow-y-auto custom-scrollbar p-6">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center opacity-50">
            <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin mb-4" />
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Loading Records...</p>
          </div>
        ) : filteredEntries.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEntries.map((entry) => (
              <motion.div
                layoutId={entry.id}
                key={entry.id}
                onClick={() => setActiveEntryId(activeEntryId === entry.id ? null : entry.id)}
                className={`
                    group relative bg-[#0f1115] border rounded-2xl overflow-hidden cursor-pointer transition-all duration-300
                    ${activeEntryId === entry.id
                    ? 'col-span-1 md:col-span-2 lg:col-span-2 border-cyan-500/50 shadow-[0_0_30px_rgba(6,182,212,0.1)] bg-[#13161a]'
                    : 'border-white/5 hover:border-cyan-500/30 hover:shadow-lg hover:bg-[#13161a]'
                  }
                `}
              >
                <div className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${activeEntryId === entry.id ? 'bg-cyan-500 text-white' : 'bg-white/5 text-slate-500 group-hover:bg-cyan-500/10 group-hover:text-cyan-400'}`}>
                        <Briefcase size={20} />
                      </div>
                      <div>
                        <h3 className={`text-base font-bold uppercase tracking-wide ${activeEntryId === entry.id ? 'text-white' : 'text-slate-300'}`}>{entry.title}</h3>
                        <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-1">{entry.category}</p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => deleteEntry(entry.id, e)}
                      className="p-2 hover:bg-rose-500/10 text-slate-600 hover:text-rose-500 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {/* Expanded Details */}
                  <AnimatePresence>
                    {activeEntryId === entry.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-6 border-t border-white/5 grid gap-6 grid-cols-1 md:grid-cols-2">

                          {/* Left Column: Primary Credentials */}
                          <div className="space-y-4">

                            {/* Primary Login */}
                            {(entry.username || entry.password) && (
                              <div className="bg-black/30 p-4 rounded-xl border border-white/5 space-y-3">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-cyan-500/70 mb-2">Primary Login</h4>

                                {entry.username && (
                                  <div className="flex justify-between items-center group/field">
                                    <div className="flex-1">
                                      <label className="text-[9px] uppercase tracking-widest text-slate-500 block">User ID</label>
                                      <div className="font-mono text-cyan-100 text-sm">{entry.username}</div>
                                    </div>
                                    <button onClick={() => copyToClipboard(entry.username!, 'User ID')} className="text-slate-600 hover:text-cyan-400"><Copy size={12} /></button>
                                  </div>
                                )}

                                {entry.password && (
                                  <div className="flex justify-between items-center group/field">
                                    <div className="flex-1">
                                      <label className="text-[9px] uppercase tracking-widest text-slate-500 block">Password</label>
                                      <div className="font-mono text-cyan-100 text-sm">
                                        {revealMap[`${entry.id}-pass`] ? entry.password : '••••••••••••••••'}
                                      </div>
                                    </div>
                                    <div className="flex gap-2">
                                      <button onClick={() => toggleReveal(entry.id, 'pass')} className="text-slate-600 hover:text-cyan-400"><Eye size={12} /></button>
                                      <button onClick={() => copyToClipboard(entry.password!, 'Password')} className="text-slate-600 hover:text-cyan-400"><Copy size={12} /></button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Site ID */}
                            {entry.site_id && (
                              <div className="bg-black/30 p-4 rounded-xl border border-white/5 flex justify-between items-center">
                                <div>
                                  <label className="text-[9px] uppercase tracking-widest text-slate-500 block">Site ID</label>
                                  <div className="font-mono text-cyan-100 text-sm">{entry.site_id}</div>
                                </div>
                                <button onClick={() => copyToClipboard(entry.site_id!, 'Site ID')} className="text-slate-600 hover:text-cyan-400"><Copy size={12} /></button>
                              </div>
                            )}
                          </div>

                          {/* Right Column: Professional & Other */}
                          <div className="space-y-4">

                            {/* Professional Email */}
                            {(entry.prof_email || entry.prof_email_password) && (
                              <div className="bg-black/30 p-4 rounded-xl border border-white/5 space-y-3">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-cyan-500/70 mb-2">Professional Email</h4>

                                {entry.prof_email && (
                                  <div className="flex justify-between items-center">
                                    <div className="flex-1">
                                      <label className="text-[9px] uppercase tracking-widest text-slate-500 block">Email ID</label>
                                      <div className="text-white text-sm truncate">{entry.prof_email}</div>
                                    </div>
                                    <button onClick={() => copyToClipboard(entry.prof_email!, 'Email')} className="text-slate-600 hover:text-cyan-400"><Copy size={12} /></button>
                                  </div>
                                )}

                                {entry.prof_email_password && (
                                  <div className="flex justify-between items-center">
                                    <div className="flex-1">
                                      <label className="text-[9px] uppercase tracking-widest text-slate-500 block">Email Password</label>
                                      <div className="font-mono text-cyan-100 text-sm">
                                        {revealMap[`${entry.id}-emailpass`] ? entry.prof_email_password : '••••••••••••••••'}
                                      </div>
                                    </div>
                                    <div className="flex gap-2">
                                      <button onClick={() => toggleReveal(entry.id, 'emailpass')} className="text-slate-600 hover:text-cyan-400"><Eye size={12} /></button>
                                      <button onClick={() => copyToClipboard(entry.prof_email_password!, 'Email Password')} className="text-slate-600 hover:text-cyan-400"><Copy size={12} /></button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Contact Numbers */}
                            {entry.contact_numbers && (
                              <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                                <label className="text-[9px] uppercase tracking-widest text-slate-500 block mb-1">Contact Numbers</label>
                                <div className="text-sm text-slate-300 whitespace-pre-line">{entry.contact_numbers}</div>
                              </div>
                            )}

                            {/* URLs */}
                            {(entry.url || entry.other_urls) && (
                              <div className="bg-black/30 p-4 rounded-xl border border-white/5 space-y-3">
                                {entry.url && (
                                  <a href={entry.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs font-bold text-blue-400 hover:text-blue-300 uppercase tracking-wider">
                                    <Globe size={14} /> Main Access URL <ExternalLink size={10} />
                                  </a>
                                )}
                                {entry.other_urls && (
                                  <div className="mt-2 pt-2 border-t border-white/5">
                                    <label className="text-[9px] uppercase tracking-widest text-slate-500 block mb-1">Other Important URLs</label>
                                    <div className="text-xs text-blue-400/80 hover:text-blue-400 whitespace-pre-line overflow-hidden break-all">
                                      {entry.other_urls}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Custom Fields */}
                            {entry.custom_fields && Array.isArray(entry.custom_fields) && entry.custom_fields.length > 0 && (
                              <div className="bg-black/30 p-4 rounded-xl border border-white/5 space-y-2">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-cyan-500/70 mb-2">Custom Data</h4>
                                {entry.custom_fields.map((field: any, idx: number) => (
                                  <div key={idx} className="flex justify-between items-center pb-2 border-b border-white/5 last:border-0 last:pb-0">
                                    <div>
                                      <label className="text-[9px] uppercase tracking-widest text-slate-500 block">{field.key}</label>
                                      <div className="text-white text-sm">{field.value}</div>
                                    </div>
                                    <button onClick={() => copyToClipboard(field.value, field.key)} className="text-slate-600 hover:text-cyan-400"><Copy size={12} /></button>
                                  </div>
                                ))}
                              </div>
                            )}

                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center opacity-30">
            <Shield size={48} className="mb-4 text-slate-600" />
            <p className="text-sm font-bold uppercase tracking-widest text-slate-500">Vault Empty</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-2xl bg-[#0f1115] rounded-3xl border border-white/10 shadow-2xl my-8 overflow-hidden"
            >
              <div className="p-6 border-b border-white/5 bg-[#13161a] sticky top-0 z-20 flex justify-between items-center">
                <h3 className="text-lg font-bold uppercase tracking-wide text-white">Add New Client Record</h3>
                <button onClick={() => setShowAddModal(false)} className="text-slate-500 hover:text-white transition-colors"><Plus size={24} className="rotate-45" /></button>
              </div>

              <form onSubmit={handleAddEntry} className="p-8 space-y-8 max-h-[80vh] overflow-y-auto custom-scrollbar">

                {/* Basic Info */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-cyan-500 border-b border-cyan-900/30 pb-2">Client Information</h4>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Client Name</label>
                      <input type="text" required value={newEntry.title} onChange={e => setNewEntry({ ...newEntry, title: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:border-cyan-500/50 outline-none" placeholder="e.g. Acme Corp" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Category</label>
                      <select value={newEntry.category} onChange={e => setNewEntry({ ...newEntry, category: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:border-cyan-500/50 outline-none appearance-none">
                        <option>General</option>
                        <option>Corporate</option>
                        <option>Individual</option>
                        <option>Government</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Login Credentials */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-cyan-500 border-b border-cyan-900/30 pb-2">Portal Access</h4>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Login URL</label>
                    <input type="url" value={newEntry.url} onChange={e => setNewEntry({ ...newEntry, url: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:border-cyan-500/50 outline-none" placeholder="https://" />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">User ID</label>
                      <input type="text" value={newEntry.username} onChange={e => setNewEntry({ ...newEntry, username: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-sm font-mono text-cyan-100 focus:border-cyan-500/50 outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Password</label>
                      <input type="text" value={newEntry.password} onChange={e => setNewEntry({ ...newEntry, password: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-sm font-mono text-cyan-100 focus:border-cyan-500/50 outline-none" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Site ID</label>
                    <input type="text" value={newEntry.site_id} onChange={e => setNewEntry({ ...newEntry, site_id: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-sm font-mono text-cyan-100 focus:border-cyan-500/50 outline-none" />
                  </div>
                </div>

                {/* Professional Details */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-cyan-500 border-b border-cyan-900/30 pb-2">Professional Contact</h4>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Professional Email</label>
                      <input type="email" value={newEntry.prof_email} onChange={e => setNewEntry({ ...newEntry, prof_email: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:border-cyan-500/50 outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email Password</label>
                      <input type="text" value={newEntry.prof_email_password} onChange={e => setNewEntry({ ...newEntry, prof_email_password: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-sm font-mono text-cyan-100 focus:border-cyan-500/50 outline-none" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Contact Numbers (Line separated)</label>
                    <textarea rows={2} value={newEntry.contact_numbers} onChange={e => setNewEntry({ ...newEntry, contact_numbers: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-xs text-slate-300 focus:border-cyan-500/50 outline-none resize-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Other Important URLs (Line separated)</label>
                    <textarea rows={2} value={newEntry.other_urls} onChange={e => setNewEntry({ ...newEntry, other_urls: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-xs text-blue-300 focus:border-cyan-500/50 outline-none resize-none" />
                  </div>
                </div>

                {/* Custom Fields */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-cyan-900/30 pb-2">
                    <h4 className="text-xs font-black uppercase tracking-widest text-cyan-500">Custom Data Points</h4>
                    <button type="button" onClick={addCustomField} className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 hover:text-cyan-300 flex items-center gap-1"><Plus size={12} /> Add Field</button>
                  </div>

                  {customFieldsInput.map((field, idx) => (
                    <div key={idx} className="flex gap-2 items-start animate-fade-in">
                      <input type="text" placeholder="Field Name" value={field.key} onChange={e => updateCustomField(idx, 'key', e.target.value)} className="w-1/3 bg-black/40 border border-white/10 rounded-xl py-2 px-3 text-xs text-slate-400 focus:border-cyan-500/50 outline-none" />
                      <input type="text" placeholder="Value" value={field.value} onChange={e => updateCustomField(idx, 'value', e.target.value)} className="flex-1 bg-black/40 border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:border-cyan-500/50 outline-none" />
                      <button type="button" onClick={() => removeCustomField(idx)} className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg"><Trash2 size={14} /></button>
                    </div>
                  ))}
                  {customFieldsInput.length === 0 && <p className="text-[10px] text-slate-600 italic pl-1">No custom fields added.</p>}
                </div>

                <div className="pt-4 border-t border-white/10">
                  <button
                    type="submit"
                    className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-lg shadow-cyan-500/20"
                  >
                    <Lock size={16} /> Save Record
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
