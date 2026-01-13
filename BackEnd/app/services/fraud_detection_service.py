from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.buyer import Buyer
from app.models.match import Match, MatchStatus
from app.models.transaction import Transaction


class FraudDetectionService:
    """
    Behavioral fraud & trust scoring engine.
    """

    @staticmethod
    def evaluate_buyer(db: Session, buyer_id: int) -> None:
        buyer = db.query(Buyer).filter(Buyer.id == buyer_id).first()
        if not buyer:
            return

        now = datetime.utcnow()
        score = 0.0

        # ------------------------------------------------
        # 1. INTEREST-SPAM CHECK
        # ------------------------------------------------
        seven_days_ago = now - timedelta(days=7)
        interest_count = db.query(Match).filter(
            Match.buyer_id == buyer.id,
            Match.status == MatchStatus.INTERESTED,
            Match.updated_at >= seven_days_ago
        ).count()

        if interest_count > 15:
            score += 0.3

        # ------------------------------------------------
        # 2. FAILED TRANSACTIONS
        # ------------------------------------------------
        failed_tx = db.query(Transaction).filter(
            Transaction.buyer_id == buyer.id,
            Transaction.status.in_(["cancelled", "failed"])
        ).count()

        if failed_tx >= 3:
            score += 0.4

        # ------------------------------------------------
        # 3. CONVERSION RATE
        # ------------------------------------------------
        completed_tx = db.query(Transaction).filter(
            Transaction.buyer_id == buyer.id,
            Transaction.status == "completed"
        ).count()

        if interest_count > 0:
            conversion_rate = completed_tx / interest_count
            if conversion_rate < 0.1:
                score += 0.3

        # ------------------------------------------------
        # FINAL SCORE NORMALIZATION
        # ------------------------------------------------
        buyer.fraud_score = min(score, 1.0)
        buyer.trust_score = round(1.0 - buyer.fraud_score, 2)
        buyer.last_activity_at = now

        db.commit()
