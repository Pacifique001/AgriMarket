from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Dict, Any

from app.models.transaction import Transaction
from app.models.listing import Listing
from app.models.match import MatchStatus


class FarmerInsightService:
    """
    Extracts behavioural insights used by AI & Notification systems.
    """

    @staticmethod
    def get_farmer_profile(db: Session, farmer_id: int) -> Dict[str, Any]:
        """
        Returns a summary of farmer behavior for personalization.
        """

        # Most sold crop
        top_crop = (
            db.query(Listing.crop_type, func.count(Transaction.id))
            .join(Transaction, Transaction.listing_id == Listing.id)
            .filter(Transaction.farmer_id == farmer_id)
            .group_by(Listing.crop_type)
            .order_by(func.count(Transaction.id).desc())
            .first()
        )

        # Completed transaction count
        completed_sales = (
            db.query(Transaction)
            .filter(
                Transaction.farmer_id == farmer_id,
                Transaction.status == "completed"
            )
            .count()
        )

        # Interest conversion rate
        interested = (
            db.query(Transaction)
            .filter(Transaction.farmer_id == farmer_id)
            .count()
        )

        conversion_rate = (
            round(completed_sales / interested, 2)
            if interested else 0.0
        )

        return {
            "top_crop": top_crop[0] if top_crop else None,
            "completed_sales": completed_sales,
            "conversion_rate": conversion_rate,
            "is_high_performer": completed_sales >= 5
        }
