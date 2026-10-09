-- ============================================================================
-- NEXCART – A FULL-STACK E-COMMERCE PLATFORM
-- Tagline: "Your Next Shopping Experience"
-- SCRIPT 01: DATABASE SCHEMA DEFINITION (DDL)
-- Database Engine: MySQL Server 8.0 (InnoDB) | Database: ecommerce_db
-- ============================================================================

-- 1. Create and Select Database
CREATE DATABASE IF NOT EXISTS ecommerce_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE ecommerce_db;

-- Disable foreign key checks during schema creation/reset
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS review;
DROP TABLE IF EXISTS shipping;
DROP TABLE IF EXISTS payment;
DROP TABLE IF EXISTS order_details;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS cart;
DROP TABLE IF EXISTS address;
DROP TABLE IF EXISTS inventory;
DROP TABLE IF EXISTS product;
DROP TABLE IF EXISTS category;
DROP TABLE IF EXISTS customer;
DROP TABLE IF EXISTS admin;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- ENTITY 1: ADMIN
-- Purpose: System administrators managing catalog, orders, and analytics.
-- ============================================================================
CREATE TABLE admin (
    admin_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role ENUM('superadmin', 'admin', 'manager') NOT NULL DEFAULT 'admin',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================================
-- ENTITY 2: CUSTOMER
-- Purpose: Registered shoppers who place orders, write reviews, and maintain carts.
-- ============================================================================
CREATE TABLE customer (
    customer_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20) NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================================
-- ENTITY 3: CATEGORY
-- Purpose: Product classification hierarchy (Electronics, Mobiles, Fashion, etc.)
-- ============================================================================
CREATE TABLE category (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NULL,
    image_url VARCHAR(500) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================================
-- ENTITY 4: PRODUCT
-- Relationship: Category -> Product = 1:M
-- Purpose: Items available in store catalog.
-- ============================================================================
CREATE TABLE product (
    product_id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    product_name VARCHAR(200) NOT NULL,
    slug VARCHAR(200) NOT NULL UNIQUE,
    description TEXT NULL,
    price DECIMAL(10, 2) NOT NULL,
    image_url VARCHAR(500) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_product_price CHECK (price >= 0.00),
    
    -- Foreign Key
    CONSTRAINT fk_product_category
        FOREIGN KEY (category_id) REFERENCES category(category_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_product_category ON product(category_id);
CREATE INDEX idx_product_price ON product(price);
CREATE INDEX idx_product_active ON product(is_active);

-- ============================================================================
-- ENTITY 5: INVENTORY
-- Relationship: Product -> Inventory = 1:1
-- Purpose: Real-time stock counts and low-stock threshold management.
-- ============================================================================
CREATE TABLE inventory (
    inventory_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL UNIQUE, -- UNIQUE enforces the strict 1:1 relationship
    quantity INT NOT NULL DEFAULT 0,
    low_stock_threshold INT NOT NULL DEFAULT 5,
    last_restocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_inventory_qty CHECK (quantity >= 0),
    CONSTRAINT chk_inventory_threshold CHECK (low_stock_threshold >= 0),
    
    -- Foreign Key
    CONSTRAINT fk_inventory_product
        FOREIGN KEY (product_id) REFERENCES product(product_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ============================================================================
-- ENTITY 6: ADDRESS
-- Relationship: Customer -> Address = 1:M
-- Purpose: Saved delivery destinations for customer checkout.
-- ============================================================================
CREATE TABLE address (
    address_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    address_type VARCHAR(20) NOT NULL DEFAULT 'Home', -- e.g. Home, Office, College
    recipient_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    street_address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(50) NOT NULL DEFAULT 'India',
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign Key
    CONSTRAINT fk_address_customer
        FOREIGN KEY (customer_id) REFERENCES customer(customer_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_address_customer ON address(customer_id);

-- ============================================================================
-- ENTITY 7: CART
-- Relationship: Customer -> Cart = 1:M, Product -> Cart = 1:M
-- Purpose: Items currently saved in active shopping carts before checkout.
-- ============================================================================
CREATE TABLE cart (
    cart_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_cart_quantity CHECK (quantity > 0),
    CONSTRAINT uq_customer_product UNIQUE (customer_id, product_id),
    
    -- Foreign Keys
    CONSTRAINT fk_cart_customer
        FOREIGN KEY (customer_id) REFERENCES customer(customer_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_cart_product
        FOREIGN KEY (product_id) REFERENCES product(product_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_cart_customer ON cart(customer_id);

-- ============================================================================
-- ENTITY 8: ORDERS
-- Relationship: Customer -> Order = 1:M, Address -> Order = 1:M
-- Purpose: Order invoice header tracking total amount and lifecycle status.
-- ============================================================================
CREATE TABLE orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    address_id INT NOT NULL,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_amount DECIMAL(10, 2) NOT NULL,
    order_status ENUM('Pending', 'Confirmed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled') NOT NULL DEFAULT 'Pending',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_orders_total CHECK (total_amount >= 0.00),
    
    -- Foreign Keys
    CONSTRAINT fk_orders_customer
        FOREIGN KEY (customer_id) REFERENCES customer(customer_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT fk_orders_address
        FOREIGN KEY (address_id) REFERENCES address(address_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(order_status);
CREATE INDEX idx_orders_date ON orders(order_date);

-- ============================================================================
-- ENTITY 9: ORDER_DETAILS
-- Relationship: Order -> Order Details = 1:M, Product -> Order Details = 1:M
-- Purpose: Line-item items purchased inside an order with frozen price snapshots.
-- ============================================================================
CREATE TABLE order_details (
    order_detail_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    
    -- Constraints
    CONSTRAINT chk_orderdetail_qty CHECK (quantity > 0),
    CONSTRAINT chk_orderdetail_price CHECK (unit_price >= 0.00),
    CONSTRAINT chk_orderdetail_subtotal CHECK (subtotal >= 0.00),
    
    -- Foreign Keys
    CONSTRAINT fk_orderdetails_order
        FOREIGN KEY (order_id) REFERENCES orders(order_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_orderdetails_product
        FOREIGN KEY (product_id) REFERENCES product(product_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_orderdetails_order ON order_details(order_id);
CREATE INDEX idx_orderdetails_product ON order_details(product_id);

-- ============================================================================
-- ENTITY 10: PAYMENT
-- Relationship: Order -> Payment = 1:1
-- Purpose: Payment transaction settlement associated with an order.
-- ============================================================================
CREATE TABLE payment (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL UNIQUE, -- UNIQUE enforces the strict 1:1 relationship
    payment_method ENUM('Cash on Delivery', 'Card Demo', 'UPI Demo') NOT NULL,
    payment_status ENUM('Pending', 'Completed', 'Failed', 'Refunded') NOT NULL DEFAULT 'Pending',
    transaction_reference VARCHAR(100) NULL UNIQUE,
    amount DECIMAL(10, 2) NOT NULL,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_payment_amount CHECK (amount >= 0.00),
    
    -- Foreign Key
    CONSTRAINT fk_payment_order
        FOREIGN KEY (order_id) REFERENCES orders(order_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ============================================================================
-- ENTITY 11: SHIPPING
-- Relationship: Order -> Shipping = 1:1
-- Purpose: Order tracking, courier assignment, and delivery progression.
-- ============================================================================
CREATE TABLE shipping (
    shipping_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL UNIQUE, -- UNIQUE enforces the strict 1:1 relationship
    shipping_status ENUM('Pending', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Returned') NOT NULL DEFAULT 'Pending',
    tracking_number VARCHAR(100) NOT NULL UNIQUE,
    carrier VARCHAR(50) NOT NULL DEFAULT 'SpeedShip Logistics',
    estimated_delivery DATE NULL,
    shipped_at DATETIME NULL,
    delivered_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign Key
    CONSTRAINT fk_shipping_order
        FOREIGN KEY (order_id) REFERENCES orders(order_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ============================================================================
-- ENTITY 12: REVIEW
-- Relationship: Product -> Review = 1:M, Customer -> Review = 1:M
-- Purpose: Customer ratings and reviews on products.
-- ============================================================================
CREATE TABLE review (
    review_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    customer_id INT NOT NULL,
    rating INT NOT NULL,
    comment TEXT NULL,
    review_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_review_rating CHECK (rating >= 1 AND rating <= 5),
    CONSTRAINT uq_customer_product_review UNIQUE (customer_id, product_id),
    
    -- Foreign Keys
    CONSTRAINT fk_review_product
        FOREIGN KEY (product_id) REFERENCES product(product_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_review_customer
        FOREIGN KEY (customer_id) REFERENCES customer(customer_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_review_product ON review(product_id);
CREATE INDEX idx_review_customer ON review(customer_id);
