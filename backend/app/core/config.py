from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
import os
from pathlib import Path

# Locate root .env / .env.local if available
ROOT_DIR = Path(__file__).resolve().parent.parent.parent.parent
env_files = [str(ROOT_DIR / ".env.local"), str(ROOT_DIR / ".env")]

class Settings(BaseSettings):
    PROJECT_NAME: str = "Gyanvatsala Cloud SaaS Backend"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    ENVIRONMENT: str = os.getenv("NODE_ENV", "development")
    CORS_ORIGINS: str = Field(default="", description="Comma-separated additional allowed CORS origins")

    # Neon Serverless PostgreSQL
    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/gyanvatsala",
        description="Neon pooled connection string for high-concurrency API"
    )
    DATABASE_URL_UNPOOLED: str = Field(
        default="",
        description="Neon unpooled direct connection string for schema migrations"
    )

    # Auth & Security
    BETTER_AUTH_SECRET: str = Field(
        default="gyanvatsala_super_secret_auth_key_must_be_at_least_32_characters_long",
        description="Secret key shared with Better Auth"
    )
    INTERNAL_SERVICE_KEY: str = Field(
        default="gyanvatsala_super_secret_internal_key_must_be_at_least_32_chars_long",
        description="Internal service key for Next.js to FastAPI secure inter-service communication"
    )
    WEBHOOK_SECRET: str = Field(
        default="gyanvatsala_webhook_super_secret_key_2026",
        description="Secret key for verifying payment provider webhooks"
    )
    ADMIN_EMAILS: str = Field(
        default="",
        description="Comma-separated authorized administrator email addresses (configured via environment or DB)"
    )
    SUPPORT_EMAILS: str = Field(
        default="support@gyanvatsala.in,help@gyanvatsala.in",
        description="Comma-separated authorized support staff email addresses"
    )

    # AWS / Neon S3 Storage Architecture
    AWS_ENDPOINT_URL_S3: str = Field(default="", description="Custom S3 endpoint for Neon / Cloudflare R2 / MinIO")
    AWS_ACCESS_KEY_ID: str = Field(default="mock_access_key", description="AWS / Neon S3 Access Key")
    AWS_SECRET_ACCESS_KEY: str = Field(default="mock_secret_key", description="AWS / Neon S3 Secret Key")
    AWS_REGION: str = Field(default="us-east-2", description="AWS / Neon S3 Bucket Region")
    AWS_S3_BUCKET: str = Field(default="gyanvatsala-storage", description="Private S3 Bucket Name")
    S3_PRESIGNED_URL_EXPIRES_SECONDS: int = 900  # 15 minutes
    S3_MULTIPART_MIN_CHUNK_SIZE_MB: int = 5

    # Redis & Celery Background Processing
    REDIS_URL: str = Field(default="redis://localhost:6379/0", description="Redis broker URL")
    CELERY_RESULT_BACKEND: str = Field(default="redis://localhost:6379/1", description="Celery results")
    CELERY_WORKER_CONCURRENCY: int = 4

    # Freemium Plan Limits in Bytes
    FREE_STORAGE_LIMIT_BYTES: int = 15728640          # 15 MB
    FREE_MAX_FILE_SIZE_BYTES: int = 15728640          # 15 MB
    FREE_RETENTION_DAYS: int = 7

    PRIME_STORAGE_LIMIT_BYTES: int = 52428800         # 50 MB
    PRIME_MAX_FILE_SIZE_BYTES: int = 26214400         # 25 MB
    PRIME_RETENTION_DAYS: int = 14

    PRIME_PLUS_STORAGE_LIMIT_BYTES: int = 104857600    # 100 MB
    PRIME_PLUS_MAX_FILE_SIZE_BYTES: int = 52428800    # 50 MB
    PRIME_PLUS_RETENTION_DAYS: int = 30

    PRIME_ULTRA_STORAGE_LIMIT_BYTES: int = 524288000   # 500 MB
    PRIME_ULTRA_MAX_FILE_SIZE_BYTES: int = 104857600  # 100 MB
    PRIME_ULTRA_RETENTION_DAYS: int = 365

    # Backwards compatibility defaults
    DEFAULT_STORAGE_LIMIT_BYTES: int = 15728640
    DEFAULT_MAX_FILE_SIZE_BYTES: int = 15728640

    model_config = SettingsConfigDict(
        env_file=env_files,
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
