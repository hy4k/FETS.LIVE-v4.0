# Environment Setup for FETS Intelligence

Your system is missing the required API keys for the AI to function.

PLEASE PERFORM THE FOLLOWING STEPS:

1.  **Create a new file** in the `fets-point` folder named: `.env`
2.  **Copy and paste** the following code block into that file.
3.  **Replace** `YOUR_GEMINI_API_KEY_HERE` with your actual Google Gemini API Key.

```env
VITE_SUPABASE_URL=https://qqewusetilxxfvfkmsed.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxZXd1c2V0aWx4eGZ2Zmttc2VkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzNjI2NTUsImV4cCI6MjA3MDkzODY1NX0.-x783XXpilPWC3O-cJqmdSTmhpAvObk_MSElfGdrU8s
VITE_AI_API_KEY=YOUR_GEMINI_API_KEY_HERE
```

4.  **Save the file.**
5.  **Restart your server** (stop the terminal running `npm run dev` and run it again).

The AI will effectively remain offline until this key is provided environment variable file is present.
