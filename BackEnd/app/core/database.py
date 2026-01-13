from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase, Session
from app.core.config import settings


# =====================================================
# DATABASE ENGINE
# =====================================================
DATABASE_URL = settings.DATABASE_URL

engine_args = {
    "pool_pre_ping": True,
    "echo": False,
    "future": True,
}

# SQLite safety (dev/test only)
if DATABASE_URL.startswith("sqlite"):
    engine_args["connect_args"] = {"check_same_thread": False}

engine = create_engine(
    DATABASE_URL,
    **engine_args
)


# =====================================================
# SESSION FACTORY
# =====================================================
SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
    class_=Session,
)


# =====================================================
# DECLARATIVE BASE
# =====================================================
class Base(DeclarativeBase):
    pass


# =====================================================
# FASTAPI DB DEPENDENCY
# =====================================================
def get_db():
    """
    FastAPI dependency that provides a SQLAlchemy session
    and guarantees cleanup after request completion.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
