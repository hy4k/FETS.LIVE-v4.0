// Shared Supabase client for Edge Functions
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0'

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? 'https://qqewusetilxxfvfkmsed.supabase.co'
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

// Use service role key for full database access in Edge Functions
export const supabase = createClient(supabaseUrl, supabaseServiceKey)

export { supabaseUrl }
