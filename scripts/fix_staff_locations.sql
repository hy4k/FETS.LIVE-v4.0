-- fix_staff_locations.sql
-- Fix locations and roles as instructed
-- Aysha, Linofer, Anshitha in Calicut
-- Abhirami and Nimmy M in Cochin
-- Mithun & Niyas in Global
-- Only Mithun is super_admin

-- Note: We update `branch_assigned` according to the new requirements.

-- Set to Calicut
UPDATE public.staff_profiles
SET branch_assigned = 'calicut', department = 'Operations'
WHERE full_name ILIKE '%Aysha%'
   OR full_name ILIKE '%Linofer%'
   OR full_name ILIKE '%Anshitha%';

-- Set to Cochin
UPDATE public.staff_profiles
SET branch_assigned = 'cochin', department = 'Operations'
WHERE full_name ILIKE '%Abhirami%' 
   OR full_name ILIKE '%Nimmy M%';

-- Set to Global & ensure Niyas is a regular staff
UPDATE public.staff_profiles
SET branch_assigned = 'global', role = 'staff'
WHERE full_name ILIKE '%Niyas%';

-- Set to Global & ensure Mithun is super_admin
UPDATE public.staff_profiles
SET branch_assigned = 'global', role = 'super_admin'
WHERE full_name ILIKE '%Mithun%';
