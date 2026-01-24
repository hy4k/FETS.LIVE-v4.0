-- INCIDENTS TABLE - Simple Version
-- Run this in Supabase SQL Editor

-- Drop existing table if it exists (optional - only if you want to start fresh)
-- DROP TABLE IF EXISTS public.incident_comments CASCADE;
-- DROP TABLE IF EXISTS public.incidents CASCADE;

-- Create incidents table
CREATE TABLE IF NOT EXISTS public.incidents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT DEFAULT 'other',
  severity TEXT DEFAULT 'minor',
  status TEXT DEFAULT 'open',
  reporter TEXT,
  assigned_to TEXT,
  user_id UUID NOT NULL,
  system_id UUID,
  branch_location TEXT DEFAULT 'calicut',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);

-- Disable RLS for simpler access (enable later if needed)
ALTER TABLE public.incidents DISABLE ROW LEVEL SECURITY;

-- Grant full access to all
GRANT ALL ON public.incidents TO anon;
GRANT ALL ON public.incidents TO authenticated;
GRANT ALL ON public.incidents TO service_role;

-- Create incident_comments table
CREATE TABLE IF NOT EXISTS public.incident_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  incident_id UUID REFERENCES public.incidents(id) ON DELETE CASCADE,
  author_id UUID,
  author_full_name TEXT,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Disable RLS for comments too
ALTER TABLE public.incident_comments DISABLE ROW LEVEL SECURITY;

-- Grant full access
GRANT ALL ON public.incident_comments TO anon;
GRANT ALL ON public.incident_comments TO authenticated;
GRANT ALL ON public.incident_comments TO service_role;

-- Test: Insert a sample incident
INSERT INTO public.incidents (title, description, category, severity, status, reporter, user_id, branch_location)
VALUES ('Test Incident', 'This is a test incident', 'other', 'minor', 'open', 'System', '00000000-0000-0000-0000-000000000000', 'calicut');

-- Verify the table was created
SELECT * FROM public.incidents;
