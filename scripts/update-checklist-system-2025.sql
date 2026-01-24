-- Update Checklist system for 2025 requirements
-- 1. Add attachments column to checklist_submissions if it doesn't exist
ALTER TABLE checklist_submissions 
ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '{}'::jsonb;

-- 2. Update RLS policies to restrict template management to super_admins
-- Drop existing policies first
DROP POLICY IF EXISTS "Allow insert access to authenticated users" ON checklist_templates;
DROP POLICY IF EXISTS "Allow update access to authenticated users" ON checklist_templates;
DROP POLICY IF EXISTS "Allow delete access to authenticated users" ON checklist_templates;

-- Create restrictive policies (assuming we have a way to check role in staff_profiles)
-- Note: Using a subquery on staff_profiles. Use a function for performance in production.
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM staff_profiles 
    WHERE user_id = auth.uid() AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "Allow super_admin to insert templates" ON checklist_templates
    FOR INSERT
    TO authenticated
    WITH CHECK (is_super_admin());

CREATE POLICY "Allow super_admin to update templates" ON checklist_templates
    FOR UPDATE
    TO authenticated
    USING (is_super_admin());

CREATE POLICY "Allow super_admin to delete templates" ON checklist_templates
    FOR DELETE
    TO authenticated
    USING (is_super_admin());

-- 3. Deactivate existing templates from today onwards (optional, but requested to keep old data same)
-- We mark them as is_active = false if they are not the new defaults
UPDATE checklist_templates SET is_active = false WHERE is_active = true;

