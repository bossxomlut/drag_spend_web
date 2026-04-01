-- Add recurring support to spending_cards
ALTER TABLE spending_cards
  ADD COLUMN IF NOT EXISTS is_recurring boolean DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS recurring_day smallint CHECK (recurring_day >= 1 AND recurring_day <= 31);

-- Index for efficient lookup of recurring cards per user
CREATE INDEX IF NOT EXISTS idx_spending_cards_recurring
  ON spending_cards(user_id, is_recurring)
  WHERE is_recurring = true;
