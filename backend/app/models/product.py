from sqlalchemy import Column, Integer, String, Text, Numeric, Boolean, DateTime, ForeignKey, func, CheckConstraint
from sqlalchemy.orm import relationship
from app.database.session import Base


class Product(Base):
    __tablename__ = "product"

    product_id = Column(Integer, primary_key=True, autoincrement=True)
    category_id = Column(Integer, ForeignKey("category.category_id", ondelete="RESTRICT", onupdate="CASCADE"), nullable=False, index=True)
    product_name = Column(String(200), nullable=False)
    slug = Column(String(200), nullable=False, unique=True, index=True)
    description = Column(Text, nullable=True)
    price = Column(Numeric(10, 2), nullable=False, index=True)
    image_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True, index=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        CheckConstraint("price >= 0.00", name="chk_product_price"),
    )

    # Category -> Product = 1:M
    category = relationship("Category", back_populates="products")

    # Product -> Inventory = 1:1 (uselist=False tells SQLAlchemy this is a single object, not a list!)
    inventory = relationship("Inventory", back_populates="product", uselist=False, cascade="all, delete-orphan")

    # Product -> Order Details = 1:M
    order_details = relationship("OrderDetail", back_populates="product")

    # Product -> Cart = 1:M
    cart_items = relationship("Cart", back_populates="product", cascade="all, delete-orphan")

    # Product -> Review = 1:M
    reviews = relationship("Review", back_populates="product", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Product(id={self.product_id}, name='{self.product_name}', price={self.price})>"
