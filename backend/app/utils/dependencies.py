from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.customer import Customer
from app.models.admin import Admin
from app.utils.security import decode_access_token

# Define standard OAuth2 Bearer token extractor
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/customer/login", auto_error=False)


def get_current_customer(
    token: str = Depends(oauth2_scheme), 
    db: Session = Depends(get_db)
) -> Customer:
    """
    Dependency that extracts JWT Bearer token, validates customer identity,
    and returns the authenticated Customer model instance from MySQL.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials or token expired",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    if not token:
        raise credentials_exception
        
    payload = decode_access_token(token)
    if not payload:
        raise credentials_exception
        
    user_type = payload.get("user_type")
    user_id = payload.get("sub")
    
    if user_type != "customer" or not user_id:
        raise credentials_exception
        
    customer = db.query(Customer).filter(Customer.customer_id == int(user_id)).first()
    if not customer:
        raise credentials_exception
        
    if not customer.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your customer account has been deactivated."
        )
        
    return customer


def get_current_admin(
    token: str = Depends(oauth2_scheme), 
    db: Session = Depends(get_db)
) -> Admin:
    """
    Dependency that extracts JWT Bearer token, validates Admin identity,
    and returns the authenticated Admin model instance from MySQL.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Admin access required: invalid or expired credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    if not token:
        raise credentials_exception
        
    payload = decode_access_token(token)
    if not payload:
        raise credentials_exception
        
    user_type = payload.get("user_type")
    user_id = payload.get("sub")
    
    if user_type != "admin" or not user_id:
        raise credentials_exception
        
    admin = db.query(Admin).filter(Admin.admin_id == int(user_id)).first()
    if not admin:
        raise credentials_exception
        
    if not admin.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin account is disabled."
        )
        
    return admin
