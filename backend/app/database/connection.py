from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from backend.app.core.config import settings
import logging

logger = logging.getLogger("pixelkit.db")

Base = declarative_base()

# Neon pooled async engine
# Note: In SQLite or fallback mode, connect_args are adjusted
db_url = settings.DATABASE_URL
if db_url.startswith("postgresql://"):
    db_url = db_url.replace("postgresql://", "postgresql+asyncpg://")

connect_args = {}
if "sslmode=require" in db_url:
    # asyncpg expects ssl in connection args
    db_url = db_url.replace("?sslmode=require&pgbouncer=true", "")
    db_url = db_url.replace("?sslmode=require", "")
    connect_args["ssl"] = True

try:
    engine = create_async_engine(
        db_url,
        pool_size=10,
        max_overflow=20,
        pool_pre_ping=True,
        echo=False,
        connect_args=connect_args
    )
    AsyncSessionLocal = async_sessionmaker(
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autoflush=False
    )
except Exception as e:
    logger.warning(f"Could not initialize asyncpg engine with {db_url}: {e}")
    engine = None
    AsyncSessionLocal = None

async def get_db():
    if AsyncSessionLocal is None:
        yield None
        return
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
