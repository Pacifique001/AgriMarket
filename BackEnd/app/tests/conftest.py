"""Shared pytest fixtures for the AgroMarket AI FastAPI test suite."""
from __future__ import annotations
import app.services.pricing_service as pricing_service_module
import app.services.matching_service as matching_service_module
import app.services.demand_service as demand_service_module
import app.api.v1.matching as matching_module
import app.api.v1.listings as listings_module
import app.api.v1.farmers as farmers_module
import app.api.v1.buyers as buyers_module
import app.api.v1.analytics as analytics_module
import app.ai.predict as predict_module
from app.models.user import User, UserRole
from app.models.transaction import Transaction
from app.models.match import Match
from app.models.listing import Listing, ListingStatus
from app.models.farmer import Farmer
from app.models.buyer import Buyer, BuyerType
from app.models.audit_log import AuditLog
from app.core.security import get_password_hash
from app.core.database import Base, SessionLocal, engine, get_db
from app.main import app

import os
from datetime import datetime, timedelta, timezone
from typing import Generator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

os.environ.setdefault("SECRET_KEY", "test-secret-key")
os.environ.setdefault("DATABASE_URL", "sqlite://")


class DummyMarketPredictor:
    """Deterministic predictor stub for API tests."""

    def predict(self, crop_id, region_id, month=None):
        month_value = month or 1
        estimated_price = 100.0 + (int(crop_id) % 10) * 10.0 + month_value
        predicted_demand = 250.0 + (int(crop_id) % 7) * 15.0
        demand_pressure = 1.0 + (int(crop_id) % 3) * 0.2
        price_direction = "UP" if int(crop_id) % 2 == 0 else "STABLE"
        confidence = 0.85

        return {
            "estimated_price": estimated_price,
            "predicted_demand_kg": predicted_demand,
            "demand_pressure": demand_pressure,
            "price_direction": price_direction,
            "confidence": confidence,
        }

    def predict_by_name(self, **kwargs):
        crop_type = kwargs.get("crop_type") or kwargs.get("crop") or "crop"
        region_name = kwargs.get(
            "region_name") or kwargs.get("district") or "1"
        month = kwargs.get("month")
        crop_id = sum(ord(char) for char in str(crop_type)) % 100
        region_id = sum(ord(char) for char in str(region_name)) % 100
        return self.predict(crop_id=crop_id + region_id, region_id=region_id, month=month)


dummy_market_predictor = DummyMarketPredictor()

for module in (
    predict_module,
    listings_module,
    farmers_module,
    buyers_module,
    analytics_module,
    matching_module,
    pricing_service_module,
    demand_service_module,
    matching_service_module,
):
    module.market_predictor = dummy_market_predictor


@pytest.fixture(autouse=True)
def reset_test_database() -> Generator[None, None, None]:
    """Recreate the isolated test database for every test."""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(autouse=True)
def override_database_dependency() -> Generator[None, None, None]:
    """Route FastAPI database dependencies to the isolated test session."""

    def _override_get_db():
        db = SessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = _override_get_db
    yield
    app.dependency_overrides.pop(get_db, None)


