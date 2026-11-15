from fastapi import APIRouter, Depends, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone, timedelta
from typing import List

from backend.app.core.security import get_current_user, AuthenticatedUser
from backend.app.database.connection import get_db
from backend.app.database.models import File, DeletionLog
from backend.app.workers.cleanup_worker import run_retention_cleanup
from backend.app.schemas.file_schemas import FileResponse

router = APIRouter(prefix="/retention", tags=["retention"])

@router.post("/run-cleanup")
async def trigger_cleanup_job(db: AsyncSession = Depends(get_db)):
    """
    Triggers scheduled retention cleanup worker:
    1. Sends 48h and 24h expiration notifications
    2. Deletes expired files from cloud storage and database
    3. Writes audit trail to deletion_logs
    """
    summary = await run_retention_cleanup(db)
    return summary

@router.get("/expiring-soon", response_model=List[FileResponse])
async def get_expiring_soon_files(
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns files belonging to the authenticated user that expire within the next 48 hours.
    Allows dashboard to show clear expiration warnings and one-click download buttons.
    """
    if db is None:
        return []

    now = datetime.now(timezone.utc)
    in_48h = now + timedelta(days=2)

    stmt = select(File).where(
        File.user_id == current_user.user_id,
        File.deleted_at.is_(None),
        File.expires_at.is_not(None),
        File.expires_at <= in_48h,
        File.expires_at > now
    ).order_by(File.expires_at.asc())

    res = await db.execute(stmt)
    files = res.scalars().all()
    return files

@router.get("/deletion-logs")
async def get_user_deletion_logs(
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Returns audit trail logs of expired and deleted files for this user."""
    if db is None:
        return []

    stmt = select(DeletionLog).where(
        DeletionLog.user_id == current_user.user_id
    ).order_by(DeletionLog.created_at.desc()).limit(50)

    res = await db.execute(stmt)
    logs = res.scalars().all()
    return logs
