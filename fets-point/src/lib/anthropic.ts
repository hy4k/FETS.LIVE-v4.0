import { supabase } from './supabase';

/**
 * FETS Intelligence v12.0 - "OMNI" Edition with Anthropic Claude
 * Optimized for rate limits - sends summarized data only
 */

const getClaudeApiKey = () => import.meta.env.VITE_ANTHROPIC_API_KEY;

// Helper to safely fetch data without throwing
async function safeFetch(promise: Promise<any>, tableName: string) {
    try {
        const { data, error } = await promise;
        if (error) {
            console.warn(`[Context Warning] Failed to fetch ${tableName}:`, error.message);
            return [];
        }
        return data || [];
    } catch (err) {
        console.warn(`[Context Exception] Failed to fetch ${tableName}:`, err);
        return [];
    }
}

/**
 * Call Anthropic Claude API directly via REST
 */
async function callClaudeAPI(apiKey: string, prompt: string): Promise<string> {
    const url = 'https://api.anthropic.com/v1/messages';
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 2048,
            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ]
        })
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `API Error: ${response.status}`);
    }

    const data = await response.json();
    return data.content?.[0]?.text || '';
}

/**
 * Fetch summarized data only - optimized for rate limits
 */
async function fetchSummarizedData() {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];

    // Fetch summary counts and recent data only
    const [
        // Recent incidents (last 30 days)
        recentIncidents,
        // All candidates with exam counts
        candidates,
        // Recent sessions (last 30 days and future)
        recentSessions,
        // Staff profiles
        staff,
        // Vault documents count
        vault,
        // Notices
        notices,
        // Posts
        posts,
        // Lost & Found
        lostFound,
        // Leave requests
        leaves,
        // Future sessions
        futureSessions,
        // Current sessions
        currentSessions,
        // Online staff
        onlineStaff,
        // Branch status
        branchStatus
    ] = await Promise.all([
        safeFetch(
            supabase.from('incidents')
                .select('*')
                .gte('created_at', thirtyDaysAgo)
                .order('created_at', { ascending: false })
                .limit(50),
            'recent_incidents'
        ),
        
        safeFetch(
            supabase.from('candidates')
                .select('exam_name, status, exam_date, branch_location')
                .order('created_at', { ascending: false }),
            'candidates'
        ),
        
        safeFetch(
            supabase.from('calendar_sessions')
                .select('*')
                .gte('date', thirtyDaysAgo)
                .order('date', { ascending: 'desc' }),
            'recent_sessions'
        ),
        
        safeFetch(
            supabase.from('staff_profiles')
                .select('full_name, role, branch_assigned, is_online'),
            'staff'
        ),
        
        safeFetch(
            supabase.from('fets_vault')
                .select('title, category')
                .eq('is_deleted', false),
            'vault'
        ),
        
        safeFetch(
            supabase.from('notices')
                .select('title, created_at')
                .order('created_at', { ascending: false })
                .limit(20),
            'notices'
        ),
        
        safeFetch(
            supabase.from('social_posts')
                .select('content, created_at')
                .order('created_at', { ascending: false })
                .limit(10),
            'posts'
        ),
        
        safeFetch(
            supabase.from('lost_found_items')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(20),
            'lost_found'
        ),
        
        safeFetch(
            supabase.from('leave_requests')
                .select('status, requested_date')
                .gte('requested_date', thirtyDaysAgo),
            'leaves'
        ),
        
        safeFetch(
            supabase.from('calendar_sessions')
                .select('*')
                .gte('date', today)
                .order('date', { ascending: true }),
            'future_sessions'
        ),
        
        safeFetch(
            supabase.from('calendar_sessions')
                .select('*')
                .eq('date', today),
            'current_sessions'
        ),
        
        safeFetch(
            supabase.from('staff_profiles')
                .select('full_name, role')
                .eq('is_online', true),
            'online_staff'
        ),
        
        safeFetch(
            supabase.from('branch_status').select('*'),
            'branch_status'
        ),
    ]);

    // Calculate exam statistics
    const examStats = processExamStatistics(candidates, recentSessions, futureSessions);

    return {
        today,
        metadata: {
            timestamp: new Date().toLocaleString(),
            operator: 'System User'
        },
        
        // Summarized historical data
        historical_summary: {
            incidents_count: recentIncidents?.length || 0,
            open_incidents: recentIncidents?.filter((i: any) => i.status !== 'closed').length || 0,
            candidates_count: candidates?.length || 0,
            sessions_count: recentSessions?.length || 0,
            staff_count: staff?.length || 0,
            vault_docs_count: vault?.length || 0,
            notices_count: notices?.length || 0,
            posts_count: posts?.length || 0,
            lost_found_count: lostFound?.length || 0,
            pending_leaves: leaves?.filter((l: any) => l.status === 'pending').length || 0
        },
        
        // Exam intelligence
        exam_intelligence: {
            statistics: examStats,
            candidate_breakdown: candidates?.reduce((acc: any, c: any) => {
                const type = c.exam_name || 'Unknown';
                acc[type] = (acc[type] || 0) + 1;
                return acc;
            }, {}) || {},
            session_capacity: recentSessions?.reduce((acc: any, s: any) => {
                const type = s.type || s.exam_type || s.session_type || 'General';
                acc[type] = (acc[type] || 0) + (s.capacity || s.max_capacity || 0);
                return acc;
            }, {}) || {}
        },
        
        // Future outlook
        future_outlook: {
            upcoming_sessions_count: futureSessions?.length || 0,
            upcoming_sessions: futureSessions?.slice(0, 10).map((s: any) => ({
                date: s.date,
                type: s.type || s.exam_type || s.session_type,
                branch: s.branch || s.branch_location,
                capacity: s.capacity || s.max_capacity
            })) || []
        },
        
        // Real-time state
        realtime_state: {
            active_sessions: currentSessions?.length || 0,
            online_personnel: onlineStaff?.length || 0,
            online_staff: onlineStaff?.map((s: any) => s.full_name) || [],
            branch_status: branchStatus || []
        },
        
        // Recent incidents (for detailed queries)
        recent_incidents: recentIncidents?.slice(0, 10).map((i: any) => ({
            title: i.title || i.incident_type,
            status: i.status,
            date: i.created_at
        })) || [],
        
        // Recent notices
        recent_notices: notices?.slice(0, 5).map((n: any) => ({
            title: n.title,
            date: n.created_at
        })) || [],
        
        // Vault summary
        vault_summary: vault?.slice(0, 10).map((v: any) => ({
            title: v.title,
            category: v.category
        })) || []
    };
}

