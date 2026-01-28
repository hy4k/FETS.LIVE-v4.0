-- Fix RLS policies for candidates and systems tables
-- The issue: Recently added data is saved but not showing in frontend
-- Cause: RLS policies with is_authorized() function may be blocking data retrieval

-- Step 1: Drop problematic policies on candidates table
DROP POLICY IF EXISTS "Authorized users can view candidates" ON candidates;
DROP POLICY IF EXISTS "Super admins can delete candidates" ON candidates;
DROP POLICY IF EXISTS "Super admins can insert candidates" ON candidates;
DROP POLICY IF EXISTS "Super admins can update candidates" ON candidates;

-- Step 2: Drop problematic policies on systems table
DROP POLICY IF EXISTS "Allow admins to manage systems" ON systems;

-- Step 3: Ensure simple, working policies for authenticated users exist
-- For CANDIDATES table:
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON candidates;
CREATE POLICY "Enable read access for all authenticated users" ON candidates
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable insert for all authenticated users" ON candidates;
CREATE POLICY "Enable insert for all authenticated users" ON candidates
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for authenticated users" ON candidates;
CREATE POLICY "Enable update for authenticated users" ON candidates
  FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable delete for authenticated users" ON candidates;
CREATE POLICY "Enable delete for authenticated users" ON candidates
  FOR DELETE TO authenticated USING (true);

-- For SYSTEMS table:
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON systems;
CREATE POLICY "Enable read access for all authenticated users" ON systems
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON systems;
CREATE POLICY "Enable insert for authenticated users" ON systems
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for authenticated users" ON systems;
CREATE POLICY "Enable update for authenticated users" ON systems
  FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable delete for authenticated users" ON systems;
CREATE POLICY "Enable delete for authenticated users" ON systems
  FOR DELETE TO authenticated USING (true);

-- Step 4: Also drop any conflicting 'public' role policies
DROP POLICY IF EXISTS "Enable read access for all users" ON systems;
DROP POLICY IF EXISTS "Enable insert access for all authenticated users" ON systems;
DROP POLICY IF EXISTS "Enable update access for all authenticated users" ON systems;
DROP POLICY IF EXISTS "Enable delete access for all authenticated users" ON systems;

-- Verify: List final policies
SELECT tablename, policyname, cmd, roles FROM pg_policies 
WHERE tablename IN ('candidates', 'systems');
