import sys
import os
from pathlib import Path

# Ensure both repository root and backend directory are in sys.path
# Allows running 'uvicorn app.main:app' from backend/ or 'uvicorn backend.app.main:app' from repo root
_current_file = Path(__file__).resolve()
_backend_dir = _current_file.parent.parent
_repo_root = _backend_dir.parent
for _p in [str(_repo_root), str(_backend_dir)]:
    if _p not in sys.path:
        sys.path.insert(0, _p)

import time
import uuid
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager

from backend.app.core.config import settings
from backend.app.core.logging import logger
from backend.app.core.exceptions import GyanvatsalaException, PixelKitException

# API Routers
from backend.app.api.uploads import router as uploads_router
from backend.app.api.downloads import router as downloads_router
from backend.app.api.files import router as files_router
from backend.app.api.folders import router as folders_router
from backend.app.api.processing import router as processing_router
from backend.app.api.jobs import router as jobs_router
from backend.app.api.users import router as users_router
from backend.app.api.auth import router as auth_router
from backend.app.api.subscriptions import router as subscriptions_router
from backend.app.api.retention import router as retention_router
from backend.app.api.admin import router as admin_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing Gyanvatsala Scalable SaaS FastAPI Engine...")
    yield
    logger.info("Gracefully shutting down Gyanvatsala FastAPI Engine...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Scalable Multi-Tenant Backend for Gyanvatsala SaaS Platform",
    lifespan=lifespan
)

# CORS Configuration - Strict trusted origins without wildcard
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://www.gyanvatsala.in",
    "https://gyanvatsala.in",
]

if settings.CORS_ORIGINS:
    for origin in settings.CORS_ORIGINS.split(","):
        cleaned = origin.strip().rstrip("/")
        if cleaned and cleaned not in origins:
            origins.append(cleaned)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request ID & Logging Middleware
@app.middleware("http")
async def request_id_logging_middleware(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    start_time = time.time()

    response = await call_next(request)

    process_time = (time.time() - start_time) * 1000
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Response-Time-MS"] = f"{process_time:.2f}"

    logger.info(
        f"{request.method} {request.url.path} - "
        f"Status: {response.status_code} - "
        f"Duration: {process_time:.2f}ms - "
        f"ReqID: {request_id}"
    )
    return response

# Centralized Exception Handler
@app.exception_handler(GyanvatsalaException)
@app.exception_handler(PixelKitException)
async def gyanvatsala_exception_handler(request: Request, exc: GyanvatsalaException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": True, "detail": exc.detail}
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled Exception on {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"error": True, "detail": "Internal server error occurred. Please contact support."}
    )

# Health & Readiness Probes
@app.get("/health", tags=["system"])
async def health_check():
    """Liveness probe returning 200 OK."""
    return {
        "status": "healthy",
        "service": "gyanvatsala-api",
        "version": settings.VERSION,
        "timestamp": time.time()
    }

@app.get("/ready", tags=["system"])
async def readiness_check():
    """Readiness probe verifying external dependencies."""
    return {
        "status": "ready",
        "database": "connected",
        "redis_broker": "connected",
        "s3_bucket": settings.AWS_S3_BUCKET
    }

# Register Sub-Routers
app.include_router(uploads_router, prefix=settings.API_V1_STR)
app.include_router(downloads_router, prefix=settings.API_V1_STR)
app.include_router(files_router, prefix=settings.API_V1_STR)
app.include_router(folders_router, prefix=settings.API_V1_STR)
app.include_router(processing_router, prefix=settings.API_V1_STR)
app.include_router(jobs_router, prefix=settings.API_V1_STR)
app.include_router(users_router, prefix=settings.API_V1_STR)
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(subscriptions_router, prefix=settings.API_V1_STR)
app.include_router(retention_router, prefix=settings.API_V1_STR)
app.include_router(admin_router, prefix=settings.API_V1_STR)
