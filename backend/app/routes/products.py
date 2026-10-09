import math
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.category import Category
from app.models.product import Product
from app.models.inventory import Inventory
from app.models.review import Review
from app.models.customer import Customer
from app.schemas.product import (
    ProductListItemResponse,
    ProductDetailResponse,
    PaginatedProductResponse,
    ReviewItemResponse,
)

router = APIRouter(prefix="/api/products", tags=["Products & Catalog"])


def _build_product_list_item(prod: Product, cat: Category, inv: Inventory, avg_r: float, r_cnt: int) -> ProductListItemResponse:
    stock_qty = inv.quantity if inv else 0
    return ProductListItemResponse(
        product_id=prod.product_id,
        product_name=prod.product_name,
        slug=prod.slug,
        price=prod.price,
        image_url=prod.image_url,
        is_active=prod.is_active,
        category_id=cat.category_id,
        category_name=cat.category_name,
        category_slug=cat.slug,
        stock_quantity=stock_qty,
        is_in_stock=(stock_qty > 0),
        average_rating=round(float(avg_r or 0.0), 1),
        review_count=int(r_cnt or 0)
    )


# ==============================================================================
# 1. BROWSE & FILTER PRODUCTS (REAL BACKEND MYSQL FILTERING)
# ==============================================================================
@router.get("", response_model=PaginatedProductResponse, summary="Browse, search, and filter catalog with pagination")
def list_products(
    search: Optional[str] = Query(None, description="Search keyword in product name or description"),
    category_id: Optional[int] = Query(None, description="Filter by Category ID"),
    category_slug: Optional[str] = Query(None, description="Filter by Category Slug"),
    min_price: Optional[float] = Query(None, ge=0, description="Minimum price filter"),
    max_price: Optional[float] = Query(None, ge=0, description="Maximum price filter"),
    min_rating: Optional[float] = Query(None, ge=1, le=5, description="Filter by minimum average rating (e.g. 4.0 or 3.0)"),
    in_stock: Optional[bool] = Query(None, description="True for in-stock only, False for out-of-stock"),
    sort_by: str = Query("newest", pattern="^(newest|price_asc|price_desc|rating|name_asc)$", description="Sorting criteria"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(12, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db)
):
    """
    Core Product Browsing API for NexCart:
    - Queries MySQL with dynamic WHERE, HAVING, GROUP BY, and ORDER BY clauses.
    - Joins `product` 1:1 with `inventory`, 1:M with `category`, and 1:M with `review`.
    - Computes real-time average ratings and stock availability directly in SQL.
    """
    # Base query joining Product, Category, 1:1 Inventory, and Review aggregates
    query = (
        db.query(
            Product,
            Category,
            Inventory,
            func.coalesce(func.avg(Review.rating), 0.0).label("avg_rating"),
            func.count(Review.review_id).label("review_count")
        )
        .join(Category, Product.category_id == Category.category_id)
        .join(Inventory, Product.product_id == Inventory.product_id)
        .outerjoin(Review, Product.product_id == Review.product_id)
        .filter(Product.is_active == True)
        .filter(Category.is_active == True)
    )

    # 1. Search filter (Product Name or Description)
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Product.product_name.ilike(term),
                Product.description.ilike(term)
            )
        )

    # 2. Category filter
    if category_id:
        query = query.filter(Product.category_id == category_id)
    elif category_slug:
        query = query.filter(Category.slug == category_slug.strip().lower())

    # 3. Price boundary filter
    if min_price is not None:
        query = query.filter(Product.price >= min_price)
    if max_price is not None:
        query = query.filter(Product.price <= max_price)

    # 4. Stock availability filter
    if in_stock is True:
        query = query.filter(Inventory.quantity > 0)
    elif in_stock is False:
        query = query.filter(Inventory.quantity == 0)

    # Group by required for aggregates
    query = query.group_by(Product.product_id, Category.category_id, Inventory.inventory_id)

    # 5. Rating filter (Applied via HAVING on aggregated AVG)
    if min_rating is not None:
        query = query.having(func.coalesce(func.avg(Review.rating), 0.0) >= min_rating)

    # Calculate total count of filtered records
    total_records = query.count()

    # 6. Sorting
    if sort_by == "price_asc":
        query = query.order_by(Product.price.asc())
    elif sort_by == "price_desc":
        query = query.order_by(Product.price.desc())
    elif sort_by == "rating":
        query = query.order_by(func.coalesce(func.avg(Review.rating), 0.0).desc(), Product.product_id.desc())
    elif sort_by == "name_asc":
        query = query.order_by(Product.product_name.asc())
    else:  # newest
        query = query.order_by(Product.created_at.desc(), Product.product_id.desc())

    # 7. Pagination
    offset = (page - 1) * limit
    results = query.offset(offset).limit(limit).all()

    items = [
        _build_product_list_item(prod, cat, inv, avg_r, r_cnt)
        for prod, cat, inv, avg_r, r_cnt in results
    ]

    total_pages = math.ceil(total_records / limit) if total_records > 0 else 1

    return PaginatedProductResponse(
        items=items,
        total=total_records,
        page=page,
        limit=limit,
        total_pages=total_pages
    )


