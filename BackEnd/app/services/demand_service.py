import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.listing import Listing, ListingStatus
from app.models.match import Match, MatchStatus
from app.models.buyer import Buyer

from app.ai.predict import market_predictor

logger = logging.getLogger("demand_service")


class DemandService:
    """
    PRODUCTION-GRADE DEMAND INTELLIGENCE SERVICE
    --------------------------------------------
    Combines AI forecasts with live buyer behavior
    to guide farmers, pricing, and policy decisions.
    """

    # ---------------------------------------------------------
    # CORE DEMAND FORECAST
    # ---------------------------------------------------------
    @staticmethod
    def get_crop_demand_forecast(
        db: Session,
        crop_type: str,
        district: str
    ) -> Dict[str, Any]:

        try:
            # ---------------------------------------------
            # 1. AI BASE DEMAND SIGNAL
            # ---------------------------------------------
            ai = market_predictor.predict_by_name(
                crop_type=crop_type,
                region_name=district
            )

            base_demand = ai["predicted_demand_kg"]
            demand_pressure = ai["demand_pressure"]
            confidence = ai["confidence"]

            # ---------------------------------------------
            # 2. REAL-TIME BUYER INTEREST (7 DAYS)
            # ---------------------------------------------
            since = datetime.utcnow() - timedelta(days=7)
            active_interest = db.query(Match).join(Listing).filter(
                Listing.crop_type == crop_type,
                Listing.district == district,
                Match.status == MatchStatus.INTERESTED,
                Match.updated_at >= since
            ).count()

            # ---------------------------------------------
            # 3. CURRENT SUPPLY
            # ---------------------------------------------
            supply_kg = db.query(func.sum(Listing.quantity_kg)).filter(
                Listing.crop_type == crop_type,
                Listing.district == district,
                Listing.status == ListingStatus.AVAILABLE
            ).scalar() or 0.0

            # ---------------------------------------------
            # 4. LIVE ADJUSTMENT
            # ---------------------------------------------
            # Demand pressure already reflects history
            live_multiplier = 1.0

            if active_interest >= 10:
                live_multiplier += 0.15
            elif active_interest <= 2:
                live_multiplier -= 0.10

            if supply_kg > base_demand * 1.5:
                live_multiplier -= 0.20
            elif supply_kg < base_demand * 0.7:
                live_multiplier += 0.15

            adjusted_demand = base_demand * live_multiplier

            # ---------------------------------------------
            # 5. DEMAND LEVEL
            # ---------------------------------------------
            demand_level = "Low"
            if demand_pressure >= 1.3:
                demand_level = "Critical"
            elif demand_pressure >= 1.1:
                demand_level = "High"
            elif demand_pressure >= 0.9:
                demand_level = "Moderate"

            # ---------------------------------------------
            # 6. FARMER RECOMMENDATION
            # ---------------------------------------------
            recommendation = DemandService._recommend_action(
                demand_pressure,
                supply_kg
            )

            return {
                "crop": crop_type,
                "district": district,
                "predicted_demand_kg": round(adjusted_demand, 1),
                "current_supply_kg": round(supply_kg, 1),
                "active_buyer_interest": active_interest,
                "demand_pressure": round(demand_pressure, 2),
                "demand_level": demand_level,
                "confidence": round(confidence, 2),
                "recommendation": recommendation
            }

        except Exception as e:
            logger.error(f"[DEMAND ERROR] {str(e)}")

            return {
                "crop": crop_type,
                "district": district,
                "predicted_demand_kg": 0,
                "current_supply_kg": 0,
                "active_buyer_interest": 0,
                "demand_pressure": 1.0,
                "demand_level": "Unknown",
                "confidence": 0.3,
                "recommendation": "Insufficient data"
            }

    # ---------------------------------------------------------
    # WHAT TO PLANT (TOP CROPS)
    # ---------------------------------------------------------
    @staticmethod
    def get_top_demanded_crops(
        db: Session,
        limit: int = 5
    ) -> List[Dict[str, Any]]:

        crops = db.query(
            Listing.crop_type,
            func.count(Match.id).label("interest")
        ).join(Match).filter(
            Match.status == MatchStatus.INTERESTED
        ).group_by(Listing.crop_type)\
         .order_by(func.count(Match.id).desc())\
         .limit(limit).all()

        return [
            {
                "crop": c.crop_type,
                "interest_score": c.interest,
                "signal": "High demand"
            }
            for c in crops
        ]

    # ---------------------------------------------------------
    # MARKET GAPS (ADMIN & POLICY)
    # ---------------------------------------------------------
    @staticmethod
    def identify_market_gaps(db: Session) -> List[Dict[str, Any]]:

        buyer_density = db.query(
            Buyer.base_district,
            func.count(Buyer.id).label("buyers")
        ).filter(Buyer.is_verified == True)\
         .group_by(Buyer.base_district).all()

        gaps = []

        for b in buyer_density:
            supply = db.query(Listing).filter(
                Listing.district == b.base_district,
                Listing.status == ListingStatus.AVAILABLE
            ).count()

            if b.buyers >= 5 and supply <= 1:
                gaps.append({
                    "district": b.base_district,
                    "buyers_waiting": b.buyers,
                    "active_listings": supply,
                    "urgency": "Critical"
                })

        return gaps

    # ---------------------------------------------------------
    # FARMER GUIDANCE LOGIC
    # ---------------------------------------------------------
    @staticmethod
    def _recommend_action(
        demand_pressure: float,
        supply_kg: float
    ) -> str:

        if demand_pressure >= 1.3 and supply_kg < 5000:
            return "Strong planting opportunity"
        if demand_pressure < 0.8:
            return "Market saturated — delay planting"
        return "Plant cautiously based on capacity"
