-- ============================================================
-- Drag Spend Schema
-- ============================================================

-- Profiles (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  name TEXT,
  currency TEXT DEFAULT 'VND',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own profile" ON profiles
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO profiles (id, name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'name');
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- Categories
-- ============================================================
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '📦',
  color TEXT DEFAULT '#6366f1',
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own categories" ON categories
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- Spending Cards (Templates)
-- ============================================================
CREATE TABLE spending_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  category_id UUID REFERENCES categories ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  note TEXT,
  position INT DEFAULT 0,
  use_count INT DEFAULT 0,      -- track frequency for sorting
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE spending_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own cards" ON spending_cards
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- Card Variants (multi-amount per card)
-- ============================================================
CREATE TABLE card_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID REFERENCES spending_cards ON DELETE CASCADE NOT NULL,
  label TEXT,           -- e.g. "Nhỏ", "Lớn", or NULL
  amount NUMERIC(15,0) NOT NULL DEFAULT 0,
  is_default BOOLEAN DEFAULT FALSE,
  position INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE card_variants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own card variants" ON card_variants
  USING (
    auth.uid() = (SELECT user_id FROM spending_cards WHERE id = card_id)
  )
  WITH CHECK (
    auth.uid() = (SELECT user_id FROM spending_cards WHERE id = card_id)
  );

-- Ensure only one default per card
CREATE UNIQUE INDEX one_default_per_card ON card_variants (card_id)
  WHERE is_default = TRUE;

-- ============================================================
-- Transactions (cloned from cards into specific dates)
-- ============================================================
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles ON DELETE CASCADE NOT NULL,
  source_card_id UUID REFERENCES spending_cards ON DELETE SET NULL, -- which template card this was cloned from
  date DATE NOT NULL,
  title TEXT NOT NULL,
  amount NUMERIC(15,0) NOT NULL DEFAULT 0,
  category_id UUID REFERENCES categories ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  note TEXT,
  position INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own transactions" ON transactions
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX transactions_user_date ON transactions (user_id, date);

-- ============================================================
-- RPC: Increment card use_count atomically
-- ============================================================
CREATE OR REPLACE FUNCTION increment_card_use_count(card_id UUID)
RETURNS VOID LANGUAGE sql AS $$
  UPDATE spending_cards SET use_count = use_count + 1 WHERE id = card_id;
$$;

-- ============================================================
-- Seed default categories for new users
-- ============================================================
CREATE OR REPLACE FUNCTION seed_default_categories(p_user_id UUID)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO categories (user_id, name, icon, color, type) VALUES
    (p_user_id, 'Ăn uống',                '🍜', '#f59e0b', 'expense'),
    (p_user_id, 'Tiền trọ',               '🏠', '#3b82f6', 'expense'),
    (p_user_id, 'Xe',                     '🚗', '#64748b', 'expense'),
    (p_user_id, 'Tiền xăng',              '⛽', '#f97316', 'expense'),
    (p_user_id, 'Tiền điện thoại',        '📱', '#8b5cf6', 'expense'),
    (p_user_id, 'Mua sắm',                '🛍',  '#ec4899', 'expense'),
    (p_user_id, 'Đi chơi với người yêu',  '💑', '#e11d48', 'expense'),
    (p_user_id, 'Phụng dưỡng gia đình',   '🏡', '#f59e0b', 'expense'),
    (p_user_id, 'Du lịch',                '✈',  '#06b6d4', 'expense'),
    (p_user_id, 'Y tế',                   '💊', '#ef4444', 'expense'),
    (p_user_id, 'Đi chợ',                 '🧺', '#84cc16', 'expense'),
    (p_user_id, 'Giải trí',               '🎮', '#a855f7', 'expense'),
    (p_user_id, 'Khác',                   '📦', '#6b7280', 'expense'),
    (p_user_id, 'Lương',                  '💰', '#10b981', 'income'),
    (p_user_id, 'Freelancer',             '💻', '#06b6d4', 'income'),
    (p_user_id, 'Thưởng',                 '🎁', '#f59e0b', 'income'),
    (p_user_id, 'Cashback',               '💳', '#8b5cf6', 'income'),
    (p_user_id, 'Khác',                   '📦', '#6b7280', 'income');
END;
$$;
