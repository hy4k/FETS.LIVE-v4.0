import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen, Fingerprint, Pen, Star, Lock, Sparkles,
  Plus, Trash2, Edit3, Check, X, Calendar, Clock,
  Bookmark, Heart, Flag, Tag, Search, ChevronRight,
  BookMarked, Feather, Crown, Gem, Award
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { toast } from 'react-hot-toast'
import { format } from 'date-fns'

// --- Types ---
interface SlateEntry {
  id: string
  user_id: string
  title: string
  content: string
  category: 'note' | 'idea' | 'task' | 'reflection' | 'dream'
  is_starred: boolean
  is_pinned: boolean
  mood?: string
  created_at: string
  updated_at: string
}

// --- Luxury Color Palette ---
const COLORS = {
  gold: '#D4AF37',
  champagne: '#F7E7CE',
  burgundy: '#800020',
  ivory: '#FFFFF0',
  sapphire: '#0F52BA',
  emerald: '#50C878',
  amethyst: '#9966CC',
  pearl: '#FDEEF4',
  bronze: '#CD7F32',
  cream: '#FFFDD0'
}

const CATEGORY_CONFIG = {
  note: { icon: Pen, color: 'from-amber-400 to-yellow-500', label: 'Note', accent: COLORS.gold },
  idea: { icon: Sparkles, color: 'from-violet-400 to-purple-500', label: 'Idea', accent: COLORS.amethyst },
  task: { icon: Flag, color: 'from-emerald-400 to-green-500', label: 'Task', accent: COLORS.emerald },
  reflection: { icon: Heart, color: 'from-rose-400 to-pink-500', label: 'Reflection', accent: COLORS.burgundy },
  dream: { icon: Star, color: 'from-blue-400 to-indigo-500', label: 'Dream', accent: COLORS.sapphire }
}

