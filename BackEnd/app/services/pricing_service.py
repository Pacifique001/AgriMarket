import logging
from datetime import datetime
from typing import Dict, Any

from app.ai.predict import market_predictor

logger = logging.getLogger("pricing_service")


class PricingService:
    """
    PRODUCTION-GRADE AI PRICING SERVICE
    ----------------------------------
    Generates market-safe, explainable price suggestions
    for real transactions.
    """

    # Safety constants (can later move to settings)
    MIN_PRICE_RWF = 50.0
    MAX_PRICE_MULTIPLIER = 1.6   # Prevent insane AI spikes

    # ---------------------------------------------------
    # PUBLIC API
    # ---------------------------------------------------
    @classmethod
    def get_suggested_price(
        cls,
        crop_type: str,
        district: str,
        quantity_kg: float = 0.0
    ) -> float:
        """
        Simple interface used by Listings.
        """
        analysis = cls.get_price_analysis(crop_type, district, quantity_kg)
        return analysis["suggested_price"]

    # ---------------------------------------------------
    # FULL PRICE ANALYSIS (Dashboard & APIs)
    # ---------------------------------------------------
    @classmethod
    def get_price_analysis(
        cls,
        crop_type: str,
        district: str,
        quantity_kg: float = 0.0
    ) -> Dict[str, Any]:

        try:
            # -----------------------------------------
            # 1. MARKET AI SIGNAL
            # -----------------------------------------
            market = market_predictor.predict_by_name(
                crop_type=crop_type,
                region_name=district
            )

            base_price = market["estimated_price"]
            demand_pressure = market["demand_pressure"]
            price_direction = market["price_direction"]  # UP / DOWN / STABLE
            confidence = market["confidence"]

            # -----------------------------------------
            # 2. DEMAND ADJUSTMENT
            # -----------------------------------------
            adjusted_price = base_price

            if demand_pressure > 1.2:
                adjusted_price *= 1.08
            elif demand_pressure < 0.8:
                adjusted_price *= 0.92

            # -----------------------------------------
            # 3. QUANTITY ADJUSTMENT
            # -----------------------------------------
            if quantity_kg >= 3000:
                adjusted_price *= 0.94
            elif quantity_kg <= 200:
                adjusted_price *= 1.05

            # -----------------------------------------
            # 4. SEASONALITY
            # -----------------------------------------
            month = datetime.utcnow().month
            if month in [12, 1]:        # High demand
                adjusted_price *= 1.10
            elif month in [3, 4]:       # Post-harvest dip
                adjusted_price *= 0.95

            # -----------------------------------------
            # 5. CONFIDENCE WEIGHTING
            # -----------------------------------------
            adjusted_price *= (0.7 + (confidence * 0.3))

            # -----------------------------------------
            # 6. SAFETY CLAMPS
            # -----------------------------------------
            max_allowed = base_price * cls.MAX_PRICE_MULTIPLIER
            adjusted_price = min(adjusted_price, max_allowed)
            adjusted_price = max(adjusted_price, cls.MIN_PRICE_RWF)

            final_price = round(adjusted_price, 2)

            # -----------------------------------------
            # 7. EXPLANATION (HUMAN-READABLE)
            # -----------------------------------------
            explanation = cls._build_reasoning(
                price_direction,
                demand_pressure,
                quantity_kg,
                district
            )

            logger.info(
                f"[AI PRICE] {crop_type} | {district} | "
                f"Qty={quantity_kg}kg | Price={final_price}"
            )

            return {
                "suggested_price": final_price,
                "base_price": round(base_price, 2),
                "price_direction": price_direction,
                "demand_pressure": round(demand_pressure, 2),
                "confidence": round(confidence, 2),
                "reasoning": explanation
            }

        except Exception as e:
            logger.error(f"[PRICING ERROR] {str(e)}")

            # HARD SAFE FALLBACK
            return {
                "suggested_price": 250.0,
                "base_price": 250.0,
                "price_direction": "STABLE",
                "demand_pressure": 1.0,
                "confidence": 0.3,
                "reasoning": "Fallback price used due to limited market data."
            }

    # ---------------------------------------------------
    # EXPLANATION ENGINE
    # ---------------------------------------------------
    @staticmethod
    def _build_reasoning(
        direction: str,
        demand_pressure: float,
        quantity_kg: float,
        district: str
    ) -> str:
        reasons = []

        if direction == "UP":
            reasons.append("Prices are rising in this market")
        elif direction == "DOWN":
            reasons.append("Market prices are softening")

        if demand_pressure > 1.3:
            reasons.append("Strong buyer demand")
        elif demand_pressure < 0.8:
            reasons.append("High supply in the market")

        if quantity_kg >= 3000:
            reasons.append("Bulk quantity discount applied")

        reasons.append(f"Based on recent trades in {district}")

        return ". ".join(reasons)
