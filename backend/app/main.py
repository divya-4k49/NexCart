from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config.settings import get_settings
from app.routes.health import router as health_router
from app.routes.auth import router as auth_router
from app.routes.categories import router as categories_router
from app.routes.products import router as products_router
from app.routes.cart import router as cart_router
from app.routes.addresses import router as addresses_router
from app.routes.orders import router as orders_router
from app.routes.reviews import router as reviews_router
from app.routes.admin import router as admin_router

settings = get_settings()
settings.validate_production_security()

app = FastAPI(
    title=f"{settings.PROJECT_NAME} API",
    version=settings.APP_VERSION,
    description=(
        f"{settings.ACADEMIC_TITLE}. "
        f"Tagline: \"{settings.PROJECT_TAGLINE}\". "
        "Production-ready REST API built with FastAPI, SQLAlchemy 2.0, and MySQL 8.0."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure Cross-Origin Resource Sharing (CORS) for Vercel and local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import os
from fastapi.staticfiles import StaticFiles

# Register route modules
app.include_router(health_router)
app.include_router(auth_router)
app.include_router(categories_router)
app.include_router(products_router)
app.include_router(cart_router)
app.include_router(addresses_router)
app.include_router(orders_router)
app.include_router(reviews_router)
app.include_router(admin_router)

# Mount Frontend Single Page Application (SPA)
frontend_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "frontend")
if os.path.exists(frontend_dir):
    app.mount("/app", StaticFiles(directory=frontend_dir, html=True), name="frontend")


@app.get("/", tags=["Root"])
def root_endpoint():
    """
    Root entry point providing quick links to documentation, status, and storefront UI.
    """
    return {
        "project": settings.PROJECT_NAME,
        "tagline": settings.PROJECT_TAGLINE,
        "academic_title": settings.ACADEMIC_TITLE,
        "message": f"Welcome to {settings.PROJECT_NAME} - {settings.PROJECT_TAGLINE}",
        "storefront_ui": "/app",
        "documentation": "/docs",
        "health_check": "/api/health",
        "database_status": "/api/health/db-tables"
    }
