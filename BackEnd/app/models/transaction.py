import enum
from sqlalchemy import Column, Integer, Float, ForeignKey, DateTime, Enum, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class TransactionStatus(str, enum.Enum):
    """
    Defines the current state of the physical trade.
    """
    PENDING = "pending"           # Record created, awaiting fulfillment
    IN_TRANSIT = "in_transit"     # Goods are moving from farmer to buyer
    COMPLETED = "completed"       # Goods received and transaction closed
    CANCELLED = "cancelled"       # Transaction aborted after agreement
    DISPUTED = "disputed"         # Problem with quality or quantity

class PaymentStatus(str, enum.Enum):
    """
    Tracks the financial state of the transaction.
    """
    UNPAID = "unpaid"
    PARTIAL = "partial"
    PAID = "paid"
    REFUNDED = "refunded"

class Transaction(Base):
    """
    The Transaction model.
    The final record of a successful sale between a Farmer and a Buyer.
    """
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    
    # Links to the "Handshake" that started this
    match_id = Column(Integer, ForeignKey("matches.id"), nullable=False)
    
    # Direct links for fast querying and history 
    # (even if a listing is deleted later, the transaction record persists)
    listing_id = Column(Integer, ForeignKey("listings.id"), nullable=False)
    farmer_id = Column(Integer, ForeignKey("farmers.id"), nullable=False)
    buyer_id = Column(Integer, ForeignKey("buyers.id"), nullable=False)

    # Final Agreement Data (May differ from original listing)
    quantity_kg = Column(Float, nullable=False)
    price_per_kg = Column(Float, nullable=False)
    total_amount = Column(Float, nullable=False) # quantity * price
    
    # Status Management
    status = Column(
        Enum(TransactionStatus), 
        default=TransactionStatus.PENDING, 
        nullable=False
    )
    payment_status = Column(
        Enum(PaymentStatus), 
        default=PaymentStatus.UNPAID, 
        nullable=False
    )
    
    # Logistics Tracking
    delivery_note = Column(String(500), nullable=True)
    receipt_number = Column(String(100), unique=True, nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    match = relationship("Match")
    listing = relationship("Listing")
    farmer = relationship("Farmer")
    buyer = relationship("Buyer")

    def __repr__(self):
        return (
            f"<Transaction(id={self.id}, amount={self.total_amount}, "
            f"status='{self.status}', payment='{self.payment_status}')>"
        )