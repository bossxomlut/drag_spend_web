-- Migration 015: Backfill and enforce NOT NULL on card fields that should never be null
--
-- Root cause: old app versions serialised full DTO objects to Supabase, sending
-- explicit null for position/is_default instead of omitting the field.
-- DB stored NULL even though DEFAULT was defined (DEFAULT only applies when the
-- column is omitted from INSERT, not when NULL is passed explicitly).

-- ─── 1. Backfill existing NULLs ───────────────────────────────────────────────
UPDATE card_variants  SET is_default = false WHERE is_default IS NULL;
UPDATE card_variants  SET position   = 0     WHERE position   IS NULL;
UPDATE spending_cards SET position   = 0     WHERE position   IS NULL;
UPDATE transactions   SET position   = 0     WHERE position   IS NULL;

-- ─── 2. Enforce NOT NULL going forward ────────────────────────────────────────
ALTER TABLE card_variants  ALTER COLUMN is_default SET NOT NULL;
ALTER TABLE card_variants  ALTER COLUMN position   SET NOT NULL;
ALTER TABLE spending_cards ALTER COLUMN position   SET NOT NULL;
ALTER TABLE transactions   ALTER COLUMN position   SET NOT NULL;
