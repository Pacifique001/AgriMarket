from typing import Any, List, Dict
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import datetime, timedelta

from app.core.database import get_db
from app.core.security import check_admin_role
from app.models.user import User
from app.models.farmer import Farmer
from app.models.buyer import Buyer
from app.core.security import get_current_user
from app.models.listing import Listing, ListingStatus
from app.models.transaction import Transaction, TransactionStatus

# 🔥 AI ENGINE

# AI Engine
from app.ai.predict import market_predictor

router = APIRouter( tags=["Analytics"])

# ------------------------------------------------------------------
# PLATFORM OVERVIEW
# ------------------------------------------------------------------
@router.get("/overview", response_model=Dict[str, Any])
def get_platform_overview(
    db: Session = Depends(get_db),
    admin: User = Depends(check_admin_role)
):
    total_farmers = db.query(Farmer).count()
    total_buyers = db.query(Buyer).count()

    sales = db.query(
        func.sum(Transaction.total_amount).label("gmv"),
        func.sum(Transaction.quantity_kg).label("volume"),
        func.count(Transaction.id).label("tx")
    ).filter(Transaction.status == TransactionStatus.COMPLETED).first()

    active_listings = db.query(Listing).filter(
        Listing.status == ListingStatus.AVAILABLE
    ).count()

    return {
        "users": {
            "farmers": total_farmers,
            "buyers": total_buyers,
            "total": total_farmers + total_buyers
        },
        "market": {
            "gmv_rwf": float(sales.gmv or 0),
            "volume_kg": float(sales.volume or 0),
            "completed_transactions": sales.tx or 0
        },
        "inventory": {
            "active_listings": active_listings
        }
    }

# ------------------------------------------------------------------
# REGIONAL SUPPLY vs DEMAND
# ------------------------------------------------------------------
@router.get("/regional-activity", response_model=List[Dict[str, Any]])
def get_regional_activity(
    db: Session = Depends(get_db),
    admin: User = Depends(check_admin_role)
):
    supply = db.query(
        Listing.district,
        func.sum(Listing.quantity_kg).label("stock"),
        func.count(Listing.id).label("listings")
    ).filter(Listing.status == ListingStatus.AVAILABLE)\
     .group_by(Listing.district).all()

    trades = db.query(
        Listing.district,
        func.count(Transaction.id).label("trades")
    ).join(Transaction).filter(
        Transaction.status == TransactionStatus.COMPLETED
    ).group_by(Listing.district).all()

    trade_map = {t.district: t.trades for t in trades}

    return sorted([
        {
            "district": s.district,
            "available_stock_kg": float(s.stock or 0),
            "active_listings": s.listings,
            "completed_trades": trade_map.get(s.district, 0)
        }
        for s in supply
    ], key=lambda x: x["available_stock_kg"], reverse=True)


# ------------------------------------------------------------------
# AI MARKET INSIGHT (ADMIN + INTERNAL)
# ------------------------------------------------------------------
@router.get("/ai-market-insight")
def ai_market_insight(
    crop_id: int,
    region_id: int,
    admin: User = Depends(check_admin_role)
):
    pred = market_predictor.predict(crop_id, region_id)
    return {
        "crop_id": crop_id,
        "region_id": region_id,
        "estimated_price": round(pred["estimated_price"], 2) if pred["estimated_price"] is not None else None,
        "price_direction": pred["price_direction"],
        "predicted_demand_kg": round(pred["predicted_demand_kg"], 2) if pred["predicted_demand_kg"] is not None else None,
        "demand_pressure": round(pred["demand_pressure"], 2) if pred["demand_pressure"] is not None else None,
        "confidence": round(pred["confidence"], 2) if pred["confidence"] is not None else None
    }

# ------------------------------------------------------------------
# PUBLIC AI MARKET PREDICTION ENDPOINT
# ------------------------------------------------------------------
@router.get("/predict/market")
def public_market_prediction(
    crop_id: int,
    region_id: int,
    month: int = None
):
    """
    Public endpoint for market AI predictions (no admin required).
    """
    pred = market_predictor.predict(crop_id, region_id, month)
    return pred

# ------------------------------------------------------------------
# AI MARKET ALERTS (ACTIONABLE)
# ------------------------------------------------------------------
@router.get("/market-alerts")
def market_alerts(
    crop_id: int,
    region_id: int,
    admin: User = Depends(check_admin_role)
):
    pred = market_predictor.predict(crop_id, region_id)
    alerts = []

    confidence = pred.get("confidence", 0)

    if confidence < 0.4:
        return {
            "alerts": [],
            "confidence": confidence,
            "note": "Insufficient data for reliable alerts"
        }

    if pred["price_direction"] == "UP":
        alerts.append({
            "severity": "OPPORTUNITY",
            "message": "Prices are rising — good time to sell",
            "farmer_message": "💰 Prices are going up. Consider selling now."
        })

    if pred["demand_pressure"] > 1.3:
        alerts.append({
            "severity": "OPPORTUNITY",
            "message": "Strong buyer demand detected",
            "farmer_message": "🔥 Many buyers want this crop in your area."
        })

    if pred["demand_pressure"] < 0.7:
        alerts.append({
            "severity": "WARNING",
            "message": "Oversupply risk detected",
            "farmer_message": "⚠️ Too much supply. Consider waiting or storing."
        })

    return {
        "crop_id": crop_id,
        "region_id": region_id,
        "alerts": alerts,
        "confidence": round(confidence, 2)
    }

# ------------------------------------------------------------------
# HISTORICAL PRICE TRENDS (REAL DATA)
# ------------------------------------------------------------------
@router.get("/price-trends/{crop_type}")
def get_price_trends(
    crop_type: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    since = datetime.utcnow() - timedelta(days=30)

    trends = db.query(
        func.date_trunc("day", Transaction.created_at).label("day"),
        func.avg(Transaction.price_per_kg).label("avg"),
        func.min(Transaction.price_per_kg).label("min"),
        func.max(Transaction.price_per_kg).label("max")
    ).join(Listing).filter(
        Listing.crop_type.ilike(f"%{crop_type}%"),
        Transaction.status == TransactionStatus.COMPLETED,
        Transaction.created_at >= since
    ).group_by("day").order_by("day").all()

    return [
        {
            "date": t.day.strftime("%Y-%m-%d"),
            "avg_price": round(t.avg, 2),
            "min_price": round(t.min, 2),
            "max_price": round(t.max, 2)
        }
        for t in trends
    ]

# ------------------------------------------------------------------
# MARKET GAPS (BUYER DEMAND > SUPPLY)
# ------------------------------------------------------------------
@router.get("/market-gaps")
def get_market_gaps(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from app.models.match import Match, MatchStatus

    gaps = db.query(
        Listing.crop_type,
        func.count(Match.id).label("interest")
    ).join(Match).filter(
        Match.status == MatchStatus.INTERESTED,
        Listing.status == ListingStatus.AVAILABLE
    ).group_by(Listing.crop_type)\
     .order_by(desc("interest"))\
     .limit(5).all()

    return [
        {
            "crop": g.crop_type,
            "unsatisfied_buyer_interest": g.interest
        }
        for g in gaps
    ]
