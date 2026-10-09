-- ============================================================================
-- NEXCART – A FULL-STACK E-COMMERCE PLATFORM
-- Tagline: "Your Next Shopping Experience"
-- SCRIPT 02: SEED SAMPLE DATA (DML)
-- Database Engine: MySQL Server 8.0 (InnoDB) | Database: ecommerce_db
-- ============================================================================

USE ecommerce_db;

SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE review;
TRUNCATE TABLE shipping;
TRUNCATE TABLE payment;
TRUNCATE TABLE order_details;
TRUNCATE TABLE orders;
TRUNCATE TABLE cart;
TRUNCATE TABLE address;
TRUNCATE TABLE inventory;
TRUNCATE TABLE product;
TRUNCATE TABLE category;
TRUNCATE TABLE customer;
TRUNCATE TABLE admin;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- 1. ADMINS
-- Passwords hashed using bcrypt (Default password for testing: 'Admin@123')
-- ============================================================================
INSERT INTO admin (admin_id, username, email, password_hash, full_name, role, is_active)
VALUES 
(1, 'superadmin', 'admin@nexusecom.com', '$2b$12$5lfJyg/YYmwC2Nn4.EIuxOoqM0Gcu3V.yDJk/gLhpYvQWEqXviDXe', 'System Administrator', 'superadmin', TRUE),
(2, 'manager_rahul', 'rahul.manager@nexusecom.com', '$2b$12$5lfJyg/YYmwC2Nn4.EIuxOoqM0Gcu3V.yDJk/gLhpYvQWEqXviDXe', 'Rahul Sharma', 'manager', TRUE);

-- ============================================================================
-- 2. CUSTOMERS
-- Passwords hashed using bcrypt (Default password for testing: 'Customer@123')
-- ============================================================================
INSERT INTO customer (customer_id, full_name, email, phone, password_hash, is_active)
VALUES 
(1, 'Aarav Patel', 'aarav.patel@gmail.com', '+91 9876543210', '$2b$12$ofN5NVRGfwWFCis06Mvrduwz4.fEjk1oa0WFhoMG84dmAqbB3gtMO', TRUE),
(2, 'Priya Nair', 'priya.nair@yahoo.com', '+91 9823456789', '$2b$12$ofN5NVRGfwWFCis06Mvrduwz4.fEjk1oa0WFhoMG84dmAqbB3gtMO', TRUE),
(3, 'Rohan Verma', 'rohan.verma@outlook.com', '+91 9123456780', '$2b$12$ofN5NVRGfwWFCis06Mvrduwz4.fEjk1oa0WFhoMG84dmAqbB3gtMO', TRUE),
(4, 'Ananya Iyer', 'ananya.iyer@gmail.com', '+91 9988776655', '$2b$12$ofN5NVRGfwWFCis06Mvrduwz4.fEjk1oa0WFhoMG84dmAqbB3gtMO', TRUE);

