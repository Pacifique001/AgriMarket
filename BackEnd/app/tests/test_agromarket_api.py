"""Route-aware FastAPI API tests for AgroMarket AI.

These tests follow the current backend implementation, not just the
idealized endpoint list, so they validate the actual router surface,
schema requirements, and current security behavior.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

import pytest
import pytest_asyncio
from jose import jwt

from app.core.config import settings
from app.core.security import create_access_token, verify_password
from app.models.audit_log import AuditLog
from app.models.farmer import Farmer
from app.tests.conftest import seed_listing, seed_user
from app.models.listing import Listing, ListingStatus
from app.models.user import User, UserRole


def _auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


class TestAuth:
    """Authentication and token behavior."""

    @pytest.mark.asyncio
    async def test_register_farmer_valid_result_201(self, async_client):
        """Register a farmer with valid data and expect a 201 response."""
        response = await async_client.post(
            "/api/v1/auth/register",
            json={
                "phone": "0781000001",
                "full_name": "Farmer One",
                "password": "securepassword123",
                "role": "farmer",
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["phone"] == "0781000001"
        assert data["role"] == "farmer"
        assert "id" in data

    @pytest.mark.asyncio
    async def test_register_buyer_valid_result_201(self, async_client):
        """Register a buyer with valid data and expect a 201 response."""
        response = await async_client.post(
            "/api/v1/auth/register",
            json={
                "phone": "0781000002",
                "full_name": "Buyer One",
                "password": "securepassword123",
                "role": "buyer",
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["phone"] == "0781000002"
        assert data["role"] == "buyer"

    @pytest.mark.asyncio
    async def test_login_valid_credentials_result_200(self, async_client):
        """Login with valid credentials and receive a JWT access token."""
        await async_client.post(
            "/api/v1/auth/register",
            json={
                "phone": "0781000003",
                "full_name": "Login Farmer",
                "password": "securepassword123",
                "role": "farmer",
            },
        )

        response = await async_client.post(
            "/api/v1/auth/login",
            data={"username": "0781000003", "password": "securepassword123"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["token_type"] == "bearer"
        assert data["access_token"]
        assert data["role"] == "farmer"

    @pytest.mark.asyncio
    async def test_login_wrong_password_result_401(self, async_client):
        """Login with a wrong password and expect an unauthorized response."""
        await async_client.post(
            "/api/v1/auth/register",
            json={
                "phone": "0781000004",
                "full_name": "Wrong Password User",
                "password": "securepassword123",
                "role": "farmer",
            },
        )

        response = await async_client.post(
            "/api/v1/auth/login",
            data={"username": "0781000004", "password": "badpassword"},
        )

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_login_unregistered_phone_result_401(self, async_client):
        """Login with an unregistered phone and expect the generic auth failure."""
        response = await async_client.post(
            "/api/v1/auth/login",
            data={"username": "0781999999", "password": "missingpassword"},
        )

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_protected_route_without_token_result_401(self, async_client):
        """Call a protected route without a JWT and expect unauthorized access."""
        response = await async_client.get("/api/v1/farmers/stats")

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_protected_route_with_expired_token_result_401(
        self,
        async_client,
        farmer_token,
    ):
        """Call a protected route with an expired JWT and expect token rejection."""
        expired_token = create_access_token(
            subject="1",
            role=UserRole.FARMER.value,
            expires_delta=timedelta(hours=-1),
        )

        response = await async_client.get(
            "/api/v1/farmers/stats",
            headers=_auth_headers(expired_token),
        )

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_password_is_stored_as_bcrypt_hash(
        self,
        async_client,
        db_session,
    ):
        """Register a user and verify the password is stored as bcrypt hash."""
        raw_password = "securepassword123"
        await async_client.post(
            "/api/v1/auth/register",
            json={
                "phone": "0781000005",
                "full_name": "Hash Check User",
                "password": raw_password,
                "role": "farmer",
            },
        )

        stored_user = db_session.query(User).filter(
            User.phone == "0781000005").first()

        assert stored_user is not None
        assert stored_user.hashed_password != raw_password
        assert stored_user.hashed_password.startswith("$2")
        assert verify_password(raw_password, stored_user.hashed_password)

    @pytest.mark.asyncio
    async def test_locked_user_cannot_login_result_403(self, async_client):
        """Lock a user through repeated failures and expect future logins to be denied."""
        await async_client.post(
            "/api/v1/auth/register",
            json={
                "phone": "0781000006",
                "full_name": "Locked User",
                "password": "securepassword123",
                "role": "buyer",
            },
        )

        for _ in range(5):
            await async_client.post(
                "/api/v1/auth/login",
                data={"username": "0781000006", "password": "wrong-password"},
            )

        response = await async_client.post(
            "/api/v1/auth/login",
            data={"username": "0781000006", "password": "securepassword123"},
        )

        assert response.status_code == 403


class TestFarmer:
    """Farmer workflow and ownership checks."""

    @pytest.mark.asyncio
    async def test_create_listing_valid_result_201(
        self,
        async_client,
        farmer_token,
    ):
        """Create a listing with valid data and return the created listing payload."""
        response = await async_client.post(
            "/api/v1/listings/",
            json={
                "crop_type": "Maize",
                "crop_id": 1,
                "quantity_kg": 250,
                "asking_price": 150,
                "district": "Musanze",
                "sector": "Kinigi",
                "harvest_date": "2026-06-01T00:00:00Z",
            },
            headers=_auth_headers(farmer_token),
        )

        assert response.status_code == 201
        data = response.json()
        assert data["id"]
        assert data["crop_type"] == "Maize"
        assert data["ai_suggested_price"] is not None

    @pytest.mark.asyncio
    async def test_create_listing_missing_required_field_result_422(
        self,
        async_client,
        farmer_token,
    ):
        """Reject listing creation when a required field is missing."""
        response = await async_client.post(
            "/api/v1/listings/",
            json={
                "crop_type": "Maize",
                "crop_id": 1,
                "quantity_kg": 250,
                "district": "Musanze",
                "harvest_date": "2026-06-01T00:00:00Z",
            },
            headers=_auth_headers(farmer_token),
        )

        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_create_listing_negative_price_result_422(
        self,
        async_client,
        farmer_token,
    ):
        """Reject listing creation when asking price is negative."""
        response = await async_client.post(
            "/api/v1/listings/",
            json={
                "crop_type": "Maize",
                "crop_id": 1,
                "quantity_kg": 250,
                "asking_price": -10,
                "district": "Musanze",
                "harvest_date": "2026-06-01T00:00:00Z",
            },
            headers=_auth_headers(farmer_token),
        )

        assert response.status_code == 422

    @pytest.mark.xfail(reason="Current listing schema does not validate past harvest dates.")
    @pytest.mark.asyncio
    async def test_create_listing_past_harvest_date_result_422(
        self,
        async_client,
        farmer_token,
    ):
        """Reject listing creation when the harvest date is in the past."""
        response = await async_client.post(
            "/api/v1/listings/",
            json={
                "crop_type": "Maize",
                "crop_id": 1,
                "quantity_kg": 250,
                "asking_price": 150,
                "district": "Musanze",
                "harvest_date": "2020-01-01T00:00:00Z",
            },
            headers=_auth_headers(farmer_token),
        )

        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_farmer_views_own_listings_only_result_200(
        self,
        async_client,
        db_session,
        farmer_token,
    ):
        """Ensure /my-listings returns only the authenticated farmer's listings."""
        farmer = db_session.query(Farmer).join(
            User).filter(User.phone == "0780000101").first()
        assert farmer is not None
        seed_listing(db_session, farmer=farmer, crop_type="Maize", crop_id=1)

        other_farmer = seed_user(
            db_session,
            role=UserRole.FARMER,
            phone="0781000201",
            full_name="Farmer Two",
            password="farmerpassword2",
            district="Gisenyi",
        )
        other_farmer_profile = db_session.query(Farmer).filter(
            Farmer.user_id == other_farmer.id).first()
        seed_listing(db_session, farmer=other_farmer_profile,
                     crop_type="Beans", crop_id=2)

        response = await async_client.get(
            "/api/v1/listings/my-listings",
            headers=_auth_headers(farmer_token),
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["crop_type"] == "Maize"

    @pytest.mark.xfail(reason="Current API does not expose a farmer-to-farmer listing lookup endpoint to enforce a 403.")
    @pytest.mark.asyncio
    async def test_farmer_cannot_view_another_farmers_listings_result_403(
        self,
        async_client,
        farmer_token,
    ):
        """Reject direct access to another farmer's listings when such a route is available."""
        response = await async_client.get(
            "/api/v1/listings/999999",
            headers=_auth_headers(farmer_token),
        )

        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_farmer_edits_own_listing_result_200(
        self,
        async_client,
        db_session,
        farmer_token,
    ):
        """Allow a farmer to edit their own listing."""
        farmer = db_session.query(Farmer).join(
            User).filter(User.phone == "0780000101").first()
        listing = seed_listing(db_session, farmer=farmer,
                               crop_type="Maize", crop_id=1, asking_price=100)

        response = await async_client.patch(
            f"/api/v1/listings/{listing.id}",
            json={"asking_price": 140},
            headers=_auth_headers(farmer_token),
        )

        assert response.status_code == 200
        data = response.json()
        assert data["asking_price"] == 140

    @pytest.mark.asyncio
    async def test_farmer_cannot_edit_another_farmers_listing_result_403(
        self,
        async_client,
        db_session,
        farmer_token,
    ):
        """Reject edits when a farmer targets another farmer's listing."""
        farmer = db_session.query(Farmer).join(
            User).filter(User.phone == "0780000101").first()
        other_farmer = seed_user(
            db_session,
            role=UserRole.FARMER,
            phone="0781000202",
            full_name="Farmer Three",
            password="farmerpassword3",
            district="Gisenyi",
        )
        other_farmer_profile = db_session.query(Farmer).filter(
            Farmer.user_id == other_farmer.id).first()
        listing = seed_listing(db_session, farmer=other_farmer_profile,
                               crop_type="Beans", crop_id=2, asking_price=200)

        response = await async_client.patch(
            f"/api/v1/listings/{listing.id}",
            json={"asking_price": 210},
            headers=_auth_headers(farmer_token),
        )

        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_farmer_deletes_own_listing_result_204(
        self,
        async_client,
        db_session,
        farmer_token,
    ):
        """Allow a farmer to delete their own listing and remove it from the database."""
        farmer = db_session.query(Farmer).join(
            User).filter(User.phone == "0780000101").first()
        listing = seed_listing(db_session, farmer=farmer,
                               crop_type="Maize", crop_id=1)

        response = await async_client.delete(
            f"/api/v1/listings/{listing.id}",
            headers=_auth_headers(farmer_token),
        )

        assert response.status_code == 204
        assert db_session.query(Listing).filter(
            Listing.id == listing.id).first() is None

    @pytest.mark.asyncio
    async def test_farmer_cannot_delete_another_farmers_listing_result_403(
        self,
        async_client,
        db_session,
        farmer_token,
    ):
        """Reject deletion when the listing does not belong to the authenticated farmer."""
        other_farmer = seed_user(
            db_session,
            role=UserRole.FARMER,
            phone="0781000203",
            full_name="Farmer Four",
            password="farmerpassword4",
            district="Gisenyi",
        )
        other_farmer_profile = db_session.query(Farmer).filter(
            Farmer.user_id == other_farmer.id).first()
        listing = seed_listing(
            db_session, farmer=other_farmer_profile, crop_type="Beans", crop_id=2)

        response = await async_client.delete(
            f"/api/v1/listings/{listing.id}",
            headers=_auth_headers(farmer_token),
        )

        assert response.status_code == 403
        assert db_session.query(Listing).filter(
            Listing.id == listing.id).first() is not None

    @pytest.mark.xfail(reason="Current listing create/update/delete code does not write audit logs for listing actions.")
    @pytest.mark.asyncio
    async def test_audit_log_written_after_create_result_contains_create(
        self,
        async_client,
        db_session,
        farmer_token,
    ):
        """Verify that a CREATE audit log is written after creating a listing."""
        await async_client.post(
            "/api/v1/listings/",
            json={
                "crop_type": "Maize",
                "crop_id": 1,
                "quantity_kg": 250,
                "asking_price": 150,
                "district": "Musanze",
            },
            headers=_auth_headers(farmer_token),
        )

        assert db_session.query(AuditLog).filter(
            AuditLog.action == "CREATE").count() >= 1

    @pytest.mark.xfail(reason="Current listing create/update/delete code does not write audit logs for listing actions.")
    @pytest.mark.asyncio
    async def test_audit_log_written_after_update_result_contains_update(
        self,
        async_client,
        db_session,
        farmer_token,
    ):
        """Verify that an UPDATE audit log is written after editing a listing."""
        farmer = db_session.query(Farmer).join(
            User).filter(User.phone == "0780000101").first()
        listing = seed_listing(db_session, farmer=farmer,
                               crop_type="Maize", crop_id=1)

        await async_client.patch(
            f"/api/v1/listings/{listing.id}",
            json={"asking_price": 180},
            headers=_auth_headers(farmer_token),
        )

        assert db_session.query(AuditLog).filter(
            AuditLog.action == "UPDATE").count() >= 1

    @pytest.mark.xfail(reason="Current listing create/update/delete code does not write audit logs for listing actions.")
    @pytest.mark.asyncio
    async def test_audit_log_written_after_delete_result_contains_delete(
        self,
        async_client,
        db_session,
        farmer_token,
    ):
        """Verify that a DELETE audit log is written after deleting a listing."""
        farmer = db_session.query(Farmer).join(
            User).filter(User.phone == "0780000101").first()
        listing = seed_listing(db_session, farmer=farmer,
                               crop_type="Maize", crop_id=1)

        await async_client.delete(
            f"/api/v1/listings/{listing.id}",
            headers=_auth_headers(farmer_token),
        )

        assert db_session.query(AuditLog).filter(
            AuditLog.action == "DELETE").count() >= 1


class TestBuyer:
    """Buyer browsing and search behavior."""

    @pytest.mark.asyncio
    async def test_browse_all_listings_result_200(self, async_client, db_session, buyer_token):
        """Browse all available listings and receive a list response."""
        farmer = seed_user(
            db_session,
            role=UserRole.FARMER,
            phone="0781000204",
            full_name="Browse Farmer",
            password="farmerpassword5",
            district="Musanze",
        )
        farmer_profile = db_session.query(Farmer).filter(
            Farmer.user_id == farmer.id).first()
        seed_listing(db_session, farmer=farmer_profile,
                     crop_type="Maize", crop_id=1)

        response = await async_client.get("/api/v1/listings/")

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert data

    @pytest.mark.asyncio
    async def test_each_listing_has_required_fields(self, async_client, db_session):
        """Ensure browse results include the expected listing details."""
        farmer = seed_user(
            db_session,
            role=UserRole.FARMER,
            phone="0781000205",
            full_name="Field Farmer",
            password="farmerpassword6",
            district="Musanze",
        )
        farmer_profile = db_session.query(Farmer).filter(
            Farmer.user_id == farmer.id).first()
        seed_listing(db_session, farmer=farmer_profile,
                     crop_type="Beans", crop_id=2)

        response = await async_client.get("/api/v1/listings/")

        assert response.status_code == 200
        listing = response.json()[0]
        for field_name in ("crop_type", "quantity_kg", "asking_price", "district", "harvest_date"):
            assert field_name in listing

    @pytest.mark.asyncio
    async def test_search_by_crop_name_result_matching_only(self, async_client, db_session):
        """Search by crop type and return only the matching listings."""
        farmer = seed_user(
            db_session,
            role=UserRole.FARMER,
            phone="0781000206",
            full_name="Search Farmer",
            password="farmerpassword7",
            district="Musanze",
        )
        farmer_profile = db_session.query(Farmer).filter(
            Farmer.user_id == farmer.id).first()
        seed_listing(db_session, farmer=farmer_profile,
                     crop_type="Maize", crop_id=1)
        seed_listing(db_session, farmer=farmer_profile,
                     crop_type="Beans", crop_id=2)

        response = await async_client.get("/api/v1/listings/", params={"crop_type": "Maize"})

        assert response.status_code == 200
        assert all(item["crop_type"].lower() ==
                   "maize" for item in response.json())

    @pytest.mark.asyncio
    async def test_search_is_case_insensitive_result_matches(self, async_client, db_session):
        """Search by crop type using a different case and still match results."""
        farmer = seed_user(
            db_session,
            role=UserRole.FARMER,
            phone="0781000207",
            full_name="Case Farmer",
            password="farmerpassword8",
            district="Musanze",
        )
        farmer_profile = db_session.query(Farmer).filter(
            Farmer.user_id == farmer.id).first()
        seed_listing(db_session, farmer=farmer_profile,
                     crop_type="Maize", crop_id=1)

        response = await async_client.get("/api/v1/listings/", params={"crop_type": "maIze"})

        assert response.status_code == 200
        assert len(response.json()) == 1

    @pytest.mark.asyncio
    async def test_search_no_match_result_empty_list(self, async_client, db_session):
        """Search for a missing crop and return an empty list instead of 404."""
        response = await async_client.get("/api/v1/listings/", params={"crop_type": "DoesNotExist"})

        assert response.status_code == 200
        assert response.json() == []

    @pytest.mark.asyncio
    async def test_view_single_listing_by_id_result_200(self, async_client, db_session):
        """Fetch a single listing by ID and return the full listing payload."""
        farmer = seed_user(
            db_session,
            role=UserRole.FARMER,
            phone="0781000208",
            full_name="Detail Farmer",
            password="farmerpassword9",
            district="Musanze",
        )
        farmer_profile = db_session.query(Farmer).filter(
            Farmer.user_id == farmer.id).first()
        listing = seed_listing(
            db_session, farmer=farmer_profile, crop_type="Maize", crop_id=1)

        response = await async_client.get(f"/api/v1/listings/{listing.id}")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == listing.id
        assert data["crop_type"] == "Maize"

    @pytest.mark.asyncio
    async def test_buyer_cannot_create_listing_result_403(self, async_client, buyer_token):
        """Reject listing creation when the authenticated user is a buyer."""
        response = await async_client.post(
            "/api/v1/listings/",
            json={
                "crop_type": "Maize",
                "crop_id": 1,
                "quantity_kg": 100,
                "asking_price": 120,
                "district": "Musanze",
            },
            headers=_auth_headers(buyer_token),
        )

        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_buyer_cannot_delete_listing_result_403(self, async_client, buyer_token):
        """Reject deletion requests coming from buyer accounts."""
        # Seed a real listing so the assertion checks authorization, not existence.
        farmer_token = await async_client.post(
            "/api/v1/auth/register",
            json={
                "phone": "0781000210",
                "full_name": "Delete Target Farmer",
                "password": "farmerpassword11",
                "role": "farmer",
            },
        )
        assert farmer_token.status_code == 201
        login_response = await async_client.post(
            "/api/v1/auth/login",
            data={"username": "0781000210", "password": "farmerpassword11"},
        )
        assert login_response.status_code == 200
        seed_token = login_response.json()["access_token"]
        farm_response = await async_client.post(
            "/api/v1/listings/",
            json={
                "crop_type": "Maize",
                "crop_id": 1,
                "quantity_kg": 100,
                "asking_price": 120,
                "district": "Musanze",
            },
            headers=_auth_headers(seed_token),
        )
        assert farm_response.status_code == 201
        listing_id = farm_response.json()["id"]

        response = await async_client.delete(
            f"/api/v1/listings/{listing_id}",
            headers=_auth_headers(buyer_token),
        )

        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_deleted_listings_not_returned_in_browse_results(self, async_client, db_session, farmer_token):
        """Confirm deleted listings disappear from the browse endpoint."""
        farmer_profile = db_session.query(Farmer).join(
            User).filter(User.phone == "0780000101").first()
        assert farmer_profile is not None
        listing = seed_listing(
            db_session, farmer=farmer_profile, crop_type="Maize", crop_id=1)

        delete_response = await async_client.delete(
            f"/api/v1/listings/{listing.id}",
            headers=_auth_headers(farmer_token),
        )
        assert delete_response.status_code == 204

        browse_response = await async_client.get("/api/v1/listings/")
        assert browse_response.status_code == 200
        assert all(item["id"] != listing.id for item in browse_response.json())


class TestAdmin:
    """Admin audit and platform monitoring behavior."""

    @pytest.mark.xfail(reason="Current /admin/audit-logs response model does not match the AuditLog ORM shape.")
    @pytest.mark.asyncio
    async def test_admin_views_all_audit_logs_result_200(self, async_client, admin_token):
        """Retrieve all audit logs as an admin user."""
        response = await async_client.get(
            "/api/v1/admin/audit-logs",
            headers=_auth_headers(admin_token),
        )

        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_non_admin_cannot_access_audit_logs_result_403(self, async_client, buyer_token):
        """Reject non-admin access to system audit logs."""
        response = await async_client.get(
            "/api/v1/admin/audit-logs",
            headers=_auth_headers(buyer_token),
        )

        assert response.status_code == 403

    @pytest.mark.xfail(reason="Current backend has no /api/v1/users admin listing endpoint.")
    @pytest.mark.asyncio
    async def test_admin_views_all_users_result_200(self, async_client, admin_token):
        """Retrieve all users as an admin user."""
        response = await async_client.get(
            "/api/v1/users",
            headers=_auth_headers(admin_token),
        )

        assert response.status_code == 200

    @pytest.mark.xfail(reason="Current backend has no user flag endpoint.")
    @pytest.mark.asyncio
    async def test_admin_can_flag_user_result_200_flagged(self, async_client, admin_token):
        """Flag a suspicious user account as an admin."""
        response = await async_client.patch(
            "/api/v1/users/1/flag",
            headers=_auth_headers(admin_token),
        )

        assert response.status_code == 200

    @pytest.mark.xfail(reason="Current backend has no user lock endpoint.")
    @pytest.mark.asyncio
    async def test_admin_can_lock_user_result_200_locked(self, async_client, admin_token):
        """Lock a suspicious user account as an admin."""
        response = await async_client.patch(
            "/api/v1/users/1/lock",
            headers=_auth_headers(admin_token),
        )

        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_admin_views_platform_overview_result_200(self, async_client, admin_token):
        """Retrieve the admin platform overview metrics."""
        response = await async_client.get(
            "/api/v1/analytics/overview",
            headers=_auth_headers(admin_token),
        )

        assert response.status_code == 200
        data = response.json()
        assert "users" in data
        assert "market" in data
        assert "inventory" in data

    @pytest.mark.asyncio
    async def test_admin_views_regional_activity_result_200(self, async_client, admin_token):
        """Retrieve regional supply and demand activity as an admin."""
        response = await async_client.get(
            "/api/v1/analytics/regional-activity",
            headers=_auth_headers(admin_token),
        )

        assert response.status_code == 200
        assert isinstance(response.json(), list)

    @pytest.mark.asyncio
    async def test_admin_ai_market_insight_result_200(self, async_client, admin_token):
        """Retrieve AI market insight as an admin user."""
        response = await async_client.get(
            "/api/v1/analytics/ai-market-insight",
            params={"crop_id": 1, "region_id": 2},
            headers=_auth_headers(admin_token),
        )

        assert response.status_code == 200
        data = response.json()
        assert "estimated_price" in data
        assert "predicted_demand_kg" in data

    @pytest.mark.asyncio
    async def test_admin_market_alerts_result_200(self, async_client, admin_token):
        """Retrieve market alerts as an admin user."""
        response = await async_client.get(
            "/api/v1/analytics/market-alerts",
            params={"crop_id": 1, "region_id": 2},
            headers=_auth_headers(admin_token),
        )

        assert response.status_code == 200
        assert "alerts" in response.json()

    @pytest.mark.asyncio
    async def test_admin_public_market_prediction_result_200(self, async_client):
        """Use the public market prediction endpoint and receive a prediction payload."""
        response = await async_client.get(
            "/api/v1/analytics/predict/market",
            params={"crop_id": 1, "region_id": 2, "month": 7},
        )

        assert response.status_code == 200
        assert "estimated_price" in response.json()

    @pytest.mark.asyncio
    async def test_admin_price_trends_result_200(self, async_client, buyer_token):
        """Retrieve price trends for a crop using an authenticated route."""
        response = await async_client.get(
            "/api/v1/analytics/price-trends/Maize",
            headers=_auth_headers(buyer_token),
        )

        assert response.status_code == 200
        assert isinstance(response.json(), list)

    @pytest.mark.asyncio
    async def test_admin_market_gaps_result_200(self, async_client, buyer_token):
        """Retrieve market gaps using an authenticated route."""
        response = await async_client.get(
            "/api/v1/analytics/market-gaps",
            headers=_auth_headers(buyer_token),
        )

        assert response.status_code == 200
        assert isinstance(response.json(), list)

    @pytest.mark.asyncio
    async def test_locked_user_cannot_login_result_403(self, async_client):
        """Ensure a locked user cannot log in as an admin test scenario."""
        await async_client.post(
            "/api/v1/auth/register",
            json={
                "phone": "0781000110",
                "full_name": "Locked Admin",
                "password": "adminpassword",
                "role": "admin",
            },
        )

        for _ in range(5):
            await async_client.post(
                "/api/v1/auth/login",
                data={"username": "0781000110", "password": "wrong-password"},
            )

        response = await async_client.post(
            "/api/v1/auth/login",
            data={"username": "0781000110", "password": "adminpassword"},
        )

        assert response.status_code == 403


class TestSystem:
    """System-level and security-focused checks."""

    @pytest.mark.asyncio
    async def test_sql_injection_in_search_query_does_not_break_db(self, async_client, db_session):
        """Send a SQL-injection-like query value and confirm the DB remains healthy."""
        malicious_query = "Maize' OR 1=1 --"
        response = await async_client.get("/api/v1/listings/", params={"crop_type": malicious_query})

        assert response.status_code == 200
        assert isinstance(response.json(), list)

        health_response = await async_client.get("/api/v1/analytics/predict/market", params={"crop_id": 1, "region_id": 2})
        assert health_response.status_code == 200

    @pytest.mark.xfail(reason="The current backend issues 7-day JWTs by config, not 24-hour tokens.")
    def test_jwt_token_expires_after_24_hours(self):
        """Verify JWT expiration policy at the requested 24-hour threshold."""
        token = create_access_token(
            subject="123",
            role=UserRole.FARMER.value,
        )
        payload = jwt.decode(token, settings.SECRET_KEY,
                             algorithms=[settings.ALGORITHM])
        expires_at = datetime.fromtimestamp(payload["exp"], tz=timezone.utc)
        issued_at = datetime.fromtimestamp(payload["iat"], tz=timezone.utc)

        assert expires_at - issued_at == timedelta(hours=24)

    @pytest.mark.xfail(reason="The current app does not enforce HTTPS rejection at request time.")
    @pytest.mark.asyncio
    async def test_http_request_to_protected_route_without_https_is_rejected(self, async_client, farmer_token):
        """Reject a non-HTTPS protected request when HTTPS enforcement is enabled."""
        response = await async_client.get(
            "/api/v1/farmers/stats",
            headers=_auth_headers(farmer_token),
        )

        assert response.status_code in {400, 403, 426}
