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

export async function askGemini(userPrompt: string) {
    const apiKey = getApiKey();

    if (!apiKey || apiKey === 'undefined' || apiKey.length < 10) {
        console.error("❌ CRITICAL: VITE_AI_API_KEY is missing or invalid.");
        throw new Error("System Alert: AI Neural Key is missing. Please check your system configuration.");
    }

    const today = new Date().toISOString().split('T')[0];

    try {
        // Parallel Data Fetching
        console.log("📡 Gathering Operational Context...");

        const [
            events, sessions, incidents, candidates, staff,
            roster, vault, notices, posts, branch
        ] = await Promise.all([
            safeFetch(supabase.from('events').select('*').order('created_at', { ascending: false }).limit(20), 'events'),
            safeFetch(supabase.from('sessions').select('*').eq('date', today), 'sessions'),
            safeFetch(supabase.from('incidents').select('*').or(`status.neq.closed,updated_at.gte.${today}`).limit(20), 'incidents'),
            safeFetch(
                supabase.from('candidates')
                    .select('full_name, exam_name, exam_date, status, branch_location, phone, confirmation_number')
                    .gte('exam_date', today)
                    .order('exam_date', { ascending: true })
                    .limit(50),
                'candidates'
            ),
            safeFetch(supabase.from('staff_profiles').select('full_name, role, department, is_online, email, phone'), 'staff_profiles'),
            safeFetch(supabase.from('roster_schedules').select('*, staff_profiles(full_name)').eq('date', today), 'roster_schedules'),
            safeFetch(supabase.from('fets_vault').select('title, category, username, site_id').limit(50), 'fets_vault'),
            safeFetch(supabase.from('notices').select('*').limit(10), 'notices'),
            safeFetch(supabase.from('social_posts').select('content, created_at').order('created_at', { ascending: false }).limit(10), 'social_posts'),
            safeFetch(supabase.from('branch_status').select('*'), 'branch_status')
        ]);

        const contextData = {
            timestamp: new Date().toLocaleString(),
            active_events: events,
            exam_sessions_today: sessions,
            active_incidents: incidents,
            upcoming_candidates: candidates,
            staff_directory: staff,
            todays_roster: roster,
            vault_assets_index: vault,
            public_notices: notices,
            recent_chatter: posts,
            branch_status: branch
        };

        const systemInstruction = `
            You are FETS Intelligence (v6.0 - Nano Banana Edition), the omniscient central AI of FETS.LIVE.
            
            [YOUR CAPABILITIES]
            1. You have complete visibility of the current operation (Roster, Exams, Candidates, Incidents).
            2. You MUST answer specific questions like "Who is working today?" or "Is John Doe registering?" using the data provided below.
            3. If user asks "System check", perform a self-diagnostic based on the data available.
            4. Be concise, professional, but slightly witty if the vibe permits.
            5. Current Time: ${new Date().toLocaleString()}

            [LIVE DATA CONTEXT]
            ${JSON.stringify(contextData, null, 2)}
            
             [RESPONSE PROTOCOL]
            - Answer directly based on the JSON data above.
            - If data is missing, admit it.
        `;

        // Initialize Google Generative AI
        console.log("🚀 Connecting to Neural Core...");
        const genAI = new GoogleGenerativeAI(apiKey);

        // ROBUST MODEL SELECTOR
        // If one model fails (e.g. 404 Not Found), we automatically try the next.
        const modelPriorityList = [
            "gemini-2.5-flash",        // User Requested
            "gemini-2.0-flash-exp",    // Cutting Edge Experimental
            "gemini-1.5-flash",        // Stable Standard
            "gemini-1.5-flash-001",
            "gemini-1.5-pro",
            "gemini-pro"
        ];

        let lastError = null;

        for (const modelId of modelPriorityList) {
            try {
                console.log(`🔄 Attempting neural link with: ${modelId}`);
                const model = genAI.getGenerativeModel({ model: modelId });

                const result = await model.generateContent([
                    systemInstruction,
                    `User Query: ${userPrompt}`
                ]);

                const response = await result.response;
                const text = response.text();

                if (text) {
                    console.log(`✅ Neural Link Established (${modelId})`);
                    return text;
                }
            } catch (error: any) {
                console.warn(`⚠️ Model [${modelId}] failed:`, error.message);
                lastError = error;
                // If the key itself is invalid, no model will work. Stop trying.
                if (error.message?.includes("API key")) break;
            }
        }

        // If loop finishes without success
        throw lastError || new Error("All Neural Channels Unresponsive.");

    } catch (error: any) {
        console.error("❌ CRITICAL AI ERROR DETAILS:", error);

        // User Friendly Error Translation
        if (error.message?.includes("API key")) {
            throw new Error("Neural Link Denied: API Key Rejected.");
        }
        if (error.message?.includes("404")) {
            throw new Error("Neural Link Error: Model definitions out of date.");
        }

        throw new Error(`Neural Engine Malfunction: ${error.message || "Unknown Core Error"}`);
    }
}
