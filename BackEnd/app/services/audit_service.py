from fastapi import Request
from sqlalchemy.orm import Session
from typing import Optional
from app.models.audit_log import AuditLog


class AuditService:

    @staticmethod
    def log(
        db: Session,
        action: str,
        request: Optional[Request] = None,
        actor_user_id: Optional[int] = None,
        entity_type: Optional[str] = None,
        entity_id: Optional[int] = None,
        description: Optional[str] = None,
    ):
        ip = request.client.host if request else None
        ua = request.headers.get("user-agent") if request else None

        log = AuditLog(
            actor_user_id=actor_user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            description=description,
            ip_address=ip,
            user_agent=ua,
        )

        db.add(log)
        db.commit()
