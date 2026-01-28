-- Update shift change notification trigger
-- Only notify for significant roster changes, not one-on-one personal shifts
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION notify_shift_change()
RETURNS TRIGGER AS $$
DECLARE
  staff_name TEXT;
  staff_branch TEXT;
  old_shift TEXT;
  new_shift TEXT;
  is_significant_change BOOLEAN;
BEGIN
  -- Only notify on shift_code change
  IF OLD.shift_code = NEW.shift_code THEN
    RETURN NEW;
  END IF;

  old_shift := COALESCE(OLD.shift_code, 'None');
  new_shift := COALESCE(NEW.shift_code, 'None');

  -- FILTER: Skip notifications for minor/one-on-one changes
  -- A "significant" change is when:
  -- 1. Shift changes FROM or TO a leave type (CL, SL, EL, PLV, Absent)
  -- 2. Shift is completely removed (set to None/null) 
  -- 3. Admin marks it as "significant" via metadata (future enhancement)
  
  is_significant_change := FALSE;
  
  -- Check if it's a leave-related change (always notify for leave changes)
  IF old_shift IN ('CL', 'SL', 'EL', 'PLV', 'AL', 'absent', 'Absent', 'None') OR 
     new_shift IN ('CL', 'SL', 'EL', 'PLV', 'AL', 'absent', 'Absent', 'None') THEN
    is_significant_change := TRUE;
  END IF;

  -- Check if it's a major shift type change (e.g., from day to night)
  IF (old_shift IN ('M', 'M1') AND new_shift IN ('E', 'N')) OR
     (old_shift IN ('E', 'N') AND new_shift IN ('M', 'M1')) THEN
    is_significant_change := TRUE;
  END IF;

  -- If it's just a simple one-on-one adjustment (same shift type), skip notification
  IF NOT is_significant_change THEN
    -- Log the skip for debugging
    RAISE NOTICE 'Skipping notification for minor shift change: % -> %', old_shift, new_shift;
    RETURN NEW;
  END IF;

  -- Get staff info
  SELECT full_name, branch_assigned INTO staff_name, staff_branch
  FROM staff_profiles
  WHERE id = NEW.profile_id;

  -- Create notification only for significant changes
  INSERT INTO notifications (
    recipient_id,
    type,
    title,
    message,
    link,
    priority,
    metadata,
    branch_location
  ) VALUES (
    NEW.profile_id,
    'shift_changed',
    'Roster Update',
    'Your schedule on ' || TO_CHAR(NEW.date, 'DD Mon YYYY') || ' was updated: ' || old_shift || ' → ' || new_shift,
    'fets-roster',
    'medium',  -- Downgraded from 'high' - roster changes are informational
    jsonb_build_object(
      'schedule_id', NEW.id,
      'date', NEW.date,
      'old_shift', old_shift,
      'new_shift', new_shift
    ),
    staff_branch
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the comment
COMMENT ON FUNCTION notify_shift_change IS 'Creates notification only for significant roster changes (leave-related or major shift type changes, not one-on-one adjustments)';
