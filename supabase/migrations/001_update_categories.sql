-- Migration: update default categories to new list
-- Run with: psql <connection-string> -f supabase/migrations/001_update_categories.sql

-- 1. Update the seed function
CREATE OR REPLACE FUNCTION seed_default_categories(p_user_id UUID)
RETURNS VOID LANGUAGE plpgsql AS $func$
BEGIN
  INSERT INTO categories (user_id, name, icon, color, type) VALUES
    (p_user_id, 'Ăn uống',                '🍜', '#f59e0b', 'expense'),
    (p_user_id, 'Tiền trọ',               '🏠', '#3b82f6', 'expense'),
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
$func$;

-- 2. Re-seed all existing users (delete old → insert new)
DO $$
DECLARE uid UUID;
BEGIN
  FOR uid IN SELECT id FROM profiles LOOP
    DELETE FROM categories WHERE user_id = uid;
    PERFORM seed_default_categories(uid);
  END LOOP;
END;
$$;
