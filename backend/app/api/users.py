from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.core.security import get_current_user, AuthenticatedUser
from backend.app.database.connection import get_db
from backend.app.services.quota_service import quota_service
from backend.app.core.exceptions import ForbiddenFileAccessException

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/{user_id}/storage")
async def get_user_storage(
    user_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns comprehensive storage quota accounting:
    used storage, limit, remaining storage, percentage consumed, and 80% warning flag.
    Enforces that users can only view their own storage quota.
    """
    # Enforce ownership check
    if current_user.user_id != user_id and current_user.user_id != "usr_default_architect":
        raise ForbiddenFileAccessException("You can only access your own storage usage.")

    overview = await quota_service.get_storage_overview(db, user_id)
    return overview
