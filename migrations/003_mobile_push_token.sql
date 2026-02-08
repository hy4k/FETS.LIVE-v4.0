
-- Migration to add push token to staff profiles for FETS LIVE Mobile
ALTER TABLE staff_profiles ADD COLUMN IF NOT EXISTS push_token TEXT;
