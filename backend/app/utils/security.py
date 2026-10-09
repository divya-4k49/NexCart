from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional
import bcrypt
from jose import JWTError, jwt
from app.config.settings import get_settings

settings = get_settings()


def hash_password(password: str) -> str:
    """
    Hashes a plain-text password using BCrypt with automatic salting.
    BCrypt limits inputs to 72 bytes.
    """
    pwd_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifies a plain-text password against a stored BCrypt hash.
    Returns True if matching, False otherwise.
    """
    try:
        pwd_bytes = plain_password.encode("utf-8")[:72]
        hash_bytes = hashed_password.encode("utf-8")
        return bcrypt.checkpw(pwd_bytes, hash_bytes)
    except Exception:
        return False


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Generates a cryptographically signed JSON Web Token (JWT).
    Encodes subject identifier, role/type, and expiration timestamp.
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decodes and validates a JWT token signature and expiration.
    Returns payload dictionary or None if invalid/expired.
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None


def create_password_reset_token(email: str, expires_minutes: int = 15) -> str:
    """
    Generates a cryptographically signed token specifically for password reset.
    Expires in 15 minutes by default.
    """
    data = {"sub": email.lower().strip(), "purpose": "password_reset"}
    return create_access_token(data, expires_delta=timedelta(minutes=expires_minutes))


def verify_password_reset_token(token: str, email: str) -> bool:
    """
    Validates a password reset token against the specified email and purpose.
    """
    payload = decode_access_token(token)
    if not payload:
        return False
    if payload.get("purpose") != "password_reset":
        return False
    if payload.get("sub") != email.lower().strip():
        return False
    return True
