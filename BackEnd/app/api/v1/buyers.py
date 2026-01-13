from typing import Any, List, Optional, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User, UserRole
from app.models.buyer import Buyer, BuyerType
from app.models.listing import Listing, ListingStatus
from app.models.transaction import Transaction, TransactionStatus

# 🔥 AI ENGINE
from app.ai.predict import market_predictor

from pydantic import BaseModel, Field

router = APIRouter( tags=["Buyer"])

# ------------------------------------------------------------------
# ROLE CHECK
# ------------------------------------------------------------------
def check_buyer_role(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.BUYER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Buyer role required"
        )
    return current_user

# ------------------------------------------------------------------
# SCHEMAS
# ------------------------------------------------------------------
class BuyerProfileUpdate(BaseModel):
    company_name: Optional[str] = None
    buyer_type: Optional[BuyerType] = None
    base_district: Optional[str] = None
    preferred_districts: Optional[str] = Field(
        None, description="Comma-separated list of districts"
    )
    min_purchase_qty_kg: Optional[float] = None
    max_purchase_qty_kg: Optional[float] = None
    base_latitude: Optional[float] = None
    base_longitude: Optional[float] = None

# ------------------------------------------------------------------
# PROFILE
# ------------------------------------------------------------------
@router.get("/me", response_model=Any)
def get_buyer_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(check_buyer_role)
):
    buyer = db.query(Buyer).filter(
        Buyer.user_id == current_user.id
    ).first()

    if not buyer:
        raise HTTPException(status_code=404, detail="Buyer profile not found")

    return {
        "id": buyer.id,
        "full_name": current_user.full_name,
        "phone": current_user.phone,
        "company_name": buyer.company_name,
        "buyer_type": buyer.buyer_type,
        "is_verified": buyer.is_verified,
        "base_district": buyer.base_district,
        "preferred_districts": buyer.preferred_districts,
        "min_qty": buyer.min_purchase_qty_kg,
        "max_qty": buyer.max_purchase_qty_kg,
        "joined_at": buyer.created_at
    }

@router.patch("/me", response_model=Any)
def update_buyer_profile(
    profile_in: BuyerProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_buyer_role)
):
    buyer = db.query(Buyer).filter(
        Buyer.user_id == current_user.id
    ).first()

    update_data = profile_in.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(buyer, key, value)

    db.commit()
    db.refresh(buyer)
    return buyer

# ------------------------------------------------------------------
# BUYER ANALYTICS
# ------------------------------------------------------------------
@router.get("/stats", response_model=Dict[str, Any])
def get_buyer_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(check_buyer_role)
):
    buyer = db.query(Buyer).filter(
        Buyer.user_id == current_user.id
    ).first()

    total_orders = db.query(Transaction).filter(
        Transaction.buyer_id == buyer.id,
        Transaction.status == TransactionStatus.COMPLETED
    ).count()

    total_kg = db.query(func.sum(Transaction.quantity_kg)).filter(
        Transaction.buyer_id == buyer.id,
        Transaction.status == TransactionStatus.COMPLETED
    ).scalar() or 0.0

    total_spent = db.query(func.sum(Transaction.total_amount)).filter(
        Transaction.buyer_id == buyer.id,
        Transaction.status == TransactionStatus.COMPLETED
    ).scalar() or 0.0

    supplier_count = db.query(
        func.count(func.distinct(Transaction.farmer_id))
    ).filter(
        Transaction.buyer_id == buyer.id
    ).scalar() or 0

    return {
        "total_orders": total_orders,
        "total_procured_kg": total_kg,
        "total_spent_rwf": total_spent,
        "unique_suppliers": supplier_count
    }

# ------------------------------------------------------------------
# MARKET AVAILABILITY SNAPSHOT
# ------------------------------------------------------------------
@router.get("/market-glance")
def get_market_availability(
    db: Session = Depends(get_db),
    current_user: User = Depends(check_buyer_role)
):
    buyer = db.query(Buyer).filter(
        Buyer.user_id == current_user.id
    ).first()

    districts = (
        [d.strip() for d in buyer.preferred_districts.split(",")]
        if buyer.preferred_districts
        else [buyer.base_district]
    )

    available_stock = db.query(
        Listing.crop_type,
        func.sum(Listing.quantity_kg).label("total_kg"),
        func.count(Listing.id).label("offer_count")
    ).filter(
        Listing.district.in_(districts),
        Listing.status == ListingStatus.AVAILABLE
    ).group_by(Listing.crop_type).all()

    return [
        {
            "crop": item.crop_type,
            "total_available_kg": item.total_kg,
            "number_of_farmers": item.offer_count
        } for item in available_stock
    ]

# ------------------------------------------------------------------
# 🔥 AI PRICE & PROCUREMENT INTELLIGENCE
# ------------------------------------------------------------------
@router.get("/ai-price-insight")
def buyer_ai_price_insight(
    crop_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_buyer_role)
):
    """
    Helps buyers decide:
    - Buy now or wait
    - Expected price movement
    - Negotiation power
    """
    buyer = db.query(Buyer).filter(
        Buyer.user_id == current_user.id
    ).first()

    pred = market_predictor.predict(
        crop_id=crop_id,
        region_id=buyer.base_district
    )

    negotiation = "NEUTRAL"
    if pred["price_direction"] == "DOWN":
        negotiation = "STRONG (wait for lower price)"
    elif pred["price_direction"] == "UP":
        negotiation = "WEAK (buy early)"

    return {
        "crop_id": crop_id,
        "district": buyer.base_district,
        "expected_price_rwf_per_kg": pred["estimated_price"],
        "price_trend": pred["price_direction"],
        "predicted_demand_kg": pred["predicted_demand_kg"],
        "buyer_power": negotiation,
        "confidence": pred["confidence"]
    }

# ------------------------------------------------------------------
# 🔥 AI BULK PURCHASE RISK ANALYSIS
# ------------------------------------------------------------------
@router.get("/ai-bulk-risk")
def bulk_purchase_risk(
    crop_id: int,
    requested_qty_kg: float,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_buyer_role)
):
    """
    Evaluates whether the market can absorb a large purchase
    without triggering price spikes.
    """
    buyer = db.query(Buyer).filter(
        Buyer.user_id == current_user.id
    ).first()

    pred = market_predictor.predict(crop_id, buyer.base_district)

    risk = "LOW"
    if requested_qty_kg > pred["predicted_demand_kg"]:
        risk = "HIGH"

    return {
        "crop_id": crop_id,
        "district": buyer.base_district,
        "requested_qty_kg": requested_qty_kg,
        "market_demand_kg": pred["predicted_demand_kg"],
        "price_surge_risk": risk,
        "expected_price_rwf_per_kg": pred["estimated_price"],
        "confidence": pred["confidence"]
    }
