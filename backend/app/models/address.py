from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database.session import Base


class Address(Base):
    __tablename__ = "address"

    address_id = Column(Integer, primary_key=True, autoincrement=True)
    customer_id = Column(Integer, ForeignKey("customer.customer_id", ondelete="CASCADE", onupdate="CASCADE"), nullable=False, index=True)
    address_type = Column(String(20), nullable=False, default="Home")
    recipient_name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=False)
    street_address = Column(String(255), nullable=False)
    city = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    postal_code = Column(String(20), nullable=False)
    country = Column(String(50), nullable=False, default="India")
    is_default = Column(Boolean, nullable=False, default=False)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Customer -> Address = 1:M
    customer = relationship("Customer", back_populates="addresses")

    # Address -> Order = 1:M
    orders = relationship("Order", back_populates="address")

    def __repr__(self):
        return f"<Address(id={self.address_id}, recipient='{self.recipient_name}', city='{self.city}')>"
