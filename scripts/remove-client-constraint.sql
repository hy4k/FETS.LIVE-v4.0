-- Migration: Remove client_name check constraints from all tables
-- This allows any client name from the clients table to be used dynamically

-- ============================================
-- 1. CANDIDATES TABLE
-- ============================================
-- Drop the existing check constraint on client_name for candidates
ALTER TABLE candidates DROP CONSTRAINT IF EXISTS candidates_client_name_check;

-- ============================================
-- 2. CALENDAR_SESSIONS TABLE
-- ============================================
-- Drop any client_name check constraint for calendar_sessions
ALTER TABLE calendar_sessions DROP CONSTRAINT IF EXISTS calendar_sessions_client_name_check;

-- ============================================
-- 3. Verify current clients in the system
-- ============================================
-- This helps identify which clients already exist
SELECT 'Current clients in the system:' as info;
SELECT id, name, color FROM clients ORDER BY name;

-- ============================================
-- 4. Check unique client names in existing data
-- ============================================
SELECT 'Unique client names in candidates table:' as info;
SELECT DISTINCT client_name FROM candidates WHERE client_name IS NOT NULL ORDER BY client_name;

SELECT 'Unique client names in calendar_sessions table:' as info;
SELECT DISTINCT client_name FROM calendar_sessions WHERE client_name IS NOT NULL ORDER BY client_name;

-- ============================================
-- Success message
-- ============================================
SELECT 'Successfully removed client_name check constraints! You can now use any client name.' as message;
