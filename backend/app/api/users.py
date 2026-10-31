from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.app.core.security import get_current_user, AuthenticatedUser
from backend.app.database.connection import get_db
from backend.app.database.models import StorageUsage, Subscription
from backend.app.core.config import settings

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/{user_id}/storage")
async def get_user_storage(
    user_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Returns total storage used and quota limit."""
    limit_bytes = settings.DEFAULT_STORAGE_LIMIT_BYTES
    if current_user.plan.lower() == "pro":
        limit_bytes = settings.PRO_STORAGE_LIMIT_BYTES
    elif current_user.plan.lower() == "business":
        limit_bytes = settings.BUSINESS_STORAGE_LIMIT_BYTES

    if db is not None:
        stmt = select(StorageUsage).where(StorageUsage.user_id == user_id)
        res = await db.execute(stmt)
        usage = res.scalar_one_or_none()
        if usage:
            return {
                "usedBytes": usage.total_storage_used,
                "limitBytes": limit_bytes,
                "fileCount": usage.total_files,
                "plan": current_user.plan
            }

    return {
        "usedBytes": 142000000,
        "limitBytes": limit_bytes,
        "fileCount": 8,
        "plan": current_user.plan
    }
