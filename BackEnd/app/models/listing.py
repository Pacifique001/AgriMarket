import enum
from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class ListingStatus(str, enum.Enum):
    """
    Defines the lifecycle of a crop listing.
    """
    AVAILABLE = "available"
    MATCHED = "matched"   # A buyer has expressed interest
    SOLD = "sold"
    EXPIRED = "expired"   # Harvest stayed on market too long
    CANCELLED = "cancelled"


class Listing(Base):
    __tablename__ = "listings"

    id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(Integer, ForeignKey("farmers.id"), nullable=False)

    # Crop Information
    crop_type = Column(String(100), nullable=False, index=True)
    crop_id = Column(Integer, nullable=True)  # ✅ ADD THIS
    quantity_kg = Column(Float, nullable=False)

    # Pricing Data
    asking_price = Column(Float, nullable=False)
    ai_suggested_price = Column(Float, nullable=True)
    ai_price_status = Column(String(50), nullable=True)  # ✅ ADD THIS
    ai_confidence = Column(Float, nullable=True)  # ✅ ADD THIS
    ai_price_direction = Column(String(50), nullable=True)  # ✅ ADD THIS
    ai_market_message = Column(String(500), nullable=True)  # ✅ ADD THIS

    # Image
    image_url = Column(String(255), nullable=True)

    # Location
    district = Column(String(100), nullable=False, index=True)
    sector = Column(String(100), nullable=True)
    region_id = Column(Integer, nullable=True)  # ✅ ADD THIS if using regions

    # Status and Lifecycle
    status = Column(Enum(ListingStatus),
                    default=ListingStatus.AVAILABLE, nullable=False)

    # Dates
    harvest_date = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    farmer = relationship("Farmer", back_populates="listings")
    matches = relationship(
        "Match", back_populates="listing", cascade="all, delete-orphan")

    def __repr__(self):
        return (
            f"<Listing(id={self.id}, crop='{self.crop_type}', "
            f"qty={self.quantity_kg}kg, status='{self.status}')>"
        )
