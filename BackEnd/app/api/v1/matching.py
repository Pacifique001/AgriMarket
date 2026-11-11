from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, check_farmer_role
from app.models.user import User, UserRole
from app.models.farmer import Farmer
from app.models.buyer import Buyer
from app.models.listing import Listing, ListingStatus
from app.models.match import Match, MatchStatus
from app.models.message import Message
from app.schemas.match import MatchRead, MatchUpdate, MatchDetail, ExpressInterestRequest
from app.services.notification_service import NotificationService
from app.services.matching_service import MatchingService

router = APIRouter(tags=["Matching"])

# ------------------------------------------------------------------
# FARMER VIEW: BUYERS MATCHED TO A LISTING
# ------------------------------------------------------------------
@router.get("/listing/{listing_id}", response_model=List[MatchDetail])
def get_matches_for_listing(
    listing_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_farmer_role)
):
    """
    Farmer sees ranked buyers with AI explanations and contact details.
    """
    listing = db.query(Listing).filter(
        Listing.id == listing_id
    ).first()

    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    farmer = db.query(Farmer).filter(
        Farmer.user_id == current_user.id
    ).first()

    if not farmer or listing.farmer_id != farmer.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Refresh AI matches if available
    if listing.status == ListingStatus.AVAILABLE:
        MatchingService.generate_matches_for_listing(db, listing.id)

    matches = (
        db.query(Match)
        .filter(Match.listing_id == listing_id)
        .order_by(
            # Prioritize interested buyers first, then by match score
            (Match.status == MatchStatus.INTERESTED).desc(),
            (Match.status == MatchStatus.ACCEPTED).desc(),
            Match.match_score.desc()
        )
        .all()
    )

    results = []
    for m in matches:
        buyer = db.query(Buyer).filter(Buyer.id == m.buyer_id).first()
        buyer_user = buyer.user if buyer else None

        results.append(
            MatchDetail(
                id=m.id,
                listing_id=m.listing_id,
                buyer_id=m.buyer_id,
                match_score=m.match_score,
                match_reason=m.match_reason,
                status=m.status,
                is_notified_farmer=m.is_notified_farmer,
                is_notified_buyer=m.is_notified_buyer,
                created_at=m.created_at,
                updated_at=m.updated_at,
                other_party_name=buyer.company_name or (buyer_user.full_name if buyer_user else "Individual Buyer"),
                other_party_district=buyer.base_district or "Rwanda",
                other_party_phone=buyer_user.phone if buyer_user else None,
                explanation=m.match_reason or "AI evaluated compatible volume and demand",
                crop_type=listing.crop_type,
                quantity_kg=listing.quantity_kg,
                asking_price=listing.asking_price
            )
        )

    return results

