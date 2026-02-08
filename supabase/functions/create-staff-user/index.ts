import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Validate environment
        const supabaseUrl = Deno.env.get('SUPABASE_URL')
        const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

        if (!supabaseUrl || !supabaseServiceRoleKey) {
            throw new Error('Supabase environment variables are not set')
        }

        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        })

        // Parse request body
        const payload = await req.json()
        console.log('Received payload:', JSON.stringify(payload, null, 2))

        const { email, password, full_name, role, department, base_centre, branch_location, ...rest } = payload

        if (!email || !password || !full_name) {
            return new Response(
                JSON.stringify({ success: false, error: 'Email, password, and full name are required.' }),
                { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // 1. Create the Auth user
        console.log(`Creating auth user for ${email}...`)
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                full_name,
                role,
                department,
                base_centre,
                branch_location,
                ...rest
            }
        })

        if (userError) {
            console.error('Auth user creation error:', userError)
            return new Response(
                JSON.stringify({ success: false, error: userError.message }),
                { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const userId = userData.user.id
        console.log(`Auth user created with ID: ${userId}`)

        // 2. Create the Staff Profile (Using Raw REST to bypass schema cache issues)
        console.log('Creating staff profile (via REST)...')
        const profileData = {
            id: userId,
            user_id: userId,
            full_name,
            email,
            role,
            department,
            base_centre,
            branch_location,
            ...rest,
            created_at: new Date().toISOString()
        }

        const profileResp = await fetch(`${supabaseUrl}/rest/v1/staff_profiles`, {
            method: 'POST',
            headers: {
                'apikey': supabaseServiceRoleKey,
                'Authorization': `Bearer ${supabaseServiceRoleKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(profileData)
        })

        if (!profileResp.ok) {
            const errorText = await profileResp.text()
            console.error('Staff profile creation error (REST):', errorText)

            // Rollback: Delete the auth user if profile creation fails
            console.log('Rolling back: deleting auth user...')
            await supabaseAdmin.auth.admin.deleteUser(userId)

            let errorMsg = `Failed to create profile: ${errorText}`
            if (errorText.includes("schema cache")) {
                errorMsg = `Failed to create profile: Database schema cache is stale. Please go to Supabase SQL Editor and run: NOTIFY pgrst, 'reload schema'`
            }

            return new Response(
                JSON.stringify({
                    success: false,
                    error: errorMsg
                }),
                { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const profileResult = await profileResp.json()
        console.log('Staff user and profile created successfully!')

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Staff member created successfully',
                data: {
                    user: userData.user,
                    profile: profileResult
                }
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error: any) {
        console.error('Unexpected error:', error)
        return new Response(
            JSON.stringify({ success: false, error: error.message || 'An unexpected error occurred' }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
