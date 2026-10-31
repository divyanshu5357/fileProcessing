from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
import uuid
from datetime import datetime, timezone

from backend.app.core.security import get_current_user, AuthenticatedUser
from backend.app.database.connection import get_db
from backend.app.database.models import ProcessingJob
from backend.app.schemas.job_schemas import JobCreateRequest, JobResponse
from backend.app.workers.tasks import process_pdf_task, process_image_task, process_ocr_task
import logging

logger = logging.getLogger("pixelkit.processing")
router = APIRouter(prefix="/processing", tags=["processing"])

@router.post("/queue", response_model=JobResponse)
async def queue_processing_job(
    payload: JobCreateRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Creates a new processing job in Neon PostgreSQL and dispatches it
    asynchronously to the Celery worker queue via Redis broker.
    The API returns immediately without blocking.
    """
    job_id = f"job_{uuid.uuid4().hex[:10]}"

    db_job = ProcessingJob(
        id=job_id,
        user_id=current_user.user_id,
        file_id=payload.file_id,
        operation=payload.operation,
        job_status="queued",
        progress=0,
        input_s3_key=payload.input_s3_key,
        created_at=datetime.now(timezone.utc)
    )

    if db is not None:
        db.add(db_job)
        await db.commit()

    # Dispatch to appropriate Celery queue
    try:
        op = payload.operation.lower()
        if "ocr" in op:
            process_ocr_task.delay(job_id, current_user.user_id, payload.input_s3_key)
        elif any(img in op for img in ["image", "webp", "jpg", "png", "resize", "compress-image"]):
            process_image_task.delay(job_id, current_user.user_id, payload.input_s3_key, payload.operation)
        else:
            # Default to PDF Queue (e.g. compress-pdf, merge-pdf, office-to-pdf)
            process_pdf_task.delay(job_id, current_user.user_id, payload.input_s3_key, payload.operation)
    except Exception as e:
        logger.warning(f"Celery Redis broker fallback in local dev: {e}")

    return JobResponse(
        id=job_id,
        user_id=current_user.user_id,
        file_id=payload.file_id,
        operation=payload.operation,
        job_status="queued",
        progress=0,
        input_s3_key=payload.input_s3_key,
        output_s3_key=None,
        created_at=datetime.now(timezone.utc)
    )
