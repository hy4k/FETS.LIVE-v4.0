-- Rebuild Checklist System Migration Script
-- This script drops the old checklist tables and creates the new ones for the redesigned system.

-- 1. Drop old tables (if they exist)
DROP TABLE IF EXISTS checklist_instance_items CASCADE;
DROP TABLE IF EXISTS checklist_instances CASCADE;
DROP TABLE IF EXISTS checklist_template_items CASCADE;
DROP TABLE IF EXISTS checklist_items CASCADE; -- Legacy table if any
DROP TABLE IF EXISTS checklist_templates CASCADE;
DROP TABLE IF EXISTS checklist_submissions CASCADE; -- Drop if we are re-running this

-- 2. Create checklist_templates table
CREATE TABLE checklist_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('pre_exam', 'post_exam', 'custom')),
    questions JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create checklist_submissions table
CREATE TABLE checklist_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES checklist_templates(id),
    submitted_by UUID REFERENCES auth.users(id),
    branch_id TEXT, -- Storing as text for flexibility (e.g. 'global', 'sydney')
    submitted_at TIMESTAMPTZ DEFAULT now(),
    answers JSONB DEFAULT '{}'::jsonb,
    status TEXT DEFAULT 'submitted',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE checklist_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_submissions ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS Policies

-- Checklist Templates Policies
-- Allow read access to all authenticated users
CREATE POLICY "Allow read access to all authenticated users" ON checklist_templates
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow insert/update/delete access to authenticated users (or restrict to admins if needed, but for now all staff)
CREATE POLICY "Allow insert access to authenticated users" ON checklist_templates
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow update access to authenticated users" ON checklist_templates
    FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Allow delete access to authenticated users" ON checklist_templates
    FOR DELETE
    TO authenticated
    USING (true);

-- Checklist Submissions Policies
-- Allow read access to all authenticated users
CREATE POLICY "Allow read access to all authenticated users" ON checklist_submissions
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow insert access to authenticated users
CREATE POLICY "Allow insert access to authenticated users" ON checklist_submissions
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = submitted_by);

-- Allow update access to submitter or admins (simplified to submitter for now)
CREATE POLICY "Allow update access to submitter" ON checklist_submissions
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = submitted_by);

-- 6. Grant permissions (optional, but good practice if roles are used)
GRANT ALL ON checklist_templates TO authenticated;
GRANT ALL ON checklist_submissions TO authenticated;
GRANT ALL ON checklist_templates TO service_role;
GRANT ALL ON checklist_submissions TO service_role;
