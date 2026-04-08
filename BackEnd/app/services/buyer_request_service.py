from sqlalchemy.orm import Session
from app.models.buyer_request import BuyerRequest
from app.schemas.buyer_request import BuyerRequestCreate


def create_buyer_request(db: Session, request: BuyerRequestCreate, buyer_id: int) -> BuyerRequest:
    db_request = BuyerRequest(**request.dict(), buyer_id=buyer_id)
    db.add(db_request)
    db.commit()
    db.refresh(db_request)
    return db_request

# Optionally, add more service functions as needed (e.g., get_buyer_requests, etc.)