// --- Book Cover Component ---
const BookCover = ({ 
  userName, 
  onOpen, 
  isAuthenticated 
}: { 
  userName: string
  onOpen: () => void
  isAuthenticated: boolean
}) => {
  const [isHovered, setIsHovered] = useState(false)
  const [isScanning, setIsScanning] = useState(false)

  const handleFingerprintClick = () => {
    if (!isAuthenticated) {
      toast.error('Please log in to access your Slate')
      return
    }
    setIsScanning(true)
    // Simulate fingerprint scan
    setTimeout(() => {
      setIsScanning(false)
      onOpen()
    }, 1500)
  }

  return (
    <motion.div
      className="relative w-full max-w-md mx-auto perspective-1000"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Book Shadow */}
      <div className="absolute inset-0 translate-x-4 translate-y-4 bg-black/20 rounded-lg blur-xl" />
      
      {/* Book Cover */}
      <motion.div
        animate={{ 
          rotateY: isHovered ? -5 : 0,
          scale: isHovered ? 1.02 : 1
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="relative rounded-lg overflow-hidden shadow-2xl"
        style={{
          background: `linear-gradient(135deg, ${COLORS.burgundy} 0%, #4a0010 50%, ${COLORS.burgundy} 100%)`,
          minHeight: '500px'
        }}
      >
        {/* Leather Texture Overlay */}
        <div 
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`
          }}
        />

        {/* Gold Spine */}
        <div 
          className="absolute left-0 top-0 bottom-0 w-8"
          style={{
            background: `linear-gradient(90deg, ${COLORS.bronze} 0%, ${COLORS.gold} 50%, ${COLORS.bronze} 100%)`,
            boxShadow: 'inset -4px 0 8px rgba(0,0,0,0.3)'
          }}
        />

        {/* Decorative Corner Ornaments */}
        <div className="absolute top-4 left-12 right-4 h-px bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />
        <div className="absolute bottom-4 left-12 right-4 h-px bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />
        
        {/* Corner Flourishes */}
        <div className="absolute top-6 right-6">
          <Crown size={24} className="text-amber-400/60" />
        </div>
        <div className="absolute bottom-6 right-6">
          <Gem size={20} className="text-amber-400/60" />
        </div>

        {/* Main Content */}
        <div className="relative z-10 flex flex-col items-center justify-between h-full min-h-[500px] p-8 pl-12">
          
          {/* Top Badge */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-amber-400/10 border border-amber-400/30">
              <BookMarked size={14} className="text-amber-400" />
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-[0.3em]">Personal Archive</span>
            </div>
          </div>

          {/* Center: Title & Name */}
          <div className="text-center space-y-6">
            <motion.h1 
              className="text-5xl md:text-6xl font-serif text-amber-100 tracking-wider"
              style={{ 
                fontFamily: "'Cinzel Decorative', 'Times New Roman', serif",
                textShadow: '2px 2px 4px rgba(0,0,0,0.5), 0 0 30px rgba(212,175,55,0.3)'
              }}
            >
              SLATE
            </motion.h1>
            
            <div className="flex items-center justify-center gap-4">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-amber-400/50" />
              <Feather size={16} className="text-amber-400/70" />
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-amber-400/50" />
            </div>

            {/* User Name in Imperial Style */}
            <div className="relative">
              <p 
                className="text-2xl md:text-3xl text-amber-200/90 tracking-widest uppercase"
                style={{ 
                  fontFamily: "'Cinzel', 'Times New Roman', serif",
                  textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                }}
              >
                {userName || 'Anonymous'}
              </p>
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />
            </div>
          </div>

          {/* Fingerprint Scanner */}
          <div className="text-center">
            <motion.button
              onClick={handleFingerprintClick}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative group"
            >
              <div className={`
                w-24 h-24 rounded-full flex items-center justify-center
                bg-gradient-to-br from-amber-900/50 to-amber-950/50
                border-2 border-amber-400/30 
                shadow-[0_0_30px_rgba(212,175,55,0.2),inset_0_0_20px_rgba(0,0,0,0.3)]
                transition-all duration-500
                ${isScanning ? 'border-emerald-400 shadow-[0_0_40px_rgba(80,200,120,0.4)]' : ''}
              `}>
                <motion.div
                  animate={isScanning ? { 
                    scale: [1, 1.2, 1],
                    opacity: [1, 0.5, 1]
                  } : {}}
                  transition={{ repeat: Infinity, duration: 0.8 }}
                >
                  <Fingerprint 
                    size={48} 
                    className={`transition-colors duration-300 ${
                      isScanning ? 'text-emerald-400' : 'text-amber-400/70 group-hover:text-amber-300'
                    }`} 
                  />
                </motion.div>
              </div>
              
              {/* Scanning Ring */}
              {isScanning && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 1 }}
                  animate={{ scale: 1.5, opacity: 0 }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="absolute inset-0 rounded-full border-2 border-emerald-400"
                />
              )}
            </motion.button>
            
            <p className="mt-4 text-xs text-amber-400/60 uppercase tracking-[0.2em]">
              {isScanning ? 'Authenticating...' : 'Touch to Unlock'}
            </p>
          </div>
        </div>

        {/* Embossed Seal */}
        <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 opacity-10">
          <Award size={80} className="text-amber-400" />
        </div>
      </motion.div>
    </motion.div>
  )
}

// --- Entry Editor Modal ---
const EntryEditor = ({
  entry,
  onSave,
  onClose
}: {
  entry?: SlateEntry | null
  onSave: (data: Partial<SlateEntry>) => void
  onClose: () => void
}) => {
  const [title, setTitle] = useState(entry?.title || '')
  const [content, setContent] = useState(entry?.content || '')
  const [category, setCategory] = useState<SlateEntry['category']>(entry?.category || 'note')

  const handleSubmit = () => {
    if (!title.trim() || !content.trim()) {
      toast.error('Please fill in all fields')
      return
    }
    onSave({ title, content, category })
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl"
        style={{
          background: `linear-gradient(135deg, ${COLORS.cream} 0%, ${COLORS.ivory} 100%)`
        }}
      >
        {/* Header */}
        <div 
          className="px-6 py-4 flex items-center justify-between"
          style={{ background: `linear-gradient(135deg, ${COLORS.burgundy} 0%, #4a0010 100%)` }}
        >
          <div className="flex items-center gap-3">
            <BookOpen size={20} className="text-amber-400" />
            <h3 className="text-lg font-bold text-amber-100" style={{ fontFamily: "'Cinzel', serif" }}>
              {entry ? 'Edit Entry' : 'New Entry'}
            </h3>
          </div>
          <button onClick={onClose} className="p-2 text-amber-400/70 hover:text-amber-300 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-5">
          {/* Category Selector */}
          <div className="flex flex-wrap gap-2">
            {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
              const Icon = config.icon
              return (
                <button
                  key={key}
                  onClick={() => setCategory(key as SlateEntry['category'])}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold
                    transition-all duration-300
                    ${category === key 
                      ? `bg-gradient-to-r ${config.color} text-white shadow-lg` 
                      : 'bg-white/50 text-slate-600 hover:bg-white/80 border border-slate-200'
                    }
                  `}
                >
                  <Icon size={14} />
                  {config.label}
                </button>
              )
            })}
          </div>

          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Entry Title..."
            className="w-full px-4 py-3 text-lg font-semibold bg-white/70 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/50 text-slate-800 placeholder-slate-400"
            style={{ fontFamily: "'Cinzel', serif" }}
          />

          {/* Content with Notebook Lines */}
          <div 
            className="relative rounded-xl overflow-hidden border border-amber-200"
            style={{
              background: `linear-gradient(to bottom, transparent 31px, rgba(180,140,100,0.2) 31px)`,
              backgroundSize: '100% 32px',
              backgroundColor: COLORS.cream
            }}
          >
            {/* Red Margin Line */}
            <div className="absolute left-8 top-0 bottom-0 w-[2px] bg-rose-300/40" />
            
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your thoughts here..."
              rows={10}
              className="w-full pl-12 pr-4 py-4 bg-transparent resize-none focus:outline-none text-slate-700 leading-8"
              style={{ 
                fontFamily: "'Caveat', cursive",
                fontSize: '18px',
                lineHeight: '32px'
              }}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-slate-100 text-slate-600 font-semibold rounded-xl hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 px-6 py-3 font-bold rounded-xl text-white shadow-lg transition-all hover:shadow-xl"
              style={{ background: `linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.bronze} 100%)` }}
            >
              <span className="flex items-center justify-center gap-2">
                <Pen size={18} />
                Save Entry
              </span>
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// --- Entry Card ---
const EntryCard = ({
  entry,
  onEdit,
  onDelete,
  onToggleStar
}: {
  entry: SlateEntry
  onEdit: () => void
  onDelete: () => void
  onToggleStar: () => void
}) => {
  const config = CATEGORY_CONFIG[entry.category]
  const Icon = config.icon

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -4 }}
      className="group relative rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
      style={{ backgroundColor: COLORS.ivory }}
    >
      {/* Category Stripe */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${config.color}`} />
      
      {/* Pinned Badge */}
      {entry.is_pinned && (
        <div className="absolute top-3 right-3">
          <Bookmark size={18} className="text-amber-500 fill-amber-500" />
        </div>
      )}

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div 
            className={`p-2 rounded-lg bg-gradient-to-br ${config.color} shadow-md`}
          >
            <Icon size={16} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 
              className="font-bold text-slate-800 truncate"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              {entry.title}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {format(new Date(entry.created_at), 'MMM dd, yyyy • HH:mm')}
            </p>
          </div>
        </div>

        {/* Content Preview */}
        <p 
          className="text-slate-600 text-sm line-clamp-3 mb-4"
          style={{ fontFamily: "'Caveat', cursive", fontSize: '16px' }}
        >
          {entry.content}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200">
          <span className={`text-xs font-bold uppercase tracking-wider`} style={{ color: config.accent }}>
            {config.label}
          </span>
          
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={onToggleStar}
              className="p-1.5 rounded-lg hover:bg-amber-50 transition-colors"
            >
              <Star size={14} className={entry.is_starred ? 'text-amber-500 fill-amber-500' : 'text-slate-400'} />
            </button>
            <button 
              onClick={onEdit}
              className="p-1.5 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <Edit3 size={14} className="text-blue-500" />
            </button>
            <button 
              onClick={onDelete}
              className="p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
            >
              <Trash2 size={14} className="text-rose-500" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// --- Main Slate Component ---
export function Slate() {
  const { profile, user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [entries, setEntries] = useState<SlateEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [showEditor, setShowEditor] = useState(false)
  const [editingEntry, setEditingEntry] = useState<SlateEntry | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')

  // Load entries function using useCallback
  const loadEntries = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('slate_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) {
        if (error.code === '42P01') {
          console.warn('Slate table does not exist yet')
          setEntries([])
          return
        }
        throw error
      }
      setEntries(data || [])
    } catch (err) {
      console.error('Error loading entries:', err)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  // Load entries on open
  useEffect(() => {
    if (isOpen && user?.id) {
      loadEntries()
    }
  }, [isOpen, user?.id, loadEntries])

  const saveEntry = async (data: Partial<SlateEntry>) => {
    if (!user?.id) return

    try {
      if (editingEntry) {
        const { error } = await supabase
          .from('slate_entries')
          .update({ ...data, updated_at: new Date().toISOString() })
          .eq('id', editingEntry.id)
        if (error) throw error
        toast.success('Entry updated!')
      } else {
        const { error } = await supabase
          .from('slate_entries')
          .insert({
            ...data,
            user_id: user.id,
            is_starred: false,
            is_pinned: false
          })
        if (error) throw error
        toast.success('Entry created!')
      }
      setShowEditor(false)
      setEditingEntry(null)
      loadEntries()
    } catch (err: any) {
      toast.error(err.message || 'Failed to save entry')
    }
  }

  const deleteEntry = async (id: string) => {
    try {
      const { error } = await supabase.from('slate_entries').delete().eq('id', id)
      if (error) throw error
      toast.success('Entry deleted')
      loadEntries()
    } catch (err: any) {
      toast.error('Failed to delete entry')
    }
  }

  const toggleStar = async (entry: SlateEntry) => {
    try {
      const { error } = await supabase
        .from('slate_entries')
        .update({ is_starred: !entry.is_starred })
        .eq('id', entry.id)
      if (error) throw error
      loadEntries()
    } catch (err) {
      console.error('Error toggling star:', err)
    }
  }

  const filteredEntries = entries.filter(e => {
    if (filterCategory !== 'all' && e.category !== filterCategory) return false
    if (searchQuery && !e.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !e.content.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const starredCount = entries.filter(e => e.is_starred).length

  // If book is closed, show the cover
  if (!isOpen) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center p-6"
        style={{
          background: `linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)`
        }}
      >
        {/* Ambient Particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-amber-400/30 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0.3, 0.8, 0.3],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        <BookCover
          userName={profile?.full_name || 'Guest'}
          onOpen={() => setIsOpen(true)}
          isAuthenticated={!!user}
        />
      </div>
    )
  }

  // Open book view
  return (
    <div 
      className="min-h-screen p-6 pt-28"
      style={{
        background: `linear-gradient(135deg, ${COLORS.champagne} 0%, ${COLORS.cream} 50%, ${COLORS.ivory} 100%)`
      }}
    >
      {/* Notebook Paper Pattern */}
      <div
        className="fixed inset-0 pointer-events-none opacity-50"
        style={{
          backgroundImage: `
            linear-gradient(to bottom, transparent 31px, rgba(180,140,100,0.15) 31px)
          `,
          backgroundSize: '100% 32px'
        }}
      />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsOpen(false)}
                className="p-3 rounded-xl shadow-lg hover:shadow-xl transition-all"
                style={{ background: `linear-gradient(135deg, ${COLORS.burgundy} 0%, #4a0010 100%)` }}
              >
                <BookOpen size={24} className="text-amber-400" />
              </button>
              <div>
                <h1 
                  className="text-3xl font-bold text-slate-800 tracking-wider"
                  style={{ fontFamily: "'Cinzel Decorative', serif" }}
                >
                  My Slate
                </h1>
                <p className="text-sm text-slate-500" style={{ fontFamily: "'Cinzel', serif" }}>
                  {profile?.full_name}'s Personal Archive
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-white/70 rounded-xl border border-amber-200">
                <Pen size={16} className="text-amber-600" />
                <span className="text-sm font-bold text-slate-700">{entries.length} Entries</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white/70 rounded-xl border border-amber-200">
                <Star size={16} className="text-amber-500 fill-amber-500" />
                <span className="text-sm font-bold text-slate-700">{starredCount} Starred</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Search & Filter Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 flex flex-wrap items-center gap-4"
        >
          {/* Search */}
          <div className="flex-1 min-w-[200px] relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search entries..."
              className="w-full pl-11 pr-4 py-3 bg-white/80 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/50 text-slate-700"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setFilterCategory('all')}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                filterCategory === 'all' 
                  ? 'bg-slate-800 text-white' 
                  : 'bg-white/70 text-slate-600 hover:bg-white border border-slate-200'
              }`}
            >
              All
            </button>
            {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
              const Icon = config.icon
              return (
                <button
                  key={key}
                  onClick={() => setFilterCategory(key)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-semibold transition-all ${
                    filterCategory === key 
                      ? `bg-gradient-to-r ${config.color} text-white shadow-md` 
                      : 'bg-white/70 text-slate-600 hover:bg-white border border-slate-200'
                  }`}
                >
                  <Icon size={14} />
                  {config.label}
                </button>
              )
            })}
          </div>

          {/* New Entry Button */}
          <button
            onClick={() => {
              setEditingEntry(null)
              setShowEditor(true)
            }}
            className="flex items-center gap-2 px-5 py-3 font-bold rounded-xl text-white shadow-lg hover:shadow-xl transition-all"
            style={{ background: `linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.bronze} 100%)` }}
          >
            <Plus size={18} />
            New Entry
          </button>
        </motion.div>

        {/* Entries Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div 
                className="w-16 h-16 rounded-full border-4 border-amber-200 border-t-amber-500 animate-spin mx-auto mb-4" 
              />
              <p className="text-slate-500">Loading your entries...</p>
            </div>
          </div>
        ) : filteredEntries.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div 
              className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${COLORS.champagne} 0%, ${COLORS.ivory} 100%)` }}
            >
              <BookOpen size={40} className="text-amber-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-700 mb-2" style={{ fontFamily: "'Cinzel', serif" }}>
              Your Slate Awaits
            </h3>
            <p className="text-slate-500 mb-6">
              Start writing your thoughts, ideas, and dreams
            </p>
            <button
              onClick={() => setShowEditor(true)}
              className="px-6 py-3 font-bold rounded-xl text-white shadow-lg"
              style={{ background: `linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.bronze} 100%)` }}
            >
              Create Your First Entry
            </button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence>
              {filteredEntries.map(entry => (
                <EntryCard
                  key={entry.id}
                  entry={entry}
                  onEdit={() => {
                    setEditingEntry(entry)
                    setShowEditor(true)
                  }}
                  onDelete={() => deleteEntry(entry.id)}
                  onToggleStar={() => toggleStar(entry)}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Editor Modal */}
      <AnimatePresence>
        {showEditor && (
          <EntryEditor
            entry={editingEntry}
            onSave={saveEntry}
            onClose={() => {
              setShowEditor(false)
              setEditingEntry(null)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default Slate
