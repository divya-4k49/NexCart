from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey, func, UniqueConstraint, CheckConstraint
from sqlalchemy.orm import relationship
from app.database.session import Base


class Review(Base):
    __tablename__ = "review"

    review_id = Column(Integer, primary_key=True, autoincrement=True)
    product_id = Column(Integer, ForeignKey("product.product_id", ondelete="CASCADE", onupdate="CASCADE"), nullable=False, index=True)
    customer_id = Column(Integer, ForeignKey("customer.customer_id", ondelete="CASCADE", onupdate="CASCADE"), nullable=False, index=True)
    rating = Column(Integer, nullable=False)
    comment = Column(Text, nullable=True)
    review_date = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        UniqueConstraint("customer_id", "product_id", name="uq_customer_product_review"),
        CheckConstraint("rating >= 1 AND rating <= 5", name="chk_review_rating"),
    )

    # Product -> Review = 1:M
    product = relationship("Product", back_populates="reviews")

    # Customer -> Review = 1:M
    customer = relationship("Customer", back_populates="reviews")

    def __repr__(self):
        return f"<Review(id={self.review_id}, product_id={self.product_id}, customer_id={self.customer_id}, rating={self.rating})>"
