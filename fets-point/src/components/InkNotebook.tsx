import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useBranch } from '../hooks/useBranch'

// INK Entry type
interface InkEntry {
  id: string
  section: 'now' | 'next' | 'later'
  content: string
  author_name: string
  author_id: string
  branch_location: string
  created_at: string
}

// Section-specific prompts (Human-centric)
const SECTION_PROMPTS = {
  now: "What needs attention before the next exam?",
  next: "What should not be forgotten tomorrow?",
  later: "Park thoughts here. Nothing urgent."
}

const SECTION_SUBHEADERS = {
  now: "What needs attention now",
  next: "What should not be forgotten tomorrow?",
  later: "Park thoughts here. Nothing urgent."
}

// Visual Rhythm spacing - rhythmic movement
const SECTION_SPACING = {
  now: "48px",   // Wider
  next: "40px",  // Base
  later: "34px"  // Tighter
}

// Theme colors for sections - adjusted for clear contrast & saturation energy
// NOW (+6%), NEXT (base), LATER (-6%)
const SECTION_THEMES = {
  now: {
    bg: 'hsla(37, 98%, 51%, 0.12)',      // More visible saturation
    tab: '#F59E0B',
    line: 'hsla(37, 98%, 51%, 0.3)',
    accent: '#D97706',
    text: '#451A03',
    glow: 'hsla(37, 98%, 51%, 0.18)'
  },
  next: {
    bg: 'hsla(37, 98%, 51%, 0.12)',      // Same as now
    tab: '#F59E0B',
    line: 'hsla(37, 98%, 51%, 0.3)',
    accent: '#D97706',
    text: '#451A03',
    glow: 'hsla(37, 98%, 51%, 0.18)'
  },
  later: {
    bg: 'hsla(37, 98%, 51%, 0.12)',      // Same as now
    tab: '#F59E0B',
    line: 'hsla(37, 98%, 51%, 0.3)',
    accent: '#D97706',
    text: '#451A03',
    glow: 'hsla(37, 98%, 51%, 0.18)'
  }
}

// Editable Entry Component
function EditableEntry({ 
  entry, 
  theme, 
  sectionSpacing,
  isOwner, 
  onUpdate, 
  onDelete 
}: { 
  entry: InkEntry
  theme: any
  sectionSpacing: string
  isOwner: boolean
  onUpdate: (id: string, content: string) => void
  onDelete: (id: string) => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [text, setText] = useState(entry.content)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isEditing) setText(entry.content)
  }, [entry.content, isEditing])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && text === '') {
       onDelete(entry.id)
       setIsEditing(false)
    }
    if (e.key === 'Enter') {
       if (text.trim() !== '') {
          onUpdate(entry.id, text)
       } else {
          onDelete(entry.id)
       }
       setIsEditing(false)
    }
    if (e.key === 'Escape') {
      setText(entry.content)
      setIsEditing(false)
    }
  }

  const handleBlur = () => {
    if (text.trim() === '') {
      // If left empty on blur, maybe don't delete immediately, or revert?
      // Let's revert to avoid accidental deletion
      setText(entry.content)
    } else if (text !== entry.content) {
       onUpdate(entry.id, text)
    }
    setIsEditing(false)
  }

  const handleClick = () => {
    if (isOwner) {
      setIsEditing(true)
      // Small timeout to allow render before focus, though autoFocus helps
      setTimeout(() => inputRef.current?.focus(), 10)
    }
  }

  if (isEditing) {
     return (
        <div className="relative flex-1 h-full flex items-center">
            <input 
              ref={inputRef}
              autoFocus 
              value={text} 
              onChange={e => setText(e.target.value)} 
              onBlur={handleBlur} 
              onKeyDown={handleKeyDown}
              className="w-full bg-transparent outline-none text-[15px] flex-1 font-medium italic"
              style={{ 
                color: theme.text,
                fontFamily: "'Inter', sans-serif",
                caretColor: '#6B7280' 
              }}
            />
            {/* Visual indicator of editing state */}
            <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-amber-500/50" />
        </div>
     )
  }

  return (
    <div className="flex items-center justify-between gap-4 h-full w-full cursor-text" onClick={handleClick}>
      <span 
        className={`text-[15px] leading-relaxed flex-1 font-medium italic select-none ${isOwner ? 'hover:text-black/80 transition-colors' : ''}`}
        style={{ 
          color: theme.text,
          fontFamily: "'Inter', sans-serif"
        }}
      >
        {text}
      </span>
      <motion.span 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ delay: 0.1 }}
        className="text-[10px] font-black whitespace-nowrap uppercase tracking-tighter italic"
        style={{ color: theme.accent }}
      >
        {entry.author_name}
      </motion.span>
    </div>
  )
}


