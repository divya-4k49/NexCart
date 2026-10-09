from sqlalchemy import Column, Integer, Numeric, String, DateTime, ForeignKey, Enum, func, CheckConstraint
from sqlalchemy.orm import relationship
from app.database.session import Base


class Payment(Base):
    __tablename__ = "payment"

    payment_id = Column(Integer, primary_key=True, autoincrement=True)
    order_id = Column(
        Integer, 
        ForeignKey("orders.order_id", ondelete="CASCADE", onupdate="CASCADE"), 
        nullable=False, 
        unique=True  # UNIQUE enforces the 1:1 relationship with Order
    )
    payment_method = Column(
        Enum("Cash on Delivery", "Card Demo", "UPI Demo", name="payment_method_enum"),
        nullable=False
    )
    payment_status = Column(
        Enum("Pending", "Completed", "Failed", "Refunded", name="payment_status_enum"),
        nullable=False,
        default="Pending"
    )
    transaction_reference = Column(String(100), nullable=True, unique=True)
    amount = Column(Numeric(10, 2), nullable=False)
    payment_date = Column(DateTime, server_default=func.now())

    __table_args__ = (
        CheckConstraint("amount >= 0.00", name="chk_payment_amount"),
    )

    # Order -> Payment = 1:1
    order = relationship("Order", back_populates="payment")

    def __repr__(self):
        return f"<Payment(id={self.payment_id}, order_id={self.order_id}, method='{self.payment_method}', status='{self.payment_status}', amount={self.amount})>"
