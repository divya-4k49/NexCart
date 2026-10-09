from datetime import datetime, timezone
from fastapi import APIRouter, Depends, status
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.config.settings import get_settings
from app.database.session import get_db, check_db_connection

router = APIRouter(prefix="/api/health", tags=["Health & Diagnostics"])
settings = get_settings()


@router.get("", status_code=status.HTTP_200_OK)
def get_system_health():
    """
    Returns API server status, environment, and physical MySQL connection check.
    """
    db_status = check_db_connection()
    is_healthy = db_status.get("status") == "connected"
    
    return {
        "status": "healthy" if is_healthy else "degraded",
        "app_name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "server_time_utc": datetime.now(timezone.utc).isoformat(),
        "database": db_status
    }


@router.get("/db-tables", status_code=status.HTTP_200_OK)
def get_database_tables_summary(db: Session = Depends(get_db)):
    """
    Verifies that all 12 college DBMS entities exist in MySQL and returns their live row counts.
    """
    tables = [
        "admin", "customer", "category", "product", "inventory", 
        "address", "cart", "orders", "order_details", "payment", 
        "shipping", "review"
    ]
    
    summary = []
    total_records = 0
    
    for tbl in tables:
        try:
            result = db.execute(text(f"SELECT COUNT(*) AS cnt FROM {tbl}")).scalar()
            cnt = int(result or 0)
            summary.append({"table": tbl, "rows": cnt, "status": "available"})
            total_records += cnt
        except Exception as e:
            summary.append({"table": tbl, "rows": 0, "status": f"error: {str(e)}"})
            
    return {
        "database": settings.DB_NAME,
        "total_entities_checked": len(tables),
        "total_rows_across_all_tables": total_records,
        "tables": summary
    }
