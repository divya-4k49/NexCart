from datetime import datetime
from decimal import Decimal
from typing import List, Literal, Optional
from pydantic import BaseModel, Field

from app.schemas.order import OrderDetailResponse, PaymentSummaryResponse, ShippingSummaryResponse, OrderAddressResponse


# ============================================================================
# Product & Category Admin Schemas
# ============================================================================
class AdminProductCreateRequest(BaseModel):
    category_id: int = Field(..., example=1)
    product_name: str = Field(..., min_length=2, max_length=200, example="Dell XPS 15 OLED")
    slug: Optional[str] = Field(None, example="dell-xps-15-oled")
    description: Optional[str] = Field(None, example="15.6-inch 3.5K OLED touchscreen, Intel Core i9, 32GB RAM.")
    price: Decimal = Field(..., gt=0, example=219990.00)
    image_url: Optional[str] = Field(None, example="https://images.unsplash.com/photo-1593642632823-8f785ba67e45")
    initial_quantity: int = Field(15, ge=0, example=15)
    low_stock_threshold: int = Field(5, ge=0, example=5)
    is_active: bool = True


class AdminProductUpdateRequest(BaseModel):
    category_id: Optional[int] = None
    product_name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    price: Optional[Decimal] = None
    image_url: Optional[str] = None
    is_active: Optional[bool] = None


class AdminCategoryCreateRequest(BaseModel):
    category_name: str = Field(..., min_length=2, max_length=100, example="Gaming Consoles")
    slug: Optional[str] = Field(None, example="gaming-consoles")
    description: Optional[str] = Field(None, example="Next-gen consoles, VR headsets, and handhelds.")
    image_url: Optional[str] = Field(None, example="https://images.unsplash.com/photo-1486401899868-0e435ed85128")
    is_active: bool = True


class AdminCategoryUpdateRequest(BaseModel):
    category_name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    is_active: Optional[bool] = None


# ============================================================================
# Inventory Management Schemas
# ============================================================================
class AdminInventoryUpdateRequest(BaseModel):
    quantity: Optional[int] = Field(None, ge=0, description="Override exact quantity in stock")
    add_stock: Optional[int] = Field(None, description="Increment existing stock by this number")
    low_stock_threshold: Optional[int] = Field(None, ge=0, description="Low stock warning threshold")


class AdminInventoryItemResponse(BaseModel):
    product_id: int
    product_name: str
    category_name: str
    price: Decimal
    quantity: int
    low_stock_threshold: int
    is_low_stock: bool
    last_restocked_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ============================================================================
# Order Lifecycle Management Schemas
# ============================================================================
class AdminOrderStatusUpdateRequest(BaseModel):
    order_status: Literal["Pending", "Confirmed", "Processing", "Shipped", "Out for Delivery", "Delivered", "Cancelled"]
    carrier: Optional[str] = None
    tracking_number: Optional[str] = None
    shipping_status: Optional[Literal["Pending", "Processing", "Shipped", "Out for Delivery", "Delivered", "Returned"]] = None


class AdminOrderListItemResponse(BaseModel):
    order_id: int
    customer_id: int
    customer_name: str
    customer_email: str
    order_date: datetime
    total_amount: Decimal
    order_status: str
    total_items: int
    payment_method: Optional[str] = None
    payment_status: Optional[str] = None
    shipping_status: Optional[str] = None
    tracking_number: Optional[str] = None

    class Config:
        from_attributes = True


# ============================================================================
# Executive Analytics Dashboard Schemas
# ============================================================================
class CategorySalesMetric(BaseModel):
    category_id: int
    category_name: str
    total_products: int
    total_units_sold: int
    total_revenue: Decimal


class AdminDashboardAnalyticsResponse(BaseModel):
    total_revenue: Decimal
    total_orders: int
    pending_orders: int
    completed_orders: int
    cancelled_orders: int
    total_customers: int
    total_products: int
    low_stock_products_count: int
    category_sales: List[CategorySalesMetric]
    recent_orders: List[AdminOrderListItemResponse]

    class Config:
        from_attributes = True