-- ============================================================================
-- 3. CATEGORIES
-- High-resolution Unsplash image assets
-- ============================================================================
INSERT INTO category (category_id, category_name, slug, description, image_url, is_active)
VALUES 
(1, 'Laptops & Computers', 'laptops-computers', 'High performance computing machines, ultrabooks, and workstations.', 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80', TRUE),
(2, 'Smartphones & Tablets', 'smartphones-tablets', 'Next-gen flagship smartphones, folding displays, and pro tablets.', 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80', TRUE),
(3, 'Audio & Headphones', 'audio-headphones', 'Noise cancelling headphones, studio monitors, and wireless earbuds.', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80', TRUE),
(4, 'Smart Wearables', 'smart-wearables', 'Fitness trackers, luxury smartwatches, and biometric monitors.', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80', TRUE),
(5, 'Accessories & Peripherals', 'accessories-peripherals', 'Mechanical keyboards, ergonomic mice, 4K monitors, and GaN chargers.', 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=800&q=80', TRUE);

-- ============================================================================
-- 4. PRODUCTS
-- Category -> Product = 1:M
-- ============================================================================
INSERT INTO product (product_id, category_id, product_name, slug, description, price, image_url, is_active)
VALUES 
-- Category 1: Laptops
(1, 1, 'MacBook Pro 16" M3 Max', 'macbook-pro-16-m3-max', 'Apple M3 Max chip with 16-core CPU, 40-core GPU, 48GB Unified Memory, and 1TB SSD storage in Space Black.', 349900.00, 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80', TRUE),
(2, 1, 'Dell XPS 15 OLED Touch', 'dell-xps-15-oled-touch', '13th Gen Intel Core i9, NVIDIA RTX 4070, 32GB DDR5 RAM, 3.5K OLED InfinityEdge touch display.', 215000.00, 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=80', TRUE),
(3, 1, 'ASUS ROG Zephyrus G14', 'asus-rog-zephyrus-g14', 'Ultra-portable gaming beast with AMD Ryzen 9, RTX 4080, Nebula 165Hz HDR Display, and AniMe Matrix lid.', 189990.00, 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80', TRUE),

-- Category 2: Smartphones
(4, 2, 'iPhone 15 Pro Max 256GB', 'iphone-15-pro-max-256gb', 'Forged in aerospace-grade titanium with A17 Pro chip, 5x telephoto optical zoom, and Action button.', 159900.00, 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80', TRUE),
(5, 2, 'Samsung Galaxy S24 Ultra', 'samsung-galaxy-s24-ultra', 'Galaxy AI-powered flagship with 200MP camera, built-in S-Pen, and flat 6.8" Dynamic AMOLED 2X display.', 129999.00, 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=800&q=80', TRUE),
(6, 2, 'Google Pixel 8 Pro', 'google-pixel-8-pro', 'Google Tensor G3 silicon, industry-leading computational photography, and temperature sensor in Bay Blue.', 98999.00, 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80', TRUE),

-- Category 3: Audio
(7, 3, 'Sony WH-1000XM5 Wireless', 'sony-wh-1000xm5-wireless', 'Industry-leading noise canceling headphones with dual processors, 8 microphones, and 30-hour battery.', 29990.00, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80', TRUE),
(8, 3, 'Bose QuietComfort Ultra', 'bose-quietcomfort-ultra', 'Breakthrough spatialized audio with CustomTune sound calibration and ultra-plush leatherette earcups.', 35900.00, 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80', TRUE),
(9, 3, 'AirPods Pro (2nd Gen, USB-C)', 'airpods-pro-2nd-gen-usbc', 'Active Noise Cancellation with Adaptive Audio, Transparency mode, and MagSafe Charging Case with speaker.', 24900.00, 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&w=800&q=80', TRUE),

-- Category 4: Wearables
(10, 4, 'Apple Watch Ultra 2', 'apple-watch-ultra-2', 'Rugged 49mm titanium case, 3000-nit retina display, precision dual-frequency GPS, and 36-hr battery life.', 89900.00, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80', TRUE),
(11, 4, 'Garmin Fenix 7X Pro Solar', 'garmin-fenix-7x-pro-solar', 'Multisport GPS smartwatch with Power Sapphire solar charging lens and built-in LED flashlight.', 94990.00, 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=800&q=80', TRUE),

-- Category 5: Accessories
(12, 5, 'Logitech MX Master 3S', 'logitech-mx-master-3s', 'Ergonomic wireless performance mouse with 8K DPI sensor on glass, Quiet Clicks, and MagSpeed wheel.', 9495.00, 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=800&q=80', TRUE),
(13, 5, 'Keychron Q1 Pro Wireless Mechanical', 'keychron-q1-pro-wireless', 'Fully customizable 75% mechanical keyboard with CNC aluminum body, double-gasket design, and hot-swap.', 17999.00, 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80', TRUE),
(14, 5, 'Anker Prime 200W GaN Charging Station', 'anker-prime-200w-gan-station', 'Multi-device ultra-fast charging dock with 4 USB-C ports, 2 USB-A ports, and smart power distribution.', 11999.00, 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=80', TRUE);

-- ============================================================================
-- 5. INVENTORY
-- Product -> Inventory = 1:1
-- ============================================================================
INSERT INTO inventory (inventory_id, product_id, quantity, low_stock_threshold)
VALUES 
(1, 1, 15, 5),   -- MacBook Pro
(2, 2, 8, 4),    -- Dell XPS 15
(3, 3, 4, 5),    -- ASUS ROG (Low stock demo)
(4, 4, 25, 6),   -- iPhone 15 Pro Max
(5, 5, 18, 5),   -- Samsung Galaxy S24 Ultra
(6, 6, 12, 4),   -- Google Pixel 8 Pro
(7, 7, 30, 8),   -- Sony Headphones
(8, 8, 14, 5),   -- Bose QuietComfort
(9, 9, 45, 10),  -- AirPods Pro
(10, 10, 9, 3),  -- Apple Watch Ultra 2
(11, 11, 3, 5),  -- Garmin Watch (Low stock demo)
(12, 12, 50, 10),-- MX Master 3S
(13, 13, 20, 5), -- Keychron Keyboard
(14, 14, 35, 8); -- Anker GaN Charger

-- ============================================================================
-- 6. ADDRESS
-- Customer -> Address = 1:M
-- ============================================================================
INSERT INTO address (address_id, customer_id, address_type, recipient_name, phone, street_address, city, state, postal_code, country, is_default, is_active)
VALUES 
(1, 1, 'Home', 'Aarav Patel', '+91 9876543210', 'Flat 402, Shanti Heights, Ring Road', 'Ahmedabad', 'Gujarat', '380015', 'India', TRUE, TRUE),
(2, 1, 'Office', 'Aarav Patel (Desk 4B)', '+91 9876543210', 'Tech Park Phase 2, SG Highway', 'Ahmedabad', 'Gujarat', '380054', 'India', FALSE, TRUE),
(3, 2, 'Home', 'Priya Nair', '+91 9823456789', 'Villa 12, Palm Meadows, Whitefield', 'Bengaluru', 'Karnataka', '560066', 'India', TRUE, TRUE),
(4, 3, 'College', 'Rohan Verma (Hostel Block C, Rm 204)', '+91 9123456780', 'National Institute of Technology Campus', 'Surathkal', 'Karnataka', '575025', 'India', TRUE, TRUE),
(5, 4, 'Home', 'Ananya Iyer', '+91 9988776655', '34/B, Gokulam 3rd Stage', 'Mysuru', 'Karnataka', '570002', 'India', TRUE, TRUE);

-- ============================================================================
-- 7. CART
-- Customer -> Cart = 1:M, Product -> Cart = 1:M
-- ============================================================================
INSERT INTO cart (cart_id, customer_id, product_id, quantity)
VALUES 
(1, 1, 7, 1),   -- Aarav has Sony WH-1000XM5 in cart
(2, 1, 12, 1),  -- Aarav has MX Master 3S in cart
(3, 2, 10, 1),  -- Priya has Apple Watch Ultra in cart
(4, 3, 13, 2);  -- Rohan has 2 Keychron Keyboards in cart

-- ============================================================================
-- 8. ORDERS
-- Customer -> Order = 1:M, Address -> Order = 1:M
-- ============================================================================
INSERT INTO orders (order_id, customer_id, address_id, order_date, total_amount, order_status)
VALUES 
(1, 1, 1, '2026-09-15 10:30:00', 359395.00, 'Delivered'),
(2, 2, 3, '2026-09-20 14:15:00', 159900.00, 'Shipped'),
(3, 3, 4, '2026-09-27 18:45:00', 29990.00,  'Processing'),
(4, 4, 5, '2026-09-28 09:20:00', 129999.00, 'Confirmed');

-- ============================================================================
-- 9. ORDER_DETAILS
-- Order -> Order Details = 1:M, Product -> Order Details = 1:M
-- ============================================================================
INSERT INTO order_details (order_detail_id, order_id, product_id, quantity, unit_price, subtotal)
VALUES 
-- Order 1 items (Total = 349900 + 9495 = 359395)
(1, 1, 1, 1, 349900.00, 349900.00), -- MacBook Pro 16
(2, 1, 12, 1, 9495.00, 9495.00),     -- Logitech MX Master 3S

-- Order 2 items (Total = 159900)
(3, 2, 4, 1, 159900.00, 159900.00),  -- iPhone 15 Pro Max

-- Order 3 items (Total = 29990)
(4, 3, 7, 1, 29990.00, 29990.00),    -- Sony WH-1000XM5

-- Order 4 items (Total = 129999)
(5, 4, 5, 1, 129999.00, 129999.00);  -- Samsung Galaxy S24 Ultra

-- ============================================================================
-- 10. PAYMENT
-- Order -> Payment = 1:1
-- ============================================================================
INSERT INTO payment (payment_id, order_id, payment_method, payment_status, transaction_reference, amount, payment_date)
VALUES 
(1, 1, 'Card Demo', 'Completed', 'TXN_CARD_98234821', 359395.00, '2026-09-15 10:32:15'),
(2, 2, 'UPI Demo', 'Completed', 'TXN_UPI_589320148', 159900.00, '2026-09-20 14:16:02'),
(3, 3, 'UPI Demo', 'Completed', 'TXN_UPI_401928374', 29990.00, '2026-09-27 18:46:10'),
(4, 4, 'Cash on Delivery', 'Pending', 'TXN_COD_819203948', 129999.00, '2026-09-28 09:20:00');

-- ============================================================================
-- 11. SHIPPING
-- Order -> Shipping = 1:1
-- ============================================================================
INSERT INTO shipping (shipping_id, order_id, shipping_status, tracking_number, carrier, estimated_delivery, shipped_at, delivered_at)
VALUES 
(1, 1, 'Delivered', 'TRK-IND-202609-0001', 'BlueDart Express', '2026-09-18', '2026-09-16 08:30:00', '2026-09-18 16:45:00'),
(2, 2, 'Shipped', 'TRK-IND-202609-0002', 'Delhivery Surface', '2026-10-02', '2026-09-21 11:00:00', NULL),
(3, 3, 'Processing', 'TRK-IND-202609-0003', 'SpeedShip Logistics', '2026-10-04', NULL, NULL),
(4, 4, 'Pending', 'TRK-IND-202609-0004', 'SpeedShip Logistics', '2026-10-05', NULL, NULL);

-- ============================================================================
-- 12. REVIEW
-- Product -> Review = 1:M, Customer -> Review = 1:M
-- ============================================================================
INSERT INTO review (review_id, product_id, customer_id, rating, comment, review_date)
VALUES 
(1, 1, 1, 5, 'The M3 Max is an absolute powerhouse. Video rendering in DaVinci Resolve is seamless. Build quality is unmatched.', '2026-09-19 11:20:00'),
(2, 12, 1, 5, 'The silent clicks and thumb scroll wheel make daily productivity effortless. Battery lasts weeks.', '2026-09-19 11:25:00'),
(3, 7, 3, 4, 'Noise cancelling is top notch in noisy study environments. Earcups get slightly warm after 3 hours, but audio quality is stellar.', '2026-09-28 14:10:00');