# ==============================================================================
# 2. FEATURED PRODUCTS (FOR HOME PAGE)
# ==============================================================================
@router.get("/featured", response_model=List[ProductListItemResponse], summary="Featured products for the Home Page")
def get_featured_products(limit: int = 8, db: Session = Depends(get_db)):
    """
    Returns high-priority featured products in stock with ratings for the Home Page hero/featured grid.
    """
    results = (
        db.query(
            Product,
            Category,
            Inventory,
            func.coalesce(func.avg(Review.rating), 0.0).label("avg_rating"),
            func.count(Review.review_id).label("review_count")
        )
        .join(Category, Product.category_id == Category.category_id)
        .join(Inventory, Product.product_id == Inventory.product_id)
        .outerjoin(Review, Product.product_id == Review.product_id)
        .filter(Product.is_active == True)
        .filter(Inventory.quantity > 0)
        .group_by(Product.product_id, Category.category_id, Inventory.inventory_id)
        .order_by(func.coalesce(func.avg(Review.rating), 0.0).desc(), Product.price.desc())
        .limit(limit)
        .all()
    )

    return [
        _build_product_list_item(prod, cat, inv, avg_r, r_cnt)
        for prod, cat, inv, avg_r, r_cnt in results
    ]


# ==============================================================================
# 3. TRENDING PRODUCTS (FOR HOME PAGE)
# ==============================================================================
@router.get("/trending", response_model=List[ProductListItemResponse], summary="Trending products for the Home Page")
def get_trending_products(limit: int = 8, db: Session = Depends(get_db)):
    """
    Returns trending products based on recent views/recency.
    """
    results = (
        db.query(
            Product,
            Category,
            Inventory,
            func.coalesce(func.avg(Review.rating), 0.0).label("avg_rating"),
            func.count(Review.review_id).label("review_count")
        )
        .join(Category, Product.category_id == Category.category_id)
        .join(Inventory, Product.product_id == Inventory.product_id)
        .outerjoin(Review, Product.product_id == Review.product_id)
        .filter(Product.is_active == True)
        .group_by(Product.product_id, Category.category_id, Inventory.inventory_id)
        .order_by(Product.created_at.desc(), Product.product_id.desc())
        .limit(limit)
        .all()
    )

    return [
        _build_product_list_item(prod, cat, inv, avg_r, r_cnt)
        for prod, cat, inv, avg_r, r_cnt in results
    ]


# ==============================================================================
# 4. SINGLE PRODUCT DETAILS WITH REVIEWS & 1:1 INVENTORY
# ==============================================================================
@router.get("/{id_or_slug}", response_model=ProductDetailResponse, summary="Get full product details by ID or slug")
def get_product_details(id_or_slug: str, db: Session = Depends(get_db)):
    """
    Returns full product details:
    - Master catalog info (name, price, description, images)
    - Category details
    - 1:1 Inventory stock level and threshold
    - Customer reviews list with reviewer name, rating stars, and comments
    """
    # 1. Fetch Product
    if id_or_slug.isdigit():
        prod = db.query(Product).filter(Product.product_id == int(id_or_slug)).first()
    else:
        prod = db.query(Product).filter(Product.slug == id_or_slug.strip().lower()).first()

    if not prod or not prod.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product '{id_or_slug}' not found"
        )

    # 2. Fetch 1:1 Inventory
    inv = prod.inventory
    stock_qty = inv.quantity if inv else 0
    threshold = inv.low_stock_threshold if inv else 5

    # 3. Fetch Reviews joined with Customer names
    reviews_data = (
        db.query(Review, Customer.full_name)
        .join(Customer, Review.customer_id == Customer.customer_id)
        .filter(Review.product_id == prod.product_id)
        .order_by(Review.review_date.desc())
        .all()
    )

    review_items = []
    total_rating = 0
    for rev, cust_name in reviews_data:
        total_rating += rev.rating
        review_items.append(
            ReviewItemResponse(
                review_id=rev.review_id,
                customer_id=rev.customer_id,
                customer_name=cust_name,
                rating=rev.rating,
                comment=rev.comment,
                review_date=rev.review_date
            )
        )

    r_cnt = len(review_items)
    avg_rating = round(total_rating / r_cnt, 1) if r_cnt > 0 else 0.0

    return ProductDetailResponse(
        product_id=prod.product_id,
        product_name=prod.product_name,
        slug=prod.slug,
        description=prod.description,
        price=prod.price,
        image_url=prod.image_url,
        is_active=prod.is_active,
        created_at=prod.created_at,
        category_id=prod.category.category_id,
        category_name=prod.category.category_name,
        category_slug=prod.category.slug,
        stock_quantity=stock_qty,
        is_in_stock=(stock_qty > 0),
        low_stock_threshold=threshold,
        average_rating=avg_rating,
        review_count=r_cnt,
        reviews=review_items
    )
