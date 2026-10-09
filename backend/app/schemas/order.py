from datetime import date, datetime
from decimal import Decimal
from typing import List, Literal, Optional
from pydantic import BaseModel, Field


class OrderCreateRequest(BaseModel):
    address_id: int = Field(..., example=1, description="ID of the saved delivery address")
    payment_method: Literal["Cash on Delivery", "Card Demo", "UPI Demo"] = Field(
        ...,
        example="UPI Demo",
        description="Payment method chosen for this order"
    )


class OrderDetailResponse(BaseModel):
    order_detail_id: int
    product_id: int
    product_name: str
    product_slug: Optional[str] = None
    product_image: Optional[str] = None
    quantity: int
    unit_price: Decimal
    subtotal: Decimal

    class Config:
        from_attributes = True


class PaymentSummaryResponse(BaseModel):
    payment_id: int
    payment_method: str
    payment_status: str
    transaction_reference: Optional[str] = None
    amount: Decimal
    payment_date: datetime

    class Config:
        from_attributes = True


class ShippingSummaryResponse(BaseModel):
    shipping_id: int
    shipping_status: str
    tracking_number: str
    carrier: str
    estimated_delivery: Optional[date] = None
    shipped_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class OrderAddressResponse(BaseModel):
    address_id: int
    address_type: str
    recipient_name: str
    phone: str
    street_address: str
    city: str
    state: str
    postal_code: str
    country: str

    class Config:
        from_attributes = True


class OrderListItemResponse(BaseModel):
    order_id: int
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


class OrderDetailFullResponse(BaseModel):
    order_id: int
    customer_id: int
    order_date: datetime
    total_amount: Decimal
    order_status: str
    address: OrderAddressResponse
    items: List[OrderDetailResponse]
    payment: Optional[PaymentSummaryResponse] = None
    shipping: Optional[ShippingSummaryResponse] = None

    class Config:
        from_attributes = True


class OrderPlacementSuccessResponse(BaseModel):
    message: str
    order: OrderDetailFullResponse


class OrderTrackingStep(BaseModel):
    step_name: str
    status: str  # "completed", "current", "pending", "cancelled"
    timestamp: Optional[datetime] = None
    description: str


class OrderTrackingResponse(BaseModel):
    order_id: int
    order_date: datetime
    order_status: str
    tracking_number: str
    carrier: str
    shipping_status: str
    estimated_delivery: Optional[date] = None
    recipient_name: str
    shipping_city: str
    shipping_state: str
    current_step_index: int
    steps: List[OrderTrackingStep]

    class Config:
        from_attributes = True
