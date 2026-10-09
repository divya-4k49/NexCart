from sqlalchemy import Column, Integer, DateTime, ForeignKey, func, CheckConstraint
from sqlalchemy.orm import relationship
from app.database.session import Base


class Inventory(Base):
    __tablename__ = "inventory"

    inventory_id = Column(Integer, primary_key=True, autoincrement=True)
    product_id = Column(
        Integer, 
        ForeignKey("product.product_id", ondelete="CASCADE", onupdate="CASCADE"), 
        nullable=False, 
        unique=True  # UNIQUE enforces the 1:1 relationship in MySQL
    )
    quantity = Column(Integer, nullable=False, default=0)
    low_stock_threshold = Column(Integer, nullable=False, default=5)
    last_restocked_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        CheckConstraint("quantity >= 0", name="chk_inventory_qty"),
        CheckConstraint("low_stock_threshold >= 0", name="chk_inventory_threshold"),
    )

    # Product -> Inventory = 1:1
    product = relationship("Product", back_populates="inventory")

    def __repr__(self):
        return f"<Inventory(product_id={self.product_id}, qty={self.quantity}, threshold={self.low_stock_threshold})>"