@pytest_asyncio.fixture
async def async_client() -> AsyncClient:
    """Async HTTP client bound to the FastAPI test app."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        yield client


@pytest.fixture
def db_session():
    """Direct SQLAlchemy session for setup and verification assertions."""
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


def make_user_payload(
    *,
    role: UserRole,
    phone: str,
    full_name: str,
    password: str,
) -> dict[str, object]:
    """Build a user registration payload matching the current API schema."""
    return {
        "phone": phone,
        "full_name": full_name,
        "password": password,
        "role": role.value,
    }


def make_listing_payload(
    *,
    crop_type: str = "Maize",
    crop_id: int = 1,
    quantity_kg: float = 100.0,
    asking_price: float = 120.0,
    district: str = "Musanze",
    sector: str = "Kinigi",
    harvest_date: datetime | None = None,
) -> dict[str, object]:
    """Build a listing payload matching the current API schema."""
    payload: dict[str, object] = {
        "crop_type": crop_type,
        "crop_id": crop_id,
        "quantity_kg": quantity_kg,
        "asking_price": asking_price,
        "district": district,
        "sector": sector,
    }
    if harvest_date is not None:
        payload["harvest_date"] = harvest_date.isoformat()
    return payload


def seed_user(
    db_session,
    *,
    role: UserRole,
    phone: str,
    full_name: str,
    password: str,
    is_active: bool = True,
    locked_until: datetime | None = None,
    district: str = "Musanze",
    base_district: str = "Kigali",
) -> User:
    """Create a user and the matching role profile directly in the test DB."""
    user = User(
        phone=phone,
        full_name=full_name,
        hashed_password=get_password_hash(password),
        role=role,
        is_active=is_active,
        locked_until=locked_until,
    )
    db_session.add(user)
    db_session.flush()

    if role == UserRole.FARMER:
        db_session.add(Farmer(user_id=user.id, district=district))
    elif role == UserRole.BUYER:
        db_session.add(Buyer(user_id=user.id, base_district=base_district))

    db_session.commit()
    db_session.refresh(user)
    return user


def seed_listing(
    db_session,
    *,
    farmer: Farmer,
    crop_type: str = "Maize",
    crop_id: int = 1,
    quantity_kg: float = 100.0,
    asking_price: float = 120.0,
    district: str = "Musanze",
    sector: str = "Kinigi",
    harvest_date: datetime | None = None,
    status: ListingStatus = ListingStatus.AVAILABLE,
) -> Listing:
    """Create a listing directly in the isolated DB for ownership tests."""
    listing = Listing(
        farmer_id=farmer.id,
        crop_type=crop_type,
        crop_id=crop_id,
        quantity_kg=quantity_kg,
        asking_price=asking_price,
        ai_suggested_price=asking_price,
        ai_price_status="FAIR",
        ai_confidence=0.85,
        ai_price_direction="STABLE",
        ai_market_message="Test listing",
        district=district,
        sector=sector,
        harvest_date=harvest_date,
        status=status,
    )
    db_session.add(listing)
    db_session.commit()
    db_session.refresh(listing)
    return listing


async def register_user(async_client: AsyncClient, payload: dict[str, object]):
    """Register a user through the live API and assert the expected success code."""
    response = await async_client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201, response.text
    return response.json()


async def login_user(async_client: AsyncClient, phone: str, password: str):
    """Login a user through the live API and return the access token."""
    response = await async_client.post(
        "/api/v1/auth/login",
        data={"username": phone, "password": password},
    )
    assert response.status_code == 200, response.text
    return response.json()["access_token"]


@pytest_asyncio.fixture
async def farmer_token(async_client: AsyncClient) -> str:
    """Provide a valid farmer JWT for authenticated API tests."""
    await register_user(
        async_client,
        make_user_payload(
            role=UserRole.FARMER,
            phone="0780000101",
            full_name="Test Farmer",
            password="farmerpassword",
        ),
    )
    return await login_user(async_client, "0780000101", "farmerpassword")


@pytest_asyncio.fixture
async def buyer_token(async_client: AsyncClient) -> str:
    """Provide a valid buyer JWT for authenticated API tests."""
    await register_user(
        async_client,
        make_user_payload(
            role=UserRole.BUYER,
            phone="0780000102",
            full_name="Test Buyer",
            password="buyerpassword",
        ),
    )
    return await login_user(async_client, "0780000102", "buyerpassword")


@pytest_asyncio.fixture
async def admin_token(async_client: AsyncClient) -> str:
    """Provide a valid admin JWT for admin-only API tests."""
    await register_user(
        async_client,
        make_user_payload(
            role=UserRole.ADMIN,
            phone="0780000103",
            full_name="Test Admin",
            password="adminpassword",
        ),
    )
    return await login_user(async_client, "0780000103", "adminpassword")
