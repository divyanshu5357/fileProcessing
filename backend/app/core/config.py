from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
import os
from pathlib import Path

# Locate root .env / .env.local if available
ROOT_DIR = Path(__file__).resolve().parent.parent.parent.parent
env_files = [str(ROOT_DIR / ".env.local"), str(ROOT_DIR / ".env")]

class Settings(BaseSettings):
    PROJECT_NAME: str = "PixelKit Cloud SaaS Backend"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    ENVIRONMENT: str = os.getenv("NODE_ENV", "development")

    # Neon Serverless PostgreSQL
    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/pixelkit",
        description="Neon pooled connection string for high-concurrency API"
    )
    DATABASE_URL_UNPOOLED: str = Field(
        default="",
        description="Neon unpooled direct connection string for schema migrations"
    )

    # Auth & Security
    BETTER_AUTH_SECRET: str = Field(
        default="pixelkit_super_secret_auth_key_must_be_at_least_32_characters_long",
        description="Secret key shared with Better Auth"
    )

    # AWS S3 Storage Architecture
    AWS_ACCESS_KEY_ID: str = Field(default="mock_access_key", description="AWS S3 Access Key")
    AWS_SECRET_ACCESS_KEY: str = Field(default="mock_secret_key", description="AWS S3 Secret Key")
    AWS_REGION: str = Field(default="us-east-1", description="AWS S3 Bucket Region")
    AWS_S3_BUCKET: str = Field(default="pixelkit-storage", description="Private AWS S3 Bucket Name")
    S3_PRESIGNED_URL_EXPIRES_SECONDS: int = 900  # 15 minutes
    S3_MULTIPART_MIN_CHUNK_SIZE_MB: int = 5

    # Redis & Celery Background Processing
    REDIS_URL: str = Field(default="redis://localhost:6379/0", description="Redis broker URL")
    CELERY_RESULT_BACKEND: str = Field(default="redis://localhost:6379/1", description="Celery results")
    CELERY_WORKER_CONCURRENCY: int = 4

    # Storage Quotas
    DEFAULT_STORAGE_LIMIT_BYTES: int = 524288000       # 500 MB (Free tier default)
    DEFAULT_MAX_FILE_SIZE_BYTES: int = 52428800       # 50 MB
    PRO_STORAGE_LIMIT_BYTES: int = 26843545600        # 25 GB
    PRO_MAX_FILE_SIZE_BYTES: int = 1073741824         # 1 GB
    BUSINESS_STORAGE_LIMIT_BYTES: int = 107374182400  # 100 GB
    BUSINESS_MAX_FILE_SIZE_BYTES: int = 5368709120    # 5 GB

    model_config = SettingsConfigDict(
        env_file=env_files,
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
