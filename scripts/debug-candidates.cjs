const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://qqewusetilxxfvfkmsed.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxZXd1c2V0aWx4eGZ2Zmttc2VkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzNjI2NTUsImV4cCI6MjA3MDkzODY1NX0.-x783XXpilPWC3O-cJqmdSTmhpAvObk_MSElfGdrU8s'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkColumns() {
  console.log('🔍 Checking columns of candidates table...\n')

  try {
    // We can't query information_schema via standard supabase client easily 
    // but we can try to select one row and see what keys it has.
    const { data, error } = await supabase
      .from('candidates')
      .select('*')
      .limit(1)

    if (error) {
      console.error('❌ Error details:', error)
    } else if (data && data.length > 0) {
      console.log('✅ Columns found:', Object.keys(data[0]).join(', '))
    } else {
      console.log('ℹ️ No records found, trying to trigger a column error to see schema...')
      const { error: err2 } = await supabase
        .from('candidates')
        .select('non_existent_column_for_debug')
      console.log('Schema hint:', err2?.message)
    }
  } catch (err) {
    console.error('❌ Exception:', err.message)
  }
}

checkColumns().catch(console.error)
