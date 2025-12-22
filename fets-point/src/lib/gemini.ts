import { supabase } from './supabase';

const GEMINI_API_KEY = import.meta.env.VITE_AI_API_KEY;
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

export async function askGemini(userPrompt: string) {
    // Re-check key at runtime to be safe
    const apiKey = import.meta.env.VITE_AI_API_KEY;

    // Strict validation
    if (!apiKey || apiKey === 'undefined' || apiKey.length < 10) {
        console.error("Gemini API Key Check Failed. Value:", apiKey);
        throw new Error("AI API Key is missing or invalid in environment variables.");
    }

    console.log("Calling Gemini API with Key Prefix:", apiKey.substring(0, 5) + "...");

    // 1. Gather Context from Supabase
    // We fetch a summary of relevant data to feed the AI so it can answer grounded questions.

    // A. Fetch today's/tomorrow's exams
    const today = new Date().toISOString().split('T')[0];
    const { data: events } = await (supabase as any)
        .from('events')
        .select('title, category, branch, priority, status, created_at')
        .or(`status.eq.open,created_at.gte.${today}`)
        .limit(10);

    // B. Fetch System Health
    const { data: health } = await (supabase as any).from('system_health_metrics').select('*');

    // C. Fetch News
    const { data: news } = await (supabase as any).from('news').select('content, priority').limit(5);

    // Construct Context String
    const context = `
    You are FETS Intelligence, the AI brain of the FETS.LIVE exam operations platform.
    Current System Time: ${new Date().toLocaleString()}
    
    [REAL-TIME DATA CONTEXT]
    
    1. Active Incidents/Events:
    ${events && events.length > 0 ? JSON.stringify(events) : "No active incidents reported."}

    2. System Health Metrics:
    ${health ? JSON.stringify(health) : "Metrics unavailable."}

    3. Latest News/Broadcasts:
    ${news ? JSON.stringify(news) : "No news."}

    4. General Knowledge:
    - FETS operates in Calicut, Cochin, and Trivandrum.
    - If asked about "exam schedule", and no specific data is in the 'Active Incidents' list above, you should say "I don't have access to the full exam roster right now, but I can check the Operations Log." OR generate a *realistic* simulation based on standard patterns if the user asks for a simulation (e.g., "Usually, Morning sessions start at 9 AM").
    - Be professional, concise, and futuristic.
  `;

    // 2. Call Gemini API (Using Header for Auth)
    // Note: Removed ?key= param to rely on header
    const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-001:generateContent";

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
            contents: [{
                parts: [{
                    text: `Context: ${context}\n\nUser Query: ${userPrompt}\n\nAnswer:`
                }]
            }]
        }),
    });

    if (!response.ok) {
        const err = await response.text();
        console.error("Gemini API Error Response:", err);

        if (response.status === 401) {
            throw new Error("Authentication Failed. Please verify VITE_AI_API_KEY is set in Coolify Build Settings (and Redeploy).");
        }
        throw new Error(`Gemini API Error: ${err}`);
    }

    const data = await response.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || "I processed the data but couldn't generate a clear response.";
}
