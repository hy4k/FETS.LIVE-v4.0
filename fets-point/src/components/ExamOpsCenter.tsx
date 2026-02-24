import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Calendar, Users, Clock, CheckCircle, AlertTriangle, 
  ChevronLeft, ChevronRight, Plus, Upload, Search, 
  FileText, X, Cpu, LayoutDashboard, UserCheck, 
  ShieldCheck, AlertCircle, Info, Download, Filter,
  Briefcase, MapPin, ArrowUpRight, Activity, Zap
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useBranch } from '../hooks/useBranch'
import { useAuth } from '../hooks/useAuth'
import { toast } from 'react-hot-toast'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as XLSX from 'xlsx'

// ─── PREMIUM UI CONSTANTS ───
const TODAY = () => new Date().toLocaleDateString('sv-SE')

const SHIFTS: Record<string, { l: string; c: string }> = {
  D: { l: 'Day', c: '#F59E0B' }, M: { l: 'Morning', c: '#3B82F6' },
  E: { l: 'Evening', c: '#8B5CF6' }, N: { l: 'Night', c: '#1E293B' },
  O: { l: 'Off', c: '#94A3B8' }, L: { l: 'Leave', c: '#EF4444' },
}

const CLIENT_COLORS: Record<string, { bg: string; text: string; border: string; accent: string; glow: string }> = {
  PROMETRIC:    { bg: '#EFF6FF', text: '#1D4ED8', border: '#93C5FD', accent: '#3B82F6', glow: 'shadow-blue-200/50' },
  'PEARSON VUE':{ bg: '#ECFDF5', text: '#047857', border: '#6EE7B7', accent: '#10B981', glow: 'shadow-emerald-200/50' },
  PSI:          { bg: '#FFFBEB', text: '#B45309', border: '#FCD34D', accent: '#F59E0B', glow: 'shadow-amber-200/50' },
  ETS:          { bg: '#F5F3FF', text: '#6D28D9', border: '#C4B5FD', accent: '#8B5CF6', glow: 'shadow-violet-200/50' },
  ITTS:         { bg: '#EEF2FF', text: '#4338CA', border: '#A5B4FC', accent: '#6366F1', glow: 'shadow-indigo-200/50' },
  IELTS:        { bg: '#FEF2F2', text: '#B91C1C', border: '#FCA5A5', accent: '#EF4444', glow: 'shadow-red-200/50' },
  ACCA:         { bg: '#F0FDFA', text: '#0F766E', border: '#5EEAD4', accent: '#14B8A6', glow: 'shadow-teal-200/50' },
}
const getClientStyle = (name?: string) => CLIENT_COLORS[name?.toUpperCase() || ''] || { bg: '#F8FAFC', text: '#475569', border: '#CBD5E1', accent: '#94A3B8', glow: 'shadow-slate-200/50' }

const formatDisplayDate = (dateStr: string) => {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
  })
}

// ─── DAILY OPS VIEW ───

