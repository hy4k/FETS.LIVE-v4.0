import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Calendar, Users, Clock, CheckCircle, AlertTriangle, 
  ChevronLeft, ChevronRight, Plus, Upload, Search, 
  FileText, X, Cpu, LayoutDashboard, UserCheck, 
  ShieldCheck, AlertCircle, Info, Download, Filter,
  Briefcase, MapPin
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useBranch } from '../hooks/useBranch'
import { useAuth } from '../hooks/useAuth'
import { toast } from 'react-hot-toast'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as XLSX from 'xlsx'

// ─── PREMIUM UI CONSTANTS (NEUMORPHIC) ───
const TODAY = () => new Date().toLocaleDateString('sv-SE')

const T = {
  bg: "#EEF2F9",
  text: "#1E293B",
  textMuted: "#64748B",
  gold: "#F59E0B",
  emerald: "#10B981",
  blue: "#3B82F6",
  neuCard: "bg-[#EEF2F9] rounded-3xl shadow-[9px_9px_16px_rgb(209,217,230),-9px_-9px_16px_rgba(255,255,255,0.8)] border border-white/50",
  neuInset: "bg-[#EEF2F9] rounded-xl shadow-[inset_4px_4px_8px_rgb(209,217,230),inset_-4px_-4px_8px_rgba(255,255,255,0.9)] border border-white/20",
  neuBtn: "bg-[#EEF2F9] text-slate-600 font-bold rounded-2xl shadow-[6px_6px_10px_rgb(209,217,230),-6px_-6px_10px_rgba(255,255,255,0.8)] hover:shadow-[4px_4px_8px_rgb(209,217,230),-4px_-4px_8px_rgba(255,255,255,0.8)] active:shadow-[inset_4px_4px_8px_rgb(209,217,230),inset_-4px_-4px_8px_rgba(255,255,255,0.8)] transition-all border border-white/40",
  neuBtnActive: "bg-[#EEF2F9] text-amber-600 font-bold rounded-2xl shadow-[inset_4px_4px_8px_rgb(209,217,230),inset_-4px_-4px_8px_rgba(255,255,255,0.8)] border border-white/40",
}

const SHIFTS: Record<string, { l: string; c: string }> = {
  D: { l: 'Day', c: '#F59E0B' }, M: { l: 'Morning', c: '#3B82F6' },
  E: { l: 'Evening', c: '#8B5CF6' }, N: { l: 'Night', c: '#1E293B' },
  O: { l: 'Off', c: '#94A3B8' }, L: { l: 'Leave', c: '#EF4444' },
}

const CLIENT_COLORS: Record<string, string> = {
  PROMETRIC: '#3B82F6', 'PEARSON VUE': '#10B981', PSI: '#F59E0B',
  ETS: '#8B5CF6', ITTS: '#6366F1', IELTS: '#EF4444', ACCA: '#14B8A6',
}
const getClientColor = (name?: string) => CLIENT_COLORS[name?.toUpperCase() || ''] || '#94A3B8'

// ─── UTILS ───
const formatDisplayDate = (dateStr: string) => {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
  })
}

// ─── DAILY OPS VIEW (THE ORIGINAL LAYOUT) ───

