import enum
from sqlalchemy import (
    Column, Integer, String, Float, ForeignKey,
    DateTime, Enum, Boolean
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class BuyerType(str, enum.Enum):
    INDIVIDUAL = "individual"
    WHOLESALER = "wholesaler"
    RETAILER = "retailer"
    HOTEL_RESTAURANT = "hotel_restaurant"
    EXPORTER = "exporter"
    PROCESSOR = "processor"


class Buyer(Base):
    __tablename__ = "buyers"

    id = Column(Integer, primary_key=True, index=True)

    # Auth link
    user_id = Column(Integer, ForeignKey("users.id"),
                     unique=True, nullable=False)

    # Business info
    company_name = Column(String(200), nullable=True)
    buyer_type = Column(
        Enum(BuyerType), default=BuyerType.INDIVIDUAL, nullable=False)

    # Trust & verification
    is_verified = Column(Boolean, default=False)

    # 🆕 Fraud & Trust (CORE ADDITIONS)
    fraud_score = Column(Float, default=0.0)     # 0.0 (safe) → 1.0 (high risk)
    trust_score = Column(Float, default=0.5)     # 0.0 → 1.0
    last_activity_at = Column(DateTime(timezone=True), nullable=True)

    successful_transactions = Column(Integer, default=0)
    failed_transactions = Column(Integer, default=0)
    average_response_time_min = Column(Float, nullable=True)
    risk_score = Column(Float, default=0.0)

    # Location preferences
    preferred_districts = Column(String(500), nullable=True)

    base_district = Column(String(100), nullable=False, index=True)
    base_latitude = Column(Float, nullable=True)
    base_longitude = Column(Float, nullable=True)

    # Capacity
    min_purchase_qty_kg = Column(Float, default=0.0)
    max_purchase_qty_kg = Column(Float, nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="buyer_profile")

    matches = relationship(
        "Match",
        back_populates="buyer",
        cascade="all, delete-orphan"
    )

    # Relationship to BuyerRequest
    requests = relationship(
        "BuyerRequest",
        back_populates="buyer",
        cascade="all, delete-orphan"
    )

    def __repr__(self):
        name = self.company_name if self.company_name else f"Buyer {self.id}"
        return f"<Buyer(id={self.id}, name='{name}', trust={self.trust_score})>"
