import logging
from sqlalchemy.orm import Session

from app.models.transaction import Transaction
from app.models.match import Match, MatchStatus
from app.models.listing import Listing, ListingStatus
from app.services.notification_service import NotificationService
from app.ai.fraud_detector import FraudDetector
from app.services.audit_service import AuditService


logger = logging.getLogger("transaction_service")


class TransactionService:
    """
    PRODUCTION TRANSACTION ENGINE
    -----------------------------
    Handles transaction lifecycle:
    - Creation from accepted match
    - Fraud prevention
    - Completion & notifications
    """

    # =====================================================
    # CREATE TRANSACTION FROM ACCEPTED MATCH
    # =====================================================
    @staticmethod
    def create_transaction_from_match(
        db: Session,
        match_id: int,
        quantity_kg: float,
        price_per_kg: float
    ) -> Transaction:
        """
        Creates a transaction once a farmer accepts a buyer match.
        Includes fraud & safety checks.
        """

        match = db.query(Match).filter(
            Match.id == match_id,
            Match.status == MatchStatus.ACCEPTED
        ).first()

        if not match:
            raise ValueError("Match not found or not accepted")

        listing = match.listing
        buyer = match.buyer

        # -------------------------------------------------
        # FRAUD CHECK 1: BUYER RISK ASSESSMENT
        # -------------------------------------------------
        buyer_risk = FraudDetector.assess_buyer_risk(db, buyer)

        if buyer_risk >= 0.75:
            logger.warning(
                f"[FRAUD BLOCK] Buyer {buyer.id} risk={buyer_risk}"
            )
            raise ValueError("Buyer flagged as high risk")

        # -------------------------------------------------
        # SAFETY CHECK: PREVENT OVERSELLING
        # -------------------------------------------------
        if quantity_kg > listing.quantity_kg:
            raise ValueError(
                "Requested quantity exceeds available listing quantity"
            )

        # -------------------------------------------------
        # FRAUD CHECK 2: TRANSACTION ANOMALY
        # -------------------------------------------------
        if FraudDetector.is_transaction_suspicious(
            db=db,
            listing=listing,
            quantity_kg=quantity_kg,
            price_per_kg=price_per_kg
        ):
            logger.warning(
                f"[FRAUD BLOCK] Suspicious transaction "
                f"(listing={listing.id}, buyer={buyer.id})"
            )
            raise ValueError("Transaction flagged as suspicious")

        # -------------------------------------------------
        # PREVENT DUPLICATE TRANSACTIONS
        # -------------------------------------------------
        existing_tx = db.query(Transaction).filter(
            Transaction.listing_id == listing.id,
            Transaction.buyer_id == buyer.id,
            Transaction.status != "cancelled"
        ).first()

        if existing_tx:
            logger.warning(
                f"[TX] Duplicate prevented for match {match_id}"
            )
            return existing_tx

        # -------------------------------------------------
        # CREATE TRANSACTION
        # -------------------------------------------------
        tx = Transaction(
            farmer_id=listing.farmer_id,
            buyer_id=buyer.id,
            listing_id=listing.id,
            quantity_kg=quantity_kg,
            price_per_kg=price_per_kg,
            status="pending"
        )

        # Reduce available listing quantity
        listing.quantity_kg -= quantity_kg
        if listing.quantity_kg <= 0:
            listing.status = ListingStatus.SOLD

        db.add(tx)
        db.commit()
        AuditService.log(
           db=db,
           action="TRANSACTION_CREATED",
           actor_user_id=listing.farmer.user_id,
           entity_type="Transaction",
           entity_id=tx.id,
           description=f"{quantity_kg}kg @ {price_per_kg}",
          )

        db.refresh(tx)

        logger.info(
            f"[TX CREATED] Transaction {tx.id} | "
            f"{quantity_kg}kg @ {price_per_kg}"
        )

        return tx

    # =====================================================
    # COMPLETE TRANSACTION
    # =====================================================
    @staticmethod
    def complete_transaction(
        db: Session,
        transaction_id: int
    ) -> None:
        """
        Marks a transaction as completed and notifies parties.
        """

        tx = db.query(Transaction).filter(
            Transaction.id == transaction_id
        ).first()

        if not tx:
            logger.warning(
                f"[TX] Transaction {transaction_id} not found"
            )
            return

        if tx.status == "completed":
            logger.info(
                f"[TX] Transaction {transaction_id} already completed"
            )
            return

        tx.status = "completed"
        db.commit()

        logger.info(
            f"[TX COMPLETED] Transaction {transaction_id}"
        )
        AuditService.log(
         db=db,
         action="TRANSACTION_COMPLETED",
         actor_user_id=tx.farmer.user_id,
         entity_type="Transaction",
         entity_id=tx.id,
        )

        # Notify farmer & buyer
        NotificationService.notify_transaction_update(
            db=db,
            transaction_id=transaction_id
        )
