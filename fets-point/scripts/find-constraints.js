import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://qqewusetilxxfvfkmsed.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxZXd1c2V0aWx4eGZ2Zmttc2VkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzNjI2NTUsImV4cCI6MjA3MDkzODY1NX0.-x783XXpilPWC3O-cJqmdSTmhpAvObk_MSElfGdrU8s";

const supabase = createClient(supabaseUrl, supabaseKey);

async function findConstraints() {
  console.log("🔍 Finding constraints...");

  const testData = {
    calendar_sessions: [
      "date,client_name,exam_name,branch_location",
      "date,client_name,exam_name",
      "id",
    ],
    candidates: [
      "full_name,exam_date,branch_location",
      "full_name,exam_date",
      "id",
    ],
  };

  for (const table in testData) {
    console.log(`\n--- Testing ${table} ---`);
    for (const cols of testData[table]) {
      try {
        const { error } = await supabase
          .from(table)
          .upsert({}, { onConflict: cols });

        if (
          error &&
          error.message.includes(
            "there is no unique or exclusion constraint matching"
          )
        ) {
          console.log(`❌ [${cols}]: NO MATCH`);
        } else {
          console.log(
            `✅ [${cols}]: MATCH! (Error: ${error?.message || "None"})`
          );
        }
      } catch (err) {
        console.log(`❌ [${cols}]: EXCEPTION ${err.message}`);
      }
    }
  }
}

findConstraints().catch(console.error);
