from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
import uuid
from backend.app.core.security import get_current_user, AuthenticatedUser
from backend.app.database.connection import get_db
from backend.app.database.models import File
from backend.app.services.s3_service import s3_service
from backend.app.services.quota_service import quota_service
from backend.app.schemas.file_schemas import (
    UploadInitiateRequest,
    UploadInitiateResponse,
    MultipartPartUrlRequest,
    MultipartPartUrlResponse,
    MultipartCompleteRequest,
    FileResponse,
)

router = APIRouter(prefix="/uploads", tags=["uploads"])

@router.post("/initiate", response_model=UploadInitiateResponse)
async def initiate_upload(
    payload: UploadInitiateRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Initiates direct browser-to-S3 upload session.
    Verifies user storage quota and maximum file size prior to issuing presigned S3 URLs.
    """
    # 1. Quota Check
    await quota_service.verify_upload_quota(
        db=db,
        user_id=current_user.user_id,
        file_size=payload.file_size,
        plan=current_user.plan
    )

    file_id = f"fil_{uuid.uuid4().hex[:12]}"
    s3_key = s3_service.generate_s3_key(
        user_id=current_user.user_id,
        file_id=file_id,
        file_name=payload.file_name,
        folder="originals"
    )

    # 2. Decide between Multipart Upload (large files > 25MB) or Single PUT URL
    is_multipart = payload.is_multipart or (payload.file_size > 25 * 1024 * 1024)

    if is_multipart:
        upload_id = s3_service.create_multipart_upload(s3_key, payload.content_type)
        return UploadInitiateResponse(
            file_id=file_id,
            s3_key=s3_key,
            upload_id=upload_id,
            is_multipart=True,
            part_size=5 * 1024 * 1024
        )
    else:
        upload_url = s3_service.generate_presigned_upload_url(s3_key, payload.content_type)
        return UploadInitiateResponse(
            file_id=file_id,
            s3_key=s3_key,
            upload_url=upload_url,
            is_multipart=False
        )

@router.post("/multipart/part-url", response_model=MultipartPartUrlResponse)
async def get_multipart_part_url(
    payload: MultipartPartUrlRequest,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """Returns an authorized presigned URL for a specific chunk in a multipart upload."""
    part_url = s3_service.generate_presigned_part_url(
        s3_key=payload.s3_key,
        upload_id=payload.upload_id,
        part_number=payload.part_number
    )
    return MultipartPartUrlResponse(
        part_number=payload.part_number,
        part_url=part_url
    )

@router.post("/multipart/complete")
async def complete_multipart(
    payload: MultipartCompleteRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Finalizes multipart upload by notifying AWS S3 to assemble the chunks.
    Saves file metadata in Neon PostgreSQL and atomically increments storage usage.
    """
    parts_data = [{"PartNumber": p.PartNumber, "ETag": p.ETag} for p in payload.parts]
    s3_service.complete_multipart_upload(
        s3_key=payload.s3_key,
        upload_id=payload.upload_id,
        parts=parts_data
    )

    ext = payload.original_name.split(".")[-1].lower() if "." in payload.original_name else "bin"

    if db is not None:
        db_file = File(
            id=payload.file_id,
            user_id=current_user.user_id,
            folder_id=payload.folder_id,
            original_name=payload.original_name,
            stored_name=payload.original_name,
            mime_type=payload.content_type,
            file_extension=ext,
            file_size=payload.file_size,
            s3_key=payload.s3_key,
            status="ready"
        )
        db.add(db_file)
        await db.commit()

        # Update quota accounting
        await quota_service.record_upload_atomic(
            db=db,
            user_id=current_user.user_id,
            file_size=payload.file_size
        )

    return {"status": "success", "file_id": payload.file_id, "message": "File ready in S3"}
