from datetime import datetime
from typing import List, Optional
from decimal import Decimal
from pydantic import BaseModel


class ReviewItemResponse(BaseModel):
    review_id: int
    customer_id: int
    customer_name: str
    rating: int
    comment: Optional[str] = None
    review_date: datetime

    class Config:
        from_attributes = True


class ProductListItemResponse(BaseModel):
    product_id: int
    product_name: str
    slug: str
    price: Decimal
    image_url: Optional[str] = None
    is_active: bool
    category_id: int
    category_name: str
    category_slug: str
    stock_quantity: int
    is_in_stock: bool
    average_rating: float
    review_count: int

    class Config:
        from_attributes = True


class ProductDetailResponse(BaseModel):
    product_id: int
    product_name: str
    slug: str
    description: Optional[str] = None
    price: Decimal
    image_url: Optional[str] = None
    is_active: bool
    created_at: datetime
    category_id: int
    category_name: str
    category_slug: str
    stock_quantity: int
    is_in_stock: bool
    low_stock_threshold: int
    average_rating: float
    review_count: int
    reviews: List[ReviewItemResponse] = []

    class Config:
        from_attributes = True


class PaginatedProductResponse(BaseModel):
    items: List[ProductListItemResponse]
    total: int
    page: int
    limit: int
    total_pages: int