function DailyOpsView({ 
  date, 
  setDate, 
  branch,
  onSelectCandidate,
  selCandidate
}: { 
  date: string; 
  setDate: (d: string) => void; 
  branch: string;
  onSelectCandidate: (c: any) => void;
  selCandidate: any;
}) {
  const [search, setSearch] = useState('')
  const [filterClient, setFilterClient] = useState('')
  const queryClient = useQueryClient()

  // Real data fetching
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
        
        // Parse data specialized for Cochin format
        const uploads = data.map(row => {
          const rawDate = row['Scheduled Date Time'] || date
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

        // Create sessions/candidates manually since DB lacks unique constraints for upsert
        for (const up of uploads) {
            // 1. Ensure session exists
            const { data: existingSess } = await supabase
                .from('calendar_sessions')
                .select('id, candidate_count')
                .eq('date', date)
                .eq('client_name', up.client_name)
                .eq('exam_name', up.exam_name)
                .eq('branch_location', branch)
                .single()

            if (existingSess) {
                await supabase.from('calendar_sessions').update({ 
                    candidate_count: (existingSess.candidate_count || 0) + 1 
                }).eq('id', existingSess.id)
            } else {
                await supabase.from('calendar_sessions').insert({
                    date,
                    client_name: up.client_name,
                    exam_name: up.exam_name,
                    candidate_count: 1,
                    branch_location: branch,
                    start_time: '09:00:00',
                    end_time: '17:00:00'
                })
            }

            // 2. Upsert candidate (manual check)
            const { data: existingCand } = await supabase
                .from('candidates')
                .select('id')
                .eq('full_name', up.full_name)
                .eq('exam_date', up.exam_date)
                .eq('branch_location', branch)
                .single()
            
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
    <div className="flex flex-col h-full space-y-4">
      
      {/* 1. Header: Date Selector & Stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => { const d = new Date(date + 'T00:00:00'); d.setDate(d.getDate()-1); setDate(d.toLocaleDateString('sv-SE')) }} className={`${T.neuBtn} p-3`}><ChevronLeft size={18} /></button>
          <div className="text-center px-4">
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-transparent text-xl font-black text-slate-800 outline-none cursor-pointer tracking-tight" />
            <div className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mt-0.5">{date === TODAY() ? 'Today' : new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long' })}</div>
          </div>
          <button onClick={() => { const d = new Date(date + 'T00:00:00'); d.setDate(d.getDate()+1); setDate(d.toLocaleDateString('sv-SE')) }} className={`${T.neuBtn} p-3`}><ChevronRight size={18} /></button>
        </div>

        <div className="flex gap-4">
          <div className="flex items-center gap-2 mr-4">
            <input 
              type="file" 
              id="roster-upload" 
              className="hidden" 
              accept=".xlsx,.xls" 
              onChange={handleExcelUpload} 
            />
            <button 
              onClick={() => document.getElementById('roster-upload')?.click()}
              className={`${T.neuBtn} px-5 py-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-white text-blue-600`}
            >
              <Upload size={14} /> Upload Daily Roster
            </button>
          </div>
          <div className={`${T.neuCard} px-6 py-3 flex flex-col items-center`}>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Sessions</span>
            <span className="text-xl font-black text-blue-500">{sessions.length}</span>
          </div>
          <div className={`${T.neuCard} px-6 py-3 flex flex-col items-center`}>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Checked In</span>
            <span className="text-xl font-black text-emerald-500">{checkedIn}/{candidates.length}</span>
          </div>
          <div className={`${T.neuCard} px-6 py-3 flex flex-col items-center`}>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Staff</span>
            <span className="text-xl font-black text-amber-500">{onDuty.length}</span>
          </div>
        </div>
      </div>

      {/* 2. Sessions Strip */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        {sessions.map((s: any) => (
          <div key={s.id} className={`${T.neuCard} px-4 py-2 flex items-center gap-3 flex-shrink-0 border-none bg-white/50`}>
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getClientColor(s.client_name) }} />
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-800 uppercase tracking-tight leading-none">{s.client_name}</span>
              <span className="text-[9px] font-bold text-slate-400 mt-1">{s.start_time?.slice(0,5)} — {s.end_time?.slice(0,5)}</span>
            </div>
            <span className="ml-2 w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-black text-slate-600">{s.candidate_count || 0}</span>
          </div>
        ))}
      </div>

      {/* 3. Staff Strip */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 mb-2">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2 ml-1">Personnel:</span>
        {onDuty.map((r: any) => (
          <div key={r.id} className={`${T.neuInset} px-3 py-1.5 flex items-center gap-2 bg-white/30`}>
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: SHIFTS[r.shift_code]?.c }} />
            <span className="text-[11px] font-bold text-slate-700">{r.staff_profiles?.full_name}</span>
          </div>
        ))}
        {onDuty.length === 0 && <span className="text-[11px] text-slate-400 italic">No personnel assigned</span>}
      </div>

      {/* 4. Split Layout (The Interactive Part) */}
      <div className="flex-1 flex gap-6 min-h-0">
        
        {/* Left: Searchable List */}
        <div className="w-[42%] flex flex-col min-h-0 space-y-4">
          <div className="flex gap-2">
            <div className={`${T.neuInset} flex-1 flex items-center px-4 py-3 bg-white/40`}>
              <Search size={16} className="text-slate-400 mr-3" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search candidates..." className="bg-transparent border-none outline-none text-sm font-bold text-slate-800 w-full" />
            </div>
            <select value={filterClient} onChange={e => setFilterClient(e.target.value)} className={`${T.neuBtn} px-4 py-2 text-xs uppercase bg-white`}>
              <option value="">All Clients</option>
              {Object.keys(CLIENT_COLORS).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar space-y-2 pr-1">
            {filtered.map((c: any) => (
              <div 
                key={c.id} 
                onClick={() => onSelectCandidate(c)}
                className={`p-4 rounded-3xl transition-all cursor-pointer border flex items-center gap-4 ${selCandidate?.id === c.id ? 'bg-amber-500/10 border-amber-500/30' : 'bg-white/40 border-transparent hover:bg-white/80'}`}
              >
                <button 
                  onClick={(e) => { e.stopPropagation(); checkInMutation.mutate({ id: c.id, checked: !c.check_in_time }) }}
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${c.check_in_time ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-200 text-slate-400'}`}
                >
                  <CheckCircle size={18} />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-black text-slate-800 truncate">{c.full_name}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{c.client_name}</span>
                    <span className="text-[9px] text-slate-300">•</span>
                    <span className="text-[9px] font-bold text-slate-400">{c.address || 'No Place'}</span>
                  </div>
                </div>
                {c.check_in_time && <span className="text-[9px] font-black text-emerald-600 bg-emerald-100 px-2 py-1 rounded-lg">CHECKED IN</span>}
              </div>
            ))}
            {filtered.length === 0 && <div className="text-center py-20 text-slate-400 text-sm font-bold italic uppercase tracking-widest">No matching records found.</div>}
          </div>
        </div>

        {/* Right: Details Panel */}
        <div className="flex-1 min-h-0">
          <AnimatePresence mode="wait">
            {!selCandidate ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center justify-center p-10 text-center border-2 border-dashed border-slate-300 rounded-[40px] opacity-40">
                <div className={`${T.neuCard} p-6 mb-6`}><Users size={40} className="text-slate-400" /></div>
                <h3 className="text-xl font-black text-slate-600 uppercase tracking-tighter italic">Select Candidate</h3>
                <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest">Awaiting interaction feed from left panel.</p>
              </motion.div>
            ) : (
              <motion.div key={selCandidate.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className={`${T.neuCard} h-full overflow-y-auto no-scrollbar p-10 flex flex-col`}>
                <div className="flex items-center gap-6 mb-10 pb-8 border-b border-white/50">
                  <div className="w-20 h-20 rounded-[35px] bg-amber-500 flex items-center justify-center text-white text-3xl font-black italic shadow-xl shadow-amber-500/20">{selCandidate.full_name?.charAt(0)}</div>
                  <div className="flex-1">
                    <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase italic leading-none">{selCandidate.full_name}</h2>
                    <div className="flex items-center gap-3 mt-4">
                      <div className="px-3 py-1.5 bg-slate-100 rounded-xl text-[10px] font-black text-slate-500 uppercase tracking-widest">{selCandidate.client_name}</div>
                      <div className="px-3 py-1.5 bg-amber-100 rounded-xl text-[10px] font-black text-amber-600 uppercase tracking-widest">ID: {selCandidate.confirmation_number || 'UNKNOWN'}</div>
                    </div>
                  </div>
                  <button 
                    onClick={async () => {
                      if (!selCandidate.check_in_time && selCandidate.notes && selCandidate.full_name !== selCandidate.notes) {
                        const cprText = `Candidate name appeared in the roster as “${selCandidate.full_name}“ but in the primary ID it shown as “${selCandidate.notes}“`
                        await supabase.from('incidents').insert({
                          title: `Identity Disparity: ${selCandidate.full_name}`,
                          description: cprText,
                          category: 'cpr',
                          status: 'open',
                          user_id: (await supabase.auth.getUser()).data.user?.id,
                          branch_location: branch
                        })
                        toast.success('CPR auto-generated due to name disparity')
                      }
                      checkInMutation.mutate({ id: selCandidate.id, checked: !selCandidate.check_in_time })
                    }} 
                    className={`${T.neuBtn} px-8 py-4 text-xs uppercase tracking-widest ${selCandidate.check_in_time ? 'bg-emerald-500 text-white shadow-none' : 'bg-white'}`}
                  >
                    {selCandidate.check_in_time ? 'Checked In' : 'Verify & Process'}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-8 flex-1">
                  <div className="space-y-8">
                    <section>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3">Exam Details</label>
                      <div className="space-y-4">
                        <div className="flex flex-col"><span className="text-[9px] text-slate-400 font-bold uppercase mb-1">Session Module</span><span className="text-sm font-black text-slate-800 italic">{selCandidate.exam_name}</span></div>
                        <div className="flex flex-col"><span className="text-[9px] text-slate-400 font-bold uppercase mb-1">Timeline</span><span className="text-sm font-black text-slate-800">{formatDisplayDate(date)}</span></div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex flex-col"><span className="text-[9px] text-slate-400 font-bold uppercase mb-1">Place</span><span className="text-sm font-black text-slate-800">{selCandidate.address || '—'}</span></div>
                          <div className="flex flex-col"><span className="text-[9px] text-slate-400 font-bold uppercase mb-1">Phone Number</span><span className="text-sm font-black text-slate-800">{selCandidate.phone || '—'}</span></div>
                        </div>
                      </div>
                    </section>
                    <section>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3">Name as per ID</label>
                      <textarea 
                        defaultValue={selCandidate.notes || ''} 
                        onBlur={e => updateNotes(selCandidate.id, e.target.value)}
                        placeholder="Observation logs..."
                        className={`${T.neuInset} w-full p-5 h-20 text-sm font-medium text-slate-800 bg-white/40 outline-none resize-none`}
                      />
                    </section>
                  </div>

                  <div className="space-y-8">
                    <section>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3">Identity Check</label>
                      <p className="text-[11px] font-medium text-slate-500 leading-relaxed mb-4">Validate physical ID against digital record. Ensure 1:1 name parity before processing candidate feed.</p>
                      <div className={`${T.neuInset} p-5 bg-white/60`}>
                        <div className="text-[9px] font-black text-slate-400 uppercase mb-2">Registered Name</div>
                        <div className="text-base font-black text-slate-800">{selCandidate.full_name}</div>
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

function RosterView({ date, setDate, branch }) {
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

  // Group by profile_id and date
  const scheduleMap = schedules.reduce((acc, curr) => { acc[`${curr.profile_id}_${curr.date}`] = curr; return acc }, {})
  const weekDates = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(date + 'T00:00:00')
    const start = new Date(d); start.setDate(d.getDate() - d.getDay() + 1)
    const current = new Date(start); current.setDate(start.getDate() + i)
    return current.toLocaleDateString('sv-SE')
  })

  const cycleShift = async (sId, dStr, current) => {
    const codes = Object.keys(SHIFTS)
    const nextCode = codes[(codes.indexOf(current?.shift_code || '') + 1) % codes.length]
    if (current) { await supabase.from('roster_schedules').update({ shift_code: nextCode }).eq('id', current.id) }
    else { await supabase.from('roster_schedules').insert({ profile_id: sId, date: dStr, shift_code: nextCode, branch_location: branch, status: 'confirmed' }) }
    refetch()
  }

  const changeWeek = (off) => { const d = new Date(date + 'T00:00:00'); d.setDate(d.getDate() + off * 7); setDate(d.toLocaleDateString('sv-SE')) }

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => changeWeek(-1)} className={`${T.neuBtn} p-3`}><ChevronLeft size={20} /></button>
          <h2 className="text-2xl font-black text-slate-800 tracking-tighter uppercase italic">Personnel Roster</h2>
          <button onClick={() => changeWeek(1)} className={`${T.neuBtn} p-3`}><ChevronRight size={20} /></button>
        </div>
        <div className="flex gap-4">
           {Object.entries(SHIFTS).map(([code, s]) => (
             <div key={code} className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400">
               <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: s.c }} />
               <span>{code}={s.l}</span>
             </div>
           ))}
        </div>
      </div>

      <div className={`${T.neuCard} overflow-hidden bg-white/50 border-none`}>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/50 bg-slate-100/30">
              <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Faculty Member</th>
              {weekDates.map(d => (
                <th key={d} className="p-4 text-center">
                  <div className="text-[10px] font-black text-slate-400 uppercase mb-1">{new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short' })}</div>
                  <div className={`text-xl font-black ${d === TODAY() ? 'text-amber-500' : 'text-slate-800'}`}>{d.split('-')[2]}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {staffProfiles.map(s => (
              <tr key={s.id} className="border-b border-white/30 hover:bg-white/40 transition-colors">
                <td className="p-6">
                  <div className="text-sm font-black text-slate-800 uppercase italic">{s.full_name}</div>
                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{s.role?.replace('_',' ')}</div>
                </td>
                {weekDates.map(d => {
                  const sched = scheduleMap[`${s.id}_${d}`]
                  return (
                    <td key={d} className="p-2 text-center">
                      <button 
                        onClick={() => cycleShift(s.id, d, sched)}
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-[11px] font-black shadow-lg transition-transform hover:scale-105 active:scale-95"
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
      ...newCpr,
      category: 'cpr',
      status: 'open',
      branch_location: branch,
      user_id: (await supabase.auth.getSingleSession()).data.session?.user?.id
    })
    toast.success('CPR entry created')
    setShowManual(false)
    setNewCpr({ title: '', description: '' })
    refetch()
  }

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-slate-800 tracking-tighter uppercase italic">Candidate Profile Reports (CPR)</h2>
        <button onClick={() => setShowManual(true)} className={`${T.neuBtn} px-6 py-3 flex items-center gap-2 text-xs uppercase tracking-widest bg-white`}>
          <Plus size={16} /> Create Manual CPR
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pr-2">
        {cprs.map((c: any) => (
          <div key={c.id} className={`${T.neuCard} p-6 flex flex-col gap-3 relative overflow-hidden bg-white/40`}>
             <div className="bg-amber-500 absolute top-0 left-0 w-1 h-full" />
             <div className="flex items-center justify-between">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(c.created_at).toLocaleDateString()}</span>
               <span className="px-2 py-1 bg-amber-100 text-amber-600 text-[9px] font-black rounded uppercase">Active</span>
             </div>
             <h3 className="text-base font-black text-slate-800 uppercase italic tracking-tight">{c.title}</h3>
             <p className="text-sm font-medium text-slate-600 italic leading-relaxed">“{c.description}“</p>
          </div>
        ))}
        {cprs.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center opacity-30 italic py-20 text-slate-400 font-bold uppercase tracking-widest">
            No CPR entries recorded on this branch.
          </div>
        )}
      </div>

      <AnimatePresence>
        {showManual && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-200/60 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className={`${T.neuCard} w-full max-w-lg p-10 bg-white relative`}>
              <button onClick={() => setShowManual(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600"><X size={24} /></button>
              <h2 className="text-2xl font-black text-slate-800 tracking-tighter uppercase italic mb-8">Manual CPR Entry</h2>
              <div className="space-y-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subject Title</label>
                  <input value={newCpr.title} onChange={e => setNewCpr({ ...newCpr, title: e.target.value })} className={`${T.neuInset} p-4 text-sm font-bold bg-white/50 outline-none`} placeholder="e.g. Identity Disparity - John Doe" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Report Narrative</label>
                  <textarea value={newCpr.description} onChange={e => setNewCpr({ ...newCpr, description: e.target.value })} className={`${T.neuInset} p-4 text-sm font-medium bg-white/50 outline-none h-40 resize-none`} placeholder="Provide detailed context..." />
                </div>
                <button onClick={createCpr} className={`${T.neuBtn} w-full py-4 bg-amber-500 text-white font-black uppercase tracking-[0.2em] shadow-amber-200`}>Record CPR Entry</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── MAIN EXAM OPS CENTER COMPONENT ───

export function ExamOpsCenter() {
  const [view, setView] = useState('ops')
  const [date, setDate] = useState(TODAY())
  const { activeBranch } = useBranch()
  const branch = activeBranch === 'global' ? 'calicut' : activeBranch
  const [selCand, setSelCand] = useState<any>(null)

  const NAV = [
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'clients', label: 'Clients', icon: Users },
    { id: 'ops', label: 'Exam Day', icon: Clock },
    { id: 'roster', label: 'Roster', icon: UserCheck },
    { id: 'cpr', label: 'CPR', icon: ShieldCheck },
  ]

  return (
    <div className={`flex w-full h-[calc(100vh-160px)] ${T.bg} text-slate-700 overflow-hidden p-6 lg:p-10 font-sans`} style={{ fontFamily: "'Inter', sans-serif" }}>
      
      {/* 1. Sidebar (Original Layout) */}
      <div className={`w-20 lg:w-24 ${T.neuCard} flex flex-col items-center py-8 gap-4 mr-10 bg-white/20 border-white/40`}>
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-black text-xs mb-8 shadow-xl shadow-amber-500/20">EOC</div>
        {NAV.map(n => (
          <button 
            key={n.id}
            onClick={() => setView(n.id)}
            className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center transition-all ${view === n.id ? T.neuBtnActive + ' bg-white' : 'text-slate-400 font-bold hover:text-slate-600'}`}
            title={n.label}
          >
            <n.icon size={20} className={view === n.id ? 'opacity-100' : 'opacity-40'} />
            <span className="text-[7px] font-black uppercase tracking-widest mt-1.5 leading-none text-center px-1">{n.label}</span>
          </button>
        ))}
      </div>

      {/* 2. Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Title Block */}
        <div className="flex items-center gap-4 mb-10">
          <div className="h-1 w-12 bg-amber-500 rounded-full" />
          <h1 className="text-4xl lg:text-5xl font-black text-slate-800 tracking-tighter uppercase italic leading-none font-['Montserrat']">
            Exam Ops <span className="text-transparent bg-clip-text bg-gradient-to-br from-amber-400 via-amber-600 to-amber-700 font-['Montserrat']">Center</span>
          </h1>
          <div className="ml-auto flex items-center gap-2 bg-white/40 px-5 py-2 rounded-2xl border border-white/50">
             <MapPin size={12} className="text-amber-500" />
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">NODE {branch.toUpperCase()}</span>
          </div>
        </div>

        {/* Dynamic View Area */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div 
              key={view}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              {view === 'ops' ? (
                <DailyOpsView 
                  date={date} 
                  setDate={setDate} 
                  branch={branch} 
                  onSelectCandidate={setSelCand}
                  selCandidate={selCand}
                />
              ) : view === 'roster' ? (
                <RosterView date={date} setDate={setDate} branch={branch} />
              ) : view === 'cpr' ? (
                <CPRView branch={branch} />
              ) : (
                <div className={`${T.neuCard} h-full flex flex-col items-center justify-center p-20 text-center opacity-80`}>
                   <div className="w-20 h-20 bg-amber-500/10 rounded-3xl flex items-center justify-center text-amber-500 mb-6"><AlertCircle size={40} /></div>
                   <h3 className="text-xl font-black text-slate-800 uppercase italic tracking-tight mb-2">Module Under Calibration</h3>
                   <p className="text-sm font-medium text-slate-500 max-w-xs">The requested interface is currently being synchronized with the neural grid. Please check back shortly.</p>
                   <button onClick={() => setView('ops')} className={`${T.neuBtn} mt-10 px-10 py-5 text-[10px] font-black uppercase tracking-[0.3em] bg-white`}>Return to Exam Day</button>
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

