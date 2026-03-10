-- Migration: fix data corruption caused by migrations running multiple times
-- Root cause:
--   - 001_update_categories ran twice → deleted categories, re-seeded with new UUIDs
--     → spending_cards.category_id set to NULL (via ON DELETE SET NULL)
--   - 002_seed_default_cards may have run twice → duplicate spending_cards

-- ─── Step 1: Remove duplicate categories ────────────────────────────────────
-- Keep the oldest row per (user_id, name, type)
DELETE FROM categories
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id, name, type) id
  FROM categories
  ORDER BY user_id, name, type, created_at ASC
);

-- ─── Step 2: Remove duplicate spending_cards ────────────────────────────────
-- First delete variants of duplicate cards
DELETE FROM card_variants
WHERE card_id IN (
  SELECT id FROM spending_cards
  WHERE id NOT IN (
    SELECT DISTINCT ON (user_id, title) id
    FROM spending_cards
    ORDER BY user_id, title, created_at ASC
  )
);

-- Then delete the duplicate cards themselves
DELETE FROM spending_cards
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id, title) id
  FROM spending_cards
  ORDER BY user_id, title, created_at ASC
);

-- ─── Step 3: Re-link default spending_cards to correct categories ────────────
-- Fixes cards whose category_id is NULL (or wrong) due to categories being
-- deleted and re-created with new UUIDs.
UPDATE spending_cards sc
SET category_id = (
  SELECT c.id
  FROM categories c
  WHERE c.user_id = sc.user_id
    AND c.name = CASE sc.title
      WHEN 'Ăn sáng'     THEN 'Ăn uống'
      WHEN 'Ăn trưa'     THEN 'Ăn uống'
      WHEN 'Ăn tối'      THEN 'Ăn uống'
      WHEN 'Cà phê'      THEN 'Ăn uống'
      WHEN 'Nhậu nhẹt'   THEN 'Giải trí'
      WHEN 'Tiền trọ'    THEN 'Tiền trọ'
      WHEN 'Phụng dưỡng' THEN 'Phụng dưỡng gia đình'
      WHEN 'Tiền xăng'   THEN 'Tiền xăng'
      WHEN 'Thuốc men'   THEN 'Y tế'
      ELSE NULL
    END
  LIMIT 1
)
WHERE sc.title IN (
  'Ăn sáng', 'Ăn trưa', 'Ăn tối', 'Cà phê',
  'Nhậu nhẹt', 'Tiền trọ', 'Phụng dưỡng', 'Tiền xăng', 'Thuốc men'
);

-- ─── Step 4: Add unique constraint to prevent future duplicate categories ────
ALTER TABLE categories
  ADD CONSTRAINT categories_user_name_type_unique UNIQUE (user_id, name, type);

-- ─── Step 5: Make seed_default_categories idempotent ────────────────────────
-- Use INSERT ON CONFLICT DO NOTHING so re-running is safe
CREATE OR REPLACE FUNCTION seed_default_categories(p_user_id UUID)
RETURNS VOID LANGUAGE plpgsql AS $func$
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
    (p_user_id, 'Khác',                   '📦', '#6b7280', 'income')
  ON CONFLICT (user_id, name, type) DO NOTHING;
END;
$func$;

-- ─── Step 6: Make seed_default_cards idempotent ──────────────────────────────
CREATE OR REPLACE FUNCTION seed_default_cards(p_user_id UUID)
RETURNS VOID LANGUAGE plpgsql AS $func$
DECLARE
  v_cat_an_uong        UUID;
  v_cat_giai_tri       UUID;
  v_cat_tro            UUID;
  v_cat_phung_duong    UUID;
  v_cat_xang           UUID;
  v_cat_y_te           UUID;
  v_card_id            UUID;
  v_pos                INT := 0;
