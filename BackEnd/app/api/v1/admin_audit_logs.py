from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.core.security import check_admin_role
from app.models.audit_log import AuditLog
from app.schemas.audit_log import AuditLogRead

router = APIRouter()


@router.get(
    "/audit-logs",
    response_model=List[AuditLogRead]
)
def get_audit_logs(
    db: Session = Depends(get_db),
    _: str = Depends(check_admin_role),
    limit: int = Query(100, le=500),
    user_id: Optional[int] = None,
    action: Optional[str] = None
):
    """
    ADMIN: View system audit logs.
    """

    query = db.query(AuditLog).order_by(AuditLog.created_at.desc())

    if user_id:
        query = query.filter(AuditLog.user_id == user_id)

    if action:
        query = query.filter(AuditLog.action == action)

    return query.limit(limit).all()
