import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://qqewusetilxxfvfkmsed.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxZXd1c2V0aWx4eGZ2Zmttc2VkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzNjI2NTUsImV4cCI6MjA3MDkzODY1NX0.-x783XXpilPWC3O-cJqmdSTmhpAvObk_MSElfGdrU8s";

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugCandidates() {
  console.log("🔍 Testing candidates constraints...");
  const tests = [
    "full_name,exam_date,branch_location",
    "full_name,exam_date",
    "full_name,branch_location",
    "id",
  ];

  for (const cols of tests) {
    const { error } = await supabase
      .from("candidates")
      .upsert({}, { onConflict: cols });
    if (
      error &&
      error.message.includes(
        "there is no unique or exclusion constraint matching"
      )
    ) {
      console.log(`❌ [${cols}]: NO MATCH`);
    } else {
      console.log(`✅ [${cols}]: MATCH!! (Error: ${error?.message})`);
    }
  }
}

debugCandidates().catch(console.error);
