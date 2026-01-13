from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.match import MatchStatus
from app.services.transaction_service import TransactionService
from app.schemas.transaction import (
    TransactionCreate,
    TransactionRead
)

router = APIRouter()


# =====================================================
# CREATE TRANSACTION (FROM ACCEPTED MATCH)
# =====================================================
@router.post(
    "/",
    response_model=TransactionRead,
    status_code=status.HTTP_201_CREATED
)
def create_transaction(
    payload: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a transaction from an accepted AI match.
    Only the farmer involved can initiate it.
    """

    try:
        tx = TransactionService.create_transaction_from_match(
            db=db,
            match_id=payload.match_id,
            quantity_kg=payload.quantity_kg,
            price_per_kg=payload.price_per_kg
        )
        return tx

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


# =====================================================
# COMPLETE TRANSACTION
# =====================================================
@router.post(
    "/{transaction_id}/complete",
    status_code=status.HTTP_200_OK
)
def complete_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Mark transaction as completed.
    Can be used by farmer or admin.
    """

    TransactionService.complete_transaction(
        db=db,
        transaction_id=transaction_id
    )

    return {"status": "completed"}
