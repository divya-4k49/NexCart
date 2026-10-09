"""
NEXCART PRODUCT & CATEGORY TEST SUITE
Tests Category listing, product search, multi-criteria filtering,
sorting, pagination, 1:1 stock resolution, and customer reviews.
"""
import sys
import os

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def run_product_catalog_tests():
    print("\n" + "=" * 70)
    print("  NEXCART - PRODUCT CATALOG & CATEGORY TEST SUITE")
    print("  Tagline: \"Your Next Shopping Experience\" | Database: ecommerce_db")
    print("=" * 70)

    # 1. Categories listing with live product counts
    print("\n[1] Testing Categories Listing (with live product counts)...")
    res = client.get("/api/categories")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    cats = res.json()
    assert len(cats) >= 5, f"Expected at least 5 categories, got {len(cats)}"
    for c in cats:
        print(f"    * Category: '{c['category_name']}' (slug: {c['slug']}) -> {c['product_count']} products")

    # 2. Category detail lookup by slug
    print("\n[2] Testing Category Detail Lookup by Slug ('audio-headphones')...")
    res = client.get("/api/categories/audio-headphones")
    assert res.status_code == 200
    cat_detail = res.json()
    assert cat_detail["category_name"] == "Audio & Headphones"
    print(f"    * SUCCESS: Category retrieved: {cat_detail['category_name']}")

    # 3. Default paginated product listing
    print("\n[3] Testing Default Catalog Listing (All active products)...")
    res = client.get("/api/products?limit=20")
    assert res.status_code == 200
    data = res.json()
    total = data["total"]
    items = data["items"]
    assert total >= 14, f"Expected 14 products in DB, got {total}"
    print(f"    * SUCCESS: Total products in database: {total} | Items on page 1: {len(items)}")

    # 4. Search Filter
    print("\n[4] Testing Search Filter (?search=MacBook)...")
    res = client.get("/api/products?search=MacBook")
    assert res.status_code == 200
    search_items = res.json()["items"]
    assert len(search_items) >= 1
    assert "MacBook" in search_items[0]["product_name"]
    print(f"    * SUCCESS: Search returned '{search_items[0]['product_name']}' (Rs. {search_items[0]['price']})")

    # 5. Category Filter
    print("\n[5] Testing Category Filter (?category_slug=smartphones-tablets)...")
    res = client.get("/api/products?category_slug=smartphones-tablets")
    assert res.status_code == 200
    phone_items = res.json()["items"]
    assert len(phone_items) == 3
    for p in phone_items:
        assert p["category_slug"] == "smartphones-tablets"
    print(f"    * SUCCESS: Returned {len(phone_items)} smartphones correctly.")

    # 6. Price Range Filter
    print("\n[6] Testing Price Range Filter (?min_price=100000&max_price=200000)...")
    res = client.get("/api/products?min_price=100000&max_price=200000")
    assert res.status_code == 200
    price_items = res.json()["items"]
    for p in price_items:
        price = float(p["price"])
        assert 100000 <= price <= 200000, f"Product {p['product_name']} price {price} out of bounds"
        print(f"    * In range: {p['product_name']} -> Rs. {price}")
    print(f"    * SUCCESS: {len(price_items)} products matched price range.")

    # 7. Rating Filter (4+ stars)
    print("\n[7] Testing Rating Filter (?min_rating=4.0)...")
    res = client.get("/api/products?min_rating=4.0")
    assert res.status_code == 200
    rated_items = res.json()["items"]
    assert len(rated_items) >= 2
    for p in rated_items:
        assert p["average_rating"] >= 4.0
        print(f"    * High Rating: {p['product_name']} -> {p['average_rating']} stars ({p['review_count']} reviews)")
    print(f"    * SUCCESS: {len(rated_items)} products matched rating filter.")

    # 8. In-Stock Filter
    print("\n[8] Testing Stock Availability Filter (?in_stock=true)...")
    res = client.get("/api/products?in_stock=true")
    assert res.status_code == 200
    in_stock_items = res.json()["items"]
    for p in in_stock_items:
        assert p["is_in_stock"] is True
        assert p["stock_quantity"] > 0
    print(f"    * SUCCESS: Verified all {len(in_stock_items)} returned items are in stock.")

    # 9. Sorting (Price Low to High)
    print("\n[9] Testing Sorting (?sort_by=price_asc)...")
    res = client.get("/api/products?sort_by=price_asc&limit=5")
    assert res.status_code == 200
    asc_items = res.json()["items"]
    prices = [float(p["price"]) for p in asc_items]
    assert prices == sorted(prices), f"Prices not ascending: {prices}"
    print(f"    * SUCCESS: Lowest price: Rs. {prices[0]} | Next: Rs. {prices[1]} | Ascending validated!")

    # 10. Featured & Trending Home Page APIs
    print("\n[10] Testing Home Page Sections (Featured & Trending)...")
    res_feat = client.get("/api/products/featured?limit=4")
    assert res_feat.status_code == 200
    assert len(res_feat.json()) <= 4
    print(f"    * SUCCESS: Featured items returned: {len(res_feat.json())}")

    res_trend = client.get("/api/products/trending?limit=4")
    assert res_trend.status_code == 200
    assert len(res_trend.json()) <= 4
    print(f"    * SUCCESS: Trending items returned: {len(res_trend.json())}")

    # 11. Single Product Detail Lookup with Reviews & Stock
    print("\n[11] Testing Full Product Detail Lookup ('macbook-pro-16-m3-max')...")
    res = client.get("/api/products/macbook-pro-16-m3-max")
    assert res.status_code == 200
    prod = res.json()
    assert prod["slug"] == "macbook-pro-16-m3-max"
    assert prod["category_name"] == "Laptops & Computers"
    assert prod["stock_quantity"] == 15
    assert prod["is_in_stock"] is True
    assert prod["average_rating"] == 5.0
    assert len(prod["reviews"]) >= 1
    rev = prod["reviews"][0]
    print(f"    * Product: {prod['product_name']}")
    print(f"    * Price:   Rs. {prod['price']} | Category: {prod['category_name']}")
    print(f"    * Stock:   {prod['stock_quantity']} units available (1:1 Inventory resolved)")
    print(f"    * Rating:  {prod['average_rating']} / 5 ({prod['review_count']} reviews)")
    print(f"    * Top Review from {rev['customer_name']}: \"{rev['comment']}\"")

    print("\n" + "=" * 70)
    print("  ALL 11 PRODUCT & CATEGORY CATALOG TESTS PASSED 100%!")
    print("=" * 70 + "\n")

if __name__ == "__main__":
    run_product_catalog_tests()
