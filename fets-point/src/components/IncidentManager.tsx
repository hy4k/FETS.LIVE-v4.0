import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Plus, Send, Clock, User, CheckCircle, AlertTriangle,
  Monitor, MessageSquare, ChevronRight, Activity, Filter, Eye,
  Calendar, Users, UserX, Globe, Building, Wrench, X, Hash,
  Phone, CheckSquare, StickyNote, Settings, Check
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useBranch } from '../hooks/useBranch'
import { supabase } from '../lib/supabase'
import { toast } from 'react-hot-toast'

// --- Types ---
interface Incident {
  id: string
  title: string
  description: string
  category: string
  status: 'open' | 'assigned' | 'in_progress' | 'escalated' | 'closed'
  severity: 'critical' | 'major' | 'minor'
  reporter?: string
  created_at: string
  branch_location: string
  // Using metadata for flexible data like contact info, task lists etc
  metadata?: any 
}

interface Comment {
  id: string
  created_at: string
  body: string
  type: 'text' | 'contact' | 'task' | 'asset' | 'system'
  data?: any // JSON for specific widget data
  author_id: string
  author_full_name: string
}

// --- Menu Config ---
const SOURCES = [
  { id: 'all', label: 'All Cases', icon: Activity },
  { id: 'staff', label: 'Staff / Roster', icon: Users },
  { id: 'candidate', label: 'Candidates', icon: UserX },
  { id: 'exam', label: 'Exams & Cal', icon: Calendar },
  { id: 'system', label: 'Systems / IT', icon: Monitor },
  { id: 'facility', label: 'Facility', icon: Building },
]

const STATUS_OPTIONS = [
    { value: 'open', label: 'OPEN CASE', color: '#3b82f6', bg: '#eff6ff' },
    { value: 'in_progress', label: 'IN PROGRESS', color: '#f59e0b', bg: '#fffbeb' },
    { value: 'assigned', label: 'ASSIGNED', color: '#8b5cf6', bg: '#f5f3ff' },
    { value: 'closed', label: 'RESOLVED', color: '#10b981', bg: '#ecfdf5' },
]

