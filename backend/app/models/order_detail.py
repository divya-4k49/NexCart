from sqlalchemy import Column, Integer, Numeric, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship
from app.database.session import Base


class OrderDetail(Base):
    __tablename__ = "order_details"

    order_detail_id = Column(Integer, primary_key=True, autoincrement=True)
    order_id = Column(Integer, ForeignKey("orders.order_id", ondelete="CASCADE", onupdate="CASCADE"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("product.product_id", ondelete="RESTRICT", onupdate="CASCADE"), nullable=False, index=True)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=False)
    subtotal = Column(Numeric(10, 2), nullable=False)

    __table_args__ = (
        CheckConstraint("quantity > 0", name="chk_orderdetail_qty"),
        CheckConstraint("unit_price >= 0.00", name="chk_orderdetail_price"),
        CheckConstraint("subtotal >= 0.00", name="chk_orderdetail_subtotal"),
    )

    # Order -> Order Details = 1:M
    order = relationship("Order", back_populates="order_details")

    # Product -> Order Details = 1:M
    product = relationship("Product", back_populates="order_details")

    def __repr__(self):
        return f"<OrderDetail(id={self.order_detail_id}, order_id={self.order_id}, product_id={self.product_id}, qty={self.quantity}, subtotal={self.subtotal})>"
