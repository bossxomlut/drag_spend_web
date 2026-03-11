-- Migration 008: Add language support
-- - profiles.language   → stored once when user picks language at onboarding
-- - categories.language → tracks which language this category's name is in
-- - spending_cards.language → same for cards
-- Seed functions are hardcoded per language (vi / en)

-- ─── 1. Add language column to profiles ──────────────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS language TEXT DEFAULT NULL;

-- Mark existing seeded users as Vietnamese
UPDATE profiles SET language = 'vi' WHERE is_seeded = true;

-- ─── 2. Add language column to categories ────────────────────────────────────
ALTER TABLE categories ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'vi';

-- ─── 3. Add language column to spending_cards ────────────────────────────────
ALTER TABLE spending_cards ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'vi';

-- ─── 4. Rewrite seed_default_categories ──────────────────────────────────────
CREATE OR REPLACE FUNCTION seed_default_categories(p_user_id UUID, p_language TEXT DEFAULT 'vi')
RETURNS VOID LANGUAGE plpgsql AS $func$
BEGIN
  IF p_language = 'en' THEN
    INSERT INTO categories (user_id, name, icon, color, type, language) VALUES
      (p_user_id, 'Food & Dining',    '🍜', '#f59e0b', 'expense', 'en'),
      (p_user_id, 'Rent / Housing',   '🏠', '#3b82f6', 'expense', 'en'),
      (p_user_id, 'Transportation',   '🚗', '#f97316', 'expense', 'en'),
      (p_user_id, 'Phone Bill',       '📱', '#8b5cf6', 'expense', 'en'),
      (p_user_id, 'Shopping',         '🛍',  '#ec4899', 'expense', 'en'),
      (p_user_id, 'Dating',           '💑', '#e11d48', 'expense', 'en'),
      (p_user_id, 'Family Support',   '🏡', '#f59e0b', 'expense', 'en'),
      (p_user_id, 'Travel',           '✈',  '#06b6d4', 'expense', 'en'),
      (p_user_id, 'Healthcare',       '💊', '#ef4444', 'expense', 'en'),
      (p_user_id, 'Groceries',        '🧺', '#84cc16', 'expense', 'en'),
      (p_user_id, 'Entertainment',    '🎮', '#a855f7', 'expense', 'en'),
      (p_user_id, 'Other',            '📦', '#6b7280', 'expense', 'en'),
      (p_user_id, 'Salary',           '💰', '#10b981', 'income',  'en'),
      (p_user_id, 'Freelance',        '💻', '#06b6d4', 'income',  'en'),
      (p_user_id, 'Bonus',            '🎁', '#f59e0b', 'income',  'en'),
      (p_user_id, 'Cashback',         '💳', '#8b5cf6', 'income',  'en'),
      (p_user_id, 'Other',            '📦', '#6b7280', 'income',  'en');
  ELSE
    -- 'vi' default
    INSERT INTO categories (user_id, name, icon, color, type, language) VALUES
      (p_user_id, 'Ăn uống',                '🍜', '#f59e0b', 'expense', 'vi'),
      (p_user_id, 'Tiền trọ',               '🏠', '#3b82f6', 'expense', 'vi'),
      (p_user_id, 'Tiền xăng',              '⛽', '#f97316', 'expense', 'vi'),
      (p_user_id, 'Tiền điện thoại',        '📱', '#8b5cf6', 'expense', 'vi'),
      (p_user_id, 'Mua sắm',                '🛍',  '#ec4899', 'expense', 'vi'),
      (p_user_id, 'Đi chơi với người yêu',  '💑', '#e11d48', 'expense', 'vi'),
      (p_user_id, 'Phụng dưỡng gia đình',   '🏡', '#f59e0b', 'expense', 'vi'),
      (p_user_id, 'Du lịch',                '✈',  '#06b6d4', 'expense', 'vi'),
      (p_user_id, 'Y tế',                   '💊', '#ef4444', 'expense', 'vi'),
      (p_user_id, 'Đi chợ',                 '🧺', '#84cc16', 'expense', 'vi'),
      (p_user_id, 'Giải trí',               '🎮', '#a855f7', 'expense', 'vi'),
      (p_user_id, 'Khác',                   '📦', '#6b7280', 'expense', 'vi'),
      (p_user_id, 'Lương',                  '💰', '#10b981', 'income',  'vi'),
      (p_user_id, 'Freelancer',             '💻', '#06b6d4', 'income',  'vi'),
      (p_user_id, 'Thưởng',                 '🎁', '#f59e0b', 'income',  'vi'),
      (p_user_id, 'Cashback',               '💳', '#8b5cf6', 'income',  'vi'),
      (p_user_id, 'Khác',                   '📦', '#6b7280', 'income',  'vi');
  END IF;
