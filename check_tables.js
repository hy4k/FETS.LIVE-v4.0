
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = 'https://qqewusetilxxfvfkmsed.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSchema() {
    const { data: pData, error: pError } = await supabase.from('profiles').select('*').limit(1)
    const { data: sData, error: sError } = await supabase.from('staff_profiles').select('*').limit(1)

    if (pError) console.error('Error fetching profiles:', pError.message)
    else console.log('Profiles sample:', pData[0])

    if (sError) console.error('Error fetching staff_profiles:', sError.message)
    else console.log('Staff Profiles sample:', sData[0])
}

checkSchema()
