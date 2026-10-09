from sqlalchemy import Column, Integer, DateTime, ForeignKey, func, UniqueConstraint, CheckConstraint
from sqlalchemy.orm import relationship
from app.database.session import Base


class Cart(Base):
    __tablename__ = "cart"

    cart_id = Column(Integer, primary_key=True, autoincrement=True)
    customer_id = Column(Integer, ForeignKey("customer.customer_id", ondelete="CASCADE", onupdate="CASCADE"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("product.product_id", ondelete="CASCADE", onupdate="CASCADE"), nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    added_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        UniqueConstraint("customer_id", "product_id", name="uq_customer_product"),
        CheckConstraint("quantity > 0", name="chk_cart_quantity"),
    )

    # Customer -> Cart = 1:M
    customer = relationship("Customer", back_populates="cart_items")

    # Product -> Cart = 1:M
    product = relationship("Product", back_populates="cart_items")

    def __repr__(self):
        return f"<Cart(id={self.cart_id}, customer_id={self.customer_id}, product_id={self.product_id}, qty={self.quantity})>"
