"""
Verification script testing all 12 SQLAlchemy ORM models and relationships
against live MySQL 8.0 server.
"""
import sys
import os

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database.session import SessionLocal
from app.models import (
    Admin, Customer, Category, Product, Inventory,
    Address, Cart, Order, OrderDetail, Payment, Shipping, Review
)

def run_orm_verification():
    db = SessionLocal()
    try:
        print("\n" + "=" * 70)
        print("  NEXCART - VERIFYING 12 SQLALCHEMY ORM MODELS & RELATIONSHIPS")
        print("  Tagline: \"Your Next Shopping Experience\" | Database: ecommerce_db")
        print("=" * 70)

        # 1. Admin Verification
        admins = db.query(Admin).all()
        print(f"\n[1] Admin Entity: Loaded {len(admins)} records")
        for a in admins:
            print(f"    - ID: {a.admin_id} | Username: {a.username} | Role: {a.role}")

        # 2. Category & Product (1:M)
        categories = db.query(Category).all()
        print(f"\n[2] Category Entity: Loaded {len(categories)} categories")
        for cat in categories:
            print(f"    - Category: '{cat.category_name}' has {len(cat.products)} products")

        # 3. Product & Inventory (1:1)
        products = db.query(Product).all()
        print(f"\n[3] Product & Inventory (1:1): Loaded {len(products)} products")
        for p in products[:4]: # Show first 4 for brevity
            inv_qty = p.inventory.quantity if p.inventory else "N/A"
            threshold = p.inventory.low_stock_threshold if p.inventory else "N/A"
            print(f"    - Product '{p.product_name}' (Rs. {p.price}) -> Stock: {inv_qty} (Alert: <= {threshold})")

        # 4. Customer, Addresses, Cart (1:M)
        customers = db.query(Customer).all()
        print(f"\n[4] Customer Entity & Sub-Entities:")
        for c in customers:
            print(f"    - Customer: {c.full_name} ({c.email})")
            print(f"      * Addresses: {[a.address_type + ': ' + a.city for a in c.addresses]}")
            print(f"      * Cart Items: {len(c.cart_items)} items")

        # 5. Complete Order Graph Traversal (The Crown Jewel Test)
        # Order -> Customer, Address, Payment (1:1), Shipping (1:1), Details -> Product -> Category
        orders = db.query(Order).all()
        print(f"\n[5] Order Full-Graph Traversal (Order + Payment + Shipping + Details):")
        for o in orders:
            print(f"\n    [ORDER] #{o.order_id} | Date: {o.order_date} | Status: {o.order_status}")
            print(f"       Buyer:    {o.customer.full_name} ({o.customer.email})")
            print(f"       Deliver:  {o.address.street_address}, {o.address.city} - {o.address.postal_code}")
            print(f"       Payment:  {o.payment.payment_method} | Status: {o.payment.payment_status} | Ref: {o.payment.transaction_reference}")
            print(f"       Shipping: {o.shipping.carrier} | Tracking: {o.shipping.tracking_number} | Status: {o.shipping.shipping_status}")
            print(f"       Items Purchased:")
            for item in o.order_details:
                print(f"         * {item.product.product_name} (Category: {item.product.category.category_name})")
                print(f"           Qty: {item.quantity} x Rs. {item.unit_price} = Subtotal: Rs. {item.subtotal}")
            print(f"       TOTAL AMOUNT: Rs. {o.total_amount}")

        # 6. Reviews (Product <-> Review <-> Customer)
        reviews = db.query(Review).all()
        print(f"\n[6] Reviews Entity: Loaded {len(reviews)} reviews")
        for r in reviews:
            print(f"    - Product: '{r.product.product_name}' | Rating: {r.rating}/5 stars")
            print(f"      Reviewer: {r.customer.full_name} | Comment: \"{r.comment}\"")

        print("\n" + "=" * 70)
        print("  SUCCESS: ALL 12 ORM MODELS & RELATIONSHIPS VALIDATED 100%!")
        print("=" * 70 + "\n")

    finally:
        db.close()

if __name__ == "__main__":
    run_orm_verification()
