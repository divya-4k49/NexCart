"""
NEXCART AUTHENTICATION TEST SUITE
Tests Customer & Admin registration, login, token issuance,
password verification, and protected profile endpoints.
"""
import sys
import os

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from app.main import app
from app.database.session import SessionLocal
from app.models.customer import Customer

client = TestClient(app)

def run_auth_test():
    print("\n" + "=" * 70)
    print("  NEXCART - AUTHENTICATION & SECURITY TEST SUITE")
    print("  Tagline: \"Your Next Shopping Experience\"")
    print("=" * 70)

    # --------------------------------------------------------------------------
    # 1. Customer Login with Seeded User (Aarav Patel)
    # --------------------------------------------------------------------------
    print("\n[1] Testing Customer Login (Valid Credentials)...")
    res = client.post("/api/auth/customer/login", json={
        "email": "aarav.patel@gmail.com",
        "password": "Customer@123"
    })
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    data = res.json()
    assert "access_token" in data
    assert data["user_type"] == "customer"
    assert data["user_info"]["email"] == "aarav.patel@gmail.com"
    customer_token = data["access_token"]
    print(f"    * SUCCESS: Customer logged in! Name: {data['user_info']['full_name']}")
    print(f"    * JWT Issued (length {len(customer_token)} chars)")

    # --------------------------------------------------------------------------
    # 2. Customer Login with Invalid Password
    # --------------------------------------------------------------------------
    print("\n[2] Testing Customer Login (Invalid Password)...")
    res = client.post("/api/auth/customer/login", json={
        "email": "aarav.patel@gmail.com",
        "password": "WrongPassword@999"
    })
    assert res.status_code == 401, f"Expected 401, got {res.status_code}"
    print(f"    * SUCCESS: Correctly rejected with 401 Unauthorized ({res.json()['detail']})")

    # --------------------------------------------------------------------------
    # 3. Protected Customer Profile (/api/auth/customer/me)
    # --------------------------------------------------------------------------
    print("\n[3] Testing Protected Customer Profile Endpoint...")
    res = client.get("/api/auth/customer/me", headers={
        "Authorization": f"Bearer {customer_token}"
    })
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    profile = res.json()
    assert profile["email"] == "aarav.patel@gmail.com"
    assert "password_hash" not in profile, "Security Alert: password_hash leaked!"
    print(f"    * SUCCESS: Authenticated Profile retrieved: {profile['full_name']} | Phone: {profile['phone']}")

    # --------------------------------------------------------------------------
    # 4. Customer Registration with New User
    # --------------------------------------------------------------------------
    test_email = "test.shopper.2026@nexcart.in"
    # Clean up test user if previously created
    db = SessionLocal()
    try:
        existing = db.query(Customer).filter(Customer.email == test_email).first()
        if existing:
            db.delete(existing)
            db.commit()
    finally:
        db.close()

    print(f"\n[4] Testing New Customer Registration ({test_email})...")
    res = client.post("/api/auth/customer/register", json={
        "full_name": "Kavya Deshmukh",
        "email": test_email,
        "password": "Customer@123",
        "phone": "+91 9898989898"
    })
    assert res.status_code == 201, f"Expected 201, got {res.status_code}: {res.text}"
    reg_data = res.json()
    assert "access_token" in reg_data
    assert reg_data["user_info"]["email"] == test_email
    print(f"    * SUCCESS: New customer registered! ID: {reg_data['user_info']['customer_id']}")

    # --------------------------------------------------------------------------
    # 5. Duplicate Email Rejection
    # --------------------------------------------------------------------------
    print(f"\n[5] Testing Duplicate Email Prevention...")
    res = client.post("/api/auth/customer/register", json={
        "full_name": "Impostor Account",
        "email": test_email,
        "password": "Password123"
    })
    assert res.status_code == 400, f"Expected 400, got {res.status_code}"
    print(f"    * SUCCESS: Duplicate registration blocked with 400 Bad Request ({res.json()['detail']})")

    # --------------------------------------------------------------------------
    # 6. Admin Login with Seeded User (superadmin)
    # --------------------------------------------------------------------------
    print("\n[6] Testing Admin Login (Valid Credentials)...")
    res = client.post("/api/auth/admin/login", json={
        "username_or_email": "superadmin",
        "password": "Admin@123"
    })
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    admin_data = res.json()
    assert admin_data["user_type"] == "admin"
    assert admin_data["user_info"]["role"] == "superadmin"
    admin_token = admin_data["access_token"]
    print(f"    * SUCCESS: Admin logged in! Full Name: {admin_data['user_info']['full_name']} | Role: {admin_data['user_info']['role']}")

    # --------------------------------------------------------------------------
    # 7. Admin Login with Invalid Password
    # --------------------------------------------------------------------------
    print("\n[7] Testing Admin Login (Invalid Password)...")
    res = client.post("/api/auth/admin/login", json={
        "username_or_email": "superadmin",
        "password": "WrongAdminPassword!"
    })
    assert res.status_code == 401, f"Expected 401, got {res.status_code}"
    print(f"    * SUCCESS: Invalid admin attempt rejected with 401 Unauthorized")

    # --------------------------------------------------------------------------
    # 8. Protected Admin Profile (/api/auth/admin/me)
    # --------------------------------------------------------------------------
    print("\n[8] Testing Protected Admin Profile Endpoint...")
    res = client.get("/api/auth/admin/me", headers={
        "Authorization": f"Bearer {admin_token}"
    })
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    admin_profile = res.json()
    assert admin_profile["username"] == "superadmin"
    assert "password_hash" not in admin_profile, "Security Alert: password_hash leaked!"
    print(f"    * SUCCESS: Authenticated Admin Profile retrieved: {admin_profile['full_name']} ({admin_profile['role']})")

    print("\n" + "=" * 70)
    print("  ALL 8 AUTHENTICATION & SECURITY TESTS PASSED 100%!")
    print("=" * 70 + "\n")

if __name__ == "__main__":
    run_auth_test()
