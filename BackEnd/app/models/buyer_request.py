from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
from app.models.user import User
from app.models.buyer import Buyer


class BuyerRequest(Base):
    __tablename__ = "buyer_requests"

    id = Column(Integer, primary_key=True, index=True)
    buyer_id = Column(Integer, ForeignKey("buyers.id"), nullable=False)
    crop_type = Column(String, nullable=False)
    required_kg = Column(Float, nullable=False)
    preferred_district = Column(String, nullable=False)
    max_price_per_kg = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    buyer = relationship("Buyer", back_populates="requests")
