from fastapi import APIRouter

# Core routers (flat structure)
from app.api.v1.auth import router as auth_router
from app.api.v1.farmers import router as farmers_router
from app.api.v1.buyers import router as buyers_router
from app.api.v1.listings import router as listings_router
from app.api.v1.matching import router as matching_router
from app.api.v1.transactions import router as transactions_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.admin_audit_logs import router as admin_audit_logs_router
from app.api.v1.messages import router as messages_router

api_router = APIRouter()

# ================= AUTH =================
api_router.include_router(
    auth_router,
    prefix="/auth",
    tags=["Authentication"]
)

# ================= FARMERS =================
api_router.include_router(
    farmers_router,
    prefix="/farmers",
    tags=["Farmers"]
)

# ================= BUYERS =================
api_router.include_router(
    buyers_router,
    prefix="/buyers",
    tags=["Buyers"]
)

# ================= LISTINGS =================
api_router.include_router(
    listings_router,
    prefix="/listings",
    tags=["Listings"]
)

# ================= MATCHING / AI =================
api_router.include_router(
    matching_router,
    prefix="/matches",
    tags=["AI Matching"]
)

# ================= BARGAINING & MESSAGES =================
api_router.include_router(
    messages_router,
    prefix="/messages",
    tags=["Negotiation & Messaging"]
)

# ================= TRANSACTIONS =================
api_router.include_router(
    transactions_router,
    prefix="/transactions",
    tags=["Transactions"]
)

# ================= ANALYTICS =================
api_router.include_router(
    analytics_router,
    prefix="/analytics",
    tags=["Analytics"]
)

# ================= ADMIN =================
api_router.include_router(
    admin_audit_logs_router,
    prefix="/admin",
    tags=["Admin Audit"]
)
