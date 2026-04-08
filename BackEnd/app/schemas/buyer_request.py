from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class BuyerRequestBase(BaseModel):
    crop_type: str
    required_kg: float
    preferred_district: str
    max_price_per_kg: Optional[float] = None


class BuyerRequestCreate(BuyerRequestBase):
    # buyer_id: int
    pass


class BuyerRequestRead(BuyerRequestBase):
    id: int
    buyer_id: int
    created_at: datetime

    class Config:
        orm_mode = True