function NotebookSection({
  section,
  entries,
  onAddEntry,
  onUpdateEntry,
  onDeleteEntry,
  currentUserId,
  isFocused,
  onFocus
}: {
  section: 'now' | 'next' | 'later'
  entries: InkEntry[]
  onAddEntry: (section: string, content: string) => void
  onUpdateEntry: (id: string, content: string) => void
  onDeleteEntry: (id: string) => void
  currentUserId?: string
  isFocused: boolean
  onFocus: () => void
}) {
  const theme = SECTION_THEMES[section]
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      onAddEntry(section, inputValue.trim())
      setInputValue('')
      setIsTyping(false)
    } else if (e.key === 'Backspace' && inputValue === '' && entries.length > 0) {
      // If main input is empty and backspace is pressed, delete the LAST entry owned by user
      // Iterate backwards to find last owned entry
      for (let i = entries.length - 1; i >= 0; i--) {
        if (entries[i].author_id === currentUserId) {
          onDeleteEntry(entries[i].id)
          break;
        }
      }
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
    setIsTyping(e.target.value.length > 0)
  }

  return (
    <div 
      className={`flex flex-col relative transition-all duration-300 ${isFocused ? 'z-10 shadow-[0_4px_20px_rgba(0,0,0,0.05)]' : 'z-0'}`}
      style={{ 
        background: isFocused ? theme.glow : theme.bg,
        borderBottom: section !== 'later' ? `1px solid ${theme.line}` : 'none',
        flex: 1,
        filter: isFocused ? 'none' : 'grayscale(15%) opacity(0.85)'
      }}
      onClick={onFocus}
    >

      {/* Section Header - Inside the Left Margin */}
      <div 
        className="absolute left-6 top-6 z-30 pointer-events-none flex flex-col items-start"
        // Reduced width slightly as margin is smaller now
        style={{ width: '80px' }}
      >
        <span 
          className="font-black uppercase tracking-[0.2em] italic text-[16px]"
          style={{ color: theme.accent }}
        >
          {section}
        </span>
        <div className="h-[1px] w-8 mt-3 opacity-30" style={{ background: theme.accent }} />
      </div>

      {/* Vertical Margin Strip - Reduced Margin Width */}
      <div 
        className="absolute left-20 top-0 bottom-0 w-[2px] opacity-20 pointer-events-none"
        style={{ background: theme.accent }}
      />

      {/* Entries Area - Reduced Padding */}
      <div className="flex-1 overflow-y-auto pl-28 pr-8 pt-6 pb-6 space-y-0 custom-scrollbar">
        {/* Secondary Header - Inside the Notebook Content Area */}
        <div className="mb-4 -mt-1.5 inline-block relative group">
             <span 
              className="font-medium italic leading-tight text-[14px] opacity-90 relative z-10"
              style={{ 
                  color: theme.text,
                  fontFamily: "'Playfair Display', serif" 
              }}
            >
              {SECTION_SUBHEADERS[section]}
            </span>
            {/* Underline extending beyond text */}
            <div 
              className="absolute bottom-0 left-0 h-[1px] opacity-40 z-0"
              style={{ 
                background: theme.accent,
                width: '120%' // Extends beyond text
              }} 
            />
        </div>
        {entries.map((entry, idx) => (
          <motion.div
            key={entry.id || `entry-${idx}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative py-2 border-b"
            style={{ 
              borderColor: idx % 3 === 0 ? theme.line.replace('0.2', '0.4').replace('0.15', '0.35') : theme.line, 
              borderStyle: idx % 3 === 0 ? 'solid' : 'dashed',
              minHeight: SECTION_SPACING[section]
            }}
          >
            <EditableEntry 
              entry={entry}
              theme={theme}
              sectionSpacing={SECTION_SPACING[section]}
              isOwner={entry.author_id === currentUserId}
              onUpdate={onUpdateEntry}
              onDelete={onDeleteEntry}
            />
          </motion.div>
        ))}
        
        {/* Active Line - In-line typing */}
        <div 
          className="relative py-2 border-b border-dashed flex items-center"
          style={{ 
            borderColor: theme.line,
            minHeight: SECTION_SPACING[section]
          }}
        >
          <div className="relative flex-1 flex items-center">
            {/* Ink Pressure Wrap */}
            <div className="absolute left-0 pointer-events-none text-[15px] font-medium italic" style={{ color: theme.text }}>
              {inputValue.length > 0 && (
                <span className="opacity-100 contrast-[1.5] brightness-50">
                  {inputValue[0]}
                </span>
              )}
              {inputValue.length > 1 && (
                <span className="opacity-100">
                  {inputValue.substring(1)}
                </span>
              )}
            </div>

            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={onFocus}
              placeholder=""
              className={`w-full bg-transparent outline-none text-[15px] flex-1 font-medium transition-colors duration-100 ${inputValue.length > 0 ? 'text-transparent' : 'text-inherit opacity-60'}`}
              style={{ 
                fontFamily: "'Inter', sans-serif",
                caretColor: '#6B7280' 
              }}
            />
            
            {/* Typing Underline Animation */}
            {isTyping && (
              <motion.div 
                layoutId={`underline-${section}`}
                className="absolute bottom-0 left-0 h-[2px] opacity-40"
                style={{ background: theme.accent }}
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 0.15 }}
              />
            )}
          </div>
        </div>

        {/* Decorative Lines */}
        {Array.from({ length: 3 }).map((_, idx) => (
          <div 
            key={`empty-${idx}`}
            className="py-2 border-b opacity-40"
            style={{ 
              borderColor: (entries.length + 1 + idx) % 3 === 0 ? theme.line.replace('0.2', '0.4') : theme.line,
              borderStyle: (entries.length + 1 + idx) % 3 === 0 ? 'solid' : 'dashed',
              minHeight: SECTION_SPACING[section]
            }}
          />
        ))}
      </div>
    </div>
  )
}

export function InkNotebook() {
  const { profile, user } = useAuth()
  const { activeBranch } = useBranch()
  
  const [entries, setEntries] = useState<InkEntry[]>([])
  const [focusedSection, setFocusedSection] = useState<'now' | 'next' | 'later'>('now')
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const fetchEntries = useCallback(async () => {
    if (!activeBranch || activeBranch === 'global') return
    
    try {
      const { data, error } = await supabase
        .from('frame_entries')
        .select('*')
        .eq('branch_location', activeBranch)
        .order('created_at', { ascending: true })

      if (error) throw error
      setEntries(data || [])
    } catch (e) {
      console.error('Failed to fetch INK entries:', e)
    }
  }, [activeBranch])

  useEffect(() => {
    fetchEntries()
    
    const channel = supabase
      .channel('ink-entries')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'frame_entries',
          filter: `branch_location=eq.${activeBranch}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setEntries(prev => [...prev, payload.new as InkEntry])
          } else if (payload.eventType === 'DELETE') {
            setEntries(prev => prev.filter(e => e.id !== payload.old.id))
          } else if (payload.eventType === 'UPDATE') {
            setEntries(prev => prev.map(e => 
              e.id === payload.new.id ? payload.new as InkEntry : e
            ))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [activeBranch, fetchEntries])

  const handleAddEntry = async (section: string, content: string) => {
    if (!user?.id || !profile?.full_name || !activeBranch) return

    try {
      await supabase
        .from('frame_entries')
        .insert({
          section,
          content,
          author_name: profile.full_name.split(' ')[0],
          author_id: user.id,
          branch_location: activeBranch
        })
    } catch (e) {
      console.error('Failed to add entry:', e)
    }
  }

  const handleUpdateEntry = async (id: string, content: string) => {
    try {
      if (content.trim() === '') return // Avoid empty updates
      
      await supabase
        .from('frame_entries')
        .update({ content })
        .eq('id', id)
    } catch (e) {
       console.error('Failed to update entry:', e)
    }
  }

  const handleDeleteEntry = async (id: string) => {
    // Optimistic UI update for instant feel
    setEntries(prev => prev.filter(e => e.id !== id))
    
    try {
      await supabase.from('frame_entries').delete().eq('id', id)
    } catch (e) {
      console.error('Failed to delete entry:', e)
      // Revert/Refetch on failure
      fetchEntries()
    }
  }

  const getEntriesBySection = (section: 'now' | 'next' | 'later') => 
    entries.filter(e => e.section === section)

  if (activeBranch === 'global') {
    return (
      <div className="h-full flex items-center justify-center text-slate-400 text-sm p-6 bg-[#FFFBF5]">
        <span className="text-center opacity-50 font-black uppercase tracking-widest leading-relaxed">Select branch node<br/>to initialize INK</span>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col relative py-4">
        {/* The component padding 'py-4' allows the tabs to "hang out" of the notebook body */}
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="h-full flex flex-col relative overflow-visible shadow-[0_15px_40px_-10px_rgba(0,0,0,0.12)]"
            style={{
                background: `
                linear-gradient(135deg, #FFFBF5 0%, #FFF9EE 50%, #FFF7E8 100%)
                `,
                borderRadius: '0 0 32px 32px',
                border: '1px solid rgba(217, 119, 6, 0.25)',
                borderTop: 'none',
                position: 'relative'
            }}
            >
            {/* Paper Grain Overlay */}
            <div className="absolute inset-0 opacity-[0.05] pointer-events-none mix-blend-multiply rounded-b-[32px] overflow-hidden" 
                style={{ backgroundImage: `url("https://www.transparenttextures.com/patterns/handmade-paper.png")` }} />

            {/* Notebook Spine */}
            <div 
                className="absolute left-0 top-0 bottom-0 w-10 pointer-events-none z-20 flex flex-col justify-between py-10"
                style={{
                background: 'linear-gradient(to right, rgba(0, 0, 0, 0.05) 0%, rgba(0, 0, 0, 0.02) 40%, transparent 100%)',
                borderRight: '1px solid rgba(0,0,0,0.03)'
                }}
            >
                {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="w-5 h-5 rounded-full bg-[#E0E0E0] self-center shadow-[inset_1px_1px_2px_rgba(0,0,0,0.2),1px_1px_0px_rgba(255,255,255,0.7)]" />
                ))}
            </div>

            {/* Notebook Header */}
            <div 
                className="flex items-center justify-between pl-16 pr-8 py-6 relative z-10"
                style={{ 
                borderBottom: '2px solid rgba(217, 119, 6, 0.15)',
                background: 'rgba(255, 251, 245, 0.98)'
                }}
            >
                <div className="flex flex-col">
                {/* Old text removed */}
                <span 
                    className="text-4xl font-black uppercase tracking-[0.35em] italic"
                    style={{ 
                    color: '#4B3621',
                    fontFamily: "'Rajdhani', sans-serif"
                    }}
                >
                    Ink
                </span>
                </div>
                <div className="text-right">
                   <div className="flex flex-col items-end gap-0.5">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 font-['Rajdhani']">Standard Time</span>
                      <span className="text-4xl font-black text-slate-800 tracking-tighter font-['Rajdhani'] leading-none">
                          {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                      </span>
                   </div>
                </div>
            </div>

            {/* Horizontal Notebook Sections */}
            <div className="flex-1 flex flex-col min-h-0 relative z-10 rounded-b-[32px] overflow-visible">
                <AnimatePresence>
                <NotebookSection
                    section="now"
                    entries={getEntriesBySection('now')}
                    onAddEntry={handleAddEntry}
                    onUpdateEntry={handleUpdateEntry}
                    onDeleteEntry={handleDeleteEntry}
                    currentUserId={user?.id}
                    isFocused={focusedSection === 'now'}
                    onFocus={() => setFocusedSection('now')}
                />
                <NotebookSection
                    section="next"
                    entries={getEntriesBySection('next')}
                    onAddEntry={handleAddEntry}
                    onUpdateEntry={handleUpdateEntry}
                    onDeleteEntry={handleDeleteEntry}
                    currentUserId={user?.id}
                    isFocused={focusedSection === 'next'}
                    onFocus={() => setFocusedSection('next')}
                />
                <NotebookSection
                    section="later"
                    entries={getEntriesBySection('later')}
                    onAddEntry={handleAddEntry}
                    onUpdateEntry={handleUpdateEntry}
                    onDeleteEntry={handleDeleteEntry}
                    currentUserId={user?.id}
                    isFocused={focusedSection === 'later'}
                    onFocus={() => setFocusedSection('later')}
                />
                </AnimatePresence>
            </div>
            
            {/* Inner Depth Layer */}
            <div className="absolute inset-0 pointer-events-none shadow-[inset_0_2px_12px_rgba(0,0,0,0.06)] rounded-b-[32px]" />
        </motion.div>
    </div>
  )
}

export default InkNotebook
