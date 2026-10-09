from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class AddressBase(BaseModel):
    address_type: str = Field("Home", example="Home", description="Address label (e.g. Home, Office, College)")
    recipient_name: str = Field(..., min_length=2, max_length=100, example="Aarav Patel")
    phone: str = Field(..., min_length=7, max_length=20, example="+91 9876543210")
    street_address: str = Field(..., min_length=5, max_length=255, example="Flat 402, Shanti Heights, Ring Road")
    city: str = Field(..., min_length=2, max_length=100, example="Ahmedabad")
    state: str = Field(..., min_length=2, max_length=100, example="Gujarat")
    postal_code: str = Field(..., min_length=4, max_length=20, example="380015")
    country: str = Field("India", max_length=50, example="India")
    is_default: bool = False


class AddressCreateRequest(AddressBase):
    pass


class AddressUpdateRequest(BaseModel):
    address_type: Optional[str] = None
    recipient_name: Optional[str] = None
    phone: Optional[str] = None
    street_address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None
    is_default: Optional[bool] = None


class AddressResponse(AddressBase):
    address_id: int
    customer_id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
