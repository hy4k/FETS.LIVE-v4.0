-- =============================================
-- FETS.LIVE Database Fixes - Applied 2026-02-02
-- =============================================

-- =============================================
-- FIX 1: FETS VAULT RLS POLICIES (APPLIED)
-- =============================================
-- Enable RLS on fets_vault  
ALTER TABLE fets_vault ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own vault entries" ON fets_vault;
DROP POLICY IF EXISTS "Users can insert their own vault entries" ON fets_vault;
DROP POLICY IF EXISTS "Users can update their own vault entries" ON fets_vault;
DROP POLICY IF EXISTS "Users can delete their own vault entries" ON fets_vault;
DROP POLICY IF EXISTS "Users can view vault entries" ON fets_vault;
DROP POLICY IF EXISTS "Users can insert vault entries" ON fets_vault;
DROP POLICY IF EXISTS "Users can update vault entries" ON fets_vault;
DROP POLICY IF EXISTS "Users can delete vault entries" ON fets_vault;

-- Create proper policies
CREATE POLICY "Users can view vault entries" ON fets_vault FOR SELECT 
USING (
    user_id IN (SELECT id FROM staff_profiles WHERE staff_profiles.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM staff_profiles WHERE staff_profiles.user_id = auth.uid() AND staff_profiles.role IN ('super_admin', 'roster_manager'))
);

CREATE POLICY "Users can insert vault entries" ON fets_vault FOR INSERT 
WITH CHECK (
    user_id IN (SELECT id FROM staff_profiles WHERE staff_profiles.user_id = auth.uid())
);

CREATE POLICY "Users can update vault entries" ON fets_vault FOR UPDATE 
USING (
    user_id IN (SELECT id FROM staff_profiles WHERE staff_profiles.user_id = auth.uid())
);

CREATE POLICY "Users can delete vault entries" ON fets_vault FOR DELETE 
USING (
    user_id IN (SELECT id FROM staff_profiles WHERE staff_profiles.user_id = auth.uid())
);

-- =============================================
-- FIX 2: PROFILE PICTURES STORAGE (APPLIED)
-- =============================================
-- Create profile-pictures bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-pictures', 'profile-pictures', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Fix staff_profiles update policy
DROP POLICY IF EXISTS "Users can update their own profile" ON staff_profiles;
CREATE POLICY "Users can update their own profile" ON staff_profiles FOR UPDATE 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Fix storage policies for profile-pictures
DROP POLICY IF EXISTS "Users can upload profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload profile pictures" ON storage.objects;

CREATE POLICY "Authenticated users can upload profile pictures" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'profile-pictures' AND auth.role() = 'authenticated');

CREATE POLICY "Anyone can view profile pictures" ON storage.objects
FOR SELECT USING (bucket_id = 'profile-pictures');

-- =============================================
-- FIX 3: SOCIAL POSTS ARCHIVE FIELDS (APPLIED)
-- =============================================
-- Add archive fields for soft-delete functionality
ALTER TABLE social_posts 
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- Create index for faster retrieval of non-archived posts
CREATE INDEX IF NOT EXISTS idx_social_posts_not_archived 
ON social_posts(is_archived) 
WHERE is_archived IS NOT TRUE;

-- Update policy to allow post owners and admins to update/delete their posts
DROP POLICY IF EXISTS "Users can update their own posts" ON social_posts;
CREATE POLICY "Users can update their own posts" ON social_posts 
FOR UPDATE USING (
    auth.uid() = user_id OR
    EXISTS (
        SELECT 1 FROM staff_profiles 
        WHERE staff_profiles.user_id = auth.uid() 
        AND staff_profiles.role IN ('super_admin', 'roster_manager')
    )
);

-- =============================================
-- VERIFICATION QUERIES
-- =============================================
-- Run these to verify everything is set correctly:

-- Check fets_vault policies
SELECT schemaname, tablename, policyname, permissive, cmd 
FROM pg_policies WHERE tablename = 'fets_vault';

-- Check storage buckets
SELECT id, name, public FROM storage.buckets;

-- Check if certificates column exists
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'staff_profiles' 
AND column_name IN ('certificates', 'certifications');
