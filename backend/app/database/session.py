import logging
from typing import Generator
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from app.config.settings import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

# Create SQLAlchemy engine with connection pooling and auto-reconnect
engine = create_engine(
    settings.get_database_url(),
    pool_pre_ping=True,      # Tests connection liveness before borrowing from pool
    pool_recycle=3600,       # Recycles connections every hour to avoid MySQL timeout drops
    pool_size=10,            # Normal pool size
    max_overflow=20,         # Maximum overflow connections under heavy load
    echo=(settings.ENVIRONMENT == "development_debug"), # Set to True to log raw SQL if needed
)

# Session factory for generating database sessions
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

# Base class for all 12 SQLAlchemy ORM models
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency that yields a database session per request
    and guarantees it is closed when the request lifecycle ends.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_db_connection() -> dict:
    """
    Diagnostic helper to test physical TCP connection and query execution
    against MySQL Server 8.0.
    """
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT VERSION() AS mysql_version, DATABASE() AS current_db;")).mappings().first()
            return {
                "status": "connected",
                "database": result["current_db"] if result else settings.DB_NAME,
                "version": result["mysql_version"] if result else "Unknown",
            }
    except Exception as e:
        logger.error(f"Database connection failure: {str(e)}")
        return {
            "status": "error",
            "message": str(e),
            "hint": "Check DB_HOST, DB_USER, DB_PASSWORD in backend/.env and verify MySQL 8.0 service is running."
        }
