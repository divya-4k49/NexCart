"""
NEXCART SHOPPING CART TEST SUITE
Tests database-backed cart operations:
- Fetching active cart with 1:1 stock resolution
- Adding new items to cart
- Incrementing quantity on duplicate add (enforcing UNIQUE customer_id, product_id)
- Stock availability validation (preventing adding more than available in inventory)
- Updating item quantities
- Removing single items
- Financial calculations (Subtotal, Shipping Fee threshold, Grand Total)
"""
import sys
import os
from decimal import Decimal

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def run_cart_tests():
    print("\n" + "=" * 70)
    print("  NEXCART - SHOPPING CART TEST SUITE")
    print("  Tagline: \"Your Next Shopping Experience\" | Database: ecommerce_db")
    print("=" * 70)

    # 1. Authenticate Customer (Aarav Patel)
    print("\n[1] Authenticating customer (aarav.patel@gmail.com)...")
    auth_res = client.post("/api/auth/customer/login", json={
        "email": "aarav.patel@gmail.com",
        "password": "Customer@123"
    })
    assert auth_res.status_code == 200, f"Auth failed: {auth_res.text}"
    token = auth_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("    * SUCCESS: Customer authenticated with Bearer token")

    # 2. Fetch Active Cart
    print("\n[2] Fetching active shopping cart (GET /api/cart)...")
    res = client.get("/api/cart", headers=headers)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    cart = res.json()
    print(f"    * Active items in cart: {len(cart['items'])}")
    print(f"    * Total Quantity:       {cart['total_items']}")
    print(f"    * Subtotal:             Rs. {cart['subtotal']}")
    print(f"    * Shipping Fee:         Rs. {cart['shipping_fee']}")
    print(f"    * Grand Total:          Rs. {cart['grand_total']}")
    for item in cart["items"]:
        print(f"      - {item['product_name']} | Qty: {item['quantity']} | Unit: Rs. {item['unit_price']} | Total: Rs. {item['item_total']} (Stock: {item['stock_available']})")

    # 3. Add Item to Cart (Product ID 4: iPhone 15 Pro Max)
    print("\n[3] Adding Product ID 4 (iPhone 15 Pro Max, qty=1) to cart...")
    add_res = client.post("/api/cart", headers=headers, json={
        "product_id": 4,
        "quantity": 1
    })
    assert add_res.status_code == 200, f"Expected 200, got {add_res.status_code}: {add_res.text}"
    updated_cart = add_res.json()
    item4 = next((i for i in updated_cart["items"] if i["product_id"] == 4), None)
    assert item4 is not None, "Product 4 not found in cart after adding"
    initial_qty = item4["quantity"]
    print(f"    * SUCCESS: Product 4 added to cart. Current quantity: {initial_qty}")

    # 4. Increment Quantity via Add (Testing UNIQUE constraint enforcement)
    print("\n[4] Adding Product ID 4 again (qty=2) to verify quantity increment...")
    add_again_res = client.post("/api/cart", headers=headers, json={
        "product_id": 4,
        "quantity": 2
    })
    assert add_again_res.status_code == 200
    cart_after_inc = add_again_res.json()
    item4_after = next((i for i in cart_after_inc["items"] if i["product_id"] == 4), None)
    assert item4_after["quantity"] == initial_qty + 2
    print(f"    * SUCCESS: Quantity incremented to {item4_after['quantity']} without duplicate rows!")

    # 5. Inventory Stock Guard (Attempt to exceed available stock of 25 units)
    print("\n[5] Testing Inventory Stock Guard (Attempting to add 35 units when stock is 25)...")
    overflow_res = client.post("/api/cart", headers=headers, json={
        "product_id": 4,
        "quantity": 35
    })
    assert overflow_res.status_code == 400, f"Expected 400, got {overflow_res.status_code}: {overflow_res.text}"
    print(f"    * SUCCESS: Database stock guard correctly blocked request ({overflow_res.json()['detail']})")

    # 6. Update Quantity directly (PUT /api/cart/{cart_id})
    print(f"\n[6] Updating cart item #{item4_after['cart_id']} quantity to 1...")
    put_res = client.put(f"/api/cart/{item4_after['cart_id']}", headers=headers, json={
        "quantity": 1
    })
    assert put_res.status_code == 200
    cart_after_put = put_res.json()
    item4_put = next((i for i in cart_after_put["items"] if i["cart_id"] == item4_after["cart_id"]), None)
    assert item4_put["quantity"] == 1
    print(f"    * SUCCESS: Quantity successfully updated to {item4_put['quantity']}")

    # 7. Remove single item from cart (DELETE /api/cart/{cart_id})
    print(f"\n[7] Removing cart item #{item4_put['cart_id']} from cart...")
    del_res = client.delete(f"/api/cart/{item4_put['cart_id']}", headers=headers)
    assert del_res.status_code == 200
    cart_after_del = del_res.json()
    item4_deleted = next((i for i in cart_after_del["items"] if i["product_id"] == 4), None)
    assert item4_deleted is None, "Product 4 was not removed from cart"
    print("    * SUCCESS: Item removed. Cart re-calculated automatically.")

    # 8. Financial Math Verification
    print("\n[8] Verifying Financial Totals & Free Shipping Logic...")
    final_cart = client.get("/api/cart", headers=headers).json()
    computed_subtotal = sum(Decimal(str(i["item_total"])) for i in final_cart["items"])
    assert Decimal(str(final_cart["subtotal"])) == computed_subtotal
    if computed_subtotal == Decimal("0.00"):
        assert Decimal(str(final_cart["shipping_fee"])) == Decimal("0.00")
        print("    * Empty Cart: Shipping fee is Rs. 0.00")
    elif computed_subtotal >= Decimal("999.00"):
        assert Decimal(str(final_cart["shipping_fee"])) == Decimal("0.00")
        print("    * Subtotal >= Rs. 999: Free Shipping applied (Rs. 0.00)")
    else:
        assert Decimal(str(final_cart["shipping_fee"])) == Decimal("99.00")
        print("    * Subtotal < Rs. 999: Standard Shipping applied (Rs. 99.00)")

    assert Decimal(str(final_cart["grand_total"])) == computed_subtotal + Decimal(str(final_cart["shipping_fee"]))
    print(f"    * SUCCESS: Verified Subtotal (Rs. {final_cart['subtotal']}) + Shipping (Rs. {final_cart['shipping_fee']}) = Grand Total (Rs. {final_cart['grand_total']})")

    print("\n" + "=" * 70)
    print("  ALL 8 SHOPPING CART TESTS PASSED 100%!")
    print("=" * 70 + "\n")

if __name__ == "__main__":
    run_cart_tests()
