from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, Field


class AddToCartRequest(BaseModel):
    product_id: int = Field(..., description="ID of product to add to cart")
    quantity: int = Field(1, ge=1, le=50, description="Quantity to add (minimum 1)")


class UpdateCartItemRequest(BaseModel):
    quantity: int = Field(..., ge=1, le=50, description="New quantity for this cart line item")


class CartItemResponse(BaseModel):
    cart_id: int
    product_id: int
    product_name: str
    product_slug: str
    product_image: Optional[str] = None
    category_name: str
    unit_price: Decimal
    quantity: int
    item_total: Decimal
    stock_available: int
    is_stock_sufficient: bool

    class Config:
        from_attributes = True


class CartSummaryResponse(BaseModel):
    items: List[CartItemResponse]
    total_items: int
    subtotal: Decimal
    shipping_fee: Decimal
    grand_total: Decimal
    free_shipping_threshold: Decimal = Decimal("999.00")
