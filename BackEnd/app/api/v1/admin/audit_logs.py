from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import check_admin_role
from app.models.audit_log import AuditLog
from app.models.user import User

router = APIRouter(prefix="/admin/audit-logs", tags=["Admin Audit"])

@router.get("")
def get_audit_logs(
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    admin: User = Depends(check_admin_role),
):
    """
    Returns paginated system audit logs.
    Admin only.
    """

    total = db.query(AuditLog).count()

    logs = (
        db.query(AuditLog)
        .order_by(AuditLog.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    return {
        "total": total,
        "offset": offset,
        "limit": limit,
        "items": [
            {
                "id": log.id,
                "user_id": log.user_id,
                "action": log.action,
                "resource": log.resource,
                "ip_address": log.ip_address,
                "user_agent": log.user_agent,
                "created_at": log.created_at,
            }
            for log in logs
        ],
    }
@router.get("/{log_id}")
def get_audit_log(
    log_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(check_admin_role),
):
    log = db.query(AuditLog).filter(AuditLog.id == log_id).first()

    if not log:
        return {"error": "Audit log not found"}

    return {
        "id": log.id,
        "user_id": log.user_id,
        "action": log.action,
        "resource": log.resource,
        "ip_address": log.ip_address,
        "user_agent": log.user_agent,
        "created_at": log.created_at,
    }
