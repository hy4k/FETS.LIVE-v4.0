
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = 'https://qqewusetilxxfvfkmsed.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSchema() {
    const { data, error } = await supabase
        .from('staff_profiles')
        .select('*')
        .limit(1)

    if (error) {
        console.error('Error fetching staff_profiles:', error)
    } else {
        console.log('Sample staff_profile record:', data[0])
        console.log('Columns:', Object.keys(data[0] || {}))
    }
}

checkSchema()
