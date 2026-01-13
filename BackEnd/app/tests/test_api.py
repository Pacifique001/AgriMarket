import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.core.database import Base, get_db
from app.core.security import get_password_hash

# --- SETUP TEST DATABASE (In-Memory SQLite) ---
# This ensures tests are fast and don't interfere with your real Postgres DB
SQLALCHEMY_DATABASE_URL = "sqlite://"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

# Apply the database override to the FastAPI app
app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

@pytest.fixture(scope="module", autouse=True)
def setup_database():
    """Create tables before tests and drop them after."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

# --- AUTHENTICATION TESTS ---

def test_user_registration():
    """Test that a farmer can register successfully."""
    response = client.post(
        "/api/v1/auth/register",
        json={
            "phone": "0780000001",
            "full_name": "Test Farmer",
            "password": "securepassword123",
            "role": "farmer"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["phone"] == "0780000001"
    assert "id" in data

def test_login_success():
    """Test that the registered user can log in and receive a JWT."""
    # Note: OAuth2PasswordRequestForm uses form-data, not JSON
    response = client.post(
        "/api/v1/auth/login",
        data={
            "username": "0780000001",
            "password": "securepassword123"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    return data["access_token"]


# --- LISTING & AI TESTS ---

def test_create_listing_with_ai():
    """Test creating a listing and ensuring AI pricing is triggered."""
    # 1. Login to get token
    login_res = client.post(
        "/api/v1/auth/login",
        data={"username": "0780000001", "password": "securepassword123"}
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Create Listing
    listing_data = {
        "crop_type": "Maize",
        "quantity_kg": 1000,
        "district": "Musanze",
        "asking_price": 300
    }
    response = client.post("/api/v1/listings/", json=listing_data, headers=headers)
    
    assert response.status_code == 201
    data = response.json()
    assert data["crop_type"] == "Maize"
    # Ensure the AI Pricing Service actually populated a suggested price
    assert data["ai_suggested_price"] is not None
    assert data["ai_suggested_price"] > 0

def test_get_public_listings():
    """Test that anyone can view the available listings."""
    response = client.get("/api/v1/listings/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert data[0]["crop_type"] == "Maize"


# --- AI ENDPOINT TESTS ---
def test_public_market_prediction():
    """Test the public AI market prediction endpoint."""
    # Use dummy values (should not error, even if models are not present)
    response = client.get("/api/v1/analytics/predict/market", params={"crop_id": 0, "region_id": 1, "month": 7})
    assert response.status_code == 200
    data = response.json()
    assert "predicted_demand_kg" in data
    assert "estimated_price" in data
    assert "confidence" in data

def test_admin_ai_market_insight():
    """Test the admin AI market insight endpoint (requires admin login)."""
    # Register and login as admin (simulate by using farmer, since test DB is isolated)
    client.post(
        "/api/v1/auth/register",
        json={
            "phone": "0780000003",
            "full_name": "Test Admin",
            "password": "adminpassword",
            "role": "farmer"  # Use farmer for admin in test context
        }
    )
    login_res = client.post(
        "/api/v1/auth/login",
        data={"username": "0780000003", "password": "adminpassword"}
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/v1/analytics/ai-market-insight", params={"crop_id": 0, "region_id": 1}, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "estimated_price" in data
    assert "predicted_demand_kg" in data
    assert "confidence" in data

def test_unauthorized_listing_creation():
    """Ensure a user cannot post a listing without a token."""
    response = client.post(
        "/api/v1/listings/",
        json={"crop_type": "Beans", "quantity_kg": 50, "district": "Kigali", "asking_price": 500}
    )
    assert response.status_code == 401 # Unauthorized

def test_buyer_role_restriction():
    """Ensure a Buyer cannot access Farmer-only stats."""
    # 1. Register a Buyer
    client.post(
        "/api/v1/auth/register",
        json={
            "phone": "0780000002",
            "full_name": "Test Buyer",
            "password": "buyerpassword",
            "role": "buyer"
        }
    )
    # 2. Login as Buyer
    login_res = client.post(
        "/api/v1/auth/login",
        data={"username": "0780000002", "password": "buyerpassword"}
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 3. Attempt to access Farmer Stats
    response = client.get("/api/v1/farmers/stats", headers=headers)
    assert response.status_code == 403 # Forbidden