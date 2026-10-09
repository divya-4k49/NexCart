"""
NEXCART CUSTOMER ADDRESS BOOK TEST SUITE
Tests database-backed address operations:
- Listing active saved delivery destinations (default address first)
- Adding new addresses
- Setting an address as default (auto-unsetting other defaults)
- Updating address details (recipient, phone, street)
- Cross-customer security isolation (customers cannot view/edit/delete others' addresses)
- Soft-deleting an address (is_active = FALSE)
- Verification that soft-deleted addresses persist in MySQL to preserve historical order FKs
"""
import sys
import os

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.main import app
from app.database.session import SessionLocal
from app.models.address import Address

client = TestClient(app)

def run_address_tests():
    print("\n" + "=" * 70)
    print("  NEXCART - CUSTOMER ADDRESS BOOK TEST SUITE")
    print("  Tagline: \"Your Next Shopping Experience\" | Database: ecommerce_db")
    print("=" * 70)

    # 1. Authenticate Aarav Patel
    print("\n[1] Authenticating Customer 1 (aarav.patel@gmail.com)...")
    auth_res1 = client.post("/api/auth/customer/login", json={
        "email": "aarav.patel@gmail.com",
        "password": "Customer@123"
    })
    assert auth_res1.status_code == 200, f"Customer 1 auth failed: {auth_res1.text}"
    token1 = auth_res1.json()["access_token"]
    headers1 = {"Authorization": f"Bearer {token1}"}
    print("    * SUCCESS: Customer 1 (Aarav) authenticated with Bearer token")

    # 2. Authenticate Priya Nair (for security isolation test)
    print("\n[2] Authenticating Customer 2 (priya.nair@yahoo.com)...")
    auth_res2 = client.post("/api/auth/customer/login", json={
        "email": "priya.nair@yahoo.com",
        "password": "Customer@123"
    })
    assert auth_res2.status_code == 200, f"Customer 2 auth failed: {auth_res2.text}"
    token2 = auth_res2.json()["access_token"]
    headers2 = {"Authorization": f"Bearer {token2}"}
    print("    * SUCCESS: Customer 2 (Priya) authenticated with Bearer token")

    # 3. List Saved Addresses for Customer 1
    print("\n[3] Fetching saved addresses for Aarav (GET /api/addresses)...")
    list_res = client.get("/api/addresses", headers=headers1)
    assert list_res.status_code == 200, f"Expected 200, got {list_res.status_code}: {list_res.text}"
    addresses = list_res.json()
    assert len(addresses) >= 2, f"Expected at least 2 addresses for Aarav, got {len(addresses)}"
    print(f"    * Found {len(addresses)} active addresses for Aarav")
    for addr in addresses:
        default_tag = " [DEFAULT]" if addr["is_default"] else ""
        print(f"      - #{addr['address_id']} {addr['address_type']}: {addr['recipient_name']}, {addr['city']} ({addr['postal_code']}){default_tag}")
    assert addresses[0]["is_default"] is True, "First address in list must be the default address"

    # 4. Cross-Customer Security Isolation Check
    print("\n[4] Testing Cross-Customer Security Isolation (Customer 2 attempting to access Customer 1's address #1)...")
    idor_get = client.get("/api/addresses/1", headers=headers2)
    assert idor_get.status_code == 404, f"Security Breach: Expected 404, got {idor_get.status_code}"
    idor_put = client.put("/api/addresses/1", headers=headers2, json={"recipient_name": "Hacker"})
    assert idor_put.status_code == 404, f"Security Breach: Expected 404, got {idor_put.status_code}"
    idor_del = client.delete("/api/addresses/1", headers=headers2)
    assert idor_del.status_code == 404, f"Security Breach: Expected 404, got {idor_del.status_code}"
    print("    * SUCCESS: Ownership isolation verified - Customer 2 cannot read, edit, or delete Customer 1's address")

    # 5. Add a New Delivery Address for Aarav
    print("\n[5] Adding a new delivery address for Aarav (POST /api/addresses)...")
    new_addr_payload = {
        "address_type": "Studio / Workspace",
        "recipient_name": "Aarav Patel (Design Lab)",
        "phone": "+91 9876500000",
        "street_address": "Suite 501, Creative Hub, Bodakdev",
        "city": "Ahmedabad",
        "state": "Gujarat",
        "postal_code": "380054",
        "country": "India",
        "is_default": False
    }
    create_res = client.post("/api/addresses", headers=headers1, json=new_addr_payload)
    assert create_res.status_code == 201, f"Expected 201, got {create_res.status_code}: {create_res.text}"
    created_addr = create_res.json()
    new_address_id = created_addr["address_id"]
    print(f"    * SUCCESS: Created address #{new_address_id} - '{created_addr['address_type']}' (Default: {created_addr['is_default']})")

    # 6. Retrieve Single Address by ID
    print(f"\n[6] Fetching single address #{new_address_id} (GET /api/addresses/{new_address_id})...")
    get_res = client.get(f"/api/addresses/{new_address_id}", headers=headers1)
    assert get_res.status_code == 200
    addr_detail = get_res.json()
    assert addr_detail["street_address"] == "Suite 501, Creative Hub, Bodakdev"
    print(f"    * SUCCESS: Retrieved details for '{addr_detail['recipient_name']}'")

    # 7. Set New Address as Default (PUT /api/addresses/{id}/default)
    print(f"\n[7] Setting address #{new_address_id} as the new default delivery address...")
    default_res = client.put(f"/api/addresses/{new_address_id}/default", headers=headers1)
    assert default_res.status_code == 200
    assert default_res.json()["is_default"] is True

    # Verify that other addresses for Aarav are no longer default
    list_after_default = client.get("/api/addresses", headers=headers1).json()
    assert list_after_default[0]["address_id"] == new_address_id
    assert list_after_default[0]["is_default"] is True
    for other in list_after_default[1:]:
        assert other["is_default"] is False, f"Address #{other['address_id']} should have is_default=False"
    print(f"    * SUCCESS: Address #{new_address_id} is now default. All other addresses have is_default=False.")

    # 8. Update Address Details (PUT /api/addresses/{id})
    print(f"\n[8] Updating address #{new_address_id} details (changing phone & suite number)...")
    update_res = client.put(f"/api/addresses/{new_address_id}", headers=headers1, json={
        "street_address": "Suite 505 (Penthouse Floor), Creative Hub, Bodakdev",
        "phone": "+91 9876599999"
    })
    assert update_res.status_code == 200
    updated_addr = update_res.json()
    assert updated_addr["street_address"] == "Suite 505 (Penthouse Floor), Creative Hub, Bodakdev"
    assert updated_addr["phone"] == "+91 9876599999"
    print(f"    * SUCCESS: Address updated successfully: {updated_addr['street_address']} | Phone: {updated_addr['phone']}")

    # 9. Soft-Delete the Address (DELETE /api/addresses/{id})
    print(f"\n[9] Soft-deleting address #{new_address_id} (DELETE /api/addresses/{new_address_id})...")
    del_res = client.delete(f"/api/addresses/{new_address_id}", headers=headers1)
    assert del_res.status_code == 200
    print(f"    * API Response: {del_res.json()['message']}")

    # Verify it is no longer returned in customer's active address list
    active_after_del = client.get("/api/addresses", headers=headers1).json()
    active_ids = [a["address_id"] for a in active_after_del]
    assert new_address_id not in active_ids, f"Deleted address #{new_address_id} still found in active address list!"
    print(f"    * SUCCESS: Address #{new_address_id} is excluded from active address list.")

    # Verify a remaining address was promoted to default
    default_found = any(a["is_default"] for a in active_after_del)
    assert default_found, "An active address must be automatically re-promoted to default"
    print(f"    * SUCCESS: Remaining active address successfully promoted to default.")

    # 10. Database-Level Soft-Delete Verification
    print(f"\n[10] Inspecting MySQL Database table 'address' directly for record #{new_address_id}...")
    db: Session = SessionLocal()
    try:
        db_addr = db.query(Address).filter(Address.address_id == new_address_id).first()
        assert db_addr is not None, f"Address #{new_address_id} was physically removed from MySQL!"
        assert db_addr.is_active is False, f"Address #{new_address_id} is_active is {db_addr.is_active}, expected False"
        print(f"    * SUCCESS: Row #{new_address_id} is STILL in MySQL with is_active = {db_addr.is_active}")
        print("    * Referential integrity for historical orders in 'orders.address_id' is 100% PROTECTED!")
    finally:
        db.close()

    print("\n" + "=" * 70)
    print("  ALL 10 ADDRESS BOOK TESTS PASSED 100%!")
    print("=" * 70 + "\n")

if __name__ == "__main__":
    run_address_tests()
