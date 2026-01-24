-- Incidents Table for Incident Manager
-- Run this SQL in your Supabase SQL editor

-- Create incidents table
CREATE TABLE IF NOT EXISTS public.incidents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other',
  severity TEXT NOT NULL DEFAULT 'minor' CHECK (severity IN ('critical', 'major', 'minor')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'in_progress', 'escalated', 'closed')),
  reporter TEXT,
  assigned_to TEXT,
  user_id UUID NOT NULL,
  system_id UUID,
  branch_location TEXT NOT NULL DEFAULT 'calicut',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow all users to view incidents" 
  ON public.incidents FOR SELECT 
  USING (true);

CREATE POLICY "Allow authenticated users to create incidents" 
  ON public.incidents FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

CREATE POLICY "Allow users to update incidents" 
  ON public.incidents FOR UPDATE 
  TO authenticated 
  USING (true);

CREATE POLICY "Allow users to delete incidents" 
  ON public.incidents FOR DELETE 
  TO authenticated 
  USING (true);

-- Create incident_comments table
CREATE TABLE IF NOT EXISTS public.incident_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,
  author_full_name TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for comments
ALTER TABLE public.incident_comments ENABLE ROW LEVEL SECURITY;

-- Create policies for comments
CREATE POLICY "Allow all users to view comments" 
  ON public.incident_comments FOR SELECT 
  USING (true);

CREATE POLICY "Allow authenticated users to create comments" 
  ON public.incident_comments FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

CREATE POLICY "Allow users to delete their own comments" 
  ON public.incident_comments FOR DELETE 
  TO authenticated 
  USING (author_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_incidents_branch_location ON public.incidents(branch_location);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON public.incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_created_at ON public.incidents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_incident_comments_incident_id ON public.incident_comments(incident_id);

-- Enable realtime for incidents
ALTER PUBLICATION supabase_realtime ADD TABLE public.incidents;
ALTER PUBLICATION supabase_realtime ADD TABLE public.incident_comments;

-- Grant permissions
GRANT ALL ON public.incidents TO authenticated;
GRANT ALL ON public.incident_comments TO authenticated;
GRANT SELECT ON public.incidents TO anon;
GRANT SELECT ON public.incident_comments TO anon;
