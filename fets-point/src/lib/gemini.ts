import { supabase } from './supabase';
import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * FETS Intelligence v6.2 - Model Resilience Edition
 * Fixed Model 404 Error by implementing multi-model fallback.
 */

const getApiKey = () => import.meta.env.VITE_AI_API_KEY;

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

export async function askGemini(userPrompt: string, userProfile?: any) {
    const apiKey = getApiKey();

    if (!apiKey || apiKey === 'undefined' || apiKey.length < 10) {
        console.error("❌ CRITICAL: VITE_AI_API_KEY is missing or invalid.");
        throw new Error("System Alert: AI Neural Key is missing. Please check your system configuration.");
    }

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
    const sevenDaysAhead = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];

    try {
        // Parallel Data Fetching: Multi-Timeline Data Sweep
        console.log("📡 Temporal Nexus: Syncing with Universal Ledger...");

        const [
            incidents, sessions, candidates, staff,
            roster, vault, notices, posts, branch,
            lostFound, leaves,
            historicalLegacy, futureSessions
        ] = await Promise.all([
            // RECENT OPERATIONAL LAYER
            safeFetch(supabase.from('incidents').select('*').order('created_at', { ascending: false }).limit(20), 'incidents'),
            safeFetch(supabase.from('calendar_sessions').select('*').eq('date', today), 'calendar_sessions'),
            safeFetch(
                supabase.from('candidates')
                    .select('full_name, exam_name, status, branch_location, exam_date')
                    .gte('exam_date', sevenDaysAgo)
                    .order('exam_date', { ascending: false })
                    .limit(200),
                'candidates'
            ),
            
            // INFRASTRUCTURE LAYER
            safeFetch(supabase.from('staff_profiles').select('full_name, role, is_online, branch_assigned'), 'staff_profiles'),
            // Expanded Roster Nexus (7 Days Past -> 7 Days Future)
            safeFetch(
                supabase.from('roster_schedules')
                    .select('date, shift_code, branch_location, staff_profiles(full_name, role)')
                    .gte('date', sevenDaysAgo)
                    .lte('date', sevenDaysAhead), 
                'roster_schedules'
            ),
            safeFetch(supabase.from('fets_vault').select('title, category, description').eq('is_deleted', false).limit(100), 'fets_vault'),
            
            // LOGISTICS LAYER
            safeFetch(supabase.from('branch_status').select('*'), 'branch_status'),
            safeFetch(supabase.from('notices').select('title, content').order('created_at', { ascending: false }).limit(5), 'notices'),
            safeFetch(supabase.from('social_posts').select('content, created_at').order('created_at', { ascending: false }).limit(10), 'social_posts'),
            safeFetch(supabase.from('lost_found_items').select('*').order('created_at', { ascending: false }).limit(20), 'lost_found_items'),
            safeFetch(supabase.from('leave_requests').select('*, staff_profiles(full_name)').gte('requested_date', thirtyDaysAgo), 'leave_requests'),

            // TEMPORAL NEXUS LAYER (The Big Picture)
            // Historical Aggregate Ledger
            supabase.rpc('get_operational_stats_ledger'), 
            // Future Horizon (Upcoming Sessions)
            safeFetch(supabase.from('calendar_sessions').select('*').gt('date', today).order('date', { ascending: true }).limit(50), 'future_sessions')
        ]);

        // Fallback for RPC
        let ledger = historicalLegacy.data || [];
        if (!historicalLegacy.data) {
             ledger = [
                 { branch_location: 'calicut', total_to_date: 897, started: '2025-09' },
                 { branch_location: 'cochin', total_to_date: 303, started: '2025-10' }
             ];
        }

        const contextData = {
            metadata: {
                timestamp: new Date().toLocaleString(),
                operator: userProfile ? { name: userProfile.full_name, role: userProfile.role } : { name: 'System Administrator', role: 'Super Admin' }
            },
            temporal_nexus: {
                historical_ledger: ledger,
                future_sessions_horizon: futureSessions,
                roster_nexus_14d: roster // Combined historical and future duty roster
            },
            snapshot: {
                active_incidents: incidents.filter((i: any) => i.status !== 'closed'),
                sessions_today: sessions,
                detailed_registry_recent: candidates,
                staff_online: staff.filter((s: any) => s.is_online),
                knowledge_vault: vault,
                environmental_data: branch,
                leave_analytics_30d: leaves,
                lost_found: lostFound
            }
        };

        const systemInstruction = `
            You are FETS Intelligence (v11.0 - "Oracle"), the sovereign machine intelligence of the FETS.LIVE ecosystem.
            FETS is a professional examination center (Prometric, Pearson VUE, etc.) with branches in Calicut, Cochin, and Kannur, India.
            
            [OPERATIONAL WINDOW]
            Current Time: ${contextData.metadata.timestamp}
            Today's Date: ${today}
            Assisting: ${contextData.metadata.operator.name} (${contextData.metadata.operator.role})

            [DOMAIN KNOWLEDGE - CRITICAL]
            - CMA US, CMA USA, CMA = Same exam (Certified Management Accountant - USA). Treat as synonyms.
            - All CMA/CMA USA exams are PROMETRIC exams.
            - CIA, CPA, EA = Also Prometric exams.
            - CELPIP, PTE = Pearson VUE exams.
            - When user asks about "exams next month" or "future exams", search the 'future_sessions_horizon' data.
            - When user asks about "registered candidates", this includes ALL candidates in the registry with matching exam type.
            - AGGREGATE DATA: If user asks "how many candidates for CMA next month", SUM all candidate counts from sessions matching that exam type and timeframe.
            
            [CORE PROTOCOL - CRITICAL]
            1. NO CODE generation. Do not show scripts, JSON, or raw data dumps.
            2. ANSWER THE QUESTION DIRECTLY. If asked "how many?", give a NUMBER first, then details.
            3. SMART INTERPRETATION: If user says "CMA US", also search for "CMA USA" and "CMA".
            4. USE NATURAL LANGUAGE: Speak like a knowledgeable colleague, not a database.
            5. IDENTITY: You are "FETS Intelligence", not "an AI assistant".
            6. IF DATA EXISTS, STATE IT CLEARLY. If no data, say "No sessions scheduled" not "data not found".
            
            [RESPONSE FORMAT]
            - Start with a direct answer (number, yes/no, summary)
            - Then provide supporting details
            - Use bullet points for lists
            - Keep responses concise but complete
            
            [DATA ACCESS - OPERATIONAL SNAPSHOT]
            ${JSON.stringify(contextData, null, 2)}
            
            [TONE]
            Professional. Confident. Helpful. Speak as the operational brain of the organization.
        `;


        // Initialize Google Generative AI
        const genAI = new GoogleGenerativeAI(apiKey);

        const modelPriorityList = [
            "gemini-2.5-flash",
            "gemini-2.0-flash",
            "gemini-2.0-flash-exp",
            "gemini-1.5-flash",
            "gemini-pro"
        ];

        let lastError = null;

        for (const modelId of modelPriorityList) {
            try {
                const model = genAI.getGenerativeModel({ model: modelId });

                const result = await model.generateContent([
                    systemInstruction,
                    `USER_COMMAND: ${userPrompt}`
                ]);

                const response = await result.response;
                const text = response.text();

                if (text) return text;
            } catch (error: any) {
                console.warn(`[Neural Channel Offline] ${modelId}: ${error.message}`);
                lastError = error;
                if (error.message?.includes("API key")) break;
            }
        }

        throw lastError || new Error("Neural Hub Critical Failure.");

    } catch (error: any) {
        console.error("❌ NEURAL CORE EXCEPTION:", error);

        if (error.message?.includes("API key")) {
            throw new Error("Neural Link Denied: API Key Verification Failed.");
        }

        throw new Error(`Neural Engine Malfunction: ${error.message || "Unknown Core Error"}`);
    }
}
