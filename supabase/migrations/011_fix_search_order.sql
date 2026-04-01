-- Migration 011: Fix search_transactions_unaccent sort order
-- Adds t.id as final tiebreaker so ORDER BY is fully deterministic across pages.
-- Without it, rows with the same date+position can shift between pages,
-- causing duplicate keys when the client appends results.

CREATE OR REPLACE FUNCTION search_transactions_unaccent(
  p_user_id      uuid,
  p_query        text         DEFAULT '',
  p_type         text         DEFAULT NULL,
  p_date_from    date         DEFAULT NULL,
  p_date_to      date         DEFAULT NULL,
  p_category_id  uuid         DEFAULT NULL,
  p_min_amount   numeric      DEFAULT NULL,
  p_max_amount   numeric      DEFAULT NULL,
  p_limit        int          DEFAULT 20,
  p_offset       int          DEFAULT 0
)
RETURNS TABLE (
  id             uuid,
  user_id        uuid,
  source_card_id uuid,
  date           date,
  title          text,
  amount         numeric,
  category_id    uuid,
  type           text,
  note           text,
  txn_position   int,
  created_at     timestamptz,
  category       jsonb,
  total_count    bigint
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    t.id,
    t.user_id,
    t.source_card_id,
    t.date,
    t.title,
    t.amount,
    t.category_id,
    t.type,
    t.note,
    t.position AS txn_position,
    t.created_at,
    CASE WHEN c.id IS NOT NULL THEN
      jsonb_build_object(
        'id',         c.id,
        'name',       c.name,
        'icon',       c.icon,
        'color',      c.color,
        'type',       c.type,
        'user_id',    c.user_id,
        'language',   c.language,
        'created_at', c.created_at
      )
    ELSE NULL END,
    COUNT(*) OVER () AS total_count
  FROM transactions t
  LEFT JOIN categories c ON c.id = t.category_id
  WHERE t.user_id = p_user_id
    AND (
      p_query = ''
      OR unaccent(lower(t.title)) ILIKE '%' || unaccent(lower(p_query)) || '%'
      OR unaccent(lower(coalesce(t.note, ''))) ILIKE '%' || unaccent(lower(p_query)) || '%'
      OR unaccent(lower(coalesce(c.name, ''))) ILIKE '%' || unaccent(lower(p_query)) || '%'
    )
    AND (p_type        IS NULL OR t.type        = p_type)
    AND (p_date_from   IS NULL OR t.date        >= p_date_from)
    AND (p_date_to     IS NULL OR t.date        <= p_date_to)
    AND (p_category_id IS NULL OR t.category_id = p_category_id)
    AND (p_min_amount  IS NULL OR t.amount      >= p_min_amount)
    AND (p_max_amount  IS NULL OR t.amount      <= p_max_amount)
  ORDER BY t.date DESC, t.position, t.id
  LIMIT  p_limit
  OFFSET p_offset;
$$;
