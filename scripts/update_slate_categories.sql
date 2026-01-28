-- Update slate_entries category constraint to include new varieties
-- Run this in Supabase SQL Editor

-- Drop the existing constraint
ALTER TABLE public.slate_entries 
DROP CONSTRAINT IF EXISTS slate_entries_category_check;

-- Add the new constraint with expanded categories
ALTER TABLE public.slate_entries 
ADD CONSTRAINT slate_entries_category_check 
CHECK (category IN ('note', 'idea', 'task', 'reflection', 'dream', 'memo', 'journal', 'quote'));
