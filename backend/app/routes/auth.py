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
    MessageResponse,
    ChangePasswordRequest,
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    ResetPasswordRequest
)
from app.utils.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_password_reset_token,
    verify_password_reset_token
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


# ==============================================================================
# PASSWORD MANAGEMENT & RECOVERY
# ==============================================================================
@router.post(
    "/customer/change-password",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Change password for authenticated customer"
)
def change_customer_password(
    payload: ChangePasswordRequest,
    current_customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """
    Secure password update for authenticated customers:
    1. Verifies the current password against stored BCrypt hash.
    2. Validates new password length and constraints.
    3. Hashes and persists the new password.
    """
    if not verify_password(payload.current_password, current_customer.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect."
        )

    if payload.current_password == payload.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password cannot be identical to current password."
        )

    current_customer.password_hash = hash_password(payload.new_password)
    db.commit()

    return MessageResponse(
        message="Your password has been changed successfully.",
        status="success"
    )


@router.post(
    "/admin/change-password",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Change password for authenticated administrator"
)
def change_admin_password(
    payload: ChangePasswordRequest,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Secure password update for authenticated administrators:
    1. Verifies the current admin password against stored BCrypt hash.
    2. Hashes and updates the admin password.
    """
    if not verify_password(payload.current_password, current_admin.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current administrator password is incorrect."
        )

    if payload.current_password == payload.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password cannot be identical to current password."
        )

    current_admin.password_hash = hash_password(payload.new_password)
    db.commit()

    return MessageResponse(
        message="Administrator password updated successfully.",
        status="success"
    )


@router.post(
    "/forgot-password/request",
    response_model=ForgotPasswordResponse,
    status_code=status.HTTP_200_OK,
    summary="Request a secure password reset token"
)
def request_password_reset(
    payload: ForgotPasswordRequest,
    db: Session = Depends(get_db)
):
    """
    Initiates secure password reset flow:
    1. Checks if customer or admin account exists for the email.
    2. Generates a signed, time-limited verification token (15 mins).
    3. Returns token for verification.
    """
    email_clean = payload.email.lower().strip()
    cust = db.query(Customer).filter(Customer.email == email_clean).first()
    adm = db.query(Admin).filter(Admin.email == email_clean).first()

    if not cust and not adm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No customer or administrator account registered with this email address."
        )

    reset_token = create_password_reset_token(email_clean, expires_minutes=15)

    return ForgotPasswordResponse(
        message="Password reset verification token generated successfully. Valid for 15 minutes.",
        reset_token=reset_token,
        expires_in_minutes=15
    )


@router.post(
    "/forgot-password/reset",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Reset password with verification token"
)
def reset_password_with_token(
    payload: ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    """
    Completes password reset:
    1. Validates the signature, expiration, and email match of the reset token.
    2. Updates the account's password using salted BCrypt hashing.
    """
    email_clean = payload.email.lower().strip()
    if not verify_password_reset_token(payload.reset_token, email_clean):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid, expired, or mismatched password reset token. Please request a new token."
        )

    cust = db.query(Customer).filter(Customer.email == email_clean).first()
    if cust:
        cust.password_hash = hash_password(payload.new_password)
        db.commit()
        return MessageResponse(
            message="Your customer account password has been reset successfully. Please sign in.",
            status="success"
        )

    adm = db.query(Admin).filter(Admin.email == email_clean).first()
    if adm:
        adm.password_hash = hash_password(payload.new_password)
        db.commit()
        return MessageResponse(
            message="Your administrator password has been reset successfully. Please sign in.",
            status="success"
        )

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Account could not be located."
    )
