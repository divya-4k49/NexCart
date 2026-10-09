import os
from functools import lru_cache
from typing import List
from urllib.parse import quote_plus
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # NexCart Branding
    APP_NAME: str = "NexCart API"
    PROJECT_NAME: str = "NexCart"
    PROJECT_TAGLINE: str = "Your Next Shopping Experience"
    ACADEMIC_TITLE: str = "NexCart - A Full-Stack E-Commerce Platform"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"

    # Database
    DB_HOST: str = "localhost"
    DB_PORT: int = 3306
    DB_NAME: str = "ecommerce_db"
    DB_USER: str = "root"
    DB_PASSWORD: str = "root"
    DATABASE_URL: str | None = None

    # Security
    SECRET_KEY: str = "college_ecommerce_super_secret_jwt_key_2026_xyz987654321"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # CORS
    FRONTEND_ORIGINS: str = "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173"

    # PhonePe Payment Gateway Readiness
    PHONEPE_MERCHANT_ID: str = "PGTESTPAYUAT"
    PHONEPE_SALT_KEY: str = "099eb0cd-02cf-4e2a-8aca-3e6c6aff0399"
    PHONEPE_SALT_INDEX: int = 1
    PHONEPE_ENV: str = "UAT"  # "UAT" or "PRODUCTION"
    PHONEPE_CALLBACK_URL: str = "http://localhost:8000/api/orders/payment/phonepe/callback"

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    def get_database_url(self) -> str:
        """Returns explicitly provided DATABASE_URL or constructs MySQL URL from components with URL-encoded credentials."""
        if self.DATABASE_URL:
            # If using mysql:// from some cloud providers, convert to mysql+pymysql://
            if self.DATABASE_URL.startswith("mysql://"):
                return self.DATABASE_URL.replace("mysql://", "mysql+pymysql://", 1)
            return self.DATABASE_URL
        
        encoded_user = quote_plus(str(self.DB_USER))
        encoded_password = quote_plus(str(self.DB_PASSWORD))
        return (
            f"mysql+pymysql://{encoded_user}:{encoded_password}@"
            f"{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}?charset=utf8mb4"
        )

    def get_cors_origins(self) -> List[str]:
        """Parses comma-separated frontend origins for CORS middleware."""
        return [origin.strip() for origin in self.FRONTEND_ORIGINS.split(",") if origin.strip()]

    def validate_production_security(self) -> None:
        """
        Enforces security guardrails when running in production mode.
        Prevents the application from starting in production with placeholder or weak secrets.
        """
        if self.ENVIRONMENT.lower() == "production":
            insecure_placeholders = [
                "college_ecommerce_super_secret_jwt_key_2026_xyz987654321",
                "secret",
                "changeme",
                "your_secret_key",
                "supersecret",
            ]
            if not self.SECRET_KEY or self.SECRET_KEY in insecure_placeholders or len(self.SECRET_KEY) < 32:
                raise ValueError(
                    "[SECURITY ERROR] In production, SECRET_KEY must be a cryptographically strong key "
                    "with at least 32 characters. Please configure the SECRET_KEY environment variable in your "
                    "hosting dashboard (e.g. Render). Generate one with: "
                    "python -c \"import secrets; print(secrets.token_hex(32))\""
                )


@lru_cache()
def get_settings() -> Settings:
    return Settings()
