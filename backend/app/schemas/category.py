from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class CategoryBase(BaseModel):
    category_name: str
    slug: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    is_active: bool = True


class CategoryResponse(CategoryBase):
    category_id: int
    product_count: int = 0
    created_at: datetime

    class Config:
        from_attributes = True
