from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from ..models.user import UserRole

# ------------------------------------------------------------------
# SHARED PROPERTIES
# ------------------------------------------------------------------
class UserBase(BaseModel):
    """
    Base properties shared across all User schemas.
    """
    phone: str = Field(..., description="The user's unique phone number (login ID)")
    full_name: str = Field(..., min_length=3, max_length=100)
    role: UserRole = Field(default=UserRole.FARMER)
    is_active: Optional[bool] = True

# ------------------------------------------------------------------
# INPUT SCHEMAS (Data coming from Frontend)
# ------------------------------------------------------------------
class UserCreate(UserBase):
    """
    Schema for User Registration.
    Includes the plain-text password (which is hashed before saving to DB).
    """
    password: str = Field(..., min_length=8, description="Minimum 8 characters")

class UserUpdate(BaseModel):
    """
    Schema for updating user details. All fields are optional.
    """
    phone: Optional[str] = None
    full_name: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None

# ------------------------------------------------------------------
# OUTPUT SCHEMAS (Data going to Frontend)
# ------------------------------------------------------------------
class UserRead(UserBase):
    """
    Schema for returning user data. 
    Does NOT include the password or hashed_password.
    """
    id: int
    created_at: datetime
    
    # Pydantic v2 configuration to allow data from SQLAlchemy objects
    model_config = ConfigDict(from_attributes=True)

# ------------------------------------------------------------------
# AUTHENTICATION SCHEMAS
# ------------------------------------------------------------------
class Token(BaseModel):
    """
    Schema for the JWT Access Token response.
    """
    access_token: str
    token_type: str = "bearer"
    role: str # Helping the frontend know where to redirect (farmer/buyer dashboard)

class TokenData(BaseModel):
    """
    Schema for the data inside the decoded JWT token.
    """
    id: Optional[str] = None