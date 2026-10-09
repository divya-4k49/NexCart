from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.category import Category
from app.models.product import Product
from app.schemas.category import CategoryResponse

router = APIRouter(prefix="/api/categories", tags=["Categories"])


@router.get("", response_model=List[CategoryResponse], summary="List all active product categories")
def get_all_categories(db: Session = Depends(get_db)):
    """
    Returns all active product categories with live product counts
    calculated from the MySQL `product` table.
    """
    # Group by category to compute live product counts
    categories_with_count = (
        db.query(
            Category,
            func.count(Product.product_id).label("product_count")
        )
        .outerjoin(Product, (Product.category_id == Category.category_id) & (Product.is_active == True))
        .filter(Category.is_active == True)
        .group_by(Category.category_id)
        .order_by(Category.category_id.asc())
        .all()
    )

    results = []
    for cat, p_count in categories_with_count:
        item = CategoryResponse(
            category_id=cat.category_id,
            category_name=cat.category_name,
            slug=cat.slug,
            description=cat.description,
            image_url=cat.image_url,
            is_active=cat.is_active,
            created_at=cat.created_at,
            product_count=p_count
        )
        results.append(item)

    return results


@router.get("/{id_or_slug}", response_model=CategoryResponse, summary="Get single category by ID or slug")
def get_category_by_id_or_slug(id_or_slug: str, db: Session = Depends(get_db)):
    """
    Retrieves category details by numeric ID or URL-friendly slug.
    """
    query = db.query(
        Category,
        func.count(Product.product_id).label("product_count")
    ).outerjoin(Product, (Product.category_id == Category.category_id) & (Product.is_active == True))

    if id_or_slug.isdigit():
        result = query.filter(Category.category_id == int(id_or_slug)).group_by(Category.category_id).first()
    else:
        result = query.filter(Category.slug == id_or_slug).group_by(Category.category_id).first()

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Category '{id_or_slug}' not found"
        )

    cat, p_count = result
    return CategoryResponse(
        category_id=cat.category_id,
        category_name=cat.category_name,
        slug=cat.slug,
        description=cat.description,
        image_url=cat.image_url,
        is_active=cat.is_active,
        created_at=cat.created_at,
        product_count=p_count
    )
