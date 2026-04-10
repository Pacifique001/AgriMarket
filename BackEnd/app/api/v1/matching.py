from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, check_farmer_role
from app.models.user import User, UserRole
from app.models.farmer import Farmer
from app.models.buyer import Buyer
from app.models.listing import Listing, ListingStatus
from app.models.match import Match, MatchStatus
from app.schemas.match import MatchRead, MatchUpdate, MatchDetail

# 🔥 AI SERVICES
from app.ai.predict import market_predictor
from app.services.matching_service import MatchingService

router = APIRouter( tags=["Matching"])

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
    Farmer sees ranked buyers with AI explanations.
    """
    listing = db.query(Listing).filter(
        Listing.id == listing_id,
        Listing.status == ListingStatus.AVAILABLE
    ).first()

    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    farmer = db.query(Farmer).filter(
        Farmer.user_id == current_user.id
    ).first()

    if listing.farmer_id != farmer.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    # 🔥 Generate / refresh matches
    MatchingService.generate_matches_for_listing(db, listing.id)

    matches = (
        db.query(Match)
        .filter(Match.listing_id == listing_id)
        .order_by(Match.match_score.desc())
        .all()
    )

    results = []
    for m in matches:
        buyer = db.query(Buyer).filter(Buyer.id == m.buyer_id).first()

        results.append(
            MatchDetail(
                **MatchRead.from_orm(m).dict(),
                other_party_name=buyer.company_name or "Individual Buyer",
                other_party_district=buyer.base_district,
                explanation=m.match_reason
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

    # 🔥 Generate matches
    MatchingService.generate_matches_for_buyer(db, buyer.id)

    matches = (
        db.query(Match)
        .filter(Match.buyer_id == buyer.id)
        .order_by(Match.match_score.desc())
        .all()
    )

    results = []
    for m in matches:
        listing = db.query(Listing).filter(
            Listing.id == m.listing_id
        ).first()

        results.append(
            MatchDetail(
                **MatchRead.from_orm(m).dict(),
                other_party_name=f"Farm in {listing.district}",
                other_party_district=listing.district,
                explanation=m.match_reason
            )
        )

    return results

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

    # Farmer accepts
    if status_update.status == MatchStatus.ACCEPTED:
        farmer = db.query(Farmer).filter(
            Farmer.user_id == current_user.id
        ).first()
        listing = db.query(Listing).filter(
            Listing.id == match.listing_id
        ).first()
        if not farmer or listing.farmer_id != farmer.id:
            raise HTTPException(status_code=403, detail="Farmer not authorized")

    match.status = status_update.status
    db.commit()
    db.refresh(match)
    return match
