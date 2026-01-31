/**
 * FETS Intelligence v15.0 - "SUPREME OMNI" Edition
 * Ultra-Powered AI with ALL-TIME Historical Data, Real-Time Updates & Exam Mastery
 */

import { supabase } from './supabase';

const getClaudeApiKey = () => import.meta.env.VITE_ANTHROPIC_API_KEY;

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
            max_tokens: 4096,
            messages: [{ role: "user", content: prompt }]
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
 * Advanced Query Parser for Complex Natural Language Questions
 */
export function parseAdvancedQuery(query: string) {
    const queryLower = query.toLowerCase();
    
    // Parse date ranges
    const datePatterns = [
        /(\d{1,2}\s+(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{4})/i,
        /(\d{4}-\d{2}-\d{2})/,
        /(\d{1,2}\/\d{1,2}\/\d{4})/,
        /(last|this|next)\s+(day|week|month|year)/i,
        /(between|from)\s+(\d{1,2}\/\d{1,2}\/\d{4})\s+(to|and)\s+(\d{1,2}\/\d{1,2}\/\d{4})/i,
        /(since|before|after)\s+(\d{1,2}\s+\w+\s+\d{4})/i,
        /(yesterday|today|tomorrow)/i
    ];
    
    let dateRange: { start?: string; end?: string } | null = null;
    
    for (const pattern of datePatterns) {
        const match = query.match(pattern);
        if (match) {
            if (match[1]?.includes('last') || match[1]?.includes('this') || match[1]?.includes('next')) {
                const now = new Date();
                if (match[2] === 'day') {
                    dateRange = { 
                        start: new Date(now.setDate(now.getDate() - 7)).toISOString().split('T')[0],
                        end: new Date().toISOString().split('T')[0]
                    };
                } else if (match[2] === 'week') {
                    dateRange = { 
                        start: new Date(now.setDate(now.getDate() - 7)).toISOString().split('T')[0],
                        end: new Date().toISOString().split('T')[0]
                    };
                } else if (match[2] === 'month') {
                    dateRange = { 
                        start: new Date(now.setMonth(now.getMonth() - 1)).toISOString().split('T')[0],
                        end: new Date().toISOString().split('T')[0]
                    };
                } else if (match[2] === 'year') {
                    dateRange = { 
                        start: new Date(now.setFullYear(now.getFullYear() - 1)).toISOString().split('T')[0],
                        end: new Date().toISOString().split('T')[0]
                    };
                }
            } else if (match[0].includes('between') || match[0].includes('from')) {
                const startDate = new Date(match[2]);
                const endDate = new Date(match[4]);
                if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
                    dateRange = {
                        start: startDate.toISOString().split('T')[0],
                        end: endDate.toISOString().split('T')[0]
                    };
                }
            } else {
                const dateObj = new Date(match[1] || match[0]);
                if (!isNaN(dateObj.getTime())) {
                    dateRange = {
                        start: dateObj.toISOString().split('T')[0],
                        end: dateObj.toISOString().split('T')[0]
                    };
                }
            }
            break;
        }
    }
    
    // Parse branches
    const branches = ['calicut', 'cochin', 'kannur', 'trivandrum', 'thiruvananthapuram', 'all branches', 'all locations'];
    let targetBranch: string | null = null;
    for (const branch of branches) {
        if (queryLower.includes(branch)) {
            targetBranch = branch;
            break;
        }
    }
    
    // Parse exam types with synonyms
    const examTypes = [
        { names: ['cma us', 'cma usa', 'cma'], type: 'CMA US' },
        { names: ['cia', 'certified internal auditor'], type: 'CIA' },
        { names: ['cpa', 'certified public accountant'], type: 'CPA' },
        { names: ['ea', 'enrolled agent'], type: 'EA' },
        { names: ['celpip'], type: 'CELPIP' },
        { names: ['pte'], type: 'PTE' },
        { names: ['gmat'], type: 'GMAT' },
        { names: ['gre'], type: 'GRE' },
        { names: ['toefl'], type: 'TOEFL' },
        { names: ['ielts'], type: 'IELTS' }
    ];
    let targetExam: string | null = null;
    for (const exam of examTypes) {
        if (exam.names.some(name => queryLower.includes(name))) {
            targetExam = exam.type;
            break;
        }
    }
    
    // Parse query intent
    const queryIntents = [
        { patterns: ['how many', 'count', 'total', 'number of', 'statistics'], intent: 'count' },
        { patterns: ['schedule', 'when', 'date', 'timing', 'upcoming', 'future'], intent: 'schedule' },
        { patterns: ['list', 'show', 'display', 'give me', 'what are'], intent: 'list' },
        { patterns: ['compare', 'difference', 'vs', 'versus', 'comparison'], intent: 'compare' },
        { patterns: ['trend', 'growth', 'increase', 'decrease', 'change over time'], intent: 'trend' },
        { patterns: ['who', 'which candidate', 'candidate details'], intent: 'candidates' },
        { patterns: ['pass rate', 'pass percentage', 'success rate', 'results'], intent: 'results' },
        { patterns: ['revenue', 'income', 'earnings', 'payment', 'fee'], intent: 'revenue' }
    ];
    
    let queryIntent = 'general';
    for (const intent of queryIntents) {
        if (intent.patterns.some(p => queryLower.includes(p))) {
            queryIntent = intent.intent;
            break;
        }
    }
    
    return { dateRange, branch: targetBranch, exam: targetExam, intent: queryIntent };
}

