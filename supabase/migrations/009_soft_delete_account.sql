-- ============================================================
-- 009: Soft delete for user accounts
-- ============================================================
-- Adds deleted_at to profiles.
-- When set, the account is considered "pending deletion".
-- A scheduled job (future) will hard-delete after 30 days.
-- Users can recover by contacting support before 30 days.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Index to support future cleanup job
CREATE INDEX IF NOT EXISTS profiles_deleted_at_idx
  ON profiles (deleted_at)
  WHERE deleted_at IS NOT NULL;
