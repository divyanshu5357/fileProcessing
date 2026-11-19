from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from backend.app.database.models import StorageUsage, Subscription, Plan
from backend.app.core.exceptions import QuotaExceededException, FileSizeLimitException
from backend.app.core.config import settings
import logging
from typing import Tuple, Optional

logger = logging.getLogger("gyanvatsala.quota")

# Default fallback values (matching database plans)
PLAN_DEFAULTS = {
    "free": {
        "name": "Free",
        "storage_limit_bytes": 15728640,   # 15 MB
        "max_file_size_bytes": 15728640,   # 15 MB
        "retention_days": 7
    },
    "prime": {
        "name": "Prime",
        "storage_limit_bytes": 52428800,   # 50 MB
        "max_file_size_bytes": 26214400,   # 25 MB
        "retention_days": 14
    },
    "prime_plus": {
        "name": "PrimePlus",
        "storage_limit_bytes": 104857600,  # 100 MB
        "max_file_size_bytes": 52428800,   # 50 MB
        "retention_days": 30
    },
    "prime_ultra": {
        "name": "PrimeUltra",
        "storage_limit_bytes": 524288000,  # 500 MB
        "max_file_size_bytes": 104857600,  # 100 MB
        "retention_days": 365
    }
}

class QuotaService:
    async def get_user_plan_config(
        self,
        db: Optional[AsyncSession],
        user_id: str,
        plan_hint: str = "Free"
    ) -> Tuple[str, int, int, int]:
        """
        Database-driven plan resolution:
        Fetches the user's active subscription and corresponding plan configuration from PostgreSQL.
        Returns: (plan_name, storage_limit_bytes, max_file_size_bytes, retention_days)
        """
        if db is not None:
            try:
                # 1. Fetch user's active subscription
                sub_stmt = select(Subscription).where(
                    Subscription.user_id == user_id,
                    Subscription.subscription_status == "active"
                )
                sub_res = await db.execute(sub_stmt)
                sub = sub_res.scalar_one_or_none()

                plan_slug = (sub.plan_id or sub.plan_name or plan_hint or "free").lower().replace(" ", "_").replace("-", "_") if sub else plan_hint.lower().replace(" ", "_").replace("-", "_")
                if plan_slug == "primeplus":
                    plan_slug = "prime_plus"
                elif plan_slug == "primeultra":
                    plan_slug = "prime_ultra"

                # 2. Query Plan from database
                plan_stmt = select(Plan).where(Plan.slug == plan_slug)
                plan_res = await db.execute(plan_stmt)
                db_plan = plan_res.scalar_one_or_none()

                if db_plan:
                    return (
                        db_plan.name,
                        db_plan.storage_limit_bytes,
                        db_plan.max_file_size_bytes,
                        db_plan.retention_days
                    )
            except Exception as e:
                logger.warning(f"Error fetching DB plan for {user_id}: {e}")

        # Fallback to defaults based on plan_hint
        plan_key = (plan_hint or "free").lower().replace(" ", "_").replace("-", "_")
        if plan_key == "primeplus":
            plan_key = "prime_plus"
        elif plan_key == "primeultra":
            plan_key = "prime_ultra"
        default = PLAN_DEFAULTS.get(plan_key, PLAN_DEFAULTS["free"])
        return (
            default["name"],
            default["storage_limit_bytes"],
            default["max_file_size_bytes"],
            default["retention_days"]
        )

    async def verify_upload_quota(
        self,
        db: Optional[AsyncSession],
        user_id: str,
        file_size: int,
        plan: str = "Free"
    ) -> bool:
        """
        Validates that a single file does not exceed max file size,
        and that cumulative storage will not breach the user's plan quota.
        Uses database-driven plan parameters.
        """
        plan_name, max_storage, max_file, retention_days = await self.get_user_plan_config(db, user_id, plan_hint=plan)

        if file_size > max_file:
            raise FileSizeLimitException(
                f"File size of {file_size / (1024*1024):.2f}MB exceeds the {plan_name} plan limit of {max_file / (1024*1024):.1f}MB."
            )

        if db is None:
            return True

        # Query current storage usage in Neon with row-level locking
        stmt = select(StorageUsage).where(StorageUsage.user_id == user_id).with_for_update()
        result = await db.execute(stmt)
        usage = result.scalar_one_or_none()

        current_used = usage.total_storage_used if usage else 0
        if current_used + file_size > max_storage:
            remaining_bytes = max(0, max_storage - current_used)
            raise QuotaExceededException(
                f"Storage limit reached. You are using {current_used / (1024*1024):.2f}MB of {max_storage / (1024*1024):.1f}MB. "
                f"Remaining: {remaining_bytes / (1024*1024):.2f}MB."
            )

        return True

    async def record_upload_atomic(
        self,
        db: Optional[AsyncSession],
        user_id: str,
        file_size: int
    ):
        """Atomically increments user storage and file count with transactional isolation."""
        if db is None:
            return

        stmt = select(StorageUsage).where(StorageUsage.user_id == user_id).with_for_update()
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
        db: Optional[AsyncSession],
        user_id: str,
        file_size: int
    ):
        """Atomically decrements user storage upon file deletion."""
        if db is None:
            return

        stmt = select(StorageUsage).where(StorageUsage.user_id == user_id).with_for_update()
        result = await db.execute(stmt)
        usage = result.scalar_one_or_none()

        if usage:
            usage.total_storage_used = max(0, usage.total_storage_used - file_size)
            usage.total_files = max(0, usage.total_files - 1)
            await db.commit()

    async def get_storage_overview(
        self,
        db: Optional[AsyncSession],
        user_id: str
    ) -> dict:
        """Returns comprehensive storage quota accounting."""
        plan_name, max_storage, max_file, retention_days = await self.get_user_plan_config(db, user_id)

        current_used = 0
        file_count = 0

        if db is not None:
            stmt = select(StorageUsage).where(StorageUsage.user_id == user_id)
            res = await db.execute(stmt)
            usage = res.scalar_one_or_none()
            if usage:
                current_used = usage.total_storage_used
                file_count = usage.total_files

        remaining_bytes = max(0, max_storage - current_used)
        percent_used = round((current_used / max_storage * 100), 1) if max_storage > 0 else 0
        is_warning_threshold = percent_used >= 80.0

        return {
            "usedBytes": current_used,
            "limitBytes": max_storage,
            "remainingBytes": remaining_bytes,
            "percentageUsed": percent_used,
            "isWarningThreshold": is_warning_threshold,
            "fileCount": file_count,
            "plan": plan_name,
            "retentionDays": retention_days,
            "maxFileSizeBytes": max_file
        }

quota_service = QuotaService()
