from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func

from app.database.session import get_db
from app.models.customer import Customer
from app.models.product import Product
from app.models.order import Order
from app.models.order_detail import OrderDetail
from app.models.review import Review
from app.schemas.auth import MessageResponse
from app.schemas.review import (
    ReviewCreateRequest,
    ReviewUpdateRequest,
    ReviewResponse,
    RatingBreakdown,
    ProductReviewsSummaryResponse,
)
from app.utils.dependencies import get_current_customer

router = APIRouter(prefix="/api/reviews", tags=["Product Reviews & Ratings"])


@router.post("", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED, summary="Submit or update a verified product review")
def submit_review(
    payload: ReviewCreateRequest,
    current_customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """
    Submits a customer rating and review for a product:
    - Enforces VERIFIED PURCHASE: Customer must have purchased the product in an active order.
    - Idempotent: If the customer already reviewed this product, updates the existing review.
    """
    # 1. Validate Product exists
    product = db.query(Product).filter(
        Product.product_id == payload.product_id,
        Product.is_active == True
    ).first()

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product #{payload.product_id} was not found."
        )

    # 2. Enforce Verified Purchase check
    verified_purchase = (
        db.query(OrderDetail)
        .join(Order, Order.order_id == OrderDetail.order_id)
        .filter(
            Order.customer_id == current_customer.customer_id,
            OrderDetail.product_id == payload.product_id,
            Order.order_status.in_(["Confirmed", "Processing", "Shipped", "Out for Delivery", "Delivered"])
        )
        .first()
    )

    if not verified_purchase:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Verified Purchase Required: You can only review products that you have ordered and purchased on NexCart."
        )

    # 3. Check for existing review (enforcing UNIQUE customer_id, product_id)
    existing_review = db.query(Review).filter(
        Review.customer_id == current_customer.customer_id,
        Review.product_id == payload.product_id
    ).first()

    clean_comment = payload.comment.strip() if payload.comment else None

    if existing_review:
        existing_review.rating = payload.rating
        existing_review.comment = clean_comment
        db.commit()
        db.refresh(existing_review)
        review_obj = existing_review
    else:
        review_obj = Review(
            customer_id=current_customer.customer_id,
            product_id=payload.product_id,
            rating=payload.rating,
            comment=clean_comment
        )
        db.add(review_obj)
        db.commit()
        db.refresh(review_obj)

    return ReviewResponse(
        review_id=review_obj.review_id,
        product_id=product.product_id,
        product_name=product.product_name,
        customer_id=current_customer.customer_id,
        customer_name=current_customer.full_name,
        rating=review_obj.rating,
        comment=review_obj.comment,
        review_date=review_obj.review_date,
        is_verified_purchase=True
    )


@router.get("/product/{product_id}", response_model=ProductReviewsSummaryResponse, summary="Get reviews and rating breakdown for a product")
def get_product_reviews(
    product_id: int,
    db: Session = Depends(get_db)
):
    """
    Public endpoint providing:
    - Overall average star rating
    - Total reviews count
    - 5-star to 1-star distribution breakdown
    - Customer comments and review dates
    """
    product = db.query(Product).filter(
        Product.product_id == product_id,
        Product.is_active == True
    ).first()

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product #{product_id} not found."
        )

    reviews = (
        db.query(Review)
        .options(joinedload(Review.customer))
        .filter(Review.product_id == product_id)
        .order_by(Review.review_date.desc())
        .all()
    )

    total_count = len(reviews)
    avg_rating = round(sum(r.rating for r in reviews) / total_count, 1) if total_count > 0 else 0.0

    breakdown = RatingBreakdown(
        star_5=sum(1 for r in reviews if r.rating == 5),
        star_4=sum(1 for r in reviews if r.rating == 4),
        star_3=sum(1 for r in reviews if r.rating == 3),
        star_2=sum(1 for r in reviews if r.rating == 2),
        star_1=sum(1 for r in reviews if r.rating == 1),
    )

    review_list = [
        ReviewResponse(
            review_id=r.review_id,
            product_id=product.product_id,
            product_name=product.product_name,
            customer_id=r.customer.customer_id,
            customer_name=r.customer.full_name,
            rating=r.rating,
            comment=r.comment,
            review_date=r.review_date,
            is_verified_purchase=True
        )
        for r in reviews
    ]

    return ProductReviewsSummaryResponse(
        product_id=product.product_id,
        product_name=product.product_name,
        average_rating=avg_rating,
        total_reviews=total_count,
        breakdown=breakdown,
        reviews=review_list
    )


@router.get("/my-reviews", response_model=List[ReviewResponse], summary="List all reviews submitted by logged-in customer")
def get_my_reviews(
    current_customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """
    Returns all product reviews authored by the authenticated customer.
    """
    reviews = (
        db.query(Review)
        .options(joinedload(Review.product))
        .filter(Review.customer_id == current_customer.customer_id)
        .order_by(Review.review_date.desc())
        .all()
    )

    return [
        ReviewResponse(
            review_id=r.review_id,
            product_id=r.product_id,
            product_name=r.product.product_name if r.product else "Discontinued Product",
            customer_id=current_customer.customer_id,
            customer_name=current_customer.full_name,
            rating=r.rating,
            comment=r.comment,
            review_date=r.review_date,
            is_verified_purchase=True
        )
        for r in reviews
    ]


@router.delete("/{review_id}", response_model=MessageResponse, summary="Delete customer's own review")
def delete_review(
    review_id: int,
    current_customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """
    Removes a review authored by the customer.
    """
    review = db.query(Review).filter(
        Review.review_id == review_id,
        Review.customer_id == current_customer.customer_id
    ).first()

    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Review #{review_id} not found."
        )

    db.delete(review)
    db.commit()

    return MessageResponse(
        message=f"Review #{review_id} has been deleted successfully.",
        status="success"
    )
