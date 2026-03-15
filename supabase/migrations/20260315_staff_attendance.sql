-- ============================================================
-- FETS.Live v4.0 – Staff Attendance Table
-- Run this migration in the Supabase SQL Editor
-- ============================================================

-- Create staff_attendance table
CREATE TABLE IF NOT EXISTS public.staff_attendance (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id        UUID NOT NULL REFERENCES public.staff_profiles(id) ON DELETE CASCADE,
  date            DATE NOT NULL,
  check_in        TIME,
  check_out       TIME,
  status          TEXT NOT NULL DEFAULT 'present'
                    CHECK (status IN ('present', 'absent', 'late', 'half_day')),
  notes           TEXT,
  branch_location TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),

  -- One record per staff per day
  UNIQUE (staff_id, date)
);

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_staff_attendance_date     ON public.staff_attendance(date);
CREATE INDEX IF NOT EXISTS idx_staff_attendance_staff_id ON public.staff_attendance(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_attendance_status   ON public.staff_attendance(status);
CREATE INDEX IF NOT EXISTS idx_staff_attendance_branch   ON public.staff_attendance(branch_location);

-- Enable Row Level Security
ALTER TABLE public.staff_attendance ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can read attendance
CREATE POLICY "Authenticated users can read attendance"
  ON public.staff_attendance
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Authenticated users can insert attendance
CREATE POLICY "Authenticated users can insert attendance"
  ON public.staff_attendance
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Authenticated users can update attendance
CREATE POLICY "Authenticated users can update attendance"
  ON public.staff_attendance
  FOR UPDATE
  TO authenticated
  USING (true);

-- Policy: Authenticated users can delete attendance
CREATE POLICY "Authenticated users can delete attendance"
  ON public.staff_attendance
  FOR DELETE
  TO authenticated
  USING (true);

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at on staff_attendance
DROP TRIGGER IF EXISTS set_staff_attendance_updated_at ON public.staff_attendance;
CREATE TRIGGER set_staff_attendance_updated_at
  BEFORE UPDATE ON public.staff_attendance
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- OPTIONAL: Add status field to calendar_sessions if missing
-- (safe to run even if column already exists)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'calendar_sessions' AND column_name = 'status'
  ) THEN
    ALTER TABLE public.calendar_sessions
    ADD COLUMN status TEXT DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled'));
  END IF;
END $$;

-- ============================================================
-- OPTIONAL: Add assigned_staff field to calendar_sessions
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'calendar_sessions' AND column_name = 'assigned_staff'
  ) THEN
    ALTER TABLE public.calendar_sessions
    ADD COLUMN assigned_staff TEXT;
  END IF;
END $$;

-- ============================================================
-- OPTIONAL: Add certificates field to staff_profiles
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'staff_profiles' AND column_name = 'certificates'
  ) THEN
    ALTER TABLE public.staff_profiles
    ADD COLUMN certificates JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- ============================================================
-- OPTIONAL: Add contact_number to staff_profiles
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'staff_profiles' AND column_name = 'contact_number'
  ) THEN
    ALTER TABLE public.staff_profiles
    ADD COLUMN contact_number TEXT;
  END IF;
END $$;

-- Verify tables
SELECT 'staff_attendance table created successfully' as status;
SELECT count(*) as staff_profiles_count FROM public.staff_profiles;
