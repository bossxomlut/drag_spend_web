-- Add "Xe" category for all existing users who don't already have it
INSERT INTO categories (user_id, name, icon, color, type)
SELECT id, 'Xe', '🚗', '#64748b', 'expense'
FROM profiles
WHERE id NOT IN (
  SELECT user_id FROM categories WHERE name = 'Xe' AND type = 'expense'
);
