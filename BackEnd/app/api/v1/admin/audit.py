from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.security import check_admin_role
from app.models.audit_log import AuditLog
from app.schemas.audit import AuditLogRead

router = APIRouter(prefix="/admin/audit", tags=["Admin Audit"])


@router.get("/", response_model=List[AuditLogRead])
def get_audit_logs(
    db: Session = Depends(get_db),
    admin=Depends(check_admin_role),
    limit: int = Query(50, le=200),
    offset: int = 0,
):
    return (
        db.query(AuditLog)
        .order_by(AuditLog.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
