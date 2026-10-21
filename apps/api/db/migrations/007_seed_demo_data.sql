-- ═══════════════════════════════════════════════════════
-- SEED DATA: Demo suppliers and products
-- This is demo data. Delete or replace before production.
-- ═══════════════════════════════════════════════════════

-- 1. Create 3 demo suppliers
--    (users with role 'supplier' + supplier_profiles rows)
INSERT INTO users (id, full_name, phone, role, is_active)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Amina Wanjiku', '+254700000001', 'supplier', TRUE),
  ('00000000-0000-0000-0000-000000000002', 'Joseph Otieno', '+254700000002', 'supplier', TRUE),
  ('00000000-0000-0000-0000-000000000003', 'Fatuma Ali', '+254700000003', 'supplier', TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO supplier_profiles (id, shop_name, market, lat, lng, rating, review_count, verified)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Amina''s Sneakers', 'Nairobi CBD', -1.2862, 36.8405, 4.7, 38, TRUE),
  ('00000000-0000-0000-0000-000000000002', 'Otieno Electronics', 'Eastleigh', -1.2745, 36.8485, 4.5, 21, TRUE),
  ('00000000-0000-0000-0000-000000000003', 'Fatuma Fashion', 'Gikomba', -1.2829, 36.8338, 4.8, 52, TRUE)
ON CONFLICT (id) DO NOTHING;

-- 2. Products across the seeded categories
INSERT INTO products (supplier_id, category_id, name, description, price, old_price, image_url, stock, is_flash_sale)
VALUES
  -- Shoes
  ('00000000-0000-0000-0000-000000000001', 'shoes', 'Nike Air Max', 'Classic runner, sizes 40-45', 6500, 7800, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400', 15, TRUE),
  ('00000000-0000-0000-0000-000000000001', 'shoes', 'Adidas Stan Smith', 'Leather sneaker, white', 5200, NULL, 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=400', 20, FALSE),
  -- Electronics
  ('00000000-0000-0000-0000-000000000002', 'electronics', 'Samsung Galaxy A25', 'Dual SIM, 128GB', 28000, 31500, 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=400', 8, TRUE),
  ('00000000-0000-0000-0000-000000000002', 'electronics', 'JBL Tune 510BT', 'Wireless on-ear headphones', 4200, NULL, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400', 25, FALSE),
  ('00000000-0000-0000-0000-000000000002', 'electronics', 'Anker Power Bank 20000mAh', 'Fast charge, 2 USB ports', 3500, 4200, 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400', 30, FALSE),
  -- Fashion
  ('00000000-0000-0000-0000-000000000003', 'fashion', 'Denim Jacket', 'Blue wash, sizes S-XXL', 2800, NULL, 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400', 12, FALSE),
  ('00000000-0000-0000-0000-000000000003', 'fashion', 'Maxi Dress', 'Floral print, cotton', 2200, 2900, 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400', 18, TRUE),
  ('00000000-0000-0000-0000-000000000003', 'fashion', 'Leather Handbag', 'Structured, gold clasp', 3500, NULL, 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400', 10, FALSE),
  -- Home
  ('00000000-0000-0000-0000-000000000003', 'home', 'Non-stick Frying Pan', '28cm, with lid', 1800, NULL, 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=400', 40, FALSE),
  ('00000000-0000-0000-0000-000000000003', 'home', 'Dinner Set (6 pcs)', 'Ceramic, microwave safe', 4500, 5500, 'https://images.unsplash.com/photo-1603199506016-b9a594b593c0?w=400', 15, TRUE);