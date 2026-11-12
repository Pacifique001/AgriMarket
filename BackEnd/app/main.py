from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from slowapi.middleware import SlowAPIMiddleware
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.core.database import Base, engine
# Explicitly import all models so Base has them registered
import app.models.user
import app.models.farmer
import app.models.buyer
import app.models.listing
import app.models.match
import app.models.transaction
import app.models.buyer_request
import app.models.audit_log
import app.models.message

from app.api.v1.api import api_router
from app.core.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure all tables exist in database
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        print(f"[WARN] Database metadata sync failed: {e}")
    yield


# --- Security: Rate Limiting ---
limiter = Limiter(key_func=get_remote_address,
                  default_limits=["100/minute", "1000/hour"])

app = FastAPI(title=settings.PROJECT_NAME, lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# --- Security: HTTP Headers Middleware ---


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Referrer-Policy"] = "no-referrer"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=()"
        response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload"
        docs_paths = {"/docs", "/docs/oauth2-redirect",
                      "/openapi.json", "/redoc"}
        if request.url.path in docs_paths:
            response.headers["Content-Security-Policy"] = (
                "default-src 'self'; "
                "img-src 'self' data: https:; "
                "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
                "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
                "font-src 'self' data: https://cdn.jsdelivr.net; "
                "connect-src 'self' https://cdn.jsdelivr.net"
            )
        else:
            response.headers["Content-Security-Policy"] = "default-src 'self'"
        return response


app.add_middleware(SecurityHeadersMiddleware)

app.add_middleware(SlowAPIMiddleware)

# --- Global Error Handler to guarantee CORS headers on 500 ---
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    import traceback
    traceback.print_exc()
    origin = request.headers.get("origin")
    headers = {}
    if origin:
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"
        headers["Access-Control-Allow-Headers"] = "*"
        headers["Access-Control-Allow-Methods"] = "*"
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal Server Error: {str(exc)}"},
        headers=headers,
    )

# --- Security: CORS Policy ---
# Keep this as the outermost middleware so CORS headers are added
# even when inner middleware/routes raise errors.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_origin_regex=r"^https?:\/\/.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

app.include_router(
    api_router,
    prefix=settings.API_V1_STR
)