-- 4. Insert Default Template A: Pre-Exam Checklist (Morning)
INSERT INTO checklist_templates (id, title, description, type, questions, is_active, created_by)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Pre-Exam Checklist (Morning)',
    'Daily operational readiness protocol for morning shift opening.',
    'pre_exam',
    '[
        {"id": "pre_1_1", "section": "DVR & CCTV Verification", "text": "Site Code", "type": "text", "required": true, "attachment_mode": "optional"},
        {"id": "pre_1_2", "section": "DVR & CCTV Verification", "text": "DVR Date shown", "type": "date", "required": true},
        {"id": "pre_1_3", "section": "DVR & CCTV Verification", "text": "DVR Time shown", "type": "time", "required": true},
        {"id": "pre_1_4", "section": "DVR & CCTV Verification", "text": "Live camera visibility", "type": "dropdown", "required": true, "options": ["All visible", "One missing", "More than one missing"]},
        {"id": "pre_1_5", "section": "DVR & CCTV Verification", "text": "If missing: Mention camera number(s) and issue", "type": "text", "required": false},
        
        {"id": "pre_2_1", "section": "System Power & Readiness", "text": "Server status", "type": "dropdown", "required": true, "options": ["ON stable", "ON with alert", "Not ON"]},
        {"id": "pre_2_2", "section": "System Power & Readiness", "text": "Admin PC status", "type": "dropdown", "required": true, "options": ["Ready", "Booting", "Issue"]},
        {"id": "pre_2_3", "section": "System Power & Readiness", "text": "Workstations powered ON count", "type": "number", "required": true},
        {"id": "pre_2_4", "section": "System Power & Readiness", "text": "Any workstation errors?", "type": "dropdown", "required": true, "options": ["No", "Yes"]},
        {"id": "pre_2_5", "section": "System Power & Readiness", "text": "If yes: System number(s) + error note", "type": "text", "required": false},
        
        {"id": "pre_3_1", "section": "Cleanliness Physical Inspection", "text": "Admin area", "type": "dropdown", "required": true, "options": ["Clean", "Acceptable", "Needs cleaning"], "attachment_mode": "optional"},
        {"id": "pre_3_2", "section": "Cleanliness Physical Inspection", "text": "Exam lab", "type": "dropdown", "required": true, "options": ["Clean", "Acceptable", "Needs cleaning"]},
        {"id": "pre_3_3", "section": "Cleanliness Physical Inspection", "text": "Front office", "type": "dropdown", "required": true, "options": ["Clean", "Acceptable", "Needs cleaning"]},
        {"id": "pre_3_4", "section": "Cleanliness Physical Inspection", "text": "Washroom", "type": "dropdown", "required": true, "options": ["Clean", "Acceptable", "Needs cleaning"]},
        {"id": "pre_3_5", "section": "Cleanliness Physical Inspection", "text": "If any needs cleaning: Action taken", "type": "text", "required": false},
        
        {"id": "pre_4_1", "section": "AC Readiness", "text": "Total AC installed", "type": "number", "required": true},
        {"id": "pre_4_2", "section": "AC Readiness", "text": "AC switched ON now", "type": "number", "required": true},
        {"id": "pre_4_3", "section": "AC Readiness", "text": "Cooling status", "type": "dropdown", "required": true, "options": ["All cooling properly", "Partial cooling", "Cooling issue"]},
        {"id": "pre_4_4", "section": "AC Readiness", "text": "If issue: Location + description", "type": "text", "required": false},
        
        {"id": "pre_5_1", "section": "Check-in Tools & Client Software", "text": "RMA tool status", "type": "dropdown", "required": true, "options": ["Opened", "Not opening", "Error"], "attachment_mode": "optional"},
        {"id": "pre_5_2", "section": "Check-in Tools & Client Software", "text": "Client software opened today", "type": "dropdown", "required": true, "options": ["Pearson VUE", "Prometric", "PSI", "Others"]},
        {"id": "pre_5_3", "section": "Check-in Tools & Client Software", "text": "If Others: name", "type": "text", "required": false},
        {"id": "pre_5_4", "section": "Check-in Tools & Client Software", "text": "Dummy check-in test performed?", "type": "dropdown", "required": true, "options": ["Yes", "No"]},
        {"id": "pre_5_5", "section": "Check-in Tools & Client Software", "text": "If no: reason", "type": "text", "required": false},
        
        {"id": "pre_6_1", "section": "Admin Desk Equipment Test", "text": "Webcam", "type": "dropdown", "required": true, "options": ["Working", "Not working"], "attachment_mode": "optional"},
        {"id": "pre_6_2", "section": "Admin Desk Equipment Test", "text": "E-sign pad", "type": "dropdown", "required": true, "options": ["Working", "Not working"]},
        {"id": "pre_6_3", "section": "Admin Desk Equipment Test", "text": "Headphones", "type": "dropdown", "required": true, "options": ["Working", "Not working"]},
        {"id": "pre_6_4", "section": "Admin Desk Equipment Test", "text": "If any not working: Replacement arranged?", "type": "dropdown", "required": false, "options": ["Not needed", "Yes"]},
        {"id": "pre_6_5", "section": "Admin Desk Equipment Test", "text": "Replacement details", "type": "text", "required": false},
        
        {"id": "pre_7_1", "section": "Body Scanner Verification", "text": "Power ON?", "type": "dropdown", "required": true, "options": ["Yes", "No"], "attachment_mode": "optional"},
        {"id": "pre_7_2", "section": "Body Scanner Verification", "text": "Test scan result", "type": "dropdown", "required": true, "options": ["Successful", "Failed"]},
        {"id": "pre_7_3", "section": "Body Scanner Verification", "text": "Placement", "type": "dropdown", "required": true, "options": ["Correct", "Needs adjustment"]},
        {"id": "pre_7_4", "section": "Body Scanner Verification", "text": "Issue notes", "type": "text", "required": false},
        
        {"id": "pre_8_1", "section": "Locker Keys & Security", "text": "Total lockers", "type": "number", "required": true},
        {"id": "pre_8_2", "section": "Locker Keys & Security", "text": "Keys present now", "type": "number", "required": true},
        {"id": "pre_8_3", "section": "Locker Keys & Security", "text": "Any missing/damaged key?", "type": "dropdown", "required": true, "options": ["No", "Yes"]},
        {"id": "pre_8_4", "section": "Locker Keys & Security", "text": "If yes: locker number(s) + note", "type": "text", "required": false},
        
        {"id": "pre_9_1", "section": "Consumables Count", "text": "Total scratch sheets available", "type": "number", "required": true, "attachment_mode": "optional"},
        {"id": "pre_9_2", "section": "Consumables Count", "text": "Pearson VUE scratch sheets count", "type": "number", "required": true},
        {"id": "pre_9_3", "section": "Consumables Count", "text": "Markers available", "type": "number", "required": true},
        {"id": "pre_9_4", "section": "Consumables Count", "text": "Printer A4 level", "type": "dropdown", "required": true, "options": ["Below half bundle", "Around 1 bundle", "More than 1 bundle"]},
        
        {"id": "pre_10_1", "section": "Final Readiness Confirmation", "text": "Centre ready to receive candidates?", "type": "dropdown", "required": true, "options": ["Yes fully ready", "Ready with minor issues", "Not ready"], "attachment_mode": "optional"},
        {"id": "pre_10_2", "section": "Final Readiness Confirmation", "text": "If minor/not ready: explain", "type": "text", "required": false}
    ]'::jsonb,
    true,
    NULL
);