export default function IncidentManager() {
  const { profile } = useAuth()
  const { activeBranch } = useBranch()
  
  // Data
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  
  // UI State
  const [filterSource, setFilterSource] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [toolMode, setToolMode] = useState<'text' | 'contact' | 'task'>('text')

  // Thread State
  const [comments, setComments] = useState<Comment[]>([])
  const [inputValue, setInputValue] = useState('')
  // For specialized inputs
  const [inputData, setInputData] = useState<any>({}) 

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // --- Initial Load ---
  const loadIncidents = useCallback(async () => {
    let query = supabase.from('incidents').select('*').order('created_at', { ascending: false })
    if (activeBranch !== 'global') {
        query = query.eq('branch_location', activeBranch)
    }
    const { data } = await query
    setIncidents(data || [])
  }, [activeBranch])

  useEffect(() => { loadIncidents() }, [loadIncidents])

  // --- Realtime ---
  useEffect(() => {
    const channel = supabase.channel('playground-live')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'incidents' }, loadIncidents)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'incident_comments' }, payload => {
            if(payload.new.incident_id === selectedId) fetchComments(selectedId!)
        })
        .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [loadIncidents, selectedId])

  // --- Case Selection ---
  const activeIncident = incidents.find(i => i.id === selectedId)

  const fetchComments = async (id: string) => {
    const { data } = await supabase.from('incident_comments').select('*').eq('incident_id', id).order('created_at', { ascending: true })
    setComments((data || []).map(c => ({
        ...c,
        // Try to parse 'body' as JSON if it looks like it, or treat as text if fails? 
        // Actually, let's assume 'body' is text and we might add a 'data' column in future.
        // For now, I will store JSON string in body for special types, and try parse.
        data: tryParse(c.body) // Helper below
    })))
    setTimeout(scrollToBottom, 100)
  }

  const tryParse = (str: string) => {
      try { return JSON.parse(str) } catch { return null }
  }

  useEffect(() => {
    if(selectedId) fetchComments(selectedId)
  }, [selectedId])

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })

  // --- Actions ---
  const handleSend = async (e?: React.FormEvent) => {
      e?.preventDefault()
      if(!activeIncident || !profile) return

      let payloadBody = inputValue
      let payloadType = 'text'

      // Construct payload based on tool mode
      if (toolMode === 'contact') {
          payloadType = 'contact'
          if(!inputData.name || !inputData.phone) return toast.error('Name & Phone required')
          payloadBody = JSON.stringify({ name: inputData.name, phone: inputData.phone, role: inputData.role || 'Contact' })
      } 
      else if (toolMode === 'task') {
          payloadType = 'task'
          if(!inputData.task) return toast.error('Task description required')
          payloadBody = JSON.stringify({ task: inputData.task, assignee: inputData.assignee || 'Unassigned', completed: false })
      }
      else {
          if(!inputValue.trim()) return
      }

      const { error } = await supabase.from('incident_comments').insert({
          incident_id: activeIncident.id,
          author_id: profile.id,
          author_full_name: profile.full_name || 'Staff',
          body: payloadBody,
          // note: we are overloading 'body' column. In a real migration we'd add 'type' and 'data' columns.
          // For this specific 'playground' request without backend migration access, I'm embedding type in body JSON if needed
          // Wait, 'incident_comments' table structure is fixed unless I used migration tool.
          // I will assume text body. If it's special widget, I wrap it: 
          // PREFIX: "WIDGET:TYPE:JSON"
      })

      if (payloadType !== 'text') {
           // Since I can't easily change schema to add 'type' column, I'll use a prefix convention for this demo
           // Re-doing the insert logic slightly to accommodate existing schema constraints safely
           await supabase.from('incident_comments').insert({
              incident_id: activeIncident.id,
              author_id: profile.id,
              author_full_name: profile.full_name || 'Staff',
              body: `WIDGET:${payloadType}:${payloadBody}` 
           })
      } else {
           await supabase.from('incident_comments').insert({
              incident_id: activeIncident.id,
              author_id: profile.id,
              author_full_name: profile.full_name || 'Staff',
              body: inputValue
           })
      }

      setInputValue('')
      setInputData({})
      setToolMode('text')
  }

  const handleStatusUpdate = async (val: string) => {
      if(!activeIncident) return
      await supabase.from('incidents').update({ status: val }).eq('id', activeIncident.id)
      toast.success('Case Status Updated')
  }

  // --- Filtering ---
  const filtered = incidents.filter(i => {
      const matchSrc = filterSource === 'all' || i.category === filterSource
      const matchTxt = i.title.toLowerCase().includes(searchQuery.toLowerCase())
      return matchSrc && matchTxt
  })

  // --- Render Parsed Comment ---
  const renderComment = (c: Comment) => {
      let content = c.body
      let type = 'text'
      let data: any = null

      if(content.startsWith('WIDGET:')) {
          const parts = content.split(':', 3) // limit split
          if(parts.length >= 3) {
              type = parts[1]
              // recombine rest in case JSON had colons
              const jsonStr = content.substring(parts[0].length + parts[1].length + 2) 
              try { data = JSON.parse(jsonStr) } catch {}
          }
      }

      if (type === 'contact') {
          return (
              <div className="ip-widget-card ip-widget-contact">
                  <div className="ip-widget-header">
                      <span>CONTACT INFO LOGGED</span>
                      <Phone className="w-4 h-4" />
                  </div>
                  <div className="ip-contact-details">
                      <div className="text-lg font-bold text-green-800">{data?.name}</div>
                      <div className="ip-contact-row"><Phone className="w-3 h-3"/> {data?.phone}</div>
                      <div className="ip-contact-row"><User className="w-3 h-3"/> {data?.role}</div>
                  </div>
              </div>
          )
      }

      if (type === 'task') {
        return (
            <div className="ip-widget-card ip-widget-task">
                <div className="ip-widget-header">
                    <span>TASK ASSIGNED</span>
                    <CheckSquare className="w-4 h-4" />
                </div>
                <div className="ip-task-body">
                    <div className="ip-task-check" />
                    <div>
                        <div className="font-bold text-amber-900">{data?.task}</div>
                        <div className="text-xs text-amber-700 uppercase mt-1">Assignee: {data?.assignee}</div>
                    </div>
                </div>
            </div>
        )
      }

      if (c.author_full_name === 'SYSTEM') {
          return (
              <div className="flex justify-center my-4">
                  <span className="text-[10px] uppercase font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                      {content}
                  </span>
              </div>
          )
      }

      // Default text note
      return (
          <div className="ip-widget-card ip-widget-note">
               <div className="ip-widget-body">{content}</div>
          </div>
      )
  }

  return (
    <div className="ip-container">
       {/* New Header Style: Glass Card with Title */}
       <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30">
            <div className="bg-white/90 backdrop-blur-md px-8 py-3 rounded-full shadow-lg border border-white/50 flex items-center gap-4 cursor-default transition-transform hover:scale-105">
                 <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.6)]" />
                 <h1 className="text-xl font-[Righteous] text-slate-800 tracking-widest uppercase mb-0 leading-none">
                     Raise a Case
                 </h1>
            </div>
       </div>

       {/* LEFT MENU */}
       <div className="ip-sidebar">
           <div className="ip-glass-menu">
               {SOURCES.map(s => (
                   <button 
                      key={s.id}
                      className={`ip-menu-item ${filterSource === s.id ? 'active' : ''}`}
                      onClick={() => setFilterSource(s.id)}
                   >
                       <s.icon className="w-5 h-5" />
                       <span className="ip-menu-label">{s.label}</span>
                   </button>
               ))}
           </div>
           
           <button 
              className="mt-4 bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-xl py-4 font-bold shadow-xl shadow-slate-900/20 hover:scale-105 transition-transform flex items-center justify-center gap-3 border border-slate-700/50"
              onClick={() => setShowCreate(true)}
           >
              <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-white shadow-lg shadow-red-500/40">
                  <Plus className="w-4 h-4" />
              </div>
              <span className="tracking-wide text-sm font-[Righteous]">RAISE A CASE</span>
           </button>
       </div>

       {/* MIDDLE LIST */}
       <div className="ip-list-panel">
           <div className="ip-list-header">
               <input 
                  className="ip-search"
                  placeholder="Search case files..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
               />
           </div>
           
           <div className="ip-scroll-area custom-scrollbar">
               {filtered.map(inc => (
                  <div 
                      key={inc.id}
                      className={`ip-card-item ${selectedId === inc.id ? 'selected' : ''}`}
                      onClick={() => setSelectedId(inc.id)}
                      style={{ '--ip-status-color': STATUS_OPTIONS.find(s=>s.value===inc.status)?.color } as any}
                  >
                      <div className="flex justify-between mb-1">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                             {inc.category?.toUpperCase() || 'GENERAL'}
                          </span>
                          <span className="text-[10px] text-gray-400">{new Date(inc.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="font-bold text-slate-800 leading-tight mb-2">{inc.title}</div>
                      <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full`} style={{ background: STATUS_OPTIONS.find(s=>s.value===inc.status)?.color }}/>
                          <span className="text-xs font-medium text-slate-500">
                             {STATUS_OPTIONS.find(s=>s.value===inc.status)?.label}
                          </span>
                      </div>
                  </div>
               ))}
           </div>
       </div>

       {/* RIGHT PLAYGROUND */}
       <div className="ip-playground">
           {activeIncident ? (
               <>
                  <div className="ip-case-header">
                      <div>
                          <h2 className="ip-case-title">{activeIncident.title}</h2>
                          <div className="ip-case-meta">
                              <span className="ip-tag"><User className="w-3 h-3"/> {activeIncident.reporter || 'System'}</span>
                              <span className="ip-tag"><Hash className="w-3 h-3"/> {activeIncident.id.slice(0,6)}</span>
                              <span className={`ip-tag ${activeIncident.severity === 'critical' ? 'text-red-600 bg-red-50' : 'text-blue-600 bg-blue-50'}`}>
                                  {activeIncident.severity?.toUpperCase()} PRIORITY
                              </span>
                          </div>
                      </div>
                      
                      <select 
                          className="ip-status-select"
                          value={activeIncident.status}
                          onChange={(e) => handleStatusUpdate(e.target.value)}
                          style={{ 
                              background: STATUS_OPTIONS.find(s=>s.value===activeIncident.status)?.bg,
                              color: STATUS_OPTIONS.find(s=>s.value===activeIncident.status)?.color
                          }}
                      >
                          {STATUS_OPTIONS.map(o => (
                              <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                      </select>
                  </div>

                  <div className="ip-canvas custom-scrollbar">
                      {/* Original Issue Card */}
                      <div className="ip-widget-row">
                          <div className="ip-avatar bg-slate-800">OP</div>
                          <div className="ip-widget-card" style={{ borderLeft: '4px solid #334155' }}>
                              <div className="ip-widget-header">INITIAL REPORT</div>
                              <div className="p-4 text-sm leading-relaxed whitespace-pre-wrap">
                                  {activeIncident.description}
                              </div>
                          </div>
                      </div>

                      <div className="ip-widget-date-divider">
                         <span>CASE HISTORY</span>
                      </div>

                      {/* Stream */}
                      {comments.map(comment => {
                          const isMe = comment.author_id === profile?.id
                          return (
                              <div key={comment.id} className={`ip-widget-row ${isMe ? 'right' : ''}`}>
                                  {!isMe && (
                                      <div className="ip-avatar" title={comment.author_full_name}>
                                          {comment.author_full_name[0]}
                                      </div>
                                  )}
                                  
                                  {renderComment(comment)}

                                  {isMe && (
                                      <div className="ip-avatar" style={{ background: 'var(--ip-primary)' }}>
                                          ME
                                      </div>
                                  )}
                              </div>
                          )
                      })}
                      <div ref={messagesEndRef} />
                  </div>

                  {/* Creation Dock */}
                  {activeIncident.status !== 'closed' && (
                      <div className="ip-dock">
                          <div className="ip-dock-tools">
                              <button 
                                onClick={() => setToolMode('text')}
                                className={`ip-tool-btn ${toolMode==='text'?'active':''}`}
                              >
                                  <StickyNote className="w-4 h-4"/> Note
                              </button>
                              <button 
                                onClick={() => setToolMode('contact')}
                                className={`ip-tool-btn ${toolMode==='contact'?'active':''}`}
                              >
                                  <Phone className="w-4 h-4"/> Contact
                              </button>
                              <button 
                                onClick={() => setToolMode('task')}
                                className={`ip-tool-btn ${toolMode==='task'?'active':''}`}
                              >
                                  <CheckSquare className="w-4 h-4"/> Task
                              </button>
                          </div>

                          {toolMode === 'text' && (
                              <div className="ip-dock-input-wrapper">
                                  <input 
                                      className="ip-dock-input" 
                                      placeholder="Type your playground note..." 
                                      value={inputValue}
                                      onChange={e => setInputValue(e.target.value)}
                                      onKeyDown={e => e.key === 'Enter' && handleSend()}
                                  />
                                  <button onClick={() => handleSend()} className="ip-send-btn"><Send className="w-5 h-5"/></button>
                              </div>
                          )}

                          {toolMode === 'contact' && (
                              <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                                   <input placeholder="Name (e.g. Repair Shop)" className="p-2 border rounded" onChange={e => setInputData({...inputData, name: e.target.value})}/>
                                   <input placeholder="Phone / Details" className="p-2 border rounded" onChange={e => setInputData({...inputData, phone: e.target.value})}/>
                                   <button onClick={() => handleSend()} className="bg-green-600 text-white rounded font-bold">Add Contact Card</button>
                              </div>
                          )}

                          {toolMode === 'task' && (
                              <div className="grid grid-cols-3 gap-3 bg-amber-50 p-4 rounded-xl border border-amber-200">
                                   <input placeholder="Task Description" className="col-span-2 p-2 border rounded" onChange={e => setInputData({...inputData, task: e.target.value})}/>
                                   <div className="flex gap-2">
                                       <input placeholder="Assignee Name" className="flex-1 p-2 border rounded" onChange={e => setInputData({...inputData, assignee: e.target.value})}/>
                                       <button onClick={() => handleSend()} className="bg-amber-600 text-white rounded px-4 font-bold">Assign</button>
                                   </div>
                              </div>
                          )}
                      </div>
                  )}
               </>
           ) : (
                <div className="ip-empty-canvas">
                    <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                        <Activity className="w-10 h-10 text-slate-300" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-300">SELECT A CASE FILE</h2>
                </div>
           )}
       </div>

       {/* CREATE MODAL */}
       <AnimatePresence>
           {showCreate && <CreateCaseModal onClose={() => setShowCreate(false)} onSuccess={() => {
               setShowCreate(false)
               loadIncidents()
           }} />}
       </AnimatePresence>
    </div>
  )
}

function CreateCaseModal({ onClose, onSuccess }: any) {
    const { profile } = useAuth()
    const { activeBranch } = useBranch()
    const [form, setForm] = useState({ title: '', description: '', category: 'staff', severity: 'minor' })
    const [saving, setSaving] = useState(false)

    const save = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        try {
            // FIXED: Removed 'source' column usage, mapping strictly to 'category'
            const { error } = await supabase.from('incidents').insert({
                title: form.title,
                description: form.description,
                category: form.category,
                severity: form.severity,
                status: 'open',
                user_id: profile?.id,
                reporter: profile?.full_name || 'Admin',
                branch_location: activeBranch === 'global' ? 'calicut' : activeBranch,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            if(error) throw error
            toast.success('Case Opened')
            onSuccess()
        } catch (err) {
            console.error(err)
            toast.error('Failed to create case')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
                <div className="bg-slate-900 text-white p-6 relative overflow-hidden">
                    <div className="relative z-10">
                        <h2 className="text-xl font-bold font-[Righteous] tracking-wider">NEW INCIDENT CASE</h2>
                        <p className="text-slate-400 text-xs mt-1">Fill details to initialize playground tracking</p>
                    </div>
                    <Activity className="absolute -right-6 -top-6 w-32 h-32 text-slate-800 opacity-50" />
                </div>
                
                <form onSubmit={save} className="p-6 flex flex-col gap-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Subject</label>
                        <input required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-700 focus:outline-blue-500" 
                            value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                             <label className="text-xs font-bold text-slate-500 uppercase">Category</label>
                             <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg"
                                value={form.category} onChange={e => setForm({...form, category: e.target.value})}
                             >
                                 <option value="staff">Staff / Roster</option>
                                 <option value="candidate">Candidate</option>
                                 <option value="exam">Exam / Calendar</option>
                                 <option value="system">System / IT</option>
                                 <option value="facility">Facility</option>
                             </select>
                        </div>
                        <div>
                             <label className="text-xs font-bold text-slate-500 uppercase">Severity</label>
                             <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg"
                                value={form.severity} onChange={e => setForm({...form, severity: e.target.value})}
                             >
                                 <option value="minor">Routine (Minor)</option>
                                 <option value="major">Significant (Major)</option>
                                 <option value="critical">Critical (Urgent)</option>
                             </select>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Description</label>
                        <textarea required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg min-h-[100px]" 
                            value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                        />
                    </div>

                    <div className="flex gap-3 mt-2">
                        <button type="button" onClick={onClose} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-lg">CANCEL</button>
                        <button disabled={saving} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-lg shadow-lg hover:shadow-blue-500/30 transition-shadow">
                            {saving ? 'OPENING...' : 'OPEN CASE'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    )
}
