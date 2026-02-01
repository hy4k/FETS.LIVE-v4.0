/**
 * FETS.Live API - Supabase Edge Function
 * 
 * Provides real-time access to FETS.Live data for external integrations (FETS AI, etc.)
 * 
 * Endpoints:
 *   GET /fets-api                    - API info
 *   GET /fets-api/today              - Today's exam summary (candidates & sessions by location)
 *   GET /fets-api/date/:date         - Specific date's exam data (YYYY-MM-DD format)
 *   GET /fets-api/checklists/status  - Pre/Post exam checklist completion status
 *   GET /fets-api/upcoming           - Next 7 days overview
 *   GET /fets-api/staff              - Staff list with base centres
 * 
 * Authentication: X-API-Key header required
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-api-key, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

// API Key validation
const VALID_API_KEYS = (Deno.env.get('FETS_API_KEYS') ?? 'fets-ai-2026-secure-key').split(',')

function validateApiKey(request: Request): boolean {
  const apiKey = request.headers.get('x-api-key')
  if (!apiKey) return false
  return VALID_API_KEYS.includes(apiKey)
}

// Create Supabase client
function getSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? 'https://qqewusetilxxfvfkmsed.supabase.co'
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  return createClient(supabaseUrl, supabaseKey)
}

// Format date to YYYY-MM-DD in IST
function formatDateIST(date: Date): string {
  const istDate = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
  return istDate.toISOString().split('T')[0]
}

// Get today's date in IST
function getTodayIST(): string {
  return formatDateIST(new Date())
}

// Helper to parse URL path
function parsePath(url: URL): { endpoint: string; params: Record<string, string> } {
  const pathname = url.pathname.replace('/fets-api', '').replace(/^\/+|\/+$/g, '')
  const parts = pathname.split('/')
  
  // Handle routes
  if (parts[0] === 'date' && parts[1]) {
    return { endpoint: 'date', params: { date: parts[1] } }
  }
  if (parts[0] === 'checklists' && parts[1] === 'status') {
    return { endpoint: 'checklists-status', params: {} }
  }
  
  return { endpoint: parts[0] || 'info', params: {} }
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const url = new URL(req.url)
  const { endpoint, params } = parsePath(url)

  // Validate API key (except for info endpoint)
  if (endpoint !== 'info' && !validateApiKey(req)) {
    return new Response(
      JSON.stringify({ 
        error: 'Unauthorized', 
        message: 'Invalid or missing API key. Include X-API-Key header.' 
      }),
      { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  const supabase = getSupabaseClient()

  try {
    switch (endpoint) {
      case 'info':
        return new Response(
          JSON.stringify({
            name: 'FETS.Live API',
            version: '1.0.0',
            organization: 'Forun Educational Testing Services',
            endpoints: {
              '/fets-api': 'API information (no auth required)',
              '/fets-api/today': 'Today\'s exam summary by location',
              '/fets-api/date/:date': 'Specific date\'s exam data (YYYY-MM-DD)',
              '/fets-api/checklists/status': 'Checklist completion status',
              '/fets-api/upcoming': 'Next 7 days overview',
              '/fets-api/staff': 'Staff list with assignments'
            },
            authentication: 'X-API-Key header required for all endpoints except /fets-api',
            timestamp: new Date().toISOString()
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case 'today':
        return await handleTodayEndpoint(supabase)

      case 'date':
        return await handleDateEndpoint(supabase, params.date)

      case 'checklists-status':
        return await handleChecklistsEndpoint(supabase)

      case 'upcoming':
        return await handleUpcomingEndpoint(supabase)

      case 'staff':
        return await handleStaffEndpoint(supabase)

      default:
        return new Response(
          JSON.stringify({ error: 'Not Found', message: `Unknown endpoint: ${endpoint}` }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (error) {
    console.error('API Error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal Server Error', 
        message: error.message ?? 'An unexpected error occurred' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// ==================== ENDPOINT HANDLERS ====================

async function handleTodayEndpoint(supabase: any) {
  const today = getTodayIST()
  return await handleDateEndpoint(supabase, today)
}

async function handleDateEndpoint(supabase: any, dateStr: string) {
  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return new Response(
      JSON.stringify({ error: 'Invalid date format. Use YYYY-MM-DD.' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Fetch sessions for the date
  const { data: sessions, error: sessionsError } = await supabase
    .from('sessions')
    .select('*')
    .eq('date', dateStr)
    .order('start_time', { ascending: true })

  if (sessionsError) {
    console.error('Sessions fetch error:', sessionsError)
  }

  // Fetch candidates for the date
  const { data: candidates, error: candidatesError } = await supabase
    .from('candidates')
    .select('*')
    .gte('exam_date', `${dateStr}T00:00:00`)
    .lt('exam_date', `${dateStr}T23:59:59`)
    .order('exam_date', { ascending: true })

  if (candidatesError) {
    console.error('Candidates fetch error:', candidatesError)
  }

  // Organize data by location
  const locations = {
    calicut: {
      total_candidates: 0,
      sessions: [] as any[],
      exams: {} as Record<string, { client: string; exam: string; candidates: number; time: string }>
    },
    cochin: {
      total_candidates: 0,
      sessions: [] as any[],
      exams: {} as Record<string, { client: string; exam: string; candidates: number; time: string }>
    }
  }

  // Process sessions
  if (sessions) {
    sessions.forEach((session: any) => {
      const branch = session.branch_location?.toLowerCase() || 'calicut'
      if (branch === 'calicut' || branch === 'cochin') {
        locations[branch].sessions.push(session)
        locations[branch].total_candidates += session.candidate_count || 0
        
        const examKey = `${session.client_name}-${session.exam_name}`
        if (!locations[branch].exams[examKey]) {
          locations[branch].exams[examKey] = {
            client: session.client_name,
            exam: session.exam_name,
            candidates: 0,
            time: session.start_time
          }
        }
        locations[branch].exams[examKey].candidates += session.candidate_count || 0
      }
    })
  }

  // Convert exams object to array
  const formatExams = (exams: Record<string, any>) => Object.values(exams).sort((a, b) => a.time.localeCompare(b.time))

  const response = {
    date: dateStr,
    day_of_week: new Date(dateStr).toLocaleDateString('en-IN', { weekday: 'long', timeZone: 'Asia/Kolkata' }),
    generated_at: new Date().toISOString(),
    summary: {
      total_candidates: locations.calicut.total_candidates + locations.cochin.total_candidates,
      total_sessions: (sessions?.length || 0),
      calicut_candidates: locations.calicut.total_candidates,
      cochin_candidates: locations.cochin.total_candidates
    },
    locations: {
      calicut: {
        total_candidates: locations.calicut.total_candidates,
        session_count: locations.calicut.sessions.length,
        exams: formatExams(locations.calicut.exams)
      },
      cochin: {
        total_candidates: locations.cochin.total_candidates,
        session_count: locations.cochin.sessions.length,
        exams: formatExams(locations.cochin.exams)
      }
    },
    raw_sessions: sessions || [],
    raw_candidates: candidates || []
  }

  return new Response(
    JSON.stringify(response),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handleChecklistsEndpoint(supabase: any) {
  const today = getTodayIST()
  
  // Fetch checklist instances for today
  const { data: instances, error: instancesError } = await supabase
    .from('checklist_instances')
    .select(`
      *,
      items:checklist_instance_items(*)
    `)
    .eq('exam_date', today)
    .order('created_at', { ascending: true })

  if (instancesError) {
    console.error('Checklist instances fetch error:', instancesError)
  }

  // Separate pre-exam and post-exam checklists
  const preExamChecklists = (instances || []).filter((i: any) => i.category === 'pre-exam')
  const postExamChecklists = (instances || []).filter((i: any) => i.category === 'post-exam')

  // Calculate completion status
  const calculateCompletion = (checklists: any[]) => {
    if (checklists.length === 0) return { submitted: false, completion: 0, completed: 0, total: 0 }
    
    let totalItems = 0
    let completedItems = 0
    
    checklists.forEach((checklist: any) => {
      if (checklist.items) {
        totalItems += checklist.items.length
        completedItems += checklist.items.filter((item: any) => item.is_completed).length
      }
    })
    
    return {
      submitted: checklists.length > 0,
      completion: totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0,
      completed: completedItems,
      total: totalItems
    }
  }

  // Organize by location
  const locations = ['calicut', 'cochin']
  const byLocation: Record<string, any> = {}

  locations.forEach(loc => {
    const locPreExam = preExamChecklists.filter((c: any) => c.branch_location?.toLowerCase() === loc)
    const locPostExam = postExamChecklists.filter((c: any) => c.branch_location?.toLowerCase() === loc)
    
    byLocation[loc] = {
      pre_exam: calculateCompletion(locPreExam),
      post_exam: calculateCompletion(locPostExam)
    }
  })

  const response = {
    date: today,
    generated_at: new Date().toISOString(),
    deadlines: {
      pre_exam: '12:00 PM IST',
      post_exam: 'After 3:00 PM IST'
    },
    summary: {
      pre_exam: calculateCompletion(preExamChecklists),
      post_exam: calculateCompletion(postExamChecklists)
    },
    by_location: byLocation,
    details: {
      pre_exam: preExamChecklists.map((c: any) => ({
        id: c.id,
        name: c.name,
        branch: c.branch_location,
        completed_at: c.completed_at,
        items_completed: c.items?.filter((i: any) => i.is_completed).length || 0,
        items_total: c.items?.length || 0
      })),
      post_exam: postExamChecklists.map((c: any) => ({
        id: c.id,
        name: c.name,
        branch: c.branch_location,
        completed_at: c.completed_at,
        items_completed: c.items?.filter((i: any) => i.is_completed).length || 0,
        items_total: c.items?.length || 0
      }))
    }
  }

  return new Response(
    JSON.stringify(response),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handleUpcomingEndpoint(supabase: any) {
  const today = new Date()
  const dates: string[] = []
  
  // Generate next 7 days
  for (let i = 0; i < 7; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() + i)
    dates.push(formatDateIST(date))
  }

  // Fetch all sessions for the next 7 days
  const { data: sessions, error } = await supabase
    .from('sessions')
    .select('*')
    .in('date', dates)
    .order('date', { ascending: true })
    .order('start_time', { ascending: true })

  if (error) {
    console.error('Upcoming sessions fetch error:', error)
  }

  // Organize by date
  const upcoming = dates.map(dateStr => {
    const daySessions = (sessions || []).filter((s: any) => s.date === dateStr)
    const calicutCount = daySessions
      .filter((s: any) => s.branch_location?.toLowerCase() === 'calicut' || !s.branch_location)
      .reduce((sum: number, s: any) => sum + (s.candidate_count || 0), 0)
    const cochinCount = daySessions
      .filter((s: any) => s.branch_location?.toLowerCase() === 'cochin')
      .reduce((sum: number, s: any) => sum + (s.candidate_count || 0), 0)

    return {
      date: dateStr,
      day_of_week: new Date(dateStr).toLocaleDateString('en-IN', { weekday: 'long', timeZone: 'Asia/Kolkata' }),
      total_candidates: calicutCount + cochinCount,
      calicut_candidates: calicutCount,
      cochin_candidates: cochinCount,
      session_count: daySessions.length
    }
  })

  return new Response(
    JSON.stringify({
      generated_at: new Date().toISOString(),
      days: upcoming
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handleStaffEndpoint(supabase: any) {
  const { data: staff, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, department, position, base_centre')
    .order('full_name', { ascending: true })

  if (error) {
    console.error('Staff fetch error:', error)
  }

  // Organize by location
  const calicutStaff = (staff || []).filter((s: any) => s.base_centre?.toLowerCase() === 'calicut')
  const cochinStaff = (staff || []).filter((s: any) => s.base_centre?.toLowerCase() === 'cochin')
  const unassigned = (staff || []).filter((s: any) => !s.base_centre)

  return new Response(
    JSON.stringify({
      generated_at: new Date().toISOString(),
      total_staff: staff?.length || 0,
      by_location: {
        calicut: {
          count: calicutStaff.length,
          staff: calicutStaff
        },
        cochin: {
          count: cochinStaff.length,
          staff: cochinStaff
        },
        unassigned: {
          count: unassigned.length,
          staff: unassigned
        }
      }
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}
