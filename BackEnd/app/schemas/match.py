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
    A more descriptive schema that might include basic info about the 
    other party to show on the dashboard without extra API calls.
    """
    # These would be populated via JOINs in the service layer
    other_party_name: str = Field(..., example="Kigali Serena Hotel")
    other_party_district: str = Field(..., example="Nyarugenge")
    distance_km: Optional[float] = Field(None, example=12.5)

class MatchSummary(BaseModel):
    """
    Used for a quick overview count on dashboards.
    """
    total_matches: int
    high_confidence_matches: int # Matches with score > 0.8
    pending_actions: int