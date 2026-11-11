from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime


class BuyerRequestBase(BaseModel):
    crop_type: str
    required_kg: float
    preferred_district: str
    max_price_per_kg: Optional[float] = None


class BuyerRequestCreate(BuyerRequestBase):
    pass


class BuyerRequestRead(BuyerRequestBase):
    id: int
    buyer_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
