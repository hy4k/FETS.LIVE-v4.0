import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useBranch } from './useBranch'

const STALE_TIME = 60000 // 1 minute

const applyBranchFilter = (query: any, activeBranch: string, column: string = 'branch_location') => {
  if (activeBranch !== 'global') {
    return query.eq(column, activeBranch)
  }
  return query
}

// Hook for main KPI stats
export const useDashboardStats = () => {
  const { activeBranch } = useBranch()

  return useQuery({
    queryKey: ['dashboardStats', activeBranch],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0]

      const [
        { count: totalCandidates },
        { count: todayCandidates },
        { count: openEvents },
        { count: pendingChecklists },
        { data: todaysRosterData },
        { count: newPosts },
        // { count: newMessages }, // chat_messages table missing
        { count: pendingIncidents },
        { data: todaysExams },
      ] = await Promise.all([
        applyBranchFilter(supabase.from('candidates').select('*', { count: 'exact', head: true }), activeBranch),
        applyBranchFilter(supabase.from('candidates').select('*', { count: 'exact', head: true }).gte('created_at', `${today}T00:00:00`), activeBranch),
        applyBranchFilter(supabase.from('incidents').select('*', { count: 'exact', head: true }).neq('status', 'closed'), activeBranch),
        applyBranchFilter((supabase as any).from('checklist_submissions').select('*', { count: 'exact', head: true }).eq('status', 'in_progress'), activeBranch, 'branch_id'),
        applyBranchFilter(supabase.from('staff_schedules').select('staff_profiles(full_name)').eq('schedule_date', today), activeBranch),
        applyBranchFilter(supabase.from('social_posts').select('*', { count: 'exact', head: true }).gte('created_at', `${today}T00:00:00`), activeBranch),
        // applyBranchFilter(supabase.from('chat_messages').select('*', { count: 'exact', head: true }).gte('created_at', `${today}T00:00:00`), activeBranch),
        applyBranchFilter(supabase.from('incidents').select('*', { count: 'exact', head: true }).neq('status', 'closed'), activeBranch),
        applyBranchFilter(supabase.from('calendar_sessions').select('*').eq('date', today), activeBranch),
      ])

      const todaysRoster = todaysRosterData && todaysRosterData.length > 0
        ? { date: today, day: new Date().toLocaleDateString('en-US', { weekday: 'short' }), staff: todaysRosterData.map((r: any) => r.staff_profiles.full_name) }
        : null

      return {
        totalCandidates: totalCandidates ?? 0,
        todayCandidates: todayCandidates ?? 0,
        openEvents: openEvents ?? 0,
        pendingChecklists: pendingChecklists ?? 0,
        todaysRoster,
        newPosts: newPosts ?? 0,
        newMessages: 0, // newMessages ?? 0,
        pendingIncidents: pendingIncidents ?? 0,
        todaysExams: (todaysExams || []) as any[],
      }
    },
    staleTime: STALE_TIME,
    refetchInterval: STALE_TIME,
  })
}

// Hook for candidate trend data
export const useCandidateTrend = () => {
  const { activeBranch } = useBranch()

  return useQuery({
    queryKey: ['candidateTrend', activeBranch],
    queryFn: async () => {
      const trendPromises = Array.from({ length: 7 }).map((_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dateString = date.toISOString().split('T')[0]
        const query = supabase
          .from('candidates')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', `${dateString}T00:00:00`)
          .lt('created_at', `${dateString}T23:59:59`)

        return applyBranchFilter(query, activeBranch).then(({ count }) => ({ date: dateString, count: count ?? 0 }))
      })
      const trendData = await Promise.all(trendPromises)
      return trendData.reverse()
    },
    staleTime: STALE_TIME * 5, // Refresh less often
  })
}

// Hook for upcoming schedule
export const useUpcomingSchedule = () => {
  const { activeBranch } = useBranch()

  return useQuery({
    queryKey: ['upcomingSchedule', activeBranch],
    queryFn: async () => {
      const today = new Date()
      const sevenDaysLater = new Date(today)
      sevenDaysLater.setDate(today.getDate() + 7)

      const query = supabase
        .from('calendar_sessions')
        .select('*')
        .gte('date', today.toISOString().split('T')[0])
        .lte('date', sevenDaysLater.toISOString().split('T')[0])
        .order('date')

      const { data, error } = await applyBranchFilter(query, activeBranch)
      if (error) throw error
      return data || []
    },
    staleTime: STALE_TIME,
  })
}

// Default fallback templates if DB is empty/inaccessible
const DEFAULT_PRE_EXAM = {
  id: 'default-pre-exam',
  title: 'Pre-Exam Checklist',
  description: 'Standard protocol validation before exam sessions begin',
  type: 'pre_exam',
  questions: [
    { id: 'pre1', text: 'Verify Internet Connection', type: 'checkbox', required: true, priority: 'high' },
    { id: 'pre2', text: 'Check Workstation Power', type: 'checkbox', required: true, priority: 'high' },
    { id: 'pre3', text: 'Clean Candidate Area', type: 'checkbox', required: true, priority: 'medium' },
    { id: 'pre4', text: 'Launch Exam Software', type: 'checkbox', required: true, priority: 'high' }
  ],
  is_active: true
}

const DEFAULT_POST_EXAM = {
  id: 'default-post-exam',
  title: 'Post-Exam Checklist',
  description: 'Procedures to follow after exam sessions conclude',
  type: 'post_exam',
  questions: [
    { id: 'post1', text: 'Collect Scrap Paper', type: 'checkbox', required: true, priority: 'high' },
    { id: 'post2', text: 'Sanitize Workstation', type: 'checkbox', required: true, priority: 'medium' },
    { id: 'post3', text: 'Upload Exam Logs', type: 'checkbox', required: true, priority: 'high' },
    { id: 'post4', text: 'Power Down Stations', type: 'checkbox', required: false, priority: 'low' }
  ],
  is_active: true
}

// Hook for checklist templates
export const useChecklistTemplates = () => {
  return useQuery({
    queryKey: ['checklistTemplates'],
    queryFn: async () => {
      console.log('🔄 Fetching checklist templates...')
      const { data, error } = await supabase
        .from('checklist_templates')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Error fetching templates, using defaults:', error)
        return {
          preExamTemplate: DEFAULT_PRE_EXAM,
          postExamTemplate: DEFAULT_POST_EXAM,
          customTemplates: [],
        }
      }

      const templates = (data || []) as any[]
      console.log('✅ Fetched templates:', templates.length, templates)

      // Find templates or use defaults
      // We prioritize the most recently created templates of each type
      const preExam = templates.find(t => t.type === 'pre_exam') || DEFAULT_PRE_EXAM
      const postExam = templates.find(t => t.type === 'post_exam') || DEFAULT_POST_EXAM
      const custom = templates.filter(t => t.type === 'custom')

      console.log('📋 Template Assignment:', {
        preExam: preExam.title,
        postExam: postExam.title,
        customCount: custom.length
      })

      return {
        preExamTemplate: preExam,
        postExamTemplate: postExam,
        customTemplates: custom,
      }
    },
    staleTime: 0,
  })
}
