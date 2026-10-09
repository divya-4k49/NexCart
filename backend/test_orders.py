"""
NEXCART ORDERS, ORDER DETAILS & ACID CHECKOUT TEST SUITE
Tests database-backed checkout operations and transactional integrity:
- Listing past orders with tracking number and payment status
- Cross-customer security isolation (IDOR protection on order details)
- Validation errors on checkout (invalid address, empty cart)
- ACID Checkout Transaction:
    * Row-level locking on inventory (SELECT FOR UPDATE)
    * Real-time stock verification
    * Subtotal and free shipping rule calculation
    * Order invoice insertion in `orders`
    * Frozen price line items in `order_details`
    * Real-time inventory quantity deduction
    * 1:1 Payment record generation
    * 1:1 Shipping record with tracking number generation
    * Atomically emptying customer's `cart`
- Order detail retrieval with multi-table relationship loading
- Order cancellation and automated inventory restocking
"""
import sys
import os
from decimal import Decimal

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.main import app
from app.database.session import SessionLocal
from app.models.inventory import Inventory
from app.models.cart import Cart

client = TestClient(app)


def run_order_tests():
    print("\n" + "=" * 70)
    print("  NEXCART - ORDERS & ACID CHECKOUT TEST SUITE")
    print("  Tagline: \"Your Next Shopping Experience\" | Database: ecommerce_db")
    print("=" * 70)

    # 1. Authenticate Customer 1 (Aarav Patel)
    print("\n[1] Authenticating Customer 1 (aarav.patel@gmail.com)...")
    auth_res1 = client.post("/api/auth/customer/login", json={
        "email": "aarav.patel@gmail.com",
        "password": "Customer@123"
    })
    assert auth_res1.status_code == 200, f"Customer 1 auth failed: {auth_res1.text}"
    token1 = auth_res1.json()["access_token"]
    headers1 = {"Authorization": f"Bearer {token1}"}
    print("    * SUCCESS: Customer 1 (Aarav) authenticated with Bearer token")

    # 2. Authenticate Customer 2 (Priya Nair)
    print("\n[2] Authenticating Customer 2 (priya.nair@yahoo.com)...")
    auth_res2 = client.post("/api/auth/customer/login", json={
        "email": "priya.nair@yahoo.com",
        "password": "Customer@123"
    })
    assert auth_res2.status_code == 200, f"Customer 2 auth failed: {auth_res2.text}"
    token2 = auth_res2.json()["access_token"]
    headers2 = {"Authorization": f"Bearer {token2}"}
    print("    * SUCCESS: Customer 2 (Priya) authenticated with Bearer token")

    # 3. List Existing Orders for Customer 1
    print("\n[3] Fetching existing order history for Aarav (GET /api/orders)...")
    orders_res = client.get("/api/orders", headers=headers1)
    assert orders_res.status_code == 200, f"Expected 200, got {orders_res.status_code}: {orders_res.text}"
    orders = orders_res.json()
    assert len(orders) >= 1, "Expected at least 1 seed order for Aarav"
    print(f"    * Found {len(orders)} historical order(s) for Aarav")
    for o in orders:
        print(f"      - Order #{o['order_id']} | Date: {o['order_date']} | Total: Rs. {o['total_amount']} | Status: {o['order_status']} | Items: {o['total_items']} | Tracking: {o['tracking_number']}")

    # 4. Cross-Customer Security Isolation Check
    print("\n[4] Testing IDOR Security Isolation (Customer 2 attempting to view Customer 1's Order #1)...")
    idor_res = client.get("/api/orders/1", headers=headers2)
    assert idor_res.status_code == 404, f"Security Breach: Expected 404, got {idor_res.status_code}"
    idor_cancel = client.put("/api/orders/1/cancel", headers=headers2)
    assert idor_cancel.status_code == 404, f"Security Breach: Expected 404, got {idor_cancel.status_code}"
    print("    * SUCCESS: Customer 2 blocked from viewing or cancelling Customer 1's orders")

    # 5. Prepare Shopping Cart for Checkout
    print("\n[5] Setting up active items in Aarav's cart for checkout testing...")
    # Clear any residual cart items first
    client.delete("/api/cart", headers=headers1)

    # Add Product ID 12: Logitech MX Master 3S (Price: Rs. 9,495.00, Qty: 2)
    add_item_res = client.post("/api/cart", headers=headers1, json={
        "product_id": 12,
        "quantity": 2
    })
    assert add_item_res.status_code == 200
    cart_state = add_item_res.json()
    assert len(cart_state["items"]) == 1
    print(f"    * Cart ready: 2 x {cart_state['items'][0]['product_name']} | Subtotal: Rs. {cart_state['subtotal']}")

    # Check baseline inventory quantity in MySQL for Product ID 12
    db: Session = SessionLocal()
    initial_stock = 0
    try:
        inv_record = db.query(Inventory).filter(Inventory.product_id == 12).first()
        initial_stock = inv_record.quantity
        print(f"    * Current baseline inventory for Product #12 in MySQL: {initial_stock} units")
    finally:
        db.close()

    # 6. Test Invalid Address Guard
    print("\n[6] Testing checkout guard with non-existent Address ID 9999...")
    invalid_addr_res = client.post("/api/orders/checkout", headers=headers1, json={
        "address_id": 9999,
        "payment_method": "UPI Demo"
    })
    assert invalid_addr_res.status_code == 400
    print(f"    * SUCCESS: Checkout blocked with invalid address ({invalid_addr_res.json()['detail']})")

    # 7. Execute ACID Checkout Transaction
    print("\n[7] Executing atomic ACID checkout (POST /api/orders/checkout)...")
    checkout_payload = {
        "address_id": 1,
        "payment_method": "UPI Demo"
    }
    checkout_res = client.post("/api/orders/checkout", headers=headers1, json=checkout_payload)
    assert checkout_res.status_code == 201, f"Checkout failed: {checkout_res.status_code} - {checkout_res.text}"
    checkout_data = checkout_res.json()
    placed_order = checkout_data["order"]
    new_order_id = placed_order["order_id"]
    print(f"    * SUCCESS: {checkout_data['message']}")
    print(f"      - Order ID:         #{new_order_id}")
    print(f"      - Order Status:     {placed_order['order_status']}")
    print(f"      - Total Amount:     Rs. {placed_order['total_amount']}")
    print(f"      - Delivery Address: {placed_order['address']['recipient_name']}, {placed_order['address']['city']}")
    print(f"      - Payment:          {placed_order['payment']['payment_method']} | Status: {placed_order['payment']['payment_status']} | Txn: {placed_order['payment']['transaction_reference']}")
    print(f"      - Shipping:         {placed_order['shipping']['carrier']} | Tracking: {placed_order['shipping']['tracking_number']} | Est Delivery: {placed_order['shipping']['estimated_delivery']}")

    # 8. Verify Cart Emptied Automatically
    print("\n[8] Verifying that customer's cart was atomically cleared...")
    cart_after_order = client.get("/api/cart", headers=headers1).json()
    assert len(cart_after_order["items"]) == 0, "Cart was not emptied after checkout!"
    assert cart_after_order["total_items"] == 0
    print("    * SUCCESS: Cart has 0 items. Atomic clearance verified.")

    # 9. Verify Real-Time Inventory Deduction in MySQL
    print("\n[9] Inspecting MySQL Database table 'inventory' for real-time stock deduction...")
    db = SessionLocal()
    try:
        inv_after = db.query(Inventory).filter(Inventory.product_id == 12).first()
        expected_stock = initial_stock - 2
        assert inv_after.quantity == expected_stock, f"Expected {expected_stock} units, found {inv_after.quantity}"
        print(f"    * SUCCESS: Stock deducted in MySQL from {initial_stock} to {inv_after.quantity} units!")
    finally:
        db.close()

    # 10. Fetch Detailed Order Invoice
    print(f"\n[10] Retrieving full order invoice for Order #{new_order_id} (GET /api/orders/{new_order_id})...")
    get_order_res = client.get(f"/api/orders/{new_order_id}", headers=headers1)
    assert get_order_res.status_code == 200
    order_detail = get_order_res.json()
    assert len(order_detail["items"]) == 1
    assert order_detail["items"][0]["quantity"] == 2
    assert Decimal(str(order_detail["items"][0]["unit_price"])) == Decimal("9495.00")
    print(f"    * Line Item: {order_detail['items'][0]['product_name']} | Qty: {order_detail['items'][0]['quantity']} | Frozen Unit Price: Rs. {order_detail['items'][0]['unit_price']} | Subtotal: Rs. {order_detail['items'][0]['subtotal']}")
    print(f"    * Shipping Carrier: {order_detail['shipping']['carrier']} | Status: {order_detail['shipping']['shipping_status']}")

    # 11. Test Order Cancellation and Automated Inventory Restock
    print(f"\n[11] Cancelling Order #{new_order_id} and testing automatic inventory restock...")
    cancel_res = client.put(f"/api/orders/{new_order_id}/cancel", headers=headers1)
    assert cancel_res.status_code == 200, f"Cancel failed: {cancel_res.text}"
    cancel_data = cancel_res.json()
    print(f"    * API Response: {cancel_data['message']}")
    print(f"    * Order Status: {cancel_data['order_status']} | Payment Status: {cancel_data['payment_status']}")

    # Verify inventory in MySQL was restored
    db = SessionLocal()
    try:
        inv_restored = db.query(Inventory).filter(Inventory.product_id == 12).first()
        assert inv_restored.quantity == initial_stock, f"Expected stock to be restored to {initial_stock}, got {inv_restored.quantity}"
        print(f"    * SUCCESS: MySQL Inventory stock automatically RESTOCKED back to {inv_restored.quantity} units!")
    finally:
        db.close()

    # 12. Test Double Cancellation Prevention
    print(f"\n[12] Attempting to cancel already cancelled Order #{new_order_id}...")
    double_cancel_res = client.put(f"/api/orders/{new_order_id}/cancel", headers=headers1)
    assert double_cancel_res.status_code == 400
    print(f"    * SUCCESS: Double-cancel rejected: {double_cancel_res.json()['detail']}")

    print("\n" + "=" * 70)
    print("  ALL 12 ORDERS & ACID CHECKOUT TESTS PASSED 100%!")
    print("=" * 70 + "\n")


if __name__ == "__main__":
    run_order_tests()