/**
 * Fetch COMPREHENSIVE ALL-TIME Historical Data
 */
async function fetchAllTimeHistoricalData(query: string) {
    const { dateRange, branch, exam, intent } = parseAdvancedQuery(query);
    const results: Record<string, any> = {};
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    // ALL-TIME sessions (no date restriction)
    let allSessionsQuery = supabase.from('calendar_sessions').select('*');
    if (exam) {
        allSessionsQuery = allSessionsQuery.ilike('exam_type', `%${exam}%`);
    }
    if (branch && branch !== 'all branches') {
        allSessionsQuery = allSessionsQuery.or(`branch_location.ilike.%${branch}%,branch.ilike.%${branch}%`);
    }
    
    const { data: allSessions } = await allSessionsQuery;
    if (allSessions && allSessions.length > 0) {
        results.allSessions = allSessions;
        results.totalAllTimeSessions = allSessions.length;
        
        // Group by year
        const byYear: Record<string, number> = {};
        const byMonth: Record<string, number> = {};
        const byBranch: Record<string, number> = {};
        const byExam: Record<string, number> = {};
        
        allSessions.forEach((s: any) => {
            const date = new Date(s.date);
            const year = date.getFullYear().toString();
            const month = `${year}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
            const branchName = s.branch_location || s.branch || 'Unknown';
            const examType = s.exam_type || s.type || 'General';
            
            byYear[year] = (byYear[year] || 0) + 1;
            byMonth[month] = (byMonth[month] || 0) + 1;
            byBranch[branchName] = (byBranch[branchName] || 0) + 1;
            byExam[examType] = (byExam[examType] || 0) + 1;
        });
        
        results.sessionsByYear = byYear;
        results.sessionsByMonth = byMonth;
        results.sessionsByBranch = byBranch;
        results.sessionsByExam = byExam;
        
        // Future sessions
        results.futureSessions = allSessions.filter((s: any) => s.date >= today);
        results.totalFutureSessions = results.futureSessions.length;
        
        // Past sessions
        results.pastSessions = allSessions.filter((s: any) => s.date < today);
        results.totalPastSessions = results.pastSessions.length;
    }
    
    // ALL-TIME candidates
    let allCandidatesQuery = supabase.from('candidates').select('*');
    if (exam) {
        allCandidatesQuery = allCandidatesQuery.ilike('exam_name', `%${exam}%`);
    }
    
    const { data: allCandidates } = await allCandidatesQuery;
    if (allCandidates) {
        results.allCandidates = allCandidates;
        results.totalAllTimeCandidates = allCandidates.length;
        
        const byExam: Record<string, number> = {};
        const byBranch: Record<string, number> = {};
        const byStatus: Record<string, number> = {};
        const byYear: Record<string, number> = {};
        
        allCandidates.forEach((c: any) => {
            const examName = c.exam_name || 'Unknown';
            const branchName = c.branch || c.branch_location || 'Unknown';
            const status = c.status || 'Active';
            const createdDate = new Date(c.created_at);
            const year = createdDate.getFullYear().toString();
            
            byExam[examName] = (byExam[examName] || 0) + 1;
            byBranch[branchName] = (byBranch[branchName] || 0) + 1;
            byStatus[status] = (byStatus[status] || 0) + 1;
            byYear[year] = (byYear[year] || 0) + 1;
        });
        
        results.candidatesByExam = byExam;
        results.candidatesByBranch = byBranch;
        results.candidatesByStatus = byStatus;
        results.candidatesByYear = byYear;
    }
    
    // ALL-TIME incidents
    const { data: allIncidents } = await supabase.from('incidents').select('*');
    if (allIncidents) {
        results.allIncidents = allIncidents;
        results.totalAllTimeIncidents = allIncidents.length;
        
        const byType: Record<string, number> = {};
        const byStatus: Record<string, number> = {};
        const byYear: Record<string, number> = {};
        
        allIncidents.forEach((i: any) => {
            const type = i.type || i.incident_type || 'General';
            const status = i.status || 'Open';
            const createdDate = new Date(i.created_at);
            const year = createdDate.getFullYear().toString();
            
            byType[type] = (byType[type] || 0) + 1;
            byStatus[status] = (byStatus[status] || 0) + 1;
            byYear[year] = (byYear[year] || 0) + 1;
        });
        
        results.incidentsByType = byType;
        results.incidentsByStatus = byStatus;
        results.incidentsByYear = byYear;
    }
    
    // ALL-TIME vault documents
    const { data: allVault } = await supabase.from('fets_vault').select('*').eq('is_deleted', false);
    if (allVault) {
        results.allVault = allVault;
        results.totalVaultDocuments = allVault.length;
        
        const byCategory: Record<string, number> = {};
        allVault.forEach((v: any) => {
            const category = v.category || 'General';
            byCategory[category] = (byCategory[category] || 0) + 1;
        });
        results.vaultByCategory = byCategory;
    }
    
    // ALL-TIME notices
    const { data: allNotices } = await supabase.from('notices').select('*');
    if (allNotices) {
        results.allNotices = allNotices;
        results.totalNotices = allNotices.length;
    }
    
    // ALL-TIME social posts
    const { data: allPosts } = await supabase.from('social_posts').select('*');
    if (allPosts) {
        results.allPosts = allPosts;
        results.totalPosts = allPosts.length;
    }
    
    // Exam-specific knowledge base
    const examKnowledgeBase = {
        'CMA US': {
            conductingBody: 'Institute of Management Accountants (IMA)',
            examFormat: 'Part 1: Financial Planning/Performance/Analytics, Part 2: Strategic Financial Management',
            passingScore: '72%',
            examDuration: '4 hours (2 parts, 2 hours each)',
            questionCount: '100 questions per part',
            examFees: '$695 (IMA members), $845 (non-members)',
            eligibility: 'Bachelor degree + 2 years relevant experience',
            examCycles: 'On-demand at Prometric centers'
        },
        'CIA': {
            conductingBody: 'Institute of Internal Auditors (IIA)',
            examFormat: 'Part 1: Essentials of Internal Auditing, Part 2: Practice of Internal Auditing, Part 3: Business Knowledge',
            passingScore: '75%',
            examDuration: '4 hours (3 parts)',
            questionCount: '100-125 questions per part',
            examFees: '$480 (IIA members)',
            eligibility: 'Bachelor degree or equivalent',
            examCycles: 'On-demand at Pearson VUE centers'
        },
        'CPA': {
            conductingBody: 'American Institute of Certified Public Accountants (AICPA)',
            examFormat: 'AUD (Auditing), BEC (Business Concepts), FAR (Regulation), REG (Taxation)',
            passingScore: '75%',
            examDuration: '4 hours each',
            questionCount: '76-82 questions per section',
            examFees: '$226.15 per section (NASBA)',
            eligibility: '150 college credits + specific accounting credits',
            examCycles: 'Continuous testing windows'
        },
        'EA': {
            conductingBody: 'Internal Revenue Service (IRS)',
            examFormat: 'Part 1: Individuals, Part 2: Business Entities, Part 3: Representation, Practice & Procedures',
            passingScore: '70%',
            examDuration: '3 parts, 3.5 hours total',
            questionCount: '100-120 questions total',
            examFees: 'N/A - No exam fee, enrollment fee only',
            eligibility: 'No formal requirements',
            examCycles: 'On-demand at Prometric centers'
        },
        'CELPIP': {
            conductingBody: 'Paragon Testing Enterprises',
            examFormat: 'Listening, Reading, Writing, Speaking (4 skills)',
            passingScore: '4L+/12 scale',
            examDuration: '3 hours',
            questionCount: 'Multiple task-based questions',
            examFees: '~$300-400',
            eligibility: 'Valid ID',
            examCycles: 'Regular testing dates'
        },
        'PTE': {
            conductingBody: 'Pearson',
            examFormat: 'Speaking/Writing, Reading, Listening (computer-based)',
            passingScore: '42-90 (depends on institution)',
            examDuration: '3 hours',
            questionCount: 'Various question types',
            examFees: '~$200-250',
            eligibility: 'Valid passport',
            examCycles: 'Year-round at Pearson VUE centers'
        }
    };
    
    results.examKnowledge = examKnowledgeBase;
    
    return { 
        historicalData: results, 
        parsedParams: { dateRange, branch, exam, intent },
        metadata: {
            fetchedAt: now.toISOString(),
            dataRange: 'ALL-TIME (unlimited historical)',
            realTimeEnabled: true
        }
    };
}

/**
 * Real-Time Subscription Setup
 */
export function setupRealtimeSubscriptions(callback: (update: any) => void) {
    const subscriptions: any[] = [];
    
    // Subscribe to new sessions
    const sessionSub = supabase
        .channel('sessions-realtime')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'calendar_sessions' }, (payload) => {
            callback({ type: 'NEW_SESSION', data: payload.new });
        })
        .subscribe();
    subscriptions.push(sessionSub);
    
    // Subscribe to new candidates
    const candidateSub = supabase
        .channel('candidates-realtime')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'candidates' }, (payload) => {
            callback({ type: 'NEW_CANDIDATE', data: payload.new });
        })
        .subscribe();
    subscriptions.push(candidateSub);
    
    // Subscribe to incidents
    const incidentSub = supabase
        .channel('incidents-realtime')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'incidents' }, (payload) => {
            callback({ type: 'NEW_INCIDENT', data: payload.new });
        })
        .subscribe();
    subscriptions.push(incidentSub);
    
    // Subscribe to notices
    const noticeSub = supabase
        .channel('notices-realtime')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notices' }, (payload) => {
            callback({ type: 'NEW_NOTICE', data: payload.new });
        })
        .subscribe();
    subscriptions.push(noticeSub);
    
    return () => {
        subscriptions.forEach(sub => supabase.removeChannel(sub));
    };
}

export async function askClaude(userPrompt: string, userProfile?: any) {
    const apiKey = await getClaudeApiKey();
    if (!apiKey) throw new Error("Neural Link Broken: No API key found in environment.");

    try {
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        
        // Fetch COMPREHENSIVE ALL-TIME data + real-time context
        const { historicalData, parsedParams, metadata } = await fetchAllTimeHistoricalData(userPrompt);
        
        // Get current real-time data
        const [currentSessions, futureSessions, onlineStaff, branchStatus] = await Promise.all([
            safeFetch(supabase.from('calendar_sessions').select('*').eq('date', today), 'current_sessions'),
            safeFetch(supabase.from('calendar_sessions').select('*').gte('date', today).order('date', { ascending: true }).limit(50), 'future_sessions'),
            safeFetch(supabase.from('staff_profiles').select('full_name, is_online').eq('is_online', true), 'online_staff'),
            safeFetch(supabase.from('branch_locations').select('*').eq('is_active', true), 'branch_status')
        ]);

        const operator = userProfile?.full_name || userProfile?.name || "Unidentified Operator";

        // Calculate statistics
        const totalRevenue = historicalData.allSessions?.reduce((acc: number, s: any) => acc + (s.fees_collected || s.revenue || 0), 0) || 0;
        
        const sessionCapacity = historicalData.allSessions?.reduce((acc: any, s: any) => {
            const type = s.exam_type || s.type || 'General';
            acc[type] = (acc[type] || 0) + (s.capacity || s.max_capacity || 0);
            return acc;
        }, {}) || {};

        // Build comprehensive context
        const contextData = {
            metadata: {
                timestamp: now.toISOString(),
                today: today,
                operator: operator,
                system: "FETS SUPREME OMNI v15.0",
                capabilities: [
                    "ALL-TIME Historical Data Access",
                    "Real-Time Updates",
                    "Advanced Query Parsing",
                    "Comprehensive Exam Knowledge",
                    "Predictive Analytics",
                    "Cross-Reference Intelligence"
                ],
                dataRange: metadata.dataRange,
                realTimeStatus: "ACTIVE"
            },
            
            // ALL-TIME Historical Statistics
            historical: {
                sessions: {
                    all_time_total: historicalData.totalAllTimeSessions || 0,
                    past_sessions: historicalData.totalPastSessions || 0,
                    future_sessions: historicalData.totalFutureSessions || 0,
                    by_year: historicalData.sessionsByYear || {},
                    by_month: historicalData.sessionsByMonth || {},
                    by_branch: historicalData.sessionsByBranch || {},
                    by_exam: historicalData.sessionsByExam || {}
                },
                
                candidates: {
                    all_time_total: historicalData.totalAllTimeCandidates || 0,
                    by_exam: historicalData.candidatesByExam || {},
                    by_branch: historicalData.candidatesByBranch || {},
                    by_status: historicalData.candidatesByStatus || {},
                    by_year: historicalData.candidatesByYear || {}
                },
                
                incidents: {
                    all_time_total: historicalData.totalAllTimeIncidents || 0,
                    by_type: historicalData.incidentsByType || {},
                    by_status: historicalData.incidentsByStatus || {},
                    by_year: historicalData.incidentsByYear || {}
                },
                
                vault: {
                    total_documents: historicalData.totalVaultDocuments || 0,
                    by_category: historicalData.vaultByCategory || {}
                },
                
                notices: {
                    total: historicalData.totalNotices || 0
                },
                
                posts: {
                    total: historicalData.totalPosts || 0
                },
                
                financials: {
                    total_revenue_estimate: totalRevenue
                }
            },
            
            // Real-time current state
            realtime: {
                today_sessions: currentSessions?.length || 0,
                upcoming_sessions: futureSessions?.slice(0, 10) || [],
                online_staff: {
                    count: onlineStaff?.length || 0,
                    names: onlineStaff?.map((s: any) => s.full_name) || []
                },
                active_branches: branchStatus?.length || 0
            },
            
            // Exam Knowledge Base
            exam_knowledge: historicalData.examKnowledge || {},
            
            // Query-specific dynamic results
            dynamic_query: {
                intent: parsedParams.intent,
                date_range: parsedParams.dateRange,
                branch_filter: parsedParams.branch,
                exam_filter: parsedParams.exam,
                matching_sessions: historicalData.totalAllTimeSessions || 0,
                matching_candidates: historicalData.totalAllTimeCandidates || 0
            },
            
            // Recent activity (last 24 hours)
            recent_activity: {
                last_24h_sessions: currentSessions?.length || 0,
                last_24h_candidates: historicalData.allCandidates?.filter((c: any) => {
                    const created = new Date(c.created_at);
                    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                    return created >= yesterday;
                }).length || 0
            }
        };

        const systemInstruction = `
            You are FETS SUPREME OMNI v15.0 - The Ultimate Machine Intelligence of FETS.LIVE
            
            [SUPER POWERS]
            ✦ You have access to ALL-TIME historical data (no limits)
            ✦ Real-time updates are active
            ✦ Comprehensive exam knowledge base loaded
            ✦ Advanced NLP query understanding enabled
            
            [ORGANIZATIONAL CONTEXT]
            FETS is a premier examination center network with branches in Calicut, Cochin, Kannur, and Trivandrum, India.
            We conduct exams for: Prometric (CMA US, CIA, CPA, EA), Pearson VUE (CELPIP, PTE, GMAT, GRE), PSI.
            
            [EXAM SYNONYMS & DETAILS]
            - CMA US = CMA USA = CMA = Certified Management Accountant (USA) - IMA
            - CIA = Certified Internal Auditor - IIA
            - CPA = Certified Public Accountant - AICPA
            - EA = Enrolled Agent - IRS
            - CELPIP = Canadian English Language Proficiency Index Test - Paragon
            - PTE = Pearson Test of English - Pearson
            - GMAT = Graduate Management Admission Test - GMAC
            - GRE = Graduate Record Examination - ETS
            - TOEFL = Test of English as a Foreign Language - ETS
            - IELTS = International English Language Testing System - British Council/IDP
            
            [CRITICAL - USE THIS DATA]
            
            ALL-TIME STATISTICS:
            ${contextData.historical.sessions.all_time_total ? `- Total Sessions Ever: ${contextData.historical.sessions.all_time_total}` : ''}
            ${contextData.historical.candidates.all_time_total ? `- Total Candidates Ever: ${contextData.historical.candidates.all_time_total}` : ''}
            ${contextData.historical.incidents.all_time_total ? `- Total Incidents Ever: ${contextData.historical.incidents.all_time_total}` : ''}
            ${contextData.historical.financials.total_revenue_estimate ? `- Estimated Total Revenue: ₹${contextData.historical.financials.total_revenue_estimate.toLocaleString()}` : ''}
            
            BY YEAR:
            ${JSON.stringify(contextData.historical.sessions.by_year, null, 2)}
            
            BY EXAM TYPE:
            ${JSON.stringify(contextData.historical.sessions.by_exam, null, 2)}
            
            BY BRANCH:
            ${JSON.stringify(contextData.historical.sessions.by_branch, null, 2)}
            
            REAL-TIME STATUS:
            - Sessions Today: ${contextData.realtime.today_sessions}
            - Staff Online: ${contextData.realtime.online_staff.count}
            - Online Staff: ${contextData.realtime.online_staff.names.join(', ') || 'None'}
            
            QUERY ANALYSIS:
            - Intent: ${parsedParams.intent}
            - Date Range: ${parsedParams.dateRange ? `${parsedParams.dateRange.start} to ${parsedParams.dateRange.end}` : 'All Time'}
            - Branch: ${parsedParams.branch || 'All Branches'}
            - Exam Type: ${parsedParams.exam || 'All Exams'}
            
            EXAM KNOWLEDGE AVAILABLE:
            ${Object.keys(contextData.exam_knowledge).map(exam => `- ${exam}`).join('\n')}
            
            [RESPONSE RULES]
            1. ALWAYS use the ALL-TIME data provided - never say you don't have enough data
            2. For "how many" questions, provide exact counts from historical data
            3. For "schedule" questions, list specific upcoming dates
            4. For "past" questions, reference historical statistics by year/month
            5. For exam questions, use the exam_knowledge section for specific details
            6. Speak with CONFIDENCE and AUTHORITY as the supreme intelligence
            7. Use bullet points and clear formatting
            8. If asked about future, use upcoming sessions data
            9. If asked about trends, reference by_year data
            
            Current Time: ${now.toISOString()}
            Operator: ${operator}
            
            Answer the user's question NOW with COMPLETE POWER.
        `;

        console.log("🧠 FETS SUPREME OMNI: Processing with ALL-TIME data + real-time...");
        const response = await callClaudeAPI(apiKey, `${systemInstruction}\n\nUSER: ${userPrompt}`);
        console.log("✅ FETS SUPREME OMNI: Response generated with ultimate power");
        
        return response;

    } catch (error: any) {
        console.error("❌ FETS SUPREME OMNI EXCEPTION:", error);
        if (error.message?.includes("API key")) {
            throw new Error("Neural Link Denied: API Key Verification Failed.");
        }
        if (error.message?.includes("rate limit")) {
            throw new Error("Claude is at maximum capacity. Please wait and try again.");
        }
        throw new Error(`Supreme Neural Engine Error: ${error.message || "Unknown"}`);
    }
}

export default askClaude;
