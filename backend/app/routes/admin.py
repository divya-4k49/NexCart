import re
from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.database.session import get_db
from app.models.admin import Admin
from app.models.customer import Customer
from app.models.category import Category
from app.models.product import Product
from app.models.inventory import Inventory
from app.models.order import Order
from app.models.order_detail import OrderDetail
from app.models.payment import Payment
from app.models.shipping import Shipping
from app.models.cart import Cart
from app.models.review import Review
from app.schemas.auth import MessageResponse
from app.schemas.category import CategoryResponse
from app.schemas.product import ProductDetailResponse, ProductListItemResponse
from app.schemas.admin import (
    AdminProductCreateRequest,
    AdminProductUpdateRequest,
    AdminCategoryCreateRequest,
    AdminCategoryUpdateRequest,
    AdminInventoryUpdateRequest,
    AdminInventoryItemResponse,
    AdminOrderStatusUpdateRequest,
    AdminOrderListItemResponse,
    CategorySalesMetric,
    MonthlyRevenueMetric,
    OrderStatusMetric,
    TopSellingProductMetric,
    InventoryDistributionMetric,
    AdminProductListItemResponse,
    AdminDashboardAnalyticsResponse,
)
from app.utils.dependencies import get_current_admin

router = APIRouter(prefix="/api/admin", tags=["Admin Management & Analytics"])


def slugify(text: str) -> str:
    """Generate URL-safe slug from product or category name."""
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    return re.sub(r"[\s_-]+", "-", text).strip("-")


