-- Migration: add seed_default_cards function + seed existing users
-- Run via Supabase SQL Editor: https://supabase.com/dashboard/project/jpvdpovbnycoezszfnwd/sql/new

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
  -- Lookup category IDs for this user
  SELECT id INTO v_cat_an_uong     FROM categories WHERE user_id = p_user_id AND name = 'Ăn uống'               LIMIT 1;
  SELECT id INTO v_cat_giai_tri    FROM categories WHERE user_id = p_user_id AND name = 'Giải trí'              LIMIT 1;
  SELECT id INTO v_cat_tro         FROM categories WHERE user_id = p_user_id AND name = 'Tiền trọ'              LIMIT 1;
  SELECT id INTO v_cat_phung_duong FROM categories WHERE user_id = p_user_id AND name = 'Phụng dưỡng gia đình' LIMIT 1;
  SELECT id INTO v_cat_xang        FROM categories WHERE user_id = p_user_id AND name = 'Tiền xăng'             LIMIT 1;
  SELECT id INTO v_cat_y_te        FROM categories WHERE user_id = p_user_id AND name = 'Y tế'                  LIMIT 1;

  -- Ăn sáng
  INSERT INTO spending_cards (user_id, title, category_id, type, position)
    VALUES (p_user_id, 'Ăn sáng', v_cat_an_uong, 'expense', v_pos)
    RETURNING id INTO v_card_id;
  INSERT INTO card_variants (card_id, label, amount, is_default, position) VALUES
    (v_card_id, '25k',  25000,  true,  0),
    (v_card_id, '35k',  35000,  false, 1),
    (v_card_id, '50k',  50000,  false, 2);
  v_pos := v_pos + 1;

  -- Ăn trưa
  INSERT INTO spending_cards (user_id, title, category_id, type, position)
    VALUES (p_user_id, 'Ăn trưa', v_cat_an_uong, 'expense', v_pos)
    RETURNING id INTO v_card_id;
  INSERT INTO card_variants (card_id, label, amount, is_default, position) VALUES
    (v_card_id, '35k',  35000,  true,  0),
    (v_card_id, '50k',  50000,  false, 1),
    (v_card_id, '70k',  70000,  false, 2);
  v_pos := v_pos + 1;

  -- Ăn tối
  INSERT INTO spending_cards (user_id, title, category_id, type, position)
    VALUES (p_user_id, 'Ăn tối', v_cat_an_uong, 'expense', v_pos)
    RETURNING id INTO v_card_id;
  INSERT INTO card_variants (card_id, label, amount, is_default, position) VALUES
    (v_card_id, '50k',  50000,  true,  0),
    (v_card_id, '70k',  70000,  false, 1),
    (v_card_id, '100k', 100000, false, 2);
  v_pos := v_pos + 1;

  -- Cà phê
  INSERT INTO spending_cards (user_id, title, category_id, type, position)
    VALUES (p_user_id, 'Cà phê', v_cat_an_uong, 'expense', v_pos)
    RETURNING id INTO v_card_id;
  INSERT INTO card_variants (card_id, label, amount, is_default, position) VALUES
    (v_card_id, '25k',  25000,  true,  0),
    (v_card_id, '35k',  35000,  false, 1),
    (v_card_id, '45k',  45000,  false, 2);
  v_pos := v_pos + 1;

  -- Nhậu nhẹt
  INSERT INTO spending_cards (user_id, title, category_id, type, position)
    VALUES (p_user_id, 'Nhậu nhẹt', v_cat_giai_tri, 'expense', v_pos)
    RETURNING id INTO v_card_id;
  INSERT INTO card_variants (card_id, label, amount, is_default, position) VALUES
    (v_card_id, '100k', 100000, true,  0),
    (v_card_id, '200k', 200000, false, 1),
    (v_card_id, '300k', 300000, false, 2);
  v_pos := v_pos + 1;

  -- Tiền trọ
  INSERT INTO spending_cards (user_id, title, category_id, type, position)
    VALUES (p_user_id, 'Tiền trọ', v_cat_tro, 'expense', v_pos)
    RETURNING id INTO v_card_id;
  INSERT INTO card_variants (card_id, label, amount, is_default, position) VALUES
    (v_card_id, '2.5m', 2500000, false, 0),
    (v_card_id, '3m',   3000000, true,  1),
    (v_card_id, '3.5m', 3500000, false, 2);
  v_pos := v_pos + 1;

  -- Phụng dưỡng
  INSERT INTO spending_cards (user_id, title, category_id, type, position)
    VALUES (p_user_id, 'Phụng dưỡng', v_cat_phung_duong, 'expense', v_pos)
    RETURNING id INTO v_card_id;
  INSERT INTO card_variants (card_id, label, amount, is_default, position) VALUES
    (v_card_id, '500k', 500000,  false, 0),
    (v_card_id, '1m',   1000000, true,  1),
    (v_card_id, '2m',   2000000, false, 2);
  v_pos := v_pos + 1;

  -- Tiền xăng
  INSERT INTO spending_cards (user_id, title, category_id, type, position)
    VALUES (p_user_id, 'Tiền xăng', v_cat_xang, 'expense', v_pos)
    RETURNING id INTO v_card_id;
  INSERT INTO card_variants (card_id, label, amount, is_default, position) VALUES
    (v_card_id, '50k',  50000,  true,  0),
    (v_card_id, '100k', 100000, false, 1),
    (v_card_id, '150k', 150000, false, 2);
  v_pos := v_pos + 1;

  -- Thuốc men
  INSERT INTO spending_cards (user_id, title, category_id, type, position)
    VALUES (p_user_id, 'Thuốc men', v_cat_y_te, 'expense', v_pos)
    RETURNING id INTO v_card_id;
  INSERT INTO card_variants (card_id, label, amount, is_default, position) VALUES
    (v_card_id, '50k',  50000,  true,  0),
    (v_card_id, '100k', 100000, false, 1),
    (v_card_id, '200k', 200000, false, 2);
  v_pos := v_pos + 1;
END;
$func$;

-- Seed existing users that have categories but no cards
DO $$
DECLARE uid UUID;
BEGIN
  FOR uid IN
    SELECT DISTINCT c.user_id FROM categories c
    WHERE NOT EXISTS (SELECT 1 FROM spending_cards sc WHERE sc.user_id = c.user_id)
  LOOP
    PERFORM seed_default_cards(uid);
  END LOOP;
END;
$$;