BEGIN
  -- Guard: if user already has cards, do nothing
  IF EXISTS (SELECT 1 FROM spending_cards WHERE user_id = p_user_id) THEN
    RETURN;
  END IF;

  SELECT id INTO v_cat_an_uong     FROM categories WHERE user_id = p_user_id AND name = 'Ăn uống'               LIMIT 1;
  SELECT id INTO v_cat_giai_tri    FROM categories WHERE user_id = p_user_id AND name = 'Giải trí'              LIMIT 1;
  SELECT id INTO v_cat_tro         FROM categories WHERE user_id = p_user_id AND name = 'Tiền trọ'              LIMIT 1;
  SELECT id INTO v_cat_phung_duong FROM categories WHERE user_id = p_user_id AND name = 'Phụng dưỡng gia đình' LIMIT 1;
  SELECT id INTO v_cat_xang        FROM categories WHERE user_id = p_user_id AND name = 'Tiền xăng'             LIMIT 1;
  SELECT id INTO v_cat_y_te        FROM categories WHERE user_id = p_user_id AND name = 'Y tế'                  LIMIT 1;

  INSERT INTO spending_cards (user_id, title, category_id, type, position)
    VALUES (p_user_id, 'Ăn sáng', v_cat_an_uong, 'expense', v_pos)
    RETURNING id INTO v_card_id;
  INSERT INTO card_variants (card_id, label, amount, is_default, position) VALUES
    (v_card_id, '25k',  25000,  true,  0),
    (v_card_id, '35k',  35000,  false, 1),
    (v_card_id, '50k',  50000,  false, 2);
  v_pos := v_pos + 1;

  INSERT INTO spending_cards (user_id, title, category_id, type, position)
    VALUES (p_user_id, 'Ăn trưa', v_cat_an_uong, 'expense', v_pos)
    RETURNING id INTO v_card_id;
  INSERT INTO card_variants (card_id, label, amount, is_default, position) VALUES
    (v_card_id, '35k',  35000,  true,  0),
    (v_card_id, '50k',  50000,  false, 1),
    (v_card_id, '70k',  70000,  false, 2);
  v_pos := v_pos + 1;

  INSERT INTO spending_cards (user_id, title, category_id, type, position)
    VALUES (p_user_id, 'Ăn tối', v_cat_an_uong, 'expense', v_pos)
    RETURNING id INTO v_card_id;
  INSERT INTO card_variants (card_id, label, amount, is_default, position) VALUES
    (v_card_id, '50k',  50000,  true,  0),
    (v_card_id, '70k',  70000,  false, 1),
    (v_card_id, '100k', 100000, false, 2);
  v_pos := v_pos + 1;

  INSERT INTO spending_cards (user_id, title, category_id, type, position)
    VALUES (p_user_id, 'Cà phê', v_cat_an_uong, 'expense', v_pos)
    RETURNING id INTO v_card_id;
  INSERT INTO card_variants (card_id, label, amount, is_default, position) VALUES
    (v_card_id, '25k',  25000,  true,  0),
    (v_card_id, '35k',  35000,  false, 1),
    (v_card_id, '45k',  45000,  false, 2);
  v_pos := v_pos + 1;

  INSERT INTO spending_cards (user_id, title, category_id, type, position)
    VALUES (p_user_id, 'Nhậu nhẹt', v_cat_giai_tri, 'expense', v_pos)
    RETURNING id INTO v_card_id;
  INSERT INTO card_variants (card_id, label, amount, is_default, position) VALUES
    (v_card_id, '100k', 100000, true,  0),
    (v_card_id, '200k', 200000, false, 1),
    (v_card_id, '300k', 300000, false, 2);
  v_pos := v_pos + 1;

  INSERT INTO spending_cards (user_id, title, category_id, type, position)
    VALUES (p_user_id, 'Tiền trọ', v_cat_tro, 'expense', v_pos)
    RETURNING id INTO v_card_id;
  INSERT INTO card_variants (card_id, label, amount, is_default, position) VALUES
    (v_card_id, '2.5m', 2500000, false, 0),
    (v_card_id, '3m',   3000000, true,  1),
    (v_card_id, '3.5m', 3500000, false, 2);
  v_pos := v_pos + 1;

  INSERT INTO spending_cards (user_id, title, category_id, type, position)
    VALUES (p_user_id, 'Phụng dưỡng', v_cat_phung_duong, 'expense', v_pos)
    RETURNING id INTO v_card_id;
  INSERT INTO card_variants (card_id, label, amount, is_default, position) VALUES
    (v_card_id, '500k', 500000,  false, 0),
    (v_card_id, '1m',   1000000, true,  1),
    (v_card_id, '2m',   2000000, false, 2);
  v_pos := v_pos + 1;

  INSERT INTO spending_cards (user_id, title, category_id, type, position)
    VALUES (p_user_id, 'Tiền xăng', v_cat_xang, 'expense', v_pos)
    RETURNING id INTO v_card_id;
  INSERT INTO card_variants (card_id, label, amount, is_default, position) VALUES
    (v_card_id, '50k',  50000,  true,  0),
    (v_card_id, '100k', 100000, false, 1),
    (v_card_id, '150k', 150000, false, 2);
  v_pos := v_pos + 1;

  INSERT INTO spending_cards (user_id, title, category_id, type, position)
    VALUES (p_user_id, 'Thuốc men', v_cat_y_te, 'expense', v_pos)
    RETURNING id INTO v_card_id;
  INSERT INTO card_variants (card_id, label, amount, is_default, position) VALUES
    (v_card_id, '50k',  50000,  true,  0),
    (v_card_id, '100k', 100000, false, 1),
    (v_card_id, '200k', 200000, false, 2);
END;
$func$;
