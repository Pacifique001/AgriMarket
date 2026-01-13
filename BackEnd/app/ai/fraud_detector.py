import logging
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.transaction import Transaction
from app.models.match import Match
from app.models.buyer import Buyer
from app.models.listing import Listing

logger = logging.getLogger("fraud_detector")


class FraudDetector:
    """
    PRODUCTION FRAUD DETECTION ENGINE
    --------------------------------
    Uses behavioral signals, not assumptions.
    """

    # -----------------------------
    # BUYER RISK SCORING
    # -----------------------------
    @staticmethod
    def assess_buyer_risk(db: Session, buyer: Buyer) -> float:
        """
        Returns risk score from 0.0 (safe) → 1.0 (high risk)
        """
        risk = 0.0
        now = datetime.utcnow()

        # 1️⃣ Excessive matches without transactions
        match_count = db.query(Match).filter(
            Match.buyer_id == buyer.id
        ).count()

        tx_count = db.query(Transaction).filter(
            Transaction.buyer_id == buyer.id,
            Transaction.status == "completed"
        ).count()

        if match_count >= 10 and tx_count == 0:
            risk += 0.3

        # 2️⃣ Repeated cancelled / failed transactions
        failed_tx = db.query(Transaction).filter(
            Transaction.buyer_id == buyer.id,
            Transaction.status.in_(["cancelled", "failed"])
        ).count()

        if failed_tx >= 3:
            risk += 0.25

        # 3️⃣ Unrealistic volume behavior
        avg_qty = db.query(
            func.avg(Transaction.quantity_kg)
        ).filter(
            Transaction.buyer_id == buyer.id
        ).scalar() or 0

        if buyer.max_purchase_qty_kg and avg_qty > buyer.max_purchase_qty_kg * 1.5:
            risk += 0.2

        # 4️⃣ New buyer penalty (anti-scam)
        if buyer.created_at and (now - buyer.created_at).days < 7:
            risk += 0.15

        return min(round(risk, 2), 1.0)

    # -----------------------------
    # TRANSACTION FRAUD CHECK
    # -----------------------------
    @staticmethod
    def is_transaction_suspicious(
        db: Session,
        listing: Listing,
        quantity_kg: float,
        price_per_kg: float
    ) -> bool:
        """
        Hard fraud gate before transaction creation
        """

        # 1️⃣ Dumping / price manipulation
        if listing.price_per_kg and price_per_kg < listing.price_per_kg * 0.6:
            logger.warning("[FRAUD] Price dumping detected")
            return True

        # 2️⃣ Quantity anomaly
        if quantity_kg > listing.quantity_kg * 1.2:
            logger.warning("[FRAUD] Quantity anomaly detected")
            return True

        return False
