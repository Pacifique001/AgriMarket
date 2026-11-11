from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from ..models.match import MatchStatus

# ------------------------------------------------------------------
# SHARED PROPERTIES
# ------------------------------------------------------------------
class MatchBase(BaseModel):
    """
    Base properties for a match between a listing and a buyer.
    """
    listing_id: int = Field(..., description="The ID of the crop listing")
    buyer_id: int = Field(..., description="The ID of the buyer profile")
    match_score: float = Field(
        ..., 
        ge=0.0, 
        le=1.0, 
        example=0.92, 
        description="AI confidence score (0 to 1)"
    )
    match_reason: Optional[str] = Field(
        None, 
        example="Nearby location and high buyer reliability",
        description="Explanation of why the AI made this match"
    )

# ------------------------------------------------------------------
# INPUT SCHEMAS (Internal/AI Engine side)
# ------------------------------------------------------------------
class MatchCreate(MatchBase):
    """
    Schema used by the AI Matching Service to create a new match record.
    """
    status: Optional[MatchStatus] = MatchStatus.PENDING

class MatchUpdate(BaseModel):
    """
    Schema for updating the status of a match.
    Used when a buyer clicks 'Interested' or a farmer 'Accepts'.
    """
    status: Optional[MatchStatus] = None
    is_notified_farmer: Optional[bool] = None
    is_notified_buyer: Optional[bool] = None

class ExpressInterestRequest(BaseModel):
    """
    Schema for buyer expressing interest directly in a listing.
    """
    listing_id: int
    offered_price: Optional[float] = None
    offered_quantity: Optional[float] = None
    message: Optional[str] = None
    proposed_location: Optional[str] = None

# ------------------------------------------------------------------
# OUTPUT SCHEMAS (Data going to Frontend)
# ------------------------------------------------------------------
class MatchRead(MatchBase):
    """
    Schema for returning match details. 
    Includes timestamps and the current status of the handshake.
    """
    id: int
    status: MatchStatus
    is_notified_farmer: bool
    is_notified_buyer: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    # Pydantic v2 configuration
    model_config = ConfigDict(from_attributes=True)

# ------------------------------------------------------------------
# DETAILED MATCH VIEW (Dashboard specific)
# ------------------------------------------------------------------
class MatchDetail(MatchRead):
    """
    A descriptive schema including basic info about the other party
    and listing details for seamless display in dashboards.
    """
    other_party_name: str = Field(..., example="Kigali Serena Hotel")
    other_party_district: str = Field(..., example="Nyarugenge")
    other_party_phone: Optional[str] = Field(None, example="+250788123456")
    explanation: Optional[str] = Field(None, example="High buyer demand and nearby supply")
    distance_km: Optional[float] = Field(None, example=12.5)
    crop_type: Optional[str] = None
    quantity_kg: Optional[float] = None
    asking_price: Optional[float] = None

class MatchSummary(BaseModel):
    """
    Used for a quick overview count on dashboards.
    """
    total_matches: int
    high_confidence_matches: int # Matches with score > 0.8
    pending_actions: int
