from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.config.settings import get_settings
from app.database.session import get_db
from app.models.customer import Customer
from app.models.admin import Admin
from app.schemas.auth import (
    CustomerRegisterRequest,
    CustomerLoginRequest,
    AdminLoginRequest,
    CustomerResponse,
    AdminResponse,
    TokenResponse,
    MessageResponse
)
from app.utils.security import (
    hash_password,
    verify_password,
    create_access_token
)
from app.utils.dependencies import get_current_customer, get_current_admin

router = APIRouter(prefix="/api/auth", tags=["Authentication & Accounts"])
settings = get_settings()


# ==============================================================================
# CUSTOMER AUTHENTICATION
# ==============================================================================
@router.post(
    "/customer/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new customer account"
)
def register_customer(payload: CustomerRegisterRequest, db: Session = Depends(get_db)):
    """
    Registers a new customer in NexCart:
    1. Validates that email is unique in MySQL.
    2. Hashes password using BCrypt with salt.
    3. Saves record into the `customer` table.
    4. Automatically signs and returns a JWT access token.
    """
    # 1. Check if email already exists
    existing_customer = db.query(Customer).filter(Customer.email == payload.email.lower()).first()
    if existing_customer:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    # 2. Hash password with BCrypt
    hashed_pwd = hash_password(payload.password)

    # 3. Create Customer ORM instance
    new_customer = Customer(
        full_name=payload.full_name.strip(),
        email=payload.email.lower().strip(),
        phone=payload.phone.strip() if payload.phone else None,
        password_hash=hashed_pwd,
        is_active=True
    )

    db.add(new_customer)
    db.commit()
    db.refresh(new_customer)

    # 4. Generate JWT access token
    token_data = {
        "sub": str(new_customer.customer_id),
        "user_type": "customer",
        "email": new_customer.email,
        "name": new_customer.full_name
    }
    access_token = create_access_token(data=token_data)

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user_type="customer",
        user_info=CustomerResponse.model_validate(new_customer)
    )


@router.post(
    "/customer/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Customer login with email and password"
)
def login_customer(payload: CustomerLoginRequest, db: Session = Depends(get_db)):
    """
    Authenticates a customer:
    1. Looks up customer by email.
    2. Verifies plain password against stored BCrypt hash.
    3. Checks if account is active.
    4. Returns JWT token and customer profile.
    """
    customer = db.query(Customer).filter(Customer.email == payload.email.lower()).first()
    if not customer or not verify_password(payload.password, customer.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    if not customer.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your NexCart account has been deactivated. Please contact support."
        )

    # Generate JWT
    token_data = {
        "sub": str(customer.customer_id),
        "user_type": "customer",
        "email": customer.email,
        "name": customer.full_name
    }
    access_token = create_access_token(data=token_data)

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user_type="customer",
        user_info=CustomerResponse.model_validate(customer)
    )


@router.get(
    "/customer/me",
    response_model=CustomerResponse,
    status_code=status.HTTP_200_OK,
    summary="Get current logged-in customer profile"
)
def get_customer_profile(current_customer: Customer = Depends(get_current_customer)):
    """
    Protected endpoint: Returns the profile of the authenticated customer.
    Password hash is automatically omitted by Pydantic response schema.
    """
    return current_customer


# ==============================================================================
# ADMIN AUTHENTICATION
# ==============================================================================
@router.post(
    "/admin/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Admin portal login with username or email"
)
def login_admin(payload: AdminLoginRequest, db: Session = Depends(get_db)):
    """
    Authenticates an administrator:
    1. Matches either `username` OR `email`.
    2. Verifies BCrypt password hash.
    3. Checks admin active status.
    4. Issues admin JWT access token.
    """
    identifier = payload.username_or_email.strip().lower()
    admin = db.query(Admin).filter(
        (Admin.username == identifier) | (Admin.email == identifier)
    ).first()

    if not admin or not verify_password(payload.password, admin.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin credentials."
        )

    if not admin.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin account is disabled."
        )

    # Generate Admin JWT
    token_data = {
        "sub": str(admin.admin_id),
        "user_type": "admin",
        "role": admin.role,
        "username": admin.username
    }
    access_token = create_access_token(data=token_data)

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user_type="admin",
        user_info=AdminResponse.model_validate(admin)
    )


@router.get(
    "/admin/me",
    response_model=AdminResponse,
    status_code=status.HTTP_200_OK,
    summary="Get current logged-in admin profile"
)
def get_admin_profile(current_admin: Admin = Depends(get_current_admin)):
    """
    Protected endpoint: Returns the profile of the authenticated admin.
    """
    return current_admin
