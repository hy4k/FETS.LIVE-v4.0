-- Slate Entries Table
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.slate_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'note' CHECK (category IN ('note', 'idea', 'task', 'reflection', 'dream')),
  is_starred BOOLEAN DEFAULT FALSE,
  is_pinned BOOLEAN DEFAULT FALSE,
  mood TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Disable RLS for simplicity
ALTER TABLE public.slate_entries DISABLE ROW LEVEL SECURITY;

-- Grant access
GRANT ALL ON public.slate_entries TO anon;
GRANT ALL ON public.slate_entries TO authenticated;
GRANT ALL ON public.slate_entries TO service_role;

-- Create index for faster user lookups
CREATE INDEX IF NOT EXISTS idx_slate_entries_user_id ON public.slate_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_slate_entries_created_at ON public.slate_entries(created_at DESC);