function DailyOpsView({ 
  date, setDate, branch, onSelectCandidate, selCandidate
}: { 
  date: string; setDate: (d: string) => void; branch: string;
  onSelectCandidate: (c: any) => void; selCandidate: any;
}) {
  const [search, setSearch] = useState('')
  const [filterClient, setFilterClient] = useState('')
  const queryClient = useQueryClient()

  const { data: sessions = [] } = useQuery({
    queryKey: ['ops-sessions', branch, date],
    queryFn: async () => {
      const { data } = await supabase.from('calendar_sessions').select('*').eq('date', date).eq('branch_location', branch).order('start_time')
      return data || []
    }
  })

  const { data: candidates = [] } = useQuery({
    queryKey: ['ops-candidates', branch, date],
    queryFn: async () => {
      const { data } = await supabase.from('candidates').select('*').gte('exam_date', `${date}T00:00:00`).lt('exam_date', `${date}T23:59:59`).eq('branch_location', branch).order('full_name')
      return data || []
    }
  })

  const { data: roster = [] } = useQuery({
    queryKey: ['ops-roster', branch, date],
    queryFn: async () => {
      const { data } = await supabase.from('roster_schedules').select('*, staff_profiles(full_name, role)').eq('date', date).eq('branch_location', branch)
      return data || []
    }
  })

  const checkInMutation = useMutation({
    mutationFn: async ({ id, checked }: { id: string, checked: boolean }) => {
      await supabase.from('candidates').update({ check_in_time: checked ? new Date().toISOString() : null, status: checked ? 'checked_in' : 'registered' }).eq('id', id)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ops-candidates'] })
  })

  const filtered = candidates.filter((c: any) => {
    const mSearch = !search || c.full_name?.toLowerCase().includes(search.toLowerCase()) || c.confirmation_number?.toLowerCase().includes(search.toLowerCase())
    const mClient = !filterClient || c.client_name === filterClient
    return mSearch && mClient
  })

  const checkedIn = candidates.filter((c: any) => c.check_in_time).length
  const onDuty = roster.filter((r: any) => !['O', 'L'].includes(r.shift_code))

  const updateNotes = async (id: string, notes: string) => {
    await supabase.from('candidates').update({ notes: notes }).eq('id', id)
    queryClient.invalidateQueries({ queryKey: ['ops-candidates'] })
  }

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result
        const wb = XLSX.read(bstr, { type: 'binary' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const data = XLSX.utils.sheet_to_json(ws) as any[]
        
        const uploads = data.map(row => {
          const fullName = `${row['Candidate First Name']} ${row['Candidate Last Name']}`.replace(' NO LAST NAME', '').trim()
          return {
            full_name: fullName,
            phone: String(row['PHONE NUMBER'] || ''),
            client_name: row['CLIENT NAME'],
            exam_name: row['EXAM NAME'],
            exam_date: `${date}T09:00:00`, 
            address: row['PLACE'],
            branch_location: branch,
            status: 'registered'
          }
        })

        if (uploads.length === 0) return toast.error('No valid data found in Excel')

        for (const up of uploads) {
          const { data: existingSess } = await supabase
            .from('calendar_sessions').select('id, candidate_count')
            .eq('date', date).eq('client_name', up.client_name)
            .eq('exam_name', up.exam_name).eq('branch_location', branch).single()

          if (existingSess) {
            await supabase.from('calendar_sessions').update({ 
              candidate_count: (existingSess.candidate_count || 0) + 1 
            }).eq('id', existingSess.id)
          } else {
            await supabase.from('calendar_sessions').insert({
              date, client_name: up.client_name, exam_name: up.exam_name,
              candidate_count: 1, branch_location: branch,
              start_time: '09:00:00', end_time: '17:00:00'
            })
          }

          const { data: existingCand } = await supabase
            .from('candidates').select('id')
            .eq('full_name', up.full_name).eq('exam_date', up.exam_date)
            .eq('branch_location', branch).single()
          
          if (existingCand) {
            await supabase.from('candidates').update(up).eq('id', existingCand.id)
          } else {
            await supabase.from('candidates').insert(up)
          }
        }

        toast.success(`Successfully processed ${uploads.length} candidates`)
        queryClient.invalidateQueries({ queryKey: ['ops-candidates'] })
        queryClient.invalidateQueries({ queryKey: ['ops-sessions'] })
      } catch (err: any) {
        console.error(err)
        toast.error('Excel processing failed: ' + err.message)
      }
    }
    reader.readAsBinaryString(file)
  }

  return (
    <div className="flex flex-col h-full gap-6">
      
      {/* ── Top Bar: Date Navigation + Stats + Upload ── */}
      <div className="flex items-center justify-between gap-6">
        
        {/* Date Navigation */}
        <div className="flex items-center gap-3">
          <button onClick={() => { const d = new Date(date + 'T00:00:00'); d.setDate(d.getDate()-1); setDate(d.toLocaleDateString('sv-SE')) }} 
            className="w-12 h-12 rounded-2xl bg-white shadow-[4px_4px_10px_rgb(209,217,230),-4px_-4px_10px_rgba(255,255,255,0.9)] flex items-center justify-center text-slate-500 hover:text-slate-800 active:shadow-[inset_3px_3px_6px_rgb(209,217,230),inset_-3px_-3px_6px_rgba(255,255,255,0.9)] transition-all border border-white/60">
            <ChevronLeft size={20} />
          </button>
          <div className="text-center px-5">
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-transparent text-xl font-black text-slate-800 outline-none cursor-pointer tracking-tight" />
            <div className="text-[10px] font-bold text-amber-600 uppercase tracking-[0.2em] mt-1">{date === TODAY() ? '● Today' : new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long' })}</div>
          </div>
          <button onClick={() => { const d = new Date(date + 'T00:00:00'); d.setDate(d.getDate()+1); setDate(d.toLocaleDateString('sv-SE')) }} 
            className="w-12 h-12 rounded-2xl bg-white shadow-[4px_4px_10px_rgb(209,217,230),-4px_-4px_10px_rgba(255,255,255,0.9)] flex items-center justify-center text-slate-500 hover:text-slate-800 active:shadow-[inset_3px_3px_6px_rgb(209,217,230),inset_-3px_-3px_6px_rgba(255,255,255,0.9)] transition-all border border-white/60">
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Live Stats */}
        <div className="flex items-center gap-4">
          {[
            { label: 'Sessions', value: sessions.length, color: 'text-blue-600', bg: 'bg-blue-50', icon: Calendar },
            { label: 'Checked In', value: `${checkedIn}/${candidates.length}`, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle },
            { label: 'On Duty', value: onDuty.length, color: 'text-amber-600', bg: 'bg-amber-50', icon: Users },
          ].map(stat => (
            <div key={stat.label} className="flex items-center gap-3 bg-white rounded-2xl px-5 py-3 shadow-[4px_4px_10px_rgb(209,217,230),-4px_-4px_10px_rgba(255,255,255,0.9)] border border-white/60">
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center ${stat.color}`}>
                <stat.icon size={18} />
              </div>
              <div>
                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</div>
                <div className={`text-lg font-black ${stat.color} leading-none mt-0.5`}>{stat.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Client Sessions Strip ── */}
      {sessions.length > 0 && (
        <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-1">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] shrink-0 ml-1">Active Sessions</span>
          <div className="h-6 w-px bg-slate-200 shrink-0" />
          {sessions.map((s: any) => {
            const style = getClientStyle(s.client_name)
            return (
              <motion.div 
                key={s.id}
                whileHover={{ y: -2, scale: 1.02 }}
                className={`flex items-center gap-4 px-6 py-4 rounded-2xl border-2 shrink-0 cursor-pointer shadow-lg ${style.glow} transition-all`}
                style={{ backgroundColor: style.bg, borderColor: style.border }}
              >
                <div className="w-3 h-10 rounded-full" style={{ backgroundColor: style.accent }} />
                <div>
                  <div className="text-sm font-black uppercase tracking-tight" style={{ color: style.text }}>{s.client_name || 'Unknown'}</div>
                  <div className="text-[10px] font-bold text-slate-400 mt-0.5">{(s.exam_name || '').substring(0, 35)}</div>
                </div>
                <div className="flex flex-col items-center ml-2">
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Time</span>
                  <span className="text-xs font-black" style={{ color: style.text }}>{s.start_time?.slice(0,5)}</span>
                </div>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black text-white shadow-md" style={{ backgroundColor: style.accent }}>
                  {s.candidate_count || 0}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* ── Staff Strip ── */}
      {onDuty.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mr-2 ml-1 shrink-0">Personnel</span>
          <div className="h-4 w-px bg-slate-200 shrink-0" />
          {onDuty.map((r: any) => (
            <div key={r.id} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/60 border border-slate-100 shrink-0">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: SHIFTS[r.shift_code]?.c }} />
              <span className="text-xs font-bold text-slate-600">{r.staff_profiles?.full_name || 'Staff'}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Main Split (Candidate List + Details) ── */}
      <div className="flex-1 flex gap-8 min-h-0">
        
        {/* Left Panel: Candidate List */}
        <div className="w-[42%] flex flex-col min-h-0 gap-4">
          <div className="flex gap-3">
            <div className="flex-1 flex items-center px-5 py-3.5 bg-white rounded-2xl shadow-[inset_3px_3px_6px_rgb(209,217,230),inset_-3px_-3px_6px_rgba(255,255,255,0.9)] border border-white/40">
              <Search size={16} className="text-slate-400 mr-3" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search candidates..." className="bg-transparent border-none outline-none text-sm font-bold text-slate-800 w-full placeholder:text-slate-300" />
            </div>
            <select value={filterClient} onChange={e => setFilterClient(e.target.value)} className="px-4 py-2 bg-white rounded-2xl text-xs font-bold uppercase text-slate-600 shadow-[4px_4px_10px_rgb(209,217,230),-4px_-4px_10px_rgba(255,255,255,0.9)] border border-white/60 outline-none cursor-pointer">
              <option value="">All Clients</option>
              {Object.keys(CLIENT_COLORS).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar space-y-2 pr-1">
            {filtered.map((c: any) => {
              const cStyle = getClientStyle(c.client_name)
              return (
                <div 
                  key={c.id} 
                  onClick={() => onSelectCandidate(c)}
                  className={`p-4 rounded-2xl transition-all cursor-pointer border-2 flex items-center gap-4 ${selCandidate?.id === c.id ? 'border-amber-400 bg-amber-50/50 shadow-lg shadow-amber-100/50' : 'bg-white/60 border-transparent hover:bg-white hover:shadow-md'}`}
                >
                  <button 
                    onClick={(e) => { e.stopPropagation(); checkInMutation.mutate({ id: c.id, checked: !c.check_in_time }) }}
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all shrink-0 ${c.check_in_time ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                  >
                    <CheckCircle size={18} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-black text-slate-800 truncate">{c.full_name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md" style={{ backgroundColor: cStyle.bg, color: cStyle.text }}>{c.client_name || 'N/A'}</span>
                      <span className="text-[10px] font-bold text-slate-400">{c.address || '—'}</span>
                    </div>
                  </div>
                  {c.check_in_time && <span className="text-[9px] font-black text-emerald-600 bg-emerald-100 px-2 py-1 rounded-lg shrink-0">CHECKED IN</span>}
                </div>
              )
            })}
            {filtered.length === 0 && <div className="text-center py-20 text-slate-400 text-sm font-bold italic uppercase tracking-widest">No matching records found.</div>}
          </div>
        </div>

        {/* Right Panel: Details */}
        <div className="flex-1 min-h-0">
          <AnimatePresence mode="wait">
            {!selCandidate ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center justify-center p-10 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-white/20">
                <div className="w-20 h-20 bg-white rounded-3xl shadow-[6px_6px_12px_rgb(209,217,230),-6px_-6px_12px_rgba(255,255,255,0.9)] flex items-center justify-center text-slate-300 mb-6">
                  <Users size={36} />
                </div>
                <h3 className="text-xl font-black text-slate-500 uppercase tracking-tight">Select Candidate</h3>
                <p className="text-xs font-medium text-slate-400 mt-2 max-w-xs">Choose a candidate from the left panel to view their complete profile and perform check-in operations.</p>
              </motion.div>
            ) : (
              <motion.div key={selCandidate.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="h-full overflow-y-auto no-scrollbar bg-white rounded-3xl shadow-[8px_8px_20px_rgb(209,217,230),-8px_-8px_20px_rgba(255,255,255,0.9)] border border-white/60 p-10 flex flex-col">
                {/* Candidate Header */}
                <div className="flex items-center gap-6 mb-10 pb-8 border-b border-slate-100">
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-amber-200/40">{(selCandidate.full_name || '?').charAt(0)}</div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase leading-none">{selCandidate.full_name}</h2>
                    <div className="flex items-center gap-3 mt-3">
                      {(() => { const s = getClientStyle(selCandidate.client_name); return (
                        <div className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border" style={{ backgroundColor: s.bg, color: s.text, borderColor: s.border }}>{selCandidate.client_name || 'N/A'}</div>
                      )})()}
                      <div className="px-3 py-1.5 bg-amber-50 rounded-xl text-[10px] font-black text-amber-700 uppercase tracking-wider border border-amber-200">ID: {selCandidate.confirmation_number || 'UNKNOWN'}</div>
                    </div>
                  </div>
                  <button 
                    onClick={async () => {
                      if (!selCandidate.check_in_time && selCandidate.notes && selCandidate.full_name !== selCandidate.notes) {
                        const cprText = `Candidate name appeared in the roster as "${selCandidate.full_name}" but in the primary ID it shown as "${selCandidate.notes}"`
                        await supabase.from('incidents').insert({
                          title: `Identity Disparity: ${selCandidate.full_name}`,
                          description: cprText, category: 'cpr', status: 'open',
                          user_id: (await supabase.auth.getUser()).data.user?.id,
                          branch_location: branch
                        })
                        toast.success('CPR auto-generated due to name disparity')
                      }
                      checkInMutation.mutate({ id: selCandidate.id, checked: !selCandidate.check_in_time })
                    }} 
                    className={`px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-[0.15em] transition-all active:scale-95 shrink-0 ${selCandidate.check_in_time 
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' 
                      : 'bg-white text-slate-700 shadow-[4px_4px_10px_rgb(209,217,230),-4px_-4px_10px_rgba(255,255,255,0.9)] hover:bg-amber-50 border border-white/60'}`}
                  >
                    {selCandidate.check_in_time ? '✓ Checked In' : 'Verify & Process'}
                  </button>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-8 flex-1">
                  <div className="space-y-8">
                    <section>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Exam Details</label>
                      <div className="space-y-5 bg-slate-50/50 rounded-2xl p-5 border border-slate-100">
                        <div className="flex flex-col"><span className="text-[9px] text-slate-400 font-bold uppercase mb-1">Session Module</span><span className="text-sm font-black text-slate-800">{selCandidate.exam_name || '—'}</span></div>
                        <div className="flex flex-col"><span className="text-[9px] text-slate-400 font-bold uppercase mb-1">Timeline</span><span className="text-sm font-black text-slate-800">{formatDisplayDate(date)}</span></div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex flex-col"><span className="text-[9px] text-slate-400 font-bold uppercase mb-1">Place</span><span className="text-sm font-bold text-slate-800">{selCandidate.address || '—'}</span></div>
                          <div className="flex flex-col"><span className="text-[9px] text-slate-400 font-bold uppercase mb-1">Phone</span><span className="text-sm font-bold text-slate-800">{selCandidate.phone || '—'}</span></div>
                        </div>
                      </div>
                    </section>
                    <section>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Name as per ID</label>
                      <textarea 
                        defaultValue={selCandidate.notes || ''} 
                        onBlur={e => updateNotes(selCandidate.id, e.target.value)}
                        placeholder="Enter name exactly as it appears on the ID..."
                        className="w-full p-5 h-20 text-sm font-medium text-slate-800 bg-white rounded-2xl outline-none resize-none shadow-[inset_3px_3px_6px_rgb(209,217,230),inset_-3px_-3px_6px_rgba(255,255,255,0.9)] border border-white/40 placeholder:text-slate-300"
                      />
                    </section>
                  </div>
                  <div className="space-y-8">
                    <section>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Identity Check</label>
                      <p className="text-xs font-medium text-slate-500 leading-relaxed mb-4">Validate physical ID against digital record. Ensure 1:1 name parity before processing.</p>
                      <div className="p-5 bg-slate-50/50 rounded-2xl border border-slate-100">
                        <div className="text-[9px] font-black text-slate-400 uppercase mb-2">Registered Name</div>
                        <div className="text-lg font-black text-slate-800">{selCandidate.full_name}</div>
                      </div>
                    </section>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

// ─── ROSTER VIEW ───

function RosterView({ date, setDate, branch }: { date: string; setDate: (d: string) => void; branch: string }) {
  const { data: staffProfiles = [] } = useQuery({ queryKey: ['staff-profiles'], queryFn: async () => { const { data } = await supabase.from('staff_profiles').select('*').eq('status', 'active').order('full_name'); return data || [] } })
  const { data: schedules = [], refetch } = useQuery({
    queryKey: ['roster-data', branch, date],
    queryFn: async () => {
      const d = new Date(date + 'T00:00:00')
      const start = new Date(d); start.setDate(d.getDate() - d.getDay() + 1)
      const end = new Date(start); end.setDate(end.getDate() + 6)
      const { data } = await supabase.from('roster_schedules').select('*').gte('date', start.toLocaleDateString('sv-SE')).lte('date', end.toLocaleDateString('sv-SE')).eq('branch_location', branch)
      return data || []
    }
  })

  const scheduleMap = schedules.reduce((acc: any, curr: any) => { acc[`${curr.profile_id}_${curr.date}`] = curr; return acc }, {} as any)
  const weekDates = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(date + 'T00:00:00')
    const start = new Date(d); start.setDate(d.getDate() - d.getDay() + 1)
    const current = new Date(start); current.setDate(start.getDate() + i)
    return current.toLocaleDateString('sv-SE')
  })

  const cycleShift = async (sId: string, dStr: string, current: any) => {
    const codes = Object.keys(SHIFTS)
    const nextCode = codes[(codes.indexOf(current?.shift_code || '') + 1) % codes.length]
    if (current) { await supabase.from('roster_schedules').update({ shift_code: nextCode }).eq('id', current.id) }
    else { await supabase.from('roster_schedules').insert({ profile_id: sId, date: dStr, shift_code: nextCode, branch_location: branch, status: 'confirmed' }) }
    refetch()
  }

  const changeWeek = (off: number) => { const d = new Date(date + 'T00:00:00'); d.setDate(d.getDate() + off * 7); setDate(d.toLocaleDateString('sv-SE')) }

  return (
    <div className="space-y-8 h-full overflow-y-auto no-scrollbar">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => changeWeek(-1)} className="w-12 h-12 rounded-2xl bg-white shadow-[4px_4px_10px_rgb(209,217,230),-4px_-4px_10px_rgba(255,255,255,0.9)] flex items-center justify-center text-slate-500 hover:text-slate-800 active:shadow-[inset_3px_3px_6px_rgb(209,217,230),inset_-3px_-3px_6px_rgba(255,255,255,0.9)] transition-all border border-white/60"><ChevronLeft size={20} /></button>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Personnel Roster</h2>
          <button onClick={() => changeWeek(1)} className="w-12 h-12 rounded-2xl bg-white shadow-[4px_4px_10px_rgb(209,217,230),-4px_-4px_10px_rgba(255,255,255,0.9)] flex items-center justify-center text-slate-500 hover:text-slate-800 active:shadow-[inset_3px_3px_6px_rgb(209,217,230),inset_-3px_-3px_6px_rgba(255,255,255,0.9)] transition-all border border-white/60"><ChevronRight size={20} /></button>
        </div>
        <div className="flex gap-4">
           {Object.entries(SHIFTS).map(([code, s]) => (
             <div key={code} className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400">
               <div className="w-3 h-3 rounded" style={{ backgroundColor: s.c }} />
               <span>{code}={s.l}</span>
             </div>
           ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-[8px_8px_20px_rgb(209,217,230),-8px_-8px_20px_rgba(255,255,255,0.9)] border border-white/60 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Staff Member</th>
              {weekDates.map(d => (
                <th key={d} className="p-4 text-center">
                  <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">{new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short' })}</div>
                  <div className={`text-xl font-black ${d === TODAY() ? 'text-amber-500' : 'text-slate-800'}`}>{d.split('-')[2]}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {staffProfiles.map((s: any) => (
              <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                <td className="p-6">
                  <div className="text-sm font-black text-slate-800 uppercase">{s.full_name}</div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1">{s.role?.replace('_',' ')}</div>
                </td>
                {weekDates.map(d => {
                  const sched = scheduleMap[`${s.id}_${d}`]
                  return (
                    <td key={d} className="p-2 text-center">
                      <button 
                        onClick={() => cycleShift(s.id, d, sched)}
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-xs font-black shadow-md transition-transform hover:scale-110 active:scale-95"
                        style={{ backgroundColor: SHIFTS[sched?.shift_code]?.c || '#E2E8F0' }}
                      >
                        {sched?.shift_code || '—'}
                      </button>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── CPR VIEW ───

function CPRView({ branch }: { branch: string }) {
  const { data: cprs = [], refetch } = useQuery({
    queryKey: ['cpr-data', branch],
    queryFn: async () => {
      const { data } = await supabase.from('incidents').select('*').eq('category', 'cpr').eq('branch_location', branch).order('created_at', { ascending: false })
      return data || []
    }
  })

  const [showManual, setShowManual] = useState(false)
  const [newCpr, setNewCpr] = useState({ title: '', description: '' })

  const createCpr = async () => {
    if (!newCpr.title || !newCpr.description) return toast.error('Both fields are required')
    await supabase.from('incidents').insert({
      ...newCpr, category: 'cpr', status: 'open', branch_location: branch,
      user_id: (await supabase.auth.getSingleSession()).data.session?.user?.id
    })
    toast.success('CPR entry created')
    setShowManual(false)
    setNewCpr({ title: '', description: '' })
    refetch()
  }

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Candidate Profile Reports</h2>
        <button onClick={() => setShowManual(true)} className="flex items-center gap-2 px-6 py-3.5 bg-white rounded-2xl text-xs font-black uppercase tracking-wider text-slate-700 shadow-[4px_4px_10px_rgb(209,217,230),-4px_-4px_10px_rgba(255,255,255,0.9)] hover:bg-amber-50 hover:text-amber-700 active:shadow-[inset_3px_3px_6px_rgb(209,217,230),inset_-3px_-3px_6px_rgba(255,255,255,0.9)] transition-all border border-white/60">
          <Plus size={16} /> Create CPR
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pr-1">
        {cprs.map((c: any) => (
          <div key={c.id} className="bg-white rounded-2xl p-6 flex flex-col gap-3 relative overflow-hidden shadow-[4px_4px_10px_rgb(209,217,230),-4px_-4px_10px_rgba(255,255,255,0.9)] border border-white/60">
            <div className="bg-amber-500 absolute top-0 left-0 w-1.5 h-full rounded-r" />
            <div className="flex items-center justify-between ml-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(c.created_at).toLocaleDateString()}</span>
              <span className="px-3 py-1 bg-amber-50 text-amber-600 text-[9px] font-black rounded-lg uppercase border border-amber-200">Active</span>
            </div>
            <h3 className="text-base font-black text-slate-800 uppercase tracking-tight ml-3">{c.title}</h3>
            <p className="text-sm font-medium text-slate-500 leading-relaxed ml-3">"{c.description}"</p>
          </div>
        ))}
        {cprs.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center opacity-40 py-20 text-slate-400 font-bold uppercase tracking-widest text-sm">
            No CPR entries recorded on this branch.
          </div>
        )}
      </div>

      <AnimatePresence>
        {showManual && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="w-full max-w-lg p-10 bg-white rounded-3xl shadow-2xl relative border border-slate-100">
              <button onClick={() => setShowManual(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-50 transition-colors"><X size={22} /></button>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase mb-8">Manual CPR Entry</h2>
              <div className="space-y-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Subject Title</label>
                  <input value={newCpr.title} onChange={e => setNewCpr({ ...newCpr, title: e.target.value })} className="p-4 text-sm font-bold bg-white outline-none rounded-2xl shadow-[inset_3px_3px_6px_rgb(209,217,230),inset_-3px_-3px_6px_rgba(255,255,255,0.9)] border border-white/40 placeholder:text-slate-300" placeholder="e.g. Identity Disparity - John Doe" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Report Narrative</label>
                  <textarea value={newCpr.description} onChange={e => setNewCpr({ ...newCpr, description: e.target.value })} className="p-4 text-sm font-medium bg-white outline-none h-40 resize-none rounded-2xl shadow-[inset_3px_3px_6px_rgb(209,217,230),inset_-3px_-3px_6px_rgba(255,255,255,0.9)] border border-white/40 placeholder:text-slate-300" placeholder="Provide detailed context..." />
                </div>
                <button onClick={createCpr} className="w-full py-4 bg-gradient-to-r from-amber-400 to-amber-600 text-white font-black uppercase tracking-[0.2em] rounded-2xl shadow-lg shadow-amber-200/50 hover:shadow-xl hover:shadow-amber-200/60 active:scale-[0.98] transition-all text-sm">Record CPR Entry</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── UPLOAD ROSTER VIEW ───

function UploadRosterView({ date, setDate, branch }: { date: string; setDate: (d: string) => void; branch: string }) {
  const queryClient = useQueryClient()
  const [isUploading, setIsUploading] = useState(false)
  const [lastUpload, setLastUpload] = useState<{ count: number; time: string } | null>(null)

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    const reader = new FileReader()
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result
        const wb = XLSX.read(bstr, { type: 'binary' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const data = XLSX.utils.sheet_to_json(ws) as any[]
        
        const uploads = data.map(row => {
          const fullName = `${row['Candidate First Name']} ${row['Candidate Last Name']}`.replace(' NO LAST NAME', '').trim()
          return {
            full_name: fullName,
            phone: String(row['PHONE NUMBER'] || ''),
            client_name: row['CLIENT NAME'],
            exam_name: row['EXAM NAME'],
            exam_date: `${date}T09:00:00`, 
            address: row['PLACE'],
            branch_location: branch,
            status: 'registered'
          }
        })

        if (uploads.length === 0) { setIsUploading(false); return toast.error('No valid data found in Excel') }

        for (const up of uploads) {
          const { data: existingSess } = await supabase
            .from('calendar_sessions').select('id, candidate_count')
            .eq('date', date).eq('client_name', up.client_name)
            .eq('exam_name', up.exam_name).eq('branch_location', branch).single()

          if (existingSess) {
            await supabase.from('calendar_sessions').update({ candidate_count: (existingSess.candidate_count || 0) + 1 }).eq('id', existingSess.id)
          } else {
            await supabase.from('calendar_sessions').insert({ date, client_name: up.client_name, exam_name: up.exam_name, candidate_count: 1, branch_location: branch, start_time: '09:00:00', end_time: '17:00:00' })
          }

          const { data: existingCand } = await supabase
            .from('candidates').select('id')
            .eq('full_name', up.full_name).eq('exam_date', up.exam_date)
            .eq('branch_location', branch).single()
          
          if (existingCand) { await supabase.from('candidates').update(up).eq('id', existingCand.id) }
          else { await supabase.from('candidates').insert(up) }
        }

        toast.success(`Successfully processed ${uploads.length} candidates`)
        setLastUpload({ count: uploads.length, time: new Date().toLocaleTimeString() })
        queryClient.invalidateQueries({ queryKey: ['ops-candidates'] })
        queryClient.invalidateQueries({ queryKey: ['ops-sessions'] })
      } catch (err: any) {
        console.error(err)
        toast.error('Excel processing failed: ' + err.message)
      } finally {
        setIsUploading(false)
      }
    }
    reader.readAsBinaryString(file)
  }

  return (
    <div className="h-full flex flex-col items-center justify-center gap-8 max-w-2xl mx-auto">
      
      {/* Hero Upload Area */}
      <div className="text-center mb-4">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white shadow-2xl shadow-blue-300/40 mb-6">
          <Upload size={36} />
        </div>
        <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Upload Daily Roster</h2>
        <p className="text-sm font-medium text-slate-400 mt-2 max-w-md mx-auto">Import your daily candidate roster from an Excel spreadsheet. This will create sessions, register candidates, and prepare the operations dashboard.</p>
      </div>

      {/* Date Selection */}
      <div className="flex items-center gap-4 bg-white rounded-2xl px-6 py-4 shadow-[6px_6px_14px_rgb(209,217,230),-6px_-6px_14px_rgba(255,255,255,0.9)] border border-white/60">
        <Calendar size={18} className="text-blue-500" />
        <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Target Date:</span>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-transparent text-lg font-black text-slate-800 outline-none cursor-pointer" />
      </div>

      {/* Upload Zone */}
      <label className="w-full cursor-pointer group">
        <input type="file" className="hidden" accept=".xlsx,.xls" onChange={handleExcelUpload} />
        <motion.div 
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className={`w-full py-16 rounded-3xl border-3 border-dashed transition-all flex flex-col items-center gap-4 ${isUploading 
            ? 'border-blue-400 bg-blue-50/50' 
            : 'border-slate-300 bg-white/40 hover:border-blue-400 hover:bg-blue-50/30 group-hover:shadow-lg'}`}
        >
          {isUploading ? (
            <>
              <div className="w-12 h-12 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
              <span className="text-sm font-black text-blue-600 uppercase tracking-wider">Processing...</span>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-violet-100 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                <ArrowUpRight size={30} />
              </div>
              <span className="text-sm font-black text-slate-600 uppercase tracking-wider">Click to Select Excel File</span>
              <span className="text-xs font-medium text-slate-400">Supports .xlsx and .xls formats</span>
            </>
          )}
        </motion.div>
      </label>

      {/* Last Upload Info */}
      {lastUpload && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 bg-emerald-50 text-emerald-700 px-6 py-4 rounded-2xl border border-emerald-200">
          <CheckCircle size={20} />
          <span className="text-sm font-bold">Last upload: <strong>{lastUpload.count} candidates</strong> processed at {lastUpload.time}</span>
        </motion.div>
      )}

      {/* Accepted Format Info */}
      <div className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
        Expected columns: Candidate First Name · Candidate Last Name · CLIENT NAME · EXAM NAME · PHONE NUMBER · PLACE
      </div>
    </div>
  )
}


// ═══════════════════════════════════════════════════════════════
// ─── MAIN EXAM OPS CENTER COMPONENT ───
// ═══════════════════════════════════════════════════════════════

export function ExamOpsCenter() {
  const [view, setView] = useState('ops')
  const [date, setDate] = useState(TODAY())
  const { activeBranch } = useBranch()
  const branch = activeBranch === 'global' ? 'calicut' : activeBranch
  const [selCand, setSelCand] = useState<any>(null)

  const NAV = [
    { id: 'ops',      label: 'Exam Day',  icon: Zap,         color: 'from-amber-400 to-amber-600',  iconColor: 'text-amber-600',  activeBg: 'bg-amber-50',  activeBorder: 'border-amber-300' },
    { id: 'upload',   label: 'Upload',    icon: Upload,      color: 'from-blue-500 to-violet-600',  iconColor: 'text-blue-600',   activeBg: 'bg-blue-50',   activeBorder: 'border-blue-300' },
    { id: 'roster',   label: 'Roster',    icon: UserCheck,   color: 'from-emerald-400 to-emerald-600', iconColor: 'text-emerald-600', activeBg: 'bg-emerald-50', activeBorder: 'border-emerald-300' },
    { id: 'cpr',      label: 'CPR',       icon: ShieldCheck, color: 'from-rose-400 to-rose-600',    iconColor: 'text-rose-600',   activeBg: 'bg-rose-50',   activeBorder: 'border-rose-300' },
    { id: 'calendar', label: 'Calendar',  icon: Calendar,    color: 'from-violet-400 to-violet-600',iconColor: 'text-violet-600', activeBg: 'bg-violet-50', activeBorder: 'border-violet-300' },
  ]

  return (
    <div className="flex w-full h-[calc(100vh-160px)] bg-[#EEF2F9] text-slate-700 overflow-hidden p-6 lg:p-10" style={{ fontFamily: "'Inter', sans-serif" }}>
      
      {/* ═══ Sidebar Navigation ═══ */}
      <div className="w-28 lg:w-32 flex flex-col items-center py-8 gap-3 mr-8 lg:mr-10 bg-white/40 rounded-3xl shadow-[8px_8px_20px_rgb(209,217,230),-8px_-8px_20px_rgba(255,255,255,0.9)] border border-white/60 backdrop-blur-sm">
        
        {/* Logo */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-black text-sm mb-6 shadow-xl shadow-amber-200/40">
          <Activity size={28} />
        </div>

        {/* Nav Items */}
        {NAV.map(n => {
          const isActive = view === n.id
          return (
            <motion.button 
              key={n.id}
              onClick={() => setView(n.id)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`w-20 lg:w-24 h-20 lg:h-22 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all border-2 ${
                isActive 
                  ? `${n.activeBg} ${n.activeBorder} shadow-[inset_3px_3px_6px_rgb(209,217,230),inset_-3px_-3px_6px_rgba(255,255,255,0.9)]` 
                  : 'border-transparent bg-white/30 hover:bg-white/70 shadow-[3px_3px_8px_rgb(209,217,230),-3px_-3px_8px_rgba(255,255,255,0.8)]'
              }`}
              title={n.label}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isActive ? `bg-gradient-to-br ${n.color} text-white shadow-md` : 'bg-white/50 text-slate-400'}`}>
                <n.icon size={18} />
              </div>
              <span className={`text-[8px] lg:text-[9px] font-black uppercase tracking-widest leading-none text-center ${isActive ? n.iconColor : 'text-slate-400'}`}>{n.label}</span>
            </motion.button>
          )
        })}
      </div>

      {/* ═══ Content Area ═══ */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Title Block */}
        <div className="flex items-center gap-5 mb-8">
          <div className="h-1.5 w-14 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full" />
          <h1 className="text-3xl lg:text-4xl font-black text-slate-800 tracking-tight uppercase leading-none" style={{ fontFamily: "'Montserrat', sans-serif" }}>
            Exam Ops <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-amber-700">Center</span>
          </h1>
          <div className="ml-auto flex items-center gap-2.5 bg-white/60 px-5 py-2.5 rounded-2xl border border-white/60 shadow-sm">
             <MapPin size={14} className="text-amber-500" />
             <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em]">{(branch || '').toUpperCase()} Centre</span>
          </div>
        </div>

        {/* Dynamic View */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div 
              key={view}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="h-full"
            >
              {view === 'ops' ? (
                <DailyOpsView date={date} setDate={setDate} branch={branch} onSelectCandidate={setSelCand} selCandidate={selCand} />
              ) : view === 'upload' ? (
                <UploadRosterView date={date} setDate={setDate} branch={branch} />
              ) : view === 'roster' ? (
                <RosterView date={date} setDate={setDate} branch={branch} />
              ) : view === 'cpr' ? (
                <CPRView branch={branch} />
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-20 text-center bg-white/30 rounded-3xl border-2 border-dashed border-slate-200">
                   <div className="w-20 h-20 bg-amber-50 rounded-3xl flex items-center justify-center text-amber-500 mb-6 shadow-md"><AlertCircle size={40} /></div>
                   <h3 className="text-xl font-black text-slate-700 uppercase tracking-tight mb-2">Module Under Calibration</h3>
                   <p className="text-sm font-medium text-slate-400 max-w-xs">This interface is being synchronized. Please check back shortly.</p>
                   <button onClick={() => setView('ops')} className="mt-8 px-8 py-4 bg-white rounded-2xl text-[10px] font-black uppercase tracking-[0.25em] text-slate-600 shadow-[4px_4px_10px_rgb(209,217,230),-4px_-4px_10px_rgba(255,255,255,0.9)] hover:bg-amber-50 hover:text-amber-700 active:shadow-[inset_3px_3px_6px_rgb(209,217,230),inset_-3px_-3px_6px_rgba(255,255,255,0.9)] transition-all border border-white/60">Return to Exam Day</button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

export default ExamOpsCenter
