import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, Key, Lock, Unlock, Eye, EyeOff, Copy,
  ExternalLink, Search, Plus, Trash2, Edit3,
  Tag, Globe, User, Info, Check, ShieldCheck, AlertCircle,
  Database, Server, Fingerprint, Zap, Phone, Mail, Link as LinkIcon, Briefcase, Coins, Gem, Crown
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

  // Security State
  const [isLocked, setIsLocked] = useState(false)

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

      toast.success('Treasure Secured!', {
        icon: '💎',
        style: { background: '#1a1c1e', color: '#fbbf24', border: '1px solid #fbbf24' },
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
      icon: '✨',
      style: { background: '#1a1c1e', color: '#fbbf24', border: '1px solid #fbbf24' }
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
    <div className="flex flex-col h-full bg-[#0a0a09] text-amber-100/80 rounded-3xl overflow-hidden border border-amber-900/30 shadow-2xl relative font-sans">

      {/* Background Visuals (Dark Metal Texture) */}
      <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
        backgroundImage: `url("https://www.transparenttextures.com/patterns/carbon-fibre.png")`
      }} />
      <div className="absolute inset-0 bg-gradient-to-b from-black via-black/90 to-amber-900/20 pointer-events-none" />

      {/* Header Area */}
      <div className="relative z-10 p-6 flex flex-col gap-6 ">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-700 to-amber-900 flex items-center justify-center overflow-hidden shadow-[0_0_20px_rgba(245,158,11,0.3)] border border-amber-500/50">
              <Crown size={32} className="text-amber-200 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            </div>
            <div>
              <h2 className="text-3xl font-black tracking-tight text-amber-500 uppercase flex items-center gap-2 drop-shadow-md">
                Master Vault
              </h2>
              <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest mt-1">
                Classified Assets & Secrets
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Lock Button */}
            <button
              onClick={() => setIsLocked(!isLocked)}
              className={`h-16 w-16 rounded-2xl border transition-all flex items-center justify-center ${isLocked ? 'bg-amber-600/20 text-amber-500 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'bg-[#1c1917] text-amber-800 border-amber-900/30 hover:border-amber-500/50 hover:text-amber-500'}`}
            >
              {isLocked ? <Lock size={24} /> : <Unlock size={24} />}
            </button>

            {/* Golden Add Button */}
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowAddModal(true)}
              className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-300 via-amber-500 to-amber-700 shadow-[0_5px_15px_rgba(0,0,0,0.5)] border-4 border-amber-600 flex items-center justify-center group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 group-hover:bg-white/40 transition-colors rounded-full" />
              <Plus size={32} className="text-amber-950 font-black relative z-10 drop-shadow-sm" strokeWidth={4} />
            </motion.button>
          </div>
        </div>

        {/* Search Bar (Gold Plated) */}
        <div className={`relative group max-w-2xl mx-auto w-full transition-opacity duration-300 ${isLocked ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-amber-700 group-focus-within:text-amber-400 transition-colors" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search your treasures..."
            className="w-full bg-[#1c1917] border border-amber-900/30 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium outline-none focus:border-amber-500/50 focus:shadow-[0_0_15px_rgba(245,158,11,0.1)] transition-all placeholder:text-amber-900/50 text-amber-200"
          />
        </div>
      </div>

      {/* Locked State Overlay */}
      {isLocked ? (
        <div className="absolute inset-0 z-20 bg-[#0a0a09] flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
          <div className="w-64 h-64 rounded-full border-4 border-amber-900/40 border-dashed animate-[spin_10s_linear_infinite] absolute" />
          <div className="w-48 h-48 rounded-full border-2 border-amber-500/20 absolute" />
          <ShieldCheck size={80} className="text-amber-600 mb-6 drop-shadow-[0_0_30px_rgba(245,158,11,0.3)] animate-pulse" />
          <h2 className="text-4xl font-black text-white uppercase tracking-widest mb-2">Vault Secured</h2>
          <p className="text-amber-700 font-bold tracking-wider mb-8 uppercase text-xs">Biometric Lock Active</p>
          <button
            onClick={() => setIsLocked(false)}
            className="px-8 py-4 bg-amber-600 hover:bg-amber-500 text-black font-black uppercase tracking-[0.2em] rounded-xl transition-all shadow-[0_0_20px_rgba(217,119,6,0.4)] hover:shadow-[0_0_40px_rgba(245,158,11,0.6)]"
          >
            Unlock Access
          </button>
        </div>
      ) : null}

      {/* Vault Content Grid */}
      <div className="relative z-10 flex-1 overflow-y-auto custom-scrollbar p-6">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center opacity-50">
            <div className="w-12 h-12 border-4 border-amber-900/40 border-t-amber-500 rounded-full animate-spin mb-4" />
            <p className="text-xs font-bold uppercase tracking-widest text-amber-700">Unlocking Vault...</p>
          </div>
        ) : filteredEntries.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredEntries.map((entry) => (
              <motion.div
                layoutId={entry.id}
                key={entry.id}
                onClick={() => setActiveEntryId(activeEntryId === entry.id ? null : entry.id)}
                className={`
                    group relative bg-gradient-to-br from-[#1c1917] to-[#0c0a09] border rounded-2xl overflow-hidden cursor-pointer transition-all duration-300
                    ${activeEntryId === entry.id
                    ? 'col-span-1 md:col-span-2 lg:col-span-2 border-amber-500/60 shadow-[0_0_40px_rgba(245,158,11,0.15)] z-20 scale-[1.01]'
                    : 'border-amber-900/20 hover:border-amber-500/40 hover:shadow-xl hover:scale-[1.02]'
                  }
                `}
              >
                {/* Decorative Rivets */}
                <div className="absolute top-2 left-2 w-1.5 h-1.5 rounded-full bg-amber-900/40 shadow-inner" />
                <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-amber-900/40 shadow-inner" />
                <div className="absolute bottom-2 left-2 w-1.5 h-1.5 rounded-full bg-amber-900/40 shadow-inner" />
                <div className="absolute bottom-2 right-2 w-1.5 h-1.5 rounded-full bg-amber-900/40 shadow-inner" />

                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-4">
                      {/* Icon Box */}
                      <div className={`
                         w-12 h-12 rounded-xl flex items-center justify-center shadow-inner
                         ${activeEntryId === entry.id
                          ? 'bg-amber-500 text-amber-950 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                          : 'bg-[#292524] text-amber-700 group-hover:text-amber-500 transition-colors'}
                      `}>
                        {activeEntryId === entry.id ? <Unlock size={24} /> : <Lock size={20} />}
                      </div>

                      <div>
                        <h3 className={`text-lg font-black uppercase tracking-wide ${activeEntryId === entry.id ? 'text-amber-100' : 'text-amber-700 group-hover:text-amber-200'}`}>{entry.title}</h3>
                        <p className="text-[9px] uppercase tracking-widest text-amber-900/60 mt-1 font-bold">{entry.category}</p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => deleteEntry(entry.id, e)}
                      className="p-2 hover:bg-red-900/20 text-amber-900/40 hover:text-red-500 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={16} />
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
                        <div className="pt-6 border-t border-amber-900/20 grid gap-6 grid-cols-1 md:grid-cols-2">

                          {/* Left Column */}
                          <div className="space-y-4">
                            {(entry.username || entry.password) && (
                              <div className="bg-black/40 p-4 rounded-xl border border-amber-900/30 space-y-3 shadow-inner">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-2 flex items-center gap-2"><Key size={10} /> Access Keys</h4>

                                {entry.username && (
                                  <div className="flex justify-between items-center group/field">
                                    <div className="flex-1">
                                      <label className="text-[9px] uppercase tracking-widest text-amber-900 block">User Identity</label>
                                      <div className="font-mono text-amber-100 text-sm">{entry.username}</div>
                                    </div>
                                    <button onClick={() => copyToClipboard(entry.username!, 'User ID')} className="text-amber-800 hover:text-amber-400"><Copy size={14} /></button>
                                  </div>
                                )}

                                {entry.password && (
                                  <div className="flex justify-between items-center group/field">
                                    <div className="flex-1">
                                      <label className="text-[9px] uppercase tracking-widest text-amber-900 block">Secret Code</label>
                                      <div className="font-mono text-amber-100 text-sm tracking-widest">
                                        {revealMap[`${entry.id}-pass`] ? entry.password : '••••••••••••'}
                                      </div>
                                    </div>
                                    <div className="flex gap-2">
                                      <button onClick={() => toggleReveal(entry.id, 'pass')} className="text-amber-800 hover:text-amber-400"><Eye size={14} /></button>
                                      <button onClick={() => copyToClipboard(entry.password!, 'Password')} className="text-amber-800 hover:text-amber-400"><Copy size={14} /></button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Custom Fields */}
                            {entry.custom_fields && Array.isArray(entry.custom_fields) && entry.custom_fields.length > 0 && (
                              <div className="bg-black/40 p-4 rounded-xl border border-amber-900/30 space-y-2 shadow-inner">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-2 flex items-center gap-2"><Database size={10} /> Custom Attributes</h4>
                                {entry.custom_fields.map((field: any, idx: number) => (
                                  <div key={idx} className="flex justify-between items-center pb-2 border-b border-amber-900/20 last:border-0 last:pb-0">
                                    <div>
                                      <label className="text-[9px] uppercase tracking-widest text-amber-900 block">{field.key}</label>
                                      <div className="text-amber-100 text-sm">{field.value}</div>
                                    </div>
                                    <button onClick={() => copyToClipboard(field.value, field.key)} className="text-amber-800 hover:text-amber-400"><Copy size={14} /></button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Right Column */}
                          <div className="space-y-4">
                            {/* Contact/Email */}
                            {(entry.prof_email || entry.contact_numbers) && (
                              <div className="bg-black/40 p-4 rounded-xl border border-amber-900/30 space-y-3 shadow-inner">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-2 flex items-center gap-2"><Briefcase size={10} /> Contact Intel</h4>

                                {entry.prof_email && (
                                  <div className="flex justify-between items-center">
                                    <div>
                                      <label className="text-[9px] uppercase tracking-widest text-amber-900 block">Email</label>
                                      <div className="text-amber-100 text-sm">{entry.prof_email}</div>
                                    </div>
                                    <button onClick={() => copyToClipboard(entry.prof_email!, 'Email')} className="text-amber-800 hover:text-amber-400"><Copy size={14} /></button>
                                  </div>
                                )}

                                {entry.contact_numbers && (
                                  <div className="pt-2 border-t border-amber-900/20">
                                    <label className="text-[9px] uppercase tracking-widest text-amber-900 block">Comms</label>
                                    <div className="text-amber-100 text-sm whitespace-pre-line">{entry.contact_numbers}</div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* URLs */}
                            {(entry.url || entry.other_urls) && (
                              <div className="bg-black/40 p-4 rounded-xl border border-amber-900/30 space-y-3 shadow-inner">
                                {entry.url && (
                                  <a href={entry.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs font-black text-amber-400 hover:text-amber-300 uppercase tracking-wider group/link">
                                    <Globe size={14} /> Launch Portal <ExternalLink size={10} className="group-hover/link:translate-x-1 transition-transform" />
                                  </a>
                                )}
                                {entry.other_urls && (
                                  <div className="mt-2 text-[10px] text-amber-700/80 whitespace-pre-line overflow-hidden break-all font-mono">
                                    {entry.other_urls}
                                  </div>
                                )}
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
            <Coins size={64} className="mb-4 text-amber-800" />
            <p className="text-sm font-bold uppercase tracking-widest text-amber-900">Vault Empty</p>
            <p className="text-[10px] text-amber-900/60 mt-2">Start securing your fortune.</p>
          </div>
        )}
      </div>

      {/* Add Entry Modal (Treasure Chest Style) */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 50 }}
              className="w-full max-w-2xl bg-[#1c1917] rounded-3xl border-2 border-amber-600 shadow-[0_0_100px_rgba(251,191,36,0.2)] overflow-hidden relative"
            >
              {/* Modal Glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_20px_#fbbf24]" />

              <div className="p-8 border-b border-amber-900/40 bg-[#292524] flex justify-between items-center relative z-10">
                <div className="flex items-center gap-3">
                  <Gem className="text-amber-400" />
                  <h3 className="text-xl font-black uppercase tracking-wide text-amber-100">Mint New Asset</h3>
                </div>
                <button onClick={() => setShowAddModal(false)} className="text-amber-900 hover:text-amber-500 transition-colors"><Plus size={24} className="rotate-45" /></button>
              </div>

              <form onSubmit={handleAddEntry} className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar relative z-10">

                {/* Section: Basic Info */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-amber-600 border-b border-amber-900/30 pb-2">01. Asset Identification</h4>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold text-amber-800 uppercase tracking-widest">Name / Title</label>
                      <input autoFocus type="text" required value={newEntry.title} onChange={e => setNewEntry({ ...newEntry, title: e.target.value })} className="w-full bg-black/30 border border-amber-900/30 rounded-xl py-3 px-4 text-sm text-amber-100 focus:border-amber-500/50 outline-none transition-all focus:shadow-[0_0_10px_rgba(245,158,11,0.1)]" placeholder="E.g. Royal Bank" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold text-amber-800 uppercase tracking-widest">Classification</label>
                      <input type="text" list="categories" value={newEntry.category} onChange={e => setNewEntry({ ...newEntry, category: e.target.value })} className="w-full bg-black/30 border border-amber-900/30 rounded-xl py-3 px-4 text-sm text-amber-100 focus:border-amber-500/50 outline-none" placeholder="General" />
                      <datalist id="categories">
                        <option value="Financial" />
                        <option value="Corporate" />
                        <option value="Personal" />
                        <option value="Emergency" />
                      </datalist>
                    </div>
                  </div>
                </div>

                {/* Section: Credentials */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-amber-900/30 pb-2">
                    <h4 className="text-xs font-black uppercase tracking-widest text-amber-600">02. Secure Keys</h4>
                    <Lock size={12} className="text-amber-800" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-amber-800 uppercase tracking-widest">Portal URL</label>
                    <input type="url" value={newEntry.url} onChange={e => setNewEntry({ ...newEntry, url: e.target.value })} className="w-full bg-black/30 border border-amber-900/30 rounded-xl py-3 px-4 text-sm text-blue-300 focus:border-amber-500/50 outline-none" placeholder="https://" />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold text-amber-800 uppercase tracking-widest">Username / ID</label>
                      <input type="text" value={newEntry.username} onChange={e => setNewEntry({ ...newEntry, username: e.target.value })} className="w-full bg-black/30 border border-amber-900/30 rounded-xl py-3 px-4 text-sm text-amber-100 focus:border-amber-500/50 outline-none font-mono" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold text-amber-800 uppercase tracking-widest">Secret Phrase</label>
                      <input type="text" value={newEntry.password} onChange={e => setNewEntry({ ...newEntry, password: e.target.value })} className="w-full bg-black/30 border border-amber-900/30 rounded-xl py-3 px-4 text-sm text-amber-100 focus:border-amber-500/50 outline-none font-mono" />
                    </div>
                  </div>
                </div>

                {/* Section: Custom Data (Free Form) */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-amber-900/30 pb-2">
                    <h4 className="text-xs font-black uppercase tracking-widest text-amber-600">03. Additional Intel</h4>
                    <button type="button" onClick={addCustomField} className="px-3 py-1 rounded bg-amber-500/10 text-[10px] font-bold uppercase tracking-wider text-amber-500 hover:bg-amber-500 hover:text-black transition-colors flex items-center gap-2">
                      <Plus size={10} /> Add Field
                    </button>
                  </div>

                  {customFieldsInput.map((field, idx) => (
                    <div key={idx} className="flex gap-2 items-start animate-in fade-in slide-in-from-left-4">
                      <input type="text" placeholder="Label (e.g. PIN)" value={field.key} onChange={e => updateCustomField(idx, 'key', e.target.value)} className="w-1/3 bg-black/30 border border-amber-900/30 rounded-xl py-2 px-3 text-xs text-amber-700 focus:border-amber-500/50 outline-none" />
                      <input type="text" placeholder="Data" value={field.value} onChange={e => updateCustomField(idx, 'value', e.target.value)} className="flex-1 bg-black/30 border border-amber-900/30 rounded-xl py-2 px-3 text-xs text-amber-100 focus:border-amber-500/50 outline-none" />
                      <button type="button" onClick={() => removeCustomField(idx)} className="p-2 text-red-500/50 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                    </div>
                  ))}
                  {customFieldsInput.length === 0 && <p className="text-[10px] text-amber-900/50 italic py-2">No custom data points added.</p>}
                </div>

                <div className="pt-6 border-t border-amber-900/30 flex gap-4">
                  <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-4 text-amber-800 font-bold uppercase tracking-widest text-xs hover:bg-amber-900/10 rounded-xl transition-colors">Cancel</button>
                  <button
                    type="submit"
                    className="flex-1 py-4 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-black rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-[0_5px_20px_rgba(245,158,11,0.3)] transform hover:-translate-y-1"
                  >
                    <ShieldCheck size={16} /> Secure in Vault
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
