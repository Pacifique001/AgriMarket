import enum
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class UserRole(str, enum.Enum):
    """
    Defines the roles available in the system.
    Using an Enum ensures data integrity at the database level.
    """
    FARMER = "farmer"
    BUYER = "buyer"
    ADMIN = "admin"


class User(Base):
    """
    The core User model used for authentication and authorization.
    All users (Farmers, Buyers, Admins) are stored here.
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    # User Identification
    full_name = Column(String(255), nullable=False)

    # Phone is the primary login identifier for the system (essential for SMS)
    phone = Column(String(20), unique=True, index=True, nullable=False)

    # Security
    hashed_password = Column(String(255), nullable=False)

    # Permissions
    role = Column(Enum(UserRole), nullable=False, default=UserRole.FARMER)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)  # For system maintainers
    failed_login_attempts = Column(Integer, default=0)
    locked_until = Column(DateTime, nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    # A User with role 'farmer' will have an entry in the 'farmers' table
    farmer_profile = relationship(
        "Farmer",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan"
    )

    # A User with role 'buyer' will have an entry in the 'buyers' table
    buyer_profile = relationship(
        "Buyer",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<User(id={self.id}, phone='{self.phone}', role='{self.role}')>"
