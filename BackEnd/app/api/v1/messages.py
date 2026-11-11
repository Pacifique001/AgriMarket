from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.match import Match
from app.models.message import Message
from app.schemas.message import MessageCreate, MessageRead
from app.services.notification_service import NotificationService

router = APIRouter(tags=["Negotiation & Messaging"])


def _verify_match_participant(match: Match, current_user: User):
    farmer_user_id = match.listing.farmer.user_id if match.listing and match.listing.farmer else None
    buyer_user_id = match.buyer.user_id if match.buyer else None

    if current_user.id not in (farmer_user_id, buyer_user_id) and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to view or send messages in this negotiation."
        )

    # Determine other participant's user id
    receiver_user_id = buyer_user_id if current_user.id == farmer_user_id else farmer_user_id
    return receiver_user_id


@router.get("/{match_id}", response_model=List[MessageRead])
def get_match_messages(
    match_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieve all messages and bargaining history for a specific match.
    Marks messages received by the current user as read.
    """
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    _verify_match_participant(match, current_user)

    messages = (
        db.query(Message)
        .filter(Message.match_id == match_id)
        .order_by(Message.created_at.asc())
        .all()
    )

    # Mark incoming unread messages as read
    updated = False
    for msg in messages:
        if msg.receiver_id == current_user.id and not msg.is_read:
            msg.is_read = True
            updated = True
    if updated:
        db.commit()

    results = []
    for m in messages:
        sender = db.query(User).filter(User.id == m.sender_id).first()
        results.append(
            MessageRead(
                id=m.id,
                match_id=m.match_id,
                sender_id=m.sender_id,
                receiver_id=m.receiver_id,
                content=m.content,
                offered_price=m.offered_price,
                offered_quantity=m.offered_quantity,
                proposed_location=m.proposed_location,
                is_read=m.is_read,
                created_at=m.created_at,
                sender_name=sender.full_name if sender else "Unknown",
                sender_role=str(sender.role.value if sender and hasattr(sender.role, 'value') else sender.role) if sender else None
            )
        )

    return results


@router.post("/{match_id}", response_model=MessageRead, status_code=status.HTTP_201_CREATED)
def send_match_message(
    match_id: int,
    payload: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Send a message or bargain offer (price, quantity, place)
    between farmer and buyer for this match.
    """
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    receiver_id = _verify_match_participant(match, current_user)
    if not receiver_id:
        raise HTTPException(status_code=400, detail="Cannot determine recipient for this message.")

    msg = Message(
        match_id=match_id,
        sender_id=current_user.id,
        receiver_id=receiver_id,
        content=payload.content,
        offered_price=payload.offered_price,
        offered_quantity=payload.offered_quantity,
        proposed_location=payload.proposed_location,
        is_read=False
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)

    # Notify recipient via SMS if it contains a price offer or new bargaining detail
    preview = payload.content
    if payload.offered_price:
        preview = f"Offer: {payload.offered_price} RWF/kg | {payload.content}"
    try:
        NotificationService.notify_new_message(db, match_id, current_user.id, preview)
    except Exception:
        pass

    return MessageRead(
        id=msg.id,
        match_id=msg.match_id,
        sender_id=msg.sender_id,
        receiver_id=msg.receiver_id,
        content=msg.content,
        offered_price=msg.offered_price,
        offered_quantity=msg.offered_quantity,
        proposed_location=msg.proposed_location,
        is_read=msg.is_read,
        created_at=msg.created_at,
        sender_name=current_user.full_name,
        sender_role=str(current_user.role.value if hasattr(current_user.role, 'value') else current_user.role)
    )
