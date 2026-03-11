-- ============================================================
-- Add indexes to improve query performance
-- ============================================================

-- categories: filter by user_id + sort by type, name
CREATE INDEX IF NOT EXISTS idx_categories_user
  ON categories(user_id, type, name);

-- spending_cards: filter by user_id + sort by use_count DESC, position
CREATE INDEX IF NOT EXISTS idx_spending_cards_user
  ON spending_cards(user_id, use_count DESC, position);

-- card_variants: JOIN from spending_cards (FK not auto-indexed) + sort by position
CREATE INDEX IF NOT EXISTS idx_card_variants_card
  ON card_variants(card_id, position);

-- transactions: replace existing index to include position (avoids extra sort step)
DROP INDEX IF EXISTS transactions_user_date;
CREATE INDEX IF NOT EXISTS transactions_user_date
  ON transactions(user_id, date, position);
