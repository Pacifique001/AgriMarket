from datetime import timedelta, datetime
from fastapi import APIRouter, Depends, HTTPException, status
from app.services.audit_log_service import AuditLogService
from fastapi import Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
import logging
from app.services.audit_service import AuditService


from app.core.database import get_db
from app.core.security import (
    create_access_token,
    get_password_hash,
    verify_password,
    get_current_user,
)
from app.core.config import settings
from app.schemas.user import UserCreate, UserRead, Token
from app.models.user import User, UserRole
from app.models.farmer import Farmer
from app.models.buyer import Buyer


logger = logging.getLogger("auth")

router = APIRouter()


# =====================================================
# REGISTER
# =====================================================
@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register_user(user_in: UserCreate, db: Session = Depends(get_db)):

    existing = db.query(User).filter(User.phone == user_in.phone).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Registration failed",
        )

    new_user = User(
        phone=user_in.phone,
        full_name=user_in.full_name,
        hashed_password=get_password_hash(user_in.password),
        role=user_in.role,
        is_active=True,
    )

    db.add(new_user)
    db.flush()  # get ID

    if user_in.role == UserRole.FARMER:
        db.add(Farmer(user_id=new_user.id, district="Pending"))

    elif user_in.role == UserRole.BUYER:
        db.add(Buyer(user_id=new_user.id, base_district="Pending"))

    db.commit()
    db.refresh(new_user)
    return new_user


# =====================================================
# LOGIN (HARDENED)
# =====================================================
@router.post("/login", response_model=Token)
def login(
    request: Request,
    db: Session = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
   ):
    user = db.query(User).filter(User.phone == form_data.username).first()

    # Generic error (prevents user enumeration)
    invalid_credentials = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not user:
        raise invalid_credentials

    # Check lock
    if user.locked_until and user.locked_until > datetime.utcnow():
        raise HTTPException(
            status_code=403,
            detail="Account temporarily locked. Try again later.",
        )

    if not verify_password(form_data.password, user.hashed_password):
        user.failed_login_attempts += 1

        # Lock after 5 failures
        if user.failed_login_attempts >= 5:
            user.locked_until = datetime.utcnow() + timedelta(minutes=15)
            logger.warning(f"[AUTH] User {user.id} locked due to failed attempts")

        db.commit()
        raise invalid_credentials

    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    if user.failed_login_attempts >= 5:
      user.locked_until = datetime.utcnow() + timedelta(minutes=15)
 
      AuditService.log(
        db=db,
        action="ACCOUNT_LOCKED",
        actor_user_id=user.id,
        entity_type="User",
        entity_id=user.id,
        description="Too many failed login attempts",
      )

    # Reset failure counters on success
    user.failed_login_attempts = 0
    user.locked_until = None
    db.commit()
    AuditService.log(
       db=db,
       request=request,
       action="LOGIN_SUCCESS",
       actor_user_id=user.id,
         )
    AuditLogService.log(
      db=db,
      action="USER_LOGIN",
      user=user,
      ip_address=request.client.host if request.client else None,
      user_agent=request.headers.get("user-agent"),
    )


    access_token = create_access_token(
        subject=user.id,
        role=user.role.value,
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
    }


# =====================================================
# CURRENT USER
# =====================================================
@router.get("/me", response_model=UserRead)
def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user
