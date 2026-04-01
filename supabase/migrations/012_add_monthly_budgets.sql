-- Monthly per-category budgets
CREATE TABLE monthly_budgets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
  month text NOT NULL, -- YYYY-MM (e.g. 2026-04)
  amount numeric NOT NULL DEFAULT 0 CHECK (amount >= 0),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, category_id, month)
);

ALTER TABLE monthly_budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own budgets" ON monthly_budgets
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_monthly_budgets_user_month ON monthly_budgets(user_id, month);