/**
 * Process comprehensive exam statistics
 */
function processExamStatistics(candidates: any[], sessions: any[], futureSessions: any[]) {
    const examTypeMap: Record<string, { conducted: number; registered: number; scheduled: number }> = {};
    
    // Process registered candidates by exam type
    candidates.forEach((c: any) => {
        const examType = c.exam_name || 'Unknown';
        if (!examTypeMap[examType]) {
            examTypeMap[examType] = { conducted: 0, registered: 0, scheduled: 0 };
        }
        examTypeMap[examType].registered += 1;
    });
    
    // Count scheduled sessions by exam type
    sessions.forEach((s: any) => {
        const examType = s.type || s.exam_type || s.session_type || 'General';
        if (!examTypeMap[examType]) {
            examTypeMap[examType] = { conducted: 0, registered: 0, scheduled: 0 };
        }
        examTypeMap[examType].scheduled += (s.capacity || s.max_capacity || 0);
    });
    
    // Future sessions
    futureSessions.forEach((s: any) => {
        const examType = s.type || s.exam_type || s.session_type || 'General';
        if (!examTypeMap[examType]) {
            examTypeMap[examType] = { conducted: 0, registered: 0, scheduled: 0 };
        }
        examTypeMap[examType].scheduled += (s.capacity || s.max_capacity || 0);
    });
    
    return Object.entries(examTypeMap).map(([examType, stats]) => ({
        examType,
        ...stats,
        total: stats.conducted + stats.registered + stats.scheduled
    }));
}

