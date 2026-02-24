import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://qqewusetilxxfvfkmsed.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxZXd1c2V0aWx4eGZ2Zmttc2VkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzNjI2NTUsImV4cCI6MjA3MDkzODY1NX0.-x783XXpilPWC3O-cJqmdSTmhpAvObk_MSElfGdrU8s";

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugSchema() {
  console.log("🔍 Querying pg_indexes for candidates and calendar_sessions...");

  try {
    // Standard supabase client can't query pg_indexes directly usually due to permissions
    // but we can try via a select on a system view if not restricted, or just try common names.

    // Let's try to find a row and see if it has 'confirmation_number' or similar.
    const { data: cand } = await supabase
      .from("candidates")
      .select("*")
      .limit(1);
    if (cand && cand.length > 0) {
      console.log("Candidate keys:", Object.keys(cand[0]));
    }

    const { data: sess } = await supabase
      .from("calendar_sessions")
      .select("*")
      .limit(1);
    if (sess && sess.length > 0) {
      console.log("Session keys:", Object.keys(sess[0]));
    }

    // Try common Cochin format keys
    const testConstraints = [
      { table: "candidates", cols: "full_name,exam_date,branch_location" },
      { table: "candidates", cols: "full_name,exam_name,exam_date" },
      { table: "candidates", cols: "id" },
      {
        table: "calendar_sessions",
        cols: "date,client_name,exam_name,branch_location",
      },
      { table: "calendar_sessions", cols: "date,client_name,exam_name" },
      { table: "calendar_sessions", cols: "id" },
    ];

    for (const test of testConstraints) {
      const { error } = await supabase
        .from(test.table)
        .upsert({}, { onConflict: test.cols });
      if (
        error &&
        error.message.includes(
          "there is no unique or exclusion constraint matching"
        )
      ) {
        console.log(`❌ ${test.table} [${test.cols}]: NO MATCH`);
      } else {
        console.log(
          `✅ ${test.table} [${test.cols}]: MATCH (or RLS/other error: ${error?.message})`
        );
      }
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

debugSchema().catch(console.error);
