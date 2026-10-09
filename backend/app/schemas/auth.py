from datetime import datetime
from typing import Optional, Union
from pydantic import BaseModel, EmailStr, Field


# ------------------------------------------------------------------------------
# Request Schemas
# ------------------------------------------------------------------------------
class CustomerRegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100, example="Karan Mehta")
    email: EmailStr = Field(..., example="karan.mehta@example.com")
    password: str = Field(..., min_length=6, max_length=72, example="SecurePass@123")
    phone: Optional[str] = Field(None, max_length=20, example="+91 9876501234")


class CustomerLoginRequest(BaseModel):
    email: EmailStr = Field(..., example="aarav.patel@gmail.com")
    password: str = Field(..., example="Customer@123")


class AdminLoginRequest(BaseModel):
    username_or_email: str = Field(..., example="superadmin")
    password: str = Field(..., example="Admin@123")


# ------------------------------------------------------------------------------
# Profile Response Schemas (Never exposes password_hash!)
# ------------------------------------------------------------------------------
class CustomerResponse(BaseModel):
    customer_id: int
    full_name: str
    email: str
    phone: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class AdminResponse(BaseModel):
    admin_id: int
    username: str
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ------------------------------------------------------------------------------
# Authentication Token Response
# ------------------------------------------------------------------------------
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_type: str  # "customer" or "admin"
    user_info: Union[CustomerResponse, AdminResponse]


class MessageResponse(BaseModel):
    message: str
    status: str = "success"


# ------------------------------------------------------------------------------
# Password Management Schemas
# ------------------------------------------------------------------------------
class ChangePasswordRequest(BaseModel):
    current_password: str = Field(..., min_length=1, description="Current account password")
    new_password: str = Field(..., min_length=6, max_length=72, description="New secure password (min 6 chars)")


class ForgotPasswordRequest(BaseModel):
    email: EmailStr = Field(..., description="Registered customer or admin email address")


class ForgotPasswordResponse(BaseModel):
    message: str
    reset_token: Optional[str] = None
    expires_in_minutes: int = 15


class ResetPasswordRequest(BaseModel):
    email: EmailStr = Field(..., description="Registered email address")
    reset_token: str = Field(..., min_length=10, description="15-minute verification token")
    new_password: str = Field(..., min_length=6, max_length=72, description="New password (min 6 chars)")
