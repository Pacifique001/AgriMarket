from sqlalchemy.orm import Session
from datetime import datetime
from typing import List

from app.models.listing import Listing, ListingStatus
from app.models.buyer import Buyer
from app.models.match import Match, MatchStatus
from app.utils.distance import calculate_haversine_distance
from app.ai.fraud_detector import FraudDetector


# 🔥 Market AI
from app.ai.predict import market_predictor


class MatchingService:
    """
    PRODUCTION-GRADE AI MATCHING ENGINE
    ----------------------------------
    Combines:
    - Logistics feasibility
    - Buyer capacity
    - Market demand pressure
    - Freshness & urgency
    """

    MIN_MATCH_SCORE = 0.45  # safer than 0.4

    # -------------------------------------------------------
    # CORE SCORING FUNCTION
    # -------------------------------------------------------
    @staticmethod
    def _calculate_match_score(listing: Listing, buyer: Buyer) -> float:
        score = 0.0
        reasons = []

        # ---------------------------------------------
        # 1. LOCATION / LOGISTICS (40%)
        # ---------------------------------------------
        if listing.farmer.latitude and buyer.base_latitude:
            dist_km = calculate_haversine_distance(
                listing.farmer.latitude,
                listing.farmer.longitude,
                buyer.base_latitude,
                buyer.base_longitude
            )
            distance_score = max(0, 1 - (dist_km / 250))
            score += distance_score * 0.4
            if dist_km < 50:
                reasons.append("Nearby supply")
        elif listing.district == buyer.base_district:
            score += 0.3
            reasons.append("Same district")

        # ---------------------------------------------
        # 2. QUANTITY COMPATIBILITY (25%)
        # ---------------------------------------------
        if buyer.min_purchase_qty_kg and listing.quantity_kg < buyer.min_purchase_qty_kg:
            return 0.0, ["Below buyer minimum quantity"]

        if buyer.max_purchase_qty_kg and listing.quantity_kg > buyer.max_purchase_qty_kg:
            score += 0.15
        else:
            score += 0.25
            reasons.append("Good volume match")

        # ---------------------------------------------
        # 3. MARKET DEMAND SIGNAL (20%)
        # ---------------------------------------------
        try:
            market = market_predictor.predict(
                crop_id=listing.crop_id,
                region_id=listing.region_id
            )
            demand_pressure = market.get("demand_pressure", 1)
            confidence = market.get("confidence", 0.5)

            market_score = min(demand_pressure / 1.5, 1.0)
            score += market_score * 0.2 * confidence

            if demand_pressure > 1.3:
                reasons.append("High buyer demand")
        except Exception:
            confidence = 0.5  # safe fallback

        # ---------------------------------------------
        # 4. FRESHNESS & URGENCY (10%)
        # ---------------------------------------------
        if listing.harvest_date:
            days_since_harvest = (
                datetime.utcnow().date() - listing.harvest_date).days
            if days_since_harvest <= 3:
                score += 0.1
                reasons.append("Fresh harvest")
            elif days_since_harvest > 14:
                score -= 0.05
                reasons.append("Aging stock")

        # ---------------------------------------------
        # 5. TRUST FACTOR (5%)
        # ---------------------------------------------
        if buyer.is_verified:
            score += 0.05
            reasons.append("Verified buyer")

        # ---------------------------------------------
        # FINAL NORMALIZATION
        # ---------------------------------------------
        score = max(0, min(score, 1.0))
        score *= confidence  # confidence gating

        return round(score, 2), reasons

    # -------------------------------------------------------
    # FARMER → BUYER MATCHING
    # -------------------------------------------------------
    @classmethod
    def generate_matches_for_listing(cls, db: Session, listing_id: int):
        listing = db.query(Listing).filter(
            Listing.id == listing_id,
            Listing.status == ListingStatus.AVAILABLE
        ).first()

        if not listing:
            return

        buyers = db.query(Buyer).all()

        for buyer in buyers:
            score, reasons = cls._calculate_match_score(listing, buyer)

            if score < cls.MIN_MATCH_SCORE:
                continue

            match = db.query(Match).filter(
                Match.listing_id == listing.id,
                Match.buyer_id == buyer.id
            ).first()

            if match:
                match.match_score = score
                match.match_reason = ", ".join(reasons)
            else:
                db.add(Match(
                    listing_id=listing.id,
                    buyer_id=buyer.id,
                    match_score=score,
                    status=MatchStatus.PENDING,
                    match_reason=", ".join(reasons)
                ))

        db.commit()

    # -------------------------------------------------------
    # BUYER → FARMER MATCHING
    # -------------------------------------------------------
    @classmethod
    def generate_matches_for_buyer(cls, db: Session, buyer_id: int):
        buyer = db.query(Buyer).filter(Buyer.id == buyer_id).first()
        if not buyer:
            return

        listings = db.query(Listing).filter(
            Listing.status == ListingStatus.AVAILABLE
        ).all()

        for listing in listings:
            score, reasons = cls._calculate_match_score(listing, buyer)

            if score < cls.MIN_MATCH_SCORE:
                continue

            exists = db.query(Match).filter(
                Match.listing_id == listing.id,
                Match.buyer_id == buyer.id
            ).first()

            if not exists:
                db.add(Match(
                    listing_id=listing.id,
                    buyer_id=buyer.id,
                    match_score=score,
                    status=MatchStatus.PENDING,
                    match_reason=", ".join(reasons)
                ))
        # ---------------------------------------------
        # FRAUD RISK PENALTY
        # ---------------------------------------------
        buyer_risk = FraudDetector.assess_buyer_risk(
            db=db,  # safe: does not require DB here
            buyer=buyer
        )

        if buyer_risk > 0.6:
            score *= 0.6
        reasons.append("Risk-adjusted buyer")

        db.commit()
