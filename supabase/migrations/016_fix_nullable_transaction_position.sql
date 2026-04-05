-- Migration 016: Backfill and enforce NOT NULL on transactions.position
-- (Transactions were missed in migration 015 which only covered card tables)

UPDATE transactions SET position = 0 WHERE position IS NULL;

ALTER TABLE transactions ALTER COLUMN position SET NOT NULL;
