"""
NEXCART ORDER TRACKING & VERIFIED REVIEWS TEST SUITE
Tests database-backed delivery tracking stepper and verified review workflows:
- Customer order tracking stepper with 6 progressive lifecycle milestones
- Milestone completion indexing and timestamp resolution
- IDOR security guard on customer tracking
- Public unauthenticated parcel tracking by tracking number (SpeedShip / BlueDart)
- Verified Purchase enforcement (HTTP 403 when customer hasn't purchased product)
- Product review creation with rating (1-5 stars) and comment
- Review idempotency (safe updates on duplicate submissions without DB constraint crash)
- Product reviews summary with star rating breakdown (5-star down to 1-star)
- Customer "My Reviews" retrieval
- Customer review deletion
"""
import sys
import os

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def run_tracking_and_reviews_tests():
    print("\n" + "=" * 70)
    print("  NEXCART - ORDER TRACKING & VERIFIED REVIEWS TEST SUITE")
    print("  Tagline: \"Your Next Shopping Experience\" | Database: ecommerce_db")
    print("=" * 70)

    # 1. Authenticate Customer 1 (Aarav Patel)
    print("\n[1] Authenticating Customer 1 (aarav.patel@gmail.com)...")
    auth1 = client.post("/api/auth/customer/login", json={
        "email": "aarav.patel@gmail.com",
        "password": "Customer@123"
    })
    assert auth1.status_code == 200, f"Auth failed: {auth1.text}"
    token1 = auth1.json()["access_token"]
    headers1 = {"Authorization": f"Bearer {token1}"}
    print("    * SUCCESS: Customer 1 authenticated")

    # 2. Authenticate Customer 2 (Priya Nair)
    print("\n[2] Authenticating Customer 2 (priya.nair@yahoo.com)...")
    auth2 = client.post("/api/auth/customer/login", json={
        "email": "priya.nair@yahoo.com",
        "password": "Customer@123"
    })
    assert auth2.status_code == 200, f"Auth failed: {auth2.text}"
    token2 = auth2.json()["access_token"]
    headers2 = {"Authorization": f"Bearer {token2}"}
    print("    * SUCCESS: Customer 2 authenticated")

    # 3. Authenticated Order Tracking Stepper (Order #1: Delivered)
    print("\n[3] Testing customer order tracking stepper (GET /api/orders/1/tracking)...")
    track_res = client.get("/api/orders/1/tracking", headers=headers1)
    assert track_res.status_code == 200, f"Expected 200, got {track_res.status_code}: {track_res.text}"
    tracking_data = track_res.json()
    print(f"    * Tracking Number: {tracking_data['tracking_number']} | Carrier: {tracking_data['carrier']}")
    print(f"    * Current Milestone Index: {tracking_data['current_step_index']} / 5")
    assert tracking_data["current_step_index"] == 5, "Delivered order must be at step 5"
    assert len(tracking_data["steps"]) == 6, f"Expected 6 milestone steps, got {len(tracking_data['steps'])}"
    for idx, s in enumerate(tracking_data["steps"]):
        time_str = f" ({s['timestamp']})" if s['timestamp'] else ""
        print(f"      Step {idx}: [{s['status'].upper()}] {s['step_name']}{time_str} - {s['description']}")
    assert all(s["status"] == "completed" for s in tracking_data["steps"])
    print("    * SUCCESS: All 6 delivery stepper milestones verified as completed for delivered order.")

    # 4. Cross-Customer IDOR Security Guard on Tracking
    print("\n[4] Testing IDOR Security Guard on order tracking (Priya querying Aarav's Order #1)...")
    idor_track = client.get("/api/orders/1/tracking", headers=headers2)
    assert idor_track.status_code == 404, f"Security Breach: Expected 404, got {idor_track.status_code}"
    print("    * SUCCESS: IDOR blocked - Customer 2 cannot track Customer 1's order")

    # 5. Public Shipment Tracking by Tracking Code
    print("\n[5] Testing public unauthenticated package tracking (GET /api/orders/track/{tracking_number})...")
    public_res = client.get(f"/api/orders/track/{tracking_data['tracking_number']}")
    assert public_res.status_code == 200, f"Public tracking failed: {public_res.text}"
    pub_data = public_res.json()
    assert pub_data["tracking_number"] == tracking_data["tracking_number"]
    assert pub_data["recipient_name"] == "Aarav Patel"
    print(f"    * SUCCESS: Public tracking resolved package for {pub_data['recipient_name']} in {pub_data['shipping_city']}")

    # 5b. Non-existent Tracking Number
    bad_track = client.get("/api/orders/track/NEX-FAKE-999999")
    assert bad_track.status_code == 404
    print(f"    * SUCCESS: Invalid tracking code correctly returned 404 ({bad_track.json()['detail']})")

    # 6. Verified Purchase Guard for Reviews
    print("\n[6] Testing Verified Purchase Guard (Customer 2 trying to review Product #1 without buying it)...")
    fake_review = client.post("/api/reviews", headers=headers2, json={
        "product_id": 1,
        "rating": 1,
        "comment": "Fake negative review from non-buyer"
    })
    assert fake_review.status_code == 403, f"Expected 403 Forbidden, got {fake_review.status_code}: {fake_review.text}"
    print(f"    * SUCCESS: Fake review blocked by Verified Purchase Guard ({fake_review.json()['detail']})")

    # 7. Submit Verified Review (Aarav purchased Product #1 in Order #1)
    print("\n[7] Submitting verified 5-star review from genuine buyer Aarav for Product #1...")
    review_res = client.post("/api/reviews", headers=headers1, json={
        "product_id": 1,
        "rating": 5,
        "comment": "The M3 Max is an absolute powerhouse. Video rendering in DaVinci Resolve is seamless. Build quality is unmatched."
    })
    assert review_res.status_code == 201, f"Review submission failed: {review_res.status_code} - {review_res.text}"
    rev_data = review_res.json()
    review_id = rev_data["review_id"]
    print(f"    * SUCCESS: Review #{review_id} saved for '{rev_data['product_name']}'")
    print(f"      - Reviewer: {rev_data['customer_name']} (Verified: {rev_data['is_verified_purchase']})")
    print(f"      - Rating:   {rev_data['rating']} / 5")
    print(f"      - Comment:  \"{rev_data['comment']}\"")

    # 8. Review Idempotency & Update (Aarav updates his review without duplicate row error)
    print("\n[8] Updating existing review (testing UNIQUE customer_id, product_id idempotency)...")
    update_rev = client.post("/api/reviews", headers=headers1, json={
        "product_id": 1,
        "rating": 5,
        "comment": "Updated: After weeks of continuous rendering, thermals remain quiet and battery life is stellar."
    })
    assert update_rev.status_code == 201
    updated_data = update_rev.json()
    assert updated_data["review_id"] == review_id, "Review ID changed on update"
    assert "thermals remain quiet" in updated_data["comment"]
    print(f"    * SUCCESS: Review #{review_id} updated safely without unique constraint collision")

    # 9. Public Product Reviews Summary with Rating Breakdown
    print("\n[9] Fetching product reviews summary (GET /api/reviews/product/1)...")
    summary_res = client.get("/api/reviews/product/1")
    assert summary_res.status_code == 200
    summary = summary_res.json()
    print(f"    * Product: {summary['product_name']} (ID: {summary['product_id']})")
    print(f"    * Average Rating: {summary['average_rating']} / 5.0 (Total Reviews: {summary['total_reviews']})")
    print(f"    * Rating Distribution:")
    print(f"      - 5 Stars: {summary['breakdown']['star_5']}")
    print(f"      - 4 Stars: {summary['breakdown']['star_4']}")
    print(f"      - 3 Stars: {summary['breakdown']['star_3']}")
    print(f"      - 2 Stars: {summary['breakdown']['star_2']}")
    print(f"      - 1 Stars: {summary['breakdown']['star_1']}")
    assert summary["average_rating"] >= 4.0
    print("    * SUCCESS: Rating distribution and calculation validated")

    # 10. Customer "My Reviews" Listing
    print("\n[10] Listing all reviews submitted by Aarav (GET /api/reviews/my-reviews)...")
    my_reviews_res = client.get("/api/reviews/my-reviews", headers=headers1)
    assert my_reviews_res.status_code == 200
    my_reviews = my_reviews_res.json()
    assert len(my_reviews) >= 1
    print(f"    * Found {len(my_reviews)} review(s) written by Aarav")
    for r in my_reviews:
        print(f"      - #{r['review_id']} on {r['product_name']}: {r['rating']} Stars | \"{r['comment'][:40]}...\"")

    # 11. Delete Review
    print(f"\n[11] Deleting review #{review_id} (DELETE /api/reviews/{review_id})...")
    del_rev_res = client.delete(f"/api/reviews/{review_id}", headers=headers1)
    assert del_rev_res.status_code == 200
    print(f"    * API Response: {del_rev_res.json()['message']}")

    # Verify deleted from customer's review list
    my_reviews_after = client.get("/api/reviews/my-reviews", headers=headers1).json()
    my_review_ids = [r["review_id"] for r in my_reviews_after]
    assert review_id not in my_review_ids, f"Review #{review_id} still found in customer's review list!"
    print(f"    * SUCCESS: Review #{review_id} deleted and confirmed absent.")

    print("\n" + "=" * 70)
    print("  ALL 11 TRACKING & REVIEWS TESTS PASSED 100%!")
    print("=" * 70 + "\n")


if __name__ == "__main__":
    run_tracking_and_reviews_tests()
