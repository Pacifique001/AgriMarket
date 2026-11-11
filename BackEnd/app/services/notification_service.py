import logging
from sqlalchemy.orm import Session

from app.models.match import Match
from app.models.transaction import Transaction
from app.models.farmer import Farmer
from app.models.user import User
from app.services.farmer_insight_service import FarmerInsightService
from app.utils.sms import send_sms

logger = logging.getLogger("notification_service")


class NotificationService:
    """
    PRODUCTION NOTIFICATION ENGINE
    Handles all SMS notifications safely and idempotently.
    """

    # =====================================================
    # MATCH CREATED (AI MATCH FOUND)
    # =====================================================
    @staticmethod
    def notify_new_match(db: Session, match_id: int) -> None:
        match = db.query(Match).filter(Match.id == match_id).first()
        if not match:
            logger.warning(f"[NOTIFY] Match {match_id} not found")
            return

        listing = match.listing
        farmer = listing.farmer
        buyer = match.buyer

        updated = False

        # -------- FARMER SMS (PERSONALISED) --------
        if not match.is_notified_farmer:
            insights = FarmerInsightService.get_farmer_profile(
                db=db,
                farmer_id=farmer.id
            )

            tone = (
                "🔥 You’re one of our top sellers!"
                if insights.get("is_high_performer")
                else "🌱 New selling opportunity!"
            )

            crop_hint = (
                f"This buyer is actively looking for {listing.crop_type}."
                if insights.get("top_crop") == listing.crop_type
                else f"Diversify your sales with {listing.crop_type}."
            )

            message = (
                "AgroMarket Alert\n"
                f"{tone}\n"
                f"{crop_hint}\n"
                f"Match Score: {int(match.match_score * 100)}%\n"
                "Log in to review."
            )

            if NotificationService._safe_sms(
                farmer.user.phone,
                message
            ):
                match.is_notified_farmer = True
                updated = True

        # -------- BUYER NOTIFICATION (EMAIL / PUSH PLACEHOLDER) --------
        if not match.is_notified_buyer:
            logger.info(
                f"[NOTIFY] Buyer {buyer.id} notified of match {match.id}"
            )
            match.is_notified_buyer = True
            updated = True

        if updated:
            db.commit()

    # =====================================================
    # BUYER INTEREST CLICK (HANDSHAKE EVENT)
    # =====================================================
    @staticmethod
    def notify_buyer_interest(db: Session, match_id: int) -> None:
        match = db.query(Match).filter(Match.id == match_id).first()
        if not match:
            logger.warning(f"[NOTIFY] Match {match_id} not found")
            return

        listing = match.listing
        farmer = listing.farmer
        buyer = match.buyer

        buyer_name = (
            buyer.company_name
            or (buyer.user.full_name if buyer.user else "A verified buyer")
        )
        buyer_phone = buyer.user.phone if buyer.user else ""

        message = (
            "🚨 AgroMarket Buyer Alert!\n"
            f"{buyer_name} is interested in your {listing.quantity_kg}kg "
            f"of {listing.crop_type} in {listing.district}.\n"
            f"Buyer Phone: {buyer_phone}\n"
            "Log in to negotiate price, place, and accept the deal!"
        )

        sent = NotificationService._safe_sms(
            farmer.user.phone,
            message
        )
        if sent:
            match.is_notified_farmer = True
            db.commit()

    # =====================================================
    # FARMER ACCEPTS MATCH
    # =====================================================
    @staticmethod
    def notify_match_accepted(db: Session, match_id: int) -> None:
        match = db.query(Match).filter(Match.id == match_id).first()
        if not match:
            return

        listing = match.listing
        farmer = listing.farmer
        buyer = match.buyer

        farmer_name = farmer.user.full_name if farmer.user else "The farmer"
        farmer_phone = farmer.user.phone if farmer.user else ""

        message = (
            "🎉 Deal Approved!\n"
            f"{farmer_name} accepted your interest in {listing.quantity_kg}kg "
            f"of {listing.crop_type}.\n"
            f"Farmer Contact: {farmer_phone}\n"
            "You can now finalize the transaction on AgroMarket."
        )

        if buyer.user and buyer.user.phone:
            NotificationService._safe_sms(buyer.user.phone, message)

    # =====================================================
    # NEW BARGAIN / CHAT MESSAGE ALERT
    # =====================================================
    @staticmethod
    def notify_new_message(db: Session, match_id: int, sender_id: int, preview: str) -> None:
        match = db.query(Match).filter(Match.id == match_id).first()
        if not match:
            return

        farmer_user = match.listing.farmer.user
        buyer_user = match.buyer.user

        # Identify recipient
        recipient = buyer_user if sender_id == farmer_user.id else farmer_user
        sender = farmer_user if sender_id == farmer_user.id else buyer_user

        if recipient and recipient.phone:
            crop = match.listing.crop_type
            message = (
                f"💬 AgroMarket Negotiation Alert\n"
                f"New message from {sender.full_name} regarding {crop}:\n"
                f"\"{preview[:80]}\"\n"
                "Log in to respond."
            )
            NotificationService._safe_sms(recipient.phone, message)

    # =====================================================
    # TRANSACTION STATUS UPDATE
    # =====================================================
    @staticmethod
    def notify_transaction_update(
        db: Session,
        transaction_id: int
    ) -> None:
        tx = db.query(Transaction).filter(
            Transaction.id == transaction_id
        ).first()

        if not tx:
            logger.warning(
                f"[NOTIFY] Transaction {transaction_id} not found"
            )
            return

        if tx.status == "completed":
            NotificationService._safe_sms(
                tx.farmer.user.phone,
                (
                    "✅ Sale Completed\n"
                    f"You sold {tx.quantity_kg}kg "
                    f"of {tx.listing.crop_type}."
                )
            )

            NotificationService._safe_sms(
                tx.buyer.user.phone,
                (
                    "🧾 Purchase Confirmed\n"
                    f"You bought {tx.quantity_kg}kg "
                    f"of {tx.listing.crop_type}."
                )
            )

    # =====================================================
    # AI PRICE ALERT
    # =====================================================
    @staticmethod
    def send_price_alert(
        db: Session,
        farmer_id: int,
        crop_type: str,
        new_price: float
    ) -> None:
        farmer = db.query(Farmer).filter(
            Farmer.id == farmer_id
        ).first()

        if not farmer:
            logger.warning(
                f"[NOTIFY] Farmer {farmer_id} not found"
            )
            return

        NotificationService._safe_sms(
            farmer.user.phone,
            (
                "📈 Market Alert\n"
                f"{crop_type} price in {farmer.district} "
                f"is now {round(new_price, 1)} RWF/kg."
            )
        )

    # =====================================================
    # DEMAND SURGE BROADCAST
    # =====================================================
    @staticmethod
    def broadcast_demand_surge(
        db: Session,
        district: str,
        crop_type: str
    ) -> None:
        farmers = db.query(Farmer).filter(
            Farmer.district == district
        ).all()

        message = (
            "🔥 High Demand Alert\n"
            f"{crop_type} demand is rising in {district}."
        )

        for farmer in farmers:
            NotificationService._safe_sms(
                farmer.user.phone,
                message
            )

    # =====================================================
    # SAFE SMS SENDER (FAILURE-PROTECTED)
    # =====================================================
    @staticmethod
    def _safe_sms(phone: str, message: str) -> bool:
        try:
            success = send_sms(phone, message)
            if not success:
                logger.warning(f"[SMS FAILED] {phone}")
            return success
        except Exception as e:
            logger.error(f"[SMS ERROR] {phone} - {str(e)}")
            return False
