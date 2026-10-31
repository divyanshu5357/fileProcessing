from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import List

from backend.app.core.security import get_current_user, AuthenticatedUser
from backend.app.database.connection import get_db
from backend.app.database.models import ProcessingJob
from backend.app.schemas.job_schemas import JobResponse
from backend.app.core.exceptions import ResourceNotFoundException, ForbiddenFileAccessException

router = APIRouter(prefix="/jobs", tags=["jobs"])

@router.get("", response_model=List[JobResponse])
async def list_jobs(
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if db is None:
        return []
    stmt = (
        select(ProcessingJob)
        .where(ProcessingJob.user_id == current_user.user_id)
        .order_by(desc(ProcessingJob.created_at))
        .limit(50)
    )
    res = await db.execute(stmt)
    return res.scalars().all()

@router.get("/{job_id}", response_model=JobResponse)
async def get_job_status(
    job_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if db is None:
        raise ResourceNotFoundException("Job not found")

    stmt = select(ProcessingJob).where(ProcessingJob.id == job_id)
    res = await db.execute(stmt)
    job = res.scalar_one_or_none()
    if not job:
        raise ResourceNotFoundException("Job not found")
    if job.user_id != current_user.user_id:
        raise ForbiddenFileAccessException()

    return job