# ============================================================================
# 1. Executive Analytics Dashboard
# ============================================================================
@router.get("/analytics", response_model=AdminDashboardAnalyticsResponse, summary="Executive Dashboard Analytics")
def get_dashboard_analytics(
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Computes real-time platform metrics:
    - Total revenue from settled transactions
    - Order counts by lifecycle status
    - Customer and product counts
    - Low-stock inventory warnings
    - Category sales and revenue contribution
    - Recent order activity stream
    """
    total_rev = db.query(func.coalesce(func.sum(Payment.amount), 0)).filter(
        Payment.payment_status == "Completed"
    ).scalar()

    total_orders = db.query(Order).count()
    pending_orders = db.query(Order).filter(Order.order_status.in_(["Pending", "Confirmed", "Processing"])).count()
    completed_orders = db.query(Order).filter(Order.order_status == "Delivered").count()
    cancelled_orders = db.query(Order).filter(Order.order_status == "Cancelled").count()

    total_customers = db.query(Customer).filter(Customer.is_active == True).count()
    total_products = db.query(Product).filter(Product.is_active == True).count()
    low_stock_count = db.query(Inventory).filter(Inventory.quantity <= Inventory.low_stock_threshold).count()

    # Category Sales Breakdown
    categories = db.query(Category).filter(Category.is_active == True).all()
    category_metrics = []
    for cat in categories:
        prod_count = len(cat.products)
        # Sum units and revenue from order_details for this category
        sales_data = (
            db.query(
                func.coalesce(func.sum(OrderDetail.quantity), 0).label("units_sold"),
                func.coalesce(func.sum(OrderDetail.subtotal), 0).label("revenue")
            )
            .join(Product, Product.product_id == OrderDetail.product_id)
            .join(Order, Order.order_id == OrderDetail.order_id)
            .filter(
                Product.category_id == cat.category_id,
                Order.order_status != "Cancelled"
            )
            .first()
        )
        category_metrics.append(CategorySalesMetric(
            category_id=cat.category_id,
            category_name=cat.category_name,
            total_products=prod_count,
            total_units_sold=int(sales_data.units_sold),
            total_revenue=Decimal(str(sales_data.revenue))
        ))

    # Monthly Revenue Breakdown (Orders grouped by Year-Month)
    monthly_data = (
        db.query(
            func.date_format(Order.order_date, "%Y-%m").label("month_key"),
            func.coalesce(func.sum(Order.total_amount), 0).label("revenue"),
            func.count(Order.order_id).label("order_count")
        )
        .filter(Order.order_status != "Cancelled")
        .group_by(func.date_format(Order.order_date, "%Y-%m"))
        .order_by(func.date_format(Order.order_date, "%Y-%m").asc())
        .all()
    )
    monthly_revenue_list = [
        MonthlyRevenueMetric(
            month=str(m[0]),
            revenue=Decimal(str(m[1])),
            order_count=int(m[2])
        )
        for m in monthly_data
    ]

    # Order Status Distribution
    status_counts = (
        db.query(
            Order.order_status,
            func.count(Order.order_id).label("status_count")
        )
        .group_by(Order.order_status)
        .all()
    )
    status_dist = []
    for st_name, st_cnt in status_counts:
        pct = round((st_cnt / total_orders * 100), 1) if total_orders > 0 else 0.0
        status_dist.append(OrderStatusMetric(
            status=st_name,
            count=st_cnt,
            percentage=pct
        ))

    # Top 5 Best-Selling Products by units sold
    top_selling_data = (
        db.query(
            Product.product_id,
            Product.product_name,
            Category.category_name,
            func.coalesce(func.sum(OrderDetail.quantity), 0).label("units_sold"),
            func.coalesce(func.sum(OrderDetail.subtotal), 0).label("revenue")
        )
        .join(Category, Category.category_id == Product.category_id)
        .join(OrderDetail, OrderDetail.product_id == Product.product_id)
        .join(Order, Order.order_id == OrderDetail.order_id)
        .filter(Order.order_status != "Cancelled")
        .group_by(Product.product_id, Product.product_name, Category.category_name)
        .order_by(func.sum(OrderDetail.quantity).desc())
        .limit(5)
        .all()
    )
    top_selling_list = [
        TopSellingProductMetric(
            product_id=p[0],
            product_name=p[1],
            category_name=p[2],
            units_sold=int(p[3]),
            revenue=Decimal(str(p[4]))
        )
        for p in top_selling_data
    ]

    # Inventory Stock Level Distribution
    in_stock_cnt = db.query(Inventory).filter(Inventory.quantity > Inventory.low_stock_threshold).count()
    low_stock_cnt = db.query(Inventory).filter((Inventory.quantity > 0) & (Inventory.quantity <= Inventory.low_stock_threshold)).count()
    out_of_stock_cnt = db.query(Inventory).filter(Inventory.quantity == 0).count()
    total_units_val = db.query(func.coalesce(func.sum(Inventory.quantity), 0)).scalar()

    inventory_dist = InventoryDistributionMetric(
        in_stock=in_stock_cnt,
        low_stock=low_stock_cnt,
        out_of_stock=out_of_stock_cnt,
        total_units=int(total_units_val or 0)
    )

    # Recent Orders Stream (latest 10)
    recent_orders_query = (
        db.query(Order)
        .options(
            joinedload(Order.customer),
            joinedload(Order.order_details),
            joinedload(Order.payment),
            joinedload(Order.shipping)
        )
        .order_by(Order.order_date.desc())
        .limit(10)
        .all()
    )

    recent_orders_list = []
    for ord_obj in recent_orders_query:
        total_items = sum(d.quantity for d in ord_obj.order_details)
        recent_orders_list.append(AdminOrderListItemResponse(
            order_id=ord_obj.order_id,
            customer_id=ord_obj.customer_id,
            customer_name=ord_obj.customer.full_name if ord_obj.customer else "Unknown Customer",
            customer_email=ord_obj.customer.email if ord_obj.customer else "",
            order_date=ord_obj.order_date,
            total_amount=ord_obj.total_amount,
            order_status=ord_obj.order_status,
            total_items=total_items,
            payment_method=ord_obj.payment.payment_method if ord_obj.payment else None,
            payment_status=ord_obj.payment.payment_status if ord_obj.payment else None,
            shipping_status=ord_obj.shipping.shipping_status if ord_obj.shipping else None,
            tracking_number=ord_obj.shipping.tracking_number if ord_obj.shipping else None
        ))

    return AdminDashboardAnalyticsResponse(
        total_revenue=Decimal(str(total_rev)),
        total_orders=total_orders,
        pending_orders=pending_orders,
        completed_orders=completed_orders,
        cancelled_orders=cancelled_orders,
        total_customers=total_customers,
        total_products=total_products,
        low_stock_products_count=low_stock_count,
        category_sales=category_metrics,
        monthly_revenue=monthly_revenue_list,
        order_status_distribution=status_dist,
        top_selling_products=top_selling_list,
        inventory_distribution=inventory_dist,
        recent_orders=recent_orders_list
    )


# ============================================================================
# 2. Inventory Restock & Stock Level Management
# ============================================================================
@router.get("/inventory", response_model=List[AdminInventoryItemResponse], summary="List inventory stock levels")
def list_inventory(
    low_stock_only: bool = Query(False, description="Filter only products at or below reorder threshold"),
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Returns live inventory levels with category and low-stock alert flags.
    """
    query = (
        db.query(Inventory)
        .join(Product, Product.product_id == Inventory.product_id)
        .join(Category, Category.category_id == Product.category_id)
        .options(
            joinedload(Inventory.product).joinedload(Product.category)
        )
    )

    if low_stock_only:
        query = query.filter(Inventory.quantity <= Inventory.low_stock_threshold)

    items = query.order_by(Inventory.quantity.asc()).all()

    results = []
    for inv in items:
        results.append(AdminInventoryItemResponse(
            product_id=inv.product_id,
            product_name=inv.product.product_name,
            category_name=inv.product.category.category_name,
            price=inv.product.price,
            quantity=inv.quantity,
            low_stock_threshold=inv.low_stock_threshold,
            is_low_stock=(inv.quantity <= inv.low_stock_threshold),
            last_restocked_at=inv.last_restocked_at
        ))

    return results


@router.put("/inventory/{product_id}", response_model=AdminInventoryItemResponse, summary="Restock or adjust product inventory")
def update_inventory(
    product_id: int,
    payload: AdminInventoryUpdateRequest,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Adjusts stock levels or restocks inventory for a product.
    """
    inv = (
        db.query(Inventory)
        .options(joinedload(Inventory.product).joinedload(Product.category))
        .filter(Inventory.product_id == product_id)
        .first()
    )

    if not inv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Inventory record for Product #{product_id} not found."
        )

    if payload.add_stock is not None:
        inv.quantity += payload.add_stock
        inv.last_restocked_at = func.now()
    elif payload.quantity is not None:
        inv.quantity = payload.quantity
        inv.last_restocked_at = func.now()

    if payload.low_stock_threshold is not None:
        inv.low_stock_threshold = payload.low_stock_threshold

    db.commit()
    db.refresh(inv)

    return AdminInventoryItemResponse(
        product_id=inv.product_id,
        product_name=inv.product.product_name,
        category_name=inv.product.category.category_name,
        price=inv.product.price,
        quantity=inv.quantity,
        low_stock_threshold=inv.low_stock_threshold,
        is_low_stock=(inv.quantity <= inv.low_stock_threshold),
        last_restocked_at=inv.last_restocked_at
    )


# ============================================================================
# 3. Product Catalog Management (Admin CRUD)
# ============================================================================
@router.get("/products", response_model=List[AdminProductListItemResponse], summary="List all products for admin management")
def list_admin_products(
    category_id: Optional[int] = Query(None, description="Filter by category"),
    search: Optional[str] = Query(None, description="Search product name or slug"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Returns full product catalog with inventory and status for management.
    """
    query = (
        db.query(Product, Category, Inventory)
        .join(Category, Category.category_id == Product.category_id)
        .join(Inventory, Inventory.product_id == Product.product_id)
    )
    if category_id:
        query = query.filter(Product.category_id == category_id)
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(Product.product_name.ilike(term))
    if is_active is not None:
        query = query.filter(Product.is_active == is_active)

    results = query.order_by(Product.product_id.asc()).all()
    return [
        AdminProductListItemResponse(
            product_id=p.product_id,
            product_name=p.product_name,
            slug=p.slug,
            category_id=c.category_id,
            category_name=c.category_name,
            price=p.price,
            stock_quantity=i.quantity if i else 0,
            low_stock_threshold=i.low_stock_threshold if i else 5,
            image_url=p.image_url,
            is_active=p.is_active,
            created_at=p.created_at
        )
        for p, c, i in results
    ]


@router.post("/products", response_model=ProductDetailResponse, status_code=status.HTTP_201_CREATED, summary="Create a new product")
def create_product(
    payload: AdminProductCreateRequest,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Adds a new product and initializes its 1:1 inventory record atomically.
    """
    category = db.query(Category).filter(Category.category_id == payload.category_id).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Category #{payload.category_id} not found."
        )

    product_slug = payload.slug.strip() if payload.slug else slugify(payload.product_name)

    existing_slug = db.query(Product).filter(Product.slug == product_slug).first()
    if existing_slug:
        product_slug = f"{product_slug}-{int(datetime.utcnow().timestamp())}"

    new_prod = Product(
        category_id=payload.category_id,
        product_name=payload.product_name.strip(),
        slug=product_slug,
        description=payload.description.strip() if payload.description else None,
        price=payload.price,
        image_url=payload.image_url.strip() if payload.image_url else None,
        is_active=payload.is_active
    )
    db.add(new_prod)
    db.flush()

    # 1:1 Inventory record
    new_inv = Inventory(
        product_id=new_prod.product_id,
        quantity=payload.initial_quantity,
        low_stock_threshold=payload.low_stock_threshold,
        last_restocked_at=func.now()
    )
    db.add(new_inv)
    db.commit()
    db.refresh(new_prod)

    return ProductDetailResponse(
        product_id=new_prod.product_id,
        product_name=new_prod.product_name,
        slug=new_prod.slug,
        description=new_prod.description,
        price=new_prod.price,
        image_url=new_prod.image_url,
        is_active=new_prod.is_active,
        created_at=new_prod.created_at or datetime.utcnow(),
        category_id=category.category_id,
        category_name=category.category_name,
        category_slug=category.slug,
        stock_quantity=new_inv.quantity,
        is_in_stock=(new_inv.quantity > 0),
        low_stock_threshold=new_inv.low_stock_threshold,
        average_rating=0.0,
        review_count=0,
        reviews=[]
    )


@router.put("/products/{product_id}", response_model=ProductDetailResponse, summary="Update an existing product")
def update_product(
    product_id: int,
    payload: AdminProductUpdateRequest,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Updates product specifications, pricing, image, or active status.
    """
    prod = (
        db.query(Product)
        .options(
            joinedload(Product.category),
            joinedload(Product.inventory)
        )
        .filter(Product.product_id == product_id)
        .first()
    )

    if not prod:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product #{product_id} not found."
        )

    update_data = payload.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        if val is not None and hasattr(prod, field):
            setattr(prod, field, val.strip() if isinstance(val, str) else val)

    db.commit()
    db.refresh(prod)

    stock = prod.inventory.quantity if prod.inventory else 0
    threshold = prod.inventory.low_stock_threshold if prod.inventory else 5

    return ProductDetailResponse(
        product_id=prod.product_id,
        product_name=prod.product_name,
        slug=prod.slug,
        description=prod.description,
        price=prod.price,
        image_url=prod.image_url,
        is_active=prod.is_active,
        created_at=prod.created_at or datetime.utcnow(),
        category_id=prod.category.category_id,
        category_name=prod.category.category_name,
        category_slug=prod.category.slug,
        stock_quantity=stock,
        is_in_stock=(stock > 0),
        low_stock_threshold=threshold,
        average_rating=0.0,
        review_count=0,
        reviews=[]
    )


@router.put("/products/{product_id}/toggle-status", response_model=MessageResponse, summary="Toggle product active/archive status")
def toggle_product_status(
    product_id: int,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Toggles product active status between Active and Archived.
    """
    prod = db.query(Product).filter(Product.product_id == product_id).first()
    if not prod:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Product #{product_id} not found.")

    prod.is_active = not prod.is_active
    db.commit()
    status_label = "Activated" if prod.is_active else "Archived / Deactivated"
    return MessageResponse(
        message=f"Product #{product_id} ('{prod.product_name}') has been {status_label}.",
        status="success"
    )


@router.delete("/products/{product_id}", response_model=MessageResponse, summary="Safely remove or archive a product")
def delete_or_archive_product(
    product_id: int,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Safely deletes a product if it has no past order history.
    If linked to historical customer orders, archives it (is_active = FALSE)
    to protect database referential integrity.
    """
    prod = db.query(Product).filter(Product.product_id == product_id).first()
    if not prod:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product #{product_id} not found."
        )

    order_count = db.query(OrderDetail).filter(OrderDetail.product_id == product_id).count()
    if order_count > 0:
        prod.is_active = False
        db.commit()
        return MessageResponse(
            message=f"Product #{product_id} ('{prod.product_name}') has been archived/deactivated. It cannot be permanently deleted because it is referenced in {order_count} historical customer order(s).",
            status="success"
        )

    db.query(Cart).filter(Cart.product_id == product_id).delete()
    db.query(Review).filter(Review.product_id == product_id).delete()
    db.query(Inventory).filter(Inventory.product_id == product_id).delete()
    db.delete(prod)
    db.commit()

    return MessageResponse(
        message=f"Product #{product_id} ('{prod.product_name}') has been safely deleted.",
        status="success"
    )


# ============================================================================
# 4. Category Management (Admin CRUD)
# ============================================================================
@router.get("/categories", response_model=List[CategoryResponse], summary="List all categories for admin management")
def list_admin_categories(
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Returns all categories (both active and inactive) with product count.
    """
    results = (
        db.query(
            Category,
            func.count(Product.product_id).label("product_count")
        )
        .outerjoin(Product, Product.category_id == Category.category_id)
        .group_by(Category.category_id)
        .order_by(Category.category_id.asc())
        .all()
    )
    return [
        CategoryResponse(
            category_id=cat.category_id,
            category_name=cat.category_name,
            slug=cat.slug,
            description=cat.description,
            image_url=cat.image_url,
            is_active=cat.is_active,
            created_at=cat.created_at,
            product_count=p_cnt
        )
        for cat, p_cnt in results
    ]


@router.post("/categories", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED, summary="Create a new category")
def create_category(
    payload: AdminCategoryCreateRequest,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Creates a new product department category.
    """
    cat_slug = payload.slug.strip() if payload.slug else slugify(payload.category_name)
    existing = db.query(Category).filter(Category.slug == cat_slug).first()
    if existing:
        cat_slug = f"{cat_slug}-{int(datetime.utcnow().timestamp())}"

    new_cat = Category(
        category_name=payload.category_name.strip(),
        slug=cat_slug,
        description=payload.description.strip() if payload.description else None,
        image_url=payload.image_url.strip() if payload.image_url else None,
        is_active=payload.is_active
    )
    db.add(new_cat)
    db.commit()
    db.refresh(new_cat)

    return CategoryResponse(
        category_id=new_cat.category_id,
        category_name=new_cat.category_name,
        slug=new_cat.slug,
        description=new_cat.description,
        image_url=new_cat.image_url,
        is_active=new_cat.is_active,
        product_count=0,
        created_at=new_cat.created_at or datetime.utcnow()
    )


@router.put("/categories/{category_id}", response_model=CategoryResponse, summary="Update category details")
def update_category(
    category_id: int,
    payload: AdminCategoryUpdateRequest,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Updates category attributes such as name, description, image, or active status.
    """
    cat = db.query(Category).filter(Category.category_id == category_id).first()
    if not cat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Category #{category_id} not found."
        )

    update_data = payload.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        if val is not None and hasattr(cat, field):
            setattr(cat, field, val.strip() if isinstance(val, str) else val)

    db.commit()
    db.refresh(cat)
    prod_count = len(cat.products)

    return CategoryResponse(
        category_id=cat.category_id,
        category_name=cat.category_name,
        slug=cat.slug,
        description=cat.description,
        image_url=cat.image_url,
        is_active=cat.is_active,
        product_count=prod_count,
        created_at=cat.created_at
    )


@router.delete("/categories/{category_id}", response_model=MessageResponse, summary="Safely delete a category")
def delete_category(
    category_id: int,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Safely deletes a category only if no products are associated.
    Prevents orphaned products by throwing a descriptive error.
    """
    cat = db.query(Category).filter(Category.category_id == category_id).first()
    if not cat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Category #{category_id} not found."
        )

    prod_count = db.query(Product).filter(Product.category_id == category_id).count()
    if prod_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Cannot delete category '{cat.category_name}' because {prod_count} product(s) are currently associated with it. "
                "To prevent orphaned products, please reassign or archive those products first, or mark this category as Inactive."
            )
        )

    db.delete(cat)
    db.commit()

    return MessageResponse(
        message=f"Category #{category_id} ('{cat.category_name}') has been deleted.",
        status="success"
    )


# ============================================================================
# 5. Order Lifecycle & Status Progression
# ============================================================================
@router.get("/orders", response_model=List[AdminOrderListItemResponse], summary="List all orders across platform")
def list_all_orders(
    status_filter: Optional[str] = Query(None, description="Filter by status (e.g. Pending, Shipped, Delivered)"),
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Returns platform-wide customer orders with full customer profile details.
    """
    query = (
        db.query(Order)
        .options(
            joinedload(Order.customer),
            joinedload(Order.order_details),
            joinedload(Order.payment),
            joinedload(Order.shipping)
        )
    )

    if status_filter:
        query = query.filter(Order.order_status == status_filter.strip())

    orders = query.order_by(Order.order_date.desc()).all()

    return [
        AdminOrderListItemResponse(
            order_id=o.order_id,
            customer_id=o.customer_id,
            customer_name=o.customer.full_name if o.customer else "Unknown",
            customer_email=o.customer.email if o.customer else "",
            order_date=o.order_date,
            total_amount=o.total_amount,
            order_status=o.order_status,
            total_items=sum(d.quantity for d in o.order_details),
            payment_method=o.payment.payment_method if o.payment else None,
            payment_status=o.payment.payment_status if o.payment else None,
            shipping_status=o.shipping.shipping_status if o.shipping else None,
            tracking_number=o.shipping.tracking_number if o.shipping else None
        )
        for o in orders
    ]


@router.put("/orders/{order_id}/status", summary="Update order lifecycle status")
def update_order_status(
    order_id: int,
    payload: AdminOrderStatusUpdateRequest,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Updates order lifecycle status and synchronizes shipping progression:
    - Status 'Shipped': sets shipped_at timestamp and shipping_status = 'Shipped'
    - Status 'Delivered': sets delivered_at timestamp, shipping_status = 'Delivered', and payment_status = 'Completed'
    - Status 'Cancelled': restocks inventory and marks payment 'Refunded'
    """
    order = (
        db.query(Order)
        .options(
            joinedload(Order.order_details),
            joinedload(Order.payment),
            joinedload(Order.shipping)
        )
        .filter(Order.order_id == order_id)
        .first()
    )

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order #{order_id} not found."
        )

    previous_status = order.order_status
    new_status = payload.order_status

    order.order_status = new_status

    if order.shipping:
        if payload.carrier:
            order.shipping.carrier = payload.carrier.strip()
        if payload.tracking_number:
            order.shipping.tracking_number = payload.tracking_number.strip()
        if payload.shipping_status:
            order.shipping.shipping_status = payload.shipping_status

        # Automatic milestone timestamp synchronization
        if new_status == "Shipped":
            order.shipping.shipping_status = "Shipped"
            if not order.shipping.shipped_at:
                order.shipping.shipped_at = func.now()
        elif new_status == "Delivered":
            order.shipping.shipping_status = "Delivered"
            if not order.shipping.delivered_at:
                order.shipping.delivered_at = func.now()
            # When delivered, mark payment completed
            if order.payment:
                order.payment.payment_status = "Completed"

    # Restock inventory if transitioning to Cancelled
    if new_status == "Cancelled" and previous_status != "Cancelled":
        for item in order.order_details:
            inv = db.query(Inventory).filter(Inventory.product_id == item.product_id).first()
            if inv:
                inv.quantity += item.quantity
        if order.payment and order.payment.payment_status == "Completed":
            order.payment.payment_status = "Refunded"
        if order.shipping:
            order.shipping.shipping_status = "Returned"

    db.commit()
    db.refresh(order)

    return {
        "status": "success",
        "message": f"Order #{order_id} status updated from '{previous_status}' to '{new_status}'.",
        "order_id": order_id,
        "order_status": order.order_status,
        "shipping_status": order.shipping.shipping_status if order.shipping else None,
        "payment_status": order.payment.payment_status if order.payment else None
    }
