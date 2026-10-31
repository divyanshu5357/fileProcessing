from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from backend.app.database.models import StorageUsage, Subscription
from backend.app.core.exceptions import QuotaExceededException, FileSizeLimitException
from backend.app.core.config import settings
import logging

logger = logging.getLogger("pixelkit.quota")

class QuotaService:
    async def verify_upload_quota(
        self,
        db: AsyncSession,
        user_id: str,
        file_size: int,
        plan: str = "Free"
    ) -> bool:
        """
        Validates that a single file does not exceed max file size,
        and that the user's cumulative storage will not breach plan quota.
        """
        # Determine plan limits
        if plan.lower() == "pro":
            max_file = settings.PRO_MAX_FILE_SIZE_BYTES
            max_storage = settings.PRO_STORAGE_LIMIT_BYTES
        elif plan.lower() == "business":
            max_file = settings.BUSINESS_MAX_FILE_SIZE_BYTES
            max_storage = settings.BUSINESS_STORAGE_LIMIT_BYTES
        else:
            max_file = settings.DEFAULT_MAX_FILE_SIZE_BYTES
            max_storage = settings.DEFAULT_STORAGE_LIMIT_BYTES

        if file_size > max_file:
            raise FileSizeLimitException(
                f"File size of {file_size / (1024*1024):.1f}MB exceeds the {plan} plan limit of {max_file / (1024*1024):.0f}MB."
            )

        if db is None:
            return True

        # Query current storage usage in Neon
        stmt = select(StorageUsage).where(StorageUsage.user_id == user_id)
        result = await db.execute(stmt)
        usage = result.scalar_one_or_none()

        current_used = usage.total_storage_used if usage else 0
        if current_used + file_size > max_storage:
            raise QuotaExceededException(
                f"Storage limit reached. You are using {current_used / (1024*1024):.1f}MB of {max_storage / (1024*1024):.0f}MB."
            )

        return True

    async def record_upload_atomic(
        self,
        db: AsyncSession,
        user_id: str,
        file_size: int
    ):
        """Atomically increments user storage and file count."""
        if db is None:
            return

        stmt = select(StorageUsage).where(StorageUsage.user_id == user_id)
        result = await db.execute(stmt)
        usage = result.scalar_one_or_none()

        if usage:
            usage.total_storage_used += file_size
            usage.total_files += 1
        else:
            usage = StorageUsage(
                user_id=user_id,
                total_storage_used=file_size,
                total_files=1
            )
            db.add(usage)
        await db.commit()

    async def record_deletion_atomic(
        self,
        db: AsyncSession,
        user_id: str,
        file_size: int
    ):
        """Atomically decrements user storage upon file deletion."""
        if db is None:
            return

        stmt = select(StorageUsage).where(StorageUsage.user_id == user_id)
        result = await db.execute(stmt)
        usage = result.scalar_one_or_none()

        if usage:
            usage.total_storage_used = max(0, usage.total_storage_used - file_size)
            usage.total_files = max(0, usage.total_files - 1)
            await db.commit()

quota_service = QuotaService()