END;
$func$;

-- ─── 5. Rewrite seed_default_cards ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION seed_default_cards(p_user_id UUID, p_language TEXT DEFAULT 'vi')
RETURNS VOID LANGUAGE plpgsql AS $func$
DECLARE
  v_cat_1   UUID;
  v_cat_2   UUID;
  v_cat_3   UUID;
  v_cat_4   UUID;
  v_cat_5   UUID;
  v_card_id UUID;
  v_pos     INT := 0;
BEGIN
  IF p_language = 'en' THEN
    -- Lookup English category IDs
    SELECT id INTO v_cat_1 FROM categories WHERE user_id = p_user_id AND name = 'Food & Dining'  LIMIT 1;
    SELECT id INTO v_cat_2 FROM categories WHERE user_id = p_user_id AND name = 'Entertainment'  LIMIT 1;
    SELECT id INTO v_cat_3 FROM categories WHERE user_id = p_user_id AND name = 'Rent / Housing' LIMIT 1;
    SELECT id INTO v_cat_4 FROM categories WHERE user_id = p_user_id AND name = 'Family Support' LIMIT 1;
    SELECT id INTO v_cat_5 FROM categories WHERE user_id = p_user_id AND name = 'Transportation' LIMIT 1;

    -- Breakfast
    INSERT INTO spending_cards (user_id, title, category_id, type, position, language)
      VALUES (p_user_id, 'Breakfast', v_cat_1, 'expense', v_pos, 'en')
      RETURNING id INTO v_card_id;
    INSERT INTO card_variants (card_id, label, amount, is_default, position) VALUES
      (v_card_id, '$8',  8,  true,  0),
      (v_card_id, '$12', 12, false, 1),
      (v_card_id, '$15', 15, false, 2);
    v_pos := v_pos + 1;

    -- Lunch
    INSERT INTO spending_cards (user_id, title, category_id, type, position, language)
      VALUES (p_user_id, 'Lunch', v_cat_1, 'expense', v_pos, 'en')
      RETURNING id INTO v_card_id;
    INSERT INTO card_variants (card_id, label, amount, is_default, position) VALUES
      (v_card_id, '$12', 12, true,  0),
      (v_card_id, '$18', 18, false, 1),
      (v_card_id, '$25', 25, false, 2);
    v_pos := v_pos + 1;

    -- Dinner
    INSERT INTO spending_cards (user_id, title, category_id, type, position, language)
      VALUES (p_user_id, 'Dinner', v_cat_1, 'expense', v_pos, 'en')
      RETURNING id INTO v_card_id;
    INSERT INTO card_variants (card_id, label, amount, is_default, position) VALUES
      (v_card_id, '$20', 20, true,  0),
      (v_card_id, '$30', 30, false, 1),
      (v_card_id, '$50', 50, false, 2);
    v_pos := v_pos + 1;

    -- Coffee
    INSERT INTO spending_cards (user_id, title, category_id, type, position, language)
      VALUES (p_user_id, 'Coffee', v_cat_1, 'expense', v_pos, 'en')
      RETURNING id INTO v_card_id;
    INSERT INTO card_variants (card_id, label, amount, is_default, position) VALUES
      (v_card_id, '$4', 4, true,  0),
      (v_card_id, '$6', 6, false, 1),
      (v_card_id, '$8', 8, false, 2);
    v_pos := v_pos + 1;

    -- Drinks / Bar
    INSERT INTO spending_cards (user_id, title, category_id, type, position, language)
      VALUES (p_user_id, 'Drinks / Bar', v_cat_2, 'expense', v_pos, 'en')
      RETURNING id INTO v_card_id;
    INSERT INTO card_variants (card_id, label, amount, is_default, position) VALUES
      (v_card_id, '$15', 15, true,  0),
      (v_card_id, '$30', 30, false, 1),
      (v_card_id, '$50', 50, false, 2);
    v_pos := v_pos + 1;

    -- Rent
    INSERT INTO spending_cards (user_id, title, category_id, type, position, language)
      VALUES (p_user_id, 'Rent', v_cat_3, 'expense', v_pos, 'en')
      RETURNING id INTO v_card_id;
    INSERT INTO card_variants (card_id, label, amount, is_default, position) VALUES
      (v_card_id, '$800',  800,  false, 0),
      (v_card_id, '$1200', 1200, true,  1),
      (v_card_id, '$1800', 1800, false, 2);
    v_pos := v_pos + 1;

    -- Family Support
    INSERT INTO spending_cards (user_id, title, category_id, type, position, language)
      VALUES (p_user_id, 'Family Support', v_cat_4, 'expense', v_pos, 'en')
      RETURNING id INTO v_card_id;
    INSERT INTO card_variants (card_id, label, amount, is_default, position) VALUES
      (v_card_id, '$100', 100, false, 0),
      (v_card_id, '$200', 200, true,  1),
      (v_card_id, '$500', 500, false, 2);
    v_pos := v_pos + 1;

    -- Gas
    INSERT INTO spending_cards (user_id, title, category_id, type, position, language)
      VALUES (p_user_id, 'Gas', v_cat_5, 'expense', v_pos, 'en')
      RETURNING id INTO v_card_id;
    INSERT INTO card_variants (card_id, label, amount, is_default, position) VALUES
      (v_card_id, '$30', 30, true,  0),
      (v_card_id, '$50', 50, false, 1),
      (v_card_id, '$80', 80, false, 2);
    v_pos := v_pos + 1;

  ELSE
    -- 'vi' default — lookup Vietnamese category IDs
    SELECT id INTO v_cat_1 FROM categories WHERE user_id = p_user_id AND name = 'Ăn uống'               LIMIT 1;
    SELECT id INTO v_cat_2 FROM categories WHERE user_id = p_user_id AND name = 'Giải trí'              LIMIT 1;
    SELECT id INTO v_cat_3 FROM categories WHERE user_id = p_user_id AND name = 'Tiền trọ'              LIMIT 1;
    SELECT id INTO v_cat_4 FROM categories WHERE user_id = p_user_id AND name = 'Phụng dưỡng gia đình' LIMIT 1;
    SELECT id INTO v_cat_5 FROM categories WHERE user_id = p_user_id AND name = 'Tiền xăng'             LIMIT 1;

    -- Ăn sáng
    INSERT INTO spending_cards (user_id, title, category_id, type, position, language)
      VALUES (p_user_id, 'Ăn sáng', v_cat_1, 'expense', v_pos, 'vi')
      RETURNING id INTO v_card_id;
    INSERT INTO card_variants (card_id, label, amount, is_default, position) VALUES
      (v_card_id, '25k',  25000,  true,  0),
      (v_card_id, '35k',  35000,  false, 1),
      (v_card_id, '50k',  50000,  false, 2);
    v_pos := v_pos + 1;

    -- Ăn trưa
    INSERT INTO spending_cards (user_id, title, category_id, type, position, language)
      VALUES (p_user_id, 'Ăn trưa', v_cat_1, 'expense', v_pos, 'vi')
      RETURNING id INTO v_card_id;
    INSERT INTO card_variants (card_id, label, amount, is_default, position) VALUES
      (v_card_id, '35k',  35000,  true,  0),
      (v_card_id, '50k',  50000,  false, 1),
      (v_card_id, '70k',  70000,  false, 2);
    v_pos := v_pos + 1;

    -- Ăn tối
    INSERT INTO spending_cards (user_id, title, category_id, type, position, language)
      VALUES (p_user_id, 'Ăn tối', v_cat_1, 'expense', v_pos, 'vi')
      RETURNING id INTO v_card_id;
    INSERT INTO card_variants (card_id, label, amount, is_default, position) VALUES
      (v_card_id, '50k',  50000,  true,  0),
      (v_card_id, '70k',  70000,  false, 1),
      (v_card_id, '100k', 100000, false, 2);
    v_pos := v_pos + 1;

    -- Cà phê
    INSERT INTO spending_cards (user_id, title, category_id, type, position, language)
      VALUES (p_user_id, 'Cà phê', v_cat_1, 'expense', v_pos, 'vi')
      RETURNING id INTO v_card_id;
    INSERT INTO card_variants (card_id, label, amount, is_default, position) VALUES
      (v_card_id, '25k',  25000,  true,  0),
      (v_card_id, '35k',  35000,  false, 1),
      (v_card_id, '45k',  45000,  false, 2);
    v_pos := v_pos + 1;

    -- Nhậu nhẹt
    INSERT INTO spending_cards (user_id, title, category_id, type, position, language)
      VALUES (p_user_id, 'Nhậu nhẹt', v_cat_2, 'expense', v_pos, 'vi')
      RETURNING id INTO v_card_id;
    INSERT INTO card_variants (card_id, label, amount, is_default, position) VALUES
      (v_card_id, '100k', 100000, true,  0),
      (v_card_id, '200k', 200000, false, 1),
      (v_card_id, '300k', 300000, false, 2);
    v_pos := v_pos + 1;

    -- Tiền trọ
    INSERT INTO spending_cards (user_id, title, category_id, type, position, language)
      VALUES (p_user_id, 'Tiền trọ', v_cat_3, 'expense', v_pos, 'vi')
      RETURNING id INTO v_card_id;
    INSERT INTO card_variants (card_id, label, amount, is_default, position) VALUES
      (v_card_id, '2.5m', 2500000, false, 0),
      (v_card_id, '3m',   3000000, true,  1),
      (v_card_id, '3.5m', 3500000, false, 2);
    v_pos := v_pos + 1;

    -- Phụng dưỡng
    INSERT INTO spending_cards (user_id, title, category_id, type, position, language)
      VALUES (p_user_id, 'Phụng dưỡng', v_cat_4, 'expense', v_pos, 'vi')
      RETURNING id INTO v_card_id;
    INSERT INTO card_variants (card_id, label, amount, is_default, position) VALUES
      (v_card_id, '500k', 500000,  false, 0),
      (v_card_id, '1m',   1000000, true,  1),
      (v_card_id, '2m',   2000000, false, 2);
    v_pos := v_pos + 1;

    -- Tiền xăng
    INSERT INTO spending_cards (user_id, title, category_id, type, position, language)
      VALUES (p_user_id, 'Tiền xăng', v_cat_5, 'expense', v_pos, 'vi')
      RETURNING id INTO v_card_id;
    INSERT INTO card_variants (card_id, label, amount, is_default, position) VALUES
      (v_card_id, '50k',  50000,  true,  0),
      (v_card_id, '100k', 100000, false, 1),
      (v_card_id, '150k', 150000, false, 2);
    v_pos := v_pos + 1;

  END IF;
END;
$func$;

-- ─── 6. Rewrite ensure_user_seeded ───────────────────────────────────────────
-- Now accepts p_language; seeding only happens after user picks a language.
CREATE OR REPLACE FUNCTION ensure_user_seeded(
  p_user_id  UUID,
  p_name     TEXT DEFAULT NULL,
  p_language TEXT DEFAULT 'vi'
)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $func$
DECLARE
  v_updated INT;
BEGIN
  -- Upsert profile (without overwriting existing language)
  INSERT INTO profiles (id, name, is_seeded, language)
  VALUES (p_user_id, p_name, false, p_language)
  ON CONFLICT (id) DO NOTHING;

  -- Atomically claim the seed slot — only one concurrent call will succeed
  UPDATE profiles
  SET is_seeded = true, language = p_language
  WHERE id = p_user_id AND is_seeded = false;

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  IF v_updated = 0 THEN
    RETURN false; -- already seeded, nothing to do
  END IF;

  -- Seed categories and cards using the chosen language
  PERFORM seed_default_categories(p_user_id, p_language);
  PERFORM seed_default_cards(p_user_id, p_language);

  RETURN true;
END;
$func$;
