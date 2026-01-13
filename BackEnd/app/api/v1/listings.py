from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, check_farmer_role
from app.models.user import User
from app.models.farmer import Farmer
from app.models.listing import Listing, ListingStatus
from app.schemas.listing import ListingCreate, ListingRead, ListingUpdate

# 🔥 AI ENGINE (NEW)
from app.ai.predict import market_predictor

router = APIRouter( tags=["Listings"])

# ------------------------------------------------------------------
# CREATE LISTING (AI-AUGMENTED)
# ------------------------------------------------------------------
@router.post("/", response_model=ListingRead, status_code=status.HTTP_201_CREATED)
def create_listing(
    listing_in: ListingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_farmer_role)
):
    """
    Create a new listing with AI market intelligence.
    """
    farmer = db.query(Farmer).filter(
        Farmer.user_id == current_user.id
    ).first()

    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer profile not found")

    # 🔥 AI PREDICTION
    ai = market_predictor.predict(
        crop_id=listing_in.crop_id,
        region_id=listing_in.district
    )

    # PRICE EVALUATION
    price_gap = listing_in.asking_price - ai["estimated_price"]

    if price_gap < -0.2 * ai["estimated_price"]:
        price_status = "UNDERPRICED"
    elif price_gap > 0.25 * ai["estimated_price"]:
        price_status = "OVERPRICED"
    else:
        price_status = "FAIR"

    # FARMER MESSAGE
    farmer_message = (
        f"Market price is around {ai['estimated_price']} RWF/kg. "
        f"Demand is {ai['price_direction'].lower()} with confidence "
        f"{int(ai['confidence'] * 100)}%."
    )

    # CREATE LISTING
    listing = Listing(
        farmer_id=farmer.id,
        crop_type=listing_in.crop_type,
        crop_id=listing_in.crop_id,
        quantity_kg=listing_in.quantity_kg,
        asking_price=listing_in.asking_price,
        ai_suggested_price=ai["estimated_price"],
        ai_price_status=price_status,
        ai_confidence=ai["confidence"],
        ai_price_direction=ai["price_direction"],
        ai_market_message=farmer_message,
        district=listing_in.district,
        sector=listing_in.sector,
        harvest_date=listing_in.harvest_date,
        image_url=listing_in.image_url,
        status=ListingStatus.AVAILABLE
    )

    db.add(listing)
    db.commit()
    db.refresh(listing)

    return listing

# ------------------------------------------------------------------
# READ ALL LISTINGS (BUYER VIEW)
# ------------------------------------------------------------------
@router.get("/", response_model=List[ListingRead])
def read_all_listings(
    crop_type: Optional[str] = None,
    district: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(Listing).filter(
        Listing.status == ListingStatus.AVAILABLE
    )

    if crop_type:
        query = query.filter(Listing.crop_type.ilike(f"%{crop_type}%"))

    if district:
        query = query.filter(Listing.district == district)

    return query.offset(skip).limit(limit).all()

# ------------------------------------------------------------------
# FARMER LISTINGS
# ------------------------------------------------------------------
@router.get("/my-listings", response_model=List[ListingRead])
def read_my_listings(
    db: Session = Depends(get_db),
    current_user: User = Depends(check_farmer_role)
):
    farmer = db.query(Farmer).filter(
        Farmer.user_id == current_user.id
    ).first()

    return db.query(Listing).filter(
        Listing.farmer_id == farmer.id
    ).all()

# ------------------------------------------------------------------
# LISTING DETAILS
# ------------------------------------------------------------------
@router.get("/{listing_id}", response_model=ListingRead)
def read_listing_by_id(
    listing_id: int,
    db: Session = Depends(get_db)
):
    listing = db.query(Listing).filter(
        Listing.id == listing_id
    ).first()

    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    return listing

# ------------------------------------------------------------------
# UPDATE LISTING (AI RECHECK)
# ------------------------------------------------------------------
@router.patch("/{listing_id}", response_model=ListingRead)
def update_listing(
    listing_id: int,
    listing_update: ListingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
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

    update_data = listing_update.dict(exclude_unset=True)

    # 🔥 IF PRICE CHANGED → RE-RUN AI
    if "asking_price" in update_data:
        ai = market_predictor.predict(
            crop_id=listing.crop_id,
            region_id=listing.district
        )

        update_data.update({
            "ai_suggested_price": ai["estimated_price"],
            "ai_confidence": ai["confidence"],
            "ai_price_direction": ai["price_direction"]
        })

    for key, value in update_data.items():
        setattr(listing, key, value)

    db.commit()
    db.refresh(listing)
    return listing

# ------------------------------------------------------------------
# DELETE LISTING
# ------------------------------------------------------------------
@router.delete("/{listing_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_listing(
    listing_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    listing = db.query(Listing).filter(
        Listing.id == listing_id
    ).first()

    farmer = db.query(Farmer).filter(
        Farmer.user_id == current_user.id
    ).first()

    if not listing or not farmer or listing.farmer_id != farmer.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    db.delete(listing)
    db.commit()
    return None
