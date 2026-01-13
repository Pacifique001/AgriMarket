from typing import Any, List, Dict
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.core.security import check_farmer_role
from app.models.user import User
from app.models.farmer import Farmer
from app.models.listing import Listing, ListingStatus
from app.models.transaction import Transaction, TransactionStatus
from app.models.buyer import Buyer

# 🔥 AI ENGINE
from app.ai.predict import market_predictor

from pydantic import BaseModel

# ------------------------------------------------------------------
# SCHEMAS
# ------------------------------------------------------------------
class FarmerProfileUpdate(BaseModel):
    district: str
    sector: str | None = None
    village: str | None = None
    farm_size_hectares: float | None = None
    main_crops: str | None = None
    latitude: float | None = None
    longitude: float | None = None

router = APIRouter( tags=["Farmer"])

# ------------------------------------------------------------------
# PROFILE
# ------------------------------------------------------------------
@router.get("/me", response_model=Any)
def get_farmer_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(check_farmer_role)
):
    farmer = db.query(Farmer).filter(
        Farmer.user_id == current_user.id
    ).first()

    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer profile not found")

    return {
        "id": farmer.id,
        "full_name": current_user.full_name,
        "phone": current_user.phone,
        "district": farmer.district,
        "sector": farmer.sector,
        "village": farmer.village,
        "farm_size_hectares": farmer.farm_size_hectares,
        "main_crops": farmer.main_crops,
        "latitude": farmer.latitude,
        "longitude": farmer.longitude,
        "joined_at": farmer.created_at
    }

@router.patch("/me", response_model=Any)
def update_farmer_profile(
    profile_in: FarmerProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_farmer_role)
):
    farmer = db.query(Farmer).filter(
        Farmer.user_id == current_user.id
    ).first()

    update_data = profile_in.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(farmer, key, value)

    db.commit()
    db.refresh(farmer)
    return farmer

# ------------------------------------------------------------------
# FARMER PERFORMANCE STATS
# ------------------------------------------------------------------
@router.get("/stats", response_model=Dict[str, Any])
def get_farmer_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(check_farmer_role)
):
    farmer = db.query(Farmer).filter(
        Farmer.user_id == current_user.id
    ).first()

    active_listings = db.query(Listing).filter(
        Listing.farmer_id == farmer.id,
        Listing.status == ListingStatus.AVAILABLE
    ).count()

    total_volume_sold = db.query(
        func.sum(Transaction.quantity_kg)
    ).filter(
        Transaction.farmer_id == farmer.id,
        Transaction.status == TransactionStatus.COMPLETED
    ).scalar() or 0.0

    total_revenue = db.query(
        func.sum(Transaction.total_amount)
    ).filter(
        Transaction.farmer_id == farmer.id,
        Transaction.status == TransactionStatus.COMPLETED
    ).scalar() or 0.0

    unique_buyers = db.query(
        func.count(func.distinct(Transaction.buyer_id))
    ).filter(
        Transaction.farmer_id == farmer.id
    ).scalar() or 0

    return {
        "active_listings": active_listings,
        "total_volume_sold_kg": total_volume_sold,
        "total_revenue_rwf": total_revenue,
        "unique_buyers": unique_buyers
    }

# ------------------------------------------------------------------
# NEARBY BUYER SIGNAL (MOTIVATION)
# ------------------------------------------------------------------
@router.get("/nearby-buyers-count")
def get_nearby_buyers_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(check_farmer_role)
):
    farmer = db.query(Farmer).filter(
        Farmer.user_id == current_user.id
    ).first()

    count = db.query(Buyer).filter(
        Buyer.base_district == farmer.district
    ).count()

    return {
        "district": farmer.district,
        "potential_buyers": count
    }

# ------------------------------------------------------------------
# 🔥 AI MARKET INSIGHT FOR FARMERS
# ------------------------------------------------------------------
@router.get("/ai-market-insight")
def farmer_ai_market_insight(
    crop_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_farmer_role)
):
    """
    AI-powered advice for farmers:
    - Expected price
    - Demand strength
    - Sell timing guidance
    """
    farmer = db.query(Farmer).filter(
        Farmer.user_id == current_user.id
    ).first()

    prediction = market_predictor.predict(
        crop_id=crop_id,
        region_id=farmer.district
    )

    advice = "HOLD"
    if prediction["price_direction"] == "UP":
        advice = "SELL NOW"
    elif prediction["price_direction"] == "DOWN":
        advice = "WAIT / STORE"

    return {
        "crop_id": crop_id,
        "district": farmer.district,
        "estimated_price_rwf_per_kg": prediction["estimated_price"],
        "price_trend": prediction["price_direction"],
        "predicted_demand_kg": prediction["predicted_demand_kg"],
        "demand_pressure": prediction["demand_pressure"],
        "recommendation": advice,
        "confidence": prediction["confidence"]
    }

# ------------------------------------------------------------------
# 🔥 AI LISTING RECOMMENDATIONS
# ------------------------------------------------------------------
@router.get("/ai-listing-advice")
def ai_listing_advice(
    crop_id: int,
    quantity_kg: float,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_farmer_role)
):
    """
    Helps farmers decide:
    - Is this a good time to list?
    - Will buyers absorb this quantity?
    """
    farmer = db.query(Farmer).filter(
        Farmer.user_id == current_user.id
    ).first()

    pred = market_predictor.predict(crop_id, farmer.district)

    risk = "LOW"
    if quantity_kg > pred["predicted_demand_kg"]:
        risk = "HIGH"

    return {
        "crop_id": crop_id,
        "district": farmer.district,
        "proposed_quantity_kg": quantity_kg,
        "expected_price_rwf_per_kg": pred["estimated_price"],
        "market_demand_kg": pred["predicted_demand_kg"],
        "oversupply_risk": risk,
        "confidence": pred["confidence"]
    }
