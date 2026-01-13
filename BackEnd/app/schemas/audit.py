from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class AuditLogRead(BaseModel):
    id: int
    action: str
    actor_user_id: Optional[int]
    entity_type: Optional[str]
    entity_id: Optional[int]
    ip_address: Optional[str]
    user_agent: Optional[str]
    description: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
