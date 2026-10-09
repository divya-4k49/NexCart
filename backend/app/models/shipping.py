from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Enum, func
from sqlalchemy.orm import relationship
from app.database.session import Base


class Shipping(Base):
    __tablename__ = "shipping"

    shipping_id = Column(Integer, primary_key=True, autoincrement=True)
    order_id = Column(
        Integer, 
        ForeignKey("orders.order_id", ondelete="CASCADE", onupdate="CASCADE"), 
        nullable=False, 
        unique=True  # UNIQUE enforces the 1:1 relationship with Order
    )
    shipping_status = Column(
        Enum("Pending", "Processing", "Shipped", "Out for Delivery", "Delivered", "Returned", name="shipping_status_enum"),
        nullable=False,
        default="Pending"
    )
    tracking_number = Column(String(100), nullable=False, unique=True)
    carrier = Column(String(50), nullable=False, default="SpeedShip Logistics")
    estimated_delivery = Column(Date, nullable=True)
    shipped_at = Column(DateTime, nullable=True)
    delivered_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Order -> Shipping = 1:1
    order = relationship("Order", back_populates="shipping")

    def __repr__(self):
        return f"<Shipping(id={self.shipping_id}, order_id={self.order_id}, carrier='{self.carrier}', status='{self.shipping_status}')>"
