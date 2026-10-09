from app.routes.health import router as health_router
from app.routes.auth import router as auth_router
from app.routes.categories import router as categories_router
from app.routes.products import router as products_router
from app.routes.cart import router as cart_router
from app.routes.addresses import router as addresses_router
from app.routes.orders import router as orders_router
from app.routes.reviews import router as reviews_router
from app.routes.admin import router as admin_router

__all__ = [
    "health_router",
    "auth_router",
    "categories_router",
    "products_router",
    "cart_router",
    "addresses_router",
    "orders_router",
    "reviews_router",
    "admin_router",
]
