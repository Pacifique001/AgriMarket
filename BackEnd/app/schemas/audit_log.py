from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class AuditLogRead(BaseModel):
    id: int
    user_id: Optional[int]
    user_role: Optional[str]
    action: str
    resource: Optional[str]
    resource_id: Optional[int]
    ip_address: Optional[str]
    user_agent: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
