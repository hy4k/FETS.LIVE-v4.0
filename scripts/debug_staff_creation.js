
const SUPABASE_URL = 'https://qqewusetilxxfvfkmsed.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxZXd1c2V0aWx4eGZ2Zmttc2VkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzNjI2NTUsImV4cCI6MjA3MDkzODY1NX0.-x783XXpilPWC3O-cJqmdSTmhpAvObk_MSElfGdrU8s';

async function testFunction() {
    const url = `${SUPABASE_URL}/functions/v1/create-staff-user`;

    const payload = {
        email: `debug.user.${Date.now()}@example.com`,
        password: 'password123',
        full_name: 'Debug User JS',
        role: 'staff',
        department: 'IT',
        base_centre: 'calicut',
        branch_location: 'calicut'
    };

    console.log(`Calling ${url}...`);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ANON_KEY}`
            },
            body: JSON.stringify(payload)
        });

        console.log(`Status: ${response.status} ${response.statusText}`);
        const text = await response.text();
        console.log('Body:', text);
    } catch (error) {
        console.error('Fetch error:', error);
    }
}

testFunction();
