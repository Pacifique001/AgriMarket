from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Farmer(Base):
    """
    The Farmer profile model. 
    Extends the base User model with agricultural-specific data.
    """
    __tablename__ = "farmers"

    id = Column(Integer, primary_key=True, index=True)

    # Link to the core User account
    user_id = Column(Integer, ForeignKey("users.id"),
                     unique=True, nullable=False)

    # Location data (Crucial for AI Matching and Logistics)
    district = Column(String(100), nullable=False, index=True)  # e.g., Musanze
    sector = Column(String(100), nullable=True)               # e.g., Kinigi
    village = Column(String(100), nullable=True)

    # Coordinates (Used by utils/distance.py for precise buyer matching)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    # Farm Details
    farm_size_hectares = Column(Float, nullable=True)
    main_crops = Column(String(255), nullable=True)  # e.g., "Maize, Potatoes"

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    # back_populates matches the name used in models/user.py
    user = relationship("User", back_populates="farmer_profile")

    # One Farmer can have many Crop Listings
    listings = relationship(
        "Listing",
        back_populates="farmer",
        cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<Farmer(id={self.id}, district='{self.district}', user_id={self.user_id})>"
