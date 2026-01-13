from typing import Optional
from pydantic import BaseModel, Field, ConfigDict

# ------------------------------------------------------------------
# SHARED PROPERTIES
# ------------------------------------------------------------------
class CropBase(BaseModel):
    """
    Base properties for a Crop type definition.
    Used to standardize the crops available in the system.
    """
    name: str = Field(..., example="Maize", min_length=2, max_length=50)
    category: str = Field(..., example="Cereals", description="Category like Tubers, Cereals, Fruits")
    description: Optional[str] = Field(None, example="High-quality white maize")
    image_url: Optional[str] = Field(None, description="URL to a representative icon or photo")
    is_active: bool = True

# ------------------------------------------------------------------
# INPUT SCHEMAS (Admin Use Only)
# ------------------------------------------------------------------
class CropCreate(CropBase):
    """
    Schema used by admins to add a new crop type to the platform's database.
    """
    pass

class CropUpdate(BaseModel):
    """
    Schema for updating crop definitions.
    """
    name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    is_active: Optional[bool] = None

# ------------------------------------------------------------------
# OUTPUT SCHEMAS (Data going to Frontend)
# ------------------------------------------------------------------
class CropRead(CropBase):
    """
    Schema for returning crop details to the frontend.
    Used in dropdowns for farmers when they create a listing.
    """
    id: int

    # Pydantic v2 configuration to allow data from SQLAlchemy objects
    model_config = ConfigDict(from_attributes=True)

# ------------------------------------------------------------------
# AI / ANALYTICS SPECIFIC SCHEMAS
# ------------------------------------------------------------------
class CropMarketTrend(BaseModel):
    """
    Simplified schema for analytics dashboards showing crop performance.
    """
    crop_name: str
    current_avg_price: float
    demand_level: str = Field(..., pattern="^(High|Medium|Low)$")
    trend_direction: str = Field(..., pattern="^(Up|Down|Stable)$")