-- 5. Insert Default Template B: Post-Exam Checklist (Evening)
INSERT INTO checklist_templates (id, title, description, type, questions, is_active, created_by)
VALUES (
    '00000000-0000-0000-0000-000000000002',
    'Post-Exam Checklist (Evening)',
    'Daily shift closure and facility security protocol.',
    'post_exam',
    '[
        {"id": "post_1_1", "section": "FETS Register Completion", "text": "Total candidates today", "type": "number", "required": true},
        {"id": "post_1_2", "section": "FETS Register Completion", "text": "Register completed till last candidate", "type": "dropdown", "required": true, "options": ["Yes", "No"]},
        {"id": "post_1_3", "section": "FETS Register Completion", "text": "Any mismatch?", "type": "dropdown", "required": true, "options": ["No", "Yes"]},
        {"id": "post_1_4", "section": "FETS Register Completion", "text": "If yes: details", "type": "text", "required": false},
        
        {"id": "post_2_1", "section": "CPR Filing", "text": "CPR filed for today", "type": "dropdown", "required": true, "options": ["Yes", "No"]},
        {"id": "post_2_2", "section": "CPR Filing", "text": "Filing time", "type": "time", "required": true},
        {"id": "post_2_3", "section": "CPR Filing", "text": "Any pending CPR?", "type": "dropdown", "required": true, "options": ["No", "Yes"]},
        {"id": "post_2_4", "section": "CPR Filing", "text": "If yes: exam/client name", "type": "text", "required": false},
        
        {"id": "post_3_1", "section": "Next-Day Printouts Prepared", "text": "Next-day roster printed?", "type": "dropdown", "required": true, "options": ["Yes", "No"], "attachment_mode": "optional"},
        {"id": "post_3_2", "section": "Next-Day Printouts Prepared", "text": "Sign-in sheets printed count", "type": "number", "required": true},
        {"id": "post_3_3", "section": "Next-Day Printouts Prepared", "text": "Rules/regulations sheets printed count", "type": "number", "required": true},
        {"id": "post_3_4", "section": "Next-Day Printouts Prepared", "text": "Stored in correct location?", "type": "dropdown", "required": true, "options": ["Yes", "No"]},
        
        {"id": "post_4_1", "section": "Next-Day Consumables Ready", "text": "Scratch sheets kept ready", "type": "number", "required": true},
        {"id": "post_4_2", "section": "Next-Day Consumables Ready", "text": "Markers kept ready", "type": "number", "required": true},
        {"id": "post_4_3", "section": "Next-Day Consumables Ready", "text": "A4 in printer", "type": "dropdown", "required": true, "options": ["Below half bundle", "Around 1 bundle", "More than 1 bundle"]},
        
        {"id": "post_5_1", "section": "Locker Keys Returned", "text": "Keys returned count", "type": "number", "required": true},
        {"id": "post_5_2", "section": "Locker Keys Returned", "text": "Any missing key now?", "type": "dropdown", "required": true, "options": ["No", "Yes"]},
        {"id": "post_5_3", "section": "Locker Keys Returned", "text": "If yes: locker number(s)", "type": "text", "required": false},
        
        {"id": "post_6_1", "section": "Water Dispenser & Glasses", "text": "Dispenser status", "type": "dropdown", "required": true, "options": ["Working", "Not working"]},
        {"id": "post_6_2", "section": "Water Dispenser & Glasses", "text": "Water level", "type": "dropdown", "required": true, "options": ["Full", "Half", "Low"]},
        {"id": "post_6_3", "section": "Water Dispenser & Glasses", "text": "Glasses available count", "type": "number", "required": true},
        
        {"id": "post_7_1", "section": "Document Filing Confirmation", "text": "Sign-in sheets filed", "type": "dropdown", "required": true, "options": ["Yes", "No"]},
        {"id": "post_7_2", "section": "Document Filing Confirmation", "text": "Roster filed", "type": "dropdown", "required": true, "options": ["Yes", "No"]},
        {"id": "post_7_3", "section": "Document Filing Confirmation", "text": "Rules/agreement filed", "type": "dropdown", "required": true, "options": ["Yes", "No"]},
        {"id": "post_7_4", "section": "Document Filing Confirmation", "text": "Filing location verified", "type": "dropdown", "required": true, "options": ["Yes", "No"]},
        
        {"id": "post_8_1", "section": "Scratch Paper Shredding", "text": "Scratch papers shredded?", "type": "dropdown", "required": true, "options": ["Yes", "No"], "attachment_mode": "optional"},
        {"id": "post_8_2", "section": "Scratch Paper Shredding", "text": "Approx quantity shredded", "type": "number", "required": true},
        {"id": "post_8_3", "section": "Scratch Paper Shredding", "text": "Shredder working properly?", "type": "dropdown", "required": true, "options": ["Yes", "No"]},
        {"id": "post_8_4", "section": "Scratch Paper Shredding", "text": "If no: issue", "type": "text", "required": false},
        
        {"id": "post_9_1", "section": "Power Down Verification", "text": "Workstations switched OFF count", "type": "number", "required": true},
        {"id": "post_9_2", "section": "Power Down Verification", "text": "Admin system OFF", "type": "dropdown", "required": true, "options": ["Yes", "No"]},
        {"id": "post_9_3", "section": "Power Down Verification", "text": "Server OFF / As per SOP", "type": "dropdown", "required": true, "options": ["Yes", "No"]},
        {"id": "post_9_4", "section": "Power Down Verification", "text": "Printer OFF", "type": "dropdown", "required": true, "options": ["Yes", "No"]},
        {"id": "post_9_5", "section": "Power Down Verification", "text": "CCTV status after closing", "type": "dropdown", "required": true, "options": ["ON", "OFF as per SOP"]},
        
        {"id": "post_10_1", "section": "Final Facility Shutdown", "text": "AC units OFF count", "type": "number", "required": true, "attachment_mode": "optional"},
        {"id": "post_10_2", "section": "Final Facility Shutdown", "text": "Lights OFF in all areas", "type": "dropdown", "required": true, "options": ["Yes", "No"]},
        {"id": "post_10_3", "section": "Final Facility Shutdown", "text": "Water dispenser OFF", "type": "dropdown", "required": true, "options": ["Yes", "No"]},
        {"id": "post_10_4", "section": "Final Facility Shutdown", "text": "Centre locked & secured", "type": "dropdown", "required": true, "options": ["Yes", "No"]},
        {"id": "post_10_5", "section": "Final Facility Shutdown", "text": "Issue to report to admin", "type": "text", "required": false}
    ]'::jsonb,
    true,
    NULL
);
