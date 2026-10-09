-- ============================================================================
-- NEXCART – A FULL-STACK E-COMMERCE PLATFORM
-- Tagline: "Your Next Shopping Experience"
-- SCRIPT 03: DATABASE VERIFICATION & ANALYTICAL QUERIES
-- Database Engine: MySQL Server 8.0 (InnoDB) | Database: ecommerce_db
-- ============================================================================

USE ecommerce_db;

-- ============================================================================
-- 1. VERIFY ALL 12 TABLES AND ROW COUNTS
-- ============================================================================
SELECT 
    'admin' AS table_name, COUNT(*) AS total_rows FROM admin
UNION ALL SELECT 'customer', COUNT(*) FROM customer
UNION ALL SELECT 'category', COUNT(*) FROM category
UNION ALL SELECT 'product', COUNT(*) FROM product
UNION ALL SELECT 'inventory', COUNT(*) FROM inventory
UNION ALL SELECT 'address', COUNT(*) FROM address
UNION ALL SELECT 'cart', COUNT(*) FROM cart
UNION ALL SELECT 'orders', COUNT(*) FROM orders
UNION ALL SELECT 'order_details', COUNT(*) FROM order_details
UNION ALL SELECT 'payment', COUNT(*) FROM payment
UNION ALL SELECT 'shipping', COUNT(*) FROM shipping
UNION ALL SELECT 'review', COUNT(*) FROM review;

-- ============================================================================
-- 1B. VERIFY CUSTOMER DIRECTORY & PHONE NUMBERS
-- ============================================================================
SELECT 
    customer_id,
    full_name,
    email,
    phone,
    is_active,
    created_at
FROM customer
ORDER BY customer_id ASC;

-- ============================================================================
-- 2. VERIFY PRODUCT CATALOG WITH INVENTORY (1:1 RELATIONSHIP) & CATEGORY (1:M)
-- ============================================================================
SELECT 
    p.product_id,
    p.product_name,
    c.category_name,
    p.price,
    i.quantity AS stock_quantity,
    i.low_stock_threshold,
    CASE 
        WHEN i.quantity = 0 THEN 'OUT OF STOCK'
        WHEN i.quantity <= i.low_stock_threshold THEN 'LOW STOCK ALERT'
        ELSE 'IN STOCK'
    END AS stock_status
FROM product p
JOIN category c ON p.category_id = c.category_id
JOIN inventory i ON p.product_id = i.product_id
ORDER BY p.price DESC;

-- ============================================================================
-- 3. COMPLETE ORDER AUDIT: FULL 7-TABLE JOIN
-- (Order -> Customer -> Address -> Order Details -> Product -> Payment -> Shipping)
-- ============================================================================
SELECT 
    o.order_id,
    o.order_date,
    c.full_name AS customer_name,
    c.email AS customer_email,
    c.phone AS customer_phone,
    a.phone AS delivery_phone,
    CONCAT(a.street_address, ', ', a.city, ', ', a.state, ' - ', a.postal_code) AS delivery_address,
    p.product_name,
    od.quantity,
    od.unit_price,
    od.subtotal,
    o.total_amount AS order_grand_total,
    o.order_status,
    pay.payment_method,
    pay.payment_status,
    ship.carrier,
    ship.tracking_number,
    ship.shipping_status
FROM orders o
JOIN customer c ON o.customer_id = c.customer_id
JOIN address a ON o.address_id = a.address_id
JOIN order_details od ON o.order_id = od.order_id
JOIN product p ON od.product_id = p.product_id
JOIN payment pay ON o.order_id = pay.order_id
JOIN shipping ship ON o.order_id = ship.order_id
ORDER BY o.order_id ASC, od.order_detail_id ASC;

-- ============================================================================
-- 4. ACTIVE SHOPPING CARTS (Customer -> Cart -> Product)
-- ============================================================================
SELECT 
    cart.cart_id,
    c.full_name AS customer_name,
    p.product_name,
    p.price AS unit_price,
    cart.quantity,
    (p.price * cart.quantity) AS item_total,
    i.quantity AS current_stock
FROM cart
JOIN customer c ON cart.customer_id = c.customer_id
JOIN product p ON cart.product_id = p.product_id
JOIN inventory i ON p.product_id = i.product_id
ORDER BY c.customer_id, cart.cart_id;

-- ============================================================================
-- 5. PRODUCT REVIEWS & AVERAGE RATINGS (Product -> Review = 1:M)
-- ============================================================================
SELECT 
    p.product_id,
    p.product_name,
    COUNT(r.review_id) AS total_reviews,
    COALESCE(ROUND(AVG(r.rating), 1), 0.0) AS average_rating
FROM product p
LEFT JOIN review r ON p.product_id = r.product_id
GROUP BY p.product_id, p.product_name
ORDER BY average_rating DESC, total_reviews DESC;

-- ============================================================================
-- 6. ADMIN DASHBOARD ANALYTICS (Revenue & Status Breakdown)
-- ============================================================================
-- Total Revenue from completed payments
SELECT 
    COUNT(DISTINCT o.order_id) AS total_orders_placed,
    SUM(p.amount) AS total_revenue_collected
FROM orders o
JOIN payment p ON o.order_id = p.order_id
WHERE p.payment_status = 'Completed';

-- Sales breakdown by category
SELECT 
    cat.category_name,
    COUNT(od.order_detail_id) AS items_sold,
    SUM(od.subtotal) AS category_revenue
FROM category cat
JOIN product p ON cat.category_id = p.category_id
JOIN order_details od ON p.product_id = od.product_id
GROUP BY cat.category_id, cat.category_name
ORDER BY category_revenue DESC;
