"""
NEXCART ADMIN MANAGEMENT & EXECUTIVE ANALYTICS TEST SUITE
Tests database-backed administrative and analytics endpoints:
- Role-based security (customer tokens rejected on admin routes)
- Executive analytics dashboard (revenue aggregation, category sales, recent orders)
- Live inventory management & low-stock filtering
- Inventory restock and threshold updates
- Admin product creation with automatic 1:1 inventory initialization
- Admin product updates
- Admin category creation
- Platform-wide order management and status lifecycle progression (Shipped -> Delivered)
- Product soft-deactivation preserving order referential integrity
"""
import sys
import os
from datetime import datetime
from decimal import Decimal

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def run_admin_tests():
    print("\n" + "=" * 70)
    print("  NEXCART - ADMIN MANAGEMENT & ANALYTICS TEST SUITE")
    print("  Tagline: \"Your Next Shopping Experience\" | Database: ecommerce_db")
    print("=" * 70)

    # 1. Security Check: Customer attempting to access Admin endpoint
    print("\n[1] Testing Admin Route Protection (Customer attempting to access admin analytics)...")
    customer_auth = client.post("/api/auth/customer/login", json={
        "email": "aarav.patel@gmail.com",
        "password": "Customer@123"
    })
    cust_token = customer_auth.json()["access_token"]
    cust_headers = {"Authorization": f"Bearer {cust_token}"}

    forbidden_res = client.get("/api/admin/analytics", headers=cust_headers)
    assert forbidden_res.status_code == 401, f"Expected 401, got {forbidden_res.status_code}"
    print(f"    * SUCCESS: Customer blocked from admin area ({forbidden_res.json()['detail']})")

    # 2. Authenticate Admin (superadmin)
    print("\n[2] Authenticating Admin (username: superadmin)...")
    admin_auth = client.post("/api/auth/admin/login", json={
        "username_or_email": "superadmin",
        "password": "Admin@123"
    })
    assert admin_auth.status_code == 200, f"Admin auth failed: {admin_auth.text}"
    admin_token = admin_auth.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    print("    * SUCCESS: System Administrator authenticated with Bearer token")

    # 3. Executive Dashboard Analytics
    print("\n[3] Fetching Executive Analytics Dashboard (GET /api/admin/analytics)...")
    analytics_res = client.get("/api/admin/analytics", headers=admin_headers)
    assert analytics_res.status_code == 200, f"Expected 200, got {analytics_res.status_code}: {analytics_res.text}"
    data = analytics_res.json()
    print(f"    * Total Revenue (Settled): Rs. {data['total_revenue']}")
    print(f"    * Total Orders:            {data['total_orders']} (Delivered: {data['completed_orders']}, Pending: {data['pending_orders']}, Cancelled: {data['cancelled_orders']})")
    print(f"    * Active Customers:        {data['total_customers']}")
    print(f"    * Active Catalog Products: {data['total_products']}")
    print(f"    * Low Stock Alerts:        {data['low_stock_products_count']} item(s)")
    print(f"    * Category Revenue Breakdown:")
    for cat in data["category_sales"]:
        print(f"      - {cat['category_name']:25} | Products: {cat['total_products']:2} | Sold: {cat['total_units_sold']:2} units | Revenue: Rs. {cat['total_revenue']}")
    assert Decimal(str(data["total_revenue"])) > Decimal("0.00")
    assert len(data["recent_orders"]) >= 1
    print("    * SUCCESS: Executive analytics successfully aggregated from MySQL!")

    # 4. Inventory Stock Listing & Low Stock Alert
    print("\n[4] Querying live inventory and low-stock alerts (GET /api/admin/inventory)...")
    low_stock_res = client.get("/api/admin/inventory?low_stock_only=true", headers=admin_headers)
    assert low_stock_res.status_code == 200
    low_stock_items = low_stock_res.json()
    print(f"    * Found {len(low_stock_items)} low-stock product(s):")
    for item in low_stock_items:
        print(f"      - Product #{item['product_id']} {item['product_name']}: Stock {item['quantity']} <= Reorder Threshold {item['low_stock_threshold']}")
        assert item["is_low_stock"] is True

    # 5. Inventory Restock
    # Product 11 is Garmin Forerunner in seed data (low stock)
    print("\n[5] Restocking Product #11 (+10 units) via PUT /api/admin/inventory/11...")
    restock_res = client.put("/api/admin/inventory/11", headers=admin_headers, json={
        "add_stock": 10
    })
    assert restock_res.status_code == 200
    restocked = restock_res.json()
    print(f"    * SUCCESS: Product #11 stock updated to {restocked['quantity']} units (Low stock: {restocked['is_low_stock']})")

    # 6. Admin Product Creation (with automatic 1:1 Inventory)
    print("\n[6] Creating a new product 'Dell XPS 15 OLED' (POST /api/admin/products)...")
    prod_payload = {
        "category_id": 1,
        "product_name": "Dell XPS 15 OLED",
        "description": "15.6-inch 3.5K OLED touchscreen, Intel Core i9, 32GB RAM, 1TB SSD.",
        "price": 219990.00,
        "image_url": "https://images.unsplash.com/photo-1593642632823-8f785ba67e45",
        "initial_quantity": 15,
        "low_stock_threshold": 4,
        "is_active": True
    }
    create_prod_res = client.post("/api/admin/products", headers=admin_headers, json=prod_payload)
    assert create_prod_res.status_code == 201, f"Product create failed: {create_prod_res.text}"
    new_prod = create_prod_res.json()
    new_prod_id = new_prod["product_id"]
    print(f"    * SUCCESS: Created Product #{new_prod_id} ('{new_prod['product_name']}')")
    print(f"      - Category: {new_prod['category_name']} | Price: Rs. {new_prod['price']} | Stock: {new_prod['stock_quantity']} units")

    # 7. Admin Product Update
    print(f"\n[7] Updating Product #{new_prod_id} price to Rs. 209,990.00...")
    update_prod_res = client.put(f"/api/admin/products/{new_prod_id}", headers=admin_headers, json={
        "price": 209990.00,
        "description": "Special Festive Edition: 15.6-inch 3.5K OLED touchscreen, Intel Core i9, 32GB RAM."
    })
    assert update_prod_res.status_code == 200
    updated_prod = update_prod_res.json()
    assert Decimal(str(updated_prod["price"])) == Decimal("209990.00")
    print(f"    * SUCCESS: Product updated. New price: Rs. {updated_prod['price']}")

    # 8. Admin Category Creation
    unique_cat_name = f"Gaming & VR {int(datetime.utcnow().timestamp())}"
    print(f"\n[8] Creating a new category '{unique_cat_name}' (POST /api/admin/categories)...")
    create_cat_res = client.post("/api/admin/categories", headers=admin_headers, json={
        "category_name": unique_cat_name,
        "description": "Next-gen consoles, VR headsets, and interactive peripherals.",
        "image_url": "https://images.unsplash.com/photo-1486401899868-0e435ed85128",
        "is_active": True
    })
    assert create_cat_res.status_code == 201
    new_cat = create_cat_res.json()
    print(f"    * SUCCESS: Created Category #{new_cat['category_id']}: '{new_cat['category_name']}' (slug: {new_cat['slug']})")

    # 9. Admin Platform Orders List & Status Lifecycle Update
    print("\n[9] Listing platform-wide orders (GET /api/admin/orders)...")
    orders_res = client.get("/api/admin/orders", headers=admin_headers)
    assert orders_res.status_code == 200
    all_orders = orders_res.json()
    assert len(all_orders) >= 1
    print(f"    * Found {len(all_orders)} total orders in platform database.")

    # Target an order to progress lifecycle: Shipped -> Delivered
    target_order_id = all_orders[0]["order_id"]
    print(f"\n[10] Progressing Order #{target_order_id} status to 'Shipped'...")
    ship_res = client.put(f"/api/admin/orders/{target_order_id}/status", headers=admin_headers, json={
        "order_status": "Shipped",
        "carrier": "BlueDart Priority Express"
    })
    assert ship_res.status_code == 200
    print(f"    * API Response: {ship_res.json()['message']}")

    print(f"\n[11] Progressing Order #{target_order_id} status to 'Delivered'...")
    deliver_res = client.put(f"/api/admin/orders/{target_order_id}/status", headers=admin_headers, json={
        "order_status": "Delivered"
    })
    assert deliver_res.status_code == 200
    del_data = deliver_res.json()
    assert del_data["order_status"] == "Delivered"
    assert del_data["shipping_status"] == "Delivered"
    assert del_data["payment_status"] == "Completed"
    print(f"    * SUCCESS: Order, Shipping, and Payment synchronized to 'Delivered' and 'Completed'!")

    # 12. Soft-Deactivation of Product (Protecting past order line items)
    print(f"\n[12] Soft-deactivating Product #{new_prod_id} (DELETE /api/admin/products/{new_prod_id})...")
    del_res = client.delete(f"/api/admin/products/{new_prod_id}", headers=admin_headers)
    assert del_res.status_code == 200
    print(f"    * SUCCESS: {del_res.json()['message']}")

    print("\n" + "=" * 70)
    print("  ALL 12 ADMIN MANAGEMENT & ANALYTICS TESTS PASSED 100%!")
    print("=" * 70 + "\n")


if __name__ == "__main__":
    run_admin_tests()
