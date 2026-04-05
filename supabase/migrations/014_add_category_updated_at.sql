-- Migration 014: Add updated_at to categories for "newer wins" conflict resolution
--
-- Context: BackupManager (Android) pushes local data → Supabase.
-- To avoid overwriting a newer remote record with an older local one,
-- every table used in backup needs updated_at so timestamps can be compared.
-- spending_cards and transactions already have updated_at.
-- categories was missing it.

-- ─── 1. Add column ────────────────────────────────────────────────────────────
ALTER TABLE categories
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ─── 2. Backfill existing rows ────────────────────────────────────────────────
UPDATE categories
SET updated_at = created_at
WHERE updated_at IS NULL;

-- ─── 3. Auto-update trigger ───────────────────────────────────────────────────
-- Reusable function (CREATE OR REPLACE is idempotent, safe to run if it already
-- exists under the same name from a future migration).
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER categories_set_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
