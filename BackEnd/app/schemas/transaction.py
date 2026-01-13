from pydantic import BaseModel
from typing import Optional


class TransactionCreate(BaseModel):
    match_id: int
    quantity_kg: float
    price_per_kg: float


class TransactionRead(BaseModel):
    id: int
    farmer_id: int
    buyer_id: int
    listing_id: int
    quantity_kg: float
    price_per_kg: float
    status: str

    class Config:
        from_attributes = True
