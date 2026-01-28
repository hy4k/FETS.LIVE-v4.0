-- Updated Notification Triggers - FETS.LIVE Pulse System
-- Priority Levels:
--   critical: Emergency only (red popup, stays visible)
--   high: Important updates (amber popup, 5s)
--   medium: Informational (blue popup, 3s)
--   low: Silent (no popup, just badge update)
-- 
-- Run this in Supabase SQL Editor to update notification behavior

-- ============================================================================
-- ROSTER/SHIFT CHANGES: ONLY Leave & OT notifications
-- ============================================================================
CREATE OR REPLACE FUNCTION notify_shift_change()
RETURNS TRIGGER AS $$
DECLARE
  staff_name TEXT;
  staff_branch TEXT;
  old_shift TEXT;
  new_shift TEXT;
  is_leave_or_ot BOOLEAN;
BEGIN
  IF OLD.shift_code = NEW.shift_code THEN
    RETURN NEW;
  END IF;

  old_shift := COALESCE(OLD.shift_code, 'None');
  new_shift := COALESCE(NEW.shift_code, 'None');

  -- STRICT FILTER: ONLY notify for leave and OT related changes
  is_leave_or_ot := FALSE;
  
  IF old_shift IN ('CL', 'SL', 'EL', 'PLV', 'AL', 'absent', 'Absent', 'LOP', 'WFH') OR 
     new_shift IN ('CL', 'SL', 'EL', 'PLV', 'AL', 'absent', 'Absent', 'LOP', 'WFH') THEN
    is_leave_or_ot := TRUE;
  END IF;

  IF (OLD.overtime_hours IS DISTINCT FROM NEW.overtime_hours AND NEW.overtime_hours > 0) OR
     old_shift = 'OT' OR new_shift = 'OT' THEN
    is_leave_or_ot := TRUE;
  END IF;

  IF NOT is_leave_or_ot THEN
    RETURN NEW;
  END IF;

  SELECT full_name, branch_assigned INTO staff_name, staff_branch
  FROM staff_profiles
  WHERE id = NEW.profile_id;

  INSERT INTO notifications (
    recipient_id, type, title, message, link, priority, metadata, branch_location
  ) VALUES (
    NEW.profile_id,
    'shift_changed',
    CASE 
      WHEN NEW.overtime_hours > 0 THEN 'Overtime Updated'
      WHEN new_shift IN ('CL', 'SL', 'EL', 'PLV', 'AL', 'LOP', 'WFH', 'absent', 'Absent') THEN 'Leave Updated'
      ELSE 'Roster Update'
    END,
    CASE
      WHEN NEW.overtime_hours > 0 THEN 'OT on ' || TO_CHAR(NEW.date, 'DD Mon') || ': ' || NEW.overtime_hours || ' hrs'
      ELSE 'Leave on ' || TO_CHAR(NEW.date, 'DD Mon') || ': ' || new_shift
    END,
    'fets-roster',
    'low',
    jsonb_build_object('schedule_id', NEW.id, 'date', NEW.date, 'old_shift', old_shift, 'new_shift', new_shift, 'overtime_hours', NEW.overtime_hours),
    staff_branch
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- POST LIKES: Low priority (silent - no popup)
-- ============================================================================
CREATE OR REPLACE FUNCTION notify_post_like()
RETURNS TRIGGER AS $$
DECLARE
  post_author_id UUID;
  liker_name TEXT;
  post_branch TEXT;
BEGIN
  SELECT author_id INTO post_author_id FROM desktop_public_posts WHERE id = NEW.post_id;
  IF post_author_id IS NULL THEN
    SELECT user_id INTO post_author_id FROM wall_posts WHERE id = NEW.post_id;
  END IF;

  IF post_author_id = NEW.user_id THEN RETURN NEW; END IF;

  SELECT full_name INTO liker_name FROM staff_profiles WHERE id = NEW.user_id;
  SELECT branch_assigned INTO post_branch FROM staff_profiles WHERE id = post_author_id;

  INSERT INTO notifications (recipient_id, type, title, message, link, priority, metadata, branch_location)
  VALUES (post_author_id, 'post_like', liker_name || ' liked your post', '', 'fets-connect', 'low',
    jsonb_build_object('post_id', NEW.post_id, 'liker_id', NEW.user_id), post_branch);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- POST COMMENTS: Medium priority (brief popup)
-- ============================================================================
CREATE OR REPLACE FUNCTION notify_post_comment()
RETURNS TRIGGER AS $$
DECLARE
  post_author_id UUID;
  commenter_name TEXT;
  post_branch TEXT;
BEGIN
  SELECT author_id INTO post_author_id FROM desktop_public_posts WHERE id = NEW.post_id;
  IF post_author_id IS NULL THEN
    SELECT user_id INTO post_author_id FROM wall_posts WHERE id = NEW.post_id;
  END IF;

  IF post_author_id = NEW.author_id THEN RETURN NEW; END IF;

  SELECT full_name INTO commenter_name FROM staff_profiles WHERE id = NEW.author_id;
  SELECT branch_assigned INTO post_branch FROM staff_profiles WHERE id = post_author_id;

  INSERT INTO notifications (recipient_id, type, title, message, link, priority, metadata, branch_location)
  VALUES (post_author_id, 'post_comment', commenter_name || ' replied', 'New comment on your post', 'fets-connect', 'medium',
    jsonb_build_object('post_id', NEW.post_id, 'comment_id', NEW.id, 'commenter_id', NEW.author_id), post_branch);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- LEAVE STATUS: High priority (important decision)
-- ============================================================================
CREATE OR REPLACE FUNCTION notify_leave_status()
RETURNS TRIGGER AS $$
DECLARE
  approver_name TEXT;
  request_branch TEXT;
BEGIN
  IF OLD.status = NEW.status THEN RETURN NEW; END IF;
  IF NEW.status NOT IN ('approved', 'rejected') THEN RETURN NEW; END IF;

  SELECT full_name INTO approver_name FROM staff_profiles WHERE id = NEW.approved_by;
  SELECT branch_assigned INTO request_branch FROM staff_profiles WHERE id = NEW.user_id;

  INSERT INTO notifications (recipient_id, type, title, message, link, priority, metadata, branch_location)
  VALUES (
    NEW.user_id,
    CASE WHEN NEW.status = 'approved' THEN 'leave_approved' ELSE 'leave_rejected' END,
    CASE WHEN NEW.status = 'approved' THEN 'Leave Approved ✓' ELSE 'Leave Declined' END,
    NEW.request_type || ' request ' || NEW.status,
    'fets-roster',
    'high',
    jsonb_build_object('request_id', NEW.id, 'request_type', NEW.request_type, 'status', NEW.status, 'approved_by', NEW.approved_by),
    request_branch
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
