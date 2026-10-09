from sqlalchemy import Column, Integer, Numeric, String, DateTime, ForeignKey, Enum, func, CheckConstraint
from sqlalchemy.orm import relationship
from app.database.session import Base


class Order(Base):
    __tablename__ = "orders"

    order_id = Column(Integer, primary_key=True, autoincrement=True)
    customer_id = Column(Integer, ForeignKey("customer.customer_id", ondelete="RESTRICT", onupdate="CASCADE"), nullable=False, index=True)
    address_id = Column(Integer, ForeignKey("address.address_id", ondelete="RESTRICT", onupdate="CASCADE"), nullable=False)
    order_date = Column(DateTime, server_default=func.now(), index=True)
    total_amount = Column(Numeric(10, 2), nullable=False)
    order_status = Column(
        Enum("Pending", "Confirmed", "Processing", "Shipped", "Out for Delivery", "Delivered", "Cancelled", name="order_status_enum"),
        nullable=False,
        default="Pending",
        index=True
    )
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        CheckConstraint("total_amount >= 0.00", name="chk_orders_total"),
    )

    # Customer -> Order = 1:M
    customer = relationship("Customer", back_populates="orders")

    # Address -> Order = 1:M
    address = relationship("Address", back_populates="orders")

    # Order -> Order Details = 1:M
    order_details = relationship("OrderDetail", back_populates="order", cascade="all, delete-orphan")

    # Order -> Payment = 1:1 (uselist=False enforces 1:1 object mapping)
    payment = relationship("Payment", back_populates="order", uselist=False, cascade="all, delete-orphan")

    # Order -> Shipping = 1:1 (uselist=False enforces 1:1 object mapping)
    shipping = relationship("Shipping", back_populates="order", uselist=False, cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Order(id={self.order_id}, customer_id={self.customer_id}, total={self.total_amount}, status='{self.order_status}')>"