export async function askClaude(userPrompt: string, userProfile?: any) {
    const apiKey = getClaudeApiKey();

    if (!apiKey || apiKey === 'undefined' || apiKey.length < 10) {
        console.error("❌ CRITICAL: VITE_ANTHROPIC_API_KEY is missing or invalid.");
        throw new Error("System Alert: Claude Neural Key is missing. Please check your system configuration.");
    }

    try {
        console.log("🚀 FETS OMNI: Initiating optimized data sweep with Claude...");
        
        // Fetch summarized data only
        const summaryData = await fetchSummarizedData();
        
        const contextData = {
            metadata: {
                timestamp: summaryData.metadata.timestamp,
                today: summaryData.today,
                operator: userProfile?.full_name || 'System Administrator'
            },
            
            // Aggregates
            aggregates: summaryData.historical_summary,
            
            // Exam Intelligence
            exam_intelligence: summaryData.exam_intelligence,
            
            // Future
            future: summaryData.future_outlook,
            
            // Real-time
            realtime: summaryData.realtime_state,
            
            // Recent data for detailed queries
            recent: {
                incidents: summaryData.recent_incidents,
                notices: summaryData.recent_notices,
                vault: summaryData.vault_summary
            }
        };

        const systemInstruction = `
            You are FETS INTELLIGENCE v12.0 "OMNI" - The Supreme Machine Intelligence of the FETS.LIVE Ecosystem.
            
            [ORGANIZATIONAL CONTEXT]
            FETS is a premier examination center network with branches in Calicut, Cochin, and Kannur, India.
            We conduct exams for: Prometric (CMA US, CIA, CPA, EA), Pearson VUE (CELPIP, PTE), PSI.
            
            [EXAM SYNONYMS]
            - CMA US = CMA USA = CMA = Certified Management Accountant (USA) - PROMETRIC
            - CIA = Certified Internal Auditor - PROMETRIC
            - CPA = Certified Public Accountant - PROMETRIC
            - EA = Enrolled Agent - PROMETRIC
            - CELPIP = Canadian English Language Proficiency Index Test - PEARSON VUE
            - PTE = Pearson Test of English - PEARSON VUE
            
            [YOUR CAPABILITIES]
            - Answer questions about exams, candidates, staff, sessions, incidents, vault, notices
            - Provide statistics and trends
            - Answer based on the summarized data provided
            
            [DATA]
            ${JSON.stringify(contextData, null, 2)}
            
            [RESPONSE STYLE]
            - Be concise and direct
            - Provide numbers and counts
            - Use bullet points
            - Speak as the operational brain of FETS
            
            [IMPORTANT]
            If asked about details beyond the summarized data, acknowledge that you have summary information but may not have full details.
            
            Current Time: ${contextData.metadata.timestamp}
            Today: ${contextData.metadata.today}
            Operator: ${contextData.metadata.operator}
            
            Answer the user's question based on the data above.
        `;

        console.log("🧠 Claude: Processing query (optimized)...");
        const response = await callClaudeAPI(apiKey, `${systemInstruction}\n\nUSER: ${userPrompt}`);
        console.log("✅ Claude: Response generated successfully");
        
        return response;

    } catch (error: any) {
        console.error("❌ FETS OMNI EXCEPTION:", error);

        if (error.message?.includes("API key")) {
            throw new Error("Neural Link Denied: API Key Verification Failed.");
        }
        
        if (error.message?.includes("rate limit")) {
            throw new Error("Claude is at rate limit. Please wait a moment and try again.");
        }

        throw new Error(`Neural Engine Malfunction: ${error.message || "Unknown Core Error"}`);
    }
}
