
const SUPABASE_URL = 'https://qqewusetilxxfvfkmsed.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxZXd1c2V0aWx4eGZ2Zmttc2VkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzNjI2NTUsImV4cCI6MjA3MDkzODY1NX0.-x783XXpilPWC3O-cJqmdSTmhpAvObk_MSElfGdrU8s';

async function checkTable() {
    const url = `${SUPABASE_URL}/rest/v1/staff_profiles?select=*&limit=1`;
    console.log(`Checking table at ${url}...`);

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${ANON_KEY}`,
                'apikey': ANON_KEY
            }
        });

        console.log(`Status: ${response.status} ${response.statusText}`);
        const text = await response.text();
        console.log('Body:', text);
    } catch (error) {
        console.error('Fetch error:', error);
    }
}

checkTable();
