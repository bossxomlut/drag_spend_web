-- ============================================================
-- RPC: get_monthly_report
-- Aggregates transactions by (date, category, type) on the DB
-- so the client only receives ~20-50 rows instead of raw transactions.
-- ============================================================
CREATE OR REPLACE FUNCTION get_monthly_report(p_year_month TEXT)
RETURNS TABLE (
  date          DATE,
  category_id   UUID,
  category_name TEXT,
  category_icon TEXT,
  category_color TEXT,
  type          TEXT,
  total         NUMERIC,
  tx_count      INT
) LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT
    t.date,
    t.category_id,
    c.name   AS category_name,
    c.icon   AS category_icon,
    c.color  AS category_color,
    t.type,
    SUM(t.amount)::NUMERIC AS total,
    COUNT(*)::INT          AS tx_count
  FROM transactions t
  LEFT JOIN categories c ON c.id = t.category_id
  WHERE t.user_id = auth.uid()
    AND to_char(t.date, 'YYYY-MM') = p_year_month
  GROUP BY t.date, t.category_id, c.name, c.icon, c.color, t.type
  ORDER BY t.date;
$$;
