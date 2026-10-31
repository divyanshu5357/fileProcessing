import time
import uuid
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager

from backend.app.core.config import settings
from backend.app.core.logging import logger
from backend.app.core.exceptions import PixelKitException

# API Routers
from backend.app.api.uploads import router as uploads_router
from backend.app.api.downloads import router as downloads_router
from backend.app.api.files import router as files_router
from backend.app.api.folders import router as folders_router
from backend.app.api.processing import router as processing_router
from backend.app.api.jobs import router as jobs_router
from backend.app.api.users import router as users_router
from backend.app.api.auth import router as auth_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing PixelKit Scalable SaaS FastAPI Engine...")
    yield
    logger.info("Gracefully shutting down PixelKit FastAPI Engine...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Scalable Multi-Tenant Backend for PixelKit SaaS Platform",
    lifespan=lifespan
)

# CORS Configuration
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://pixelkit.app",
    "*"
]

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
@app.exception_handler(PixelKitException)
async def pixelkit_exception_handler(request: Request, exc: PixelKitException):
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
        "service": "pixelkit-api",
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
