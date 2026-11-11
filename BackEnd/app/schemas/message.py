from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class MessageCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=1000)
    offered_price: Optional[float] = Field(None, ge=0)
    offered_quantity: Optional[float] = Field(None, ge=0)
    proposed_location: Optional[str] = Field(None, max_length=255)


class MessageRead(BaseModel):
    id: int
    match_id: int
    sender_id: int
    receiver_id: int
    content: str
    offered_price: Optional[float] = None
    offered_quantity: Optional[float] = None
    proposed_location: Optional[str] = None
    is_read: bool
    created_at: datetime
    sender_name: Optional[str] = None
    sender_role: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
