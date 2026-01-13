import logging
from typing import Optional
from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog
from app.models.user import User

logger = logging.getLogger("audit_log_service")


class AuditLogService:
    """
    CENTRAL AUDIT LOGGER
    --------------------
    Called from auth, transactions, listings, admin actions.
    """

    @staticmethod
    def log(
        db: Session,
        action: str,
        user: Optional[User] = None,
        resource: Optional[str] = None,
        resource_id: Optional[int] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> None:
        try:
            entry = AuditLog(
                user_id=user.id if user else None,
                user_role=user.role if user else None,
                action=action,
                resource=resource,
                resource_id=resource_id,
                ip_address=ip_address,
                user_agent=user_agent,
            )
            db.add(entry)
            db.commit()
        except Exception as e:
            logger.error(f"[AUDIT LOG FAILED] {str(e)}")
