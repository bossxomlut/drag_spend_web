-- Migration: add is_seeded flag to profiles + atomic seed function

-- ─── Add is_seeded column ────────────────────────────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_seeded BOOLEAN DEFAULT FALSE;

-- ─── Atomic seed function ────────────────────────────────────────────────────
-- Returns TRUE if seeding was performed, FALSE if already seeded (no-op).
-- Uses UPDATE ... WHERE is_seeded = false to avoid race conditions.
CREATE OR REPLACE FUNCTION ensure_user_seeded(p_user_id UUID, p_name TEXT DEFAULT NULL)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $func$
DECLARE
  v_updated INT;
BEGIN
  -- Upsert profile
  INSERT INTO profiles (id, name, is_seeded)
  VALUES (p_user_id, p_name, false)
  ON CONFLICT (id) DO NOTHING;

  -- Atomically claim the seed slot — only one concurrent call will succeed
  UPDATE profiles
  SET is_seeded = true
  WHERE id = p_user_id AND is_seeded = false;

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  IF v_updated = 0 THEN
    RETURN false; -- already seeded, nothing to do
  END IF;

  -- Seed categories and cards
  PERFORM seed_default_categories(p_user_id);
  PERFORM seed_default_cards(p_user_id);

  RETURN true;
END;
$func$;

-- ─── Mark existing users as already seeded ───────────────────────────────────
UPDATE profiles SET is_seeded = true
WHERE id IN (SELECT DISTINCT user_id FROM categories);