# ------------------------------------------------------------------
# BUYER VIEW: SUGGESTED HARVESTS
# ------------------------------------------------------------------
@router.get("/buyer/suggestions", response_model=List[MatchDetail])
def get_suggestions_for_buyer(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.BUYER:
        raise HTTPException(status_code=403, detail="Buyer access only")

    buyer = db.query(Buyer).filter(
        Buyer.user_id == current_user.id
    ).first()

    if not buyer:
        raise HTTPException(status_code=404, detail="Buyer profile not found")

    # Generate matches
    MatchingService.generate_matches_for_buyer(db, buyer.id)

    matches = (
        db.query(Match)
        .filter(Match.buyer_id == buyer.id)
        .order_by(Match.match_score.desc())
        .all()
    )

    results = []
    for m in matches:
        listing = db.query(Listing).filter(Listing.id == m.listing_id).first()
        if not listing:
            continue

        farmer_user = listing.farmer.user if listing.farmer else None

        results.append(
            MatchDetail(
                id=m.id,
                listing_id=m.listing_id,
                buyer_id=m.buyer_id,
                match_score=m.match_score,
                match_reason=m.match_reason,
                status=m.status,
                is_notified_farmer=m.is_notified_farmer,
                is_notified_buyer=m.is_notified_buyer,
                created_at=m.created_at,
                updated_at=m.updated_at,
                other_party_name=farmer_user.full_name if farmer_user else f"Farm in {listing.district}",
                other_party_district=listing.district,
                other_party_phone=farmer_user.phone if farmer_user else None,
                explanation=m.match_reason or "AI evaluated high supply compatibility",
                crop_type=listing.crop_type,
                quantity_kg=listing.quantity_kg,
                asking_price=listing.asking_price
            )
        )

    return results

# ------------------------------------------------------------------
# BUYER VIEW: ALL MY MATCHES / EXPRESSED INTERESTS
# ------------------------------------------------------------------
@router.get("/buyer/my-matches", response_model=List[MatchDetail])
def get_my_buyer_matches(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.BUYER:
        raise HTTPException(status_code=403, detail="Buyer access only")

    buyer = db.query(Buyer).filter(Buyer.user_id == current_user.id).first()
    if not buyer:
        return []

    matches = (
        db.query(Match)
        .filter(Match.buyer_id == buyer.id)
        .order_by(Match.updated_at.desc(), Match.created_at.desc())
        .all()
    )

    results = []
    for m in matches:
        listing = db.query(Listing).filter(Listing.id == m.listing_id).first()
        if not listing:
            continue

        farmer_user = listing.farmer.user if listing.farmer else None

        results.append(
            MatchDetail(
                id=m.id,
                listing_id=m.listing_id,
                buyer_id=m.buyer_id,
                match_score=m.match_score,
                match_reason=m.match_reason,
                status=m.status,
                is_notified_farmer=m.is_notified_farmer,
                is_notified_buyer=m.is_notified_buyer,
                created_at=m.created_at,
                updated_at=m.updated_at,
                other_party_name=farmer_user.full_name if farmer_user else f"Farm in {listing.district}",
                other_party_district=listing.district,
                other_party_phone=farmer_user.phone if farmer_user else None,
                explanation=m.match_reason or "Direct connection",
                crop_type=listing.crop_type,
                quantity_kg=listing.quantity_kg,
                asking_price=listing.asking_price
            )
        )

    return results

# ------------------------------------------------------------------
# BUYER: EXPRESS INTEREST IN ANY LISTING (MARKETPLACE + NOTIFICATION)
# ------------------------------------------------------------------
@router.post("/interest", response_model=MatchDetail)
def express_interest_in_listing(
    payload: ExpressInterestRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Called when a buyer clicks 'Express Interest' on ANY harvest listing.
    Creates or updates the Match record to 'interested', sends SMS alert to the farmer,
    and optionally sends the buyer's initial bargain/message.
    """
    if current_user.role != UserRole.BUYER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only registered buyers can express interest in harvests"
        )

    buyer = db.query(Buyer).filter(Buyer.user_id == current_user.id).first()
    if not buyer:
        raise HTTPException(status_code=404, detail="Buyer profile not found")

    listing = db.query(Listing).filter(Listing.id == payload.listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    # Find existing match or create a new one
    match = db.query(Match).filter(
        Match.listing_id == listing.id,
        Match.buyer_id == buyer.id
    ).first()

    if not match:
        score = 0.85
        reasons = ["Direct buyer marketplace interest"]
        try:
            calc_score, calc_reasons = MatchingService._calculate_match_score(listing, buyer)
            if calc_score > 0:
                score = calc_score
                reasons = calc_reasons
        except Exception:
            pass

        match = Match(
            listing_id=listing.id,
            buyer_id=buyer.id,
            match_score=score,
            status=MatchStatus.INTERESTED,
            match_reason=", ".join(reasons)
        )
        db.add(match)
        db.commit()
        db.refresh(match)
    else:
        match.status = MatchStatus.INTERESTED
        db.commit()
        db.refresh(match)

    # If the buyer provided an opening message, bargaining offer, or location, save it
    if payload.message or payload.offered_price or payload.proposed_location:
        initial_msg = Message(
            match_id=match.id,
            sender_id=current_user.id,
            receiver_id=listing.farmer.user_id,
            content=payload.message or "I am interested in this harvest and would like to discuss purchase details.",
            offered_price=payload.offered_price,
            offered_quantity=payload.offered_quantity or listing.quantity_kg,
            proposed_location=payload.proposed_location,
            is_read=False
        )
        db.add(initial_msg)
        db.commit()

    # 🚀 ALWAYS ALERT FARMER VIA SMS
    NotificationService.notify_buyer_interest(db, match.id)

    farmer_user = listing.farmer.user if listing.farmer else None

    return MatchDetail(
        id=match.id,
        listing_id=match.listing_id,
        buyer_id=match.buyer_id,
        match_score=match.match_score,
        match_reason=match.match_reason,
        status=match.status,
        is_notified_farmer=match.is_notified_farmer,
        is_notified_buyer=match.is_notified_buyer,
        created_at=match.created_at,
        updated_at=match.updated_at,
        other_party_name=farmer_user.full_name if farmer_user else f"Farm in {listing.district}",
        other_party_district=listing.district,
        other_party_phone=farmer_user.phone if farmer_user else None,
        explanation=match.match_reason or "Direct buyer marketplace interest",
        crop_type=listing.crop_type,
        quantity_kg=listing.quantity_kg,
        asking_price=listing.asking_price
    )

# ------------------------------------------------------------------
# HANDSHAKE: UPDATE MATCH STATUS
# ------------------------------------------------------------------
@router.patch("/{match_id}/status", response_model=MatchRead)
def update_match_status(
    match_id: int,
    status_update: MatchUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    # Buyer expresses interest
    if status_update.status == MatchStatus.INTERESTED:
        buyer = db.query(Buyer).filter(
            Buyer.user_id == current_user.id
        ).first()
        if not buyer or buyer.id != match.buyer_id:
            raise HTTPException(status_code=403, detail="Buyer not authorized")

    # Farmer accepts or rejects
    if status_update.status in (MatchStatus.ACCEPTED, MatchStatus.REJECTED):
        farmer = db.query(Farmer).filter(
            Farmer.user_id == current_user.id
        ).first()
        listing = db.query(Listing).filter(
            Listing.id == match.listing_id
        ).first()
        if not farmer or listing.farmer_id != farmer.id:
            raise HTTPException(status_code=403, detail="Farmer not authorized")

    if status_update.status:
        match.status = status_update.status

    db.commit()
    db.refresh(match)

    # 🚀 TRIGGER NOTIFICATIONS
    if status_update.status == MatchStatus.INTERESTED:
        NotificationService.notify_buyer_interest(db, match.id)
    elif status_update.status == MatchStatus.ACCEPTED:
        NotificationService.notify_match_accepted(db, match.id)

    return match
