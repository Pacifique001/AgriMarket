import enum
#from sqlalchemy import Column, Integer, Float, ForeignKey, DateTime, Enum, Boolean,String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
from sqlalchemy import (
    Column,
    Integer,
    String,
    ForeignKey,
    Enum,
    DateTime,
    Boolean,
    Float
)


class MatchStatus(str, enum.Enum):
    """
    Tracks the state of a connection between a Farmer and a Buyer.
    """
    PENDING = "pending"       # AI suggested the match, no action taken yet
    INTERESTED = "interested" # Buyer expressed interest
    ACCEPTED = "accepted"     # Farmer accepted the buyer's interest
    REJECTED = "rejected"     # One party declined the match
    COMPLETED = "completed"   # Transaction successful
    EXPIRED = "expired"       # Listing sold to someone else or removed

class Match(Base):
    """
    The Match model.
    Stores the results of the AI Matching Engine.
    """
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True, index=True)
    
    # Links
    listing_id = Column(Integer, ForeignKey("listings.id", ondelete="CASCADE"), nullable=False)
    buyer_id = Column(Integer, ForeignKey("buyers.id", ondelete="CASCADE"), nullable=False)
    
    # AI Scoring
    # A value between 0 and 1 (e.g., 0.95 means a 95% perfect match)
    match_score = Column(Float, nullable=False, default=0.0)
    
    # Why did the AI match them? (Stored for transparency)
    # e.g., "Nearby location", "Price within range", "Bulk quantity compatibility"
    match_reason = Column(String(255), nullable=True)

    # Status
    status = Column(
        Enum(MatchStatus), 
        default=MatchStatus.PENDING, 
        nullable=False
    )
    
    # Notification tracking
    is_notified_farmer = Column(Boolean, default=False)
    is_notified_buyer = Column(Boolean, default=False)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    listing = relationship("Listing", back_populates="matches")
    buyer = relationship("Buyer", back_populates="matches")

    def __repr__(self):
        return (
            f"<Match(id={self.id}, listing_id={self.listing_id}, "
            f"buyer_id={self.buyer_id}, score={self.match_score})>"
        )