from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class ReviewCreateRequest(BaseModel):
    product_id: int = Field(..., example=1, description="ID of the purchased product to review")
    rating: int = Field(..., ge=1, le=5, example=5, description="Star rating from 1 (lowest) to 5 (highest)")
    comment: Optional[str] = Field(None, max_length=1000, example="Outstanding build quality and battery life!")


class ReviewUpdateRequest(BaseModel):
    rating: Optional[int] = Field(None, ge=1, le=5, example=4)
    comment: Optional[str] = Field(None, max_length=1000, example="Updated review: Still great after 1 month.")


class ReviewResponse(BaseModel):
    review_id: int
    product_id: int
    product_name: str
    customer_id: int
    customer_name: str
    rating: int
    comment: Optional[str] = None
    review_date: datetime
    is_verified_purchase: bool = True

    class Config:
        from_attributes = True


class RatingBreakdown(BaseModel):
    star_5: int = 0
    star_4: int = 0
    star_3: int = 0
    star_2: int = 0
    star_1: int = 0


class ProductReviewsSummaryResponse(BaseModel):
    product_id: int
    product_name: str
    average_rating: float
    total_reviews: int
    breakdown: RatingBreakdown
    reviews: List[ReviewResponse]

    class Config:
        from_attributes = True
